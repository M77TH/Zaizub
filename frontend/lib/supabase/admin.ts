import { createClient } from '@supabase/supabase-js';

/**
 * Creates an admin Supabase client with the Service Role key.
 * This client bypasses RLS and has full privileges to delete storage files
 * and manage resources securely from server actions and route handlers.
 *
 * NOTE: NEVER expose this client or SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
