# Testing Guide

## Oversikt

Prosjektet bruker **Jest** og **React Native Testing Library** for unit og component testing.

## Setup

### Installer Dependencies

```bash
cd apps/mobile
npm install
```

Dette installerer alle nødvendige testing-pakker fra `package.json`.

## Kjør Tester

### Alle tester

```bash
npm test
```

### Watch mode (automatisk re-run ved endringer)

```bash
npm run test:watch
```

### Med coverage rapport

```bash
npm run test:coverage
```

### CI mode (for GitHub Actions, etc.)

```bash
npm run test:ci
```

## Skrive Tester

### Test-struktur

Plasser tester i `__tests__` mapper ved siden av koden de tester:

```
src/
  lib/
    equipment.ts
    __tests__/
      equipment.test.ts
  components/
    Avatar.tsx
    __tests__/
      Avatar.test.tsx
```

### Eksempel: Utility Function Test

```typescript
// src/lib/__tests__/myFunction.test.ts
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    expect(myFunction(null)).toBe(null);
    expect(myFunction('')).toBe('');
  });
});
```

### Eksempel: Component Test

```typescript
// src/components/__tests__/MyComponent.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent title="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });

  it('should handle button press', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <MyComponent title="Test" onPress={onPress} />
    );

    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### Eksempel: Async Test

```typescript
it('should fetch data', async () => {
  const mockData = { id: 1, name: 'Test' };

  // Mock Supabase
  const mockSelect = jest.fn().mockResolvedValue({ data: mockData, error: null });
  supabase.from = jest.fn(() => ({ select: mockSelect }));

  const result = await fetchData();

  expect(result).toEqual(mockData);
  expect(mockSelect).toHaveBeenCalled();
});
```

## Mocking

### Supabase

Supabase er allerede mocket i `jest.setup.js`. Du kan override for spesifikke tester:

```typescript
import { supabase } from '../lib/supabase';

jest.mock('../lib/supabase');

it('should handle supabase error', async () => {
  (supabase.from as jest.Mock).mockReturnValue({
    select: jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Error' }
    }),
  });

  // Test error handling...
});
```

### AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

it('should store data', async () => {
  await AsyncStorage.setItem('key', 'value');
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('key', 'value');
});
```

### Expo Modules

Expo-moduler som haptics, secure-store, etc. er mocket i `jest.setup.js`.

## Coverage

### Coverage Thresholds

Definert i `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    statements: 50,
    branches: 40,
    functions: 50,
    lines: 50,
  },
}
```

### Se Coverage Rapport

Etter å ha kjørt `npm run test:coverage`, åpne:

```bash
open coverage/lcov-report/index.html
```

## Best Practices

### 1. Test en ting om gangen

```typescript
// ❌ Dårlig - tester flere ting
it('should work', () => {
  expect(func1()).toBe(true);
  expect(func2()).toBe(false);
  expect(func3()).toEqual([]);
});

// ✅ Bra - én test per konsept
it('should return true when valid', () => {
  expect(func1()).toBe(true);
});

it('should return false when invalid', () => {
  expect(func2()).toBe(false);
});
```

### 2. Bruk beskrivende test-navn

```typescript
// ❌ Dårlig
it('works', () => {});

// ✅ Bra
it('should return "not_ready" when critical items are missing', () => {});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should calculate total correctly', () => {
  // Arrange - setup
  const items = [{ price: 10 }, { price: 20 }];

  // Act - utfør handling
  const total = calculateTotal(items);

  // Assert - verifiser resultat
  expect(total).toBe(30);
});
```

### 4. Test Edge Cases

```typescript
describe('calculateEquipmentStatus', () => {
  it('should handle empty array', () => {
    expect(calculateEquipmentStatus([])).toBe('not_ready');
  });

  it('should handle null values', () => {
    const items = [{ key: 'test', label: null, is_critical: true, status: 'ok' }];
    expect(calculateEquipmentStatus(items)).toBe('ready');
  });
});
```

### 5. Mock External Dependencies

```typescript
// Mock network calls, timers, dates, etc.
jest.useFakeTimers();
jest.setSystemTime(new Date('2024-01-01'));
```

## Hva bør testes?

### ✅ Test Alltid

- **Utility functions** - Ren logikk uten side effects
- **Business logic** - Beregninger, valideringer
- **Critical paths** - Autentisering, betalinger, data export
- **Edge cases** - Tomme arrays, null values, errors

### ⚠️ Test Når Relevant

- **Components** - UI-logikk, user interactions
- **Hooks** - Custom React hooks
- **Integration** - Flere komponenter sammen

### ❌ Ikke Test

- **Third-party libraries** - De har egne tester
- **Trivial code** - Getters/setters uten logikk
- **Constants** - Statiske verdier

## Eksisterende Tester

### Utility Functions

- ✅ `equipment.test.ts` - Equipment status calculation
- ✅ `rateLimit.test.ts` - Rate limit messages

### Components

- ✅ `Avatar.test.tsx` - Avatar component rendering

## Kommende Tester

**High Priority:**
- [ ] `HouseholdProvider` context tests
- [ ] `ScheduleSlot` component tests
- [ ] `AuthScreen` integration tests

**Medium Priority:**
- [ ] `gdpr.ts` data export/delete tests
- [ ] `biometric.ts` authentication tests
- [ ] `EquipmentBottomSheet` component tests

**Low Priority:**
- [ ] Snapshot tests for UI components
- [ ] E2E tests med Detox

## Debugging Tests

### Se hva som feiler

```bash
npm test -- --verbose
```

### Kjør en spesifikk test

```bash
npm test -- equipment.test.ts
```

### Kjør tester matching et pattern

```bash
npm test -- --testNamePattern="should return ready"
```

### Debug i VS Code

Legg til i `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info
```

## Ressurser

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

Ved spørsmål eller problemer, kontakt teamet eller se existing tests for eksempler.
