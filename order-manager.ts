import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { BitcoinHTLCScripts, BitcoinHTLCUtils } from './btc/scripts/htlc-scripts';

/**
 * Order types for atomic swaps
 */
export enum OrderType {
  EVM_TO_BTC = 'evm_to_btc',
  BTC_TO_EVM = 'btc_to_evm'
}

/**
 * Order status
 */
export enum OrderStatus {
  CREATED = 'created',
  FILLED = 'filled',
  ESCROWED = 'escrowed',
  FUNDED = 'funded',
  CLAIMED = 'claimed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

/**
 * Order interface
 */
export interface Order {
  id: string;
  type: OrderType;
  status: OrderStatus;
  maker: {
    address: string;
    chain: string;
    token: string;
    amount: string;
  };
  taker: {
    address: string;
    chain: string;
    token: string;
    amount: string;
  };
  hashlock: string;
  secret?: string;
  timelock: {
    withdrawalPeriod: number;
    cancellationPeriod: number;
  };
  escrow?: {
    evmAddress?: string;
    bitcoinAddress?: string;
    txHash?: string;
  };
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

/**
 * Order Manager for atomic swaps
 * Based on HTLC implementation
 */
export class OrderManager {
  private ordersDir: string;
  private htlcScripts: BitcoinHTLCScripts;

