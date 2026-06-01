const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'server/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function main() {
  const { data: upData, error: upError } = await supabase.auth.signUp({
    email: 'user2233@example.com',
    password: 'password123',
    options: { data: { username: 'testuser2233' } }
  });
  if (upError) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'user2233@example.com',
      password: 'password123'
    });
    console.log(data.session.access_token);
  } else {
    console.log(upData.session.access_token);
  }
}
main();
