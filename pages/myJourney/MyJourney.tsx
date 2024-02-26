import {useFocusEffect} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import axios, {AxiosError} from 'axios';

import Constants from 'expo-constants';
import {PointOfInterest} from '../../types/point-of-interest';
import {storeData} from '../../utils/store-data';
import {getToken} from '../../utils/get-token';
import {User} from '../../types/user';

const {width, height} = Dimensions.get('window');

const MyJourney = (): JSX.Element => {
  // États pour la page MyJourney
  const [journeyData, setJourneyData] = useState<PointOfInterest[]>([]);
  const [journeyMessage, setJourneyMessage] = useState<string>('');

  const [user, setUser] = useState({
    id: '',
    pseudo: '',
    firstname: '',
    lastname: '',
    email: '',
    token: '',
    isElectricCar: false,
  });

  const getFavoritesEffect = async (userId: string, token: string) => {
    return axios
      .get<PointOfInterest[]>(
        `${Constants.expoConfig.extra.api}/favorites/showFavorites/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      .then(response => {
        const favorites = response.data;
        //FIXME - favorites : [] keeps spamming in the console after a delete while I'm on the MyJourney page
        console.info('favorites : ', favorites);

        setJourneyData(favorites);
        storeData(favorites);
        checkEmptyArray(favorites);
      })
      .catch(
        (
          error: AxiosError<{
            error: string;
            message: string;
            statusCode: number;
          }>,
        ) => {
          console.info(
            'Erreur lors de la récupération des lieux favoris:',
            error,
          );

          if (
            error.response.data.message.includes(
              "Aucun lieu n'as été trouvé pour cet utilisateur",
            ) ||
            error.response.status === 500
          ) {
            setJourneyData([]);
            setNoFavoritesMessage();
          } else {
            console.error(
              'Erreur lors de la récupération des lieux favoris:',
              error,
            );
            console.error('error.response.data : ', error.response.data);
          }
        },
      );
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = await getToken();
  
      if (token) {
        try {
          const response = await axios.post(`${Constants.expoConfig.extra.api}/auth/decode`, {}, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
  
          const userData = response.data;
  
          setUser(prevUser => ({
            ...prevUser,
            ...userData,
            token,
          }));

          console.log('Decoded User Data in MyJourney:', response.data);
  
          getFavoritesEffect(userData.id, token);
        } catch (error) {
          console.error('Error fetching user data from server:', error);
        }
      } else {
        console.error('Token not found');
      }
    };
  
    fetchData();
  }, []);
  

  const setNoFavoritesMessage = () => {
    setJourneyMessage(
      'Ajoutez des lieux en favoris via la page Carte afin de les voir apparaitre ici.',
    );
  };

  const checkEmptyArray = (favorites: PointOfInterest[]) => {
    if (favorites.length === 0) {
      setNoFavoritesMessage();
    } else {
      setJourneyMessage('');
    }
  };

  // Récupérer les lieux en favoris de l'utilisateur connecté et les afficher
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        const token = await getToken();

        if (token) {
          if (user.id) {
            await getFavoritesEffect(user.id, token);
          } else {
            // console.log("id inconnu");
          }
        } else {
          console.error('Token not found');
        }
      };
      fetchData();
    }, [
      user,
    ]),
  );

  const removeFromFavorites = async (placeIdToDelete: string) => {
    if (placeIdToDelete !== undefined) {
      try {
        const token = await getToken();

        if (token) {
          const response = await axios.delete(
            `${Constants.expoConfig.extra.api}/favorites/delete/${placeIdToDelete}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          console.log('Response au delete -> ', response);

          if (response.status === 200) {
            console.log('Lieu supprimé des favoris avec succès');
            // Mise à jour de l'affichage après la suppression
          } else {
            console.error(
              'Erreur lors de la suppression du lieu des favoris LA ??',
            );
          }
        }
      } catch (error) {
        console.error(
          'Erreur lors de la suppression du lieu des favoris ICI ??: ',
          error,
        );
      }
    } else {
      console.log('placeIdToDelete = ', placeIdToDelete);
    }
  };

  // Supprimer un lieu en favoris de l'utilisateur
  const handleDeletePlace = async (placeId: string) => {
    console.log('Id de la place a delete -> ', placeId);

    if (journeyData.length < 2) {
      setNoFavoritesMessage();
    }

    if (placeId !== undefined) {
      removeFromFavorites(placeId);

      setJourneyData(prevJourney => {
        const newJourney = prevJourney.filter(place => place.id !== placeId);

        storeData(newJourney);
        // Appeler la fonction pour supprimer le lieu des favoris
        console.log(' -> ', newJourney);
        return newJourney;
      });
    } else {
      console.log('Aucune place ne correspond a cette ID !');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header avec le logo */}
      <View style={styles.header}>
        {/* <Image source={require('../../assets/favicon-BTT.png')} style={styles.logo} /> */}
      </View>

      {/* Logo à moitié dans le header et à moitié dans la carte */}
      <View style={styles.halfLogoContainer}>
        <Image
          source={require('../../assets/favicon-BTT.png')}
          style={styles.halfLogo}
        />
      </View>
      <View style={styles.triangle1}></View>
      <View style={styles.triangle2}></View>
      <View style={{height: height * 0.11}}></View>
      <View style={styles.container}>
        <View style={styles.placeContainer}>
          <Text style={styles.title}>Mes Favoris</Text>
          <ScrollView style={styles.scrollview}>
            {journeyMessage ? (
              <Text style={{textAlign: 'center'}}>{journeyMessage}</Text>
            ) : journeyData.length === 0 ? (
              <Text>Veuillez attendre que vos données se chargent...</Text>
            ) : (
              journeyData.map((place, index) => (
                <View key={index} style={styles.place}>
                  <Text>{place.name}</Text>
                  <Text
                    style={styles.deleteButton}
                    onPress={() => handleDeletePlace(place.id)}>
                    X
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.myJourneyContainer}>
          <Text style={styles.title}>Mes Itinéraires</Text>
          <ScrollView style={styles.scrollview}>
            <View style={styles.myjourney}>
              <Text>A la découverte des Châteaux de Loire.</Text>
            </View>
            <View style={styles.myjourney}>
              <Text>Aux sentiers perdus.</Text>
            </View>
            <View style={styles.myjourney}>
              <Text>J'ai plus d'idée inspirante.</Text>
            </View>
          </ScrollView>
        </View>

        <View style={styles.sponsoredjourneyContainer}>
          <Text style={styles.title}>Itinéraires recommandés</Text>
          <ScrollView style={styles.scrollview}>
            <View style={styles.sponsoredjourney}>
              <Text>Tournée des vins.</Text>
            </View>
            <View style={styles.sponsoredjourney}>
              <Text>J'ai plus d'idée inspirante.</Text>
            </View>
            <View style={styles.sponsoredjourney}>
              <Text>J'ai plus d'idée inspirante.</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'blanchedalmond',
  },
  header: {
    height: height * 0.092,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  halfLogoContainer: {
    position: 'absolute',
    zIndex: 1000,
    top: height * 0.032,
    left: width * 0.495,
    marginLeft: -width * 0.1275,
    width: width * 0.225,
    height: width * 0.225,
    backgroundColor: 'white',
    borderRadius: 75, // Pour avoir un cercle
    justifyContent: 'center',
    alignItems: 'center',
  },
  halfLogo: {
    width: width * 0.2,
    height: height * 0.1,
  },
  triangle1: {
    position: 'absolute',
    zIndex: 1000,
    top: height * 0.07615,
    left: width * 0.232,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 0,
    borderRightWidth: width * 0.129, // largeur
    borderBottomWidth: height * 0.073, // hauteur
    borderLeftWidth: 0,
    borderTopColor: 'transparent',
    borderRightColor: 'white',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    marginLeft: width * 0.013,
    marginRight: 50,
  },
  triangle2: {
    position: 'absolute',
    zIndex: 1000,
    top: height * 0.07615,
    left: width * 0.565,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: height * 0.073, // hauteur
    borderLeftWidth: width * 0.129, // largeur
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'white',
    marginLeft: width * 0.013,
    marginRight: 50,
  },
  placeContainer: {
    flex: 1,
    paddingBottom: width * 0.01,
  },
  myJourneyContainer: {
    flex: 1,
  },
  sponsoredjourneyContainer: {
    flex: 1,
  },
  place: {
    backgroundColor: 'white',
    padding: width * 0.03,
    margin: width * 0.009,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  deleteButton: {
    position: 'absolute',
    right: '5.75%',
    bottom: '27%',
    fontSize: height * 0.033,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 20,
    paddingBottom: width * 0.001,
  },
  myjourney: {
    backgroundColor: 'white',
    padding: width * 0.03,
    margin: width * 0.009,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  sponsoredjourney: {
    backgroundColor: 'white',
    padding: width * 0.03,
    margin: width * 0.009,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollview: {},
});

export default MyJourney;
