# GDPR Compliance Guide - Flyt

Omfattende guide for hvordan håndtere GDPR-forespørsler og compliance.

## Table of Contents
1. [User Rights](#user-rights)
2. [Audit Logging](#audit-logging)
3. [Handling Requests](#handling-requests)
4. [Data Export](#data-export)
5. [Account Deletion](#account-deletion)
6. [Compliance Checklist](#compliance-checklist)

---

## User Rights

Under GDPR har brukere rett til:

### 1. Right to Access (Innsyn)
**Article 15**
- Bruker kan be om kopi av all data du har om dem
- **Tidsfrist:** 30 dager
- **Gratis:** Ja (første forespørsel)

### 2. Right to Rectification (Retting)
**Article 16**
- Bruker kan be om å rette feil data
- **Tidsfrist:** 30 dager
- **Implementert:** Via app settings (display name, etc.)

### 3. Right to Erasure (Sletting / "Rett til å bli glemt")
**Article 17**
- Bruker kan be om å slette all data
- **Tidsfrist:** 30 dager
- **Unntak:** Juridiske forpliktelser (f.eks. regnskapsdata)

### 4. Right to Restriction (Begrensning)
**Article 18**
- Bruker kan be om å begrense behandling av data
- **Tidsfrist:** 30 dager
- **Sjelden brukt** i denne typen app

### 5. Right to Data Portability (Dataportabilitet)
**Article 20**
- Bruker kan be om data i maskinlesbart format
- **Tidsfrist:** 30 dager
- **Format:** JSON eller CSV

### 6. Right to Object (Innsigelse)
**Article 21**
- Bruker kan protestere mot databehandling
- **Gjelder:** Hovedsakelig marketing (som vi ikke gjør)

---

## Audit Logging

### Setup

Kjør SQL-scriptet for å sette opp logging:

```bash
# Fra Supabase Dashboard → SQL Editor
# Kjør: supabase/gdpr_audit_log.sql
```

### Database Schema

**Table:** `gdpr_requests`
- Lagrer alle GDPR-forespørsler
- Inkluderer timestamp, type, status, og notater
- Audit trail med IP og user agent

**Request Types:**
- `access` - Innsyn
- `rectification` - Retting
- `erasure` - Sletting
- `restriction` - Begrensning
- `portability` - Dataportabilitet
- `objection` - Innsigelse

**Request Status:**
- `pending` - Mottatt, ikke behandlet
- `in_progress` - Under behandling
- `completed` - Fullført
- `rejected` - Avvist (med begrunnelse)
- `cancelled` - Kansellert av bruker

---

## Handling Requests

### In-App Flow (Future Implementation)

**Legg til i ProfileScreen eller Settings:**

```typescript
// apps/mobile/src/screens/ProfileScreen.tsx

const handleSubmitGDPRRequest = async (type: 'access' | 'erasure' | 'portability') => {
  try {
    const { data, error } = await supabase.rpc('submit_gdpr_request', {
      p_request_type: type,
      p_user_notes: userNotes,
      p_ip_address: null, // Can get from device if needed
      p_user_agent: null, // Can get from device
    });

    if (error) throw error;

    Alert.alert(
      'Forespørsel sendt',
      'Vi vil behandle din forespørsel innen 30 dager. Du vil motta en e-post når den er klar.'
    );
  } catch (error) {
    console.error('GDPR request error:', error);
    Alert.alert('Feil', 'Kunne ikke sende forespørsel');
  }
};
```

### Email Flow (Current)

**When user emails support:**

1. **Log request manually:**
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO gdpr_requests (user_id, user_email, request_type, user_notes)
   VALUES (
     'user-uuid-here',
     'user@example.com',
     'access', -- or 'erasure', 'portability', etc.
     'User emailed support requesting data access'
   );
   ```

2. **Process request** (see below)

3. **Update status:**
   ```sql
   SELECT process_gdpr_request(
     'request-uuid',
     'completed',
     'Data exported and sent via email',
     null,
     null,
     'admin@flytfamilie.no'
   );
   ```

---

## Data Export

### Right to Access (Innsyn)

**What to export:**
- User account info (email, name, created date)
- Household membership
- Schedule assignments
- Day notes
- Equipment status

**Export SQL Query:**

```sql
-- Get user's household_id first
SELECT household_id FROM household_members WHERE user_id = 'user-uuid-here';

-- Export all data
WITH user_info AS (
  SELECT
    email,
    created_at as account_created,
    last_sign_in_at
  FROM auth.users
  WHERE id = 'user-uuid-here'
),
household_info AS (
  SELECT
    h.name as household_name,
    hm.display_name,
    hm.role,
    hm.joined_at
  FROM household_members hm
  JOIN households h ON h.id = hm.household_id
  WHERE hm.user_id = 'user-uuid-here'
),
children_info AS (
  SELECT
    c.name as child_name,
    c.created_at
  FROM children c
  JOIN household_members hm ON hm.household_id = c.household_id
  WHERE hm.user_id = 'user-uuid-here'
),
schedule_data AS (
  SELECT
    sa.date,
    sa.slot,
    hm.display_name as assigned_to
  FROM schedule_assignments sa
  JOIN household_members hm ON hm.id = sa.assigned_member_id
  WHERE sa.household_id IN (
    SELECT household_id FROM household_members WHERE user_id = 'user-uuid-here'
  )
  ORDER BY sa.date DESC
),
notes_data AS (
  SELECT
    dn.date,
    dn.content,
    dn.created_at
  FROM day_notes dn
  WHERE dn.household_id IN (
    SELECT household_id FROM household_members WHERE user_id = 'user-uuid-here'
  )
  ORDER BY dn.date DESC
),
equipment_data AS (
  SELECT
    ei.label as item_name,
    es.status,
    es.updated_at
  FROM equipment_status es
  JOIN equipment_items ei ON ei.key = es.item_key
  WHERE es.child_id IN (
    SELECT c.id FROM children c
    JOIN household_members hm ON hm.household_id = c.household_id
    WHERE hm.user_id = 'user-uuid-here'
  )
)
SELECT
  'User Info' as section,
  json_agg(user_info) as data
FROM user_info
UNION ALL
SELECT 'Household' as section, json_agg(household_info) FROM household_info
UNION ALL
SELECT 'Children' as section, json_agg(children_info) FROM children_info
UNION ALL
SELECT 'Schedule' as section, json_agg(schedule_data) FROM schedule_data
UNION ALL
SELECT 'Notes' as section, json_agg(notes_data) FROM notes_data
UNION ALL
SELECT 'Equipment' as section, json_agg(equipment_data) FROM equipment_data;
```

**Format as JSON and send to user:**
- Save query result as `user_data_export_[date].json`
- Email to user as attachment
- Delete file after 7 days

### Right to Data Portability

Same as "Right to Access" but in machine-readable format (JSON/CSV).

---

## Account Deletion

### Right to Erasure Process

**Important:** Consider if user is the ONLY member of a household!

**Check before deleting:**
```sql
-- Find user's households
SELECT
  h.id as household_id,
  h.name as household_name,
  COUNT(hm.id) as member_count
FROM households h
JOIN household_members hm ON hm.household_id = h.id
WHERE h.id IN (
  SELECT household_id FROM household_members WHERE user_id = 'user-uuid-here'
)
GROUP BY h.id, h.name;
```

**If user is ONLY member:**
- Delete entire household (will cascade to children, assignments, notes, etc.)

**If household has other members:**
- Only delete user's household_member record
- Reassign their schedule assignments to NULL
- Keep household and children

**Deletion SQL:**

```sql
-- For single-member household (delete everything)
DELETE FROM households
WHERE id IN (
  SELECT household_id FROM household_members
  WHERE user_id = 'user-uuid-here'
  GROUP BY household_id
  HAVING COUNT(*) = 1
);

-- For multi-member household (remove user only)
-- First reassign schedule assignments
UPDATE schedule_assignments
SET assigned_member_id = NULL, assigned_user_id = NULL
WHERE assigned_user_id = 'user-uuid-here';

-- Then delete member record
DELETE FROM household_members
WHERE user_id = 'user-uuid-here';

-- Finally delete auth user
DELETE FROM auth.users
WHERE id = 'user-uuid-here';
```

**Update GDPR request:**
```sql
SELECT process_gdpr_request(
  'request-uuid',
  'completed',
  'Account and all data deleted',
  null,
  null,
  'admin@flytfamilie.no'
);
```

---

## Compliance Checklist

### Before Launch
- [ ] Privacy policy published at https://flytfamilie.no/privacy
- [ ] Terms of service published at https://flytfamilie.no/terms
- [ ] GDPR audit log database schema created
- [ ] Data export procedure documented
- [ ] Account deletion procedure documented
- [ ] Support email set up for GDPR requests
- [ ] 30-day response SLA documented

### Ongoing
- [ ] Review GDPR requests weekly
- [ ] Respond within 30 days
- [ ] Keep audit log for 3 years minimum
- [ ] Update privacy policy when adding new features
- [ ] Annual GDPR compliance review

### On User Request
- [ ] Log request in `gdpr_requests` table
- [ ] Send confirmation email (received within 24h)
- [ ] Process request (complete within 30 days)
- [ ] Send fulfillment email
- [ ] Update request status in database

---

## Contact Handling

**Where users can reach you:**
1. In-app (future): Settings → Privacy → GDPR Requests
2. Email: [Add your support email]
3. Website: https://flytfamilie.no/privacy (contact form)

**Email templates:** (Create these)

**Template 1: Request Received**
```
Subject: Vi har mottatt din forespørsel

Hei,

Vi har mottatt din forespørsel om [access/sletting/eksport] av dine personopplysninger.

Vi vil behandle forespørselen din innen 30 dager, som kreves under GDPR.
Du vil motta en ny e-post når forespørselen er behandlet.

Referansenummer: [request-uuid]

Med vennlig hilsen,
Flyt-teamet
```

**Template 2: Request Completed (Access)**
```
Subject: Dine personopplysninger er klare

Hei,

Din forespørsel om innsyn i personopplysninger er nå behandlet.
Vedlagt finner du en JSON-fil med alle dine data.

Filen vil bli slettet fra våre servere om 7 dager.

Med vennlig hilsen,
Flyt-teamet
```

**Template 3: Account Deleted**
```
Subject: Din konto er slettet

Hei,

Din forespørsel om sletting av konto er nå behandlet.
All din data er permanent slettet fra våre systemer.

Vi beklager at du forlater oss, og ønsker deg lykke til videre!

Med vennlig hilsen,
Flyt-teamet
```

---

## Penalties for Non-Compliance

**GDPR fines:**
- Up to €20 million or 4% of global annual revenue (whichever is higher)
- Lesser fines: €10 million or 2% of revenue

**Common violations:**
- Not responding within 30 days
- Not having proper audit trail
- Not deleting data when requested
- Not having updated privacy policy

**Best practice:**
- Be conservative - when in doubt, delete
- Keep audit trail of all requests
- Respond quickly (even if just "we're working on it")
- Over-communicate with users

---

Last updated: 2026-02-23
