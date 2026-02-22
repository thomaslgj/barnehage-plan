# Equipment System (Utstyrshåndtering)

## Oversikt

Equipment-systemet lar familier holde oversikt over kritisk utstyr som må med til barnehagen. Systemet markerer hva som er klart og hva som mangler, og sender notifications hvis kritisk utstyr mangler.

## Arkitektur

### Hovedkomponenter

**Screens:**
- `EquipmentManagementScreen.tsx` - CRUD for equipment items
- `MainScreen.tsx` - Viser equipment status i TodayCard

**Components:**
- `EquipmentStatusBadge.tsx` - Status badge (grønn/gul/rød)
- `EquipmentBottomSheet.tsx` - Modal for å toggle status
- `TodayCard.tsx` - Equipment status + auto-modal

**Services:**
- `equipment.ts` - Core equipment logic
- `notifications.ts` - Integration med notification system

### Database-struktur

#### `equipment_items` tabell

Lagrer hvilke utstyr som er definert for hver husstand.

```sql
CREATE TABLE equipment_items (
  id UUID PRIMARY KEY,
  household_id UUID NOT NULL,
  key TEXT NOT NULL,                     -- Unique identifier (e.g., 'rain_gear')
  label TEXT NOT NULL,                   -- User-visible name (e.g., 'Regntøy')
  is_critical BOOLEAN DEFAULT false,     -- Critical for child?
  sort_order INT DEFAULT 0,              -- Display order
  active BOOLEAN DEFAULT true,           -- Soft delete
  updated_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (household_id, key)
);
```

**Viktige felt:**
- `key` - Unik identifikator (auto-generert fra label)
- `label` - Navn som vises til bruker (kan endres)
- `is_critical` - Om dette er "må ha" eller "burde ha"
- `sort_order` - Rekkefølge i UI (0, 1, 2, ...)
- `active` - Soft delete (slett ikke row, sett til false)

#### `household_equipment_status` tabell

Lagrer nåværende status for hvert equipment item.

```sql
CREATE TABLE household_equipment_status (
  household_id UUID NOT NULL,
  item_key TEXT NOT NULL,                -- References equipment_items.key
  status TEXT NOT NULL CHECK (status IN ('ok', 'missing')),
  updated_by UUID NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (household_id, item_key)
);
```

**Viktige felt:**
- `status` - Enten `'ok'` eller `'missing'`
- Composite primary key: (household_id, item_key)
- Upsert pattern brukes (INSERT ... ON CONFLICT UPDATE)

## Default Equipment

Standard utstyr som vises ved første opprettelse:

```typescript
export const DEFAULT_EQUIPMENT_ITEMS = [
  { key: 'rain_gear', label: 'Regntøy', is_critical: true },
  { key: 'change_clothes', label: 'Skiftetøy', is_critical: false },
  { key: 'wool', label: 'Ull', is_critical: false },
  { key: 'diapers', label: 'Bleier', is_critical: true },
];
```

**Kritiske items (rød hvis mangler):**
- Regntøy
- Bleier

**Ikke-kritiske items (gul hvis mangler):**
- Skiftetøy
- Ull

## Core Functions

### `fetchEquipmentStatus(householdId): Promise<EquipmentItem[]>`

Henter alle equipment items med status.

```typescript
export async function fetchEquipmentStatus(
  householdId: string
): Promise<EquipmentItem[]> {
  // 1. Fetch equipment definitions
  const { data: items, error: itemsError } = await supabase
    .from('equipment_items')
    .select('*')
    .eq('household_id', householdId)
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (itemsError) throw itemsError;

  // Fallback to defaults if no items
  if (!items || items.length === 0) {
    return DEFAULT_EQUIPMENT_ITEMS.map(item => ({
      ...item,
      status: 'ok',  // Assume OK if no data
    }));
  }

  // 2. Fetch status for all items
  const itemKeys = items.map(item => item.key);
  const { data: statusData, error: statusError } = await supabase
    .from('household_equipment_status')
    .select('*')
    .eq('household_id', householdId)
    .in('item_key', itemKeys);

  if (statusError) throw statusError;

  // 3. Build status map
  const statusMap = new Map<string, string>();
  statusData?.forEach(s => {
    statusMap.set(s.item_key, s.status);
  });

  // 4. Merge items with status
  return items.map(item => ({
    ...item,
    status: statusMap.get(item.key) || 'ok',  // Default to 'ok' if no status row
  }));
}
```

**Return type:**
```typescript
interface EquipmentItem {
  key: string;
  label: string;
  is_critical: boolean;
  sort_order: number;
  status: 'ok' | 'missing';
}
```

### `updateEquipmentStatus(householdId, userId, itemKey, status)`

Oppdaterer status for ett equipment item og re-scheduler notification.

