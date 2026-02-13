# Schedule System (Tidsplanlegging)

## Oversikt

Schedule-systemet lar familier planlegge hvem som skal levere og hente barnet hver dag. Systemet støtter både enkeltdager og ukemaler (templates) for standard-uker.

## Arkitektur

### Hovedkomponenter

**Screens:**
- `MainScreen.tsx` - Hovedvisning av ukeplan
- `TodayCard.tsx` - I DAG / I MORGEN kort

**Components:**
- `ScheduleSlot.tsx` - Enkelt slot (levering/henting)
- `ConfettiCannon` - Feiring når uke er ferdig planlagt

### Database-struktur

#### `schedule_assignments` tabell
Lagrer individuelle oppdrag for spesifikke dager.

```sql
CREATE TABLE schedule_assignments (
  id UUID PRIMARY KEY,
  household_id UUID NOT NULL,
  child_id UUID NOT NULL,
  date DATE NOT NULL,                    -- Format: YYYY-MM-DD
  slot TEXT NOT NULL,                    -- 'dropoff' eller 'pickup'
  assigned_member_id UUID,               -- NY: For placeholders + reelle brukere
  assigned_user_id UUID,                 -- GAMMEL: Bakoverkompatibilitet
  updated_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (child_id, date, slot)
);
```

**Viktige felt:**
- `assigned_member_id` - Brukes primært (støtter både reelle brukere og placeholders)
- `assigned_user_id` - Fallback for bakoverkompatibilitet
- `date` - Alltid i `YYYY-MM-DD` format (ISO 8601)
- `slot` - Enten `'dropoff'` (levering) eller `'pickup'` (henting)

#### `schedule_templates` tabell
Lagrer gjentakende ukemaler.

```sql
CREATE TABLE schedule_templates (
  id UUID PRIMARY KEY,
  household_id UUID NOT NULL,
  child_id UUID NOT NULL,
  weekday INT NOT NULL,                  -- 1-7 (Monday-Sunday)
  slot TEXT NOT NULL,                    -- 'dropoff' eller 'pickup'
  assigned_member_id UUID,
  assigned_user_id UUID,
  updated_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (household_id, child_id, weekday, slot)
);
```

**Viktige felt:**
- `weekday` - ISO weekday (1=Monday, 7=Sunday)
- Kun mandag-fredag brukes i UI (1-5)

## Dataflyt

### Initial Loading

```
MainScreen mounts
  ↓
1. Fetch assignments for current week
   SELECT * FROM schedule_assignments
   WHERE household_id = ? AND child_id = ?
     AND date BETWEEN monday AND friday
   ↓
2. Build AssignmentData map
   Key format: "YYYY-MM-DD-dropoff" | "YYYY-MM-DD-pickup"
   Value: member_id or null
   ↓
3. Fetch child name (one-time query)
   ↓
4. Check if template should auto-apply
   IF all slots empty AND template exists:
     → Call applyTemplateToWeek()
```

### Data Structures

#### AssignmentData (Frontend state)
```typescript
type AssignmentData = {
  [key: string]: string | null;  // "2025-02-17-dropoff" => "member_id"
};
```

**Eksempel:**
```javascript
{
  "2025-02-17-dropoff": "user-123-id",
  "2025-02-17-pickup": null,
  "2025-02-18-dropoff": "member-456-id",
  "2025-02-18-pickup": "user-123-id",
  // ... resten av uken
}
```

### Nøkkelfunksjoner

#### `fetchAssignments(weekOffset: number)`

Henter oppdrag for en spesifikk uke.

```typescript
const fetchAssignments = async (weekOffset: number = 0) => {
  // 1. Calculate week range
  const monday = dayjs().add(weekOffset, 'week').startOf('isoWeek');
  const friday = monday.add(4, 'day');

  // 2. Query database
  const { data, error } = await supabase
    .from('schedule_assignments')
    .select('*')
    .eq('child_id', childId)
    .gte('date', monday.format('YYYY-MM-DD'))
    .lte('date', friday.format('YYYY-MM-DD'));

  // 3. Build map
  const assignmentData: AssignmentData = {};
  data?.forEach(assignment => {
    const key = `${assignment.date}-${assignment.slot}`;
    // Prefer assigned_member_id (new), fallback to assigned_user_id (old)
    assignmentData[key] = assignment.assigned_member_id || assignment.assigned_user_id;
  });

  return assignmentData;
};
```

