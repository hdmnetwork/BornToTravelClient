import React, {useEffect, useState} from 'react';
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, {Marker, PROVIDER_DEFAULT, UrlTile} from 'react-native-maps';
import axios, {AxiosError} from 'axios';
import {MaterialIcons} from '@expo/vector-icons';
import Constants from 'expo-constants';
import jwtDecode from 'jwt-decode';
import * as Location from 'expo-location';
import {PointOfInterest} from '../../types/point-of-interest';
import {getToken} from '../../utils/get-token';
import {getData} from '../../utils/get-data';
import {User} from '../../types/user';
import {useFocusEffect} from '@react-navigation/native';
import {MyJourneyString} from '../../types/key';

const HERITAGE_ICON_PATH = '../../assets/icones/heritage2.png';
const MUSEUM_ICON_PATH = '../../assets/icones/museum2.png';
const VIEWPOINT_ICON_PATH = '../../assets/icones/viewpoint2.png';
const ELECTRIC_CHARGE_ICON_PATH = '../../assets/icones/electric_charge2.png';

//TODO - test this further
const SCREEN_SIZE_BREAKPOINT = 700;

type Category =
  | 'Musée'
  | 'Patrimoine Exceptionnel'
  | 'Patrimoine Mondial'
  | 'Point de vue'
  | 'Office de tourisme'
  | 'Découverte et Divertissement'
  | 'Borne de recharge';



  const categoryColorMapping: Record<Category, string> = {
    'Musée': 'blue',
    'Patrimoine Exceptionnel': 'green',
    'Point de vue': 'red',
    'Borne de recharge': 'purple',
    // Add more categories and colors as needed
  };

