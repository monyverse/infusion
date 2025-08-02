import { config } from 'dotenv';

// Load environment variables for tests
config({ path: '.env.test' });

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch for API tests
global.fetch = jest.fn();

// Mock crypto for browser compatibility
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: jest.fn(),
    subtle: {
      generateKey: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
    },
  },
});

// Mock localStorage for browser compatibility
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock as Storage;

// Mock sessionStorage
global.sessionStorage = localStorageMock as Storage;

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    ethereum: {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
    },
    location: {
      href: 'http://localhost:3000',
    },
  },
});

// Test timeout
jest.setTimeout(30000); 