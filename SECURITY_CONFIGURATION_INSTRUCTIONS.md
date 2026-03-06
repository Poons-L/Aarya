# Security Configuration Instructions

This document contains instructions for configuring security settings that must be done through the Supabase Dashboard.

## 1. Auth DB Connection Strategy (Required)

**Issue:** Your project's Auth server is configured to use a fixed number of connections (10). This prevents the Auth server from benefiting from instance size increases.

**Solution:** Switch to percentage-based connection allocation.

### Steps:

1. Go to your Supabase Dashboard
2. Navigate to **Settings** > **Database** > **Connection Pooling**
3. Find the **Auth Connection Pool** section
4. Change from **Fixed Number** to **Percentage-based**
5. Set the percentage to **15-30%** (recommended starting point: 20%)
6. Click **Save**

### Benefits:
- Auth server automatically scales with database instance size
- Better resource utilization
- Improved performance during high traffic

---

## 2. Leaked Password Protection (Required)

**Issue:** Password leak protection is currently disabled. This feature prevents users from using passwords that have been compromised in data breaches.

**Solution:** Enable HaveIBeenPwned.org integration.

### Steps:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Policies**
3. Find **Password Protection** section
4. Enable **"Check passwords against HaveIBeenPwned database"**
5. Click **Save**

### Benefits:
- Prevents users from using compromised passwords
- Reduces account takeover risk
- Enhances overall security posture
- Zero cost (HaveIBeenPwned.org is free)

### How It Works:
- When users sign up or change passwords, the password is checked against a database of known compromised passwords
- If the password has been leaked, the user is prompted to choose a different one
- The check is done securely using k-anonymity (your actual password is never sent)

---

## Migration Applied

The following database optimization has been completed automatically:

### Unused Indexes Removed ✓

All unused database indexes have been dropped to improve performance:
- Faster INSERT, UPDATE, and DELETE operations
- Reduced storage usage
- No impact on query performance (indexes were not being used)

**Total indexes removed:** 35

If specific queries become slow in the future, indexes can be selectively re-added based on actual usage patterns.

---

## Next Steps

1. Complete the Auth DB Connection Strategy configuration
2. Enable Leaked Password Protection
3. Monitor database performance after index removal
4. Review authentication logs after enabling password protection

---

**Note:** These manual configuration steps are required because they involve Supabase platform settings that cannot be modified via SQL or migrations.
