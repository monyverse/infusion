import * as crypto from 'crypto';

/**
 * Bitcoin Transaction Builder
 * Based on hashlocked-cli implementation
 */
export class BitcoinTransactionBuilder {
  private network: 'mainnet' | 'testnet';

  constructor(network: 'mainnet' | 'testnet' = 'testnet') {
    this.network = network;
  }

  /**
   * Build a raw transaction
   */
  buildRawTransaction(
    inputs: Array<{
      txid: string;
      vout: number;
      scriptSig?: string;
      sequence?: number;
    }>,
    outputs: Array<{
      address: string;
      value: number;
    }>,
    locktime: number = 0
  ): string {
    // Build transaction in hex format
    let tx = '';
    
    // Version
    tx += this.toHex(2, 0x01000000);
    
    // Input count
    tx += this.toVarInt(inputs.length);
    
    // Inputs
    for (const input of inputs) {
      tx += this.reverseHex(input.txid); // Reverse txid
      tx += this.toHex(4, input.vout);
      tx += input.scriptSig ? this.toVarString(input.scriptSig) : '00';
      tx += this.toHex(4, input.sequence || 0xffffffff);
    }
    
    // Output count
    tx += this.toVarInt(outputs.length);
    
    // Outputs
    for (const output of outputs) {
      tx += this.toHex(8, output.value);
      const scriptPubKey = this.addressToScriptPubKey(output.address);
      tx += this.toVarString(scriptPubKey);
    }
    
    // Locktime
    tx += this.toHex(4, locktime);
    
    return tx;
  }

  /**
   * Sign transaction
   */
  signTransaction(
    rawTx: string,
    privateKey: Buffer,
    inputs: Array<{
      txid: string;
      vout: number;
      scriptPubKey: string;
      value: number;
    }>,
    sighashType: number = 0x01
  ): string {
    // Simplified transaction signing
    // In production, use proper Bitcoin transaction signing
    
    let signedTx = rawTx;
    
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const hash = this.calculateSignatureHash(rawTx, i, input.scriptPubKey, input.value, sighashType);
      const signature = this.signHash(hash, privateKey);
      
      // Add signature to transaction
      const scriptSig = this.createScriptSig(signature, sighashType);
      signedTx = this.updateScriptSig(signedTx, i, scriptSig);
    }
    
