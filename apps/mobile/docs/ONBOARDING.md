# Onboarding System

## Oversikt

Onboarding-flowet guider nye brukere gjennom oppsettet av enten en ny husstand eller å bli med i en eksisterende husstand. Systemet støtter også re-onboarding for å endre innstillinger senere.

## Arkitektur

### Hovedkomponenter

**Screens:**
- `OnboardingScreen.tsx` - Multi-step onboarding wizard

**Database RPC Functions:**
- `bootstrap_household()` - Oppretter ny husstand med data
- `accept_household_invite()` - Bli med i eksisterende husstand
- `regenerate_household_invite_code()` - Generer ny invite-kode
- `get_placeholder_name_for_invite()` - Hent placeholder navn fra kode

### Onboarding Modes

**1. Create Household (Opprett husholdning)**
- Ny familie uten eksisterende husstand
- Går gjennom alle setup-steg
- Genererer invite-kode for partner

**2. Join Household (Bli med)**
- Partner skal bli med i eksisterende husstand
- Krever invite-kode
- Erstatter placeholder member

**3. Re-onboarding**
- Eksisterende bruker med husstand
- Kan endre equipment og templates
- Sletter gamle data før lagring av nye

## Create Household Flow

### Steg-for-steg

#### **Initial Choice Screen**

```
┌─────────────────────────────────┐
│  Kom i gang!                    │
│                                 │
│  [Opprett husholdning]          │
│                                 │
│  [Bli med]                      │
└─────────────────────────────────┘
```

**Valg:**
- "Opprett husholdning" → Start create flow (Step 1)
- "Bli med" → Start join flow

---

#### **Step 1: My Name**

```
┌─────────────────────────────────┐
│  Steg 1 av 5                    │
│                                 │
│  Hva heter du?                  │
│                                 │
│  [___________________]          │
│   Ditt navn                     │
│                                 │
│                    [Neste →]    │
└─────────────────────────────────┘
```

**Input:**
- TextInput for display name
- Required (button disabled hvis tom)

**Validering:**
- Non-empty string
- Trimmes automatisk

**Next:** Step 2

---

#### **Step 2: Partner Name**

```
┌─────────────────────────────────┐
│  Steg 2 av 5                    │
│                                 │
│  Hva heter din partner?         │
│                                 │
│  [___________________]          │
│   Partners navn (valgfritt)     │
│                                 │
│  Partner kan bli med senere     │
│  ved hjelp av invitasjonskode   │
│                                 │
│  [← Tilbake]      [Neste →]    │
└─────────────────────────────────┘
```

**Input:**
- TextInput for partner name
- **Optional** (kan hoppes over)

**Logikk:**
- Hvis fylt ut: Opprettes placeholder member
- Hvis tom: Kun én member opprettes

**Next:** Step 3

---

#### **Step 3: Child Name**

```
┌─────────────────────────────────┐
│  Steg 3 av 5                    │
│                                 │
│  Hva heter barnet?              │
│                                 │
│  [___________________]          │
│   Barnets navn                  │
│                                 │
│  [← Tilbake]      [Neste →]    │
└─────────────────────────────────┘
```

**Input:**
- TextInput for child name
- Required (button disabled hvis tom)

**Validering:**
- Non-empty string
- Default: "Barn" hvis tom ved create

**Next:** Step 4

---

#### **Step 4: Equipment Setup**

```
┌──────────────────────────────────────────┐
│  Steg 4 av 5                             │
│                                          │
│  Hva trenger barnet til barnehagen?      │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ ⭐ Regntøy            [✏️] [🗑️] │     │
│  └────────────────────────────────┘     │
│  ┌────────────────────────────────┐     │
│  │ ☆  Skiftetøy          [✏️] [🗑️] │     │
│  └────────────────────────────────┘     │
│  ┌────────────────────────────────┐     │
│  │ ☆  Ull                [✏️] [🗑️] │     │
│  └────────────────────────────────┘     │
│  ┌────────────────────────────────┐     │
│  │ ⭐ Bleier             [✏️] [🗑️] │     │
│  └────────────────────────────────┘     │
│                                          │
│  [___________________] [Legg til]        │
│                                          │
│  [← Tilbake]            [Neste →]       │
└──────────────────────────────────────────┘
```

