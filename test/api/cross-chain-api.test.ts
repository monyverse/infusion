import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the cross-chain coordinator
jest.mock('../../src/services/cross-chain-coordinator');

describe('Cross-Chain API Endpoints', () => {
  let mockCoordinator: any;

  beforeAll(async () => {
    // Setup mock coordinator
    mockCoordinator = {
      getCrossChainQuote: jest.fn(),
      initiateCrossChainSwap: jest.fn(),
      executeCrossChainSwap: jest.fn(),
      getSwapStatus: jest.fn(),
      getUserSwaps: jest.fn(),
      refundSwap: jest.fn(),
    };

    // Mock the createCrossChainCoordinator function
    const { createCrossChainCoordinator } = require('../../src/services/cross-chain-coordinator');
    createCrossChainCoordinator.mockReturnValue(mockCoordinator);
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });

  describe('POST /api/cross-chain/quote', () => {
    it('should return quote for valid request', async () => {
      const mockQuote = {
        toAmount: '9500000000000000000',
        price: '0.95',
        gasEstimate: '500000'
      };

      mockCoordinator.getCrossChainQuote.mockResolvedValue(mockQuote);

      const requestBody = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890'
      };

      const request = new NextRequest('http://localhost:3000/api/cross-chain/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Import the route handler
      const { POST } = require('../../app/api/cross-chain/quote/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.quote).toEqual(mockQuote);
      expect(mockCoordinator.getCrossChainQuote).toHaveBeenCalledWith(requestBody);
    });

    it('should return error for missing parameters', async () => {
      const requestBody = {
        fromChain: 'ethereum',
        // Missing required parameters
      };

      const request = new NextRequest('http://localhost:3000/api/cross-chain/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const { POST } = require('../../app/api/cross-chain/quote/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should handle coordinator errors', async () => {
      mockCoordinator.getCrossChainQuote.mockRejectedValue(new Error('Network error'));

      const requestBody = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890'
      };

      const request = new NextRequest('http://localhost:3000/api/cross-chain/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const { POST } = require('../../app/api/cross-chain/quote/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Network error');
    });
  });

  describe('POST /api/cross-chain/initiate', () => {
    it('should initiate swap for valid request', async () => {
      const mockSwapStatus = {
        swapId: 'swap_1234567890_abc123',
        status: 'initiated',
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        hashlock: '0x1234567890123456789012345678901234567890123456789012345678901234',
        timelock: 3600,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        transactions: {}
      };

      mockCoordinator.initiateCrossChainSwap.mockResolvedValue(mockSwapStatus);

      const requestBody = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890',
        recipientAddress: '0x0987654321098765432109876543210987654321',
        timelock: 3600
      };

      const request = new NextRequest('http://localhost:3000/api/cross-chain/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const { POST } = require('../../app/api/cross-chain/initiate/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.swapStatus).toEqual(mockSwapStatus);
      expect(mockCoordinator.initiateCrossChainSwap).toHaveBeenCalledWith(requestBody);
    });

    it('should return error for missing parameters', async () => {
      const requestBody = {
        fromChain: 'ethereum',
        // Missing required parameters
      };

      const request = new NextRequest('http://localhost:3000/api/cross-chain/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const { POST } = require('../../app/api/cross-chain/initiate/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required parameters');
    });
  });

  describe('POST /api/cross-chain/execute', () => {
    it('should execute swap for valid request', async () => {
      const mockResult = {
        swapId: 'swap_1234567890_abc123',
        status: 'completed',
        fromChain: 'ethereum',
        toChain: 'polygon',
        transactions: {
          fromChainTx: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          toChainTx: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          redeemTx: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
        }
      };

      mockCoordinator.executeCrossChainSwap.mockResolvedValue(mockResult);

      const requestBody = {
        swapId: 'swap_1234567890_abc123',
        userAddress: '0x1234567890123456789012345678901234567890'
      };

      const request = new NextRequest('http://localhost:3000/api/cross-chain/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const { POST } = require('../../app/api/cross-chain/execute/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toEqual(mockResult);
      expect(mockCoordinator.executeCrossChainSwap).toHaveBeenCalledWith('swap_1234567890_abc123');
    });

    it('should return error for missing parameters', async () => {
      const requestBody = {
        // Missing required parameters
      };

      const request = new NextRequest('http://localhost:3000/api/cross-chain/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const { POST } = require('../../app/api/cross-chain/execute/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required parameters');
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parsing errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/cross-chain/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      });

      const { POST } = require('../../app/api/cross-chain/quote/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('should handle coordinator initialization errors', async () => {
      // Mock coordinator creation to throw error
      const { createCrossChainCoordinator } = require('../../src/services/cross-chain-coordinator');
      createCrossChainCoordinator.mockImplementation(() => {
        throw new Error('Failed to initialize coordinator');
      });

      const requestBody = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890'
      };

      const request = new NextRequest('http://localhost:3000/api/cross-chain/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const { POST } = require('../../app/api/cross-chain/quote/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to initialize coordinator');
    });
  });

  describe('Request Validation', () => {
    it('should validate chain names', async () => {
      const requestBody = {
        fromChain: 'invalid-chain',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890'
      };

      const request = new NextRequest('http://localhost:3000/api/cross-chain/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const { POST } = require('../../app/api/cross-chain/quote/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate token addresses', async () => {
      const requestBody = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: 'invalid-token-address',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '1000000000000000000',
        userAddress: '0x1234567890123456789012345678901234567890'
      };

      const request = new NextRequest('http://localhost:3000/api/cross-chain/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const { POST } = require('../../app/api/cross-chain/quote/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should validate amounts', async () => {
      const requestBody = {
        fromChain: 'ethereum',
        toChain: 'polygon',
        fromToken: '0xA0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        toToken: '0xB0b86a33E6441b8c4C8C8C8C8C8C8C8C8C8C8C8C',
        fromAmount: '0', // Invalid amount
        userAddress: '0x1234567890123456789012345678901234567890'
      };

      const request = new NextRequest('http://localhost:3000/api/cross-chain/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const { POST } = require('../../app/api/cross-chain/quote/route');
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
}); 