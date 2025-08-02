import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AptosService, createAptosService, APTOS_CONFIGS } from '../../src/services/aptos-service';

// Mock the Aptos SDK
jest.mock('aptos');

describe('AptosService', () => {
  let aptosService: AptosService;
  let mockAptosClient: any;
  let mockAptosAccount: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock AptosClient
    mockAptosClient = {
      getAccount: jest.fn(),
      getAccountResource: jest.fn(),
      submitTransaction: jest.fn(),
      waitForTransaction: jest.fn(),
      getLedgerInfo: jest.fn(),
    };

    // Create mock AptosAccount
    mockAptosAccount = {
      address: jest.fn().mockReturnValue('0x1234567890123456789012345678901234567890'),
      signTransaction: jest.fn(),
      signMultiAgentTransaction: jest.fn(),
    };

    // Mock the AptosClient constructor
    const { AptosClient } = require('aptos');
    AptosClient.mockImplementation(() => mockAptosClient);

    // Mock the AptosAccount constructor
    const { AptosAccount } = require('aptos');
    AptosAccount.mockImplementation(() => mockAptosAccount);

    // Create service instance
    aptosService = createAptosService(APTOS_CONFIGS.mainnet);
  });

  describe('initialization', () => {
    it('should initialize with mainnet config', () => {
      expect(aptosService).toBeDefined();
      expect(aptosService.isInitialized()).toBe(false);
    });

    it('should initialize account with private key', async () => {
      const privateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';
      
      await aptosService.initializeAccount(privateKey);

      expect(aptosService.isInitialized()).toBe(true);
      expect(aptosService.getAccountAddress()).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should handle initialization errors', async () => {
      const { AptosAccount } = require('aptos');
      AptosAccount.mockImplementation(() => {
        throw new Error('Invalid private key');
      });

      await expect(aptosService.initializeAccount('invalid_key')).rejects.toThrow('Invalid private key');
    });
  });

  describe('balance operations', () => {
    it('should get account balance', async () => {
      const accountAddress = '0x1234567890123456789012345678901234567890';
      const tokenAddress = '0x1::aptos_coin::AptosCoin';

      mockAptosClient.getAccountResource.mockResolvedValue({
        data: {
          coin: {
            value: '1000000000'
          }
        }
      });

      const balance = await aptosService.getAccountBalance(accountAddress, tokenAddress);

      expect(balance).toBe('1000000000');
      expect(mockAptosClient.getAccountResource).toHaveBeenCalledWith(
        accountAddress,
        `0x1::coin::CoinStore<${tokenAddress}>`
      );
    });

    it('should handle balance query errors', async () => {
      mockAptosClient.getAccountResource.mockRejectedValue(new Error('Resource not found'));

      await expect(
        aptosService.getAccountBalance('0x123', '0x1::aptos_coin::AptosCoin')
      ).rejects.toThrow('Resource not found');
    });
  });

  describe('HTLC operations', () => {
    beforeEach(async () => {
      await aptosService.initializeAccount('0x1234567890123456789012345678901234567890123456789012345678901234');
    });

    it('should create HTLC lock', async () => {
      const params = {
        hashlock: '0x1234567890123456789012345678901234567890123456789012345678901234',
        timelock: 3600,
        recipient: '0x0987654321098765432109876543210987654321',
        sender: '0x1234567890123456789012345678901234567890',
        amount: '1000000000',
        tokenAddress: '0x1::aptos_coin::AptosCoin'
      };

      mockAptosClient.submitTransaction.mockResolvedValue({
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      });

      const result = await aptosService.createHTLCLock(params);

      expect(result).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      expect(mockAptosClient.submitTransaction).toHaveBeenCalled();
    });

    it('should redeem HTLC', async () => {
      const htlcAddress = '0x1234567890123456789012345678901234567890';
      const preimage = '0x1234567890123456789012345678901234567890123456789012345678901234';
      const tokenAddress = '0x1::aptos_coin::AptosCoin';

      mockAptosClient.submitTransaction.mockResolvedValue({
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      });

      const result = await aptosService.redeemHTLC(htlcAddress, preimage, tokenAddress);

      expect(result).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      expect(mockAptosClient.submitTransaction).toHaveBeenCalled();
    });

    it('should refund HTLC', async () => {
      const htlcAddress = '0x1234567890123456789012345678901234567890';
      const tokenAddress = '0x1::aptos_coin::AptosCoin';

      mockAptosClient.submitTransaction.mockResolvedValue({
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      });

      const result = await aptosService.refundHTLC(htlcAddress, tokenAddress);

      expect(result).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      expect(mockAptosClient.submitTransaction).toHaveBeenCalled();
    });
  });

  describe('swap operations', () => {
    beforeEach(async () => {
      await aptosService.initializeAccount('0x1234567890123456789012345678901234567890123456789012345678901234');
    });

    it('should get swap quote', async () => {
      const params = {
        fromToken: '0x1::aptos_coin::AptosCoin',
        toToken: '0x1::coin::CoinStore<0x1::usdc::USDC>',
        fromAmount: '1000000000',
        dexAddress: '0x1234567890123456789012345678901234567890'
      };

      // Mock DEX quote response
      mockAptosClient.getAccountResource.mockResolvedValue({
        data: {
          toAmount: '950000000',
          price: '0.95',
          gasEstimate: '1000000',
          protocols: ['pancake_swap'],
          route: [
            {
              protocol: 'pancake_swap',
              fromToken: '0x1::aptos_coin::AptosCoin',
              toToken: '0x1::usdc::USDC',
              amount: '1000000000',
              fee: '50000000'
            }
          ]
        }
      });

      const quote = await aptosService.getSwapQuote(params);

      expect(quote).toBeDefined();
      expect(quote.fromToken).toBe(params.fromToken);
      expect(quote.toToken).toBe(params.toToken);
      expect(quote.fromAmount).toBe(params.fromAmount);
      expect(quote.toAmount).toBe('950000000');
      expect(quote.price).toBe('0.95');
    });

    it('should execute swap', async () => {
      const params = {
        fromToken: '0x1::aptos_coin::AptosCoin',
        toToken: '0x1::usdc::USDC',
        fromAmount: '1000000000',
        toAmount: '950000000',
        dexAddress: '0x1234567890123456789012345678901234567890'
      };

      mockAptosClient.submitTransaction.mockResolvedValue({
        hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      });

      const result = await aptosService.executeSwap(params);

      expect(result).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
      expect(mockAptosClient.submitTransaction).toHaveBeenCalled();
    });
  });

  describe('token operations', () => {
    it('should get supported tokens', async () => {
      const tokens = await aptosService.getSupportedTokens();

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
      const { secret, hashlock } = aptosService.generateSecretAndHashlock();

      expect(secret).toBeDefined();
      expect(hashlock).toBeDefined();
      expect(secret.length).toBe(64); // 32 bytes as hex
      expect(hashlock.length).toBe(64); // SHA256 hash as hex
    });

    it('should verify secret against hashlock', () => {
      const { secret, hashlock } = aptosService.generateSecretAndHashlock();
      
      const isValid = aptosService.verifySecret(secret, hashlock);
      expect(isValid).toBe(true);

      const isInvalid = aptosService.verifySecret('invalid_secret', hashlock);
      expect(isInvalid).toBe(false);
    });

    it('should generate consistent hashlock for same secret', () => {
      const secret = '0x1234567890123456789012345678901234567890123456789012345678901234';
      const hashlock1 = aptosService['sha256'](secret);
      const hashlock2 = aptosService['sha256'](secret);
      
      expect(hashlock1).toBe(hashlock2);
    });
  });

  describe('error handling', () => {
    it('should handle network errors gracefully', async () => {
      mockAptosClient.getAccountResource.mockRejectedValue(new Error('Network error'));

      await expect(
        aptosService.getAccountBalance('0x123', '0x1::aptos_coin::AptosCoin')
      ).rejects.toThrow('Network error');
    });

    it('should handle transaction submission errors', async () => {
      await aptosService.initializeAccount('0x1234567890123456789012345678901234567890123456789012345678901234');
      
      mockAptosClient.submitTransaction.mockRejectedValue(new Error('Insufficient balance'));

      const params = {
        hashlock: '0x1234567890123456789012345678901234567890123456789012345678901234',
        timelock: 3600,
        recipient: '0x0987654321098765432109876543210987654321',
        sender: '0x1234567890123456789012345678901234567890',
        amount: '1000000000',
        tokenAddress: '0x1::aptos_coin::AptosCoin'
      };

      await expect(aptosService.createHTLCLock(params)).rejects.toThrow('Insufficient balance');
    });
  });

  describe('configuration', () => {
    it('should support mainnet configuration', () => {
      const mainnetConfig = APTOS_CONFIGS.mainnet;
      expect(mainnetConfig.nodeUrl).toBe('https://fullnode.mainnet.aptoslabs.com/v1');
    });

    it('should support testnet configuration', () => {
      const testnetConfig = APTOS_CONFIGS.testnet;
      expect(testnetConfig.nodeUrl).toBe('https://fullnode.testnet.aptoslabs.com/v1');
    });

    it('should support devnet configuration', () => {
      const devnetConfig = APTOS_CONFIGS.devnet;
      expect(devnetConfig.nodeUrl).toBe('https://fullnode.devnet.aptoslabs.com/v1');
    });
  });
}); 