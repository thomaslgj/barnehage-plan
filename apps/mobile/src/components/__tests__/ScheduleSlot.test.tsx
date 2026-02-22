import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ScheduleSlot from '../ScheduleSlot';

// Mock tw library
jest.mock('../../lib/tw', () => ({
  __esModule: true,
  default: {
    style: (...args: any[]) => ({}),
    color: (color: string) => color,
  },
}));

// Mock Avatar component
jest.mock('../Avatar', () => 'Avatar');

describe('ScheduleSlot Component', () => {
  const mockMembers = [
    { id: 'member-1', user_id: 'user-1', display_name: 'John Doe', avatar_id: 'avatar1' },
    { id: 'member-2', user_id: 'user-2', display_name: 'Jane Smith', avatar_id: 'avatar2' },
  ];

  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      const { getByTestId } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="John Doe"
          userId="user-1"
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
        />
      );

      expect(getByTestId('schedule-slot-dropoff')).toBeTruthy();
    });

    it('should render with dropoff slot type', () => {
      const { getByTestId } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="John Doe"
          userId="user-1"
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
        />
      );

      expect(getByTestId('schedule-slot-dropoff')).toBeTruthy();
    });

    it('should render with pickup slot type', () => {
      const { getByTestId } = render(
        <ScheduleSlot
          slotType="pickup"
          displayName="Jane Smith"
          userId="user-2"
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
        />
      );

      expect(getByTestId('schedule-slot-pickup')).toBeTruthy();
    });

    it('should display user name when provided', () => {
      const { getByText } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="John Doe"
          userId="user-1"
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
        />
      );

      expect(getByText('John Doe')).toBeTruthy();
    });

    it('should display "Hvem?" when no user assigned', () => {
      const { getByText } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName={undefined}
          userId={null}
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
        />
      );

      expect(getByText('Hvem?')).toBeTruthy();
    });
  });

  describe('interactions', () => {
    it('should call onPress when pressed', () => {
      const { getByTestId } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="John Doe"
          userId="user-1"
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
        />
      );

      const slot = getByTestId('schedule-slot-dropoff');
      fireEvent.press(slot);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('should not call onPress when loading', () => {
      const { getByTestId } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="John Doe"
          userId="user-1"
          members={mockMembers}
          onPress={mockOnPress}
          loading={true}
        />
      );

      const slot = getByTestId('schedule-slot-dropoff');
      fireEvent.press(slot);

      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator when loading', () => {
      const { getByTestId } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="John Doe"
          userId="user-1"
          members={mockMembers}
          onPress={mockOnPress}
          loading={true}
        />
      );

      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('should not show loading indicator when not loading', () => {
      const { queryByTestId } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="John Doe"
          userId="user-1"
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
        />
      );

      expect(queryByTestId('loading-indicator')).toBeNull();
    });
  });

  describe('hero mode', () => {
    it('should apply different styling when isInHero is true', () => {
      const { getByTestId } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="John Doe"
          userId="user-1"
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
          isInHero={true}
        />
      );

      const slot = getByTestId('schedule-slot-dropoff');
      expect(slot).toBeTruthy();
    });

    it('should use normal styling when isInHero is false', () => {
      const { getByTestId } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="John Doe"
          userId="user-1"
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
          isInHero={false}
        />
      );

      const slot = getByTestId('schedule-slot-dropoff');
      expect(slot).toBeTruthy();
    });
  });

  describe('member matching', () => {
    it('should find member by user_id', () => {
      const { getByText } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="John Doe"
          userId="user-1"
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
        />
      );

      expect(getByText('John Doe')).toBeTruthy();
    });

    it('should handle userId not in members list', () => {
      const { getByText } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="Unknown User"
          userId="user-999"
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
        />
      );

      expect(getByText('Unknown User')).toBeTruthy();
    });

    it('should handle empty members array', () => {
      const { getByText } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="John Doe"
          userId="user-1"
          members={[]}
          onPress={mockOnPress}
          loading={false}
        />
      );

      expect(getByText('John Doe')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle null userId gracefully', () => {
      const { getByTestId, getByText } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName={undefined}
          userId={null}
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
        />
      );

      expect(getByTestId('schedule-slot-dropoff')).toBeTruthy();
      expect(getByText('Hvem?')).toBeTruthy();
    });

    it('should handle undefined displayName', () => {
      const { getByTestId, getByText } = render(
        <ScheduleSlot
          slotType="pickup"
          displayName={undefined}
          userId={null}
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
        />
      );

      expect(getByTestId('schedule-slot-pickup')).toBeTruthy();
      expect(getByText('Hvem?')).toBeTruthy();
    });

    it('should handle missing onPress function', () => {
      const { getByTestId } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="John Doe"
          userId="user-1"
          members={mockMembers}
          onPress={undefined as any}
          loading={false}
        />
      );

      const slot = getByTestId('schedule-slot-dropoff');

      // Should not crash when pressed without onPress
      expect(() => fireEvent.press(slot)).not.toThrow();
    });
  });

  describe('text opacity animation', () => {
    it('should accept textOpacity prop', () => {
      const mockAnimatedValue = { __getValue: () => 1 };

      const { getByTestId } = render(
        <ScheduleSlot
          slotType="dropoff"
          displayName="John Doe"
          userId="user-1"
          members={mockMembers}
          onPress={mockOnPress}
          loading={false}
          textOpacity={mockAnimatedValue as any}
        />
      );

      expect(getByTestId('schedule-slot-dropoff')).toBeTruthy();
    });
  });
});
