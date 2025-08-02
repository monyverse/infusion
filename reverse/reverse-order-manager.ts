import { OrderType, OrderStatus, Order } from '../order-manager';
import { BitcoinHTLCScripts, BitcoinHTLCUtils } from '../btc/scripts/htlc-scripts';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Reverse order interface for BTC→EVM swaps
 */
export interface ReverseOrder extends Order {
  bitcoinHTLC?: {
    address: string;
    script: string;
    txHash?: string;
    utxo?: {
      txid: string;
      vout: number;
      value: number;
    };
  };
  evmEscrow?: {
    address: string;
    txHash?: string;
  };
}

/**
 * Reverse Order Manager for BTC→EVM atomic swaps
 * Based on HTLC implementation
 */
export class ReverseOrderManager {
  private ordersDir: string;
  private htlcScripts: BitcoinHTLCScripts;

  constructor(ordersDir: string = './reverse-orders', network: 'mainnet' | 'testnet' = 'testnet') {
    this.ordersDir = ordersDir;
    this.htlcScripts = new BitcoinHTLCScripts(network);
    this.ensureOrdersDirectory();
  }

  /**
   * Ensure orders directory exists
   */
  private ensureOrdersDirectory(): void {
    if (!fs.existsSync(this.ordersDir)) {
      fs.mkdirSync(this.ordersDir, { recursive: true });
    }
  }

  /**
   * Create a reverse order (BTC→EVM)
   * @param maker Maker details (Bitcoin side)
   * @param taker Taker details (EVM side)
   * @param timelock Timelock configuration
   */
  createReverseOrder(
    maker: {
      address: string;
      chain: string;
      token: string;
      amount: string;
    },
    taker: {
      address: string;
      chain: string;
      token: string;
      amount: string;
    },
    timelock: {
      withdrawalPeriod: number;
      cancellationPeriod: number;
    }
  ): ReverseOrder {
    const orderId = this.generateOrderId();
    const { secret, hashlock } = this.htlcScripts.generateSecretAndHashlock();
    
    const now = Date.now();
    const order: ReverseOrder = {
      id: orderId,
      type: OrderType.BTC_TO_EVM,
      status: OrderStatus.CREATED,
      maker,
      taker,
      hashlock: hashlock.toString('hex'),
      secret: secret.toString('hex'),
      timelock,
      createdAt: now,
      updatedAt: now,
      expiresAt: now + (timelock.cancellationPeriod * 1000)
    };

    this.saveOrder(order);
    return order;
  }

  /**
   * Get reverse order by ID
   * @param orderId Order ID
   */
  getReverseOrder(orderId: string): ReverseOrder | null {
    const orderPath = path.join(this.ordersDir, `${orderId}.json`);
    
    if (!fs.existsSync(orderPath)) {
      return null;
    }

    try {
      const orderData = fs.readFileSync(orderPath, 'utf8');
      return JSON.parse(orderData) as ReverseOrder;
    } catch (error) {
      console.error(`Error reading reverse order ${orderId}:`, error);
      return null;
    }
  }

  /**
   * Update reverse order
   * @param orderId Order ID
   * @param status New status
   * @param additionalData Additional data to update
   */
  updateReverseOrder(orderId: string, status: OrderStatus, additionalData?: Partial<ReverseOrder>): boolean {
    const order = this.getReverseOrder(orderId);
    if (!order) {
      return false;
    }

    order.status = status;
    order.updatedAt = Date.now();

    if (additionalData) {
      Object.assign(order, additionalData);
    }

    this.saveOrder(order);
    return true;
  }

