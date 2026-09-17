// Address validation utilities for different blockchain networks

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates Bitcoin addresses (Legacy, SegWit, Native SegWit)
 */
export function validateBTCAddress(address: string): ValidationResult {
  if (!address) {
    return { isValid: false, error: 'Address is required' };
  }

  // Legacy P2PKH (starts with 1)
  const legacyRegex = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  // P2SH (starts with 3)
  const p2shRegex = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  // Native SegWit Bech32 (starts with bc1)
  const bech32Regex = /^(bc1)[a-z0-9]{39,87}$/;

  if (legacyRegex.test(address) || p2shRegex.test(address) || bech32Regex.test(address)) {
    return { isValid: true };
  }

  return { isValid: false, error: 'Invalid Bitcoin address format' };
}

/**
 * Validates Ethereum addresses (also valid for BNB Smart Chain)
 */
export function validateETHAddress(address: string): ValidationResult {
  if (!address) {
    return { isValid: false, error: 'Address is required' };
  }

  // Ethereum addresses start with 0x and are 42 characters long
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;

  if (ethRegex.test(address)) {
    return { isValid: true };
  }

  return { isValid: false, error: 'Invalid Ethereum address format' };
}

/**
 * Validates BNB Smart Chain addresses (same format as Ethereum)
 */
export function validateBNBAddress(address: string): ValidationResult {
  const result = validateETHAddress(address);
  if (!result.isValid && result.error) {
    return { isValid: false, error: result.error.replace('Ethereum', 'BNB Smart Chain') };
  }
  return result;
}

/**
 * Validates Solana addresses
 */
export function validateSOLAddress(address: string): ValidationResult {
  if (!address) {
    return { isValid: false, error: 'Address is required' };
  }

  // Solana addresses are base58 encoded and typically 32-44 characters
  const solRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  if (solRegex.test(address)) {
    // Additional check: should not start with 0, O, I, or l (not in base58)
    if (/^[0OIl]/.test(address)) {
      return { isValid: false, error: 'Invalid Solana address format' };
    }
    return { isValid: true };
  }

  return { isValid: false, error: 'Invalid Solana address format' };
}

/**
 * Validates TRON addresses
 */
export function validateTRONAddress(address: string): ValidationResult {
  if (!address) {
    return { isValid: false, error: 'Address is required' };
  }

  // TRON addresses start with T and are 34 characters long (base58)
  const tronRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

  if (tronRegex.test(address)) {
    return { isValid: true };
  }

  return { isValid: false, error: 'Invalid TRON address format' };
}

/**
 * Validates XRP (Ripple) addresses
 */
export function validateXRPAddress(address: string): ValidationResult {
  if (!address) {
    return { isValid: false, error: 'Address is required' };
  }
  const xrpRegex = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
  if (xrpRegex.test(address)) {
    return { isValid: true };
  }
  return { isValid: false, error: 'Invalid XRP address format (starts with r, 25-35 characters)' };
}

/**
 * Validates Dogecoin addresses
 */
export function validateDOGEAddress(address: string): ValidationResult {
  if (!address) {
    return { isValid: false, error: 'Address is required' };
  }
  const dogeRegex = /^D[1-9A-HJ-NP-Za-km-z]{33}$/;
  if (dogeRegex.test(address)) {
    return { isValid: true };
  }
  return { isValid: false, error: 'Invalid Dogecoin address format (starts with D, 34 characters)' };
}

/**
 * Validates Cardano (ADA) addresses
 */
export function validateADAAddress(address: string): ValidationResult {
  if (!address) {
    return { isValid: false, error: 'Address is required' };
  }
  const adaRegex = /^addr1[a-z0-9]{50,105}$/;
  if (adaRegex.test(address)) {
    return { isValid: true };
  }
  return { isValid: false, error: 'Invalid Cardano address format (starts with addr1)' };
}

/**
 * Validates Litecoin addresses
 */
export function validateLTCAddress(address: string): ValidationResult {
  if (!address) {
    return { isValid: false, error: 'Address is required' };
  }
  const ltcRegex = /^(L|M|ltc1)[a-km-zA-HJ-NP-Z1-9]{25,60}$/;
  if (ltcRegex.test(address)) {
    return { isValid: true };
  }
  return { isValid: false, error: 'Invalid Litecoin address format (starts with L, M, or ltc1)' };
}

/**
 * Main validation function that routes to appropriate validator based on coin type
 */
export function validateAddress(address: string, coinSymbol: any): ValidationResult {
  // Handle invalid input types
  if (!coinSymbol) {
    return { isValid: false, error: 'Invalid coin symbol' };
  }
  
  // Convert to string if not already
  const coinStr = typeof coinSymbol === 'string' ? coinSymbol : String(coinSymbol);
  const symbol = coinStr.toUpperCase();

  switch (symbol) {
    case 'BTC':
      return validateBTCAddress(address);
    
    case 'ETH':
    case 'BNB':
    case 'USDT_ERC20':
    case 'USDT_BEP20':
    case 'AVAX':
    case 'MATIC':
      return validateETHAddress(address);
    
    case 'SOL':
    case 'USDT_SOL':
      return validateSOLAddress(address);
    
    case 'TRN':
    case 'TRX':
    case 'USDT':
    case 'USDT_TRC20':
      return validateTRONAddress(address);

    case 'XRP':
      return validateXRPAddress(address);

    case 'DOGE':
      return validateDOGEAddress(address);

    case 'ADA':
      return validateADAAddress(address);

    case 'LTC':
      return validateLTCAddress(address);
    
    default:
      // For custom coins, do basic validation
      if (!address) {
        return { isValid: false, error: 'Address is required' };
      }
      if (address.length < 24 || address.length > 110) {
        return { isValid: false, error: 'Invalid address length' };
      }
      return { isValid: true };
  }
}

/**
 * Get address format hint for display
 */
export function getAddressFormatHint(coinSymbol: any): string {
  // Handle invalid input types
  if (!coinSymbol) {
    return 'Enter recipient address';
  }
  
  // Convert to string if not already
  const coinStr = typeof coinSymbol === 'string' ? coinSymbol : String(coinSymbol);
  const symbol = coinStr.toUpperCase();

  switch (symbol) {
    case 'BTC':
      return 'Starts with 1, 3, or bc1 (26-90 characters)';
    
    case 'ETH':
    case 'BNB':
    case 'USDT_ERC20':
    case 'USDT_BEP20':
    case 'AVAX':
    case 'MATIC':
      return 'Starts with 0x (42 characters)';
    
    case 'SOL':
    case 'USDT_SOL':
      return 'Base58 encoded (32-44 characters)';
    
    case 'TRN':
    case 'TRX':
    case 'USDT':
    case 'USDT_TRC20':
      return 'Starts with T (34 characters)';

    case 'XRP':
      return 'Starts with r (25-35 characters)';

    case 'DOGE':
      return 'Starts with D (34 characters)';

    case 'ADA':
      return 'Starts with addr1 (Shelley format)';

    case 'LTC':
      return 'Starts with L, M, or ltc1';
    
    default:
      return 'Enter a valid wallet address';
  }
}

/**
 * Validate and format address for display
 */
export function formatAddressForDisplay(address: string, maxLength: number = 16): string {
  if (!address) return '';
  
  if (address.length <= maxLength) {
    return address;
  }
  
  const prefixLength = Math.ceil((maxLength - 3) / 2);
  const suffixLength = Math.floor((maxLength - 3) / 2);
  
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}
