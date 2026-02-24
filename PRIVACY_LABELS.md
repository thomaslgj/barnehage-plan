# App Store Privacy Labels - Flyt

Dokumentasjon for hvilke data appen samler og hvordan det brukes.
Bruk dette når du publiserer til App Store (iOS) og Google Play (Android).

## Data Collection Overview

### Data Types Collected

| Data Type | Purpose | Linked to User | Used for Tracking |
|-----------|---------|----------------|-------------------|
| Email Address | Account creation & login | ✅ Yes | ❌ No |
| Name (Display Name) | User identification in app | ✅ Yes | ❌ No |
| User Content (Schedules, Notes) | Core app functionality | ✅ Yes | ❌ No |
| Device ID (Push Token) | Push notifications | ✅ Yes | ❌ No |

### Data NOT Collected
- ❌ Precise location
- ❌ Browsing history
- ❌ Search history
- ❌ Purchase history
- ❌ Financial info
- ❌ Health & fitness data
- ❌ Photos or videos
- ❌ Audio data
- ❌ Contacts
- ❌ User-generated content (beyond app's purpose)

### Biometric Data (Special Case)
- **Face ID / Touch ID**: Used for authentication
- **Storage**: Stored LOCALLY on device only (never sent to server)
- **Purpose**: Quick login
- **Linked to user**: No (never leaves device)

---

## Apple App Store - Data Privacy Details

### Contact Info

**Email Address**
- **Data Use:** App functionality, Account management
- **Linked to User:** Yes
- **Used for Tracking:** No
- **Optional:** No (required for account)

### Identifiers

**User ID**
- **Data Use:** App functionality
- **Linked to User:** Yes
- **Used for Tracking:** No
- **Optional:** No

**Device ID (Push Token)**
- **Data Use:** App functionality (push notifications)
- **Linked to User:** Yes
- **Used for Tracking:** No
- **Optional:** Yes (can disable notifications)

### User Content

**Schedule Assignments (Pickup/Dropoff)**
- **Data Use:** App functionality
- **Linked to User:** Yes
- **Used for Tracking:** No
- **Optional:** No (core feature)

**Day Notes**
- **Data Use:** App functionality
- **Linked to User:** Yes
- **Used for Tracking:** No
- **Optional:** Yes

**Equipment Status**
- **Data Use:** App functionality
- **Linked to User:** Yes
- **Used for Tracking:** No
- **Optional:** Yes (can skip in onboarding)

---

## Google Play Store - Data Safety Section

### Data Collected

**Personal Information**
- Name (display name)
- Email address
- **Purpose:** Account creation and identification

**App Activity**
- Schedule assignments (pickup/dropoff times)
- Day notes
- Equipment status
- **Purpose:** Core app functionality

### Data Security

**Encryption in Transit:** Yes (HTTPS/TLS)
**Encryption at Rest:** Yes (Supabase encrypts data)
**Users Can Request Deletion:** Yes

### Data Sharing

**We do NOT share data with:**
- Advertisers
- Analytics companies (beyond anonymous usage)
- Data brokers
- Other third parties

**We DO share data with:**
- Supabase (infrastructure provider) - only for app functionality
- Push notification provider (Expo) - only device tokens

---

## Privacy Policy URL

**Required for both stores:**
`https://flytfamilie.no/privacy`

---

## Data Retention

**Active Accounts:**
- Data stored as long as account is active
- User can delete account at any time

**Deleted Accounts:**
- Data deleted within 30 days
- Backup retention: 90 days (then permanently deleted)

**Inactive Accounts:**
- No automatic deletion
- User must request deletion

---

## User Rights (GDPR)

Users can request:
1. **Access** - See all their data
2. **Correction** - Fix incorrect data
3. **Deletion** - Delete account and all data
4. **Export** - Get data in portable format
5. **Restriction** - Limit how data is used

Contact: [Your email/support email]

---

## Answers to Common App Store Questions

**Does your app collect data?**
✅ Yes

**Is the data linked to the user?**
✅ Yes (it's a personal/household management app)

**Do you use data for tracking?**
❌ No

**Do you share data with third parties for tracking?**
❌ No

**Can users request deletion?**
✅ Yes (in-app + email)

**Does the app have a privacy policy?**
✅ Yes - https://flytfamilie.no/privacy

---

## Testing Before Submission

Before submitting to app stores:

1. ✅ Privacy policy page is live at https://flytfamilie.no/privacy
2. ✅ App has visible link to privacy policy (in settings or onboarding)
3. ✅ Account deletion flow works
4. ✅ Data export works (if implemented)
5. ✅ Terms of service page is live at https://flytfamilie.no/terms

---

## Notes for App Review

**Why we collect email:**
- Required for account creation and login
- Used to send important account notifications (password reset, etc.)
- Not used for marketing without explicit opt-in

**Why we collect display names:**
- Users need to identify each other within shared households
- Not shared outside of household members

**Why we collect schedule/notes:**
- Core functionality of the app (family coordination)
- Only visible to household members
- Not analyzed or used for any other purpose

**Biometric data (Face ID/Touch ID):**
- Handled entirely by iOS/Android system
- We never receive or store biometric data
- Only receive authentication success/failure
- Users can opt-out (use password instead)

---

## Changes to Data Collection

If you add new data collection in future versions:

1. Update this document
2. Update privacy policy on website
3. Update App Store/Google Play listings
4. If significant change: notify users via in-app message
5. May require new app review

---

Last updated: 2026-02-23
