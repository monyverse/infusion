// Export all BTC utilities
export { BitcoinHTLCScripts, BitcoinHTLCUtils } from './scripts/htlc-scripts';
export { BitcoinTransactionBuilder, BitcoinTransactionUtils } from './utils/transaction-builder';
export { BitcoinKeyManager, BitcoinKeyUtils } from './utils/key-manager';
export { BitcoinConfig, BitcoinNetworkUtils } from './config/network-config';

// Re-export types for convenience
export type { Order, OrderType, OrderStatus } from '../order-manager';
export type { ReverseOrder } from '../reverse/reverse-order-manager'; 