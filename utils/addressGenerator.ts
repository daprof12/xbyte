// Generate valid-format addresses for different blockchain networks
// Note: These are mock addresses for demo purposes only
// In production, use proper cryptographic libraries to generate real addresses

/**
 * Generate a valid-format Bitcoin address (Native SegWit - Bech32)
 */
export function generateBTCAddress(): string {
  // Native SegWit addresses start with bc1 and are lowercase
  const chars = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'; // Bech32 charset
  let address = 'bc1q';
  // Bech32 addresses are typically 42 or 62 characters total
  const length = 39; // bc1q + 39 more characters = 42 total
  
  for (let i = 0; i < length; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return address;
}

/**
 * Generate a valid-format Ethereum address
 */
export function generateETHAddress(): string {
  // Ethereum addresses start with 0x and are 42 characters long (including 0x)
  const chars = '0123456789abcdef';
  let address = '0x';
  
  for (let i = 0; i < 40; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return address;
}

/**
 * Generate a valid-format BNB Smart Chain address (same format as Ethereum)
 */
export function generateBNBAddress(): string {
  return generateETHAddress(); // BNB uses same format as ETH
}

/**
 * Generate a valid-format Solana address
 */
export function generateSOLAddress(): string {
  // Solana addresses are base58 encoded, typically 32-44 characters
  const base58chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'; // No 0, O, I, l
  let address = '';
  const length = 44; // Standard Solana address length
  
  for (let i = 0; i < length; i++) {
    address += base58chars.charAt(Math.floor(Math.random() * base58chars.length));
  }
  
  return address;
}

/**
 * Generate a valid-format TRON address
 */
export function generateTRONAddress(): string {
  // TRON addresses start with T and are 34 characters total (base58)
  const base58chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let address = 'T';
  
  for (let i = 0; i < 33; i++) {
    address += base58chars.charAt(Math.floor(Math.random() * base58chars.length));
  }
  
  return address;
}

/**
 * Generate a valid-format XRP (Ripple) address
 */
export function generateXRPAddress(): string {
  // XRP addresses start with 'r' and are 34 characters total
  const rippleAlphabet = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxz';
  let address = 'r';
  for (let i = 0; i < 33; i++) {
    address += rippleAlphabet.charAt(Math.floor(Math.random() * rippleAlphabet.length));
  }
  return address;
}

/**
 * Generate a valid-format Dogecoin address
 */
export function generateDOGEAddress(): string {
  // Dogecoin addresses start with 'D' and are 34 characters
  const base58chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let address = 'D';
  for (let i = 0; i < 33; i++) {
    address += base58chars.charAt(Math.floor(Math.random() * base58chars.length));
  }
  return address;
}

/**
 * Generate a valid-format Cardano (ADA) address
 */
export function generateADAAddress(): string {
  // Cardano Shelley addresses start with addr1q
  const chars = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  let address = 'addr1q';
  for (let i = 0; i < 52; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

/**
 * Generate a valid-format Litecoin address
 */
export function generateLTCAddress(): string {
  // Litecoin Native Segwit starts with ltc1
  const chars = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  let address = 'ltc1q';
  for (let i = 0; i < 38; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}

/**
 * Generate addresses for all supported networks
 */
export function generateAllAddresses(): Record<string, string> {
  const ethAddr = generateETHAddress();
  const tronAddr = generateTRONAddress();
  const solAddr = generateSOLAddress();

  return {
    BTC: generateBTCAddress(),
    ETH: ethAddr,
    SOL: solAddr,
    BNB: ethAddr,
    USDT: tronAddr, // Tether TRC-20
    USDT_TRC20: tronAddr,
    USDT_ERC20: ethAddr,
    USDT_BEP20: ethAddr,
    USDT_SOL: solAddr,
    XRP: generateXRPAddress(),
    DOGE: generateDOGEAddress(),
    ADA: generateADAAddress(),
    TRX: tronAddr,
    AVAX: ethAddr,
    MATIC: ethAddr,
    LTC: generateLTCAddress(),
  };
}

/**
 * Generate address for a specific coin
 */
export function generateAddressForCoin(coinSymbol: string): string {
  const symbol = coinSymbol.toUpperCase();
  
  switch (symbol) {
    case 'BTC':
      return generateBTCAddress();
    
    case 'ETH':
    case 'BNB':
    case 'USDT_ERC20':
    case 'USDT_BEP20':
    case 'AVAX':
    case 'MATIC':
      return generateETHAddress();
    
    case 'SOL':
    case 'USDT_SOL':
      return generateSOLAddress();
    
    case 'TRN':
    case 'TRX':
    case 'USDT':
    case 'USDT_TRC20':
      return generateTRONAddress();
    
    case 'XRP':
      return generateXRPAddress();
      
    case 'DOGE':
      return generateDOGEAddress();
      
    case 'ADA':
      return generateADAAddress();
      
    case 'LTC':
      return generateLTCAddress();
    
    default:
      // For unknown coins, generate an ETH-style address as default
      return generateETHAddress();
  }
}
