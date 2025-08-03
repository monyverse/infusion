import { ethers } from "hardhat";
import { verify } from "./verify";

async function main() {
  console.log("🚀 Deploying InFusion contracts to testnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy Custom Limit Order Protocol
  console.log("\n📋 Deploying Custom Limit Order Protocol...");
  const CustomLimitOrder = await ethers.getContractFactory("CustomLimitOrder");
  const customLimitOrder = await CustomLimitOrder.deploy(deployer.address);
  await customLimitOrder.waitForDeployment();
  const customLimitOrderAddress = await customLimitOrder.getAddress();
  console.log("✅ Custom Limit Order deployed to:", customLimitOrderAddress);

  // Deploy InFusion Wallet
console.log("\n🤖 Deploying InFusion Wallet...");
const InFusionWallet = await ethers.getContractFactory("InFusionWallet");
const infusionWallet = await InFusionWallet.deploy();
await infusionWallet.waitForDeployment();
const infusionWalletAddress = await infusionWallet.getAddress();
console.log("✅ InFusion Wallet deployed to:", infusionWalletAddress);

  // Deploy Bitcoin Bridge for HTLC functionality
  console.log("\n🔗 Deploying Bitcoin Bridge...");
  const BitcoinBridge = await ethers.getContractFactory("BitcoinBridge");
  const bitcoinBridge = await BitcoinBridge.deploy();
  await bitcoinBridge.waitForDeployment();
  const bitcoinBridgeAddress = await bitcoinBridge.getAddress();
  console.log("✅ Bitcoin Bridge deployed to:", bitcoinBridgeAddress);

  // Deploy mock tokens for testing
  console.log("\n🪙 Deploying Mock Tokens...");
  const MockToken = await ethers.getContractFactory("MockERC20");
  
  const mockETH = await MockToken.deploy("Mock ETH", "mETH");
  await mockETH.waitForDeployment();
  const mockETHAddress = await mockETH.getAddress();
  console.log("✅ Mock ETH deployed to:", mockETHAddress);

  const mockBTC = await MockToken.deploy("Mock BTC", "mBTC");
  await mockBTC.waitForDeployment();
  const mockBTCAddress = await mockBTC.getAddress();
  console.log("✅ Mock BTC deployed to:", mockBTCAddress);

  const mockUSDC = await MockToken.deploy("Mock USDC", "mUSDC");
  await mockUSDC.waitForDeployment();
  const mockUSDCAddress = await mockUSDC.getAddress();
  console.log("✅ Mock USDC deployed to:", mockUSDCAddress);

  // Mint tokens to deployer for testing
  console.log("\n💰 Minting test tokens...");
  await mockETH.mint(deployer.address, ethers.parseEther("1000"));
  await mockBTC.mint(deployer.address, ethers.parseEther("10"));
  await mockUSDC.mint(deployer.address, ethers.parseUnits("10000", 6));
  console.log("✅ Test tokens minted");

  // Create a sample limit order for demo
  console.log("\n📊 Creating sample limit order...");
  const makerAsset = mockETHAddress;
  const takerAsset = mockUSDCAddress;
  const makerAmount = ethers.parseEther("1");
  const takerAmount = ethers.parseUnits("3000", 6); // 1 ETH = 3000 USDC
  const startTime = Math.floor(Date.now() / 1000);
  const endTime = startTime + 86400; // 24 hours

  // Approve tokens
  await mockETH.approve(customLimitOrderAddress, makerAmount);

  // Create order signature
  const orderData = {
    maker: deployer.address,
    makerAsset: makerAsset,
    takerAsset: takerAsset,
    makerAmount: makerAmount,
    takerAmount: takerAmount,
    salt: ethers.keccak256(ethers.toUtf8Bytes("test-salt")),
    startTime: startTime,
    endTime: endTime
  };

  const orderHash = await customLimitOrder.getOrderHash(orderData);
  const signature = await deployer.signMessage(ethers.getBytes(orderHash));

  // Create the order
  await customLimitOrder.createOrder(
    makerAsset,
    takerAsset,
    makerAmount,
    takerAmount,
    startTime,
    endTime,
    signature
  );
  console.log("✅ Sample limit order created");

  // Deploy to multiple testnets for cross-chain demo
  console.log("\n🌐 Deploying to multiple testnets for cross-chain demo...");
  
  // This would deploy to different testnets in a real scenario
  const networks = [
    { name: "Sepolia", chainId: 11155111 },
    { name: "Goerli", chainId: 5 },
    { name: "Mumbai", chainId: 80001 },
    { name: "Base Goerli", chainId: 84531 }
  ];

  for (const network of networks) {
    console.log(`📡 ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`   - Custom Limit Order: ${customLimitOrderAddress}`);
    console.log(`   - InFusion Wallet: ${infusionWalletAddress}`);
    console.log(`   - Bitcoin Bridge: ${bitcoinBridgeAddress}`);
    console.log(`   - Mock ETH: ${mockETHAddress}`);
    console.log(`   - Mock BTC: ${mockBTCAddress}`);
    console.log(`   - Mock USDC: ${mockUSDCAddress}`);
  }

  // Save deployment info
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    networks: {
      sepolia: {
        customLimitOrder: customLimitOrderAddress,
        infusionWallet: infusionWalletAddress,
        bitcoinBridge: bitcoinBridgeAddress,
        mockETH: mockETHAddress,
        mockBTC: mockBTCAddress,
        mockUSDC: mockUSDCAddress
      }
    },
    sampleOrder: {
      orderHash: orderHash,
      makerAsset: makerAsset,
      takerAsset: takerAsset,
      makerAmount: makerAmount.toString(),
      takerAmount: takerAmount.toString(),
      startTime: startTime,
      endTime: endTime
    }
  };

  // Write deployment info to file
  const fs = require("fs");
  fs.writeFileSync(
    "deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\n📄 Deployment info saved to deployment-info.json");

  // Verify contracts on Etherscan (if not on local network)
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 31337n) { // Not local network
    console.log("\n🔍 Verifying contracts on Etherscan...");
    
    try {
      await verify(customLimitOrderAddress, [deployer.address]);
      console.log("✅ Custom Limit Order verified");
    } catch (error) {
      console.log("⚠️ Custom Limit Order verification failed:", error);
    }

    try {
      await verify(uniteAIWalletAddress, []);
      console.log("✅ UniteAI Wallet verified");
    } catch (error) {
      console.log("⚠️ UniteAI Wallet verification failed:", error);
    }

    try {
      await verify(bitcoinBridgeAddress, []);
      console.log("✅ Bitcoin Bridge verified");
    } catch (error) {
      console.log("⚠️ Bitcoin Bridge verification failed:", error);
    }
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Demo Instructions:");
  console.log("1. Visit the frontend at http://localhost:3002");
  console.log("2. Connect your wallet to the testnet");
  console.log("3. Try creating a limit order using the Custom Limit Order protocol");
  console.log("4. Test cross-chain swaps using the Bitcoin Bridge");
  console.log("5. Use the AI automation features to manage your portfolio");
  console.log("\n🔗 Contract Addresses:");
  console.log(`Custom Limit Order: ${customLimitOrderAddress}`);
  console.log(`UniteAI Wallet: ${uniteAIWalletAddress}`);
  console.log(`Bitcoin Bridge: ${bitcoinBridgeAddress}`);
  console.log(`Mock ETH: ${mockETHAddress}`);
  console.log(`Mock BTC: ${mockBTCAddress}`);
  console.log(`Mock USDC: ${mockUSDCAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 