# API Endpoints Documentation

## Overview

The UniteAI Wallet backend provides various API endpoints for AI automation, 1inch integration, and proxy services. All functionality has been consolidated into a single backend server.

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://your-domain.com`

## Available Endpoints

### 🔍 Health Check

**GET** `/api/health`

Check if the backend server is running and verify service status.

```bash
curl http://localhost:3001/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-02T11:03:43.711Z",
  "services": {
    "backend": true,
    "ai": true,
    "oneinch": true
  }
}
```

### 🤖 AI Endpoints

#### Process AI Intent

**POST** `/api/ai/process-intent`

Process natural language intent for AI automation.

```bash
curl -X POST http://localhost:3001/api/ai/process-intent \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "Rebalance my portfolio to 60% ETH, 30% BTC, 10% stablecoins",
    "context": {}
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "intent": "Rebalance my portfolio to 60% ETH, 30% BTC, 10% stablecoins",
    "action": "swap",
    "parameters": {
      "fromToken": "USDC",
      "toToken": "ETH",
      "amount": "100",
      "chain": "ethereum"
    },
    "confidence": 0.95,
    "timestamp": "2025-08-02T11:03:43.711Z"
  }
}
```

#### Get AI Agent Status

**GET** `/api/ai/status`

Get the status of all AI agents.

```bash
curl http://localhost:3001/api/ai/status
```

**Response:**
```json
{
  "status": "active",
  "agents": ["portfolio-manager", "risk-assessor"],
  "uptime": "2h 15m",
  "timestamp": "2025-08-02T11:03:43.711Z"
}
```

### 🌐 1inch Proxy Endpoints

#### General Proxy (GET)

**GET** `/?url=<encoded_url>`

Proxy GET requests to any 1inch API endpoint with automatic authentication.

```bash
curl "http://localhost:3001/?url=https://api.1inch.dev/swap/v6.0/1/tokens"
```

**Features:**
- Automatic 1inch API key injection
- URL validation (only allows 1inch domains)
- Error handling and timeout management
- CORS support

#### General Proxy (POST)

**POST** `/?url=<encoded_url>`

Proxy POST requests to any 1inch API endpoint with automatic authentication.

```bash
curl -X POST "http://localhost:3001/" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.1inch.dev/swap/v6.0/1/swap",
    "data": {
      "src": "0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B",
      "dst": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "amount": "1000000",
      "from": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
    }
  }'
```

#### Dedicated 1inch Proxy

**GET** `/api/1inch/proxy?url=<encoded_url>`

Dedicated proxy endpoint for 1inch API requests.

```bash
curl "http://localhost:3001/api/1inch/proxy?url=https://api.1inch.dev/fusion/orders/v1.0/1/order/active"
```

### 🔥 Fusion+ Endpoints

#### Get Fusion+ Quote

**POST** `/api/fusion-plus/quote`

Get a quote for a Fusion+ swap.

```bash
curl -X POST http://localhost:3001/api/fusion-plus/quote \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B",
    "toToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "fromAmount": "1000000",
    "chainId": "1",
    "userAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  }'
```

#### Execute Fusion+ Swap

**POST** `/api/fusion-plus/swap`

Execute a Fusion+ swap order.

```bash
curl -X POST http://localhost:3001/api/fusion-plus/swap \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B",
    "toToken": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "fromAmount": "1000000",
    "toAmount": "980000",
    "userAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "chainId": "1"
  }'
```

#### Get Cross-Chain Quote

**POST** `/api/fusion-plus/cross-chain-quote`

Get a quote for a cross-chain swap.

```bash
curl -X POST http://localhost:3001/api/fusion-plus/cross-chain-quote \
  -H "Content-Type: application/json" \
  -d '{
    "fromChainId": "1",
    "toChainId": "137",
    "fromToken": "0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B",
    "toToken": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    "fromAmount": "1000000",
    "userAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  }'
```

#### Execute Cross-Chain Swap

**POST** `/api/fusion-plus/cross-chain-swap`

Execute a cross-chain swap.

```bash
curl -X POST http://localhost:3001/api/fusion-plus/cross-chain-swap \
  -H "Content-Type: application/json" \
  -d '{
    "fromChainId": "1",
    "toChainId": "137",
    "fromToken": "0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B",
    "toToken": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    "fromAmount": "1000000",
    "toAmount": "980000",
    "userAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  }'
```

### 💱 Legacy 1inch Endpoints

