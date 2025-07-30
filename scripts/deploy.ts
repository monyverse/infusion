import { ethers } from "hardhat";
import { Logger } from "../src/utils/logger";

async function main() {
  const logger = new Logger("DeployScript");
  logger.info("Starting UniteAI Wallet deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  logger.info(`Deploying contracts with account: ${deployer.address}`);

  // Check balance
  const balance = await deployer.getBalance();
  logger.info(`Account balance: ${ethers.utils.formatEther(balance)} ETH`);

  if (balance.lt(ethers.utils.parseEther("0.1"))) {
    throw new Error("Insufficient balance for deployment");
  }

  // Deploy contracts
  try {
    // 1. Deploy Bitcoin Bridge
    logger.info("Deploying Bitcoin Bridge...");
    const BitcoinBridge = await ethers.getContractFactory("BitcoinBridge");
    const bitcoinBridge = await BitcoinBridge.deploy();
    await bitcoinBridge.deployed();
    logger.info(`Bitcoin Bridge deployed to: ${bitcoinBridge.address}`);

    // 2. Deploy UniteAI Wallet
    logger.info("Deploying UniteAI Wallet...");
    
    // Get 1inch contract addresses (these would be different per network)
    const limitOrderProtocol = "0x1111111254EEB25477B68fb85Ed929f73A960582"; // 1inch Limit Order Protocol
    const oneInchRouter = "0x1111111254EEB25477B68fb85Ed929f73A960582"; // 1inch Router
    
    const UniteAIWallet = await ethers.getContractFactory("UniteAIWallet");
    const uniteAIWallet = await UniteAIWallet.deploy(
      limitOrderProtocol,
      oneInchRouter
    );
    await uniteAIWallet.deployed();
    logger.info(`UniteAI Wallet deployed to: ${uniteAIWallet.address}`);

    // 3. Deploy additional contracts for other chains
    logger.info("Deploying cross-chain bridges...");

    // Stellar Bridge (simplified)
    const StellarBridge = await ethers.getContractFactory("BitcoinBridge"); // Reusing for demo
    const stellarBridge = await StellarBridge.deploy();
    await stellarBridge.deployed();
    logger.info(`Stellar Bridge deployed to: ${stellarBridge.address}`);

    // NEAR Bridge (simplified)
    const NEARBridge = await ethers.getContractFactory("BitcoinBridge"); // Reusing for demo
    const nearBridge = await NEARBridge.deploy();
    await nearBridge.deployed();
    logger.info(`NEAR Bridge deployed to: ${nearBridge.address}`);

    // Etherlink Bridge (simplified)
    const EtherlinkBridge = await ethers.getContractFactory("BitcoinBridge"); // Reusing for demo
    const etherlinkBridge = await EtherlinkBridge.deploy();
    await etherlinkBridge.deployed();
    logger.info(`Etherlink Bridge deployed to: ${etherlinkBridge.address}`);

    // 4. Set up AI authorization
    logger.info("Setting up AI authorization...");
    
    // Authorize the deployer as an AI agent for testing
    await uniteAIWallet.setAIAuthorization(deployer.address, true);
    logger.info(`AI authorization set for: ${deployer.address}`);

    // 5. Verify contracts on Etherscan (if not on local network)
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 31337) { // Not local network
      logger.info("Waiting for block confirmations...");
      await bitcoinBridge.deployTransaction.wait(6);
      await uniteAIWallet.deployTransaction.wait(6);
      await stellarBridge.deployTransaction.wait(6);
      await nearBridge.deployTransaction.wait(6);
      await etherlinkBridge.deployTransaction.wait(6);

      logger.info("Verifying contracts on Etherscan...");
      
      try {
        await hre.run("verify:verify", {
          address: bitcoinBridge.address,
          constructorArguments: [],
        });
        logger.info("Bitcoin Bridge verified on Etherscan");
      } catch (error) {
        logger.warn("Bitcoin Bridge verification failed:", error);
      }

      try {
        await hre.run("verify:verify", {
          address: uniteAIWallet.address,
          constructorArguments: [limitOrderProtocol, oneInchRouter],
        });
        logger.info("UniteAI Wallet verified on Etherscan");
      } catch (error) {
        logger.warn("UniteAI Wallet verification failed:", error);
      }
    }

    // 6. Save deployment addresses
    const deploymentInfo = {
      network: network.name,
      chainId: network.chainId,
      deployer: deployer.address,
      contracts: {
        bitcoinBridge: bitcoinBridge.address,
        uniteAIWallet: uniteAIWallet.address,
        stellarBridge: stellarBridge.address,
        nearBridge: nearBridge.address,
        etherlinkBridge: etherlinkBridge.address,
      },
      timestamp: new Date().toISOString(),
      blockNumber: await ethers.provider.getBlockNumber(),
    };

    // Save to file
    const fs = require("fs");
    const path = require("path");
    const deploymentPath = path.join(__dirname, "../deployments");
    
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath, { recursive: true });
    }

    fs.writeFileSync(
      path.join(deploymentPath, `${network.chainId}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );

    logger.info("Deployment completed successfully!");
    logger.info("Deployment info saved to deployments/ directory");

    // 7. Display deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("🚀 UNITEAI WALLET DEPLOYMENT COMPLETE");
    console.log("=".repeat(60));
    console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`Deployer: ${deployer.address}`);
    console.log("\n📋 Contract Addresses:");
    console.log(`Bitcoin Bridge: ${bitcoinBridge.address}`);
    console.log(`UniteAI Wallet: ${uniteAIWallet.address}`);
    console.log(`Stellar Bridge: ${stellarBridge.address}`);
    console.log(`NEAR Bridge: ${nearBridge.address}`);
    console.log(`Etherlink Bridge: ${etherlinkBridge.address}`);
    console.log("\n🔗 Next Steps:");
    console.log("1. Update environment variables with contract addresses");
    console.log("2. Initialize AI agents with contract addresses");
    console.log("3. Test cross-chain functionality");
    console.log("4. Deploy to additional networks");
    console.log("=".repeat(60));

  } catch (error) {
    logger.error("Deployment failed:", error);
    throw error;
  }
}

// Handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  }); 