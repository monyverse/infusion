import * as crypto from 'crypto';

/**
 * Bitcoin Key Manager
 * Based on hashlocked-cli implementation
 */
export class BitcoinKeyManager {
  private network: 'mainnet' | 'testnet';

  constructor(network: 'mainnet' | 'testnet' = 'testnet') {
    this.network = network;
  }

  /**
   * Generate Bitcoin key pair
   */
  generateKeyPair(): {
    privateKey: Buffer;
    publicKey: Buffer;
    address: string;
  } {
    // Generate private key
    const privateKey = crypto.randomBytes(32);
    
    // Generate public key (simplified)
    const publicKey = this.privateKeyToPublicKey(privateKey);
    
    // Generate address
    const address = this.publicKeyToAddress(publicKey);
    
    return {
      privateKey,
      publicKey,
      address
    };
  }

  /**
   * Import private key from WIF format
   */
  importPrivateKeyFromWIF(wif: string): {
    privateKey: Buffer;
    publicKey: Buffer;
    address: string;
  } | null {
    try {
      const privateKey = this.wifToPrivateKey(wif);
      const publicKey = this.privateKeyToPublicKey(privateKey);
      const address = this.publicKeyToAddress(publicKey);
      
      return {
        privateKey,
        publicKey,
        address
      };
    } catch {
      return null;
    }
  }

  /**
   * Export private key to WIF format
   */
  exportPrivateKeyToWIF(privateKey: Buffer, compressed: boolean = true): string {
    // Simplified WIF encoding
    // In production, use proper WIF encoding
    
    const version = this.network === 'testnet' ? 0xef : 0x80;
    const data = Buffer.concat([
      Buffer.from([version]),
      privateKey,
      compressed ? Buffer.from([0x01]) : Buffer.alloc(0)
    ]);
    
    const checksum = crypto.createHash('sha256')
      .update(crypto.createHash('sha256').update(data).digest())
      .digest()
      .slice(0, 4);
    
    const wifData = Buffer.concat([data, checksum]);
    return this.base58Encode(wifData);
  }

  /**
   * Sign message with private key
   */
  signMessage(message: string, privateKey: Buffer): string {
    const messageHash = crypto.createHash('sha256').update(message).digest();
    const signature = crypto.createSign('RSA-SHA256').update(messageHash).sign(privateKey);
    return signature.toString('base64');
  }

