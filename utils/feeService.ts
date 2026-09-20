import dataService from './dataService';
import { loadAssetConfig, AssetConfig } from './assetConfig';
import { generateAddressForCoin } from './addressGenerator';

export interface AssetFeeConfig {
  withdraw_fee: string;
  percent: string;
  deposit_address: string;
  deposit_enabled: boolean;
  gas_fee_enabled: boolean;
  gas_fee_type: 'fixed' | 'percent';
  gas_fee_fixed: string;
  gas_fee_percent: string;
}

export type FeeConfigMap = Record<string, AssetFeeConfig>;

export interface UserFeeOverride {
  userId: string;
  userEmail?: string;
  userName?: string;
  enabled: boolean;
  fees: Partial<Record<string, Partial<AssetFeeConfig>>>;
  updatedAt: string;
}

const GLOBAL_STORAGE_KEYS = ['xbyte_admin_fees', 'pluto_admin_fees'];
const USER_FEE_KEY_PREFIX = 'xbyte_user_fees_';
const OVERRIDES_REGISTRY_KEY = 'xbyte_all_user_fee_overrides';

/**
 * Returns default fee & deposit configuration for an asset.
 */
export function getDefaultAssetFee(symbol: string): AssetFeeConfig {
  const depositAddress = generateAddressForCoin(symbol);
  
  // Specific default overrides for popular chains
  switch (symbol.toUpperCase()) {
    case 'BTC':
      return {
        withdraw_fee: '0.0005',
        percent: '0.5',
        deposit_address: depositAddress,
        deposit_enabled: true,
        gas_fee_enabled: true,
        gas_fee_type: 'fixed',
        gas_fee_fixed: '0.0001',
        gas_fee_percent: '0.5'
      };
    case 'ETH':
    case 'USDT_ERC20':
      return {
        withdraw_fee: '0.005',
        percent: '0.5',
        deposit_address: depositAddress,
        deposit_enabled: true,
        gas_fee_enabled: true,
        gas_fee_type: 'fixed',
        gas_fee_fixed: '0.002',
        gas_fee_percent: '0.5'
      };
    case 'SOL':
    case 'USDT_SOL':
      return {
        withdraw_fee: '0.01',
        percent: '0.5',
        deposit_address: depositAddress,
        deposit_enabled: true,
        gas_fee_enabled: true,
        gas_fee_type: 'fixed',
        gas_fee_fixed: '0.005',
        gas_fee_percent: '0.5'
      };
    case 'BNB':
    case 'USDT_BEP20':
      return {
        withdraw_fee: '0.001',
        percent: '0.5',
        deposit_address: depositAddress,
        deposit_enabled: true,
        gas_fee_enabled: true,
        gas_fee_type: 'fixed',
        gas_fee_fixed: '0.0005',
        gas_fee_percent: '0.5'
      };
    case 'USDT':
    case 'TRX':
      return {
        withdraw_fee: '1.0',
        percent: '0.5',
        deposit_address: depositAddress,
        deposit_enabled: true,
        gas_fee_enabled: true,
        gas_fee_type: 'fixed',
        gas_fee_fixed: '1.0',
        gas_fee_percent: '0.5'
      };
    case 'XRP':
      return {
        withdraw_fee: '0.25',
        percent: '0.5',
        deposit_address: depositAddress,
        deposit_enabled: true,
        gas_fee_enabled: true,
        gas_fee_type: 'fixed',
        gas_fee_fixed: '0.1',
        gas_fee_percent: '0.5'
      };
    default:
      return {
        withdraw_fee: '0.001',
        percent: '0.5',
        deposit_address: depositAddress,
        deposit_enabled: true,
        gas_fee_enabled: true,
        gas_fee_type: 'fixed',
        gas_fee_fixed: '0.001',
        gas_fee_percent: '0.5'
      };
  }
}

/**
 * Retrieves the global fee & deposit configuration.
 * Ensures every single asset in loadAssetConfig() is captured.
 */
export function getGlobalFees(): FeeConfigMap {
  const allAssets: AssetConfig[] = loadAssetConfig();
  let storedFees: FeeConfigMap = {};

  try {
    for (const key of GLOBAL_STORAGE_KEYS) {
      const raw = dataService.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          storedFees = { ...storedFees, ...parsed };
        }
      }
    }
  } catch (err) {
    console.error('Error reading global fees from storage:', err);
  }

  // Complete fee map capturing all assets from assets overview
  const completeFees: FeeConfigMap = {};
  allAssets.forEach(asset => {
    const symbol = asset.symbol;
    const existing = storedFees[symbol];

    if (existing) {
      completeFees[symbol] = {
        withdraw_fee: existing.withdraw_fee !== undefined ? existing.withdraw_fee.toString() : '0.001',
        percent: existing.percent !== undefined ? existing.percent.toString() : '0.5',
        deposit_address: existing.deposit_address || generateAddressForCoin(symbol),
        deposit_enabled: existing.deposit_enabled !== undefined ? Boolean(existing.deposit_enabled) : true,
        gas_fee_enabled: existing.gas_fee_enabled !== undefined ? Boolean(existing.gas_fee_enabled) : true,
        gas_fee_type: existing.gas_fee_type === 'percent' ? 'percent' : 'fixed',
        gas_fee_fixed: existing.gas_fee_fixed !== undefined ? existing.gas_fee_fixed.toString() : '0.001',
        gas_fee_percent: existing.gas_fee_percent !== undefined ? existing.gas_fee_percent.toString() : '0.5'
      };
    } else {
      completeFees[symbol] = getDefaultAssetFee(symbol);
    }
  });

  return completeFees;
}

