# Architecture & Data Flow

## Oversikt

Dette dokumentet beskriver den overordnede arkitekturen til Barnehage-Plan appen, inkludert dataflyt, state management, og hvordan komponentene jobber sammen.

## Technology Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo SDK 54** - Development platform
- **TypeScript** - Type-safe JavaScript
- **twrnc** (NativeWind) - TailwindCSS for React Native

### Navigation
- **React Navigation 7** - Native stack navigator
- **react-native-gesture-handler** - Swipe gestures
- **react-native-safe-area-context** - Safe area handling

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - RPC functions

### State Management
- **React Context** - Global state (HouseholdProvider)
- **useState/useEffect** - Local component state
- **React refs** - Mutable values without re-render

### Storage
- **expo-secure-store** - Encrypted storage (iOS Keychain / Android KeyStore)
- **react-native-async-storage** - Unencrypted storage (web fallback)

### Notifications
- **expo-notifications** - Local scheduled notifications
- Platform-specific triggers (CALENDAR for iOS, TIME_INTERVAL for Android)

### UI Libraries
- **expo-haptics** - Haptic feedback
- **expo-linear-gradient** - Gradient backgrounds
- **@react-native-community/datetimepicker** - Time picker
- **react-native-confetti-cannon** - Celebration animations

### Date/Time
- **dayjs** - Date manipulation and formatting
- **dayjs/locale/nb** - Norwegian locale

## App Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────┐
│                     App.tsx                         │
│  - Font loading                                     │
│  - Navigation theme                                 │
│  - Gesture handler root                             │
│  - Safe area provider                               │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│              HouseholdProvider                      │
│  - Auth state management                            │
│  - Household data loading                           │
│  - Context for all screens                          │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼──────────┐
│  AuthScreen    │   │  OnboardingScreen │
└────────────────┘   └───────────────────┘
                             │
                    ┌────────▼──────────┐
                    │   Navigation      │
                    │   Stack           │
                    └────────┬──────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼──────┐  ┌─────────▼───────┐
│  MainScreen    │  │ ProfileScreen │  │  SettingsScreens│
│  - Schedule    │  │  - Menu       │  │  - Notifications│
│  - Equipment   │  │  - Navigation │  │  - Equipment    │
└────────────────┘  └───────────────┘  └─────────────────┘
```

## Data Flow

### App Initialization Sequence

```
1. App.tsx renders
   ↓
2. HouseholdProvider initializes
   ↓
3. Check saved session
   supabase.auth.getSession()
   ↓
4. If session exists:
   ├─ Load household data
   │  ├─ Get memberships for user
   │  ├─ Get household info
   │  ├─ Get children
   │  └─ Get members
   │
   └─ Initialize notifications
      ├─ Setup channel (Android)
      ├─ Check permissions
      └─ Schedule if enabled
   ↓
5. Set up auth listener
   supabase.auth.onAuthStateChange()
   ↓
6. Determine screen to show:
   ├─ No user → AuthScreen
   ├─ No household → OnboardingScreen
   └─ Has household → MainScreen
```

### MainScreen Data Flow

```
MainScreen mounts
  ↓
1. Fetch schedule assignments
   ├─ Calculate week range (Mon-Fri)
   ├─ Query schedule_assignments
   └─ Build AssignmentData map
  ↓
2. Fetch supplementary data
   ├─ Child name (one-time)
   ├─ User display name
   └─ Invite code + check placeholders
  ↓
3. Check for template auto-apply
   ├─ If all slots empty
   ├─ AND template exists
   └─ → Apply template to week
  ↓
4. User interactions:
   ├─ Slot tap → Cycle assignment
   │  ├─ Optimistic UI update
   │  ├─ Database upsert
   │  └─ Error handling (revert)
   │
   ├─ Week navigation → Refetch
   │
   └─ Pull to refresh → Reload
  ↓
5. Monitor for completion
   └─ If week fully filled → Confetti!
```

### Equipment Data Flow

```
TodayCard mounts
  ↓
1. Fetch equipment status
   ├─ Query equipment_items
   ├─ Query household_equipment_status
   └─ Merge into EquipmentItem[]
  ↓
2. Calculate overall status
   calculateEquipmentStatus(items)
   └─ Returns 'ready' | 'missing' | 'not_ready'
  ↓
3. Check for auto-modal
   shouldShowEquipmentModal(date, lastShown)
   ├─ After 4 PM?
   ├─ Tomorrow's date?
   └─ Not shown today yet?
  ↓
