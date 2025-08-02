// Test setup file for Jest

// Mock environment variables for testing
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });
Object.defineProperty(process.env, 'INCH_API_KEY', { value: 'test-api-key', writable: true });
Object.defineProperty(process.env, 'OPENAI_API_KEY', { value: 'test-openai-key', writable: true });
Object.defineProperty(process.env, 'PRIVATE_KEY', { value: '0x1234567890123456789012345678901234567890123456789012345678901234', writable: true });
Object.defineProperty(process.env, 'ETHEREUM_RPC_URL', { value: 'https://eth-mainnet.g.alchemy.com/v2/test', writable: true });
Object.defineProperty(process.env, 'SEPOLIA_RPC_URL', { value: 'https://sepolia.drpc.org', writable: true });
Object.defineProperty(process.env, 'NEAR_RPC_URL', { value: 'https://rpc.testnet.near.org', writable: true });
Object.defineProperty(process.env, 'NEAR_ACCOUNT_ID', { value: 'test.near', writable: true });
Object.defineProperty(process.env, 'NEAR_PRIVATE_KEY', { value: 'test-near-key', writable: true });
Object.defineProperty(process.env, 'JWT_SECRET', { value: 'test-jwt-secret', writable: true });

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: componentWillReceiveProps') ||
        args[0].includes('Warning: componentWillUpdate'))
    ) {
      return;
    }
    originalConsoleWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.fetch = jest.fn();

// Mock ethers.js
jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
      getGasPrice: jest.fn().mockResolvedValue('20000000000'),
      getBlockNumber: jest.fn().mockResolvedValue(1000000),
    })),
    Wallet: jest.fn().mockImplementation(() => ({
      address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
      signMessage: jest.fn().mockResolvedValue('0xsignature'),
      signTransaction: jest.fn().mockResolvedValue('0xsignedtx'),
      connect: jest.fn().mockReturnThis(),
    })),
    Contract: jest.fn().mockImplementation(() => ({
      interface: {
        encodeFunctionData: jest.fn().mockReturnValue('0xencoded'),
        parseLog: jest.fn().mockReturnValue({}),
      },
      functions: {
        balanceOf: jest.fn().mockResolvedValue('1000000000000000000000'),
        transfer: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue({}) }),
        approve: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue({}) }),
      },
      estimateGas: jest.fn().mockResolvedValue('21000'),
    })),
  },
}));

// Mock 1inch Fusion SDK
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

// Mock NEAR SDK
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

// Mock Bitcoin libraries
jest.mock('bitcoinjs-lib', () => ({
  networks: {
    testnet: { bech32: 'tb' },
    mainnet: { bech32: 'bc' },
  },
  ECPair: {
    fromPrivateKey: jest.fn().mockReturnValue({
      publicKey: Buffer.from('test-public-key'),
      address: 'test-address',
    }),
  },
  payments: {
    p2pkh: jest.fn().mockReturnValue({ address: 'test-address' }),
    p2sh: jest.fn().mockReturnValue({ address: 'test-address' }),
    p2wpkh: jest.fn().mockReturnValue({ address: 'test-address' }),
  },
}));

// Mock crypto for hash functions
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue(Buffer.from('test-hash')),
  }),
  randomBytes: jest.fn().mockReturnValue(Buffer.from('test-random')),
}));

// Mock fs for file operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('{}'),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
}));

// Mock path
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn().mockImplementation((...args) => args.join('/')),
  resolve: jest.fn().mockImplementation((...args) => args.join('/')),
}));

// Global test timeout
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
}); 