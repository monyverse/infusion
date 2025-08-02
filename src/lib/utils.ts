import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAddress(address: string, length: number = 6): string {
  if (!address) return '';
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function generateGradient(colors: string[]): string {
  return `linear-gradient(135deg, ${colors.join(', ')})`;
}

export function getChainColor(chainId: string): string {
  const colors: Record<string, string> = {
    'ethereum': '#627EEA',
    'bitcoin': '#F7931A',
    'stellar': '#000000',
    'near': '#000000',
    'aptos': '#00D4AA',
    'sui': '#6FBCF0',
    'tron': '#FF0000',
    'cosmos': '#2E3148',
    'ton': '#0088CC',
    'monad': '#FF6B35',
    'starknet': '#00FF00',
    'cardano': '#0033AD',
    'xrp': '#23292F',
    'icp': '#FF6B6B',
    'tezos': '#2C7DF7',
    'polkadot': '#E6007A',
    'etherlink': '#2C7DF7',
  };
  return colors[chainId] || '#6B7280';
}

export function getChainIcon(chainId: string): string {
  const icons: Record<string, string> = {
    'ethereum': '🔷',
    'bitcoin': '🟡',
    'stellar': '💫',
    'near': '🌐',
    'aptos': '🟢',
    'sui': '🌊',
    'tron': '⚡',
    'cosmos': '🌌',
    'ton': '📱',
    'monad': '🏎️',
    'starknet': '🛡️',
    'cardano': '🔷',
    'xrp': '🏛️',
    'icp': '🖥️',
    'tezos': '🗳️',
    'polkadot': '🔴',
    'etherlink': '🔗',
  };
  return icons[chainId] || '🔗';
}

export function getChainName(chainId: string): string {
  const names: Record<string, string> = {
    'ethereum': 'Ethereum',
    'bitcoin': 'Bitcoin',
    'stellar': 'Stellar',
    'near': 'NEAR',
    'aptos': 'Aptos',
    'sui': 'Sui',
    'tron': 'TRON',
    'cosmos': 'Cosmos',
    'ton': 'TON',
    'monad': 'Monad',
    'starknet': 'Starknet',
    'cardano': 'Cardano',
    'xrp': 'XRP Ledger',
    'icp': 'Internet Computer',
    'tezos': 'Tezos',
    'polkadot': 'Polkadot',
    'etherlink': 'Etherlink',
  };
  return names[chainId] || 'Unknown Chain';
}

export function calculateProgress(current: number, total: number): number {
  return Math.min((current / total) * 100, 100);
}

export function getRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
} 