const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('WARNING: Supabase URL or Service Role Key is missing in environment variables.');
}

// Admin client — uses service role key to bypass RLS.
// Required for: server-side uploads, generating signed URLs, and downloads from the private bucket.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Anon client — subject to RLS. Used for client-like queries if needed.
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
