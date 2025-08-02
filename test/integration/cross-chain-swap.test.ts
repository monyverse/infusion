import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { createCrossChainCoordinator } from '../../src/services/cross-chain-coordinator';
import { FusionPlusService } from '../../src/services/fusion-plus';
import { NEARService } from '../../src/services/near-service';
import { AptosService } from '../../src/services/aptos-service';
import { SuiService } from '../../src/services/sui-service';

// Mock the services for integration testing
jest.mock('../../src/services/fusion-plus');
jest.mock('../../src/services/near-service');
jest.mock('../../src/services/aptos-service');
jest.mock('../../src/services/sui-service');

describe('Cross-Chain Swap Integration Tests', () => {
  let coordinator: any;
  let mockFusionService: any;
  let mockNearService: any;
  let mockAptosService: any;
  let mockSuiService: any;

  beforeAll(async () => {
    // Setup mocks
    mockFusionService = {
      getCrossChainQuote: jest.fn().mockResolvedValue({
        toAmount: '9500000000000000000',
        price: '0.95',
        gasEstimate: '500000'
      }),
      executeCrossChainSwap: jest.fn().mockResolvedValue({
        orderHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        status: 'submitted'
      }),
      getQuote: jest.fn().mockResolvedValue({
        toAmount: '9500000000000000000',
        price: '0.95',
        gasEstimate: '500000'
      }),
      executeSwap: jest.fn().mockResolvedValue({
        orderHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        status: 'submitted'
      }),
    };

    mockNearService = {
      getSwapQuote: jest.fn().mockResolvedValue({
        toAmount: '9500000000000000000',
        price: '0.95',
        gasEstimate: '1000000000000000'
      }),
      createFusionOrder: jest.fn().mockResolvedValue({
        orderId: 'near_order_123',
        status: 'created',
        hashlock: '0x1234567890123456789012345678901234567890123456789012345678901234',
        secret: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        expiresAt: Date.now() + 3600000
      }),
      getAccountBalance: jest.fn().mockResolvedValue('1000000000000000000000000000'),
    };

    mockAptosService = {
      getSwapQuote: jest.fn().mockResolvedValue({
        toAmount: '950000000',
        price: '0.95',
        gasEstimate: '1000000',
        protocols: ['pancake_swap'],
        route: []
      }),
      createHTLCLock: jest.fn().mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
      redeemHTLC: jest.fn().mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
      refundHTLC: jest.fn().mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
      getAccountBalance: jest.fn().mockResolvedValue('1000000000'),
    };

    mockSuiService = {
      getSwapQuote: jest.fn().mockResolvedValue({
        toAmount: '950000000',
        price: '0.95',
        gasEstimate: '1000000',
        protocols: ['cetus_swap'],
        route: []
      }),
      createHTLCLock: jest.fn().mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
      redeemHTLC: jest.fn().mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
      refundHTLC: jest.fn().mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'),
      getAccountBalance: jest.fn().mockResolvedValue('1000000000'),
    };

    // Create coordinator instance
    coordinator = createCrossChainCoordinator();
  });

  afterAll(async () => {
    // Cleanup
    jest.clearAllMocks();
  });

  describe('EVM to EVM Cross-Chain Swap', () => {
    it('should complete full EVM to EVM swap flow', async () => {
      const request = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000', // 1 ETH
        userAddress: '0x1234567890123456789012345678901234567890',
        recipientAddress: '0x0987654321098765432109876543210987654321',
        timelock: 3600
      };

      // Step 1: Get quote
      const quote = await coordinator.getCrossChainQuote(request);
      expect(quote).toBeDefined();
      expect(quote.toAmount).toBe('9500000000000000000');
      expect(quote.price).toBe('0.95');

      // Step 2: Initiate swap
      const swapStatus = await coordinator.initiateCrossChainSwap(request);
      expect(swapStatus).toBeDefined();
      expect(swapStatus.status).toBe('initiated');
      expect(swapStatus.swapId).toBeDefined();
      expect(swapStatus.hashlock).toBeDefined();

      // Step 3: Execute swap
      const result = await coordinator.executeCrossChainSwap(swapStatus.swapId);
      expect(result).toBeDefined();
      expect(result.status).toBe('completed');

      // Step 4: Verify swap status
      const finalStatus = coordinator.getSwapStatus(swapStatus.swapId);
      expect(finalStatus).toBeDefined();
      expect(finalStatus?.status).toBe('completed');
    });
  });

  describe('EVM to NEAR Cross-Chain Swap', () => {
    it('should complete full EVM to NEAR swap flow', async () => {
      const request = {
        fromChain: 'ethereum',
        toChain: 'near',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: 'near',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        recipientAddress: 'user.testnet',
        timelock: 3600
      };

      // Step 1: Get quote
      const quote = await coordinator.getCrossChainQuote(request);
      expect(quote).toBeDefined();
      expect(quote.toAmount).toBe('9500000000000000000');

      // Step 2: Initiate swap
      const swapStatus = await coordinator.initiateCrossChainSwap(request);
      expect(swapStatus).toBeDefined();
      expect(swapStatus.status).toBe('initiated');
      expect(swapStatus.fromChain).toBe('ethereum');
      expect(swapStatus.toChain).toBe('near');

      // Step 3: Execute swap
      const result = await coordinator.executeCrossChainSwap(swapStatus.swapId);
      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
    });
  });

  describe('EVM to Aptos Cross-Chain Swap', () => {
    it('should complete full EVM to Aptos swap flow', async () => {
      const request = {
        fromChain: 'ethereum',
        toChain: 'aptos',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0x1::aptos_coin::AptosCoin',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        recipientAddress: '0x1234567890123456789012345678901234567890',
        timelock: 3600
      };

      // Step 1: Get quote
      const quote = await coordinator.getCrossChainQuote(request);
      expect(quote).toBeDefined();
      expect(quote.toAmount).toBe('9500000000000000000');

      // Step 2: Initiate swap
      const swapStatus = await coordinator.initiateCrossChainSwap(request);
      expect(swapStatus).toBeDefined();
      expect(swapStatus.status).toBe('initiated');
      expect(swapStatus.fromChain).toBe('ethereum');
      expect(swapStatus.toChain).toBe('aptos');

      // Step 3: Execute swap
      const result = await coordinator.executeCrossChainSwap(swapStatus.swapId);
      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
    });
  });

  describe('EVM to Sui Cross-Chain Swap', () => {
    it('should complete full EVM to Sui swap flow', async () => {
      const request = {
        fromChain: 'ethereum',
        toChain: 'sui',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0x2::sui::SUI',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        recipientAddress: '0x1234567890123456789012345678901234567890',
        timelock: 3600
      };

      // Step 1: Get quote
      const quote = await coordinator.getCrossChainQuote(request);
      expect(quote).toBeDefined();
      expect(quote.toAmount).toBe('9500000000000000000');

      // Step 2: Initiate swap
      const swapStatus = await coordinator.initiateCrossChainSwap(request);
      expect(swapStatus).toBeDefined();
      expect(swapStatus.status).toBe('initiated');
      expect(swapStatus.fromChain).toBe('ethereum');
      expect(swapStatus.toChain).toBe('sui');

      // Step 3: Execute swap
      const result = await coordinator.executeCrossChainSwap(swapStatus.swapId);
      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
    });
  });

  describe('Multi-User Swap Management', () => {
    it('should handle multiple users with multiple swaps', async () => {
      const user1 = '0x1234567890123456789012345678901234567890';
      const user2 = '0x0987654321098765432109876543210987654321';

      // Create swaps for user 1
      const swap1 = await coordinator.initiateCrossChainSwap({
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: user1
      });

      const swap2 = await coordinator.initiateCrossChainSwap({
        fromChain: 'ethereum',
        toChain: 'near',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: 'near',
        fromAmount: '2000000000000000000',
        userAddress: user1
      });

      // Create swap for user 2
      const swap3 = await coordinator.initiateCrossChainSwap({
        fromChain: 'polygon',
        toChain: 'ethereum',
        fromToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1500000000000000000',
        userAddress: user2
      });

      // Get user swaps
      const user1Swaps = coordinator.getUserSwaps(user1);
      const user2Swaps = coordinator.getUserSwaps(user2);

      expect(user1Swaps.length).toBeGreaterThanOrEqual(2);
      expect(user2Swaps.length).toBeGreaterThanOrEqual(1);
      expect(user1Swaps.every(swap => swap.userAddress === user1)).toBe(true);
      expect(user2Swaps.every(swap => swap.userAddress === user2)).toBe(true);
    });
  });

  describe('Error Recovery and Refunds', () => {
    it('should handle failed swaps and refunds', async () => {
      const request = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        timelock: 1 // Very short timelock for testing
      };

      // Initiate swap
      const swapStatus = await coordinator.initiateCrossChainSwap(request);
      expect(swapStatus.status).toBe('initiated');

      // Wait for timelock to expire
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Attempt to refund
      const refundResult = await coordinator.refundSwap(swapStatus.swapId);
      expect(refundResult).toContain('refunded');

      // Verify final status
      const finalStatus = coordinator.getSwapStatus(swapStatus.swapId);
      expect(finalStatus?.status).toBe('refunded');
    });

    it('should cleanup expired swaps', async () => {
      const request = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        timelock: 1 // Very short timelock for testing
      };

      // Create multiple expired swaps
      await coordinator.initiateCrossChainSwap(request);
      await coordinator.initiateCrossChainSwap(request);
      await coordinator.initiateCrossChainSwap(request);

      // Wait for timelock to expire
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Cleanup expired swaps
      const cleanedCount = coordinator.cleanupExpiredSwaps();
      expect(cleanedCount).toBeGreaterThan(0);
    });
  });

  describe('HTLC Security', () => {
    it('should generate and verify secure secrets and hashlocks', async () => {
      const { secret, hashlock } = coordinator['generateSecretAndHashlock']();

      // Verify secret and hashlock properties
      expect(secret).toBeDefined();
      expect(hashlock).toBeDefined();
      expect(secret.length).toBe(64); // 32 bytes as hex
      expect(hashlock.length).toBe(64); // SHA256 hash as hex

      // Verify secret verification
      const isValid = coordinator['verifySecret'](secret, hashlock);
      expect(isValid).toBe(true);

      const isInvalid = coordinator['verifySecret']('invalid_secret', hashlock);
      expect(isInvalid).toBe(false);

      // Verify hashlock consistency
      const hashlock1 = coordinator['sha256'](secret);
      const hashlock2 = coordinator['sha256'](secret);
      expect(hashlock1).toBe(hashlock2);
    });
  });

  describe('Chain Validation', () => {
    it('should correctly validate supported chains', () => {
      // Test EVM chains
      expect(coordinator['isEVMChain']('ethereum')).toBe(true);
      expect(coordinator['isEVMChain']('polygon')).toBe(true);
      expect(coordinator['isEVMChain']('arbitrum')).toBe(true);
      expect(coordinator['isEVMChain']('base')).toBe(true);

      // Test L1 chains
      expect(coordinator['isEVMChain']('near')).toBe(false);
      expect(coordinator['isEVMChain']('aptos')).toBe(false);
      expect(coordinator['isEVMChain']('sui')).toBe(false);

      // Test chain IDs
      expect(coordinator['getChainId']('ethereum')).toBe(1);
      expect(coordinator['getChainId']('polygon')).toBe(137);
      expect(coordinator['getChainId']('arbitrum')).toBe(42161);
      expect(coordinator['getChainId']('base')).toBe(8453);
    });
  });
}); 