**Funksjoner:**
- **Add**: Input field + "Legg til" button
- **Remove**: Trash icon (⚠️ confirmation alert)
- **Rename**: Edit icon (platform-specific)
- **Toggle critical**: Star icon (⭐ filled = critical, ☆ empty = optional)

**Default items:**
```javascript
[
  { key: 'rain_gear', label: 'Regntøy', is_critical: true },
  { key: 'change_clothes', label: 'Skiftetøy', is_critical: false },
  { key: 'wool', label: 'Ull', is_critical: false },
  { key: 'diapers', label: 'Bleier', is_critical: true },
]
```

**Key generation:**
```typescript
const key = label.toLowerCase()
  .replace(/æ/g, 'ae')
  .replace(/ø/g, 'o')
  .replace(/å/g, 'a')
  .replace(/[^a-z0-9]/g, '_');
```

**Platform-specific rename:**
- **Web**: `window.prompt()`
- **iOS**: `Alert.prompt()`
- **Android**: Custom Modal with TextInput

**Next:** Step 5

---

#### **Step 5: Schedule Template (Optional)**

```
┌──────────────────────────────────────────┐
│  Steg 5 av 5                             │
│                                          │
│  Vil du sette opp en ukemal?             │
│                                          │
│  [Nei, hopp over]   [Ja, sett opp →]    │
└──────────────────────────────────────────┘
```

**Hvis "Ja":**

```
┌──────────────────────────────────────────┐
│  Standard ukeplan                        │
│                                          │
│  Mandag                                  │
│  ┌─────────────┬─────────────┐          │
│  │ Levering    │ Henting     │          │
│  │ ▶ Person 1  │ ◀ Person 2  │          │
│  └─────────────┴─────────────┘          │
│                                          │
│  Tirsdag                                 │
│  ┌─────────────┬─────────────┐          │
│  │ Levering    │ Henting     │          │
│  │ ▶ —         │ ◀ —         │          │
│  └─────────────┴─────────────┘          │
│  ...                                     │
│                                          │
│  [← Tilbake]          [Fullfør]         │
└──────────────────────────────────────────┘
```

**Interaksjon:**
- Tap slot to cycle: null → Person 1 → Person 2 → null
- 5 dager (mandag-fredag)
- 2 slots per dag (levering/henting)
- Farger: Person 1 (emerald), Person 2 (amber)

**Lagring:**
```typescript
{
  household_id, child_id,
  weekday: 1-5,  // Monday = 1, Friday = 5
  slot: 'dropoff' | 'pickup',
  assigned_member_id,
  assigned_user_id,
  updated_by
}
```

**Next:** Create household + Success screen

---

#### **Step 6: Success Screen**

```
┌──────────────────────────────────────────┐
│            ✓                             │
│                                          │
│  Husholdning opprettet!                  │
│                                          │
│  Del denne koden med din partner:        │
│                                          │
│  ┌────────────────────────────────┐     │
│  │     eple-hund                  │     │
│  └────────────────────────────────┘     │
│                                          │
│  Partner kan bruke denne koden for å     │
│  bli med i husholdningen.                │
│                                          │
│  [Kom i gang! →]                         │
└──────────────────────────────────────────┘
```

**Info:**
- Viser generert invite code
- Format: `word-word` (e.g., "eple-hund")
- Partner kan bruke denne for å bli med

**Action:**
- "Kom i gang!" → Refresh HouseholdProvider → Navigate to MainScreen

## Join Household Flow

### Enkelt steg

```
┌──────────────────────────────────────────┐
│  Bli med i husholdning                   │
│                                          │
│  Invitasjonskode:                        │
│  [___________________]                   │
│   eple-hund                              │
│                                          │
│  Ditt navn:                              │
│  [___________________]                   │
│   (Automatisk fylt fra partner)          │
│                                          │
│  [Avbryt]              [Bli med →]       │
└──────────────────────────────────────────┘
```

**Input:**
- Invite code (format: "word-word")
- Display name (pre-filled hvis kode er gyldig)

