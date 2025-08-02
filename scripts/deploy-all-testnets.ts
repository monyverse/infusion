import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
  network: string;
  chainId: number;
  contracts: {
    [contractName: string]: {
      address: string;
      txHash: string;
      blockNumber: number;
      timestamp: number;
    };
  };
}

async function main() {
  console.log("🚀 Starting deployment to all testnets...");

  const networks = [
    { name: "sepolia", chainId: 11155111 },
    { name: "arbitrumSepolia", chainId: 421614 },
    { name: "polygonMumbai", chainId: 80001 },
    { name: "baseSepolia", chainId: 84532 },
    { name: "optimismSepolia", chainId: 11155420 },
    { name: "bscTestnet", chainId: 97 },
    { name: "avalancheFuji", chainId: 43113 },
    { name: "fantomTestnet", chainId: 4002 },
    { name: "etherlink", chainId: 128123 },
  ];

  const deployments: DeploymentInfo[] = [];

  for (const network of networks) {
    console.log(`\n📡 Deploying to ${network.name} (Chain ID: ${network.chainId})...`);
    
    try {
      // Get the signer for this network
      const [deployer] = await ethers.getSigners();
      console.log(`👤 Deploying with account: ${deployer.address}`);
      console.log(`💰 Account balance: ${ethers.formatEther(await deployer.provider!.getBalance(deployer.address))} ETH`);

      const deployment: DeploymentInfo = {
        network: network.name,
        chainId: network.chainId,
        contracts: {},
      };

      // Deploy MockERC20 for testing
      console.log("📦 Deploying MockERC20...");
      const MockERC20 = await ethers.getContractFactory("MockERC20");
      const mockERC20 = await MockERC20.deploy("Test Token", "TEST", 18);
      await mockERC20.waitForDeployment();
      const mockERC20Address = await mockERC20.getAddress();
      const mockERC20Tx = mockERC20.deploymentTransaction();
      
      deployment.contracts.MockERC20 = {
        address: mockERC20Address,
        txHash: mockERC20Tx!.hash,
        blockNumber: mockERC20Tx!.blockNumber!,
        timestamp: Math.floor(Date.now() / 1000),
      };
      console.log(`✅ MockERC20 deployed to: ${mockERC20Address}`);

      // Deploy HTLC Factory
      console.log("🔒 Deploying HTLCFactory...");
      const HTLCFactory = await ethers.getContractFactory("HTLCFactory");
      const htlcFactory = await HTLCFactory.deploy();
      await htlcFactory.waitForDeployment();
      const htlcFactoryAddress = await htlcFactory.getAddress();
      const htlcFactoryTx = htlcFactory.deploymentTransaction();
      
      deployment.contracts.HTLCFactory = {
        address: htlcFactoryAddress,
        txHash: htlcFactoryTx!.hash,
        blockNumber: htlcFactoryTx!.blockNumber!,
        timestamp: Math.floor(Date.now() / 1000),
      };
      console.log(`✅ HTLCFactory deployed to: ${htlcFactoryAddress}`);

      // Deploy Custom Limit Order
      console.log("📋 Deploying CustomLimitOrder...");
      const CustomLimitOrder = await ethers.getContractFactory("CustomLimitOrder");
      const customLimitOrder = await CustomLimitOrder.deploy();
      await customLimitOrder.waitForDeployment();
      const customLimitOrderAddress = await customLimitOrder.getAddress();
      const customLimitOrderTx = customLimitOrder.deploymentTransaction();
      
      deployment.contracts.CustomLimitOrder = {
        address: customLimitOrderAddress,
        txHash: customLimitOrderTx!.hash,
        blockNumber: customLimitOrderTx!.blockNumber!,
        timestamp: Math.floor(Date.now() / 1000),
      };
      console.log(`✅ CustomLimitOrder deployed to: ${customLimitOrderAddress}`);

      // Deploy Bitcoin Bridge
      console.log("🌉 Deploying BitcoinBridge...");
      const BitcoinBridge = await ethers.getContractFactory("BitcoinBridge");
      const bitcoinBridge = await BitcoinBridge.deploy();
      await bitcoinBridge.waitForDeployment();
      const bitcoinBridgeAddress = await bitcoinBridge.getAddress();
      const bitcoinBridgeTx = bitcoinBridge.deploymentTransaction();
      
      deployment.contracts.BitcoinBridge = {
        address: bitcoinBridgeAddress,
        txHash: bitcoinBridgeTx!.hash,
        blockNumber: bitcoinBridgeTx!.blockNumber!,
        timestamp: Math.floor(Date.now() / 1000),
      };
      console.log(`✅ BitcoinBridge deployed to: ${bitcoinBridgeAddress}`);

      // Deploy UniteAI Wallet
      console.log("🤖 Deploying UniteAIWallet...");
      const UniteAIWallet = await ethers.getContractFactory("UniteAIWallet");
      const uniteAIWallet = await UniteAIWallet.deploy(
        htlcFactoryAddress,
        customLimitOrderAddress,
        bitcoinBridgeAddress
      );
      await uniteAIWallet.waitForDeployment();
      const uniteAIWalletAddress = await uniteAIWallet.getAddress();
      const uniteAIWalletTx = uniteAIWallet.deploymentTransaction();
      
      deployment.contracts.UniteAIWallet = {
        address: uniteAIWalletAddress,
        txHash: uniteAIWalletTx!.hash,
        blockNumber: uniteAIWalletTx!.blockNumber!,
        timestamp: Math.floor(Date.now() / 1000),
      };
      console.log(`✅ UniteAIWallet deployed to: ${uniteAIWalletAddress}`);

      deployments.push(deployment);
      console.log(`🎉 Successfully deployed all contracts to ${network.name}!`);

    } catch (error) {
      console.error(`❌ Failed to deploy to ${network.name}:`, error);
      console.log(`⏭️  Skipping ${network.name} and continuing with next network...`);
    }
  }

  // Save deployment information
  const deploymentPath = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const deploymentFile = path.join(deploymentPath, "testnet-deployments.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deployments, null, 2));
  console.log(`\n📄 Deployment information saved to: ${deploymentFile}`);

  // Generate deployment summary
  console.log("\n📊 DEPLOYMENT SUMMARY:");
  console.log("=".repeat(50));
  
  for (const deployment of deployments) {
    console.log(`\n🌐 ${deployment.network.toUpperCase()} (Chain ID: ${deployment.chainId})`);
    console.log("-".repeat(30));
    
    for (const [contractName, contractInfo] of Object.entries(deployment.contracts)) {
      console.log(`📦 ${contractName}: ${contractInfo.address}`);
      console.log(`   TX: ${contractInfo.txHash}`);
    }
  }

  console.log("\n🎯 Next steps:");
  console.log("1. Verify contracts on block explorers");
  console.log("2. Update frontend configuration with new addresses");
  console.log("3. Test cross-chain functionality");
  console.log("4. Deploy to mainnets when ready");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 