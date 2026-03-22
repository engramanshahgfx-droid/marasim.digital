# 🔐 Secure Credential Management Guide

## Immediate Actions (Do This Now!)

Your Twilio credentials were exposed in a screenshot. Follow these steps:

### Step 1: Rotate Your Twilio Credentials

**Get new Auth Token:**
1. Go to [Twilio Console](https://console.twilio.com)
2. Click **Account** → **API Keys & Credentials**
3. Under "Auth tokens", click **Request a secondary token**
4. Save the new token securely
5. Delete the old exposed token

**Rotate API Key:**
1. Find your API key: `SK1685b74bef2f69f81b6bc11d04d876ca`
2. Click **Duplicate key** to create a new one (Restricted type recommended)
3. Update your `.env` with new key
4. Delete the old key

### Step 2: Update Your .env File

```env
# Update with NEW credentials only
TWILIO_ACCOUNT_SID=AC653c8a8b55bee6795b78e12148bdb868
TWILIO_AUTH_TOKEN=<YOUR_NEW_TOKEN>
TWILIO_VERIFY_SERVICE_SID=VA...
```

### Step 3: Verify Git Safety

```bash
# Check if .env was ever committed
git log --all --full-history -- ".env" | head -20

# If committed, you need to remove it from history
# See "Remove Secrets from Git History" section below
```

### Step 4: Check for Unauthorized Access

1. Go to Twilio Console → **Account** → **Audit Events**
2. Look for last 24-48 hours
3. Check who accessed account, when, and what they did
4. If suspicious activity, contact Twilio support immediately

---

## Environment Variables Best Practices

### ✅ DO

```env
# Use descriptive names
TWILIO_ACCOUNT_SID=AC...          # Public (safe to share)
TWILIO_AUTH_TOKEN=xxx...          # Secret (NEVER share)
DATABASE_URL=postgresql://...     # Secret

# Use .env (gitignored)
# Mark sensitive in comments
# Rotate regularly (quarterly minimum)
```

### ❌ DON'T

```javascript
// ❌ WRONG - Hardcoded credentials
const twilioClient = twilio('AC653c8a8b55bee6795b78e12148bdb868', 'd2e098c3991d152d840fa1c2f3e3ac3e')

// ❌ WRONG - Credentials in logs
console.log(`Using token: ${process.env.TWILIO_AUTH_TOKEN}`)

// ❌ WRONG - Credentials in Git
git add .env
git commit -m "Add Twilio config"  // BAD!

// ❌ WRONG - Sharing in screenshots/Slack
```

---

## Updated .gitignore

Your `.gitignore` now properly excludes:

```gitignore
# Environment files (ALL of them)
.env
.env.local
.env.*.local
.env.production.local
.env.development.local
.env.test.local
```

**Verify it's working:**
```bash
git status
# Should NOT show .env files
```

---

## If Credentials Were Committed to Git

If you ever committed `.env` to Git, you need to remove it from history:

```bash
# Option 1: Using git-filter-repo (recommended)
pip install git-filter-repo
git filter-repo --invert-paths --path .env

# Option 2: Using GitGuardian to scan for secrets
# Go to https://www.gitguardian.com
# Scan your repo for exposed secrets

# Option 3: Nuclear option (full history rewrite)
# This is complex - consult Git docs
```

**After removing from history:**
1. Force push: `git push --force-with-lease origin main`
2. Notify collaborators to re-clone
3. All credentials are now safe

---

## Credential Rotation Schedule

| Resource | Rotation | When |
|----------|----------|------|
| Auth Token | Every 90 days | Quarterly |
| API Keys | Every 90 days | Quarterly |
| Database Password | Every 180 days | Bi-annually |
| SSL Certificates | Every 365 days | Annually |
| User Passwords | Every 90 days | Quarterly |

**Add to calendar:** Set reminders for rotation dates

---

## Secure Secrets in Production

### Deployment (Vercel/Netlify/Heroku)

**Never use local .env in production!**

Instead:
```bash
# Vercel
vercel env add TWILIO_AUTH_TOKEN
# Enter value securely in UI

# Heroku
heroku config:set TWILIO_AUTH_TOKEN=xxx

# AWS Secrets Manager
aws secretsmanager create-secret --name twilio-auth-token
```

### Development Workflow

```bash
# 1. Get credentials from secure manager (1Password, Lastpass, etc.)
# 2. Add to local .env (gitignored)
# 3. Never commit .env
# 4. Use .env.example as template
```

---

## .env.example Template

This is SAFE to commit (no real values):

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=AC...                    # Account SID (safe)
TWILIO_AUTH_TOKEN=your_token_here           # NEVER put real value
TWILIO_VERIFY_SERVICE_SID=VA...

# Database
DATABASE_URL=postgresql://user:pass@host/db # Template only

# API Keys
RESEND_API_KEY=re_...                       # Template only
STRIPE_SECRET_KEY=sk_test_...              # Template only
```

**For developers:**
```bash
# Copy template
cp .env.example .env

# Fill in ONLY YOUR LOCAL VALUES
# Don't share .env with team (use password manager)
```

---

## Detecting Exposed Secrets

### Automated Scanning

GitHub.com automatically scans for exposed secrets. If you commit credentials:

```
⚠️ GitHub Secret Scanner detected exposed credentials
```

**GitHub will:**
1. Alert you (email notification)
2. Automatically revoke (some providers)
3. Request immediate action

**You must:**
1. Rotate credentials immediately
2. Remove from history (git-filter-repo)
3. Review GitHub security advisories

### Manual Scanning

Search your codebase:

```bash
# Look for hardcoded secrets
grep -r "TWILIO_AUTH_TOKEN" src/ --include="*.ts" --include="*.js"
grep -r "sk_live_" . --include="*.env*"
grep -r "password.*=" . --include="*.ts"

# Look in Git history
git log -p | grep -i "auth.*token"
```

---

## Security Checklist

- [ ] Rotated ALL exposed Twilio credentials
- [ ] Updated .env with new values
- [ ] Updated .gitignore to exclude .env
- [ ] Checked if .env was ever committed to Git
- [ ] Removed from Git history if needed
- [ ] Verified no credentials in code (src/ files)
- [ ] Checked Audit Events for unauthorized access
- [ ] Set calendar reminders for rotation (90 days)
- [ ] Moved production secrets to Vercel/deployment platform
- [ ] Documented credential rotation procedure

---

## Team Security Guide

### For Distributed Teams

1. **Use 1Password/LastPass/Vault**
   - Store credentials in password manager
   - Share securely with team
   - Audit access logs

2. **No Email/Slack for Secrets**
   - Never send credentials via unencrypted channels
   - Use private password managers only
   - Use VPN for accessing accounts

3. **Local Development Only**
   - Each developer gets own API keys
   - Keys are limited in scope/permissions
   - Easy to revoke if developer leaves

### Onboarding New Developer

1. Create restricted API key for them
2. Share via secure channel (password manager)
3. They add to local .env (never committed)
4. They never see other developers' keys
5. When they leave, revoke their keys

---

## Twilio-Specific Security

### Use Restricted API Keys (recommended)

Instead of Auth Token, create API Key with limited permissions:

```typescript
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_API_KEY,    // Use API Key instead of Auth Token
  { 
    region: 'ie',
    edge: 'dublin'
  }
)
```

**Benefits:**
- Limited to specific APIs
- Can revoke without affecting other services
- Better audit trail
- Includes IP whitelist options

### Enable Audit Logging

```
Twilio Console → Account → Audit Events
Enable and monitor:
- Login attempts
- API calls
- Credential creation/deletion
- Configuration changes
```

### Whitelist IP Addresses

In Twilio Account Settings:
```
API Keys & Credentials → Edit → Restrict API Access
Add IP whitelist (if on static IP)
```

---

## Recovery Steps If Compromised

### If Credentials Are Exposed

1. **Immediately rotate** (within minutes)
2. **Check audit log** for unauthorized activity
3. **Review all API calls** from last 24 hours
4. **Contact Twilio support** if suspected abuse
5. **Document incident** for your records
6. **Review security practices** to prevent recurrence

### If Unauthorized Charges

1. Contact Twilio support immediately
2. Request charge reversal
3. Provide evidence of unauthorized use
4. Review account for policy violations
5. Report to your manager/security team

---

## Resources

- [Twilio Security Best Practices](https://www.twilio.com/docs/security)
- [Git Secrets Scanning](https://git-secret.io/)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [1Password for Teams](https://1password.com/sign-up/)

---

**Last Updated:** March 18, 2026
**Critical:** These credentials must be rotated immediately.
