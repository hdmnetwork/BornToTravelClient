import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ProfilPage from '../profil/profilPage';
import MapPage from '../map/mapPage';
import MyJourney from '../myJourney/MyJourney';
import {MyJourneyString} from '../../types/key';

// Composant qui gère les onglets de navigation inférieure
function BottomTabs({location}) {
  // Création d'un navigateur d'onglets inférieurs
  const Tab = createBottomTabNavigator();

  return (
    <Tab.Navigator
      initialRouteName="tabs_home"
      screenOptions={{
        tabBarActiveTintColor: '#1e90ff',
        headerShown: false,
      }}>
      {/*
//TODO - Do not pass children as props. Instead, nest children between the opening and closing tags. sonarlint(typescript:S6748)
    */}
      {/*
//FIXME - Type '{ location: any; }' is not assignable to type 'IntrinsicAttributes'.
  Property 'location' does not exist on type 'IntrinsicAttributes'. ts(2322)
      */}
      <Tab.Screen
        name="homePage"
        children={() => <MapPage location={location} />}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name={MyJourneyString}
        component={MyJourney}
        options={{
          tabBarLabel: MyJourneyString,
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="gift" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfilPage}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({color, size}) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default BottomTabs;