  /**
   * Create Bitcoin HTLC for reverse order
   * @param orderId Order ID
   * @param recipientPubKey Recipient's public key (EVM taker)
   * @param senderPubKey Sender's public key (Bitcoin maker)
   */
  createBitcoinHTLC(
    orderId: string,
    recipientPubKey: Buffer,
    senderPubKey: Buffer
  ): { address: string; script: string } | null {
    const order = this.getReverseOrder(orderId);
    if (!order || order.type !== OrderType.BTC_TO_EVM) {
      return null;
    }

    const hashlock = Buffer.from(order.hashlock, 'hex');
    const locktime = Math.floor(order.expiresAt / 1000);
    
    const address = this.htlcScripts.generateHTLCAddress(
      hashlock,
      recipientPubKey,
      senderPubKey,
      locktime
    );

    const script = this.htlcScripts.generateHTLCScript(
      hashlock,
      recipientPubKey,
      senderPubKey,
      locktime
    );

    // Update order with Bitcoin HTLC info
    this.updateReverseOrder(orderId, OrderStatus.CREATED, {
      bitcoinHTLC: {
        address,
        script
      }
    });

    return { address, script };
  }

  /**
   * Fund Bitcoin HTLC
   * @param orderId Order ID
   * @param txHash Bitcoin transaction hash
   * @param utxo UTXO information
   */
  fundBitcoinHTLC(
    orderId: string,
    txHash: string,
    utxo: {
      txid: string;
      vout: number;
      value: number;
    }
  ): boolean {
    const order = this.getReverseOrder(orderId);
    if (!order || !order.bitcoinHTLC) {
      return false;
    }

    return this.updateReverseOrder(orderId, OrderStatus.FUNDED, {
      bitcoinHTLC: {
        ...order.bitcoinHTLC,
        txHash,
        utxo
      }
    });
  }

  /**
   * Create EVM escrow for reverse order
   * @param orderId Order ID
   * @param escrowAddress EVM escrow contract address
   * @param txHash EVM transaction hash
   */
  createEVMEscrow(
    orderId: string,
    escrowAddress: string,
    txHash: string
  ): boolean {
    const order = this.getReverseOrder(orderId);
    if (!order) {
      return false;
    }

    return this.updateReverseOrder(orderId, OrderStatus.ESCROWED, {
      evmEscrow: {
        address: escrowAddress,
        txHash
      }
    });
  }

  /**
   * Claim Bitcoin HTLC (reveal secret)
   * @param orderId Order ID
   * @param recipientAddress Recipient address
   * @param recipientPubKey Recipient public key
   * @param senderPubKey Sender public key
   * @param fee Fee in satoshis
   */
  claimBitcoinHTLC(
    orderId: string,
    recipientAddress: string,
    recipientPubKey: Buffer,
    senderPubKey: Buffer,
    fee: number = 1000
  ) {
    const order = this.getReverseOrder(orderId);
    if (!order || !order.bitcoinHTLC?.utxo || !order.secret) {
      throw new Error('Order not found or missing required data');
    }

    const withdrawalData = this.htlcScripts.createWithdrawalTransactionData(
      order.bitcoinHTLC.utxo,
      recipientAddress,
      BitcoinHTLCUtils.btcToSatoshis(parseFloat(order.taker.amount)),
      Buffer.from(order.secret, 'hex'),
      Buffer.from(order.hashlock, 'hex'),
      recipientPubKey,
      senderPubKey,
      Math.floor(order.expiresAt / 1000),
      fee
    );

    // Update order status
    this.updateReverseOrder(orderId, OrderStatus.CLAIMED);

    return withdrawalData;
  }

  /**
   * Refund Bitcoin HTLC (after timeout)
   * @param orderId Order ID
   * @param senderAddress Sender address for refund
   * @param recipientPubKey Recipient public key
   * @param senderPubKey Sender public key
   * @param fee Fee in satoshis
   */
  refundBitcoinHTLC(
    orderId: string,
    senderAddress: string,
    recipientPubKey: Buffer,
    senderPubKey: Buffer,
    fee: number = 1000
  ) {
    const order = this.getReverseOrder(orderId);
    if (!order || !order.bitcoinHTLC?.utxo) {
      throw new Error('Order not found or missing required data');
    }

    const refundData = this.htlcScripts.createRefundTransactionData(
      order.bitcoinHTLC.utxo,
      senderAddress,
      BitcoinHTLCUtils.btcToSatoshis(parseFloat(order.maker.amount)),
      Buffer.from(order.hashlock, 'hex'),
      recipientPubKey,
      senderPubKey,
      Math.floor(order.expiresAt / 1000),
      fee
    );

    // Update order status
    this.updateReverseOrder(orderId, OrderStatus.CANCELLED);

    return refundData;
  }

