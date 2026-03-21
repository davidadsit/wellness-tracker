import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, persistor} from './src/store';
import {RootNavigator} from './src/navigation/RootNavigator';
import {linking} from './src/navigation/linking';
import {notificationService} from './src/services/notifications/notificationService';
import {registerNotificationHandlers} from './src/services/notifications/notificationHandlers';
import {initializeDatabase} from './src/services/database/database';

registerNotificationHandlers();

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initializeDatabase()
      .then(() => setDbReady(true))
      .catch(err => console.error('DB init failed:', err));
    notificationService.setupChannel();
  }, []);

  if (!dbReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer linking={linking}>
          <RootNavigator />
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
}
