import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import BottomTabs from '../pages/tabs';
import LoginPage from '../pages/login/loginPage';
import MyJourney from '../pages/myJourney/MyJourney';
import {MyJourneyString} from '../types/key';

const Stack = createNativeStackNavigator();

// Composant qui gère la navigation de l'application
const Routes = ({location}) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginPage} />
        <Stack.Screen name="Home">
          {props => <BottomTabs {...props} location={location} />}
        </Stack.Screen>
        <Stack.Screen name={MyJourneyString} component={MyJourney} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Routes;
