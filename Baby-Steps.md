# Baby Steps: Deploy Aztech Co-Works to cPanel

**For:** Praveen (or anyone with cPanel access)
**Time:** ~1.5 hours
**What you need:** cPanel login, domain DNS access, a browser

This is the simplest, most hand-holding version of the deployment guide. Follow each step exactly. If something doesn't work, stop and check before moving on.

---

## Step 1: Login to cPanel (2 min)

1. Open your cPanel URL in a browser (usually `https://yourdomain.com:2083` or from your hosting provider's dashboard)
2. Login with your cPanel username and password
3. You should see the cPanel home screen with lots of icons

---

## Step 2: Check PHP Version (3 min)

1. In cPanel, search for **"MultiPHP Manager"** (or **"PHP Version"** in some hosts)
2. Find your domain in the list
3. Make sure PHP version is **8.1 or higher** (8.2 or 8.3 is best)
4. If it's lower, change it to 8.1+ and click "Apply"

**Why:** The backend code uses PHP 8.1 features. It won't work on PHP 7.x.

---

## Step 3: Create the API Subdomain (5 min)

1. In cPanel, search for **"Domains"** (or **"Subdomains"** in older cPanel)
2. Click **"Create A New Domain"** (or **"Create"**)
3. Enter: `api.aztechcoworks.in`
4. Set the document root to: `public_html/api` (cPanel may auto-fill this)
5. Click **"Submit"** or **"Create"**

**What this does:** Creates a folder at `public_html/api/` where your backend will live. Anyone visiting `api.aztechcoworks.in` will hit files in that folder.

---

## Step 4: Upload the Backend Files (10 min)

**Option A: Using cPanel File Manager (easier)**

1. In cPanel, open **"File Manager"**
2. Navigate to `public_html/api/` (the folder from Step 3)
3. You need to upload these files from the `server-php/` folder in the project:

```
Upload these files to public_html/api/:
├── .htaccess
├── index.php
└── src/
    ├── bootstrap.php
    ├── Db.php
    ├── Email.php
    ├── Router.php
    ├── Whatsapp.php
    ├── routes.php
    └── routes/
        ├── auth.php
        ├── dashboard.php
        ├── payment.php
        └── public.php
```

**How to upload in File Manager:**
1. First create the folders: Click **"+ Folder"** → name it `src` → click Create
2. Go into `src/`, create another folder called `routes`
3. Go back to `public_html/api/`
4. Click **"Upload"** → drag and drop `.htaccess` and `index.php`
5. Go into `src/` → Upload `bootstrap.php`, `Db.php`, `Email.php`, `Router.php`, `Whatsapp.php`, `routes.php`
6. Go into `src/routes/` → Upload `auth.php`, `dashboard.php`, `payment.php`, `public.php`

**Option B: Using SFTP (faster for tech users)**

1. Use FileZilla or any SFTP client
2. Connect with your cPanel credentials (host, username, password, port 21 or 22)
3. Upload the entire contents of `server-php/` to `public_html/api/`
4. Do NOT upload `data/`, `.gitignore`, or `.env.example`

---

## Step 5: Create the .env File (5 min)

1. In File Manager, go to `public_html/api/`
2. Click **"+ File"** → name it `.env` → click Create
3. Right-click the `.env` file → **"Edit"**
4. Paste this:

```
SITE_URL=https://aztechcoworks.in
CORS_ORIGIN=https://aztechcoworks.in

RESEND_API_KEY=
EMAIL_FROM=Aztech Co-Works <noreply@aztechcoworks.in>

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

WHATSAPP_API_KEY=
WHATSAPP_API_URL=
WHATSAPP_PHONE_ID=
```

5. Click **"Save Changes"**

**Note:** Everything is blank except the URLs. This is fine! The app works in demo mode without any API keys. You'll fill these in later.

---

## Step 6: Test the API (2 min)

Open this URL in your browser:

```
https://api.aztechcoworks.in/api/public/branches
```

**If you see JSON data with 6 branches:** It's working! Skip to Step 8.

**If you see a blank page or error:** Go to Step 7 (troubleshooting).

---

## Step 7: Troubleshooting (if needed)

### "500 Internal Server Error"
1. In cPanel, search for **"Errors"** or **"Error Log"**
2. Look at the most recent error. Common issues:
   - **"Class PDO not found"** → PHP `pdo_sqlite` extension not enabled. Go to cPanel > "Select PHP Version" > check `pdo_sqlite`
   - **"syntax error"** → PHP version is too old. Go back to Step 2
   - **"Permission denied"** → The `data/` directory can't be created. In File Manager, create a `data/` folder inside `public_html/api/` and set permissions to 755

### "404 Not Found"
- The `.htaccess` file is missing or not uploaded
- Or your hosting doesn't have `mod_rewrite` enabled. Contact your host.

### "403 Forbidden"
- Check file permissions. All `.php` files should be 644, directories should be 755
- In File Manager, right-click a file → "Change Permissions" → set to 644

### Blank page, no error
- Try: `https://api.aztechcoworks.in/index.php/api/public/branches`
- If that works, `mod_rewrite` isn't working. Contact your host.

---

## Step 8: Connect the Frontend (5 min)

1. Go to **Cloudflare Dashboard** (https://dash.cloudflare.com)
2. Find your Pages project (the frontend)
3. Go to **Settings** > **Environment variables**
4. Click **"Add variable"** for **Production**:

| Variable name | Value |
|---------------|-------|
| `VITE_API_URL` | `https://api.aztechcoworks.in` |

5. Click **Save**
6. Go to **Deployments** → click **"Retry deployment"** on the latest deployment (or push any commit to trigger a new build)
7. Wait 1-2 minutes for the build to finish

---

## Step 9: Test Everything (15 min)

Open `https://aztechcoworks.in` in your browser.

**Check these one by one:**

- [ ] Homepage loads (not the "Backend not connected" amber banner)
- [ ] Click "Branches" — see all 6 locations
- [ ] Click "Pricing" — see 5 plans with prices
- [ ] Click "Sign in" → click any demo account card → dashboard loads
- [ ] As admin: check Leads, Tasks, Site Visits, Users pages
- [ ] As member: check Bookings, Invoices, Membership pages
- [ ] Click "Sign out" → sign back in
- [ ] Try "Register" with a new email — should create account
- [ ] Try "Forgot password" — should say "Check your email" (email goes to server error log for now)

**If the amber "Backend not connected" banner shows:** The frontend can't reach the API. Check:
1. Is `VITE_API_URL` set correctly in Cloudflare Pages?
2. Did you redeploy after setting it?
3. Does `https://api.aztechcoworks.in/api/public/branches` work in a browser?
4. Open browser DevTools (F12) → Console tab → look for CORS errors

---

## Step 10: DNS (only if api subdomain doesn't work) (10 min)

If `api.aztechcoworks.in` doesn't resolve, you need a DNS record:

1. Go to wherever your domain DNS is managed (Cloudflare, GoDaddy, Namecheap, etc.)
2. Add an **A record**:
   - Name: `api`
   - Value: your cPanel server's IP address (find it in cPanel home page, top right)
   - TTL: Auto
3. Wait 5-30 minutes for DNS propagation
4. Try the API URL again

---

## You're Live!

At this point:
- Frontend is on Cloudflare Pages
- Backend is on cPanel
- Database auto-seeded with demo data
- Payments work in demo mode (auto-succeed)
- Emails log to server error log (until you add Resend API key)

---

## Later: Add Real Services (when ready)

### Add Razorpay (after KYC approval)

1. Get your `Key ID` and `Key Secret` from Razorpay Dashboard
2. In cPanel File Manager, edit `public_html/api/.env`
3. Fill in:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=your_secret_here
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```
4. Save. Done — real payments now work.

### Add Email (Resend)

1. Sign up at https://resend.com
2. Add domain `aztechcoworks.in`, add the DNS records they give you
3. Create an API key
4. Edit `.env`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   ```
5. Save. Done — real emails now send.

### Add Google Analytics

1. Create GA4 property at https://analytics.google.com
2. Get the Measurement ID (starts with `G-`)
3. In Cloudflare Pages env vars, add:
   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
4. Redeploy. Done — tracking starts.

---

## Change Admin Password (Important!)

The demo password for all accounts is `demo1234`. Change the admin password:

1. Open `https://aztechcoworks.in/auth`
2. Login as admin: `admin@aztechcoworks.in` / `demo1234`
3. (If there's no password change UI yet): Edit `src/Db.php` on the server, change the seed password, delete the `data/aztech.db` file, and reload any page to re-seed

---

## Daily Backup (Recommended)

Set up automatic database backups:

1. In cPanel, search for **"Cron Jobs"**
2. Add a new cron job:
   - Schedule: Once per day (e.g., `0 2 * * *` = 2:00 AM daily)
   - Command: `cp /home/USERNAME/public_html/api/data/aztech.db /home/USERNAME/backups/aztech-$(date +\%F).db`
3. Create the `backups/` directory first: in File Manager, go to your home directory, create folder `backups`

Replace `USERNAME` with your cPanel username.

---

**That's it. You're deployed. No VPS, no Docker, no command line. Just cPanel.**
