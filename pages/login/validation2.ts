import { Injectable } from '@nestjs/common';
import * as zxcvbn from 'zxcvbn';

@Injectable()
class ValidationService {

  /**
   * Vérifie si une adresse e-mail est valide en utilisant une expression régulière.
   * @param email - L'adresse e-mail à valider.
   * @returns Vrai si l'adresse e-mail est valide, sinon faux.
   */
  isEmailValid(email: string): boolean {
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Vérifie si un champ de texte est valide en fonction de certaines conditions.
   * @param value - La valeur du champ de texte à valider.
   * @returns Vrai si le champ de texte est valide, sinon faux.
   */
  isFieldValid(value: string): boolean {
    const minLength: number = 1;
    const hasNonAlphabetic: boolean = /[^a-zA-Z]/.test(value); 

    if (value === '' || value === undefined || value === null || typeof value !== 'string' || value.length < minLength || hasNonAlphabetic) {
      return false;
    }

    return true;
  }

   /**
   * Vérifie si un champ de pseudeo est valide en fonction de certaines conditions.
   * @param value - La valeur du champ de texte à valider.
   * @returns Vrai si le champ de texte est valide, sinon faux.
   */
  isPseudeoValid(value: string): boolean {
    const minLength: number = 1;
    const pseudeoAccepted: boolean = /^[^\s](?=.*[a-zA-Z]).*[^\s]$/.test(value); 
    // Regex, pas d'espace au début, toute est possible chiffre, lettre, charavtères spéciaux, symboles, espace. Le dernier char ne doit pas être un espace.
    if (value === '' || value === undefined || value === null || typeof value !== 'string' || value.length < minLength || !pseudeoAccepted) {
      return false;
    }

    return true;
  }

  /**
   * Vérifie si un mot de passe est valide en utilisant plusieurs critères.
   * @param password - Le mot de passe à valider.
   * @returns Vrai si le mot de passe est valide, sinon faux.
   */
  isPasswordValid(password: string): boolean {
    if(!password){
      return false;
    }

    if(typeof password !== "string"){
      return false;
    }

    if(password === ""){
      return false;
    }

    if (password.length < 8) {
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      return false;
    }

    if (!/\d/.test(password)) {
      return false;
    }

    if (!/[@#$%^!&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password)) {
      return false;
    }
    
    return true;
  }

  /**
   * Récupère une liste d'erreurs potentielles pour un mot de passe.
   * @param password - Le mot de passe à vérifier.
   * @returns Un tableau de messages d'erreur pour le mot de passe.
   */
  getPasswordErrors(password: string): string[] {
    const errors: string[] = [];

    if (password === undefined || password === null) {
      errors.push("doit être renseigné");
      return errors;
    }

    if (typeof password !== "string") {
        errors.push("doit être une chaîne de caractères");
        return errors;
    }

    if (password === "") {
        errors.push("ne doit pas être vide");
        return errors;
    }

    if (password.length < 8) {
      errors.push("doit avoir au moins 8 caractères");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("doit contenir au moins une majuscule");
    }

    if (!/\d/.test(password)) {
      errors.push("doit contenir au moins un chiffre");
    }

    if (!/[@#$%^!&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password)) {
      errors.push("doit contenir au moins un symbole");
    }
    
    return errors;
  }


  checkPasswordStrength(password: string): zxcvbn.ZXCVBNResult {
    const result: zxcvbn.ZXCVBNResult = zxcvbn(password);
  
    const commonPatterns = /(password|123456|qwerty|abc123)/i;
    const containsCommonPatterns = commonPatterns.test(password);
  
    const sequentialLetters = /(abcdefghijklmnopqrstuvwxyz)|(zyxwvutsrqponmlkjihgfedcba)/i;
    const containsSequentialLetters = sequentialLetters.test(password);
  
    const sequentialNumbers = /(123456789|987654321)/;
    const containsSequentialNumbers = sequentialNumbers.test(password);
  
    if (!containsCommonPatterns && !containsSequentialLetters && !containsSequentialNumbers) {
      result.score += 1;
    }
  
    return result;
  }
  
}
export { ValidationService };