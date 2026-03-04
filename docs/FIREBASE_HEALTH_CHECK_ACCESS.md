# Firebase Health Check Function - Public Access Setup

## Current Status

✅ **Function deployed successfully:** `health` (europe-west2)  
❌ **Returns 403 Forbidden** - Needs public access permissions

**Function URL:** https://europe-west2-driiva.cloudfunctions.net/health

---

## Issue

By default, Cloud Functions require authentication. The health check endpoint needs to be publicly accessible for uptime monitoring services (like UptimeRobot, Pingdom, etc.).

---

## Solution: Grant Public Access

### Option 1: Firebase Console (Recommended - 2 minutes)

1. **Open Firebase Console:**
   https://console.firebase.google.com/project/driiva/functions

2. **Find the `health` function** in the functions list

3. **Click the three dots menu (⋮)** next to the function

4. **Select "Permissions"**

5. **Click "Add Principal"**

6. **Enter:** `allUsers`

7. **Select role:** Cloud Functions Invoker

8. **Click "Save"**

9. **Test the endpoint:**
   ```bash
   curl https://europe-west2-driiva.cloudfunctions.net/health
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "service": "driiva-functions",
     "timestamp": "2026-03-04T..."
   }
   ```

---

### Option 2: Google Cloud Console

1. **Open Cloud Functions:**
   https://console.cloud.google.com/functions/list?project=driiva

2. **Click on the `health` function**

3. **Go to the "PERMISSIONS" tab**

4. **Click "ADD PRINCIPAL"**

5. **Add:**
   - **New principals:** `allUsers`
   - **Role:** Cloud Functions Invoker

6. **Save**

---

### Option 3: gcloud CLI (If you have it installed)

```bash
gcloud functions add-invoker-policy-binding health \
  --region=europe-west2 \
  --member=allUsers \
  --project=driiva
```

---

## Security Note

Making this function public is **safe** because:
- It only returns health status (no sensitive data)
- It performs a read-only Firestore check
- It's designed for uptime monitoring services
- It doesn't expose any user data or business logic

---

## Verification

After granting public access, test with:

```bash
# Should return 200 OK with JSON
curl https://europe-west2-driiva.cloudfunctions.net/health

# Prettier output
curl -s https://europe-west2-driiva.cloudfunctions.net/health | python3 -m json.tool
```

Expected output:
```json
{
  "status": "healthy",
  "service": "driiva-functions",
  "timestamp": "2026-03-04T01:30:00.000Z"
}
```

---

## Integration with Uptime Monitoring

Once public access is granted, you can add this endpoint to:

- **UptimeRobot:** https://uptimerobot.com/
- **Pingdom:** https://www.pingdom.com/
- **StatusCake:** https://www.statuscake.com/
- **BetterUptime:** https://betteruptime.com/

Configure the monitor to:
- **URL:** https://europe-west2-driiva.cloudfunctions.net/health
- **Method:** GET
- **Expected status:** 200
- **Check interval:** 5 minutes
- **Alert on:** Status code ≠ 200 or timeout

---

## Troubleshooting

### Still getting 403 after setting permissions?

1. **Wait 1-2 minutes** for IAM changes to propagate
2. **Try in incognito/private browsing** (clears cache)
3. **Check the function logs:**
   ```bash
   firebase functions:log --only health
   ```

### Function returns 503?

This means Firestore is unreachable:
- Check Firestore rules
- Verify Firebase project billing is active
- Check Cloud Firestore API is enabled

---

## Done!

Once you see `{ "status": "healthy", ... }` when calling the endpoint, the health check is working! 🎉