**Auto-fill logic:**
```typescript
const handleInviteCodeBlur = async () => {
  if (inviteCode.trim()) {
    const name = await getPlaceholderNameForInvite(inviteCode.trim());
    if (name) {
      setMyName(name);  // Auto-fill from partner's input
    }
  }
};
```

**Action:**
- Calls `accept_household_invite(invite_code, display_name)`
- Replaces placeholder member with real user
- Navigate to MainScreen

## Re-Onboarding Flow

### Når kjøres

1. **Manuelt**: Profil → "Kjør onboarding på nytt"
2. **URL parameter**: `?onboarding=true` (web only)

### Forskjeller fra første gang

**Loading existing data:**
```typescript
useEffect(() => {
  if (existingHouseholdId) {
    loadExistingHouseholdData();
  }
}, [existingHouseholdId]);

const loadExistingHouseholdData = async () => {
  // 1. Load equipment items
  const { data: items } = await supabase
    .from('equipment_items')
    .select('*')
    .eq('household_id', existingHouseholdId)
    .eq('active', true);

  setEquipmentItems(items || DEFAULT_EQUIPMENT_ITEMS);

  // 2. Load template
  const { data: templates } = await supabase
    .from('schedule_templates')
    .select('*')
    .eq('household_id', existingHouseholdId);

  // ... populate template state
};
```

**Sletting av gamle data:**
```typescript
// Before saving new equipment
await supabase
  .from('equipment_items')
  .update({ active: false })
  .eq('household_id', existingHouseholdId);

// Before saving new template
await supabase
  .from('schedule_templates')
  .delete()
  .eq('household_id', existingHouseholdId);
```

**Success screen:**
- Viser **eksisterende** invite code (ikke ny)
- Melding: "Innstillinger oppdatert!"

## Database Operations

### bootstrap_household() RPC

Oppretter komplett ny husstand i én transaksjon.

**Input:**
```typescript
{
  my_name: string,
  partner_name: string | null,
  child_name: string,
  equipment_items: EquipmentItemInput[],
  schedule_template: ScheduleTemplateInput[] | null
}
```

**Operasjoner:**
1. Create household row
2. Generate unique invite code
3. Create child row
4. Create member rows (user + optional placeholder)
5. Insert equipment items
6. Insert schedule templates (if provided)

**Return:**
```typescript
{
  household_id: string,
  invite_code: string
}
```

### accept_household_invite() RPC

Erstatter placeholder member med ekte bruker.

**Input:**
```typescript
{
  invite_code: string,
  display_name: string
}
```

**Operasjoner:**
1. Find household by invite code
2. Find placeholder member (user_id IS NULL)
3. Update placeholder with user_id + display_name
4. Return household_id

**Return:**
```typescript
{
  household_id: string
}
```

### get_placeholder_name_for_invite() RPC

Henter placeholder navn for auto-fill.

**Input:**
```typescript
{
  invite_code: string
}
```

**Return:**
```typescript
{
  placeholder_name: string | null
}
```

## State Management

### OnboardingScreen State

```typescript
// Flow control
const [step, setStep] = useState<number>(0);
const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');

// User inputs
const [myName, setMyName] = useState('');
const [partnerName, setPartnerName] = useState('');
const [childName, setChildName] = useState('');
const [equipmentItems, setEquipmentItems] = useState(DEFAULT_EQUIPMENT_ITEMS);
const [templateAssignments, setTemplateAssignments] = useState<TemplateData>({});
const [inviteCode, setInviteCode] = useState('');

// UI state
const [loading, setLoading] = useState(false);
const [createdInviteCode, setCreatedInviteCode] = useState('');
const [error, setError] = useState('');
```

### Step Navigation

```typescript
const goToNextStep = () => {
  setStep(prev => prev + 1);
};

const goToPreviousStep = () => {
  setStep(prev => Math.max(0, prev - 1));
};
```

**Step numbers:**
- 0: Choice screen
- 1: My name
- 2: Partner name
- 3: Child name
- 4: Equipment
- 5: Template choice
- 6: Template setup (if selected)
- 7: Success

## Error Handling

### Validation Errors

**Empty required fields:**
```typescript
if (!myName.trim()) {
  Alert.alert('Feil', 'Vennligst skriv inn navnet ditt');
  return;
}
```