**Viktigheter:**
- Kun mandag-fredag (5 dager)
- ISO week calculation (`isoWeek`)
- Bakoverkompatibilitet med både `assigned_member_id` og `assigned_user_id`

#### `handleSlotPress(date, slot)`

Håndterer trykk på et schedule-slot med optimistisk UI-oppdatering.

```typescript
const handleSlotPress = async (date: string, slot: string) => {
  // 1. Haptic feedback
  if (Platform.OS !== 'web') {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const key = `${date}-${slot}`;
  const currentAssignment = assignments[key];

  // 2. Cycle: null → Person 1 → Person 2 → null
  let nextAssignment: string | null = null;
  if (!currentAssignment) {
    nextAssignment = members[0]?.id || null;  // Person 1
  } else if (currentAssignment === members[0]?.id) {
    nextAssignment = members[1]?.id || null;  // Person 2
  } else {
    nextAssignment = null;  // Back to empty
  }

  // 3. Optimistic update (UI updates immediately)
  setAssignments(prev => ({ ...prev, [key]: nextAssignment }));

  // 4. Database update
  try {
    if (nextAssignment) {
      // Upsert (insert or update)
      await supabase
        .from('schedule_assignments')
        .upsert({
          household_id: householdId,
          child_id: childId,
          date: date,
          slot: slot,
          assigned_member_id: nextAssignment,
          assigned_user_id: nextAssignment, // For backwards compatibility
          updated_by: user.id,
        }, {
          onConflict: 'child_id,date,slot'
        });
    } else {
      // Delete assignment
      await supabase
        .from('schedule_assignments')
        .delete()
        .eq('child_id', childId)
        .eq('date', date)
        .eq('slot', slot);
    }
  } catch (error) {
    // 5. Revert optimistic update on error
    console.error('Error updating assignment:', error);
    setAssignments(prev => ({ ...prev, [key]: currentAssignment }));

    // Error haptic feedback
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  // 6. Check if week is now fully filled
  checkWeekFullyFilled();
};
```

**Viktigheter:**
- **Optimistisk UI**: UI oppdateres umiddelbart før database-kall
- **Cycling logic**: null → P1 → P2 → null
- **Error handling**: Reverts på feil + haptic error feedback
- **Upsert pattern**: Bruker `onConflict` for å håndtere både insert og update

#### `applyTemplateToWeek()`

Fyller ut tomme slots med verdier fra ukemal.

```typescript
const applyTemplateToWeek = async (): Promise<boolean> => {
  // 1. Check if templates exist
  const { data: templates, error } = await supabase
    .from('schedule_templates')
    .select('*')
    .eq('household_id', householdId)
    .eq('child_id', childId);

  if (!templates || templates.length === 0) {
    return false;  // No templates to apply
  }

  // 2. Build assignments from template
  const newAssignments: ScheduleAssignment[] = [];
  const currentWeekStart = dayjs().add(weekOffset, 'week').startOf('isoWeek');

  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {  // Mon-Fri only
    const date = currentWeekStart.add(dayOffset, 'day');
    const weekday = date.isoWeekday();  // 1-7

    for (const slot of ['dropoff', 'pickup']) {
      const key = `${date.format('YYYY-MM-DD')}-${slot}`;

      // Only fill if slot is empty
      if (!assignments[key]) {
        const template = templates.find(
          t => t.weekday === weekday && t.slot === slot
        );

        if (template && template.assigned_member_id) {
          newAssignments.push({
            household_id: householdId,
            child_id: childId,
            date: date.format('YYYY-MM-DD'),
            slot: slot,
            assigned_member_id: template.assigned_member_id,
            assigned_user_id: template.assigned_user_id,
            updated_by: user.id,
          });
        }
      }
    }
  }

  // 3. Insert all assignments in one batch
  if (newAssignments.length > 0) {
    await supabase
      .from('schedule_assignments')
      .insert(newAssignments);

    return true;  // Templates were applied
  }

  return false;
};
```

