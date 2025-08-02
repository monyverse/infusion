import { NEARService, createNEARService, NEAR_CONFIGS } from '../../src/services/near-service';

// Mock NEAR API
jest.mock('near-api-js', () => ({
  connect: jest.fn().mockResolvedValue({
    account: jest.fn().mockReturnValue({
      viewFunction: jest.fn().mockResolvedValue({}),
      functionCall: jest.fn().mockResolvedValue({}),
      getAccountBalance: jest.fn().mockResolvedValue('1000000000000000000000000'),
    }),
  }),
  keyStores: {
    InMemoryKeyStore: jest.fn().mockImplementation(() => ({
      setKey: jest.fn(),
      getKey: jest.fn().mockResolvedValue({}),
    })),
  },
  KeyPair: {
    fromString: jest.fn().mockReturnValue({}),
  },
  utils: {
    format: {
      parseNearAmount: jest.fn().mockReturnValue('1000000000000000000000000'),
      formatNearAmount: jest.fn().mockReturnValue('1'),
    },
  },
}));

describe('NEARService', () => {
  let service: NEARService;

  beforeEach(() => {
    service = createNEARService(NEAR_CONFIGS.testnet);
  });

  describe('getAccountBalance', () => {
    it('should get account balance successfully', async () => {
      const balance = await service.getAccountBalance('test.near');
      expect(balance).toBeDefined();
      expect(typeof balance).toBe('string');
    });

    it('should handle errors gracefully', async () => {
      const mockNear = require('near-api-js');
      mockNear.connect.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getAccountBalance('test.near')).rejects.toThrow();
    });
  });

  describe('getTokenBalance', () => {
    it('should get token balance successfully', async () => {
      const balance = await service.getTokenBalance('test.near', 'usdc.fakes.testnet');
      expect(balance).toBeDefined();
      expect(typeof balance).toBe('string');
    });
  });

  describe('transferNEAR', () => {
    it('should transfer NEAR successfully', async () => {
      const result = await service.transferNEAR('recipient.near', '1');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('transferFT', () => {
    it('should transfer fungible token successfully', async () => {
      const result = await service.transferFT(
        'usdc.fakes.testnet',
        'recipient.near',
        '1000000',
        'Test transfer'
      );
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('createFusionOrder', () => {
    it('should create fusion order successfully', async () => {
      const order = await service.createFusionOrder({
        fromToken: 'usdc.fakes.testnet',
        toToken: 'usdt.fakes.testnet',
        fromAmount: '1000000',
        toAmount: '1000000',
        userAddress: 'test.near',
        timelock: 3600,
      });

      expect(order).toBeDefined();
      expect(order.orderId).toBeDefined();
      expect(order.status).toBe('pending');
    });
  });

  describe('getSwapQuote', () => {
    it('should get swap quote successfully', async () => {
      const quote = await service.getSwapQuote({
        fromToken: 'usdc.fakes.testnet',
        toToken: 'usdt.fakes.testnet',
        fromAmount: '1000000',
      });

      expect(quote).toBeDefined();
      expect(quote.fromToken).toBe('usdc.fakes.testnet');
      expect(quote.toToken).toBe('usdt.fakes.testnet');
      expect(quote.fromAmount).toBe('1000000');
    });
  });

  describe('executeSwap', () => {
    it('should execute swap successfully', async () => {
      const result = await service.executeSwap({
        fromToken: 'usdc.fakes.testnet',
        toToken: 'usdt.fakes.testnet',
        fromAmount: '1000000',
        toAmount: '1000000',
        userAddress: 'test.near',
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('getSupportedTokens', () => {
    it('should get supported tokens successfully', async () => {
      const tokens = await service.getSupportedTokens();
      expect(tokens).toBeDefined();
      expect(Array.isArray(tokens)).toBe(true);
    });
  });

  describe('accountExists', () => {
    it('should check if account exists', async () => {
      const exists = await service.accountExists('test.near');
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('verifySecret', () => {
    it('should verify secret correctly', () => {
      const secret = 'test-secret';
      const hashlock = 'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3';
      
      const isValid = service.verifySecret(secret, hashlock);
      expect(typeof isValid).toBe('boolean');
    });
  });
}); 