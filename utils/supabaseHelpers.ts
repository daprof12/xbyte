import { supabase } from './supabaseClient';

/**
 * Fetches all user wallet data from Supabase and constructs the local walletData object.
 */
export async function fetchUserWalletFromDB(userId: string): Promise<any> {
  // 1. Fetch user profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error(userError?.message || 'User not found in Supabase public.users table.');
  }

  // 2. Fetch wallets
  const { data: wallets } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId);

  const balancesObj: any = {
    BTC: '0',
    ETH: '0',
    SOL: '0',
    BNB: '0',
    USDT: '0.00'
  };
  
  const addressesObj: any = {};

  if (wallets && wallets.length > 0) {
    const primaryWallet = wallets.find(w => w.is_primary) || wallets[0];

    // Fetch balances
    const { data: balances } = await supabase
      .from('wallet_balances')
      .select('balance, assets(symbol)')
      .eq('wallet_id', primaryWallet.id);

    if (balances) {
      balances.forEach((b: any) => {
        if (b.assets && b.assets.symbol) {
          balancesObj[b.assets.symbol] = b.balance.toString();
        }
      });
    }

    // Fetch addresses
    const { data: addresses } = await supabase
      .from('wallet_addresses')
      .select('address, assets(symbol)')
      .eq('wallet_id', primaryWallet.id);

    if (addresses) {
      addresses.forEach((a: any) => {
        if (a.assets && a.assets.symbol) {
          addressesObj[a.assets.symbol] = a.address;
        }
      });
    }
  }

  // Fallback to columns on users table if sub-tables are empty
  const finalAddresses = Object.keys(addressesObj).length > 0 
    ? addressesObj 
    : (user.wallet_address || {});

  const finalBalances = Object.keys(balancesObj).some(k => parseFloat(balancesObj[k]) > 0)
    ? balancesObj
    : (user.metadata?.balances || { BTC: '0', ETH: '0', SOL: '0', BNB: '0', USDT: '0.00' });

  // 3. Fetch transactions
  const { data: txs } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const transactionsArray = txs ? txs.map((t: any) => ({
    id: t.id,
    type: t.type,
    asset: t.asset_symbol,
    amount: t.amount.toString(),
    timestamp: t.timestamp || t.created_at,
    status: t.status,
    hash: t.hash || '',
    to: t.to_address || '',
    from: t.from_address || '',
    fee: t.fee?.toString() || '0',
    network: t.network,
    notes: t.notes || ''
  })) : [];

  // 4. Construct local walletData format
  return {
    id: user.id,
    created_at: user.created_at,
    email: user.email,
    fullName: user.full_name || user.email.split('@')[0],
    mnemonic_encrypted: user.seed_phrase ? btoa(user.seed_phrase) : '',
    password: user.password_hash ? btoa(user.password_hash) : '', 
    passwordLastChanged: user.updated_at || new Date().toISOString(),
    addresses: finalAddresses,
    balances: finalBalances,
    transactions: transactionsArray,
    twoFactorAuth: user.metadata?.twoFactorAuth || {
      enabled: false,
      preferredMethod: null,
      passcode: null,
      biometricEnabled: false,
      biometricData: null,
      setupDate: null
    },
    kyc_status: user.metadata?.kyc_status || 'pending',
    blocked: user.status === 'blocked',
    last_login: user.last_login_at || new Date().toISOString()
  };
}

/**
 * Saves/syncs user wallet data back to Supabase.
 */
export async function saveWalletDataToDB(walletData: any): Promise<void> {
  const userId = walletData.id;
  if (!userId) return;

  const decryptedMnemonic = walletData.mnemonic_encrypted 
    ? (walletData.mnemonic_encrypted.includes(' ') ? walletData.mnemonic_encrypted : atob(walletData.mnemonic_encrypted))
    : '';

  const decryptedPassword = walletData.password 
    ? (walletData.password.length >= 8 && !walletData.password.endsWith('=') ? walletData.password : atob(walletData.password))
    : '';

  // 1. Update public.users
  await supabase
    .from('users')
    .upsert({
      id: userId,
      email: walletData.email,
      full_name: walletData.fullName || walletData.email.split('@')[0],
      seed_phrase: decryptedMnemonic || null,
      wallet_address: walletData.addresses || {},
      password_hash: decryptedPassword || null,
      metadata: {
        kyc_status: walletData.kyc_status || 'pending',
        balances: walletData.balances || {},
        twoFactorAuth: walletData.twoFactorAuth || {}
      }
    });

  // 2. Update wallets table
  const { data: existingWallets } = await supabase
    .from('wallets')
    .select('id')
    .eq('user_id', userId)
    .eq('is_primary', true);

  let walletId;
  if (existingWallets && existingWallets.length > 0) {
    walletId = existingWallets[0].id;
    await supabase
      .from('wallets')
      .update({
        mnemonic_encrypted: walletData.mnemonic_encrypted || '',
        encryption_salt: userId,
      })
      .eq('id', walletId);
  } else {
    const { data: newWallet } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        name: 'Main Wallet',
        mnemonic_encrypted: walletData.mnemonic_encrypted || '',
        encryption_salt: userId,
        is_primary: true
      })
      .select()
      .single();
    if (newWallet) {
      walletId = newWallet.id;
    }
  }

  // 3. Update balances and addresses
  if (walletId) {
    const { data: assets } = await supabase.from('assets').select('id, symbol');
    
    if (assets) {
      // Sync balances
      if (walletData.balances) {
        for (const [symbol, balance] of Object.entries(walletData.balances)) {
          const asset = assets.find(a => a.symbol === symbol);
          if (asset) {
            await supabase.from('wallet_balances').upsert({
              wallet_id: walletId,
              asset_id: asset.id,
              balance: parseFloat(balance as string) || 0
            }, { onConflict: 'wallet_id,asset_id' });
          }
        }
      }

      // Sync addresses
      if (walletData.addresses) {
        for (const [symbol, address] of Object.entries(walletData.addresses)) {
          const asset = assets.find(a => a.symbol === symbol);
          if (asset && address) {
            await supabase.from('wallet_addresses').upsert({
              wallet_id: walletId,
              asset_id: asset.id,
              address: address as string,
              is_primary: true
            }, { onConflict: 'wallet_id,asset_id,address' });
          }
        }
      }
    }
  }

  // 4. Sync transactions
  if (walletId && walletData.transactions && walletData.transactions.length > 0) {
    const { data: assets } = await supabase.from('assets').select('id, symbol');
    
    for (const tx of walletData.transactions) {
      if (!tx.hash) continue;
      
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('hash', tx.hash)
        .maybeSingle();

      if (!existingTx) {
        const asset = assets?.find(a => a.symbol === tx.asset);
        await supabase
          .from('transactions')
          .insert({
            wallet_id: walletId,
            user_id: userId,
            type: tx.type,
            status: tx.status,
            asset_id: asset?.id || null,
            asset_symbol: tx.asset,
            amount: parseFloat(tx.amount) || 0,
            from_address: tx.from || null,
            to_address: tx.to || null,
            network: tx.network || '',
            hash: tx.hash,
            fee: tx.fee ? parseFloat(tx.fee) : 0,
            notes: tx.notes || ''
          });
      }
    }
  }
}
