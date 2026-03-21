export const EventType = {
  DISMISSED: 0,
  PRESS: 1,
  ACTION_PRESS: 2,
  DELIVERED: 3,
};

export const TriggerType = {
  TIMESTAMP: 0,
  INTERVAL: 1,
};

export const RepeatFrequency = {
  NONE: -1,
  HOURLY: 0,
  DAILY: 1,
  WEEKLY: 2,
};

export const AndroidImportance = {
  DEFAULT: 3,
  HIGH: 4,
  LOW: 2,
  MIN: 1,
  NONE: 0,
};

const notifee = {
  createChannel: jest.fn().mockResolvedValue('channel-id'),
  createTriggerNotification: jest.fn().mockResolvedValue('notification-id'),
  cancelNotification: jest.fn().mockResolvedValue(undefined),
  cancelAllNotifications: jest.fn().mockResolvedValue(undefined),
  getTriggerNotifications: jest.fn().mockResolvedValue([]),
  onBackgroundEvent: jest.fn(),
  onForegroundEvent: jest.fn().mockReturnValue(() => {}),
  displayNotification: jest.fn().mockResolvedValue('notification-id'),
  requestPermission: jest.fn().mockResolvedValue({authorizationStatus: 1}),
  getNotificationSettings: jest
    .fn()
    .mockResolvedValue({authorizationStatus: 1}),
};

export default notifee;