  /**
   * Verify message signature
   */
  verifyMessage(message: string, signature: string, publicKey: Buffer): boolean {
    try {
      const messageHash = crypto.createHash('sha256').update(message).digest();
      const sigBuffer = Buffer.from(signature, 'base64');
      return crypto.createVerify('RSA-SHA256').update(messageHash).verify(publicKey, sigBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Convert private key to public key
   */
  private privateKeyToPublicKey(privateKey: Buffer): Buffer {
    // Simplified public key generation
    // In production, use proper secp256k1 curve operations
    
    const hash = crypto.createHash('sha256').update(privateKey).digest();
    const publicKey = Buffer.concat([
      Buffer.from([0x04]), // Uncompressed public key prefix
      hash,
      hash // Simplified - in production use proper ECDSA public key derivation
    ]);
    
    return publicKey;
  }

  /**
   * Convert public key to address
   */
  private publicKeyToAddress(publicKey: Buffer): string {
    // Generate P2PKH address
    const hash160 = crypto.createHash('ripemd160')
      .update(crypto.createHash('sha256').update(publicKey).digest())
      .digest();
    
    const version = this.network === 'testnet' ? 0x6f : 0x00;
    const data = Buffer.concat([Buffer.from([version]), hash160]);
    
    const checksum = crypto.createHash('sha256')
      .update(crypto.createHash('sha256').update(data).digest())
      .digest()
      .slice(0, 4);
    
    const addressData = Buffer.concat([data, checksum]);
    return this.base58Encode(addressData);
  }

  /**
   * Convert WIF to private key
   */
  private wifToPrivateKey(wif: string): Buffer {
    // Simplified WIF decoding
    // In production, use proper WIF decoding
    
    const decoded = this.base58Decode(wif);
    const version = decoded[0];
    const checksum = decoded.slice(-4);
    const data = decoded.slice(0, -4);
    
    // Verify checksum
    const calculatedChecksum = crypto.createHash('sha256')
      .update(crypto.createHash('sha256').update(data).digest())
      .digest()
      .slice(0, 4);
    
    if (!checksum.equals(calculatedChecksum)) {
      throw new Error('Invalid WIF checksum');
    }
    
    // Extract private key
    const privateKey = data.slice(1, 33);
    return privateKey;
  }

  /**
   * Base58 encoding
   */
  private base58Encode(data: Buffer): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    // Use a simpler approach without BigInt for compatibility
    let num = parseInt(data.toString('hex'), 16);
    let result = '';
    
    while (num > 0) {
      result = alphabet[num % 58] + result;
      num = Math.floor(num / 58);
    }
    
    // Add leading zeros
    for (let i = 0; i < data.length && data[i] === 0; i++) {
      result = '1' + result;
    }
    
    return result;
  }

  /**
   * Base58 decoding
   */
  private base58Decode(str: string): Buffer {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const index = alphabet.indexOf(char);
      if (index === -1) {
        throw new Error('Invalid Base58 character');
      }
      num = num * 58 + index;
    }
    
    let hex = num.toString(16);
    if (hex.length % 2 !== 0) {
      hex = '0' + hex;
    }
    
    let bytes = Buffer.from(hex, 'hex');
    
    // Add leading zeros
    for (let i = 0; i < str.length && str[i] === '1'; i++) {
      const newBytes = Buffer.alloc(bytes.length + 1);
      newBytes[0] = 0;
      bytes.copy(newBytes, 1);
      bytes = newBytes;
    }
    
    return bytes;
  }
}

/**
 * Bitcoin Key Utilities
 */
export class BitcoinKeyUtils {
  /**
   * Validate private key
   */
  static validatePrivateKey(privateKey: Buffer): boolean {
    try {
      if (privateKey.length !== 32) {
        return false;
      }
      
      // Check if private key is in valid range (simplified for compatibility)
      const keyValue = parseInt(privateKey.toString('hex'), 16);
      const maxValue = parseInt('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141', 16);
      
      return keyValue > 0 && keyValue < maxValue;
    } catch {
      return false;
    }
  }

  /**
   * Validate public key
   */
  static validatePublicKey(publicKey: Buffer): boolean {
    try {
      if (publicKey.length !== 33 && publicKey.length !== 65) {
        return false;
      }
      
      // Check prefix
      if (publicKey[0] !== 0x02 && publicKey[0] !== 0x03 && publicKey[0] !== 0x04) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate Bitcoin address
   */
  static validateAddress(address: string, network: 'mainnet' | 'testnet' = 'testnet'): boolean {
    try {
      // Check prefix
      const validPrefixes = network === 'testnet' ? ['m', 'n', '2', 'tb1'] : ['1', '3', 'bc1'];
      const hasValidPrefix = validPrefixes.some(prefix => address.startsWith(prefix));
      
      if (!hasValidPrefix) {
        return false;
      }
      
      // Basic length check
      if (address.length < 26 || address.length > 90) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate deterministic key pair from seed
   */
  static generateFromSeed(seed: string, path: string = "m/44'/0'/0'/0/0"): {
    privateKey: Buffer;
    publicKey: Buffer;
    address: string;
  } {
    // Simplified HD wallet key derivation
    // In production, use proper BIP32/BIP44 implementation
    
    const seedHash = crypto.createHash('sha256').update(seed).digest();
    const privateKey = crypto.createHash('sha256').update(seedHash).digest();
    
    const keyManager = new BitcoinKeyManager();
    const publicKey = keyManager['privateKeyToPublicKey'](privateKey);
    const address = keyManager['publicKeyToAddress'](publicKey);
    
    return {
      privateKey,
      publicKey,
      address
    };
  }

  /**
   * Generate random seed
   */
  static generateSeed(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
} 