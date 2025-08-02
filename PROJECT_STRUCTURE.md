# Project Structure Documentation

## Overview

The UniteAI Wallet project has been restructured to follow modern Next.js App Router conventions with a clean, scalable architecture. All backend functionality has been consolidated into a single Express.js server.

## Directory Structure

```
uniteai-wallet/
├── 📁 app/                          # Next.js App Router (Pages)
│   ├── 📄 globals.css              # Global Tailwind CSS styles
│   ├── 📄 layout.tsx               # Root layout component
│   └── 📄 page.tsx                 # Home page component
│
├── 📁 src/                          # Source code
│   ├── 📁 components/              # React components
│   │   ├── 📁 ai/                 # AI-related components
│   │   │   └── 📄 ai-automation-dashboard.tsx
│   │   ├── 📁 chains/             # Blockchain/swap components
│   │   │   └── 📄 multi-chain-swap.tsx
│   │   ├── 📁 gamification/       # Achievement/game components
│   │   │   └── 📄 achievement-card.tsx
│   │   ├── 📁 ui/                 # Reusable UI components
│   │   │   ├── 📄 button.tsx
│   │   │   └── 📄 api-test.tsx
│   │   └── 📄 index.ts            # Component exports
│   │
│   ├── 📁 lib/                    # Utility libraries
│   │   └── 📄 utils.ts            # Common utility functions
│   │
│   ├── 📁 types/                  # TypeScript type definitions
│   │   ├── 📄 ai.ts               # AI-related types
│   │   └── 📄 chains.ts           # Blockchain types
│   │
│   ├── 📁 utils/                  # Utility functions
│   │   ├── 📄 1inch-api.ts        # 1inch API integration
│   │   └── 📄 logger.ts           # Logging utilities
│   │
│   ├── 📁 hooks/                  # Custom React hooks
│   │   ├── 📄 useFusionPlus.ts    # Fusion+ integration hook
│   │   └── 📄 index.ts            # Hook exports
│   │
│   ├── 📁 services/               # External service integrations
│   │   └── 📄 fusion-plus.ts      # 1inch Fusion+ service
│   │
│   ├── 📁 ai/                     # AI agent management
│   │   ├── 📁 agents/             # AI agent implementations
│   │   │   ├── 📄 base-agent.ts   # Base agent class
│   │   │   └── 📄 portfolio-agent.ts # Portfolio management agent
│   │   ├── 📁 strategies/         # Trading strategies
│   │   ├── 📁 training/           # AI training scripts
│   │   ├── 📁 simulation/         # Trading simulations
│   │   ├── 📄 agent-manager.ts    # Agent orchestration
│   │   └── 📄 simple-agent-manager.js
│   │
│   ├── 📁 backend/                # Express.js backend server (CONSOLIDATED)
│   │   ├── 📁 api/                # API route handlers
│   │   ├── 📁 middleware/         # Express middleware
│   │   ├── 📁 services/           # Backend services
│   │   ├── 📄 server.ts           # Main server file
│   │   └── 📄 simple-server.js    # Consolidated development server
│   │
│   └── 📁 contracts/              # Smart contracts
│       ├── 📁 bridges/            # Cross-chain bridge contracts
│       │   └── 📄 BitcoinBridge.sol
│       ├── 📁 core/               # Core wallet contracts
│       │   └── 📄 UniteAIWallet.sol
│       ├── 📁 htlc/               # HTLC contracts
│       │   └── 📄 HTLCFactory.sol
│       ├── 📁 limit-order-protocol/ # Limit order contracts
│       │   └── 📄 CustomLimitOrder.sol
│       ├── 📁 mocks/              # Mock contracts for testing
│       │   └── 📄 MockERC20.sol
│       └── 📁 strategies/         # Strategy contracts
│
├── 📁 test/                        # Test files
│   ├── 📁 ai/                     # AI tests
│   ├── 📁 contracts/              # Contract tests
│   └── 📁 integration/            # Integration tests
│
├── 📁 scripts/                     # Deployment and utility scripts
│   ├── 📄 deploy.ts               # Contract deployment
│   ├── 📄 deploy-testnet.ts       # Testnet deployment
│   ├── 📄 verify.ts               # Contract verification
│   └── 📄 git-workflow.sh         # Git workflow automation
│
├── 📁 config/                      # Configuration files
│   └── (configuration files)
│
├── 📄 package.json                 # Dependencies and scripts
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 next.config.js              # Next.js configuration
├── 📄 hardhat.config.ts           # Hardhat configuration
├── 📄 env.example                 # Environment variables template
├── 📄 env.local                   # Local environment variables
├── 📄 API_ENDPOINTS.md            # API documentation
├── 📄 PROJECT_STRUCTURE.md        # This file
├── 📄 README.md                   # Project documentation
└── 📄 .gitignore                  # Git ignore rules
```

## Key Improvements Made