4. User interactions:
   ├─ Tap badge → Open modal
   │
   ├─ Toggle item status
   │  ├─ Optimistic update
   │  ├─ Upsert database
   │  └─ Reschedule notification
   │
   └─ All items OK → Confetti!
```

### Notification Flow

```
App initialization
  ↓
1. Setup notification channel (Android)
  ↓
2. Check permissions
   ├─ If not granted → Skip
   └─ If granted → Continue
  ↓
3. Get notification settings
   FROM household_members
   WHERE user_id = current_user
  ↓
4. If enabled:
   └─ Schedule notification
      ├─ Check critical equipment status
      ├─ Determine message
      ├─ Create platform-specific trigger
      └─ Schedule notification
  ↓
Equipment status changes:
  ├─ Auto-reschedule notification
  └─ Update message based on status
  ↓
Settings screen:
  ├─ Toggle enabled
  └─ Change time
     └─ Cancel old + schedule new
```

## State Management

### Global State (HouseholdProvider)

```typescript
interface HouseholdContextValue {
  user: User | null;                    // Supabase auth user
  householdId: string | null;           // Active household ID
  childId: string | null;               // First child ID
  members: HouseholdMember[];           // All members (real + placeholder)
  needsOnboarding: boolean;             // No household yet
  loading: boolean;                     // Initial load
  error: string | null;                 // Load error
  refresh: () => Promise<void>;         // Reload data
  forceOnboarding: () => void;          // Dev: trigger re-onboarding
}
```

**Provides to:**
- All screens
- All components via `useHousehold()` hook

**Updates when:**
- Auth state changes (login/logout)
- `refresh()` called manually
- URL parameter `?onboarding=true` (web)

### Local State Patterns

#### Optimistic Updates

```typescript
// 1. Update UI immediately
setData(newValue);

// 2. Save to database
try {
  await saveToDatabase(newValue);
} catch (error) {
  // 3. Revert on error
  setData(oldValue);
  showError();
}
```

**Used in:**
- Schedule slot assignments
- Equipment status toggles
- Profile information updates

#### Loading States

```typescript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await fetch(...);
    setData(data);
  } finally {
    setLoading(false);
  }
};
```

#### Refs for Non-Rendering State

```typescript
const notificationInitializedRef = useRef(false);

useEffect(() => {
  if (notificationInitializedRef.current) return;
  notificationInitializedRef.current = true;

  // Initialize once
}, [dependency]);
```

**Used for:**
- Preventing double initialization
- Tracking temporary flags
- Storing mutable values without re-render

## Database Schema

### Core Tables

```sql
-- Households
households (
  id, name, invite_code, created_by, created_at
)

-- Members
household_members (
  id, household_id, user_id,  -- user_id can be NULL (placeholder)
  display_name, role,
  notification_enabled, notification_time,
  created_at
)

-- Children
children (
  id, household_id, name, created_at
)

-- Schedule Assignments (Individual days)
schedule_assignments (
  id, household_id, child_id, date, slot,
  assigned_member_id, assigned_user_id,  -- Both for backwards compatibility
  updated_by, created_at,
  UNIQUE (child_id, date, slot)
)

-- Schedule Templates (Recurring)
schedule_templates (
  id, household_id, child_id, weekday, slot,
  assigned_member_id, assigned_user_id,
  updated_by, created_at,
  UNIQUE (household_id, child_id, weekday, slot)
)

-- Equipment Items (Definitions)
equipment_items (
  id, household_id, key, label,
  is_critical, sort_order, active,
  updated_by, created_at,
  UNIQUE (household_id, key)
)

-- Equipment Status (Current state)
household_equipment_status (
  household_id, item_key, status,
  updated_by, updated_at,
  PRIMARY KEY (household_id, item_key)
)
```

### RPC Functions

```sql
-- Create household with all initial data
bootstrap_household(
  my_name TEXT,
  partner_name TEXT,
  child_name TEXT,
  equipment_items JSONB,
  schedule_template JSONB
) RETURNS household_result

-- Join existing household
accept_household_invite(
  invite_code TEXT,
  display_name TEXT
) RETURNS household_result

-- Regenerate invite code
regenerate_household_invite_code(
  household_id UUID
) RETURNS TEXT

