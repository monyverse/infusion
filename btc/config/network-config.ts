/**
 * Bitcoin Network Configuration
 * Based on hashlocked-cli implementation
 */
export class BitcoinConfig {
  private network: 'mainnet' | 'testnet';
  private rpcUrl: string;
  private rpcUser: string;
  private rpcPassword: string;

  constructor(
    network: 'mainnet' | 'testnet' = 'testnet',
    rpcUrl?: string,
    rpcUser?: string,
    rpcPassword?: string
  ) {
    this.network = network;
    this.rpcUrl = rpcUrl || this.getDefaultRpcUrl();
    this.rpcUser = rpcUser || process.env.BITCOIN_RPC_USER || '';
    this.rpcPassword = rpcPassword || process.env.BITCOIN_RPC_PASS || '';
  }

  /**
   * Get default RPC URL for network
   */
  private getDefaultRpcUrl(): string {
    if (this.network === 'testnet') {
      return process.env.BITCOIN_TESTNET_RPC_URL || 'http://localhost:18332';
    } else {
      return process.env.BITCOIN_RPC_URL || 'http://localhost:8332';
    }
  }

  /**
   * Get network parameters
   */
  getNetworkParams(): {
    name: string;
    magic: number;
    port: number;
    dnsSeeds: string[];
    genesisBlock: string;
  } {
    if (this.network === 'testnet') {
      return {
        name: 'testnet',
        magic: 0x0709110b,
        port: 18333,
        dnsSeeds: [
          'testnet-seed.bitcoin.jonasschnelli.ch',
          'testnet-seed.bitcoin.schildbach.de',
          'testnet-seed.bluematt.me'
        ],
        genesisBlock: '000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943'
      };
    } else {
      return {
        name: 'mainnet',
        magic: 0xf9beb4d9,
        port: 8333,
        dnsSeeds: [
          'seed.bitcoin.sipa.be',
          'dnsseed.bluematt.me',
          'dnsseed.bitcoin.dashjr.org',
          'seed.bitcoinstats.com',
          'seed.bitcoin.jonasschnelli.ch'
        ],
        genesisBlock: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f'
      };
    }
  }

  /**
   * Get address balance
   */
  async getAddressBalance(address: string): Promise<{
    confirmed: number;
    unconfirmed: number;
    total: number;
  }> {
    try {
      const response = await this.rpcCall('getreceivedbyaddress', [address]);
      const confirmed = response || 0;
      
      // For demo purposes, return simplified balance
      // In production, use proper Bitcoin RPC calls
      return {
        confirmed: confirmed / 100000000, // Convert satoshis to BTC
        unconfirmed: 0,
        total: confirmed / 100000000
      };
    } catch (error) {
      console.error('Error getting address balance:', error);
      return {
        confirmed: 0,
        unconfirmed: 0,
        total: 0
      };
    }
  }

