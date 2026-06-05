const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('WARNING: Supabase URL or Anon Key is missing in environment variables.');
}

// Admin client (used for backend file management operations)
const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Anon client (subject to RLS, used if testing RLS-enforced client-like queries)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

module.exports = {
  supabaseAdmin,
  supabaseAnon,
  bucketName: process.env.SUPABASE_BUCKET || 'Privora',
};
