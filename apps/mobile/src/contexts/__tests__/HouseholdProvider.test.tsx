import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { HouseholdProvider, useHousehold } from '../HouseholdProvider';
import { supabase } from '../../lib/supabase';

// Mock supabase
jest.mock('../../lib/supabase');

describe('HouseholdProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() => useHousehold(), {
        wrapper: HouseholdProvider,
      });

      expect(result.current.loading).toBe(true);
    });

    it('should set user to null when no session exists', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const { result } = renderHook(() => useHousehold(), {
        wrapper: HouseholdProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.needsOnboarding).toBe(false);
    });

    it('should load household data when user is authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockMemberships = [{ household_id: 'household-123' }];
      const mockChildren = [{ id: 'child-123', name: 'Test Child' }];
      const mockMembers = [
        { id: 'member-123', user_id: 'user-123', display_name: 'Test User' },
      ];

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'household_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockResolvedValue({ data: mockMemberships, error: null }),
          };
        }
        if (table === 'children') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockChildren, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockMembers, error: null }),
        };
      });

      const { result } = renderHook(() => useHousehold(), {
        wrapper: HouseholdProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('needsOnboarding', () => {
    it('should set needsOnboarding to true when user has no household', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const { result } = renderHook(() => useHousehold(), {
        wrapper: HouseholdProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.needsOnboarding).toBe(true);
      expect(result.current.householdId).toBeNull();
    });
  });

  describe('refresh', () => {
    it('should reload household data', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const { result } = renderHook(() => useHousehold(), {
        wrapper: HouseholdProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Call refresh and wait for it to complete
      await result.current.refresh();

      // After refresh completes, loading should be false
      expect(result.current.loading).toBe(false);
    });
  });

  describe('forceOnboarding', () => {
    it('should reset state to onboarding mode', async () => {
      const { result } = renderHook(() => useHousehold(), {
        wrapper: HouseholdProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.forceOnboarding();

      expect(result.current.needsOnboarding).toBe(true);
      expect(result.current.householdId).toBeNull();
      expect(result.current.childId).toBeNull();
      expect(result.current.members).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const { result } = renderHook(() => useHousehold(), {
        wrapper: HouseholdProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('should handle refresh token errors without setting error state', async () => {
      (supabase.auth.getSession as jest.Mock).mockRejectedValue(
        new Error('Refresh Token error')
      );

      const { result } = renderHook(() => useHousehold(), {
        wrapper: HouseholdProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.user).toBeNull();
    });
  });

  describe('activity tracking', () => {
    it('should not call updateLastActive during onboarding', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: mockUser } },
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      renderHook(() => useHousehold(), {
        wrapper: HouseholdProvider,
      });

      await waitFor(() => {
        // Should not attempt to update last_active_at when no household
        expect(supabase.from).not.toHaveBeenCalledWith('household_members');
      });
    });
  });

  describe('useHousehold hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useHousehold());
      }).toThrow('useHousehold must be used within a HouseholdProvider');

      consoleSpy.mockRestore();
    });
  });
});
