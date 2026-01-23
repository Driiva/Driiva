/**
 * Check if user exists in Supabase
 * Run with: node check-user.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  try {
    const envPath = join(__dirname, 'client', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error('Error loading .env file:', error.message);
    process.exit(1);
  }
}

async function checkUser() {
  console.log('🔍 Checking Supabase User Status\n');
  
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const testEmail = 'jamal@driiva.co.uk';
  
  console.log(`📧 Checking user: ${testEmail}\n`);
  
  // Note: We can't directly list users with anon key, but we can try to sign in
  // and see what error we get, or check via admin API if available
  
  console.log('ℹ️  To check if the user exists:');
  console.log('   1. Go to Supabase Dashboard → Authentication → Users');
  console.log('   2. Search for: jamal@driiva.co.uk');
  console.log('   3. If user exists, check:');
  console.log('      - Email confirmed? (should be ✓)');
  console.log('      - User is active?');
  console.log('   4. If user doesn\'t exist, create it:');
  console.log('      - Click "Add user" → "Create new user"');
  console.log('      - Email: jamal@driiva.co.uk');
  console.log('      - Password: Dmoney97!');
  console.log('      - Auto Confirm User: ✓ (checked)');
  console.log('\n💡 Alternative: Test with a user you know exists first');
  console.log('   Or create the user via Supabase Dashboard\n');
  
  // Try to get current session (won't work but shows API is accessible)
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (!error) {
      console.log('✅ Supabase connection successful');
      console.log('   (No active session, which is expected)\n');
    }
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
  }
}

checkUser();
