const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

async function check() {
  const output = execSync('npx supabase db psql -c "\\df public.create_sector_with_leader"', { encoding: 'utf-8' });
  console.log(output);
}
check().catch(console.error);
