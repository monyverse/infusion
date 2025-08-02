import { NEARService, createNEARService, NEAR_CONFIGS } from '../../src/services/near-service';

describe('NEARService', () => {
  let nearService: NEARService;
  const testConfig = {
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
    walletUrl: 'https://wallet.testnet.near.org',
    helperUrl: 'https://helper.testnet.near.org',
    explorerUrl: 'https://explorer.testnet.near.org',
    accountId: 'test.near',
    privateKey: 'test-private-key'
  };

  beforeEach(() => {
    nearService = new NEARService(testConfig);
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(nearService).toBeInstanceOf(NEARService);
    });
  });

  describe('getAccountBalance', () => {
    it('should return account balance', async () => {
      const balance = await nearService.getAccountBalance('test.near');
      expect(typeof balance).toBe('string');
      expect(balance).toBe('1');
    });
  });

  describe('getTokenBalance', () => {
    it('should return token balance', async () => {
      const balance = await nearService.getTokenBalance(
        'test.near',
        'usdc.fakes.testnet'
      );
      expect(typeof balance).toBe('string');
    });
  });

  describe('transferNEAR', () => {
    it('should transfer NEAR tokens', async () => {
      const result = await nearService.transferNEAR('recipient.near', '1000000000000000000000000');
      expect(typeof result).toBe('string');
    });
  });

  describe('transferFT', () => {
    it('should transfer fungible tokens', async () => {
      const result = await nearService.transferFT(
        'usdc.fakes.testnet',
        'recipient.near',
        '1000000',
        'Test transfer'
      );
      expect(typeof result).toBe('string');
    });
  });

  describe('createFusionOrder', () => {
    it('should create a Fusion order', async () => {
      const order = await nearService.createFusionOrder({
        fromToken: 'usdc.fakes.testnet',
        toToken: 'weth.fakes.testnet',
        fromAmount: '1000000',
        toAmount: '500000000000000000',
        userAddress: 'test.near',
        timelock: 3600
      });

      expect(order).toHaveProperty('orderId');
      expect(order).toHaveProperty('fromToken');
      expect(order).toHaveProperty('toToken');
      expect(order).toHaveProperty('fromAmount');
      expect(order).toHaveProperty('toAmount');
      expect(order).toHaveProperty('userAddress');
      expect(order).toHaveProperty('hashlock');
      expect(order).toHaveProperty('timelock');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('createdAt');
      expect(order).toHaveProperty('expiresAt');
    });
  });

  describe('getSwapQuote', () => {
    it('should return a swap quote', async () => {
      const quote = await nearService.getSwapQuote({
        fromToken: 'usdc.fakes.testnet',
        toToken: 'weth.fakes.testnet',
        fromAmount: '1000000'
      });

      expect(quote).toHaveProperty('fromToken');
      expect(quote).toHaveProperty('toToken');
      expect(quote).toHaveProperty('fromAmount');
      expect(quote).toHaveProperty('toAmount');
      expect(quote).toHaveProperty('price');
      expect(quote).toHaveProperty('gasEstimate');
      expect(quote).toHaveProperty('protocols');
      expect(quote).toHaveProperty('route');
    });

    it('should return a quote with custom DEX', async () => {
      const quote = await nearService.getSwapQuote({
        fromToken: 'usdc.fakes.testnet',
        toToken: 'weth.fakes.testnet',
        fromAmount: '1000000',
        dexContractId: 'ref-finance-101.testnet'
      });

      expect(quote).toHaveProperty('fromToken');
      expect(quote).toHaveProperty('toToken');
      expect(quote).toHaveProperty('fromAmount');
      expect(quote).toHaveProperty('toAmount');
    });
  });

  describe('executeSwap', () => {
    it('should execute a swap', async () => {
      const result = await nearService.executeSwap({
        fromToken: 'usdc.fakes.testnet',
        toToken: 'weth.fakes.testnet',
        fromAmount: '1000000',
        toAmount: '500000000000000000',
        userAddress: 'test.near'
      });

      expect(typeof result).toBe('string');
    });
  });

  describe('verifySecret', () => {
    it('should verify a secret against hashlock', () => {
      const { secret, hashlock } = (nearService as any).generateSecretAndHashlock();
      const isValid = nearService.verifySecret(secret, hashlock);
      expect(isValid).toBe(true);
    });

    it('should reject invalid secret', () => {
      const { hashlock } = (nearService as any).generateSecretAndHashlock();
      const isValid = nearService.verifySecret('invalid-secret', hashlock);
      expect(isValid).toBe(false);
    });
  });

  describe('getSupportedTokens', () => {
    it('should return supported tokens', async () => {
      const tokens = await nearService.getSupportedTokens();
      expect(Array.isArray(tokens)).toBe(true);
      
      if (tokens.length > 0) {
        const token = tokens[0];
        expect(token).toHaveProperty('contractId');
        expect(token).toHaveProperty('symbol');
        expect(token).toHaveProperty('name');
        expect(token).toHaveProperty('decimals');
        expect(token).toHaveProperty('totalSupply');
      }
    });
  });

  describe('accountExists', () => {
    it('should check if account exists', async () => {
      const exists = await nearService.accountExists('test.near');
      expect(typeof exists).toBe('boolean');
    });
  });

  describe('getEscrowOrder', () => {
    it('should get escrow order', async () => {
      const order = await nearService.getEscrowOrder('order123');
      expect(order).toBeDefined();
    });
  });

  describe('fundEscrowOrder', () => {
    it('should fund escrow order', async () => {
      const result = await nearService.fundEscrowOrder('order123');
      expect(typeof result).toBe('string');
    });
  });

  describe('claimEscrowOrder', () => {
    it('should claim escrow order', async () => {
      const { secret } = (nearService as any).generateSecretAndHashlock();
      const result = await nearService.claimEscrowOrder('order123', secret);
      expect(typeof result).toBe('string');
    });
  });

  describe('createCrossChainSwap', () => {
    it('should create cross-chain swap', async () => {
      const swap = await nearService.createCrossChainSwap({
        evmOrderHash: '0xevmhash',
        evmAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        fromChain: 'ethereum',
        toChain: 'near',
        fromToken: '0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B',
        toToken: 'usdc.fakes.testnet',
        fromAmount: '1000000000',
        toAmount: '1000000',
        hashlock: 'hashlock123',
        timelock: 3600
      });

      expect(swap).toHaveProperty('swapId');
      expect(swap).toHaveProperty('evmOrderHash');
      expect(swap).toHaveProperty('nearOrderId');
      expect(swap).toHaveProperty('status');
    });
  });

  describe('getCrossChainSwap', () => {
    it('should get cross-chain swap', async () => {
      const swap = await nearService.getCrossChainSwap('swap123');
      expect(swap).toBeDefined();
    });
  });
});

