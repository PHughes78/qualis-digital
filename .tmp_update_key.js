const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
(async () => {
  const { error } = await supabase.from('company_settings').update({ chatgpt_api_key: 'sk-test' });
  console.log(error);
})();