  /**
   * Get address UTXOs
   */
  async getAddressUTXOs(address: string): Promise<Array<{
    txid: string;
    vout: number;
    value: number;
    confirmations: number;
  }>> {
    try {
      const response = await this.rpcCall('listunspent', [0, 999999, [address]]);
      
      if (Array.isArray(response)) {
        return response.map(utxo => ({
          txid: utxo.txid,
          vout: utxo.vout,
          value: utxo.amount * 100000000, // Convert BTC to satoshis
          confirmations: utxo.confirmations
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error getting address UTXOs:', error);
      return [];
    }
  }

  /**
   * Send raw transaction
   */
  async sendRawTransaction(rawTx: string): Promise<string> {
    try {
      const response = await this.rpcCall('sendrawtransaction', [rawTx]);
      return response || '';
    } catch (error) {
      console.error('Error sending raw transaction:', error);
      throw error;
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(txid: string): Promise<{
    txid: string;
    confirmations: number;
    blockhash: string;
    time: number;
    size: number;
    vsize: number;
    weight: number;
    fee: number;
    details: any[];
  } | null> {
    try {
      const response = await this.rpcCall('gettransaction', [txid]);
      
      if (response) {
        return {
          txid: response.txid,
          confirmations: response.confirmations || 0,
          blockhash: response.blockhash || '',
          time: response.time || 0,
          size: response.size || 0,
          vsize: response.vsize || 0,
          weight: response.weight || 0,
          fee: response.fee || 0,
          details: response.details || []
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting transaction:', error);
      return null;
    }
  }

  /**
   * Get block information
   */
  async getBlock(blockhash: string): Promise<{
    hash: string;
    confirmations: number;
    size: number;
    height: number;
    version: number;
    merkleroot: string;
    tx: string[];
    time: number;
    mediantime: number;
    nonce: number;
    bits: string;
    difficulty: number;
    previousblockhash: string;
    nextblockhash: string;
  } | null> {
    try {
      const response = await this.rpcCall('getblock', [blockhash]);
      
      if (response) {
        return {
          hash: response.hash,
          confirmations: response.confirmations || 0,
          size: response.size || 0,
          height: response.height || 0,
          version: response.version || 0,
          merkleroot: response.merkleroot || '',
          tx: response.tx || [],
          time: response.time || 0,
          mediantime: response.mediantime || 0,
          nonce: response.nonce || 0,
          bits: response.bits || '',
          difficulty: response.difficulty || 0,
          previousblockhash: response.previousblockhash || '',
          nextblockhash: response.nextblockhash || ''
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting block:', error);
      return null;
    }
  }

  /**
   * Get current block height
   */
  async getBlockHeight(): Promise<number> {
    try {
      const response = await this.rpcCall('getblockcount', []);
      return response || 0;
    } catch (error) {
      console.error('Error getting block height:', error);
      return 0;
    }
  }

  /**
   * Get fee estimates
   */
  async getFeeEstimates(): Promise<{
    low: number;
    medium: number;
    high: number;
  }> {
    try {
      const response = await this.rpcCall('estimatesmartfee', [6]);
      
      if (response && response.feerate) {
        const feeRate = response.feerate * 100000; // Convert BTC/kB to satoshis/kB
        return {
          low: Math.floor(feeRate * 0.5),
          medium: Math.floor(feeRate),
          high: Math.floor(feeRate * 2)
        };
      }
      
      // Default fee estimates
      return {
        low: 1000,
        medium: 2000,
        high: 5000
      };
    } catch (error) {
      console.error('Error getting fee estimates:', error);
      return {
        low: 1000,
        medium: 2000,
        high: 5000
      };
    }
  }

  /**
   * Make RPC call
   */
  private async rpcCall(method: string, params: any[] = []): Promise<any> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.rpcUser}:${this.rpcPassword}`).toString('base64')}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message}`);
      }

      return data.result;
    } catch (error) {
      console.error(`RPC call failed for method ${method}:`, error);
      throw error;
    }
  }

  /**
   * Test RPC connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.rpcCall('getblockcount', []);
      return true;
    } catch (error) {
      console.error('RPC connection test failed:', error);
      return false;
    }
  }

  /**
   * Get network info
   */
  async getNetworkInfo(): Promise<{
    version: number;
    subversion: string;
    connections: number;
    timeoffset: number;
    networkactive: boolean;
    networks: any[];
  } | null> {
    try {
      const response = await this.rpcCall('getnetworkinfo', []);
      
      if (response) {
        return {
          version: response.version || 0,
          subversion: response.subversion || '',
          connections: response.connections || 0,
          timeoffset: response.timeoffset || 0,
          networkactive: response.networkactive || false,
          networks: response.networks || []
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }
}

/**
 * Bitcoin Network Utilities
 */
export class BitcoinNetworkUtils {
  /**
   * Get network name
   */
  static getNetworkName(network: 'mainnet' | 'testnet'): string {
    return network === 'testnet' ? 'Bitcoin Testnet' : 'Bitcoin Mainnet';
  }

  /**
   * Get network symbol
   */
  static getNetworkSymbol(network: 'mainnet' | 'testnet'): string {
    return network === 'testnet' ? 'tBTC' : 'BTC';
  }

  /**
   * Get network explorer URL
   */
  static getExplorerUrl(network: 'mainnet' | 'testnet'): string {
    return network === 'testnet' 
      ? 'https://blockstream.info/testnet'
      : 'https://blockstream.info';
  }

  /**
   * Get faucet URL for testnet
   */
  static getFaucetUrl(): string {
    return 'https://testnet-faucet.mempool.co/';
  }

  /**
   * Validate network name
   */
  static validateNetwork(network: string): network is 'mainnet' | 'testnet' {
    return network === 'mainnet' || network === 'testnet';
  }
} 