-- Get placeholder name for invite
get_placeholder_name_for_invite(
  invite_code TEXT
) RETURNS TEXT
```

## Component Architecture

### Component Hierarchy

```
App
└─ HouseholdProvider
   ├─ NavigationContainer
   │  └─ Stack.Navigator
   │     ├─ AuthScreen
   │     ├─ OnboardingScreen
   │     └─ MainStack
   │        ├─ MainScreen
   │        │  ├─ TodayCard
   │        │  │  ├─ ScheduleSlot (hero variant)
   │        │  │  ├─ EquipmentStatusBadge
   │        │  │  └─ EquipmentBottomSheet
   │        │  ├─ WeekView
   │        │  │  └─ DayRow
   │        │  │     └─ ScheduleSlot × 2
   │        │  └─ ConfettiCannon
   │        │
   │        ├─ ProfileScreen
   │        │  └─ MenuItem × N
   │        │
   │        ├─ PersonalInfoScreen
   │        ├─ NotificationsSettingsScreen
   │        │  ├─ DateTimePicker
   │        │  └─ Debug buttons
   │        │
   │        └─ EquipmentManagementScreen
   │           └─ EquipmentItem × N
   │
   └─ StatusBar
```

### Key Components

#### ScheduleSlot

**Props:**
```typescript
{
  slotType: 'dropoff' | 'pickup',
  displayName?: string,
  userId?: string,
  members: HouseholdMember[],
  onPress: () => void,
  loading?: boolean,
  isInHero?: boolean
}
```

**Responsibilities:**
- Display assignment with icon (▶ / ◀)
- Color based on person (gradient)
- Loading shimmer animation
- Haptic feedback on press

#### TodayCard

**Props:**
```typescript
{
  date: string,
  dropoffName?: string,
  pickupName?: string,
  dropoffUserId?: string,
  pickupUserId?: string,
  members: HouseholdMember[]
}
```

**Responsibilities:**
- Show today/tomorrow info
- Display schedule slots (hero variant)
- Show equipment status badge
- Auto-popup equipment modal (4 PM)
- Confetti on equipment ready

#### EquipmentBottomSheet

**Props:**
```typescript
{
  visible: boolean,
  items: EquipmentItem[],
  loading: boolean,
  onToggle: (key: string) => void,
  onClose: () => void
}
```

**Responsibilities:**
- Animated slide-up modal
- List all equipment items
- Toggle status with color feedback
- Scrollable content

## Services Layer

### equipment.ts

**Exports:**
```typescript
fetchEquipmentStatus(householdId): Promise<EquipmentItem[]>
updateEquipmentStatus(householdId, userId, itemKey, status): Promise<void>
calculateEquipmentStatus(items): EquipmentStatus
shouldShowEquipmentModal(date, lastShownDate): Promise<boolean>
```

**Responsibilities:**
- Equipment data fetching
- Status calculations
- Auto-modal logic
- Integration with notifications

### notifications.ts

**Exports:**
```typescript
requestNotificationPermissions(): Promise<boolean>
setupNotificationChannel(): Promise<void>
scheduleEquipmentNotification(householdId, time): Promise<string | null>
cancelAllEquipmentNotifications(): Promise<void>
rescheduleNotificationIfNeeded(householdId, memberId): Promise<void>
getNotificationSettings(memberId): Promise<NotificationSettings>
saveNotificationSettings(memberId, settings): Promise<boolean>
```

**Responsibilities:**
- Permission handling
- Notification scheduling
- Platform-specific triggers
- Auto-rescheduling logic

### supabase.ts

**Exports:**
```typescript
supabase: SupabaseClient
```

**Configuration:**
- Platform-specific storage adapter
- Auto-refresh tokens
- Persist sessions
- URL polyfill for web

## Error Handling Strategy

### Network Errors

**Pattern:**
```typescript
try {
  await apiCall();
} catch (error) {
  console.error('Error:', error);

  // User feedback
  Alert.alert('Feil', 'Noe gikk galt. Prøv igjen.');

  // Haptic feedback
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Error
    );
  }

  // Revert optimistic update if needed
  revertChanges();
}
```

### Validation Errors

**Pattern:**
```typescript
if (!input.trim()) {
  Alert.alert('Feil', 'Dette feltet er påkrevd');
  return;
}
```

### Database Errors

**Common errors:**
- Unique constraint violation
- Foreign key violation
- RLS policy rejection
- Timeout

**Handling:**
- Log to console
- Show user-friendly message
- Provide retry option
- Revert optimistic updates

## Performance Optimizations

### Optimistic Updates

**Benefits:**
- Instant UI feedback
- No perceived latency
- Better UX on slow networks

**Trade-offs:**
- Must handle revert on error
- Temporary inconsistent state

### Batch Operations

**Where used:**
- Template application (insert all assignments)
- Equipment items creation (onboarding)

**Benefits:**
- Fewer round-trips
- Faster perceived performance
- Atomic operations

### Caching Strategies

**Current:**
- HouseholdProvider caches household data
- Manual refresh via `refresh()`
- No automatic cache invalidation

**Future improvements:**
- Cache schedule assignments per week
- Pre-fetch adjacent weeks
- Real-time subscriptions

### Loading States

**Pattern:**
```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState(null);

