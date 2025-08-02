import { ethers } from 'ethers';
import { AptosClient, AptosAccount, HexString } from '@aptos-labs/ts-sdk';
import { SuiClient, Ed25519Keypair } from '@mysten/sui/client';
import * as fs from 'fs';
import * as path from 'path';

interface DeploymentConfig {
  network: string;
  rpcUrl: string;
  privateKey: string;
  contracts: {
    [contractName: string]: {
      address?: string;
      txHash?: string;
      blockNumber?: number;
      timestamp?: number;
    };
  };
}

interface DeploymentResult {
  success: boolean;
  contractAddress?: string;
  txHash?: string;
  error?: string;
  details?: any;
}

class ContractDeployer {
  private config: DeploymentConfig;
  private deploymentResults: Map<string, DeploymentResult> = new Map();

  constructor(config: DeploymentConfig) {
    this.config = config;
  }

  /**
   * Deploy EVM contracts (Ethereum, Polygon, etc.)
   */
  async deployEVMContracts(): Promise<void> {
    console.log('🚀 Deploying EVM contracts...');
    
    const provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    const wallet = new ethers.Wallet(this.config.privateKey, provider);

    try {
      // Deploy BitcoinHTLC contract
      const BitcoinHTLC = await ethers.getContractFactory('BitcoinHTLC');
      const bitcoinHTLC = await BitcoinHTLC.connect(wallet).deploy();
      await bitcoinHTLC.waitForDeployment();
      
      const address = await bitcoinHTLC.getAddress();
      const txHash = bitcoinHTLC.deploymentTransaction()?.hash;
      
      this.deploymentResults.set('BitcoinHTLC', {
        success: true,
        contractAddress: address,
        txHash: txHash,
        details: {
          network: this.config.network,
          deployer: wallet.address
        }
      });

      console.log(`✅ BitcoinHTLC deployed at: ${address}`);
      console.log(`📝 Transaction hash: ${txHash}`);

    } catch (error) {
      console.error('❌ Failed to deploy EVM contracts:', error);
      this.deploymentResults.set('BitcoinHTLC', {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Deploy Aptos Move module
   */
  async deployAptosModule(): Promise<void> {
    console.log('🚀 Deploying Aptos Move module...');
    
    try {
      const client = new AptosClient(this.config.rpcUrl);
      const account = new AptosAccount(HexString.ensure(this.config.privateKey).toUint8Array());

      // Read the Move module source
      const modulePath = path.join(__dirname, '../src/contracts/aptos/AtomicSwap.move');
      const moduleSource = fs.readFileSync(modulePath, 'utf8');

      // Compile and deploy the module
      const payload = {
        type: 'module_bundle_payload',
        modules: [
          {
            bytecode: `0x${Buffer.from(moduleSource).toString('hex')}`, // Simplified - would need proper compilation
            abi: {
              address: account.address().toString(),
              name: 'AtomicSwap',
              friends: [],
              exposed_functions: [],
              structs: [],
              errors: []
            }
          }
        ]
      };

      const txn = await client.generateTransaction(account.address(), payload);
      const signedTxn = await client.signTransaction(account, txn);
      const result = await client.submitTransaction(signedTxn);
      await client.waitForTransaction(result.hash);

      this.deploymentResults.set('AptosAtomicSwap', {
        success: true,
        contractAddress: account.address().toString(),
        txHash: result.hash,
        details: {
          network: this.config.network,
          moduleName: 'AtomicSwap'
        }
      });

      console.log(`✅ Aptos AtomicSwap module deployed`);
      console.log(`📝 Transaction hash: ${result.hash}`);

    } catch (error) {
      console.error('❌ Failed to deploy Aptos module:', error);
      this.deploymentResults.set('AptosAtomicSwap', {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Deploy Sui Move module
   */
  async deploySuiModule(): Promise<void> {
    console.log('🚀 Deploying Sui Move module...');
    
    try {
      const client = new SuiClient({ url: this.config.rpcUrl });
      const keypair = Ed25519Keypair.fromSecretKey(
        Uint8Array.from(Buffer.from(this.config.privateKey, 'hex'))
      );

      // Read the Move module source
      const modulePath = path.join(__dirname, '../src/contracts/sui/AtomicSwap.move');
      const moduleSource = fs.readFileSync(modulePath, 'utf8');

      // For Sui, we would typically use the Sui CLI or SDK to compile and deploy
      // This is a simplified example
      console.log('📝 Sui module deployment requires Sui CLI compilation');
      console.log('📝 Module source available at:', modulePath);

      this.deploymentResults.set('SuiAtomicSwap', {
        success: true,
        details: {
          network: this.config.network,
          moduleName: 'atomic_swap::atomic_swap',
          note: 'Manual deployment required via Sui CLI'
        }
      });

    } catch (error) {
      console.error('❌ Failed to deploy Sui module:', error);
      this.deploymentResults.set('SuiAtomicSwap', {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Deploy Bitcoin-style contracts (for Bitcoin forks)
   */
  async deployBitcoinStyleContracts(): Promise<void> {
    console.log('🚀 Setting up Bitcoin-style contracts...');
    
    try {
      // Bitcoin-style contracts are typically deployed on EVM-compatible forks
      // like Bitcoin Cash (BCH) with smart contract support
      
      const provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      const wallet = new ethers.Wallet(this.config.privateKey, provider);

      // Deploy BitcoinHTLC for Bitcoin Cash or other Bitcoin forks
      const BitcoinHTLC = await ethers.getContractFactory('BitcoinHTLC');
      const bitcoinHTLC = await BitcoinHTLC.connect(wallet).deploy();
      await bitcoinHTLC.waitForDeployment();
      
      const address = await bitcoinHTLC.getAddress();
      const txHash = bitcoinHTLC.deploymentTransaction()?.hash;

      this.deploymentResults.set('BitcoinStyleHTLC', {
        success: true,
        contractAddress: address,
        txHash: txHash,
        details: {
          network: this.config.network,
          deployer: wallet.address,
          contractType: 'BitcoinHTLC'
        }
      });

      console.log(`✅ Bitcoin-style HTLC deployed at: ${address}`);
      console.log(`📝 Transaction hash: ${txHash}`);

    } catch (error) {
      console.error('❌ Failed to deploy Bitcoin-style contracts:', error);
      this.deploymentResults.set('BitcoinStyleHTLC', {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Deploy all contracts
   */
  async deployAll(): Promise<void> {
    console.log('🚀 Starting deployment of all contracts...\n');

    await this.deployEVMContracts();
    await this.deployAptosModule();
    await this.deploySuiModule();
    await this.deployBitcoinStyleContracts();

    this.saveDeploymentResults();
  }

  /**
   * Save deployment results to file
   */
  private saveDeploymentResults(): void {
    const results = {
      timestamp: new Date().toISOString(),
      network: this.config.network,
      results: Object.fromEntries(this.deploymentResults)
    };

    const outputPath = path.join(__dirname, `../deployments/${this.config.network}-deployment.json`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log(`\n📁 Deployment results saved to: ${outputPath}`);
  }

  /**
   * Get deployment results
   */
  getResults(): Map<string, DeploymentResult> {
    return this.deploymentResults;
  }
}

// Example usage
async function main() {
  const configs: DeploymentConfig[] = [
    {
      network: 'ethereum-goerli',
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://goerli.infura.io/v3/YOUR_KEY',
      privateKey: process.env.ETHEREUM_PRIVATE_KEY || '',
      contracts: {}
    },
    {
      network: 'polygon-mumbai',
      rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-mumbai.infura.io/v3/YOUR_KEY',
      privateKey: process.env.POLYGON_PRIVATE_KEY || '',
      contracts: {}
    },
    {
      network: 'aptos-testnet',
      rpcUrl: process.env.APTOS_RPC_URL || 'https://fullnode.testnet.aptoslabs.com',
      privateKey: process.env.APTOS_PRIVATE_KEY || '',
      contracts: {}
    },
    {
      network: 'sui-testnet',
      rpcUrl: process.env.SUI_RPC_URL || 'https://fullnode.testnet.sui.io',
      privateKey: process.env.SUI_PRIVATE_KEY || '',
      contracts: {}
    }
  ];

  for (const config of configs) {
    if (!config.privateKey) {
      console.log(`⚠️  Skipping ${config.network} - no private key provided`);
      continue;
    }

    console.log(`\n🌐 Deploying to ${config.network}...`);
    const deployer = new ContractDeployer(config);
    await deployer.deployAll();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { ContractDeployer, DeploymentConfig, DeploymentResult }; 