const MapPage = () => {

  
  // États pour la page de la carte
  const [user, setUser] = useState({
    id: '',
    pseudo: '',
    firstname: '',
    lastname: '',
    email: '',
    token: '',
    isElectricCar: false,
  });

  const [selectedCategories, setSelectedCategories] = useState<Category[]>([
    'Musée',
    'Patrimoine Exceptionnel',
    'Point de vue',
    'Borne de recharge',
  ]);

  type Place = {
    adresse: string | null;
    categorie: string;
    categorieApi: Category;
    chargepoint: null | {
      amperage: string;
      chargementRapide: boolean;
      courant: string;
      nbBorne: number;
      puissance: string;
      voltage: string;
    };
    geolocalisation: {lat: number; lon: number} | null;
    localite: string;
    name: string;
    reference: string;
    telephone: string | null;
  };

  const latitudeDelta = 0.0922;
  const longitudeDelta = 0.0421;

  const [places, setPlaces] = useState<Place[]>([]);
  const [searchText, setSearchText] = useState('');
  const [location, setLocation] = useState<Location.LocationObject>(null);
  const [region, setRegion] = useState({
    latitude: location?.coords?.latitude || 50.467388,
    longitude: location?.coords?.longitude || 4.871985,
    latitudeDelta: latitudeDelta,
    longitudeDelta: longitudeDelta,
  });

  const [activityDetailVisible, setActivityDetailVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [myJourney, setMyJourney] = useState<PointOfInterest[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(10);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messageColor, setMessageColor] = useState<string | null>(null);

  // Demander l'autorisation de permission
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Recharger la map si la geolocalisation change
  useEffect(() => {
    if (location) {
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: latitudeDelta,
        longitudeDelta: longitudeDelta,
      });
    }
  }, [location]);

  /**
   Fonction pour autoriser ou refuser la demande de geolocalisation
   */
  const requestLocationPermission = async () => {
    let {status} = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission de géolocalisation refusée');
      setLocation(null);
      return;
    }

    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);
  };

  const getZoomLevel = (longitudeDelta: number) => {
    const angle = 360 / longitudeDelta;
    const zoomLevel = Math.round(Math.log(angle) / Math.LN2);
    return zoomLevel;
  };

  const getJourney = async () => {
    const journey: Promise<PointOfInterest[]> = getData(MyJourneyString);
    return journey;
  };

  // Récupérer les info de l'utilisateur connecté grâce a son token
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

          console.log('Decoded User Data in mapPage:', response.data);
  
        } catch (error) {
          console.error('Error fetching user data from server:', error);
        }
      } else {
        console.error('Token not found');
      }
    };
  
    fetchData();
  }, []);

  // Récupérer les lieux depuis l'API lors du chargement initial
  useEffect(() => {
    const fetchData = async () => {
      const token = await getToken();

      if (token) {
        axios
          .get<Place[]>(`${Constants.expoConfig.extra.api}/places`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then(response => {
            setPlaces(response.data);
          })
          .catch(error => {
            console.error('Erreur lors de la récupération des lieux:', error);
          });
      } else {
        console.error('Token not found');
      }
    };
    fetchData();
  }, []);

  // Test pour debug affichage places !!
  useEffect(() => {
    console.log(
      'Places après récupération api et tri (monuments only) -> ',
      places,
    );
  }, [places]);

  // Récupérer "MyJourney" depuis AsyncStorage lors du chargement initial
  useEffect(() => {
    const fetchMyJourney = async () => {
      const journey = await getJourney();
      if (journey) {
        setMyJourney(journey);
      }
    };

    fetchMyJourney();
  }, []);

  type NominatimPointOfInterest = {
    addresstype: string;
    boundingbox: [
      south_latitude: number,
      north_latitude: number,
      west_longitude: number,
      east_longitude: number,
    ];
    class: string;
    display_name: string;
    importance: number;
    lat: string;
    licence: string;
    lon: string;
    name: string;
    osm_id: number;
    osm_type: string;
    place_id: number;
    place_rank: number;
    type: string;
  };

  /**
   Fonction pour soumettre la recherche
   */
  const onSearchSubmit = () => {
    axios
      .get<NominatimPointOfInterest[]>(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchText}&limit=1`,
      )
      .then(response => {
        if (response.data && response.data.length > 0) {
          const lat = parseFloat(response.data[0].lat);
          const lon = parseFloat(response.data[0].lon);
          setRegion({
            latitude: lat,
            longitude: lon,
            latitudeDelta: latitudeDelta,
            longitudeDelta: longitudeDelta,
          });
        }
      })
      .catch(error => {
        console.info('geocoding error.response : ', error.response); //TODO - undefined
        //FIXME - AxiosError: Network Error //FIXME - when zooming in too much??; can no longer search on the map afterwards
        console.error('Error during geocoding:', error);
      });
  };

  /**
   Fonction pour basculer la sélection des catégories
   */
  const toggleCategorySelection = (category: Category) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(prevState =>
        prevState.filter(item => item !== category),
      );
    } else {
      setSelectedCategories(prevState => [...prevState, category]);
    }
  };

  /**
   Filtrer les lieux en fonction des catégories sélectionnées
   */
  const filteredPlaces = places.filter(place =>
    selectedCategories.includes(place.categorieApi),
  );

  /**
   Nom des différentes catégories
   */
  const categoryLabels: Record<
    Exclude<
      Category,
      | 'Patrimoine Mondial'
      | 'Office de tourisme'
      | 'Découverte et Divertissement'
    >,
    string
  > = {
    Musée: 'Musée',
    'Patrimoine Exceptionnel': 'Patrimoine',
    'Point de vue': 'Point vue',
    'Borne de recharge': 'Borne recharge',
  };

  const osmUrl = 'https://a.tile.openstreetmap.org/%7Bz%7D/%7Bx%7D/%7By%7D.png';

  const subCategoryIcons: Record<
    Exclude<
      Category,
      | 'Patrimoine Mondial'
      | 'Office de tourisme'
      | 'Découverte et Divertissement'
    >,
    ImageSourcePropType
  > & {
    ['default']: string;
  } = {
    Musée: require(MUSEUM_ICON_PATH),
    'Patrimoine Exceptionnel': require(HERITAGE_ICON_PATH),
    'Point de vue': require(VIEWPOINT_ICON_PATH),
    'Borne de recharge': require(ELECTRIC_CHARGE_ICON_PATH),
    default: require(VIEWPOINT_ICON_PATH),
  };

  const clearAddFavoriteMessage = async () => {
    setStatusMessage(null);
  };

  useFocusEffect(
    React.useCallback(() => {
      clearAddFavoriteMessage();
    }, []),
  );

  const clearAddFavoriteMessageDelay = async () => {
    setTimeout(() => {
      setStatusMessage(null);
    }, 3000);
  };

  /**
   //TODO - // Ici !! Modifier messages success/error (border...)
   */
  const handleAddPlace = async () => {
    if (selectedPlace) {
      const token = await getToken();

      if (token) {
        axios
          .post(
            `${Constants.expoConfig.extra.api}/favorites/add`,
            {reference: selectedPlace.reference},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )
          .then(response => {
            setStatusMessage('Le lieu a bien été ajouté à vos favoris');
            setMessageColor('white');
          })
          .catch(
            (
              error: AxiosError<{
                error: string;
                message: string;
                statusCode: number;
              }>,
            ) => {
              console.log("Erreur lors de l'ajout d'un lieu favori:", error);

              setStatusMessage('Le lieu est déjà dans vos favoris');
              setMessageColor('orange');
            },
          )
          .finally(() => {
            clearAddFavoriteMessageDelay();
          });
      } else {
        console.error('Token not found');
      }
    }
  };

  /**
   Fonction pour lancer un itinéraire via GoogleMap
   */
  const handleGo = () => {
    if (selectedPlace?.geolocalisation) {
      const lat = selectedPlace.geolocalisation[0];
      const lon = selectedPlace.geolocalisation[1];
      const label = encodeURIComponent(selectedPlace.name || 'My Place');
      const geoUrl = `geo:${lat},${lon}?q=${lat},${lon}(${label})`;
      const webUrl = `https://www.google.com/maps?q=${lat},${lon}(${label})&z=15`;

      const openUrl = (url: string) => {
        Linking.openURL(url).catch(err =>
          console.error('An error occurred', err),
        );
      };

      Linking.canOpenURL(geoUrl)
        .then(supported => {
          if (supported) {
            openUrl(geoUrl);
          } else {
            return Linking.canOpenURL(webUrl);
          }
        })
        .then(supported => {
          if (supported) {
            openUrl(webUrl);
          } else {
            console.log("Don't know how to open this URL.");
          }
        })
        .catch(err => console.error('An error occurred', err));
    }
  };

  const isLongOutOfBounds = (placeLon: number) =>
    placeLon < region.longitude - region.longitudeDelta ||
    region.longitude + region.longitudeDelta < placeLon;

  const isLatOutOfBounds = (placeLat: number) =>
    placeLat < region.latitude - region.latitudeDelta ||
    region.latitude + region.latitudeDelta < placeLat;

  return (
    <View style={styles.container}>
      {/* Header avec le logo */}
      <View style={styles.header}>
        {/*<Image source={require('../../assets/favicon-BTT.png')} style={styles.logo} />*/}
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

      {/* Carte */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_DEFAULT}
          region={region}
          onRegionChangeComplete={region => {
            const newZoomLevel = getZoomLevel(region.longitudeDelta);
            setZoomLevel(newZoomLevel);
          }}>
          <UrlTile urlTemplate={osmUrl} maximumZ={19} tileSize={256} />
          {location && (
            <Marker coordinate={location.coords} title="Votre position" />
          )}
          {/*
          //FIXME - lag on first load after logging in because of too much data at once and slow dragging afterwards
          */}
          {filteredPlaces.map(place => {
  return zoomLevel > 8 ? (
    <Marker
      key={place.reference}
      coordinate={{
        latitude: isLatOutOfBounds(place.geolocalisation.lat)
          ? place.geolocalisation.lon || place.geolocalisation[1]
          : place.geolocalisation.lat || place.geolocalisation[0],
        longitude: isLongOutOfBounds(place.geolocalisation.lon)
          ? place.geolocalisation.lat || place.geolocalisation[0]
          : place.geolocalisation.lon || place.geolocalisation[1],
      }}
      title={place.name}
      description={place.adresse}
      onPress={() => {
        setSelectedPlace(place);
        setActivityDetailVisible(true);
      }}
      style={{
        // Increase the size of the marker container
        width: 60,
        height: 60,
      }}
    >
        
      <Image
        source={
          subCategoryIcons[place.categorieApi] || subCategoryIcons.default
        }
        style={{
          width: 40,
          height: 40,
          tintColor: categoryColorMapping[place.categorieApi] || 'black',
        }}
      />
    </Marker>
  ) : null;
})}
        </MapView>
      </View>

      {/*
      //FIXME - 502 Bad Gateway sometimes
      */}
      {/* Barre de recherche sur la carte */}
      <View style={styles.searchContainerOnMap}>
        <View style={styles.searchInputContainer}>
          <TextInput
            placeholder="Recherche une ville"
            style={styles.searchBar}
            onChangeText={setSearchText}
            value={searchText}
          />
          <TouchableOpacity
            onPress={onSearchSubmit}
            style={styles.searchIconContainer}>
            <MaterialIcons name="search" size={25} color="black" />
          </TouchableOpacity>
        </View>

        {/* Icône pour ouvrir le modal des catégories */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.filterIconContainer}>
          <MaterialIcons name="filter-list" size={30} color="black" />
        </TouchableOpacity>
      </View>

      {/* Pop-up des catégories */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View>
              <Text
                style={{
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: 17,
                  textAlign: 'center',
                }}>
                Fais ton choix par catégorie
              </Text>
            </View>
            <View style={styles.modalIcone}>
              {Object.keys(subCategoryIcons).map((category: Category) => (
                <TouchableOpacity
                  key={category}
                  onPress={() => toggleCategorySelection(category)}
                  style={{
                    margin: width * 0.0025,
                    paddingLeft: 5,
                    alignItems: 'center',
                  }}>
                  <Image
                    source={
                      subCategoryIcons[category] || subCategoryIcons.default
                    }
                    style={{
                      width: selectedCategories.includes(category) ? 35 : 25,
                      height: selectedCategories.includes(category) ? 35 : 25,
                      tintColor: 'white',
                    }}
                  />
                  <Text style={{color: 'white', fontSize: 11}}>
                    {categoryLabels[category]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Fermer le modal */}
            <View>
              <TouchableOpacity
                style={styles.customButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {activityDetailVisible && (
        <View style={styles.popupContainer}>
          <TouchableOpacity
            style={styles.closeIcon}
            onPress={() => setActivityDetailVisible(false)}>
            <MaterialIcons name="close" size={25} color="white" />
          </TouchableOpacity>
          <Text style={styles.popupTitle}>Détails du lieu</Text>
          {selectedPlace?.name ? (
            <Text style={styles.popupinformationLabel}>
              <Text style={styles.popupLabel}>Nom: </Text> {selectedPlace.name}
            </Text>
          ) : null}
          {selectedPlace?.categorie ? (
            <Text style={styles.popupinformationLabel}>
              <Text style={styles.popupLabel}>Catégorie: </Text>{' '}
              {selectedPlace.categorie}
            </Text>
          ) : null}
          {selectedPlace?.categorie === 'borne de recharge' ? (
            <>
              {selectedPlace?.chargepoint?.amperage ? (
                <Text style={styles.popupinformationLabel}>
                  <Text style={styles.popupLabel}>Amperage: </Text>{' '}
                  {selectedPlace.chargepoint.amperage}
                </Text>
              ) : null}
              {selectedPlace?.chargepoint?.chargementRapide !== null && (
                <Text style={styles.popupinformationLabel}>
                  <Text style={styles.popupLabel}>Chargement Rapide: </Text>{' '}
                  {selectedPlace.chargepoint.chargementRapide ? 'Oui' : 'Non'}
                </Text>
              )}
              {selectedPlace?.chargepoint?.courant ? (
                <Text style={styles.popupinformationLabel}>
                  <Text style={styles.popupLabel}>Courant: </Text>{' '}
                  {selectedPlace.chargepoint.courant}
                </Text>
              ) : null}
              {selectedPlace?.chargepoint?.nbBorne ? (
                <Text style={styles.popupinformationLabel}>
                  <Text style={styles.popupLabel}>Nombre de borne: </Text>{' '}
                  {selectedPlace.chargepoint.nbBorne}
                </Text>
              ) : null}
              {selectedPlace?.chargepoint?.puissance ? (
                <Text style={styles.popupinformationLabel}>
                  <Text style={styles.popupLabel}>Puissance: </Text>{' '}
                  {selectedPlace.chargepoint.puissance}
                </Text>
              ) : null}
              {selectedPlace?.chargepoint?.voltage ? (
                <Text style={styles.popupinformationLabel}>
                  <Text style={styles.popupLabel}>Voltage: </Text>{' '}
                  {selectedPlace.chargepoint.voltage}
                </Text>
              ) : null}
            </>
          ) : (
            selectedPlace?.categorieApi && (
              <Text style={styles.popupinformationLabel}>
                <Text style={styles.popupLabel}>Sous-catégorie: </Text>{' '}
                {selectedPlace.categorieApi}
              </Text>
            )
          )}
          {selectedPlace?.adresse ? (
            <Text style={styles.popupinformationLabel}>
              <Text style={styles.popupLabel}>Adresse: </Text>{' '}
              {selectedPlace.adresse}
            </Text>
          ) : null}
          {selectedPlace?.localite ? (
            <Text style={styles.popupinformationLabel}>
              <Text style={styles.popupLabel}>Ville: </Text>{' '}
              {selectedPlace.localite}
            </Text>
          ) : null}
          {selectedPlace?.telephone ? (
            <Text style={styles.popupinformationLabel}>
              <Text style={styles.popupLabel}>Contact: </Text>{' '}
              {selectedPlace.telephone}
            </Text>
          ) : null}

          <View style={styles.popupbuttonRow}>
            <TouchableOpacity
              style={[styles.popupcustomButton, {marginRight: 40}]}
              onPress={handleAddPlace}>
              <Text style={styles.buttonText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.popupcustomButton}
              onPress={handleGo}>
              <Text style={styles.buttonText}>Go</Text>
            </TouchableOpacity>
          </View>

          {statusMessage ? (
            <Text
              style={{
                color: messageColor,
                textAlign: 'center',
                marginTop: 10,
              }}>
              {statusMessage}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const {width, height} = Dimensions.get('window');

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
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  halfLogo: {
    width: width * 0.2,
    height: height * 0.1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEE',
    padding: 10,
    elevation: 5,
  },
  searchBar: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 30,
  },
  searchIconContainer: {
    position: 'absolute',
    right: 5,
    padding: 10,
  },
  filterIconContainer: {
    marginLeft: 20,
  },
  mapContainer: {
    borderWidth: 4,
    borderColor: 'black',
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchContainerOnMap: {
    position: 'absolute',
    top: height * 0.2,
    left: 25,
    right: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'orange',
    borderRadius: 30,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#EEE',
    padding: 10,
    elevation: 5,
  },
  categoryButton: {
    padding: 10,
    borderRadius: 5,
  },
  categoryText: {
    fontSize: 12,
  },
  popupContainer: {
    position: 'absolute',
    //top: height < SCREEN_SIZE_BREAKPOINT ? '16%' : '45%',
    top: height * 0.63,
    left: '2%',
    right: '2%',
    backgroundColor: 'midnightblue',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeIcon: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  popupTitle: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
  },
  popupLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'white',
    width: '40%',
  },
  popupinformationLabel: {
    color: 'white',
    flexDirection: 'row',
    alignItems: 'center',
  },
  popupcustomButton: {
    flexDirection: 'row',
    backgroundColor: 'darkorange',
    padding: width * 0.01,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.05,
    width: '35%',
  },
  popupbuttonRow: {
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '95%',
    height: height * 0.3,
    padding: '5%',
    backgroundColor: 'midnightblue',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalIcone: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  buttonText: {
    color: 'black',
    fontSize: width * 0.022,
    // textAlignVertical: 'center',
    verticalAlign: 'middle',
    textAlign: 'center',
    // paddingBottom: 0,
  },
  customButton: {
    marginTop: '10%',
    backgroundColor: 'darkorange',
    // padding: width*0.05,
    paddingHorizontal: width * 0.09,
    paddingVertical: height * 0.01,
    borderRadius: width * 0.1,
    alignItems: 'center',
    // height: height * 0.06,
    // width: width * 0.3,
  },
});

export default MapPage;