/**
 * Saves global fee configuration.
 */
export function saveGlobalFees(fees: FeeConfigMap): void {
  try {
    const json = JSON.stringify(fees);
    GLOBAL_STORAGE_KEYS.forEach(key => dataService.setItem(key, json));
    
    // Dispatch window event so reactive components update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fees_updated', { detail: { type: 'global', fees } }));
    }
  } catch (err) {
    console.error('Error saving global fees:', err);
  }
}

/**
 * Retrieves the registry map of all users with custom overrides.
 */
export function getAllUserFeeOverrides(): Record<string, UserFeeOverride> {
  try {
    const raw = dataService.getItem(OVERRIDES_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading fee overrides registry:', err);
  }
  return {};
}

/**
 * Retrieves the custom fee override for a specific user.
 */
export function getUserFeeOverride(userId: string): UserFeeOverride | null {
  if (!userId) return null;
  try {
    const userKey = `${USER_FEE_KEY_PREFIX}${userId}`;
    const raw = dataService.getItem(userKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
    // Also check registry
    const registry = getAllUserFeeOverrides();
    if (registry[userId]) {
      return registry[userId];
    }
  } catch (err) {
    console.error(`Error reading fee override for user ${userId}:`, err);
  }
  return null;
}

/**
 * Saves or updates a user-specific fee override.
 */
export function saveUserFeeOverride(override: UserFeeOverride): void {
  if (!override?.userId) return;
  try {
    const userKey = `${USER_FEE_KEY_PREFIX}${override.userId}`;
    const payload: UserFeeOverride = {
      ...override,
      updatedAt: new Date().toISOString()
    };

    const json = JSON.stringify(payload);
    dataService.setItem(userKey, json);

    // Update the registry
    const registry = getAllUserFeeOverrides();
    registry[override.userId] = payload;
    dataService.setItem(OVERRIDES_REGISTRY_KEY, JSON.stringify(registry));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fees_updated', { detail: { type: 'user', userId: override.userId, override: payload } }));
    }
  } catch (err) {
    console.error(`Error saving fee override for user ${override.userId}:`, err);
  }
}

/**
 * Deletes a user-specific fee override, returning the user to global platform defaults.
 */
export function deleteUserFeeOverride(userId: string): void {
  if (!userId) return;
  try {
    const userKey = `${USER_FEE_KEY_PREFIX}${userId}`;
    dataService.removeItem(userKey);

    // Update registry
    const registry = getAllUserFeeOverrides();
    if (registry[userId]) {
      delete registry[userId];
      dataService.setItem(OVERRIDES_REGISTRY_KEY, JSON.stringify(registry));
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fees_updated', { detail: { type: 'user_deleted', userId } }));
    }
  } catch (err) {
    console.error(`Error deleting fee override for user ${userId}:`, err);
  }
}

/**
 * Returns merged effective fees for a user.
 * If user has an active override (enabled: true), their configured asset fees
 * override the global defaults. Unconfigured assets seamlessly inherit global defaults.
 */
export function getEffectiveFees(userId?: string): FeeConfigMap {
  const globalFees = getGlobalFees();
  if (!userId) return globalFees;

  const override = getUserFeeOverride(userId);
  if (!override || !override.enabled || !override.fees) {
    return globalFees;
  }

  const effective: FeeConfigMap = { ...globalFees };
  Object.keys(globalFees).forEach(symbol => {
    const userAssetFee = override.fees[symbol];
    if (userAssetFee) {
      effective[symbol] = {
        ...globalFees[symbol],
        ...userAssetFee,
        // Ensure values remain strings / booleans
        withdraw_fee: userAssetFee.withdraw_fee !== undefined ? userAssetFee.withdraw_fee.toString() : globalFees[symbol].withdraw_fee,
        percent: userAssetFee.percent !== undefined ? userAssetFee.percent.toString() : globalFees[symbol].percent,
        deposit_address: userAssetFee.deposit_address || globalFees[symbol].deposit_address,
        deposit_enabled: userAssetFee.deposit_enabled !== undefined ? Boolean(userAssetFee.deposit_enabled) : globalFees[symbol].deposit_enabled,
        gas_fee_enabled: userAssetFee.gas_fee_enabled !== undefined ? Boolean(userAssetFee.gas_fee_enabled) : globalFees[symbol].gas_fee_enabled,
        gas_fee_type: userAssetFee.gas_fee_type === 'percent' ? 'percent' : 'fixed',
        gas_fee_fixed: userAssetFee.gas_fee_fixed !== undefined ? userAssetFee.gas_fee_fixed.toString() : globalFees[symbol].gas_fee_fixed,
        gas_fee_percent: userAssetFee.gas_fee_percent !== undefined ? userAssetFee.gas_fee_percent.toString() : globalFees[symbol].gas_fee_percent
      };
    }
  });

  return effective;
}

/**
 * Returns effective fee configuration for a single asset for a user.
 */
export function getEffectiveAssetFee(assetSymbol: string, userId?: string): AssetFeeConfig {
  const effectiveFees = getEffectiveFees(userId);
  return effectiveFees[assetSymbol] || getDefaultAssetFee(assetSymbol);
}

export default {
  getDefaultAssetFee,
  getGlobalFees,
  saveGlobalFees,
  getAllUserFeeOverrides,
  getUserFeeOverride,
  saveUserFeeOverride,
  deleteUserFeeOverride,
  getEffectiveFees,
  getEffectiveAssetFee
};