```typescript
export async function updateEquipmentStatus(
  householdId: string,
  userId: string,
  itemKey: string,
  status: 'ok' | 'missing'
): Promise<void> {
  // 1. Upsert status
  const { error } = await supabase
    .from('household_equipment_status')
    .upsert(
      {
        household_id: householdId,
        item_key: itemKey,
        status: status,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'household_id,item_key' }
    );

  if (error) throw error;

  // 2. Reschedule notification (fire-and-forget)
  // This ensures Android gets updated notification for tomorrow
  // and iOS message reflects current status
  const { data: memberData } = await supabase
    .from('household_members')
    .select('id')
    .eq('user_id', userId)
    .eq('household_id', householdId)
    .single();

  if (memberData) {
    rescheduleNotificationIfNeeded(householdId, memberData.id).catch(err => {
      console.error('Failed to reschedule notification:', err);
    });
  }
}
```

**Viktigheter:**
- **Upsert pattern**: Bruker `onConflict` for både insert og update
- **Auto-reschedule**: Notifications oppdateres automatisk
- **Fire-and-forget**: Notification reschedule venter ikke (async catch)

### `calculateEquipmentStatus(items): EquipmentStatus`

Beregner samlet status basert på alle items.

```typescript
export type EquipmentStatus = 'ready' | 'missing' | 'not_ready';

export function calculateEquipmentStatus(
  items: EquipmentItem[]
): EquipmentStatus {
  const hasMissingCritical = items.some(
    item => item.is_critical && item.status === 'missing'
  );

  const hasMissingNonCritical = items.some(
    item => !item.is_critical && item.status === 'missing'
  );

  if (hasMissingCritical) {
    return 'not_ready';  // RED - Must fix before tomorrow
  }

  if (hasMissingNonCritical) {
    return 'missing';    // YELLOW - Should fix
  }

  return 'ready';        // GREEN - All good
}
```

**Logic:**
- `'not_ready'` (🔴 RØD): **Minst ett** kritisk item mangler
- `'missing'` (🟡 GUL): Kun ikke-kritiske items mangler
- `'ready'` (🟢 GRØNN): Alt OK

### `shouldShowEquipmentModal(date, lastShownDate): Promise<boolean>`

Sjekker om equipment modal skal auto-vises.

```typescript
export async function shouldShowEquipmentModal(
  date: string,
  lastShownDate: string | null
): Promise<boolean> {
  const now = new Date();
  const currentHour = now.getHours();

  // 1. Only show at 4 PM or later
  if (currentHour < 16) {
    return false;
  }

  // 2. Only show for tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (date !== tomorrowStr) {
    return false;
  }

  // 3. Only show once per day
  const today = now.toISOString().split('T')[0];
  if (lastShownDate === today) {
    return false;  // Already shown today
  }

  return true;
}
```

**Rules:**
1. Kun etter kl. 16:00
2. Kun for "I MORGEN" dato
3. Kun én gang per dag (tracked via AsyncStorage)

## UI Components

### EquipmentStatusBadge

Viser samlet status som et badge.

**Props:**
```typescript
interface EquipmentStatusBadgeProps {
  status: EquipmentStatus;  // 'ready' | 'missing' | 'not_ready'
  onPress: () => void;
}
```

**Styling:**

**Ready (Green):**
```
┌────────────────────────────────────────┐
│ ✓  Alt klart for barnehagen        › │
└────────────────────────────────────────┘
```
- Border: `border-success/40`
- Background: `bg-success/10`
- Icon: Green checkmark
- Text: "Alt klart for barnehagen"

**Missing (Yellow):**
```
┌────────────────────────────────────────┐
│ •  Bør ordnes                      › │
└────────────────────────────────────────┘
```
- Border: `border-warning/40`
- Background: `bg-warning/10`
- Icon: Yellow dot
- Text: "Bør ordnes"

**Not Ready (Red):**
```
┌────────────────────────────────────────┐
│ •  Må ordnes før i morgen          › │
└────────────────────────────────────────┘
```
- Border: `border-error/40`
- Background: `bg-error/10`
- Icon: Red dot
- Text: "Må ordnes før i morgen"

**Interactions:**
- `activeOpacity={0.7}` on touch
- Haptic light impact on press
- Opens EquipmentBottomSheet modal

### EquipmentBottomSheet

Modal som viser alle equipment items med toggle.

**Props:**
```typescript
interface EquipmentBottomSheetProps {
  visible: boolean;
  items: EquipmentItem[];
  loading: boolean;
  onToggle: (key: string) => void;
  onClose: () => void;
}
```

