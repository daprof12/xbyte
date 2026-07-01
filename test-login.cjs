const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qruwvhxyhaklyoosrulw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXd2aHh5aGFrbHlvb3NydWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTYyODcsImV4cCI6MjA5NzgzMjI4N30.HSA_GqICwP3KHj5vvLcjrxLVazzMuVmfob_tltLtE0I'
);

async function run() {
  console.log('Testing User Login (john@example.com / Password123!)');
  const { data: userData, error: userError } = await supabase.auth.signInWithPassword({
    email: 'john@example.com',
    password: 'Password123!'
  });
  console.log('User Login Result:', userError ? userError.message : 'Success');

  console.log('Testing Admin RPC Login (admin@xbyte.io / Admin@123)');
  const { data: adminData, error: adminError } = await supabase.rpc('verify_admin_login', {
    p_email: 'admin@xbyte.io',
    p_password: 'Admin@123'
  });
  console.log('Admin Login Result:', adminError ? adminError.message : adminData);
}

run();
