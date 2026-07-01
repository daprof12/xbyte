import { createClient } from '@supabase/supabase-js';

// Using the keys from info.tsx or env
const projectId = "qruwvhxyhaklyoosrulw";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXd2aHh5aGFrbHlvb3NydWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTYyODcsImV4cCI6MjA5NzgzMjI4N30.HSA_GqICwP3KHj5vvLcjrxLVazzMuVmfob_tltLtE0I";

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

const mockUsers = [
  {
    id: 'usr_001',
    email: 'john@example.com',
    phone: '+1234567890',
    status: 'active',
    metadata: {
        kyc_status: 'verified',
        balances: { BTC: '0.5', ETH: '10.0', SOL: '50.0', BNB: '5.0', USDT: '5000.00' },
        addresses: { 
          BTC: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
          ETH: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          SOL: '7YpJ5x9nE4kBYmJmGKZhCvXBAPngXzFqPmgvT8KJnKvH',
          BNB: 'bnb136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23',
          USDT: 'TJDENsfBJs4RFETt1X1W8wMDc8M5XnJhCe'
        }
    },
    password_hash: 'hashed_password_123'
  },
  {
    id: 'usr_002',
    email: 'sarah@example.com',
    phone: '+9876543210',
    status: 'active',
    metadata: {
        kyc_status: 'pending',
        balances: { BTC: '0.1', ETH: '2.5', SOL: '15.0', BNB: '1.2', USDT: '1200.00' },
        addresses: { 
          BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          ETH: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          SOL: 'DYw8jCTfwHNRJhhmFcbXvVDTqWMEVFBX6ZKUmG5CNSKK',
          BNB: 'bnb1grpf0955h0ykzq3ar5nmum7y6gdfl6lxfn46h2',
          USDT: 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9'
        }
    },
    password_hash: 'hashed_password_456'
  }
];

const mockActivities = [
  {
    user_id: 'usr_001',
    type: 'send',
    asset_symbol: 'ETH',
    amount: 0.5,
    status: 'pending',
    hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    to_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    from_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    fee: 0.002,
    network: 'Ethereum Mainnet',
    confirmations: 0,
    required_confirmations: 12
  }
];

const mockAuditLogs = [
  {
    action: 'User Balance Adjustment',
    metadata: { details: 'Increased ETH balance for usr_001 by 5.0' }
  }
];

async function seed() {
  console.log("Seeding users...");
  for (const user of mockUsers) {
    const { error } = await supabase.from('users').upsert({
      email: user.email,
      phone: user.phone,
      status: user.status,
      metadata: user.metadata,
      password_hash: user.password_hash
    }, { onConflict: 'email' });
    if (error) console.error("Error inserting user:", error);
  }

  console.log("Seeding activities...");
  for (const act of mockActivities) {
    const { error } = await supabase.from('transactions').insert(act);
    if (error) console.error("Error inserting transaction:", error);
  }

  console.log("Seeding audit logs...");
  for (const log of mockAuditLogs) {
    const { error } = await supabase.from('audit_logs').insert(log);
    if (error) console.error("Error inserting audit log:", error);
  }

  console.log("Seed complete.");
}

seed();