**Invalid invite code:**
```typescript
try {
  await accept_household_invite(inviteCode, myName);
} catch (error) {
  Alert.alert('Ugyldig kode', 'Invitasjonskoden er ikke gyldig');
}
```

### Network Errors

```typescript
try {
  await bootstrap_household(...);
} catch (error) {
  console.error('Error creating household:', error);
  Alert.alert('Feil', 'Kunne ikke opprette husholdning. Prøv igjen.');
  setLoading(false);
}
```

### Duplicate household

**Problem:** Bruker prøver å lage ny husstand når de allerede har én.

**Løsning:**
```typescript
if (existingHouseholdId && !isReOnboarding) {
  Alert.alert('Advarsel', 'Du har allerede en husholdning');
  return;
}
```

## UI/UX Detaljer

### Progress Indicator

```typescript
<Text style={tw`text-sm text-text-muted mb-2`}>
  Steg {step} av 5
</Text>
```

### Keyboard Handling

```typescript
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={tw`flex-1`}
>
  <ScrollView>
    {/* Content */}
  </ScrollView>
</KeyboardAvoidingView>
```

### Loading States

```typescript
{loading && (
  <ActivityIndicator size="large" color="#7fa884" />
)}

<TouchableOpacity
  disabled={loading || !myName.trim()}
  style={tw`${loading ? 'opacity-50' : ''}`}
>
  <Text>Neste</Text>
</TouchableOpacity>
```

### Animations

**Fade in/out mellom steg:**
```typescript
<Animated.View style={{ opacity: fadeAnim }}>
  {renderStep()}
</Animated.View>
```

## Testing

### Manuell testing sjekkliste

Create Flow:
- [ ] Step 1: Navn påkrevd
- [ ] Step 2: Partner optional
- [ ] Step 3: Barn påkrevd
- [ ] Step 4: Add/remove/rename equipment
- [ ] Step 4: Toggle critical status
- [ ] Step 5: Skip template
- [ ] Step 5: Setup template
- [ ] Success: Invite code vises
- [ ] Navigate til MainScreen

Join Flow:
- [ ] Invalid invite code → Error
- [ ] Valid invite code → Auto-fill name
- [ ] Successfully join household

Re-onboarding:
- [ ] Existing equipment loads
- [ ] Existing template loads
- [ ] Changes save correctly
- [ ] Invite code unchanged

### Edge cases å teste

- [ ] Empty strings i input fields
- [ ] Veldig lange navn (>100 chars)
- [ ] Special characters i navn
- [ ] Network error during create
- [ ] Back button på step 1
- [ ] Rapid step navigation
- [ ] Keyboard overlapping inputs (iOS)

## Fremtidige forbedringer

### Potensielle features

- [ ] **Progress bar**: Visual indikator for steg
- [ ] **Skip steps**: Hopp over optional steg
- [ ] **Save draft**: Lagre midlertidig progress
- [ ] **Pre-fill from social**: Importer navn fra Facebook/Google
- [ ] **Multiple children**: Støtte for flere barn
- [ ] **Photo upload**: Last opp barnets bilde
- [ ] **Household preferences**: Språk, timezone, etc.
- [ ] **Invitation via SMS/Email**: Send invite direkte
- [ ] **QR code invite**: Scan QR i stedet for typing kode

### Tekniske forbedringer

- [ ] **Form validation library**: Bruk Formik/React Hook Form
- [ ] **Step transitions**: Smooth slide animations
- [ ] **Auto-save**: Persist state til AsyncStorage
- [ ] **Error recovery**: Gjenopprett fra feil
- [ ] **A/B testing**: Test forskjellige flows

## Relaterte filer

- `src/screens/OnboardingScreen.tsx` - Main onboarding logic
- `src/contexts/HouseholdProvider.tsx` - Household state management
- `src/lib/equipment.ts` - Equipment defaults
- `src/screens/ProfileScreen.tsx` - Re-onboarding trigger
- `docs/SCHEDULE.md` - Schedule template docs
- `docs/EQUIPMENT.md` - Equipment system docs

## Lisens

Proprietary - Barnehage-Plan App

---

Sist oppdatert: 2025-02-13
