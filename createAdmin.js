import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  console.log('Creating Admin Account...');
  
  const email = 'admin@bid2unicorn.com';
  const password = 'AdminPassword123!';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'admin',
      },
    },
  });

  if (error) {
    console.error('Error creating admin:', error.message);
  } else {
    console.log('\n✅ Admin user created successfully!');
    console.log('User metadata:', data.user?.user_metadata);
    console.log('\n--- Login Credentials ---');
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log('-------------------------\n');
    console.log('Note: If "Confirm email" is enabled in your Supabase project, you might need to confirm or auto-confirm the user in the Supabase Dashboard.');
  }
}

createAdmin().catch(console.error);
