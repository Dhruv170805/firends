const { createClient } = require('@supabase/supabase-js');

// intercept fetch
global.fetch = async (url, options) => {
  console.log("HEADERS:", options.headers);
  return { ok: true, json: async () => ({}) };
};

const supabase = createClient('http://localhost', 'anon_key', {
  global: {
    headers: { Authorization: 'Bearer my_custom_jwt' }
  }
});

supabase.from('sectors').select('*').then(() => {
  console.log("Done");
});
