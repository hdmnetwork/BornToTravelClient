import {UserTokenString} from '../types/key';
import {getData} from './get-data';

/**
 Récupération du token dans le asyncStorage
 */
export const getToken = async () => {
  const tokenPromise: Promise<string> = getData(UserTokenString);
  return tokenPromise;
};