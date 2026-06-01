const { execSync } = require('child_process');

async function check() {
  const code = `
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient('${process.env.SUPABASE_URL}', '${process.env.SUPABASE_ANON_KEY}');
    console.log(supabase);
  `;
  console.log(code);
}
check();
