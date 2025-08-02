import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CrossChainCoordinator, createCrossChainCoordinator } from '../../src/services/cross-chain-coordinator';
import { FusionPlusService } from '../../src/services/fusion-plus';
import { NEARService } from '../../src/services/near-service';
import { AptosService } from '../../src/services/aptos-service';
import { SuiService } from '../../src/services/sui-service';

// Mock the services
jest.mock('../../src/services/fusion-plus');
jest.mock('../../src/services/near-service');
jest.mock('../../src/services/aptos-service');
jest.mock('../../src/services/sui-service');

describe('CrossChainCoordinator', () => {
  let coordinator: CrossChainCoordinator;
  let mockFusionService: jest.Mocked<FusionPlusService>;
  let mockNearService: jest.Mocked<NEARService>;
  let mockAptosService: jest.Mocked<AptosService>;
  let mockSuiService: jest.Mocked<SuiService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockFusionService = {
      getCrossChainQuote: jest.fn(),
      executeCrossChainSwap: jest.fn(),
      getQuote: jest.fn(),
      executeSwap: jest.fn(),
    } as any;

    mockNearService = {
      getSwapQuote: jest.fn(),
      createFusionOrder: jest.fn(),
      getAccountBalance: jest.fn(),
    } as any;

    mockAptosService = {
      getSwapQuote: jest.fn(),
      createHTLCLock: jest.fn(),
      redeemHTLC: jest.fn(),
      refundHTLC: jest.fn(),
      getAccountBalance: jest.fn(),
    } as any;

    mockSuiService = {
      getSwapQuote: jest.fn(),
      createHTLCLock: jest.fn(),
      redeemHTLC: jest.fn(),
      refundHTLC: jest.fn(),
      getAccountBalance: jest.fn(),
    } as any;

    // Create coordinator instance
    coordinator = createCrossChainCoordinator();
  });

  describe('initiateCrossChainSwap', () => {
    it('should initiate EVM to EVM cross-chain swap', async () => {
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

      const result = await coordinator.initiateCrossChainSwap(request);

      expect(result).toBeDefined();
      expect(result.swapId).toBeDefined();
      expect(result.status).toBe('initiated');
      expect(result.fromChain).toBe('ethereum');
      expect(result.toChain).toBe('polygon');
      expect(result.hashlock).toBeDefined();
      expect(result.timelock).toBe(3600);
    });

    it('should initiate EVM to NEAR cross-chain swap', async () => {
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

      const result = await coordinator.initiateCrossChainSwap(request);

      expect(result).toBeDefined();
      expect(result.swapId).toBeDefined();
      expect(result.status).toBe('initiated');
      expect(result.fromChain).toBe('ethereum');
      expect(result.toChain).toBe('near');
    });

    it('should initiate EVM to Aptos cross-chain swap', async () => {
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

      const result = await coordinator.initiateCrossChainSwap(request);

      expect(result).toBeDefined();
      expect(result.swapId).toBeDefined();
      expect(result.status).toBe('initiated');
      expect(result.fromChain).toBe('ethereum');
      expect(result.toChain).toBe('aptos');
    });

    it('should initiate EVM to Sui cross-chain swap', async () => {
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

      const result = await coordinator.initiateCrossChainSwap(request);

      expect(result).toBeDefined();
      expect(result.swapId).toBeDefined();
      expect(result.status).toBe('initiated');
      expect(result.fromChain).toBe('ethereum');
      expect(result.toChain).toBe('sui');
    });

    it('should throw error for unsupported chain', async () => {
      const request = {
        fromChain: 'ethereum',
        toChain: 'unsupported-chain',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890'
      };

      await expect(coordinator.initiateCrossChainSwap(request)).rejects.toThrow();
    });
  });

  describe('getCrossChainQuote', () => {
    it('should get quote for EVM to EVM swap', async () => {
      const request = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890'
      };

      const result = await coordinator.getCrossChainQuote(request);

      expect(result).toBeDefined();
      expect(result.toAmount).toBeDefined();
      expect(result.price).toBeDefined();
      expect(result.gasEstimate).toBeDefined();
    });

    it('should get quote for EVM to L1 swap', async () => {
      const request = {
        fromChain: 'ethereum',
        toChain: 'near',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: 'near',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890'
      };

      const result = await coordinator.getCrossChainQuote(request);

      expect(result).toBeDefined();
      expect(result.toAmount).toBeDefined();
      expect(result.price).toBeDefined();
      expect(result.gasEstimate).toBeDefined();
    });
  });

  describe('executeCrossChainSwap', () => {
    it('should execute a complete cross-chain swap', async () => {
      // First initiate a swap
      const request = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        recipientAddress: '0x0987654321098765432109876543210987654321',
        timelock: 3600
      };

      const swapStatus = await coordinator.initiateCrossChainSwap(request);
      
      // Then execute the swap
      const result = await coordinator.executeCrossChainSwap(swapStatus.swapId);

      expect(result).toBeDefined();
      expect(result.swapId).toBe(swapStatus.swapId);
      expect(result.status).toBe('completed');
    });

    it('should handle swap execution failure', async () => {
      const invalidSwapId = 'invalid_swap_id';
      
      await expect(coordinator.executeCrossChainSwap(invalidSwapId)).rejects.toThrow();
    });
  });

  describe('getSwapStatus', () => {
    it('should return swap status for valid swap ID', async () => {
      const request = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890'
      };

      const swapStatus = await coordinator.initiateCrossChainSwap(request);
      const status = coordinator.getSwapStatus(swapStatus.swapId);

      expect(status).toBeDefined();
      expect(status?.swapId).toBe(swapStatus.swapId);
      expect(status?.status).toBe('initiated');
    });

    it('should return null for invalid swap ID', () => {
      const status = coordinator.getSwapStatus('invalid_swap_id');
      expect(status).toBeNull();
    });
  });

  describe('getUserSwaps', () => {
    it('should return swaps for a user', async () => {
      const userAddress = '0x1234567890123456789012345678901234567890';
      
      // Create multiple swaps for the user
      const request1 = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress
      };

      const request2 = {
        fromChain: 'ethereum',
        toChain: 'near',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: 'near',
        fromAmount: '2000000000000000000',
        userAddress
      };

      await coordinator.initiateCrossChainSwap(request1);
      await coordinator.initiateCrossChainSwap(request2);

      const userSwaps = coordinator.getUserSwaps(userAddress);

      expect(userSwaps).toBeDefined();
      expect(userSwaps.length).toBeGreaterThanOrEqual(2);
      expect(userSwaps.every(swap => swap.userAddress === userAddress)).toBe(true);
    });
  });

  describe('refundSwap', () => {
    it('should refund an expired swap', async () => {
      const request = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        timelock: 1 // Very short timelock for testing
      };

      const swapStatus = await coordinator.initiateCrossChainSwap(request);
      
      // Wait for timelock to expire
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await coordinator.refundSwap(swapStatus.swapId);

      expect(result).toBeDefined();
      expect(result).toContain('refunded');
    });
  });

  describe('cleanupExpiredSwaps', () => {
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

      await coordinator.initiateCrossChainSwap(request);
      
      // Wait for timelock to expire
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const cleanedCount = coordinator.cleanupExpiredSwaps();

      expect(cleanedCount).toBeGreaterThan(0);
    });
  });

  describe('HTLC functionality', () => {
    it('should generate valid secret and hashlock', () => {
      const { secret, hashlock } = coordinator['generateSecretAndHashlock']();

      expect(secret).toBeDefined();
      expect(hashlock).toBeDefined();
      expect(secret.length).toBe(64); // 32 bytes as hex
      expect(hashlock.length).toBe(64); // SHA256 hash as hex
    });

    it('should verify secret against hashlock', () => {
      const { secret, hashlock } = coordinator['generateSecretAndHashlock']();
      
      const isValid = coordinator['verifySecret'](secret, hashlock);
      expect(isValid).toBe(true);

      const isInvalid = coordinator['verifySecret']('invalid_secret', hashlock);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Chain validation', () => {
    it('should correctly identify EVM chains', () => {
      expect(coordinator['isEVMChain']('ethereum')).toBe(true);
      expect(coordinator['isEVMChain']('polygon')).toBe(true);
      expect(coordinator['isEVMChain']('arbitrum')).toBe(true);
      expect(coordinator['isEVMChain']('near')).toBe(false);
      expect(coordinator['isEVMChain']('aptos')).toBe(false);
      expect(coordinator['isEVMChain']('sui')).toBe(false);
    });

    it('should return correct chain IDs', () => {
      expect(coordinator['getChainId']('ethereum')).toBe(1);
      expect(coordinator['getChainId']('polygon')).toBe(137);
      expect(coordinator['getChainId']('arbitrum')).toBe(42161);
      expect(coordinator['getChainId']('base')).toBe(8453);
    });
  });
}); 