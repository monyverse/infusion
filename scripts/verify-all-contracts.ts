import { run } from "hardhat";
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
  console.log("🔍 Starting contract verification on all networks...");

  // Load deployment information
  const deploymentFile = path.join(__dirname, "../deployments/testnet-deployments.json");
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ Deployment file not found. Please run deployment first.");
    process.exit(1);
  }

  const deployments: DeploymentInfo[] = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

  for (const deployment of deployments) {
    console.log(`\n🌐 Verifying contracts on ${deployment.network}...`);
    
    for (const [contractName, contractInfo] of Object.entries(deployment.contracts)) {
      try {
        console.log(`📦 Verifying ${contractName} at ${contractInfo.address}...`);
        
        // Set the network for verification
        process.env.HARDHAT_NETWORK = deployment.network;
        
        // Verify the contract
        await run("verify:verify", {
          address: contractInfo.address,
          constructorArguments: getConstructorArguments(contractName, deployment.contracts),
        });
        
        console.log(`✅ ${contractName} verified successfully on ${deployment.network}!`);
        
      } catch (error: any) {
        if (error.message.includes("Already Verified")) {
          console.log(`ℹ️  ${contractName} already verified on ${deployment.network}`);
        } else {
          console.error(`❌ Failed to verify ${contractName} on ${deployment.network}:`, error.message);
        }
      }
    }
  }

  console.log("\n🎉 Contract verification completed!");
  console.log("\n📋 Verification Summary:");
  console.log("=".repeat(40));
  
  for (const deployment of deployments) {
    console.log(`\n🌐 ${deployment.network.toUpperCase()}`);
    console.log("-".repeat(20));
    
    for (const [contractName, contractInfo] of Object.entries(deployment.contracts)) {
      const explorerUrl = getExplorerUrl(deployment.network, contractInfo.address);
      console.log(`📦 ${contractName}: ${explorerUrl}`);
    }
  }
}

function getConstructorArguments(contractName: string, contracts: any): any[] {
  switch (contractName) {
    case "MockERC20":
      return ["Test Token", "TEST", 18];
    case "UniteAIWallet":
      return [
        contracts.HTLCFactory?.address || "",
        contracts.CustomLimitOrder?.address || "",
        contracts.BitcoinBridge?.address || "",
      ];
    default:
      return [];
  }
}

function getExplorerUrl(network: string, address: string): string {
  const explorers: { [key: string]: string } = {
    sepolia: `https://sepolia.etherscan.io/address/${address}`,
    arbitrumSepolia: `https://sepolia.arbiscan.io/address/${address}`,
    polygonMumbai: `https://mumbai.polygonscan.com/address/${address}`,
    baseSepolia: `https://sepolia.basescan.org/address/${address}`,
    optimismSepolia: `https://sepolia-optimism.etherscan.io/address/${address}`,
    bscTestnet: `https://testnet.bscscan.com/address/${address}`,
    avalancheFuji: `https://testnet.snowtrace.io/address/${address}`,
    fantomTestnet: `https://testnet.ftmscan.com/address/${address}`,
    etherlink: `https://explorer.etherlink.com/address/${address}`,
  };
  
  return explorers[network] || `https://explorer.${network}.com/address/${address}`;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }); 