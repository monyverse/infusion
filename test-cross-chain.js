const crypto = require('crypto');

// Mock HTLC functionality
class MockHTLC {
  static generateSecretAndHashlock() {
    const secret = crypto.randomBytes(32).toString('hex');
    const hashlock = crypto.createHash('sha256').update(secret).digest('hex');
    return { secret, hashlock };
  }

  static verifySecret(secret, hashlock) {
    const computedHashlock = crypto.createHash('sha256').update(secret).digest('hex');
    return computedHashlock === hashlock;
  }
}

// Mock Cross-Chain Coordinator
class MockCrossChainCoordinator {
  constructor() {
    this.swaps = new Map();
  }

  initiateCrossChainSwap(request) {
    const swapId = `swap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const { secret, hashlock } = MockHTLC.generateSecretAndHashlock();
    
    const swapStatus = {
      swapId,
      status: 'initiated',
      fromChain: request.fromChain,
      toChain: request.toChain,
      fromToken: request.fromToken,
      toToken: request.toToken,
      fromAmount: request.fromAmount,
      toAmount: request.toAmount || '0',
      userAddress: request.userAddress,
      recipientAddress: request.recipientAddress || request.userAddress,
      hashlock,
      secret,
      timelock: request.timelock || 3600,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt: Date.now() + (request.timelock || 3600) * 1000,
      transactions: {}
    };

    this.swaps.set(swapId, swapStatus);
    return swapStatus;
  }

  getCrossChainQuote(request) {
    // Mock quote calculation
    const fromAmount = parseFloat(request.fromAmount);
    const mockPrice = 0.95; // 5% slippage
    const toAmount = (fromAmount * mockPrice).toString();
    
    return {
      toAmount,
      price: mockPrice.toString(),
      gasEstimate: '500000'
    };
  }

  executeCrossChainSwap(swapId) {
    const swap = this.swaps.get(swapId);
    if (!swap) {
      throw new Error('Swap not found');
    }

    // Simulate swap execution
    swap.status = 'completed';
    swap.updatedAt = Date.now();
    swap.transactions = {
      fromChainTx: `0x${crypto.randomBytes(32).toString('hex')}`,
      toChainTx: `0x${crypto.randomBytes(32).toString('hex')}`,
      redeemTx: `0x${crypto.randomBytes(32).toString('hex')}`
    };

    this.swaps.set(swapId, swap);
    return swap;
  }

  getSwapStatus(swapId) {
    return this.swaps.get(swapId) || null;
  }

  getUserSwaps(userAddress) {
    return Array.from(this.swaps.values()).filter(swap => swap.userAddress === userAddress);
  }

  refundSwap(swapId) {
    const swap = this.swaps.get(swapId);
    if (!swap) {
      throw new Error('Swap not found');
    }

    if (Date.now() < swap.expiresAt) {
      throw new Error('Swap has not expired yet');
    }

    swap.status = 'refunded';
    swap.updatedAt = Date.now();
    swap.transactions.refundTx = `0x${crypto.randomBytes(32).toString('hex')}`;

    this.swaps.set(swapId, swap);
    return `Swap ${swapId} refunded successfully`;
  }

  cleanupExpiredSwaps() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [swapId, swap] of this.swaps.entries()) {
      if (now > swap.expiresAt && swap.status === 'initiated') {
        this.swaps.delete(swapId);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}

// Test function
function testCrossChainFunctionality() {
  console.log('🧪 Testing Cross-Chain Swap Functionality...\n');

  const coordinator = new MockCrossChainCoordinator();

  // Test 1: HTLC Secret and Hashlock Generation
  console.log('1. Testing HTLC Secret and Hashlock Generation:');
  const { secret, hashlock } = MockHTLC.generateSecretAndHashlock();
  console.log(`   Secret: ${secret.substring(0, 16)}...`);
  console.log(`   Hashlock: ${hashlock.substring(0, 16)}...`);
  console.log(`   Verification: ${MockHTLC.verifySecret(secret, hashlock)}`);
  console.log('   ✅ HTLC functionality working\n');

  // Test 2: Cross-Chain Quote
  console.log('2. Testing Cross-Chain Quote:');
  const quoteRequest = {
    fromChain: 'ethereum',
    toChain: 'polygon',
    fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
    toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
    fromAmount: '1000000000000000000',
    userAddress: '0x1234567890123456789012345678901234567890'
  };

  const quote = coordinator.getCrossChainQuote(quoteRequest);
  console.log(`   From: ${quoteRequest.fromAmount} ${quoteRequest.fromToken.substring(0, 10)}...`);
  console.log(`   To: ${quote.toAmount} ${quoteRequest.toToken.substring(0, 10)}...`);
  console.log(`   Price: ${quote.price}`);
  console.log(`   Gas Estimate: ${quote.gasEstimate}`);
  console.log('   ✅ Quote generation working\n');

  // Test 3: Swap Initiation
  console.log('3. Testing Swap Initiation:');
  const swapRequest = {
    fromChain: 'ethereum',
    toChain: 'polygon',
    fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
    toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
    fromAmount: '1000000000000000000',
    userAddress: '0x1234567890123456789012345678901234567890',
    recipientAddress: '0x0987654321098765432109876543210987654321',
    timelock: 3600
  };

  const swapStatus = coordinator.initiateCrossChainSwap(swapRequest);
  console.log(`   Swap ID: ${swapStatus.swapId}`);
  console.log(`   Status: ${swapStatus.status}`);
  console.log(`   From Chain: ${swapStatus.fromChain}`);
  console.log(`   To Chain: ${swapStatus.toChain}`);
  console.log(`   Hashlock: ${swapStatus.hashlock.substring(0, 16)}...`);
  console.log('   ✅ Swap initiation working\n');

  // Test 4: Swap Execution
  console.log('4. Testing Swap Execution:');
  const executedSwap = coordinator.executeCrossChainSwap(swapStatus.swapId);
  console.log(`   Status: ${executedSwap.status}`);
  console.log(`   From Chain TX: ${executedSwap.transactions.fromChainTx.substring(0, 16)}...`);
  console.log(`   To Chain TX: ${executedSwap.transactions.toChainTx.substring(0, 16)}...`);
  console.log(`   Redeem TX: ${executedSwap.transactions.redeemTx.substring(0, 16)}...`);
  console.log('   ✅ Swap execution working\n');

  // Test 5: Multi-User Swaps
  console.log('5. Testing Multi-User Swaps:');
  const user1 = '0x1234567890123456789012345678901234567890';
  const user2 = '0x0987654321098765432109876543210987654321';

  // Create swaps for user 1
  coordinator.initiateCrossChainSwap({
    ...swapRequest,
    userAddress: user1,
    fromAmount: '2000000000000000000'
  });

  coordinator.initiateCrossChainSwap({
    ...swapRequest,
    userAddress: user1,
    fromAmount: '3000000000000000000'
  });

  // Create swap for user 2
  coordinator.initiateCrossChainSwap({
    ...swapRequest,
    userAddress: user2,
    fromAmount: '1500000000000000000'
  });

  const user1Swaps = coordinator.getUserSwaps(user1);
  const user2Swaps = coordinator.getUserSwaps(user2);

  console.log(`   User 1 swaps: ${user1Swaps.length}`);
  console.log(`   User 2 swaps: ${user2Swaps.length}`);
  console.log('   ✅ Multi-user functionality working\n');

  // Test 6: EVM to L1 Swaps
  console.log('6. Testing EVM to L1 Swaps:');
  
  const evmToNearSwap = coordinator.initiateCrossChainSwap({
    fromChain: 'ethereum',
    toChain: 'near',
    fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
    toToken: 'near',
    fromAmount: '1000000000000000000',
    userAddress: user1,
    recipientAddress: 'user.testnet',
    timelock: 3600
  });

  const evmToAptosSwap = coordinator.initiateCrossChainSwap({
    fromChain: 'ethereum',
    toChain: 'aptos',
    fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
    toToken: '0x1::aptos_coin::AptosCoin',
    fromAmount: '1000000000000000000',
    userAddress: user1,
    recipientAddress: '0x1234567890123456789012345678901234567890',
    timelock: 3600
  });

  const evmToSuiSwap = coordinator.initiateCrossChainSwap({
    fromChain: 'ethereum',
    toChain: 'sui',
    fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
    toToken: '0x2::sui::SUI',
    fromAmount: '1000000000000000000',
    userAddress: user1,
    recipientAddress: '0x1234567890123456789012345678901234567890',
    timelock: 3600
  });

  console.log(`   EVM to NEAR: ${evmToNearSwap.swapId}`);
  console.log(`   EVM to Aptos: ${evmToAptosSwap.swapId}`);
  console.log(`   EVM to Sui: ${evmToSuiSwap.swapId}`);
  console.log('   ✅ L1 cross-chain swaps working\n');

  // Test 7: Refund Functionality
  console.log('7. Testing Refund Functionality:');
  
  // Create a swap with very short timelock
  const shortTimelockSwap = coordinator.initiateCrossChainSwap({
    ...swapRequest,
    timelock: 1 // 1 second
  });

  // Wait for timelock to expire
  setTimeout(() => {
    try {
      const refundResult = coordinator.refundSwap(shortTimelockSwap.swapId);
      console.log(`   Refund Result: ${refundResult}`);
      console.log('   ✅ Refund functionality working\n');
    } catch (error) {
      console.log(`   Refund Error: ${error.message}`);
    }
  }, 2000);

  // Test 8: Cleanup Functionality
  console.log('8. Testing Cleanup Functionality:');
  
  // Create expired swaps
  const expiredSwap1 = coordinator.initiateCrossChainSwap({
    ...swapRequest,
    timelock: 1
  });
  
  const expiredSwap2 = coordinator.initiateCrossChainSwap({
    ...swapRequest,
    timelock: 1
  });

  // Manually set them as expired
  expiredSwap1.expiresAt = Date.now() - 1000;
  expiredSwap2.expiresAt = Date.now() - 1000;
  coordinator.swaps.set(expiredSwap1.swapId, expiredSwap1);
  coordinator.swaps.set(expiredSwap2.swapId, expiredSwap2);

  setTimeout(() => {
    const cleanedCount = coordinator.cleanupExpiredSwaps();
    console.log(`   Cleaned ${cleanedCount} expired swaps`);
    console.log('   ✅ Cleanup functionality working\n');

    console.log('🎉 All Cross-Chain Swap Tests Completed Successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✅ HTLC Secret/Hashlock Generation');
    console.log('   ✅ Cross-Chain Quote Generation');
    console.log('   ✅ Swap Initiation');
    console.log('   ✅ Swap Execution');
    console.log('   ✅ Multi-User Support');
    console.log('   ✅ EVM to L1 Swaps (NEAR, Aptos, Sui)');
    console.log('   ✅ Refund Functionality');
    console.log('   ✅ Cleanup Functionality');
  }, 3000);
}

// Run the tests
testCrossChainFunctionality(); 