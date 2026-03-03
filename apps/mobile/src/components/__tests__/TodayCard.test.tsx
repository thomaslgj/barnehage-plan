import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LayoutAnimation } from 'react-native';
import TodayCard from '../TodayCard';
import type { DayNote } from '../../types/db';

// Mock tw
jest.mock('../../lib/tw', () => {
  const fn = () => ({});
  fn.style = () => ({});
  return { __esModule: true, default: fn };
});

// Mock HouseholdProvider
jest.mock('../../contexts/HouseholdProvider', () => ({
  useHousehold: () => ({
    user: { id: 'user-1' },
    householdId: 'household-1',
  }),
}));

// Mock equipment lib
jest.mock('../../lib/equipment', () => ({
  fetchEquipmentStatus: jest.fn(() => Promise.resolve([])),
  updateEquipmentStatus: jest.fn(() => Promise.resolve()),
  calculateEquipmentStatus: jest.fn(() => 'ready'),
  shouldShowEquipmentModal: jest.fn(() => false),
}));

// Mock child components
jest.mock('../EquipmentStatusBadge', () => ({
  __esModule: true,
  default: 'EquipmentStatusBadge',
}));
jest.mock('../EquipmentBottomSheet', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../EquipmentModal', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../ScheduleSlot', () => ({
  __esModule: true,
  default: 'ScheduleSlot',
}));
jest.mock('../Avatar', () => ({
  __esModule: true,
  default: 'Avatar',
}));
jest.mock('react-native-confetti-cannon', () => {
  const mockReact = require('react');
  return {
    __esModule: true,
    default: mockReact.forwardRef((_props: any, _ref: any) => null),
  };
});

const mockNotes: DayNote[] = [
  {
    id: 'note-1',
    content: 'Husk regnklær',
    household_id: 'household-1',
    child_id: 'child-1',
    date: '2024-01-15',
    created_by: 'user-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
];

const defaultProps = {
  date: '2024-01-15',
  dropoffName: 'Ola',
  pickupName: 'Kari',
  dropoffUserId: 'user-1',
  pickupUserId: 'user-2',
  members: [
    { id: 'member-1', user_id: 'user-1', display_name: 'Ola', avatar_id: null },
    { id: 'member-2', user_id: 'user-2', display_name: 'Kari', avatar_id: null },
  ],
  onToggleCollapse: jest.fn(),
};

describe('TodayCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('collapse animation', () => {
    it('calls LayoutAnimation.configureNext when pressing collapse button', () => {
      const spy = jest.spyOn(LayoutAnimation, 'configureNext');
      const { getByTestId } = render(
        <TodayCard {...defaultProps} collapsed={false} />
      );

      fireEvent.press(getByTestId('today-card-toggle'));

      expect(spy).toHaveBeenCalled();
    });

    it('calls LayoutAnimation.configureNext when pressing the header area', () => {
      const spy = jest.spyOn(LayoutAnimation, 'configureNext');
      const { getByTestId } = render(
        <TodayCard {...defaultProps} collapsed={false} />
      );

      fireEvent.press(getByTestId('today-card-header'));

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('notes section', () => {
    it('renders notes section when expanded and notes exist', () => {
      const { getByTestId } = render(
        <TodayCard {...defaultProps} collapsed={false} notes={mockNotes} />
      );

      expect(getByTestId('today-card-notes-section')).toBeTruthy();
    });

    it('does not render notes section when collapsed', () => {
      const { queryByTestId } = render(
        <TodayCard {...defaultProps} collapsed={true} notes={mockNotes} />
      );

      expect(queryByTestId('today-card-notes-section')).toBeNull();
    });

    it('does not render notes section when there are no notes', () => {
      const { queryByTestId } = render(
        <TodayCard {...defaultProps} collapsed={false} notes={[]} />
      );

      expect(queryByTestId('today-card-notes-section')).toBeNull();
    });
  });

  describe('equipment section', () => {
    it('renders equipment section when expanded', () => {
      const { getByTestId } = render(
        <TodayCard {...defaultProps} collapsed={false} />
      );

      expect(getByTestId('today-card-equipment-section')).toBeTruthy();
    });

    it('does not render equipment section when collapsed', () => {
      const { queryByTestId } = render(
        <TodayCard {...defaultProps} collapsed={true} />
      );

      expect(queryByTestId('today-card-equipment-section')).toBeNull();
    });
  });
});