  constructor(ordersDir: string = './orders', network: 'mainnet' | 'testnet' = 'testnet') {
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
   * Create a new order
   * @param type Order type
   * @param maker Maker details
   * @param taker Taker details
   * @param timelock Timelock configuration
   */
  createOrder(
    type: OrderType,
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
  ): Order {
    const orderId = this.generateOrderId();
    const { secret, hashlock } = this.htlcScripts.generateSecretAndHashlock();
    
    const now = Date.now();
    const order: Order = {
      id: orderId,
      type,
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
   * Get order by ID
   * @param orderId Order ID
   */
  getOrder(orderId: string): Order | null {
    const orderPath = path.join(this.ordersDir, `${orderId}.json`);
    
    if (!fs.existsSync(orderPath)) {
      return null;
    }

    try {
      const orderData = fs.readFileSync(orderPath, 'utf8');
      return JSON.parse(orderData) as Order;
    } catch (error) {
      console.error(`Error reading order ${orderId}:`, error);
      return null;
    }
  }

  /**
   * Update order status
   * @param orderId Order ID
   * @param status New status
   * @param additionalData Additional data to update
   */
  updateOrder(orderId: string, status: OrderStatus, additionalData?: Partial<Order>): boolean {
    const order = this.getOrder(orderId);
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
   * List all orders
   * @param filter Optional filter by status
   */
  listOrders(filter?: { status?: OrderStatus; type?: OrderType }): Order[] {
    const orders: Order[] = [];
    
    if (!fs.existsSync(this.ordersDir)) {
      return orders;
    }

    const files = fs.readdirSync(this.ordersDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const orderData = fs.readFileSync(path.join(this.ordersDir, file), 'utf8');
          const order = JSON.parse(orderData) as Order;
          
          if (filter) {
            if (filter.status && order.status !== filter.status) continue;
            if (filter.type && order.type !== filter.type) continue;
          }
          
          orders.push(order);
        } catch (error) {
          console.error(`Error reading order file ${file}:`, error);
        }
      }
    }

    return orders.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Delete order
   * @param orderId Order ID
   */
  deleteOrder(orderId: string): boolean {
    const orderPath = path.join(this.ordersDir, `${orderId}.json`);
    
    if (fs.existsSync(orderPath)) {
      fs.unlinkSync(orderPath);
      return true;
    }
    
    return false;
  }

  /**
   * Clean up expired orders
   */
  cleanupExpiredOrders(): number {
    const now = Date.now();
    const orders = this.listOrders();
    let cleanedCount = 0;

    for (const order of orders) {
      if (order.expiresAt < now && order.status !== OrderStatus.CLAIMED) {
        this.updateOrder(order.id, OrderStatus.EXPIRED);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Generate Bitcoin HTLC address for order
   * @param orderId Order ID
   * @param recipientPubKey Recipient public key
   * @param senderPubKey Sender public key
   */
  generateBitcoinHTLCAddress(
    orderId: string,
    recipientPubKey: Buffer,
    senderPubKey: Buffer
  ): string | null {
    const order = this.getOrder(orderId);
    if (!order) {
      return null;
    }

    const hashlock = Buffer.from(order.hashlock, 'hex');
    const locktime = Math.floor(order.expiresAt / 1000);
    
    return this.htlcScripts.generateHTLCAddress(
      hashlock,
      recipientPubKey,
      senderPubKey,
      locktime
    );
  }

  /**
   * Create withdrawal transaction data for Bitcoin HTLC
   * @param orderId Order ID
   * @param utxo UTXO to spend
   * @param recipientAddress Recipient address
   * @param recipientPubKey Recipient public key
   * @param senderPubKey Sender public key
   * @param fee Fee in satoshis
   */
  createBitcoinWithdrawalData(
    orderId: string,
    utxo: {
      txid: string;
      vout: number;
      value: number;
    },
    recipientAddress: string,
    recipientPubKey: Buffer,
    senderPubKey: Buffer,
    fee: number = 1000
  ) {
    const order = this.getOrder(orderId);
    if (!order || !order.secret) {
      throw new Error('Order not found or secret not available');
    }

    const hashlock = Buffer.from(order.hashlock, 'hex');
    const secret = Buffer.from(order.secret, 'hex');
    const locktime = Math.floor(order.expiresAt / 1000);
    const amount = BitcoinHTLCUtils.btcToSatoshis(parseFloat(order.taker.amount));

    return this.htlcScripts.createWithdrawalTransactionData(
      utxo,
      recipientAddress,
      amount,
      secret,
      hashlock,
      recipientPubKey,
      senderPubKey,
      locktime,
      fee
    );
  }

  /**
   * Create refund transaction data for Bitcoin HTLC
   * @param orderId Order ID
   * @param utxo UTXO to spend
   * @param senderAddress Sender address
   * @param recipientPubKey Recipient public key
   * @param senderPubKey Sender public key
   * @param fee Fee in satoshis
   */
  createBitcoinRefundData(
    orderId: string,
    utxo: {
      txid: string;
      vout: number;
      value: number;
    },
    senderAddress: string,
    recipientPubKey: Buffer,
    senderPubKey: Buffer,
    fee: number = 1000
  ) {
    const order = this.getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const hashlock = Buffer.from(order.hashlock, 'hex');
    const locktime = Math.floor(order.expiresAt / 1000);
    const amount = BitcoinHTLCUtils.btcToSatoshis(parseFloat(order.maker.amount));

    return this.htlcScripts.createRefundTransactionData(
      utxo,
      senderAddress,
      amount,
      hashlock,
      recipientPubKey,
      senderPubKey,
      locktime,
      fee
    );
  }

  /**
   * Save order to file
   * @param order Order to save
   */
  private saveOrder(order: Order): void {
    const orderPath = path.join(this.ordersDir, `${order.id}.json`);
    fs.writeFileSync(orderPath, JSON.stringify(order, null, 2));
  }

  /**
   * Generate unique order ID
   */
  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    return `order_${timestamp}_${random}`;
  }

  /**
   * Get order statistics
   */
  getOrderStats(): {
    total: number;
    byStatus: Record<OrderStatus, number>;
    byType: Record<OrderType, number>;
  } {
    const orders = this.listOrders();
    const stats = {
      total: orders.length,
      byStatus: {} as Record<OrderStatus, number>,
      byType: {} as Record<OrderType, number>
    };

    // Initialize counters
    Object.values(OrderStatus).forEach(status => {
      stats.byStatus[status] = 0;
    });
    Object.values(OrderType).forEach(type => {
      stats.byType[type] = 0;
    });

    // Count orders
    for (const order of orders) {
      stats.byStatus[order.status]++;
      stats.byType[order.type]++;
    }

    return stats;
  }
} 