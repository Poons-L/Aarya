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

## Migrations Applied

The following database optimizations have been completed automatically:

### Foreign Key Indexes Added ✓

Added 24 missing indexes on foreign key columns across all tables:
- `ai_usage_logs`: contact_id
- `contact_events`: contact_id, event_id, session_id
- `conversation_key_points`: conversation_id
- `conversations`: contact_id, user_id
- `events`: user_id
- `files`: linked_contact_id, linked_memory_id, user_id
- `meetings`: session_id, user_id
- `memories`: event_id, linked_contact_id, session_id, user_id
- `reminders`: contact_id, user_id
- `session_notes`: session_id, user_id
- `sessions`: event_id
- `user_event_preferences`: event_id

**Benefits:**
- Significantly improved JOIN performance
- Faster foreign key constraint validation
- Better query execution plans
- Enhanced overall database performance

### Unused Indexes Removed ✓

Removed 1 unused index to improve write performance:
- `idx_ai_usage_logs_user_id` (was not being used by any queries)

**Benefits:**
- Faster INSERT, UPDATE, and DELETE operations on ai_usage_logs
- Reduced storage overhead
- No negative impact on query performance

---

## Next Steps

1. Complete the Auth DB Connection Strategy configuration
2. Enable Leaked Password Protection
3. Monitor database performance after index removal
4. Review authentication logs after enabling password protection

---

**Note:** These manual configuration steps are required because they involve Supabase platform settings that cannot be modified via SQL or migrations.
