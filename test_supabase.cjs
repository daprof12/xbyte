const { createClient } = require('@supabase/supabase-js');

const projectId = "qruwvwhxyhaklyoosrulw";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFydXd2aHh5aGFrbHlvb3NydWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNTYyODcsImV4cCI6MjA5NzgzMjI4N30.HSA_GqICwP3KHj5vvLcjrxLVazzMuVmfob_tltLtE0I";

const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);

async function check() {
  const { data, error } = await supabase.from('users').select('*').limit(5);
  console.log("Users:", data, error);
}

check();