**Viktigheter:**
- Kun fyller **tomme** slots (ikke overskriv eksisterende)
- Batch insert for performance
- Returnerer `boolean` som indikerer om template ble brukt
- Auto-triggered på MainScreen mount hvis hele uken er tom

#### `checkWeekFullyFilled()`

Sjekker om alle slots i uken er fylt og feirer med konfetti.

```typescript
const checkWeekFullyFilled = () => {
  const allFilled = Object.keys(assignments).every(key => {
    // Skip keys that aren't in current week
    if (!key.startsWith(currentWeekStart.format('YYYY-MM-DD'))) {
      return true;
    }
    return assignments[key] !== null;
  });

  if (allFilled && !weekFilledCelebrated) {
    // Celebrate!
    celebrationConfettiRef.current?.start();

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setWeekFilledCelebrated(true);
  }
};
```

## UI/UX

### Ukevisning

**Layout:**
```
┌─────────────────────────────────────┐
│ Uke 7, 2025             [<] [>]     │
│                                     │
│  Mandag   17. feb                   │
│  ┌──────────────┬──────────────┐   │
│  │ Levering     │ Henting      │   │
│  │ ▶ Person 1   │ ◀ Person 2   │   │
│  └──────────────┴──────────────┘   │
│                                     │
│  Tirsdag  18. feb                   │
│  ┌──────────────┬──────────────┐   │
│  │ Levering     │ Henting      │   │
│  │ ▶ —          │ ◀ —          │   │
│  └──────────────┴──────────────┘   │
│  ...                                │
└─────────────────────────────────────┘
```

### Farger

