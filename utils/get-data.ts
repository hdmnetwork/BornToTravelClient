import AsyncStorage from '@react-native-async-storage/async-storage';
import {Key} from '../types/key';

/**
 Fonction pour obtenir les données depuis AsyncStorage
 */
export const getData = async (key: Key) => {
  try {
    const jsonValue: string | null = await AsyncStorage.getItem(key);

    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // Gérer les erreurs de lecture des données
    console.error('Error reading value from AsyncStorage:', e);
  }
};
