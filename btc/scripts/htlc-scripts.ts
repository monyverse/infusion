import * as crypto from 'crypto';

/**
 * Bitcoin HTLC Script Generator
 * Based on hashlocked-cli implementation
 */
export class BitcoinHTLCScripts {
  private network: 'mainnet' | 'testnet';

  constructor(network: 'mainnet' | 'testnet' = 'testnet') {
    this.network = network;
  }

  /**
   * Generate HTLC script for Bitcoin
   * @param hashlock SHA256 hash of the secret
   * @param recipientPubKey Recipient's public key
   * @param senderPubKey Sender's public key
   * @param locktime Locktime in seconds
   */
  generateHTLCScript(
    hashlock: Buffer,
    recipientPubKey: Buffer,
    senderPubKey: Buffer,
    locktime: number
  ): string {
    // Create HTLC script in hex format
    const script = [
      'OP_IF',
      'OP_SHA256',
      hashlock.toString('hex'),
      'OP_EQUALVERIFY',
      recipientPubKey.toString('hex'),
      'OP_CHECKSIG',
      'OP_ELSE',
      locktime.toString(16),
      'OP_CHECKLOCKTIMEVERIFY',
      'OP_DROP',
      senderPubKey.toString('hex'),
      'OP_CHECKSIG',
      'OP_ENDIF'
    ].join(' ');

    return script;
  }

  /**
   * Generate HTLC address (P2WSH)
   * @param hashlock SHA256 hash of the secret
   * @param recipientPubKey Recipient's public key
   * @param senderPubKey Sender's public key
   * @param locktime Locktime in seconds
   */
  generateHTLCAddress(
    hashlock: Buffer,
    recipientPubKey: Buffer,
    senderPubKey: Buffer,
    locktime: number
  ): string {
    const script = this.generateHTLCScript(hashlock, recipientPubKey, senderPubKey, locktime);
    const scriptHash = crypto.createHash('sha256').update(script).digest();
    
    // Generate P2WSH address
    const version = this.network === 'testnet' ? 0x00 : 0x00; // Both mainnet and testnet use 0x00 for P2WSH
    const address = this.generateBech32Address(version, scriptHash);
    
    return address;
  }

  /**
   * Generate random secret and hashlock
   */
  generateSecretAndHashlock(): { secret: Buffer; hashlock: Buffer } {
    const secret = crypto.randomBytes(32);
    const hashlock = this.generateHashlock(secret);
    return { secret, hashlock };
  }

  /**
   * Generate hashlock from secret
   */
  generateHashlock(secret: Buffer): Buffer {
    return crypto.createHash('sha256').update(secret).digest();
  }

  /**
   * Verify HTLC script
   * @param script HTLC script to verify
   */
  verifyHTLCScript(script: string): boolean {
    try {
      const parts = script.split(' ');
      return parts.length === 13 && 
             parts[0] === 'OP_IF' &&
             parts[1] === 'OP_SHA256' &&
             parts[3] === 'OP_EQUALVERIFY' &&
             parts[5] === 'OP_CHECKSIG' &&
             parts[6] === 'OP_ELSE' &&
             parts[8] === 'OP_CHECKLOCKTIMEVERIFY' &&
             parts[9] === 'OP_DROP' &&
             parts[11] === 'OP_CHECKSIG' &&
             parts[12] === 'OP_ENDIF';
    } catch {
      return false;
    }
  }

  /**
   * Create withdrawal transaction data
   * @param utxo UTXO to spend
   * @param recipientAddress Recipient address
   * @param amount Amount to send
   * @param secret Secret for HTLC
   * @param hashlock Hashlock
   * @param recipientPubKey Recipient public key
   * @param senderPubKey Sender public key
   * @param locktime Locktime
   * @param fee Fee in satoshis
   */
  createWithdrawalTransactionData(
    utxo: {
      txid: string;
      vout: number;
      value: number;
    },
    recipientAddress: string,
    amount: number,
    secret: Buffer,
    hashlock: Buffer,
    recipientPubKey: Buffer,
    senderPubKey: Buffer,
    locktime: number,
    fee: number = 1000
  ): {
    inputTxid: string;
    inputVout: number;
    outputAddress: string;
    outputAmount: number;
    witness: string[];
  } {
    const script = this.generateHTLCScript(hashlock, recipientPubKey, senderPubKey, locktime);
    
    // Create witness for withdrawal (with secret)
    const witness = [
      secret.toString('hex'), // Secret
      script, // Redeem script
      '01' // Witness version
    ];

    return {
      inputTxid: utxo.txid,
      inputVout: utxo.vout,
      outputAddress: recipientAddress,
      outputAmount: amount - fee,
      witness
    };
  }