describe('createNEARService', () => {
  it('should create a NEARService instance', () => {
    const config = {
      networkId: 'testnet',
      nodeUrl: 'https://rpc.testnet.near.org',
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org'
    };

    const service = createNEARService(config);
    expect(service).toBeInstanceOf(NEARService);
  });
});

describe('NEAR_CONFIGS', () => {
  it('should have configurations for mainnet and testnet', () => {
    expect(NEAR_CONFIGS).toHaveProperty('mainnet');
    expect(NEAR_CONFIGS).toHaveProperty('testnet');
  });

  it('should have correct network IDs', () => {
    expect(NEAR_CONFIGS.mainnet.networkId).toBe('mainnet');
    expect(NEAR_CONFIGS.testnet.networkId).toBe('testnet');
  });

  it('should have correct URLs', () => {
    expect(NEAR_CONFIGS.mainnet.nodeUrl).toBe('https://rpc.mainnet.near.org');
    expect(NEAR_CONFIGS.testnet.nodeUrl).toBe('https://rpc.testnet.near.org');
    expect(NEAR_CONFIGS.mainnet.walletUrl).toBe('https://wallet.near.org');
    expect(NEAR_CONFIGS.testnet.walletUrl).toBe('https://wallet.testnet.near.org');
  });
}); 