useEffect(() => {
  fetchData().then(setData).finally(() => setLoading(false));
}, []);

if (loading) return <Spinner />;
return <Content data={data} />;
```

## Security

### Authentication

- **Supabase Auth** handles all authentication
- Sessions stored securely (Keychain/KeyStore)
- Auto-refresh expired tokens
- Logout clears all local state

### Authorization

- **Row Level Security (RLS)** on all tables
- Users can only access their household data
- Invites validated server-side
- RPC functions enforce household membership

### Data Validation

- Client-side validation for UX
- Server-side validation in RPC functions
- Database constraints (UNIQUE, CHECK, FK)
- Type safety via TypeScript

## Platform Differences

### iOS vs Android

| Feature | iOS | Android |
|---------|-----|---------|
| Notifications trigger | CALENDAR (auto-repeat) | TIME_INTERVAL (manual) |
| DateTimePicker | Modal spinner | Dialog |
| Alert.prompt | Supported | Not supported |
| Haptics | Full support | Full support |
| Safe area | Notch + Dynamic Island | Various cutouts |
| Keyboard avoiding | padding | height |

### Web Support

**Limited support:**
- ❌ Notifications (not available)
- ❌ Haptics (not available)
- ⚠️ DateTimePicker (limited)
- ⚠️ Gesture handling (limited)
- ✅ Core functionality works

## Testing Strategy

### Manual Testing

**Critical paths:**
1. Auth flow (login/signup)
2. Onboarding (create + join)
3. Schedule assignment
4. Equipment toggle
5. Notification scheduling

**Edge cases:**
- Network offline
- Permission denied
- Empty states
- Error scenarios

### Future: Automated Testing

**Recommended:**
- Unit tests (services layer)
- Integration tests (data flow)
- E2E tests (critical paths)
- Component tests (UI)

## Monitoring & Debugging

### Logging Strategy

**Console logging:**
- All service functions log inputs/outputs
- Error logging with context
- Success/failure indicators (✅/❌)
- Structured logging format

**Example:**
```typescript
console.log('\n=== SCHEDULING NOTIFICATION ===');
console.log('Platform:', Platform.OS);
console.log('Time:', time);
// ... operation
console.log('✅ SUCCESS: Notification scheduled');
console.log('=== END SCHEDULING ===\n');
```

### Debug Tools

**Built-in:**
- Debug buttons in NotificationsSettingsScreen
- "Kjør onboarding på nytt" in ProfileScreen
- Console logging throughout app

**Future:**
- Crashlytics integration
- Performance monitoring
- User analytics

## Deployment

### Build Process

```bash
# Development
expo start

# iOS build
expo run:ios

# Android build
expo run:android

# Production build
eas build --platform ios
eas build --platform android
```

### Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Versioning

- Semantic versioning (major.minor.patch)
- Update `app.json` version fields
- Update `CHANGELOG.md` with changes

## Future Architecture Improvements

### Scalability

- [ ] Real-time subscriptions (Supabase)
- [ ] Offline-first with sync
- [ ] Request cancellation on navigation
- [ ] Pre-fetching adjacent data

### Performance

- [ ] React.memo for expensive components
- [ ] useMemo/useCallback optimization
- [ ] VirtualizedList for long lists
- [ ] Image optimization and lazy loading

### Code Quality

- [ ] ESLint configuration
- [ ] Prettier formatting
- [ ] Husky pre-commit hooks
- [ ] TypeScript strict mode

### Testing

- [ ] Jest unit tests
- [ ] React Testing Library
- [ ] Detox E2E tests
- [ ] Snapshot testing

### Monitoring

- [ ] Sentry error tracking
- [ ] Firebase Analytics
- [ ] Performance monitoring
- [ ] User behavior tracking

## Relaterte Dokumenter

- [README.md](./README.md) - App overview
- [SCHEDULE.md](./SCHEDULE.md) - Schedule system
- [EQUIPMENT.md](./EQUIPMENT.md) - Equipment system
- [NOTIFICATIONS.md](./NOTIFICATIONS.md) - Notifications
- [ONBOARDING.md](./ONBOARDING.md) - Onboarding flow

## Lisens

Proprietary - Barnehage-Plan App

---

Sist oppdatert: 2025-02-13
