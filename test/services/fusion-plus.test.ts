import { FusionPlusService, createFusionPlusService, FUSION_PLUS_CONFIGS } from '../../src/services/fusion-plus';

describe('FusionPlusService', () => {
  let fusionPlusService: FusionPlusService;
  const testConfig = {
    apiKey: 'test-api-key',
    chainId: 1,
    privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/test'
  };

  beforeEach(() => {
    fusionPlusService = new FusionPlusService(testConfig);
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(fusionPlusService.getChainId()).toBe(1);
      expect(fusionPlusService.getWalletAddress()).toBe('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
    });
  });

  describe('getQuote', () => {
    it('should return a valid quote', async () => {
      const quote = await fusionPlusService.getQuote({
        fromToken: '0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B', // USDC
        toToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        fromAmount: '1000000000', // 1000 USDC
        chainId: 1
      });

      expect(quote).toHaveProperty('fromToken');
      expect(quote).toHaveProperty('toToken');
      expect(quote).toHaveProperty('fromAmount');
      expect(quote).toHaveProperty('toAmount');
      expect(quote).toHaveProperty('price');
      expect(quote).toHaveProperty('gasEstimate');
      expect(quote).toHaveProperty('protocols');
    });

    it('should handle errors gracefully', async () => {
      // Mock the Fusion SDK to throw an error
      const mockFusionSDK = {
        getQuote: jest.fn().mockRejectedValue(new Error('API Error'))
      };
      (fusionPlusService as any).fusionSDK = mockFusionSDK;

      await expect(fusionPlusService.getQuote({
        fromToken: '0xinvalid',
        toToken: '0xinvalid',
        fromAmount: '1000000000',
        chainId: 1
      })).rejects.toThrow('Failed to get quote: API Error');
    });
  });

  describe('executeSwap', () => {
    it('should execute a swap successfully', async () => {
      const result = await fusionPlusService.executeSwap({
        fromToken: '0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B', // USDC
        toToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        fromAmount: '1000000000', // 1000 USDC
        toAmount: '500000000000000000', // 0.5 WETH
        userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      });

      expect(result).toHaveProperty('orderHash');
      expect(result).toHaveProperty('status');
      expect(result.status).toBe('submitted');
    });
  });

  describe('getOrderStatus', () => {
    it('should return order status', async () => {
      const status = await fusionPlusService.getOrderStatus('0xorderhash');

      expect(status).toHaveProperty('orderHash');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('timestamp');
      expect(['pending', 'filled', 'cancelled', 'expired']).toContain(status.status);
    });
  });

  describe('getActiveOrders', () => {
    it('should return active orders', async () => {
      const orders = await fusionPlusService.getActiveOrders('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');

      expect(Array.isArray(orders)).toBe(true);
    });
  });

  describe('getNEARCrossChainQuote', () => {
    it('should return NEAR cross-chain quote', async () => {
      const quote = await fusionPlusService.getNEARCrossChainQuote({
        fromChain: 'ethereum',
        toChain: 'near',
        fromToken: '0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B', // USDC
        toToken: 'NEAR',
        fromAmount: '1000000000', // 1000 USDC
        toAmount: '1000000000000000000000000', // 1 NEAR
        userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        nearAccountId: 'user.near'
      });

      expect(quote).toHaveProperty('fromChain');
      expect(quote).toHaveProperty('toChain');
      expect(quote).toHaveProperty('fromToken');
      expect(quote).toHaveProperty('toToken');
      expect(quote).toHaveProperty('evmQuote');
      expect(quote).toHaveProperty('nearQuote');
      expect(quote).toHaveProperty('route');
    });

    it('should handle NEAR service not initialized', async () => {
      (fusionPlusService as any).nearService = null;

      await expect(fusionPlusService.getNEARCrossChainQuote({
        fromChain: 'ethereum',
        toChain: 'near',
        fromToken: '0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B',
        toToken: 'NEAR',
        fromAmount: '1000000000',
        toAmount: '1000000000000000000000000',
        userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        nearAccountId: 'user.near'
      })).rejects.toThrow('NEAR service not initialized');
    });
  });

  describe('getChainIdFromName', () => {
    it('should return correct chain IDs', () => {
      const service = fusionPlusService as any;
      
      expect(service.getChainIdFromName('ethereum')).toBe(1);
      expect(service.getChainIdFromName('polygon')).toBe(137);
      expect(service.getChainIdFromName('arbitrum')).toBe(42161);
      expect(service.getChainIdFromName('base')).toBe(8453);
      expect(service.getChainIdFromName('unknown')).toBe(1); // Default
    });
  });

  describe('mapOrderStatus', () => {
    it('should map order statuses correctly', () => {
      const service = fusionPlusService as any;
      
      expect(service.mapOrderStatus('pending')).toBe('pending');
      expect(service.mapOrderStatus('partially-filled')).toBe('pending');
      expect(service.mapOrderStatus('filled')).toBe('filled');
      expect(service.mapOrderStatus('cancelled')).toBe('cancelled');
      expect(service.mapOrderStatus('expired')).toBe('expired');
      expect(service.mapOrderStatus('false-predicate')).toBe('expired');
      expect(service.mapOrderStatus('unknown')).toBe('pending'); // Default
    });
  });
});

describe('createFusionPlusService', () => {
  it('should create a FusionPlusService instance', () => {
    const config = {
      apiKey: 'test-api-key',
      chainId: 1,
      privateKey: '0x1234567890123456789012345678901234567890123456789012345678901234',
      rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/test'
    };

    const service = createFusionPlusService(config);
    expect(service).toBeInstanceOf(FusionPlusService);
  });
});

describe('FUSION_PLUS_CONFIGS', () => {
  it('should have configurations for all networks', () => {
    expect(FUSION_PLUS_CONFIGS).toHaveProperty('mainnet');
    expect(FUSION_PLUS_CONFIGS).toHaveProperty('sepolia');
    expect(FUSION_PLUS_CONFIGS).toHaveProperty('arbitrum');
    expect(FUSION_PLUS_CONFIGS).toHaveProperty('polygon');
    expect(FUSION_PLUS_CONFIGS).toHaveProperty('base');
    expect(FUSION_PLUS_CONFIGS).toHaveProperty('near');
  });

  it('should have correct chain IDs', () => {
    expect(FUSION_PLUS_CONFIGS.mainnet.chainId).toBe(1);
    expect(FUSION_PLUS_CONFIGS.sepolia.chainId).toBe(11155111);
    expect(FUSION_PLUS_CONFIGS.arbitrum.chainId).toBe(42161);
    expect(FUSION_PLUS_CONFIGS.polygon.chainId).toBe(137);
    expect(FUSION_PLUS_CONFIGS.base.chainId).toBe(8453);
    expect(FUSION_PLUS_CONFIGS.near.chainId).toBe(1313161554);
  });
}); 