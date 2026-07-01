const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://qruwvhxyhaklyoosrulw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXd2aHh5aGFrbHlvb3NydWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTYyODcsImV4cCI6MjA5NzgzMjI4N30.HSA_GqICwP3KHj5vvLcjrxLVazzMuVmfob_tltLtE0I'
);
async function run() {
  // Test anon access to each table
  const tables = ['users', 'transactions', 'admin_fee_settings', 'audit_logs', 'support_tickets', 'live_chats', 'wallets'];
  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
    console.log(`${table}: ${error ? 'ERROR: ' + error.message : 'count=' + count}`);
  }
}
run();
