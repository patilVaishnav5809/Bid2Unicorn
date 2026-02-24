import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

// Create client only if keys present and URL is valid, else mock it to prevent crash
const isValidUrl = (url) => url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));

/** @type {any} */
export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: () => {
        const builder = {
            select: () => builder,
            insert: () => builder, 
            update: () => builder,
            delete: () => builder,
            eq: () => builder,
            order: () => builder,
            single: () => builder,
            maybeSingle: () => builder,
            limit: () => builder,
            // Make it awaitable/thenable
            then: (onfulfilled, onrejected) => {
                return Promise.resolve({ data: [], error: null })
                    .then(onfulfilled, onrejected);
            }
        };
        return builder;
      },
      channel: () => ({
        on: () => ({ subscribe: () => {} }),
        subscribe: () => {}
      }),
      removeChannel: () => {},
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: {}, error: { message: "Supabase not configured" } }),
        signUp: () => Promise.resolve({ data: { user: null }, error: null }),
        updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      storage: {
        from: () => ({
          upload: () => Promise.resolve({
            data: null,
            error: { message: "Supabase storage not configured" }
          }),
          getPublicUrl: () => ({
            data: { publicUrl: "" }
          }),
        }),
      },
    };