  /**
   * Create refund transaction data
   * @param utxo UTXO to spend
   * @param senderAddress Sender address
   * @param amount Amount to send
   * @param hashlock Hashlock
   * @param recipientPubKey Recipient public key
   * @param senderPubKey Sender public key
   * @param locktime Locktime
   * @param fee Fee in satoshis
   */
  createRefundTransactionData(
    utxo: {
      txid: string;
      vout: number;
      value: number;
    },
    senderAddress: string,
    amount: number,
    hashlock: Buffer,
    recipientPubKey: Buffer,
    senderPubKey: Buffer,
    locktime: number,
    fee: number = 1000
  ): {
    inputTxid: string;
    inputVout: number;
    outputAddress: string;
    outputAmount: number;
    witness: string[];
  } {
    const script = this.generateHTLCScript(hashlock, recipientPubKey, senderPubKey, locktime);
    
    // Create witness for refund (without secret)
    const witness = [
      '', // Empty (no secret)
      script, // Redeem script
      '01' // Witness version
    ];

    return {
      inputTxid: utxo.txid,
      inputVout: utxo.vout,
      outputAddress: senderAddress,
      outputAmount: amount - fee,
      witness
    };
  }

  /**
   * Generate Bech32 address
   */
  private generateBech32Address(version: number, hash: Buffer): string {
    // Simplified Bech32 address generation
    // In production, use a proper Bech32 library
    const prefix = this.network === 'testnet' ? 'tb' : 'bc';
    const data = [version, ...Array.from(hash)];
    const encoded = this.bech32Encode(prefix, data);
    return encoded || `${prefix}1${hash.toString('hex').substring(0, 40)}`;
  }

  /**
   * Simplified Bech32 encoding
   */
  private bech32Encode(prefix: string, data: number[]): string | null {
    // Simplified implementation - in production use a proper Bech32 library
    try {
      const checksum = this.calculateBech32Checksum(prefix, data);
      const combined = [...data, ...checksum];
      const encoded = this.base32Encode(combined);
      return `${prefix}1${encoded}`;
    } catch {
      return null;
    }
  }

  /**
   * Calculate Bech32 checksum
   */
  private calculateBech32Checksum(prefix: string, data: number[]): number[] {
    // Simplified checksum calculation
    // In production, use proper Bech32 checksum algorithm
    const combined = [...prefix.split('').map(c => c.charCodeAt(0)), ...data];
    const checksum = crypto.createHash('sha256').update(Buffer.from(combined)).digest();
    return Array.from(checksum.slice(0, 6));
  }

  /**
   * Base32 encoding
   */
  private base32Encode(data: number[]): string {
    const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
    let result = '';
    
    for (let i = 0; i < data.length; i++) {
      result += alphabet[data[i] % 32];
    }
    
    return result;
  }
}

/**
 * Bitcoin HTLC Utilities
 */
export class BitcoinHTLCUtils {
  /**
   * Convert satoshis to BTC
   */
  static satoshisToBTC(satoshis: number): number {
    return satoshis / 100000000;
  }

  /**
   * Convert BTC to satoshis
   */
  static btcToSatoshis(btc: number): number {
    return Math.floor(btc * 100000000);
  }

  /**
   * Calculate transaction fee
   */
  static calculateFee(inputCount: number, outputCount: number, feeRate: number = 10): number {
    // Simplified fee calculation
    // In production, use proper fee estimation
    const baseSize = 10; // Base transaction size
    const inputSize = 148; // P2WSH input size
    const outputSize = 34; // P2WPKH output size
    
    const totalSize = baseSize + (inputCount * inputSize) + (outputCount * outputSize);
    return Math.ceil(totalSize * feeRate);
  }

  /**
   * Validate Bitcoin address
   */
  static validateAddress(address: string, network: 'mainnet' | 'testnet' = 'testnet'): boolean {
    try {
      const prefix = address.substring(0, 2);
      const validPrefixes = network === 'testnet' ? ['tb', 'bc'] : ['bc'];
      
      if (!validPrefixes.includes(prefix)) {
        return false;
      }
      
      // Basic length validation
      if (address.length < 26 || address.length > 90) {
        return false;
      }
      
      // Check for valid characters
      const validChars = /^[a-km-zA-HJ-NP-Z1-9]*$/;
      return validChars.test(address.substring(2));
    } catch {
      return false;
    }
  }

  /**
   * Parse UTXO string (txid:vout)
   */
  static parseUTXO(utxoString: string): { txid: string; vout: number } | null {
    try {
      const [txid, vout] = utxoString.split(':');
      if (!txid || !vout) {
        return null;
      }
      
      return {
        txid,
        vout: parseInt(vout)
      };
    } catch {
      return null;
    }
  }

  /**
   * Format UTXO as string
   */
  static formatUTXO(txid: string, vout: number): string {
    return `${txid}:${vout}`;
  }
} 