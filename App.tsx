import React, { useState } from 'react';
import { View, Text } from 'react-native'; // Import Text from react-native
import Routes from './routes';
import SplashScreenComponent from './SplashScreenComponent';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const onFinishSplash = () => {
    setShowSplash(false); // Hide the splash screen
  };

  return (
      <View style={{ flex: 1 }}>
        {showSplash ? (
          <SplashScreenComponent onFinish={onFinishSplash} />
        ) : (
          <Routes />
        )}
      </View>
  );
}
