import {AppRegistry} from 'react-native';
import App from './App';
import {getDatabase} from './src/services/database/database';
import {registerNotificationHandlers} from './src/services/notifications/notificationHandlers';

// 1. Initialize database (creates schema + seeds data on first launch)
getDatabase();

// 2. Register background notification handlers BEFORE AppRegistry
registerNotificationHandlers();

// 3. Register the app
AppRegistry.registerComponent('WellnessTracker', () => App);