**Layout:**
```
┌─────────────────────────────────────────┐
│ Utstyr til barnehagen            [×] │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ ✓ Regntøy                       │   │  ← OK (green)
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ × Skiftetøy                     │   │  ← Missing (yellow)
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ × Bleier                        │   │  ← Missing (red - critical)
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

**Color coding:**
- **OK**: Green background (`rgba(127, 168, 132, 0.2)`)
- **Missing + Critical**: Red background (`rgba(209, 113, 102, 0.2)`)
- **Missing + Non-critical**: Yellow background (`rgba(232, 201, 111, 0.2)`)

**Animations:**
- Slide up from bottom with fade overlay
- Scale animation on status toggle
- Smooth height adjustment

### EquipmentManagementScreen

Full CRUD-skjerm for å administrere equipment list.

**Funksjoner:**
1. **Add new item** - Input field + "Legg til" button
2. **Remove item** - Trash icon → Confirmation alert
3. **Rename item** - Edit icon → Platform-specific input
4. **Toggle critical** - Star icon (filled = critical)
5. **Reorder** - Drag handles (future feature)

**Platform-spesifikk rename:**
```typescript
const handleRename = async (key: string, label: string) => {
  if (Platform.OS === 'web') {
    const newLabel = window.prompt('Endre navn', label);
    if (newLabel && newLabel.trim() !== label) {
      await saveRenamedItem(key, newLabel.trim());
    }
  } else if (Platform.OS === 'ios') {
    Alert.prompt(
      'Endre navn',
      'Nytt navn for ' + label,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Lagre',
          onPress: async (newLabel?: string) => {
            if (newLabel && newLabel.trim() !== label) {
              await saveRenamedItem(key, newLabel.trim());
            }
          },
        },
      ],
      'plain-text',
      label
    );
  } else {
    // Android: Show message to use onboarding
    Alert.alert('Endre navn', 'Bruk onboarding for å endre navn på Android');
  }
};
```

**Viktigheter:**
- iOS: Bruker `Alert.prompt()` (native prompt)
- Web: Bruker `window.prompt()`
- Android: Ikke støttet (må bruke onboarding for rename)

## Data Flow

### Initial Load (TodayCard)

```
TodayCard mounts
  ↓
1. Fetch equipment status
   └─ fetchEquipmentStatus(householdId)
   └─ Returns EquipmentItem[] with status
  ↓
2. Calculate overall status
   └─ calculateEquipmentStatus(items)
   └─ Returns 'ready' | 'missing' | 'not_ready'
  ↓
3. Check if auto-modal should show
   └─ shouldShowEquipmentModal(tomorrowDate, lastShown)
   └─ Shows modal at 4 PM (once per day)
  ↓
4. Render status badge
```

### Toggle Flow

```
User taps equipment item in modal
  ↓
1. Optimistic update (instant UI feedback)
   setItems(prev => prev.map(item =>
     item.key === key
       ? { ...item, status: item.status === 'ok' ? 'missing' : 'ok' }
       : item
   ))
  ↓
2. Update database
   updateEquipmentStatus(householdId, userId, key, newStatus)
   └─ Upsert household_equipment_status
   └─ Find member by user_id
   └─ Reschedule notification (fire-and-forget)
  ↓
3. On error: Revert optimistic update
  ↓
4. Re-calculate overall status
   calculateEquipmentStatus(items)
  ↓
5. Update badge color
```

### Management Flow

```
EquipmentManagementScreen
  ↓
1. Fetch equipment items
   └─ Query equipment_items table
   └─ Order by sort_order
  ↓
User actions:
  ├─ Add: Generate key from label → Insert row
  ├─ Remove: Set active=false (soft delete)
  ├─ Rename: Update label
  └─ Toggle critical: Update is_critical
  ↓
2. Refresh list after mutation
```

## Integration med Notifications

Equipment system er tett integrert med notifications:

### Auto-Reschedule

```typescript
// In updateEquipmentStatus()
if (memberData) {
  rescheduleNotificationIfNeeded(householdId, memberData.id).catch(err => {
    console.error('Failed to reschedule notification:', err);
  });
}
```

**Når triggers:**
- Hver gang equipment status endres (ok ↔ missing)

**Hva skjer:**
1. Sjekker om notifications er enabled for medlem
2. Sjekker om kritisk equipment mangler
3. Re-scheduler notification med oppdatert melding

**Platform-forskjeller:**
- **Android**: Alltid reschedule (TIME_INTERVAL må re-schedules)
- **iOS**: Kun reschedule hvis kritisk equipment mangler (oppdatere message)

### Notification Message Logic

```typescript
const hasMissing = await hasMissingCriticalEquipment(householdId);

const message = hasMissing
  ? 'Du mangler viktig utstyr! Sjekk hva som må tas med.'
  : 'Husk å sjekke at du har alt utstyr til barnehagen.';
