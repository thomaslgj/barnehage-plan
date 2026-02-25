import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TipId = 'avatar_switch' | 'note_added' | 'equipment_button';

const TIP_STORAGE_KEY = '@contextual_tips_shown';

interface TipsState {
  [key: string]: boolean;
}

export function useTips() {
  const [shownTips, setShownTips] = useState<TipsState>({});
  const [loading, setLoading] = useState(true);

  // Load shown tips from storage
  useEffect(() => {
    loadTipsState();
  }, []);

  const loadTipsState = async () => {
    try {
      const stored = await AsyncStorage.getItem(TIP_STORAGE_KEY);
      if (stored) {
        setShownTips(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading tips state:', error);
    } finally {
      setLoading(false);
    }
  };

  const shouldShowTip = (tipId: TipId): boolean => {
    return !loading && !shownTips[tipId];
  };

  const markTipAsShown = async (tipId: TipId) => {
    try {
      const newState = { ...shownTips, [tipId]: true };
      setShownTips(newState);
      await AsyncStorage.setItem(TIP_STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Error saving tip state:', error);
    }
  };

  const resetAllTips = async () => {
    try {
      setShownTips({});
      await AsyncStorage.removeItem(TIP_STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting tips:', error);
    }
  };

  return {
    loading,
    shouldShowTip,
    markTipAsShown,
    resetAllTips,
  };
}