  /**
   * Claim EVM escrow using revealed secret
   * @param orderId Order ID
   * @param secret Secret revealed from Bitcoin HTLC
   */
  claimEVMEscrow(orderId: string, secret: string): boolean {
    const order = this.getReverseOrder(orderId);
    if (!order || !order.evmEscrow) {
      return false;
    }

    // Verify secret matches hashlock
    const secretBuffer = Buffer.from(secret, 'hex');
    const hashlock = crypto.createHash('sha256').update(secretBuffer).digest();
    
    if (hashlock.toString('hex') !== order.hashlock) {
      throw new Error('Invalid secret');
    }

    // Update order with revealed secret
    return this.updateReverseOrder(orderId, OrderStatus.CLAIMED, {
      secret
    });
  }

  /**
   * List reverse orders
   * @param filter Optional filter
   */
  listReverseOrders(filter?: { status?: OrderStatus }): ReverseOrder[] {
    const orders: ReverseOrder[] = [];
    
    if (!fs.existsSync(this.ordersDir)) {
      return orders;
    }

    const files = fs.readdirSync(this.ordersDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const orderData = fs.readFileSync(path.join(this.ordersDir, file), 'utf8');
          const order = JSON.parse(orderData) as ReverseOrder;
          
          if (filter) {
            if (filter.status && order.status !== filter.status) continue;
          }
          
          orders.push(order);
        } catch (error) {
          console.error(`Error reading reverse order file ${file}:`, error);
        }
      }
    }

    return orders.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get reverse order statistics
   */
  getReverseOrderStats(): {
    total: number;
    byStatus: Record<OrderStatus, number>;
    funded: number;
    escrowed: number;
    claimed: number;
  } {
    const orders = this.listReverseOrders();
    const stats = {
      total: orders.length,
      byStatus: {} as Record<OrderStatus, number>,
      funded: 0,
      escrowed: 0,
      claimed: 0
    };

    // Initialize counters
    Object.values(OrderStatus).forEach(status => {
      stats.byStatus[status] = 0;
    });

    // Count orders
    for (const order of orders) {
      stats.byStatus[order.status]++;
      
      if (order.bitcoinHTLC?.txHash) {
        stats.funded++;
      }
      
      if (order.evmEscrow?.address) {
        stats.escrowed++;
      }
      
      if (order.status === OrderStatus.CLAIMED) {
        stats.claimed++;
      }
    }

    return stats;
  }

  /**
   * Validate reverse order flow
   * @param orderId Order ID
   */
  validateReverseOrderFlow(orderId: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const order = this.getReverseOrder(orderId);
    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    if (!order) {
      result.isValid = false;
      result.errors.push('Order not found');
      return result;
    }

    if (order.type !== OrderType.BTC_TO_EVM) {
      result.isValid = false;
      result.errors.push('Order is not a reverse order');
      return result;
    }

    // Check required fields
    if (!order.hashlock) {
      result.isValid = false;
      result.errors.push('Missing hashlock');
    }

    if (!order.bitcoinHTLC?.address) {
      result.warnings.push('Bitcoin HTLC not created');
    }

    if (!order.bitcoinHTLC?.txHash) {
      result.warnings.push('Bitcoin HTLC not funded');
    }

    if (!order.evmEscrow?.address) {
      result.warnings.push('EVM escrow not created');
    }

    // Check timelock
    if (order.expiresAt < Date.now()) {
      result.warnings.push('Order has expired');
    }

    return result;
  }

  /**
   * Save reverse order to file
   * @param order Order to save
   */
  private saveOrder(order: ReverseOrder): void {
    const orderPath = path.join(this.ordersDir, `${order.id}.json`);
    fs.writeFileSync(orderPath, JSON.stringify(order, null, 2));
  }

  /**
   * Generate unique order ID
   */
  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `reverse_order_${timestamp}_${random}`;
  }
} 