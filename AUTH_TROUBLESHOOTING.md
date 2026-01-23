# Authentication Troubleshooting

## Issue Analysis

### ✅ What's Working
- **Test Script**: Authentication works successfully via `npm run test:auth`
- **User Created**: `jamal@driiva.co.uk` exists in Supabase
- **Email Confirmed**: Test shows `email_verified: true`
- **Credentials Valid**: Password `Dmoney97!` is correct

### ❌ What's Not Working
- **Browser Login**: Login fails in the browser UI
- **Error Display**: Button shows "Log in failed!" but specific error not visible

## Root Cause Analysis

### 1. **Username vs Email Confusion** ✅ FIXED
- **Problem**: Form label said "Username" but code expects email
- **Solution**: Changed label to "Email", updated input type to `email`, updated placeholder
- **Impact**: Users were confused about what to enter

### 2. **Possible Browser Issues**

#### A. Email Confirmation Status
Even though test script shows `email_verified: true`, the browser session might be checking differently.

**Check**: Open browser console and look for error message:
- `"Email not confirmed"` → User needs to confirm email in Supabase Dashboard
- `"Invalid login credentials"` → Password might be wrong or user doesn't exist
- `"Invalid API key"` → Supabase configuration issue

#### B. CORS/Network Issues
Browser might be blocking the request due to CORS or network configuration.

**Check**: 
1. Open browser DevTools → Network tab
2. Try to login
3. Look for failed requests to `supabase.co/auth/v1/token`
4. Check for CORS errors or 401/403 responses

#### C. Session/Cache Issues
Browser might have cached old session or credentials.

**Solution**: 
- Clear browser cache and cookies
- Try incognito/private window
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

## Troubleshooting Steps

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Try to login
4. Look for error messages starting with `[SignIn]`

### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Try to login
3. Find request to `supabase.co/auth/v1/token`
4. Check:
   - Status code (should be 200 for success)
   - Response body (check for error message)
   - Request headers (check if API key is included)

### Step 3: Verify Supabase Settings
1. Go to Supabase Dashboard → Authentication → Users
2. Find `jamal@driiva.co.uk`
3. Verify:
   - ✅ Email is confirmed (green checkmark)
   - ✅ User is active (not disabled)
   - ✅ Password is set correctly

### Step 4: Test with Test Script
```bash
npm run test:auth
```
If this works but browser doesn't, it's a browser-specific issue.

## Common Error Messages & Solutions

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Invalid email or password" | Wrong credentials or user doesn't exist | Verify credentials, check user exists in Supabase |
| "Email not confirmed" | Email confirmation required | Confirm email in Supabase Dashboard |
| "Invalid API key" | Supabase config issue | Check `VITE_SUPABASE_ANON_KEY` in `client/.env` |
| "Network error" | CORS or connection issue | Check Supabase URL, check network connection |
| "401 Unauthorized" | API key or CORS issue | Verify API key, check Supabase CORS settings |

## Next Steps

1. **Check browser console** for specific error message
2. **Verify email confirmation** in Supabase Dashboard
3. **Test in incognito mode** to rule out cache issues
4. **Compare test script vs browser** - if test works but browser doesn't, it's likely:
   - CORS configuration
   - Browser security settings
   - Session/cache issues

## Fixed Issues

✅ **Label Updated**: Changed "Username" to "Email" to avoid confusion
✅ **Input Type**: Changed to `type="email"` for better validation
✅ **Placeholder**: Updated to "Enter your email"
✅ **Error Messages**: Updated to say "email" instead of "username"
✅ **Auto-complete**: Added `autoComplete="email"` attribute
