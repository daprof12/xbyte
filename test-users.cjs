const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://qruwvhxyhaklyoosrulw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXd2aHh5aGFrbHlvb3NydWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTYyODcsImV4cCI6MjA5NzgzMjI4N30.HSA_GqICwP3KHj5vvLcjrxLVazzMuVmfob_tltLtE0I'
);

async function run() {
  const { data, error } = await supabase.from('users').select('email, id');
  console.log('Public Users:', error ? error : data);
}

run();