#### Get Swap Quote (Legacy)

**POST** `/api/1inch/quote`

Get a swap quote (legacy endpoint for backward compatibility).

```bash
curl -X POST http://localhost:3001/api/1inch/quote \
  -H "Content-Type: application/json" \
  -d '{
    "fromToken": "ETH",
    "toToken": "USDC",
    "amount": "1.0",
    "chainId": "1"
  }'
```

### 📊 Portfolio Management

#### Get Portfolio Balance

**GET** `/api/portfolio/balance/:address/:chainId`

Get portfolio balance for a specific address and chain.

```bash
curl http://localhost:3001/api/portfolio/balance/0x1234.../1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x1234...",
    "chainId": 1,
    "tokens": [
      {
        "symbol": "ETH",
        "balance": "2.5",
        "valueUSD": "7500",
        "priceUSD": "3000"
      },
      {
        "symbol": "USDC",
        "balance": "5000",
        "valueUSD": "5000",
        "priceUSD": "1"
      }
    ],
    "totalValueUSD": "12500",
    "timestamp": "2025-08-02T11:03:43.711Z"
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "status": 400
}
```

Common error codes:
- `400` - Bad Request (missing parameters or invalid URL)
- `401` - Unauthorized (invalid API key)
- `404` - Endpoint not found
- `500` - Internal server error

## Authentication

### 1inch API Key

The proxy endpoints automatically use the 1inch API key from your environment variables:

```env
INCH_API_KEY=your_1inch_api_key_here
```

### Headers

The proxy endpoints automatically add the following headers to requests:

```javascript
{
  'Authorization': `Bearer ${INCH_API_KEY}`,
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'User-Agent': 'UniteAI-Wallet/1.0'
}
```

## URL Validation

The proxy endpoints validate URLs to ensure they only access 1inch API endpoints:

- ✅ `https://api.1inch.dev/*`
- ✅ `https://fusion.1inch.io/*`
- ❌ Any other domain (blocked)

## Usage Examples

### 1. Get Supported Tokens

```bash
curl "http://localhost:3001/?url=https://api.1inch.dev/swap/v6.0/1/tokens"
```

### 2. Get Active Orders

```bash
curl "http://localhost:3001/?url=https://api.1inch.dev/fusion/orders/v1.0/1/order/active"
```

### 3. Get Order History

```bash
curl "http://localhost:3001/?url=https://api.1inch.dev/fusion/orders/v1.0/1/order/history"
```

### 4. Execute a Swap

```bash
curl -X POST "http://localhost:3001/" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.1inch.dev/swap/v6.0/1/swap",
    "data": {
      "src": "0xA0b86a33E6441b8c4aC0C8e8B2dD4C8F1E9f5A2B",
      "dst": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "amount": "1000000",
      "from": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      "slippage": 1
    }
  }'
```

### 5. Process AI Intent

```bash
curl -X POST http://localhost:3001/api/ai/process-intent \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "Swap 1 ETH to USDC",
    "context": {
      "walletAddress": "0x1234...",
      "chainId": "1"
    }
  }'
```

## Rate Limiting

- **1inch API**: Follows 1inch API rate limits
- **AI Endpoints**: No rate limiting in development
- **General**: 100 requests per minute per IP

## Development

### Starting the Server

```bash
npm run dev:backend
```

### Testing Endpoints

```bash
# Test health check
curl http://localhost:3001/api/health

# Test proxy
curl "http://localhost:3001/?url=https://api.1inch.dev/swap/v6.0/1/tokens"

# Test AI intent
curl -X POST http://localhost:3001/api/ai/process-intent \
  -H "Content-Type: application/json" \
  -d '{"intent": "test", "context": {}}'
```

## Environment Variables

Required environment variables in `.env.local`:

```env
# 1inch API
INCH_API_KEY=your_1inch_api_key

# AI Services
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Blockchain RPC URLs
ETHEREUM_RPC_URL=your_ethereum_rpc
BITCOIN_RPC_URL=your_bitcoin_rpc
```

## Architecture

The backend is now fully consolidated with:

- **Single Express.js server** handling all endpoints
- **Integrated 1inch proxy** with validation and error handling
- **Fusion+ endpoints** for advanced swap functionality
- **AI automation** endpoints for intent processing
- **Portfolio management** endpoints for balance tracking
- **Comprehensive error handling** and logging

---

For more information, see the main [README.md](./README.md) file. 