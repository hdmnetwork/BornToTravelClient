import AsyncStorage from '@react-native-async-storage/async-storage';
import {PointOfInterest} from '../types/point-of-interest';
import {MyJourneyString} from '../types/key';

/**
 Fonction pour stocker les données d'itinéraire dans le stockage local
 */
export const storeData = async (value: PointOfInterest[]) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(MyJourneyString, jsonValue);
  } catch (e) {
    console.log(e);
  }
};