    return signedTx;
  }

  /**
   * Create witness transaction
   */
  createWitnessTransaction(
    inputs: Array<{
      txid: string;
      vout: number;
      witness: string[];
    }>,
    outputs: Array<{
      address: string;
      value: number;
    }>,
    locktime: number = 0
  ): string {
    // Build witness transaction
    let tx = '';
    
    // Version
    tx += this.toHex(4, 0x01000000);
    
    // Marker and flag for witness
    tx += '0001';
    
    // Input count
    tx += this.toVarInt(inputs.length);
    
    // Inputs
    for (const input of inputs) {
      tx += this.reverseHex(input.txid);
      tx += this.toHex(4, input.vout);
      tx += '00'; // Empty scriptSig
      tx += this.toHex(4, 0xffffffff);
    }
    
    // Output count
    tx += this.toVarInt(outputs.length);
    
    // Outputs
    for (const output of outputs) {
      tx += this.toHex(8, output.value);
      const scriptPubKey = this.addressToScriptPubKey(output.address);
      tx += this.toVarString(scriptPubKey);
    }
    
    // Witness data
    for (const input of inputs) {
      tx += this.toVarInt(input.witness.length);
      for (const witnessItem of input.witness) {
        tx += this.toVarString(witnessItem);
      }
    }
    
    // Locktime
    tx += this.toHex(4, locktime);
    
    return tx;
  }

  /**
   * Calculate transaction ID
   */
  calculateTxId(rawTx: string): string {
    const hash = crypto.createHash('sha256').update(Buffer.from(rawTx, 'hex')).digest();
    const doubleHash = crypto.createHash('sha256').update(hash).digest();
    return this.reverseHex(doubleHash.toString('hex'));
  }

  /**
   * Convert address to scriptPubKey
   */
  private addressToScriptPubKey(address: string): string {
    // Simplified address to scriptPubKey conversion
    // In production, use proper address parsing
    
    if (address.startsWith('bc1') || address.startsWith('tb1')) {
      // P2WPKH or P2WSH
      return '0014' + this.addressToHash160(address).toString('hex');
    } else {
      // Legacy P2PKH
      return '76a914' + this.addressToHash160(address).toString('hex') + '88ac';
    }
  }

  /**
   * Convert address to hash160
   */
  private addressToHash160(address: string): Buffer {
    // Simplified address decoding
    // In production, use proper address decoding
    const decoded = this.decodeAddress(address);
    return crypto.createHash('ripemd160').update(decoded).digest();
  }

  /**
   * Decode address
   */
  private decodeAddress(address: string): Buffer {
    // Simplified address decoding
    // In production, use proper Bech32 or Base58 decoding
    return Buffer.from(address, 'utf8');
  }

  /**
   * Calculate signature hash
   */
  private calculateSignatureHash(
    rawTx: string,
    inputIndex: number,
    scriptPubKey: string,
    value: number,
    sighashType: number
  ): Buffer {
    // Simplified signature hash calculation
    // In production, use proper Bitcoin signature hash calculation
    
    const data = rawTx + scriptPubKey + this.toHex(8, value) + this.toHex(4, sighashType);
    return crypto.createHash('sha256').update(Buffer.from(data, 'hex')).digest();
  }

  /**
   * Sign hash with private key
   */
  private signHash(hash: Buffer, privateKey: Buffer): Buffer {
    // Simplified ECDSA signing
    // In production, use proper ECDSA signing with secp256k1
    
    const signature = crypto.createSign('RSA-SHA256').update(hash).sign(privateKey);
    return signature;
  }

  /**
   * Create script signature
   */
  private createScriptSig(signature: Buffer, sighashType: number): string {
    const sigWithHash = signature.toString('hex') + this.toHex(1, sighashType);
    return this.toVarString(sigWithHash);
  }

  /**
   * Update script signature in transaction
   */
  private updateScriptSig(rawTx: string, inputIndex: number, scriptSig: string): string {
    // Simplified script signature update
    // In production, properly parse and update the transaction
    return rawTx; // Placeholder
  }

  /**
   * Convert number to hex
   */
  private toHex(bytes: number, value: number): string {
    return value.toString(16).padStart(bytes * 2, '0');
  }

  /**
   * Convert to variable length integer
   */
  private toVarInt(value: number): string {
    if (value < 0xfd) {
      return this.toHex(1, value);
    } else if (value <= 0xffff) {
      return 'fd' + this.toHex(2, value);
    } else if (value <= 0xffffffff) {
      return 'fe' + this.toHex(4, value);
    } else {
      return 'ff' + this.toHex(8, value);
    }
  }

  /**
   * Convert to variable length string
   */
  private toVarString(value: string): string {
    const length = value.length / 2; // Assuming hex string
    return this.toVarInt(length) + value;
  }

  /**
   * Reverse hex string
   */
  private reverseHex(hex: string): string {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.unshift(hex.substr(i, 2));
    }
    return bytes.join('');
  }
}

/**
 * Bitcoin Transaction Utilities
 */
export class BitcoinTransactionUtils {
  /**
   * Validate transaction hex
   */
  static validateTransactionHex(txHex: string): boolean {
    try {
      if (txHex.length % 2 !== 0) {
        return false;
      }
      
      // Check if it's valid hex
      Buffer.from(txHex, 'hex');
      
      // Basic length check
      if (txHex.length < 20) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Parse transaction hex
   */
  static parseTransaction(txHex: string): {
    version: number;
    inputs: Array<{
      txid: string;
      vout: number;
      scriptSig: string;
      sequence: number;
    }>;
    outputs: Array<{
      value: number;
      scriptPubKey: string;
    }>;
    locktime: number;
  } | null {
    try {
      // Simplified transaction parsing
      // In production, use proper Bitcoin transaction parsing
      
      const version = parseInt(txHex.substring(0, 8), 16);
      const locktime = parseInt(txHex.substring(txHex.length - 8), 16);
      
      return {
        version,
        inputs: [],
        outputs: [],
        locktime
      };
    } catch {
      return null;
    }
  }

  /**
   * Calculate transaction size
   */
  static calculateTransactionSize(txHex: string): number {
    return txHex.length / 2;
  }

  /**
   * Estimate transaction fee
   */
  static estimateTransactionFee(txSize: number, feeRate: number): number {
    return Math.ceil(txSize * feeRate);
  }
} 