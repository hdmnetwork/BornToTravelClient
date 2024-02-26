//client : loginPage
import React, {useEffect, useState} from 'react';
import * as zxcvbn from 'zxcvbn';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import axios, {AxiosError} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {Ionicons} from '@expo/vector-icons';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import {ButtonSolid} from 'react-native-ui-buttons';
import {UserTokenString} from '../../types/key';
import { useAuth } from './../../AuthContext'
// Import de ValidationService dans loginPage.tsx

// Reste du code de votre loginPage.tsx





type StorageKey = 'user' | typeof UserTokenString;

type RegistrationResponse = {
  email: string;
  firstname: string | null;
  id: string;
  isElectricCar: boolean;
  lastname: string | null;
  pseudo: string;
};

/**
 Fonction pour stocker des données dans AsyncStorage
 */
const storeData = async (
  key: StorageKey,
  value: string | RegistrationResponse,
) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    // Récupérer l'erreur de sauvegarde
    console.error('Error reading value from AsyncStorage:', e);
  }
};

const storeUser = (data: RegistrationResponse) => {
  return storeData('user', data);
};

const storeToken = (token: string) => {
  return storeData(UserTokenString, token);
};

const LoginPage = ({navigation}) => {
  // États pour la page de connexion/inscription
  const [isLogin, setIsLogin] = useState(true);
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [isElectricCar, setIsElectricCar] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hidePassword, setHidePassword] = useState(true);
  const [pseudoError, setPseudoError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  //const validationService = new ValidationService();

  const checkPasswordStrength = (password) => {
    if (
      !password ||
      typeof password !== "string" ||
      password === "" ||
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[@#$%^!&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password)
    ) {
      const hasLowerCase = /[a-z]/.test(password);  // Lowercase letter
      const hasUpperCase = /[A-Z]/.test(password);  // Uppercase letter
      const hasDigit = /\d/.test(password);          // Digit
      const hasSpecialChar = /[@#$%^!&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password);
      const criteriaCount = [hasLowerCase, hasUpperCase, hasDigit, hasSpecialChar].filter(Boolean).length;
      if (criteriaCount >= 2) {
        setPasswordStrength('Moyen');
      } else {
        setPasswordStrength('Faible');
      }
      return false; // Fix: Return false when the password does not meet the criteria
    }
  
    // Count the number of criteria met
    const hasLowerCase = /[a-z]/.test(password);  // Lowercase letter
    const hasUpperCase = /[A-Z]/.test(password);  // Uppercase letter
    const hasDigit = /\d/.test(password);          // Digit
    const hasSpecialChar = /[@#$%^!&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password);
    const criteriaCount = [hasLowerCase, hasUpperCase, hasDigit, hasSpecialChar].filter(Boolean).length;
  
    // Set password strength based on the number of criteria met
    if (criteriaCount === 4) {
      setPasswordStrength('Fort');
    } else if (criteriaCount >= 2) {
      setPasswordStrength('Moyen');
    } else {
      setPasswordStrength('Faible');
    }
  
    return true;
  };
  
  
  
  
  
  
  

  const handlePasswordChange = (password) => {
    setPassword(password);
    checkPasswordStrength(password);
  };
  // États pour gérer le mot de passe oublié
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetMail, setResetMail] = useState('');
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [modalErrorMessage, setModalErrorMessage] = useState('');
  const [verificationCodeErrorMessage, setVerificationCodeErrorMessage] =
    useState('');
  const [timer, setTimer] = useState(30);
  const [isResendButtonDisabled, setIsResendButtonDisabled] = useState(true);
  const [showResendPassword, setShowResendPassword] = useState(false);

  /**
   Fonction pour gérer le timer avant renvoi de nouveau code
   */
  const startTimer = () => {
    // Définir le timer a 30
    setTimer(10);
    // Désactiver le bouton
    setIsResendButtonDisabled(true);

    /**
     Mettre à jour le timer à chaque seconde
     */
    const intervalId = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer === 1) {
          clearInterval(intervalId);
          setIsResendButtonDisabled(false);
          setShowResendPassword(true);
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  // Lancer la méthode startTimer() si le modal isResetPassword est affiché
  useEffect(() => {
    if (isResetPassword) {
      startTimer();
    }
  }, [isResetPassword]);

  /**
   Fonction pour basculer entre la connexion et l'inscription
   */
  const toggleLogin = () => setIsLogin(!isLogin);

  const validatePseudo = (pseudo: string) => {
    if (pseudo.trim().length < 1) {
      //TODO - NO spaces allowed anywhere inside it either on profile page update
      //TODO - NO numbers allowed anywhere inside it either on profile page update
      //TODO - NO symbols allowed anywhere inside it either on profile page update
      setPseudoError(
        "Le nom d'utilisateur doit comporter au moins un caractère.",
      );
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
      return false;
    }
    setPseudoError('');
    return true;
  };

  //TODO - should either require firstName & lastName on registration or allow profile modification without them

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Format d'adresse e-mail invalide.");
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
      return false;
    }
    setErrorMessage('');
    return true;
  };

  const validatePassword = (password: string) => {
    //TODO - require lowercase char
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[@!#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);

    if (
      password.trim().length < 8 ||
      !hasUpperCase ||
      !hasNumber ||
      !hasSymbol
    ) {
      setPasswordError(
        'Le mot de passe doit avoir au moins 8 caractères, 1 majuscule, 1 chiffre et 1 symbole.',
      );
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
      return false;
    }
    setPasswordError('');
    return true;
  };

  type AccessToken = {access_token: string};

  /** Fonction pour gérer la connexion */
  const handleLogin = async () => {
    try {
      const response = await axios.post<AccessToken>(
        `${Constants.expoConfig.extra.api}/auth/login`,
        {email: email.trim(), password: password.trim()},
      );

      // Stocker l'utilisateur et ses informations dans AsyncStorage
      storeToken(response.data.access_token);
      //login(response.data.access_token);  

      // Rediriger l'utilisateur vers la page d'accueil
      navigation.replace('Home');
    } catch (error: AxiosError) {
      console.info('error : ', error); //TODO - AxiosError: Network Error
      console.info('error.response : ', error.response); //TODO - undefined
      // Gérer l'échec de la connexion (email ou mot de passe incorrect)
      setErrorMessage('Mauvais mail ou mot de passe');
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
      console.error('Erreur lors de la connexion :', error);
    }
  };

  /**
   Fonction pour gérer l'inscription
   */
   const handleRegister = () => {
    const userData = {
      pseudo: pseudo.trim(),
      email: email.trim(),
      password: password.trim(),
      isElectricCar: isElectricCar,
    };
  
    console.log('USER DATAS -> ', userData);
  
    console.log('PSEUDO VALIDE?', validatePseudo(pseudo.trim()));
    console.log('EMAIL VALIDE?', validateEmail(email.trim()));
  
    if (
      !validatePseudo(pseudo.trim()) ||
      !validateEmail(email.trim()) ||
      !checkPasswordStrength(password.trim())
    ) {
      console.log('Validation failed. Aborting registration.');
      return;
    }
  
    console.log('Validation passed. Proceeding with registration.');
  
    axios
      .post<RegistrationResponse>(
        `${Constants.expoConfig.extra.api}/users`,
        userData,
      )
      .then(response => {
        console.log('Registration successful:', response);
  
        // Store user data in AsyncStorage
        storeUser(response.data);
  
        // Display success message and redirect after a delay
        setSuccessMessage(
          'Your account has been successfully created! You can now log in!',
        );
        setTimeout(() => {
          navigation.replace('Login');
        }, 3000);
      })
      .catch((error: AxiosError) => {
        // Handle registration errors
        console.error('Error during registration:', error);
  
        if (error.response && error.response.status === 409) {
          setErrorMessage('This email address is already in use.');
        } else if (error.response && error.response.status === 400) {
          setErrorMessage('Invalid email address format.');
        } else {
          setErrorMessage('Error creating user.');
        }
  
        setTimeout(() => {
          setErrorMessage('');
        }, 5000);
      });
  };
  
  /**
   Fonction pour renvoyer un mail de réinitialisation de mdp s'il ne l'a pas reçu (ou est débile)
   */
  const resendResetMail = async () => {
    try {
      /**
       Envoyer l'adresse e-mail au backend pour obtenir un code de vérification
       */
      const response = await axios.post<{email: string}>(
        `${Constants.expoConfig.extra.api}/auth/forgot-password`,
        {email: resetMail.trim()},
      );
      console.log('Mail envoyé à nouveau ! ');
      startTimer();
      setIsResendButtonDisabled(true);
    } catch (error) {
      // Gérer les erreurs, par exemple si l'adresse e-mail n'existe pas
      if (error) {
        setModalErrorMessage(error.response.data.message);
      }
    }
  };

  /**
   Fonction pour gérer l'envoi de mail pour la réinitialisation du mot de passe
   */
  const handleForgotPassword = async () => {
    try {
      /**
       Envoyer l'adresse e-mail au backend pour obtenir un code de vérification
       */
      const response = await axios.post<{email: string}>(
        `${Constants.expoConfig.extra.api}/auth/forgot-password`,
        {email: resetMail.trim()},
      );
      setShowForgotPassword(false); // Masquer le formulaire de réinitialisation
      setIsResetPassword(true); // Activer le modal de réinitialisation du mot de passe
    } catch (error) {
      // Gérer les erreurs, par exemple si l'adresse e-mail n'existe pas
      if (error) {
        setModalErrorMessage(error.response.data.message);
        console.log('MAUVAIS MAIL -> ', error.response.data.message);
      }
    }
  };

  /**
   Fonction pour mettre à jour le nouveau mot de passe si le code de vérification est correct.
   */
  const handleResetPassword = async () => {
    try {
      /**
       Envoyer l'adresse e-mail au backend pour obtenir un code de vérification
       */
      const response = await axios.post(
        `${Constants.expoConfig.extra.api}/auth/reset-password`,
        {token: verificationCode, newPassword: newPassword},
      );

      // Afficher un message de succès et passer à l'étape de réinitialisation du mot de passe
      setSuccessMessage(
        'Votre mot de passe a été correctement réinitialisé, vous pouvez vous connecter',
      );
      setIsResetPassword(false);
      // Timer pour faire disparaitre le message de succès après 3s
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      // Gérer les erreurs, par exemple si l'adresse e-mail n'existe pas
      if (error) setVerificationCodeErrorMessage(error.response.data.message);
      console.log('Error !', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flexDirection: 'column' }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.header}>
          <Image source={require('../../assets/favicon-BTT.png')} style={styles.logo} />
          <Text style={styles.headerTitle}>BornToTravel</Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={styles.heading}>
            {isLogin ? 'Prêt.e pour un nouveau voyage ? ' : 'Bienvenue !'}
          </Text>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nom d'utilisateur :</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={pseudo}
                  onChangeText={setPseudo}
                  style={styles.input}
                  placeholder="Nom d'utilisateur"
                />
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email :</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholder="Email"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mot de passe :</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                value={password}
                onChangeText={(text) => {
                  handlePasswordChange(text);
                  checkPasswordStrength(text);
                }}
                style={[styles.input, { marginRight: 40 }]}
                placeholder="Mot de passe"
                secureTextEntry={hidePassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setHidePassword(!hidePassword)}
              >
                <Ionicons
                  name={hidePassword ? 'md-eye-off' : 'md-eye'}
                  size={32}
                  color="black"
                />
              </TouchableOpacity>
            </View>

            {!isLogin && passwordStrength !== '' && (
              <View
                style={[
                  styles2.passwordStrength,
                  {
                    backgroundColor: (() => {
                      if (passwordStrength === 'Fort') {
                        return 'green';
                      } else if (passwordStrength === 'Moyen') {
                        return 'orange';
                      } else {
                        return 'red';
                      }
                    })(),
                  },
                ]}
              >
                <Text style={styles2.passwordStrengthText}>
                  Niveau de sécurité : {passwordStrength}
                </Text>
              </View>
            )}

            {isLogin && errorMessage !== '' && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
          </View>



<View>
  <TouchableOpacity onPress={() => setShowForgotPassword(true)}>
    <Text>Mot de passe oublié ?</Text>
  </TouchableOpacity>

  {showForgotPassword && (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showForgotPassword}
      onRequestClose={() => {
        setShowForgotPassword(false);
      }}
    >
      <View style={[styles.modalContainer, {}]}>
        <ScrollView
          style={[
            styles.modalContent,
            {
              flex: 1,
              flexGrow: 1,
            },
          ]}
          contentContainerStyle={[
            {
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <View
            style={[
              {
                justifyContent: 'space-evenly',
                flex: 1,
              },
            ]}
          >
            <Text style={[styles.labelModal, {}]}>
              Veuillez entrer une adresse mail valide
            </Text>
            <View
              style={[
                {
                  backgroundColor: 'white',
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#ccc',
                  borderRadius: 5,
                  marginBottom: 10,
                  flex: 1,
                },
                {},
              ]}
            >
              <TextInput
                style={[
                  styles.inputWithIcon,
                  {
                    fontSize: height * 0.025,
                  },
                ]}
                placeholder="Mail"
                value={resetMail}
                onChangeText={setResetMail}
              />
            </View>
            <View style={[{ flex: 2 }]}>
              <Text style={[styles.errorText, {}]}>
                {modalErrorMessage}
              </Text>
            </View>
            <View
              style={[
                styles.buttonRow,
                {
                  flex: 1,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.customButton,
                  {
                    flex: 1,
                    justifyContent: 'center',
                    marginRight: '5%',
                  },
                ]}
                onPress={() => setShowForgotPassword(false)}
              >
                <Text style={[styles.buttonText, {}]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.customButton,
                  {
                    flex: 1,
                    justifyContent: 'center',
                  },
                ]}
                onPress={handleForgotPassword}
              >
                <Text style={[styles.buttonText, {}]}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )}

  {isResetPassword && (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isResetPassword}
      onRequestClose={() => {
        setIsResetPassword(false);
      }}
    >
      <View style={[styles.modalContainer, {}]}>
        <ScrollView
          style={[
            styles.modalContent,
            { minHeight: '90%', maxHeight: '100%' },
          ]}
          contentContainerStyle={{}}
        >
          <Text style={styles.labelModal}>
            Veuillez entrer le code de vérification envoyé à {resetMail}{' '}
          </Text>
          <View
            style={{
              backgroundColor: 'white',
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 5,
              marginBottom: 10,
            }}
          >
            <TextInput
              style={[styles.inputWithIcon]}
              placeholder="Code de verification"
              value={verificationCode}
              onChangeText={setVerificationCode}
            />
          </View>

          <Text style={styles.labelModal}>
            Nouveau mot de passe:{' '}
          </Text>
          <View
            style={{
              backgroundColor: 'white',
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 5,
              marginBottom: 10,
            }}
          >
            <TextInput
              style={[styles.inputWithIcon]}
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          {isResendButtonDisabled ? (
            <Text
              style={{
                color: 'white',
                fontSize: 14,
                textAlign: 'center',
              }}
            >
              Pas reçu ? Réessayez dans {timer} seconde
              {timer > 1 ? 's' : ''}
            </Text>
          ) : (
            <View style={styles.test}>
              <Text style={styles.labelModal}>Pas reçu ? </Text>
              <ButtonSolid
                title="Renvoyer un code"
                useColor={'transparent'}
                textStyle={styles.labelModal}
                textColor={'white'}
                onPress={resendResetMail}
              />
            </View>
          )}

          <View>
            <Text style={styles.errorText}>
              {verificationCodeErrorMessage}
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.customButton, { marginRight: 40 }]}
              onPress={() => setIsResetPassword(false)}
            >
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.customButton}
              onPress={handleResetPassword}
            >
              <Text style={styles.buttonText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )}
</View>

          </View>
          {!isLogin && (
            <View style={styles.checkBoxContainer}>
              <Text style={styles.label}></Text>
              <View>
                <Text style={styles.label}>
                  Propriétaire d'un véhicule électrique ?{' '}
                  <BouncyCheckbox
                    fillColor="green"
                    innerIconStyle={{borderColor: 'blue'}}
                    style={styles.checkBox}
                    // status={isElectricCar ? 'checked' : 'unchecked'}
                    onPress={() => setIsElectricCar(!isElectricCar)}
                  />
                </Text>
              </View>
            </View>
          )}
          <View style={styles.successMessage}>
            {successMessage !== '' && (
              <Text style={styles.successMessage}>{successMessage}</Text>
            )}
          </View>
          <View style={styles.errorContainer}>
            {errorMessage !== '' && (
              <Text style={styles.errorText}>{errorMessage}</Text>
            )}
          </View>
          {/* Display Pseudo Error */}
          {!isLogin && pseudoError !== '' && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{pseudoError}</Text>
            </View>
          )}

          {/* Display Password Error */}
          {passwordError !== '' && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{passwordError}</Text>
            </View>
          )}
        

        <View
          style={[
            styles.buttonRow,
            {
              flexDirection: 'row',
              justifyContent: 'center',
              alignContent: 'center',
            },
            {},
          ]}>
          <TouchableOpacity
            style={[
              styles.customButton,
              {
                minWidth: '30%',
              },
              {marginRight: '5%'},
            ]}
            onPress={isLogin ? handleLogin : handleRegister}>
            <Text style={[styles.buttonText, {}]}>
              {isLogin ? 'Se connecter' : "S'inscrire"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.customButton,
              {
                minWidth: '30%',
              },
            ]}
            onPress={toggleLogin}>
            <Text style={[styles.buttonText, {}]}>
              {isLogin ? "S'inscrire" : 'Se connecter'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const {width, height} = Dimensions.get('window');

const styles = StyleSheet.create({
  inputWithIcon: {
    flex: 1,
  },
  test: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    // position: 'absolute',
    // top: 0,
    // left: 0,
    // right: 0,
    // zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: height * 0.02,
    backgroundColor: 'white',
    paddingVertical: height * 0.01,
    // width: '100%',
  },

  logo: {
    width: width * 0.25,
    height: width * 0.25,
    marginRight: width * 0.02,
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flexGrow: 1,
  },
  container: {
    // paddingTop: width * 0.06,
    // paddingTop: height * 0.182,
    // flex: 1,
    flexGrow: 1,
    // justifyContent: 'center',
    backgroundColor: 'blanchedalmond',
    // alignItems: 'center',
    // justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: height * 0.02,
    textAlign: 'center',
    paddingBottom: height * 0.06,
    marginTop: height * 0.05,
  },
  inputContainer: {
    paddingHorizontal: width * 0.1,
    marginBottom: height * 0.01,
  },
  label: {
    fontSize: 16,
    marginBottom: height * 0.01,
  },
  input: {
    padding: width * 0.02,
    borderRadius: 5,
    flex: 1,
    backgroundColor: 'white',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: 'white',
  },

  checkBoxContainer: {
    paddingHorizontal: width * 0.1,
    flexDirection: 'row',
    marginBottom: 16,
  },
  checkBox: {
    marginRight: 8,
  },

  buttonContainer: {
    marginTop: 10,
  },
  toggleButtonContainer: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    // fontSize: 16,
    fontSize: width * 0.04,
    textAlign: 'center',
    // marginTop: height * 0.01,
    // marginBottom: height * 0.01,
    marginVertical: height * 0.001,
  },
  successMessage: {
    color: 'green',
    fontSize: 16,
    textAlign: 'center',
    marginTop: height * 0.01,
    marginBottom: height * 0.01,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: height * 0.0004,
  },
  eyeIcon: {
    position: 'absolute',
    right: width * 0.025,
  },
  customButton: {
    backgroundColor: 'darkorange',
    // padding: width * 0.02,
    padding: width * 0.025,
    borderRadius: 30,
    alignItems: 'center',
    // marginTop: height * 0.01,
    // marginTop: width * 0.01,
    // height: height * 0.06,
    // width: width * 0.38,
    minWidth: width * 0.2,
    marginEnd: '9%',
  },
  buttonText: {
    color: 'black',
    // fontSize: 20,
    fontSize: width * 0.03,
    textAlign: 'center',
  },
  buttonRow: {
    // paddingTop: height * 0.09,
    // paddingTop: width * 0.03,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
    alignItems: 'center',
    paddingVertical: 5,
  },
  modalContainer: {
    // flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    // marginVertical: height * 0.02,

    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    width: '95%',
    marginVertical: height * 0.02,
  },
  modalContent: {
    width: '95%',
    // height: height * 0.4,
    // paddingLeft: '2%',
    // paddingRight: '2%',
    paddingHorizontal: '2%',
    backgroundColor: 'midnightblue',
    borderRadius: 10,
    // alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flex: 1,
    flexGrow: 1,
  },
  labelModal: {
    // fontSize: width * 0.04,
    fontSize: 14,
    // marginBottom: 5,
    marginBottom: height * 0.01,
    color: 'white',
    // paddingTop: 20,
    paddingTop: height * 0.02,
    // flex: 1,
    textAlign: 'center',
  },
});
// EStyleSheet.build();

const styles2 = StyleSheet.create({
  // ... (your existing styles)

  passwordStrength: {
    marginTop: 5,
    alignItems: 'center',
  },
  passwordStrengthText: {
    fontSize: 14,
    color: 'black',
  },
});

export default LoginPage;
