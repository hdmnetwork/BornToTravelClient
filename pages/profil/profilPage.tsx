//client : profilPage.tsx
import React, {useEffect, useState} from 'react';
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import Constants from 'expo-constants';
import jwtDecode from 'jwt-decode';
// import {Checkbox} from 'react-native-paper';
import BouncyCheckbox from 'react-native-bouncy-checkbox';

import {getToken} from '../../utils/get-token';
import {User} from '../../types/user';
import { UserTokenString } from '../../types/key';

function ProfilPage() {
  const [user, setUser] = useState({
    id: '', // Remplacé par l'id correct lors de la récupération des infos de l'user connecté
    pseudo: '',
    firstname: '',
    lastname: '',
    email: '',
    token: '',
    isElectricCar: false,
  });
  const navigation = useNavigation();

  // États pour gérer la fenêtre contextuelle de réinitialisation du mot de passe, les mots de passe, messages de succès, etc.

  const [showPasswordResetPopup, setShowPasswordResetPopup] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [hideOldPassword, setHideOldPassword] = useState(true);
  const [hideNewPassword, setHideNewPassword] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordResetMessage, setPasswordResetMessage] = useState('');
  const [messageColor, setMessageColor] = useState('red');

  
    useEffect(() => {
      const fetchData = async () => {
        const token = await getToken();
  
        if (token) {
          try {
            const userData = await fetchUserDataFromServer(token);
  
            if (userData) {
              setUser((prevUser) => ({
                ...prevUser,
                ...userData,
                token,
              }));
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
      };
  
      fetchData();
    }, []);
  
    
  
    const fetchUserDataFromServer = async (token: string) => {
      console.log("UUUUUUUUUUUUUUUUUUUUUU");
      try {
        const response = await axios.post(
          `${Constants.expoConfig.extra.api}/auth/decode`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
    
        console.log('Decoded User Data:', response.data);
    
        return response.data;
      } catch (error) {
        console.error('Error fetching user data from server:', error);
        return null;
      }
    };
    

  type UserWithoutToken = {
    id: string;
    pseudo: string;
    firstname: string;
    lastname: string;
    email: string;
    isElectricCar: boolean;
  };

  type UpdatableField = string | boolean;

  /**
 Fonction pour gérer la mise à jour des informations de profil de l'utilisateur
 */
  const handleUpdateProfile = async () => {
    try {
      /**
 Exclure le token de user
 */
      const {token, ...userData} = user;
      /**
 Récupérer les informations utilisateur d'origine depuis l'API
 */
      const originalUser = await axios.get<UserWithoutToken>(
        `${Constants.expoConfig.extra.api}/users/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      /**
 Liste pour stocker les champs modifiés dans le profil
 */
      const modifiedFields: UpdatableField[] = [];

      // Vérifier et ajouter les champs modifiés a la liste
      if (originalUser.data.pseudo !== userData.pseudo) {
        modifiedFields.push('pseudo');
      }

      if (originalUser.data.firstname !== userData.firstname) {
        modifiedFields.push('prénom');
      }

      if (originalUser.data.lastname !== userData.lastname) {
        modifiedFields.push('nom');
      }

      if (originalUser.data.email !== userData.email) {
        modifiedFields.push('email');
      }

      if (originalUser.data.isElectricCar !== userData.isElectricCar) {
        modifiedFields.push('Propriétaire VE');
      }

      // Effectuer l'appel API pour mettre à jour le profil si des champs ont changé
      if (modifiedFields.length > 0) {
        const response = await axios.put<UserWithoutToken>(
          `${Constants.expoConfig.extra.api}/users/${user.id}`,
          userData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        // Afficher un message de succès et définir la couleur du message
        setSuccessMessage(
          `Les champs ${modifiedFields.join(', ')} ont été modifiés`,
        );
        setMessageColor('green');
      } else {
        // Aucun champ n'a été modifié ; afficher un message d'erreur
        setSuccessMessage("Aucune information n'a été modifiée");
        setMessageColor('red');
      }

      // Faire disparaître le message après 5s
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      // Gérer les erreurs liées à la mise à jour du profil
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        // Gérer les erreurs liées à la mise à jour du profil

        // Vérification du statusCode retourné par le serveur et affichage du message de succès/erreur
        if (error.response.data.statusCode === 400) {
          setSuccessMessage(error.response.data.message);
          setMessageColor('red');
        } else if (error.response.status === 200) {
          setSuccessMessage(error.response.data.message);
          setMessageColor('green');
        }
      } else {
        setSuccessMessage(
          "Une erreur s'est produite lors de la mise à jour du profil.",
        );
        setMessageColor('red');
      }
    }

    // Faire disparaitre le message après 5s
    setTimeout(() => {
      setSuccessMessage('');
    }, 5000);
  };

  /**
 Fonction pour supprimer le compte sur lequel on est connecté
 */
  const handleDeleteAccount = () => {
    // Affichage d'un pop-up d'alerte
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer votre compte ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'OUI',
          onPress: async () => {
            try {
              /**
 Récupère le token depuis l'utilisateur
 */
              const token = user.token;
              /**
 Suppression du compte en base de données
 */
              const response = await axios.delete(
                `${Constants.expoConfig.extra.api}/users/${user.id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              // Redirection vers la page de login
              navigation.navigate('Login');

              Alert.alert(
                'Compte supprimé',
                'Votre compte a été supprimé avec succès. À bientôt !',
                [{text: 'OK', onPress: () => navigation.navigate('Login')}],
              );
            } catch (error) {
              console.error(error);
            }
          },
        },
      ],
    );
  };

  /**
 Fonction pour se déconnecter
 */
  const handleLogOut = async () => {
    // Enlever le token du async storage
    await AsyncStorage.removeItem(UserTokenString);
    // Redirection vers la page login
    navigation.navigate('Login');
  };

  /**
 Fonction pour gérer la réinitialisation du mot de passe de l'utilisateur
 */
  const handlePasswordReset = async () => {
    try {
      /**
 Mise à jour du mot de passe
 */
      const response = await axios.put<{message: string}>(
        `${Constants.expoConfig.extra.api}/users/change-password/${user.id}`,
        {
          oldPassword: oldPassword.trim(),
          newPassword: newPassword.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      //TODO - passed with ...........2.....A.... (no lowercase char)

      // Vérifier la présence du message de succès dans la réponse.
      if (response.data.message === 'Mot de passe modifié avec succès') {
        // Afficher un message de succès et définir la couleur du message
        setPasswordResetMessage(
          'Votre mot de passe a été modifié avec succès.',
        );
        setMessageColor('green');
      } else {
        // Afficher un message d'erreur si la modification du mot de passe a échoué
        console.log('API Response:', response.data);
        setPasswordResetMessage(
          'Erreur lors de la modification du mot de passe.',
        );
        setMessageColor('red');
      }
    } catch (error) {
      // Gérer les erreurs liées à la réinitialisation du mot de passe
      console.error('Error resetting password:', error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        // Afficher un message si l'ancien mot de passe est incorrect
        if (error.response.data.message === 'Ancien mot de passe incorrect') {
          setPasswordResetMessage('Ancien mot de passe incorrect.');
          setMessageColor('red');
        } else if (
          error.response.data.message ===
          'Le mot de passe ne satisfait pas les critères de sécurité : ne doit pas être vide'
        ) {
          setPasswordResetMessage(
            'Le mot de passe ne satisfait pas les critères de sécurité : ne doit pas être vide',
          );
          setMessageColor('red');
        } else if (
          error.response.data.message ===
          'Le mot de passe ne satisfait pas les critères de sécurité : doit avoir au moins 8 caractères, doit contenir au moins une majuscule, doit contenir au moins un symbole'
        ) {
          setPasswordResetMessage(
            'Le mot de passe ne satisfait pas les critères de sécurité : doit avoir au moins 8 caractères, doit contenir au moins une majuscule, doit contenir au moins un symbole',
          );
          setMessageColor('red');
        } else if (
          error.response.data.message ===
          'Le mot de passe ne satisfait pas les critères de sécurité : doit contenir au moins une majuscule, doit contenir au moins un chiffre'
        ) {
          setPasswordResetMessage(
            'Le mot de passe ne satisfait pas les critères de sécurité : doit contenir au moins une majuscule, doit contenir au moins un chiffre',
          );
          setMessageColor('red');
        } else if (
          error.response.data.message ===
          'Le mot de passe ne satisfait pas les critères de sécurité : doit contenir au moins un chiffre'
        ) {
          setPasswordResetMessage(
            'Le mot de passe ne satisfait pas les critères de sécurité : doit contenir au moins un chiffre',
          );
          setMessageColor('red');
        } else if (
          error.response.data.message ===
          'Le mot de passe ne satisfait pas les critères de sécurité : doit contenir au moins un symbole'
        ) {
          setPasswordResetMessage(
            'Le mot de passe ne satisfait pas les critères de sécurité : doit contenir au moins un symbole',
          );
          setMessageColor('red');
        } else if (
          error.response.data.message ===
          'Le mot de passe ne satisfait pas les critères de sécurité : doit contenir au moins une majuscule'
        ) {
          setPasswordResetMessage(
            'Le mot de passe ne satisfait pas les critères de sécurité : doit contenir au moins une majuscule',
          );
          setMessageColor('red');
        } else {
          // Afficher un message d'erreur en cas d'erreur générique
          setPasswordResetMessage(error.response.data.message);
          setMessageColor('red');
        }
      } else {
        // Afficher un message d'erreur en cas d'erreur inattendue
        setPasswordResetMessage(
          'Erreur lors de la réinitialisation du mot de passe.',
        );
        setMessageColor('red');
      }
    }
    // Effacer le message après 3 secondes
    setTimeout(() => {
      setPasswordResetMessage('');
    }, 3000);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/favicon-BTT.png')}
          style={styles.logo}
        />
        <Text style={styles.headerTitle}>BornToTravel</Text>
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pseudo :</Text>
        <TextInput
          style={styles.input}
          placeholder="Pseudo :"
          value={user?.pseudo}
          onChangeText={newPseudo => setUser({...user, pseudo: newPseudo})}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nom :</Text>
        <TextInput
          style={styles.input}
          placeholder="Nom"
          value={user?.lastname}
          onChangeText={newLastname =>
            setUser(prevUser => ({...prevUser, lastname: newLastname}))
          }
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Prénom :</Text>
        <TextInput
          style={styles.input}
          placeholder="Prénom"
          value={user?.firstname}
          onChangeText={newFirstName =>
            setUser(prevUser => ({...prevUser, firstname: newFirstName}))
          }
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mail :</Text>
        <TextInput
          style={styles.input}
          placeholder="Mail"
          value={user?.email}
          onChangeText={newEmail =>
            setUser(prevUser => ({...prevUser, email: newEmail}))
          }
        />
      </View>

      {/* Ici !! */}
      <View style={styles.checkBoxContainer}>
        <Text style={styles.label}>Propriétaire d'un véhicule électrique </Text>
        <BouncyCheckbox
          style={styles.checkBox}
          fillColor="green"
          innerIconStyle={{borderColor: 'blue'}}
          isChecked={user.isElectricCar}
          // status={user.isElectricCar ? 'checked' : 'unchecked'}
          onPress={() => setUser({...user, isElectricCar: !user.isElectricCar})}
        />
      </View>

      {successMessage ? (
        <Text style={[styles.successMessage, {color: messageColor}]}>
          {successMessage}
        </Text>
      ) : null}
      {
        <View>
          <View style={styles.buttonRowContainer}>
            <TouchableOpacity
              style={[styles.customButtonContainer, {marginRight: 25}]}
              onPress={() => setShowPasswordResetPopup(true)}>
              <Text style={styles.buttonText}>
                Modifier mon mot de passe
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.customButtonContainer}
              onPress={handleUpdateProfile}>
              <Text style={styles.buttonText}>Modifier mon profil</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.buttonRowContainer}>
            <TouchableOpacity
              style={[styles.customButtonContainer, {marginRight: 25}]}
              onPress={handleDeleteAccount}>
              <Text style={styles.buttonText}>Supprimer mon compte</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.customButtonContainer}
              onPress={handleLogOut}>
              <Text style={styles.buttonText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      }

      {showPasswordResetPopup && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showPasswordResetPopup}
          onRequestClose={() => {
            setShowPasswordResetPopup(false);
          }}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.labelModal}>Ancien mot de passe</Text>
              <View
                style={{
                  backgroundColor: 'white',
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 5,
                  marginBottom: 10,
                }}>
                <TextInput
                  style={[styles.inputWithIcon, {flex: 1}]}
                  placeholder="Ancien mot de passe"
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry={hideOldPassword}
                />
                <TouchableOpacity
                  onPress={() => setHideOldPassword(!hideOldPassword)}>
                  <Ionicons
                    name={hideOldPassword ? 'md-eye-off' : 'md-eye'}
                    size={32}
                    color="black"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.labelModal}>Nouveau mot de passe</Text>
              <View
                style={{
                  backgroundColor: 'white',
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 5,
                  marginBottom: 10,
                }}>
                <TextInput
                  style={[styles.inputWithIcon, {flex: 1}]}
                  placeholder="Nouveau mot de passe"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={hideNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setHideNewPassword(!hideNewPassword)}>
                  <Ionicons
                    name={hideNewPassword ? 'md-eye-off' : 'md-eye'}
                    size={32}
                    color="black"
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={[styles.passwordResetMessage, {color: messageColor}]}>
                {passwordResetMessage}
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.customButton, {marginRight: 40}]}
                  onPress={() => setShowPasswordResetPopup(false)}>
                  <Text style={styles.buttonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.customButton}
                  onPress={handlePasswordReset}>
                  <Text style={styles.buttonText}>Valider</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
    backgroundColor: 'white',
    paddingVertical: height * 0.012,
  },
  checkBoxContainer: {
    paddingHorizontal: width * 0.05,
    flexDirection: 'row',
    marginBottom: 16,
    paddingTop: 5,
  },
  checkBox: {
    marginRight: 8,
  },

  logo: {
    width: width * 0.255,
    height: height * 0.122,
    marginRight: 10,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  container: {
    paddingTop: height * 0.182,
    padding: width * 0.05,
    backgroundColor: 'blanchedalmond',
    minHeight: '100%',
    flexGrow: 1,
  },

  inputContainer: {
    marginBottom: height * 0.012,
  },
  label: {
    fontSize: width * 0.04,
    marginBottom: 5,
  },
  labelModal: {
    fontSize: width * 0.04,
    marginBottom: 5,
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: width * 0.025,
    borderRadius: 5,
    flex: 1,
    backgroundColor: 'white',
  },
  inputWithIcon: {
    borderWidth: 0,
    padding: width * 0.025,
    borderRadius: 5,
    flex: 1,
  },
  successMessage: {
    color: 'green',
    textAlign: 'center',
    marginBottom: width * 0.012,
    fontSize:width*0.035
  },
  passwordContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  eyeIcon: {
    justifyContent: 'center',
    paddingHorizontal: width * 0.025,
  },
  buttonContainer: {
    marginTop: height * 0.012,
  },
  buttonRow: {
    paddingTop: height * 0.02,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'black',
    fontSize: width*0.033,
    // textAlignVertical: 'center',
    verticalAlign: 'middle',
    textAlign: 'center',
  },
  customButton: {
    backgroundColor: 'darkorange',
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
    height: height * 0.06,
    width: width * 0.3,
    marginRight: width * 0.01,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    height: height * 0.43,
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
  passwordResetMessage: {
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRowContainer: {
    paddingTop: height * 0.03,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customButtonContainer: {
    backgroundColor: 'darkorange',
    padding: height * 0.012,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.085,
    width: width * 0.4,
    marginRight: width * 0.01,
  },
});

export default ProfilPage;