```

## Edge Cases & Error Handling

### Ingen equipment items

**Problem:** Ny household har ingen equipment definert.

**Løsning:** Fallback til `DEFAULT_EQUIPMENT_ITEMS`.

```typescript
if (!items || items.length === 0) {
  return DEFAULT_EQUIPMENT_ITEMS.map(item => ({
    ...item,
    status: 'ok',
  }));
}
```

### Missing status row

**Problem:** Equipment item eksisterer men ingen status row i database.

**Løsning:** Assume `'ok'` status.

```typescript
status: statusMap.get(item.key) || 'ok'
```

### Deleted item med status

**Problem:** Item er slettet (`active = false`) men har fortsatt status row.

**Løsning:**
- Kun fetch active items (`eq('active', true)`)
- Status rows for deleted items ignoreres automatisk

### Network error under toggle

**Problem:** Toggle feiler pga dårlig nettverksforbindelse.

**Løsning:**
1. Optimistic update reverteres
2. Error logges til console
3. User kan prøve igjen

### Concurrent toggles

**Problem:** Bruker klikker flere items raskt etter hverandre.

**Løsning:**
- Each toggle er uavhengig (separate upserts)
- Optimistic updates håndteres per item
- Database upsert er idempotent

## Performance Considerations

### Optimistiske oppdateringer

Equipment system bruker optimistic updates:

**Fordeler:**
- Instant feedback (ingen ventetid)
- Smooth UX selv på treg forbindelse

**Implementasjon:**
```typescript
// 1. Update UI immediately
setItems(prev => prev.map(item =>
  item.key === key
    ? { ...item, status: newStatus }
    : item
));

// 2. Save to database
try {
  await updateEquipmentStatus(...);
} catch (error) {
  // 3. Revert on error
  setItems(originalItems);
}
```

### Fire-and-forget notification reschedule

```typescript
rescheduleNotificationIfNeeded(householdId, memberId).catch(err => {
  console.error('Failed to reschedule notification:', err);
});
```

**Hvorfor:**
- Notification reschedule er "best effort"
- Ikke kritisk at det feiler (notifications kommer uansett neste dag)
- Forhindrer at toggle-flow blir treg

## Testing

### Manuell testing sjekkliste

Equipment Status:
- [ ] Toggle item: ok → missing
- [ ] Toggle item: missing → ok
- [ ] Critical item missing → Status = 'not_ready' (red)
- [ ] Non-critical item missing → Status = 'missing' (yellow)
- [ ] All items OK → Status = 'ready' (green)

Equipment Management:
- [ ] Add new item
- [ ] Remove item (confirmation alert)
- [ ] Rename item (platform-specific)
- [ ] Toggle critical status
- [ ] Items persist across app restart

Auto-Modal:
- [ ] Modal shows at 4 PM when viewing tomorrow
- [ ] Modal only shows once per day
- [ ] Modal doesn't show before 4 PM
- [ ] Modal doesn't show for today

Integration:
- [ ] Toggle status → Notification rescheduled
- [ ] Critical missing → Notification message updated
- [ ] All OK → Notification message updated

### Edge cases å teste

- [ ] Ingen equipment items (fallback til defaults)
- [ ] Alle items critical
- [ ] Alle items ikke-critical
- [ ] Rapidly toggle samme item
- [ ] Toggle under dårlig nettverksforbindelse
- [ ] Delete item som er missing
- [ ] Rename item til tom streng

## Fremtidige forbedringer

### Potensielle features

- [ ] **Custom categories**: Gruppe equipment (Klær, Mat, Leker)
- [ ] **Seasonal items**: "Vinterstøvler" kun vinter
- [ ] **Reminders per item**: "Husk bleier hver mandag"
- [ ] **Quantity tracking**: "2 av 5 skiftetøy klare"
- [ ] **Image upload**: Bilde av utstyr
- [ ] **Barcode scanning**: Scan RFID-tag på utstyr
- [ ] **Location tracking**: "Regntøy er i gangen"
- [ ] **History**: Se når item sist var OK
- [ ] **Quick toggle shortcuts**: iOS widget, Android quick settings

### Tekniske forbedringer

- [ ] **Drag-to-reorder**: Endre sort_order via drag
- [ ] **Batch updates**: Toggle flere items samtidig
- [ ] **Offline support**: Queue updates ved offline
- [ ] **Real-time sync**: Live updates fra partner
- [ ] **Undo/redo**: Angre siste toggle
- [ ] **Search/filter**: Søk i lang equipment list

## Relaterte filer

- `src/lib/equipment.ts` - Core logic
- `src/services/notifications.ts` - Notification integration
- `src/screens/EquipmentManagementScreen.tsx` - CRUD UI
- `src/components/EquipmentBottomSheet.tsx` - Toggle modal
- `src/components/EquipmentStatusBadge.tsx` - Status badge
- `src/components/TodayCard.tsx` - Status display
- `docs/NOTIFICATIONS.md` - Notification system docs

## Lisens

Proprietary - Barnehage-Plan App

---

Sist oppdatert: 2025-02-13
