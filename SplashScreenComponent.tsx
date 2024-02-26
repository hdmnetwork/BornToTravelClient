import React, {useEffect} from 'react';
import {View, Image} from 'react-native';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

const SplashScreenComponent = ({onFinish}) => {
  const scale = useSharedValue(0.1);

  useEffect(() => {
    scale.value = withTiming(0.6, {
      duration: 2500,
      easing: Easing.out(Easing.exp),
    });

    // Utilisons setTimeout pour déclencher onFinish après que l'animation est terminée
    setTimeout(() => {
      onFinish();
    }, 2500);
  }, []);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{scale: scale.value}],
    };
  });

  return (
    <View
      style={{
        backgroundColor: 'blanchedalmond',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Animated.View style={animatedStyles}>
        <Image source={require('./assets/favicon-BTT.png')} />
      </Animated.View>
    </View>
  );
};

export default SplashScreenComponent;
