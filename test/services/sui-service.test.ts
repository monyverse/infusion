import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SuiService, createSuiService, SUI_CONFIGS } from '../../src/services/sui-service';

// Mock the Sui SDK
jest.mock('@mysten/sui.js/client');
jest.mock('@mysten/sui.js/keypairs/ed25519');
jest.mock('@mysten/sui.js/utils');

describe('SuiService', () => {
  let suiService: SuiService;
  let mockSuiClient: any;
  let mockEd25519Keypair: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock SuiClient
    mockSuiClient = {
      getBalance: jest.fn(),
      getObject: jest.fn(),
      executeTransactionBlock: jest.fn(),
      getTransactionBlock: jest.fn(),
      getLatestSuiSystemState: jest.fn(),
    };

    // Create mock Ed25519Keypair
    mockEd25519Keypair = {
      getPublicKey: jest.fn().mockReturnValue({ toSuiAddress: jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890') }),
      signTransactionBlock: jest.fn(),
      export: jest.fn(),
    };

    // Mock the SuiClient constructor
    const { SuiClient } = require('@mysten/sui.js/client');
    SuiClient.mockImplementation(() => mockSuiClient);

    // Mock the Ed25519Keypair constructor
    const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
    Ed25519Keypair.mockImplementation(() => mockEd25519Keypair);

    // Mock fromB64 utility
    const { fromB64 } = require('@mysten/sui.js/utils');
    fromB64.mockImplementation((str: string) => str);

    // Create service instance
    suiService = createSuiService(SUI_CONFIGS.mainnet);
  });

  describe('initialization', () => {
    it('should initialize with mainnet config', () => {
      expect(suiService).toBeDefined();
      expect(suiService.isInitialized()).toBe(false);
    });

    it('should initialize account with private key', async () => {
      const privateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';
      
      await suiService.initializeAccount(privateKey);

      expect(suiService.isInitialized()).toBe(true);
      expect(suiService.getAccountAddress()).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should handle initialization errors', async () => {
      const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
      Ed25519Keypair.mockImplementation(() => {
        throw new Error('Invalid private key');
      });

      await expect(suiService.initializeAccount('invalid_key')).rejects.toThrow('Invalid private key');
    });
  });

  describe('balance operations', () => {
    it('should get account balance', async () => {
      const accountAddress = '0x1234567890123456789012345678901234567890';
      const coinType = '0x2::sui::SUI';

      mockSuiClient.getBalance.mockResolvedValue({
        totalBalance: '1000000000',
        coinType: coinType,
        coinObjectCount: 1,
        lockedBalance: {},
        pendingBalance: {},
      });

      const balance = await suiService.getAccountBalance(accountAddress, coinType);

      expect(balance).toBe('1000000000');
      expect(mockSuiClient.getBalance).toHaveBeenCalledWith({
        owner: accountAddress,
        coinType: coinType
      });
    });

    it('should handle balance query errors', async () => {
      mockSuiClient.getBalance.mockRejectedValue(new Error('Account not found'));

      await expect(
        suiService.getAccountBalance('0x123', '0x2::sui::SUI')
      ).rejects.toThrow('Account not found');
    });
  });

  describe('HTLC operations', () => {
    beforeEach(async () => {
      await suiService.initializeAccount('0x1234567890123456789012345678901234567890123456789012345678901234');
    });

    it('should create HTLC lock', async () => {
      const params = {
        hashlock: '0x1234567890123456789012345678901234567890123456789012345678901234',
        timelock: 3600,
        recipient: '0x0987654321098765432109876543210987654321',
        sender: '0x1234567890123456789012345678901234567890',
        amount: '1000000000',
        coinType: '0x2::sui::SUI'
      };

      mockSuiClient.executeTransactionBlock.mockResolvedValue({
        digest: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      });

      const result = await suiService.createHTLCLock(params);

      expect(result).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      expect(mockSuiClient.executeTransactionBlock).toHaveBeenCalled();
    });

    it('should redeem HTLC', async () => {
      const htlcObjectId = '0x1234567890123456789012345678901234567890';
      const preimage = '0x1234567890123456789012345678901234567890123456789012345678901234';
      const coinType = '0x2::sui::SUI';

      mockSuiClient.executeTransactionBlock.mockResolvedValue({
        digest: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      });

      const result = await suiService.redeemHTLC(htlcObjectId, preimage, coinType);

      expect(result).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      expect(mockSuiClient.executeTransactionBlock).toHaveBeenCalled();
    });

    it('should refund HTLC', async () => {
      const htlcObjectId = '0x1234567890123456789012345678901234567890';
      const coinType = '0x2::sui::SUI';

      mockSuiClient.executeTransactionBlock.mockResolvedValue({
        digest: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      });

      const result = await suiService.refundHTLC(htlcObjectId, coinType);

      expect(result).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      expect(mockSuiClient.executeTransactionBlock).toHaveBeenCalled();
    });
  });

  describe('swap operations', () => {
    beforeEach(async () => {
      await suiService.initializeAccount('0x1234567890123456789012345678901234567890123456789012345678901234');
    });

    it('should get swap quote', async () => {
      const params = {
        fromToken: '0x2::sui::SUI',
        toToken: '0x2::coin::Coin<0x2::usdc::USDC>',
        fromAmount: '1000000000',
        dexAddress: '0x1234567890123456789012345678901234567890'
      };

      // Mock DEX quote response
      mockSuiClient.getObject.mockResolvedValue({
        data: {
          toAmount: '950000000',
          price: '0.95',
          gasEstimate: '1000000',
          protocols: ['cetus_swap'],
          route: [
            {
              protocol: 'cetus_swap',
              fromToken: '0x2::sui::SUI',
              toToken: '0x2::usdc::USDC',
              amount: '1000000000',
              fee: '50000000'
            }
          ]
        }
      });

      const quote = await suiService.getSwapQuote(params);

      expect(quote).toBeDefined();
      expect(quote.fromToken).toBe(params.fromToken);
      expect(quote.toToken).toBe(params.toToken);
      expect(quote.fromAmount).toBe(params.fromAmount);
      expect(quote.toAmount).toBe('950000000');
      expect(quote.price).toBe('0.95');
    });

    it('should execute swap', async () => {
      const params = {
        fromToken: '0x2::sui::SUI',
        toToken: '0x2::usdc::USDC',
        fromAmount: '1000000000',
        toAmount: '950000000',
        dexAddress: '0x1234567890123456789012345678901234567890'
      };

      mockSuiClient.executeTransactionBlock.mockResolvedValue({
        digest: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      });

      const result = await suiService.executeSwap(params);

      expect(result).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      expect(mockSuiClient.executeTransactionBlock).toHaveBeenCalled();
    });
  });

  describe('token operations', () => {
    it('should get supported tokens', async () => {
      const tokens = await suiService.getSupportedTokens();

      expect(tokens).toBeDefined();
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
      
      // Check token structure
      const firstToken = tokens[0];
      expect(firstToken).toHaveProperty('address');
      expect(firstToken).toHaveProperty('symbol');
      expect(firstToken).toHaveProperty('name');
      expect(firstToken).toHaveProperty('decimals');
    });
  });

  describe('utility functions', () => {
    it('should generate secret and hashlock', () => {
      const { secret, hashlock } = suiService.generateSecretAndHashlock();

      expect(secret).toBeDefined();
      expect(hashlock).toBeDefined();
      expect(secret.length).toBe(64); // 32 bytes as hex
      expect(hashlock.length).toBe(64); // SHA256 hash as hex
    });

    it('should verify secret against hashlock', () => {
      const { secret, hashlock } = suiService.generateSecretAndHashlock();
      
      const isValid = suiService.verifySecret(secret, hashlock);
      expect(isValid).toBe(true);

      const isInvalid = suiService.verifySecret('invalid_secret', hashlock);
      expect(isInvalid).toBe(false);
    });

    it('should generate consistent hashlock for same secret', () => {
      const secret = '0x1234567890123456789012345678901234567890123456789012345678901234';
      const hashlock1 = suiService['sha256'](secret);
      const hashlock2 = suiService['sha256'](secret);
      
      expect(hashlock1).toBe(hashlock2);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSuiClient.getBalance.mockRejectedValue(new Error('Network error'));

      await expect(
        suiService.getAccountBalance('0x123', '0x2::sui::SUI')
      ).rejects.toThrow('Network error');
    });

    it('should handle transaction submission errors', async () => {
      await suiService.initializeAccount('0x1234567890123456789012345678901234567890123456789012345678901234');
      
      mockSuiClient.executeTransactionBlock.mockRejectedValue(new Error('Insufficient balance'));

      const params = {
        hashlock: '0x1234567890123456789012345678901234567890123456789012345678901234',
        timelock: 3600,
        recipient: '0x0987654321098765432109876543210987654321',
        sender: '0x1234567890123456789012345678901234567890',
        amount: '1000000000',
        coinType: '0x2::sui::SUI'
      };

      await expect(suiService.createHTLCLock(params)).rejects.toThrow('Insufficient balance');
    });
  });

  describe('configuration', () => {
    it('should support mainnet configuration', () => {
      const mainnetConfig = SUI_CONFIGS.mainnet;
      expect(mainnetConfig.nodeUrl).toBe('https://fullnode.mainnet.sui.io:443');
    });

    it('should support testnet configuration', () => {
      const testnetConfig = SUI_CONFIGS.testnet;
      expect(testnetConfig.nodeUrl).toBe('https://fullnode.testnet.sui.io:443');
    });

    it('should support devnet configuration', () => {
      const devnetConfig = SUI_CONFIGS.devnet;
      expect(devnetConfig.nodeUrl).toBe('https://fullnode.devnet.sui.io:443');
    });
  });
}); 