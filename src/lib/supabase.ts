import { createClient } from '@supabase/supabase-js'

// ✅ Read environment variables into constants
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 🧭 Debug log — shows in browser console
console.log('🔍 Supabase URL:', supabaseUrl)
console.log('🔍 Supabase Key (first 10 chars):', supabaseAnonKey?.substring(0, 10))

// ✅ Safety check: clear error if .env not loaded
if (!supabaseUrl) throw new Error('supabaseUrl is required.')
if (!supabaseAnonKey) throw new Error('supabaseAnonKey is required.')

// ✅ Create and export the client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
