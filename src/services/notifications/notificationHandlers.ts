import notifee, {EventType} from '@notifee/react-native';
import {habitRepository} from '../database/habitRepository';
import {notificationService} from './notificationService';
import {format} from 'date-fns';

export function registerNotificationHandlers(): void {
  notifee.onBackgroundEvent(async ({type, detail}) => {
    if (type !== EventType.ACTION_PRESS) {
      return;
    }

    const {notification, pressAction} = detail;
    const habitId = notification?.data?.habitId as string | undefined;

    switch (pressAction?.id) {
      case 'COMPLETE_HABIT':
        if (habitId) {
          await habitRepository.completeHabit(habitId, {
            source: 'notification',
            date: format(new Date(), 'yyyy-MM-dd'),
          });
          await notifee.cancelNotification(notification!.id!);
        }
        break;

      case 'SNOOZE_HABIT':
        if (notification?.id) {
          await notificationService.snoozeNotification(notification.id, 30);
        }
        break;

      case 'DISMISS':
        if (notification?.id) {
          await notifee.cancelNotification(notification.id);
        }
        break;

      // CHECK_IN opens app via deep link — nothing to do here
    }
  });
}