**Person 1** (bruker):
- Gradient: `from-primary-dark to-primary` (#5a7a5e → #6b8e6f)
- Ikon: Emerald grønn

**Person 2** (partner):
- Gradient: `from-secondary-dark to-secondary` (#d4b560 → #e8c96f)
- Ikon: Gylden gul

**Tomt slot:**
- Background: `bg-muted/50` (#4a3f38 med 50% opacity)
- Border: `border-border/50`
- Text: Muted

### Animasjoner

**Slot press:**
- Scale spring animation (0.95 → 1.0)
- Duration: 200ms
- Haptic feedback: Light impact

**Loading state:**
- Shimmer effect (1.2s loop)
- Gradient sweep left to right
- Opacity fade-in på load complete

**Week navigation:**
- Fade out/in transition
- Haptic feedback ved navigasjon
- "Gå til nåværende uke" knapp vises kun når ikke på uke 0

**Konfetti:**
- Triggers når alle 10 slots (5 dager × 2 slots) er fylt
- 200 partikler
- Originate fra screen center
- Auto-fade out etter 3 sekunder
- Success haptic notification

## Navigasjon

### Uke-navigasjon

**Metode 1: Pil-knapper**
- Venstre pil: Forrige uke (`weekOffset--`)
- Høyre pil: Neste uke (`weekOffset++`)

**Metode 2: Swipe gesture**
```typescript
const onSwipe = (direction: 'left' | 'right') => {
  if (direction === 'left') {
    setWeekOffset(prev => prev + 1);  // Neste uke
  } else {
    setWeekOffset(prev => prev - 1);  // Forrige uke
  }
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};
```

**Metode 3: "Gå til nåværende uke" knapp**
- Vises kun når `weekOffset !== 0`
- Setter `weekOffset = 0`

### Week calculation

```typescript
const currentWeekStart = dayjs()
  .add(weekOffset, 'week')
  .startOf('isoWeek');  // ISO week starts on Monday

const weekNumber = currentWeekStart.isoWeek();
const year = currentWeekStart.year();
```

**ISO Week Numbers:**
- Uke 1 = First week with Thursday in January
- Weeks start on Monday (isoWeekday 1)
- Weeks end on Sunday (isoWeekday 7)

## Edge Cases & Error Handling

### Bakoverkompatibilitet

**Problem:** Gamle assignments bruker kun `assigned_user_id`, nye bruker `assigned_member_id`.

**Løsning:**
```typescript
const memberId = assignment.assigned_member_id || assignment.assigned_user_id;
```

### Placeholder members

**Problem:** Partner har ikke registrert seg enda (placeholder member har `user_id = NULL`).

**Løsning:**
- Placeholder members får en `id` (member_id)
- UI bruker `member.id` for assignments (ikke `user_id`)
- Når partner registrerer seg, erstatter de placeholder-raden

### Manglende member

**Problem:** Assignment refererer til member som ikke lenger eksisterer.

**Løsning:**
```typescript
const getDisplayName = (memberId: string | null) => {
  if (!memberId) return undefined;
  const member = members.find(m => m.id === memberId || m.user_id === memberId);
  return member?.display_name;
};
```
Returnerer `undefined` hvis ikke funnet, slot viser "—".

### Network errors

**Problem:** Database-kall feiler (timeout, no connection, etc.)

**Løsning:**
1. Optimistisk update reverteres
2. Error haptic feedback
3. Console error logged
4. User kan prøve igjen

### Week navigation under loading

**Problem:** Bruker navigerer til ny uke mens forrige uke laster.

**Løsning:**
- Loading state per week (ikke global)
- Cancel previous fetch (via abort controller hvis implementert)
- Show loading spinner på ny uke

## Performance Considerations

### Optimistiske oppdateringer

**Fordeler:**
- UI føles instant (ingen ventetid)
- Bedre UX på treg nettverksforbindelse

**Ulemper:**
- Må håndtere error-revert
- Kan vise feil data midlertidig ved konflikt

### Batch operations

**Template application:**
- Alle assignments inserts i én request
- Reduserer antall round-trips
- Raskere ved mange slots

### Caching

**Ikke implementert:**
- Assignments re-fetches ved hver uke-navigasjon
- Kunne cache tidligere uker
- Kunne pre-fetch neste/forrige uke

## Testing

### Manuell testing sjekkliste

- [ ] Slot cycling: null → P1 → P2 → null
- [ ] Template auto-apply på tom uke
- [ ] Uke-navigasjon (piler + swipe)
- [ ] Konfetti ved fyllt uke
- [ ] Haptic feedback på alle interaksjoner
- [ ] Pull-to-refresh
- [ ] Error handling (network disconnect)
- [ ] Bakoverkompatibilitet (gamle assignments)
- [ ] Placeholder members vises korrekt

### Edge cases å teste

- [ ] Ingen template definert
- [ ] Template med manglende member
- [ ] Uke med blandede gamle/nye assignments
- [ ] Navigere til uke langt fram i tid
- [ ] Navigere til uke langt tilbake i tid
- [ ] Raskt klikke samme slot flere ganger
- [ ] Endre uke mens loading

## Fremtidige forbedringer

### Potensielle features

- [ ] **Ukenummer-picker**: Hopp direkte til spesifikk uke
- [ ] **Månedsvisning**: Oversikt over flere uker
- [ ] **Notater per dag**: "Barn har feber", "Ekstra tøy"
- [ ] **Push notifications**: Påminnelse dagen før
- [ ] **Synkronisering**: Real-time updates ved partnerens endringer
- [ ] **Helger**: Valgfritt inkludere lørdag/søndag
- [ ] **Flere barn**: Støtte for flere barn samtidig
- [ ] **Historikk**: Se tidligere ukers planlegging
- [ ] **Eksport**: Del ukesplan via kalender-invite

### Tekniske forbedringer

- [ ] **Request cancellation**: Cancel in-flight requests ved navigasjon
- [ ] **Optimistic cache**: Lagre fetched weeks i minne
- [ ] **Pre-fetching**: Hent neste/forrige uke i bakgrunnen
- [ ] **Offline support**: Lagre lokalt med sync ved reconnect
- [ ] **Real-time subscriptions**: Live updates fra andre brukere
- [ ] **Undo/redo**: Angre siste endring
- [ ] **Drag-and-drop**: Dra person mellom slots

## Relaterte filer

- `src/screens/MainScreen.tsx` - Hovedlogikk
- `src/components/ScheduleSlot.tsx` - Enkelt slot
- `src/components/TodayCard.tsx` - I DAG/I MORGEN visning
- `src/contexts/HouseholdProvider.tsx` - Household data context
- `docs/README.md` - Generell app-dokumentasjon

## Lisens

Proprietary - Barnehage-Plan App

---

Sist oppdatert: 2025-02-13