### 1. **Clean Next.js App Router Structure**
- Removed duplicate `src/frontend/` directory
- Consolidated to single `app/` directory for pages
- Fixed Next.js configuration warnings

### 2. **Organized Source Code**
- Moved all components to `src/components/`
- Created proper component categories (ai, chains, gamification, ui)
- Added component index file for clean exports

### 3. **Consolidated Backend Architecture**
- **Removed separate `1inch-express-proxy/` directory**
- **Integrated all proxy functionality into main backend**
- **Single Express.js server** handling all endpoints:
  - General 1inch proxy (`/?url=...`)
  - Dedicated 1inch proxy (`/api/1inch/proxy`)
  - Fusion+ endpoints (`/api/fusion-plus/*`)
  - AI automation endpoints (`/api/ai/*`)
  - Portfolio management (`/api/portfolio/*`)
  - Health checks (`/api/health`)

### 4. **Enhanced 1inch Integration**
- **URL validation** (only allows 1inch domains)
- **Automatic API key injection**
- **Comprehensive error handling**
- **CORS support**
- **Timeout management**
- **Both GET and POST proxy support**

### 5. **Path Mapping**
- Added TypeScript path mapping in `tsconfig.json`
- Clean imports using `@/` prefix
- Organized imports by category

### 6. **Modern Development Setup**
- Updated Next.js configuration
- Removed deprecated options
- Added proper TypeScript configuration

## Import Patterns

### Before (Relative imports)
```typescript
import { MultiChainSwap } from '../components/chains/multi-chain-swap';
import { utils } from '../../lib/utils';
```

### After (Path mapping)
```typescript
import { MultiChainSwap } from '@/components/chains/multi-chain-swap';
import { utils } from '@/lib/utils';
```

## Component Organization

### AI Components (`src/components/ai/`)
- AI automation dashboard
- Intent processing interface
- Agent status displays

### Chain Components (`src/components/chains/`)
- Multi-chain swap interface
- Chain selection components
- Bridge components

### Gamification Components (`src/components/gamification/`)
- Achievement cards
- Progress tracking
- Reward displays

### UI Components (`src/components/ui/`)
- Reusable UI elements
- Button components
- Form components
- API testing interface

## Backend Architecture

### Consolidated Server (`src/backend/simple-server.js`)
The main backend server now handles all functionality:

#### Proxy Endpoints
- `GET /?url=<encoded_url>` - General 1inch proxy
- `POST /?url=<encoded_url>` - General 1inch proxy (POST)
- `GET /api/1inch/proxy?url=<encoded_url>` - Dedicated 1inch proxy

#### Fusion+ Endpoints
- `POST /api/fusion-plus/quote` - Get swap quotes
- `POST /api/fusion-plus/swap` - Execute swaps
- `POST /api/fusion-plus/cross-chain-quote` - Cross-chain quotes
- `POST /api/fusion-plus/cross-chain-swap` - Cross-chain swaps

#### AI Endpoints
- `POST /api/ai/process-intent` - Process natural language intent
- `GET /api/ai/status` - Get AI agent status

#### Portfolio Endpoints
- `GET /api/portfolio/balance/:address/:chainId` - Get portfolio balance

#### Health & Status
- `GET /api/health` - Health check with service status

### Security Features
- **URL validation** - Only allows 1inch API endpoints
- **API key management** - Automatic injection from environment
- **Error handling** - Comprehensive error responses
- **Rate limiting** - Built-in request throttling
- **CORS support** - Cross-origin request handling

## Development Workflow

1. **Components**: Add new components to appropriate category in `src/components/`
2. **Types**: Define types in `src/types/` with descriptive names
3. **Utils**: Add utility functions to `src/lib/` or `src/utils/`
4. **Services**: External integrations go in `src/services/`
5. **Hooks**: Custom React hooks in `src/hooks/`
6. **Backend**: All API endpoints in `src/backend/simple-server.js`

## Benefits of New Structure

1. **Scalability**: Easy to add new features and components
2. **Maintainability**: Clear separation of concerns
3. **Developer Experience**: Clean imports and path mapping
4. **Performance**: Optimized Next.js App Router setup
5. **Testing**: Organized test structure
6. **Documentation**: Clear project structure documentation
7. **Consolidation**: Single backend server reduces complexity
8. **Security**: Enhanced proxy validation and error handling

## Migration Notes

- All existing functionality preserved
- No breaking changes to API endpoints
- Backward compatible imports maintained
- Development server runs without warnings
- **Removed duplicate proxy implementation**
- **Enhanced error handling and validation**
- **Improved API documentation**

## Environment Variables

The consolidated backend uses these environment variables:

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

## Running the Application

```bash
# Start all services
npm run dev

# Start only backend
npm run dev:backend

# Start only frontend
npm run dev:frontend

# Start only AI manager
npm run dev:ai
```

The consolidated backend runs on `http://localhost:3001` and provides all the necessary endpoints for the frontend to interact with 1inch APIs, AI services, and portfolio management. 