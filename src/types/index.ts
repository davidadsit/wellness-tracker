export interface TagCategory {
  id: string;
  name: string;
  sortOrder: number;
  isDefault: boolean;
  triggerTagId?: string;
  createdAt: number;
}

export interface Tag {
  id: string;
  categoryId: string;
  label: string;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: number;
}

export interface CheckIn {
  id: string;
  timestamp: number;
  tagIds: string[];
  note?: string;
  source: 'manual' | 'notification';
}

export type HabitCategory =
  | 'sleep'
  | 'water'
  | 'exercise'
  | 'nutrition'
  | 'mindfulness'
  | 'custom';

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  frequency: 'daily' | 'weekly';
  targetCount: number;
  unit?: string;
  color: string;
  icon: string;
  reminderTime?: string;
  isActive: boolean;
  createdAt: number;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string;
  count: number;
  completedAt: number;
  source: 'manual' | 'notification';
}

export type ReminderPeriod = 'morning' | 'midday' | 'evening';

export type NotificationOutcome = 'dismissed' | 'snoozed' | 'interacted';

export interface ReminderConfig {
  enabled: boolean;
  time: string;
}

export interface NotificationOutcomeRecord {
  id: string;
  reminderPeriod: ReminderPeriod;
  outcome: NotificationOutcome | null;
  scheduledTime: string;
  sentAt: number;
  respondedAt: number | null;
}

export type TabParamList = {
  Home: undefined;
  'Check-In': undefined;
  Habits: undefined;
  Journal: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  Settings: undefined;
  Analytics: undefined;
  TagManagement: undefined;
  QuickCheckIn: undefined;
};

export type HabitsStackParamList = {
  HabitsMain: undefined;
  HabitDetail: {habitId: string};
  HabitForm: {habitId?: string};
};
