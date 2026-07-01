const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qruwvhxyhaklyoosrulw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXd2aHh5aGFrbHlvb3NydWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTYyODcsImV4cCI6MjA5NzgzMjI4N30.HSA_GqICwP3KHj5vvLcjrxLVazzMuVmfob_tltLtE0I'
);

async function run() {
  console.log('Testing User Signup (admin2@xbyte.io)');
  const { data, error } = await supabase.auth.signUp({
    email: 'admin2@xbyte.io',
    password: 'Admin@123'
  });
  console.log('Signup Result:', error ? error.message : data);
}

run();
