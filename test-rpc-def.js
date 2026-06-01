const { execSync } = require('child_process');

async function check() {
  try {
    const output = execSync('PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "\\df+ public.create_sector_with_leader"', { encoding: 'utf-8' });
    console.log("FUNCTION DEF:", output);
  } catch (e) {
    console.error(e.message);
  }
}
check();
