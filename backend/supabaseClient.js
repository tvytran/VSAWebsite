const { createClient } = require('@supabase/supabase-js');

// This is the public, RLS-enabled client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// This is the admin client that can bypass RLS
// It should only be used in trusted server-side code
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = { supabase, supabaseAdmin }; 