import btcLogo from '../assets/btc.png';
import bnbLogo from '../assets/bnb.png';
import usdtLogo from '../assets/usdt.png';
import ethLogo from '../assets/eth.png';
import solLogo from '../assets/sol.png';
import xrpLogo from '../assets/XRP.png';
import dataService from './dataService';

export interface AssetConfig {
  symbol: string;
  name: string;
  color: string;
  icon: string;
  logoUrl: string;
  coinGeckoId?: string; // CoinGecko ID for price fetching (e.g., 'bitcoin', 'ethereum')
  enabled?: boolean; // Visibility toggle (default: true)
  network?: string; // Underlying blockchain network
}

// Default asset configurations
export const defaultAssetConfig: AssetConfig[] = [
  { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin', color: 'bg-orange-500', icon: '₿', logoUrl: btcLogo, coinGeckoId: 'bitcoin', enabled: true },
  { symbol: 'ETH', name: 'Ethereum', network: 'Ethereum', color: 'bg-blue-600', icon: 'Ξ', logoUrl: ethLogo, coinGeckoId: 'ethereum', enabled: true },
  { symbol: 'SOL', name: 'Solana', network: 'Solana', color: 'bg-purple-600', icon: '◎', logoUrl: solLogo, coinGeckoId: 'solana', enabled: true },
  { symbol: 'BNB', name: 'BNB Chain', network: 'BNB Smart Chain', color: 'bg-yellow-500', icon: 'B', logoUrl: bnbLogo, coinGeckoId: 'binancecoin', enabled: true },
  { symbol: 'USDT', name: 'Tether USD (TRC-20)', network: 'TRON', color: 'bg-teal-600', icon: '₮', logoUrl: usdtLogo, coinGeckoId: 'tether', enabled: true },
  { symbol: 'USDT_ERC20', name: 'Tether USD (ERC-20)', network: 'Ethereum', color: 'bg-green-600', icon: '₮', logoUrl: usdtLogo, coinGeckoId: 'tether', enabled: true },
  { symbol: 'USDT_BEP20', name: 'Tether USD (BEP-20)', network: 'BNB Smart Chain', color: 'bg-yellow-600', icon: '₮', logoUrl: usdtLogo, coinGeckoId: 'tether', enabled: true },
  { symbol: 'USDT_SOL', name: 'Tether USD (SPL)', network: 'Solana', color: 'bg-purple-600', icon: '₮', logoUrl: usdtLogo, coinGeckoId: 'tether', enabled: true },
  { symbol: 'XRP', name: 'XRP', network: 'Ripple', color: 'bg-sky-600', icon: '✕', logoUrl: xrpLogo, coinGeckoId: 'ripple', enabled: true },
  { symbol: 'DOGE', name: 'Dogecoin', network: 'Dogecoin', color: 'bg-amber-500', icon: 'Ð', logoUrl: '', coinGeckoId: 'dogecoin', enabled: true },
  { symbol: 'ADA', name: 'Cardano', network: 'Cardano', color: 'bg-blue-700', icon: '₳', logoUrl: '', coinGeckoId: 'cardano', enabled: true },
  { symbol: 'TRX', name: 'TRON', network: 'TRON', color: 'bg-red-600', icon: 'T', logoUrl: '', coinGeckoId: 'tron', enabled: true },
  { symbol: 'AVAX', name: 'Avalanche', network: 'Avalanche C-Chain', color: 'bg-rose-600', icon: '▲', logoUrl: '', coinGeckoId: 'avalanche-2', enabled: true },
  { symbol: 'MATIC', name: 'Polygon', network: 'Polygon', color: 'bg-indigo-600', icon: 'M', logoUrl: '', coinGeckoId: 'matic-network', enabled: true },
  { symbol: 'LTC', name: 'Litecoin', network: 'Litecoin', color: 'bg-blue-400', icon: 'Ł', logoUrl: '', coinGeckoId: 'litecoin', enabled: true }
];

const STORAGE_KEY = 'xbyte_asset_config';

/**
 * Load asset configurations from localStorage or return defaults.
 * Merges defaults with stored values so newly configured assets appear even if an older config exists in localStorage.
 */
export function loadAssetConfig(): AssetConfig[] {
  try {
    const stored = dataService.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const parsedMap = new Map(parsed.map((a: AssetConfig) => [a.symbol, a]));
        
        // Merge defaults with stored values (preserving stored enabled state, custom names, etc.)
        const merged: AssetConfig[] = defaultAssetConfig.map(defaultAsset => {
          const storedAsset = parsedMap.get(defaultAsset.symbol);
          if (storedAsset) {
            return {
              ...defaultAsset,
              ...storedAsset,
              logoUrl: storedAsset.logoUrl || defaultAsset.logoUrl,
              network: storedAsset.network || defaultAsset.network,
              enabled: storedAsset.enabled !== undefined ? storedAsset.enabled : true
            };
          }
          return defaultAsset;
        });

        // Also append any custom assets created by admin that aren't in defaultAssetConfig
        parsed.forEach((storedAsset: AssetConfig) => {
          if (!defaultAssetConfig.some(d => d.symbol === storedAsset.symbol)) {
            merged.push({
              ...storedAsset,
              enabled: storedAsset.enabled !== undefined ? storedAsset.enabled : true
            });
          }
        });

        return merged;
      }
    }
  } catch (e) {
    console.error('Error loading asset config:', e);
  }
  return defaultAssetConfig;
}

/**
 * Save asset configurations to localStorage
 */
export function saveAssetConfig(config: AssetConfig[]): void {
  try {
    dataService.setItem(STORAGE_KEY, JSON.stringify(config));
    // Dispatch custom event to notify all components of the update
    window.dispatchEvent(new CustomEvent('assetConfigUpdated', {
      detail: { assetConfig: config }
    }));
  } catch (e) {
    console.error('Error saving asset config:', e);
  }
}

/**
 * Get a specific asset configuration by symbol
 */
export function getAssetBySymbol(symbol: string, config?: AssetConfig[]): AssetConfig | undefined {
  const assetConfig = config || loadAssetConfig();
  return assetConfig.find(a => a.symbol === symbol);
}

/**
 * Initialize asset config in localStorage if it doesn't exist
 */
export function initializeAssetConfig(): void {
  const stored = dataService.getItem(STORAGE_KEY);
  if (!stored) {
    saveAssetConfig(defaultAssetConfig);
  }
}