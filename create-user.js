/**
 * Create user in Supabase
 * Run with: node create-user.js
 * 
 * This script creates a user in Supabase Auth with the specified credentials.
 * Note: Requires Supabase service role key for admin operations.
 * For anon key, you'll need to use the Supabase Admin API or Dashboard.
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

async function createUser() {
  console.log('👤 Creating Supabase User\n');
  
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const userEmail = 'jamal@driiva.co.uk';
  const userPassword = 'Dmoney97!';
  
  console.log('📧 Creating user:');
  console.log(`   Email: ${userEmail}`);
  console.log(`   Password: ${'*'.repeat(userPassword.length)}\n`);
  
  try {
    console.log('⏳ Signing up user...');
    
    // Sign up the user (this creates them in auth.users)
    const { data, error } = await supabase.auth.signUp({
      email: userEmail,
      password: userPassword,
      options: {
        data: {
          full_name: 'Jamal',
          email_redirect_to: undefined, // Don't redirect, auto-confirm
        },
        emailRedirectTo: undefined,
      }
    });
    
    if (error) {
      // If user already exists, try to sign in to verify
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        console.log('⚠️  User already exists. Attempting to verify credentials...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail,
          password: userPassword,
        });
        
        if (signInError) {
          console.error('❌ Sign in failed:', signInError.message);
          console.error('\n💡 Possible solutions:');
          console.error('   1. Delete the user from Supabase Dashboard → Authentication → Users');
          console.error('   2. Reset the password in Supabase Dashboard');
          console.error('   3. Check if email confirmation is required');
          process.exit(1);
        } else {
          console.log('✅ User exists and credentials are valid!');
          console.log(`   User ID: ${signInData.user.id}`);
          console.log(`   Email: ${signInData.user.email}`);
          console.log(`   Email Confirmed: ${signInData.user.email_confirmed_at ? 'Yes' : 'No'}`);
          
          if (!signInData.user.email_confirmed_at) {
            console.log('\n⚠️  Email not confirmed. User may need to confirm email to login.');
            console.log('   In Supabase Dashboard, you can manually confirm the email.');
          }
          
          await supabase.auth.signOut();
          return;
        }
      } else {
        console.error('❌ Failed to create user:', error.message);
        console.error(`   Status: ${error.status || 'N/A'}`);
        process.exit(1);
      }
    }
    
    if (data.user) {
      console.log('✅ User created successfully!');
      console.log(`\n📋 User Details:`);
      console.log(`   ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Email Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Created: ${new Date(data.user.created_at).toLocaleString()}`);
      
      if (!data.user.email_confirmed_at) {
        console.log('\n⚠️  Email confirmation required!');
        console.log('   To auto-confirm (for testing):');
        console.log('   1. Go to Supabase Dashboard → Authentication → Users');
        console.log(`   2. Find user: ${userEmail}`);
        console.log('   3. Click "..." → "Confirm email"');
        console.log('\n   Or disable email confirmation in:');
        console.log('   Authentication → Settings → Email Auth → "Enable email confirmations" (uncheck)');
      } else {
        console.log('\n✅ User is ready to login!');
      }
      
      // Check for profile
      console.log('\n🔍 Checking for profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .or(`id.eq.${data.user.id},user_id.eq.${data.user.id}`)
        .maybeSingle();
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.warn(`   ⚠️  Profile check error: ${profileError.message}`);
        console.log('   Profile will be created automatically on first login or by trigger.');
      } else if (profile) {
        console.log('✅ Profile found:');
        console.log(`   ID: ${profile.id || profile.user_id}`);
      } else {
        console.log('⚠️  No profile found - will be created on first login');
      }
      
      await supabase.auth.signOut();
      console.log('\n✅ Setup completed!');
    } else {
      console.error('❌ No user data returned');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

createUser();
