import { calculateEquipmentStatus } from '../equipment';
import type { EquipmentItem } from '../../types/db';

describe('calculateEquipmentStatus', () => {
  describe('when all items are OK', () => {
    it('should return "ready"', () => {
      const items: EquipmentItem[] = [
        { key: 'rain_gear', label: 'Regntøy', is_critical: true, status: 'ok' },
        { key: 'diapers', label: 'Bleier', is_critical: true, status: 'ok' },
        { key: 'wool', label: 'Ull', is_critical: false, status: 'ok' },
      ];

      expect(calculateEquipmentStatus(items)).toBe('ready');
    });
  });

  describe('when critical items are missing', () => {
    it('should return "not_ready" (red status)', () => {
      const items: EquipmentItem[] = [
        { key: 'rain_gear', label: 'Regntøy', is_critical: true, status: 'missing' },
        { key: 'diapers', label: 'Bleier', is_critical: true, status: 'ok' },
        { key: 'wool', label: 'Ull', is_critical: false, status: 'ok' },
      ];

      expect(calculateEquipmentStatus(items)).toBe('not_ready');
    });

    it('should return "not_ready" even if non-critical items are also missing', () => {
      const items: EquipmentItem[] = [
        { key: 'rain_gear', label: 'Regntøy', is_critical: true, status: 'missing' },
        { key: 'diapers', label: 'Bleier', is_critical: true, status: 'ok' },
        { key: 'wool', label: 'Ull', is_critical: false, status: 'missing' },
      ];

      expect(calculateEquipmentStatus(items)).toBe('not_ready');
    });
  });

  describe('when only non-critical items are missing', () => {
    it('should return "missing" (yellow status)', () => {
      const items: EquipmentItem[] = [
        { key: 'rain_gear', label: 'Regntøy', is_critical: true, status: 'ok' },
        { key: 'diapers', label: 'Bleier', is_critical: true, status: 'ok' },
        { key: 'wool', label: 'Ull', is_critical: false, status: 'missing' },
      ];

      expect(calculateEquipmentStatus(items)).toBe('missing');
    });

    it('should return "missing" when multiple non-critical items are missing', () => {
      const items: EquipmentItem[] = [
        { key: 'rain_gear', label: 'Regntøy', is_critical: true, status: 'ok' },
        { key: 'diapers', label: 'Bleier', is_critical: true, status: 'ok' },
        { key: 'wool', label: 'Ull', is_critical: false, status: 'missing' },
        { key: 'change_clothes', label: 'Skiftetøy', is_critical: false, status: 'missing' },
      ];

      expect(calculateEquipmentStatus(items)).toBe('missing');
    });
  });

  describe('edge cases', () => {
    it('should return "not_ready" when items array is empty', () => {
      expect(calculateEquipmentStatus([])).toBe('not_ready');
    });

    it('should handle items without is_critical flag (defaults to false)', () => {
      const items: EquipmentItem[] = [
        { key: 'item1', label: 'Item 1', is_critical: true, status: 'ok' },
        { key: 'item2', label: 'Item 2', is_critical: false, status: 'missing' },
      ];

      expect(calculateEquipmentStatus(items)).toBe('missing');
    });
  });

  describe('priority of statuses', () => {
    it('should prioritize critical missing over non-critical missing', () => {
      const items: EquipmentItem[] = [
        { key: 'rain_gear', label: 'Regntøy', is_critical: true, status: 'missing' },
        { key: 'wool', label: 'Ull', is_critical: false, status: 'missing' },
      ];

      // Should return not_ready (critical) not missing (non-critical)
      expect(calculateEquipmentStatus(items)).toBe('not_ready');
    });
  });
});
