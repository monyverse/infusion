import { FusionPlusService, createFusionPlusService, FUSION_PLUS_CONFIGS } from '../../src/services/fusion-plus';

// Mock the Fusion SDK
jest.mock('@1inch/fusion-sdk', () => ({
  FusionSDK: jest.fn().mockImplementation(() => ({
    getQuote: jest.fn().mockResolvedValue({
      toTokenAmount: '1000000000000000000',
      prices: { usd: { toToken: '2000' } },
    }),
    createOrder: jest.fn().mockResolvedValue({
      hash: '0xorderhash',
      order: { orderHash: '0xorderhash' },
      quoteId: 'quote123',
    }),
    submitOrder: jest.fn().mockResolvedValue({
      orderHash: '0xorderhash',
    }),
    getOrderStatus: jest.fn().mockResolvedValue({
      status: 'pending',
      fills: [],
    }),
    getActiveOrders: jest.fn().mockResolvedValue([]),
  })),
}));

// Mock ethers
jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
      getGasPrice: jest.fn().mockResolvedValue('20000000000'),
    })),
    Wallet: jest.fn().mockImplementation(() => ({
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      signMessage: jest.fn().mockResolvedValue('0xsignature'),
      connect: jest.fn().mockReturnThis(),
    })),
  },
}));

describe('FusionPlusService', () => {
  let service: FusionPlusService;

  beforeEach(() => {
    service = createFusionPlusService(FUSION_PLUS_CONFIGS.sepolia);
  });

  describe('getQuote', () => {
    it('should get a quote successfully', async () => {
      const quote = await service.getQuote({
        fromToken: '0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B',
        toToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        fromAmount: '1000000000000000000',
        chainId: 11155111,
      });

      expect(quote).toBeDefined();
      expect(quote.fromToken).toBe('0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B');
      expect(quote.toToken).toBe('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
      expect(quote.fromAmount).toBe('1000000000000000000');
    });

    it('should handle errors gracefully', async () => {
      const mockFusionSDK = require('@1inch/fusion-sdk').FusionSDK;
      mockFusionSDK.mockImplementationOnce(() => ({
        getQuote: jest.fn().mockRejectedValue(new Error('API Error')),
      }));

      await expect(service.getQuote({
        fromToken: '0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B',
        toToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        fromAmount: '1000000000000000000',
        chainId: 11155111,
      })).rejects.toThrow('Failed to get quote');
    });
  });

  describe('executeSwap', () => {
    it('should execute a swap successfully', async () => {
      const result = await service.executeSwap({
        fromToken: '0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B',
        toToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        fromAmount: '1000000000000000000',
        toAmount: '500000000000000000',
        userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      });

      expect(result).toBeDefined();
      expect(result.orderHash).toBeDefined();
      expect(result.status).toBe('submitted');
    });
  });

  describe('getOrderStatus', () => {
    it('should get order status successfully', async () => {
      const status = await service.getOrderStatus('0xorderhash');

      expect(status).toBeDefined();
      expect(status.orderHash).toBe('0xorderhash');
      expect(status.status).toBe('pending');
    });
  });

  describe('getActiveOrders', () => {
    it('should get active orders successfully', async () => {
      const orders = await service.getActiveOrders('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');

      expect(orders).toBeDefined();
      expect(Array.isArray(orders)).toBe(true);
    });
  });

  describe('getWalletAddress', () => {
    it('should return wallet address', () => {
      const address = service.getWalletAddress();
      expect(address).toBe('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
    });
  });

  describe('getChainId', () => {
    it('should return chain ID', () => {
      const chainId = service.getChainId();
      expect(chainId).toBe(11155111);
    });
  });
}); 