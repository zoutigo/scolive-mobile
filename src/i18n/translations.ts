export type Locale = "fr" | "en";

export const SUPPORTED_LOCALES: Locale[] = ["fr", "en"];

export const DEFAULT_LOCALE: Locale = "fr";

/**
 * Translation dictionaries, namespaced (e.g. "settings.language.title").
 * Keep `en` keys aligned with `fr` keys: useTranslation falls back fr -> key.
 */
export const translations: Record<Locale, Record<string, string>> = {
  fr: {
    "settings.language.title": "Langue de cet appareil",
    "settings.language.subtitle": "Choisissez la langue de l'application",
    "settings.language.hint":
      "La langue choisie est appliquée immédiatement et conservée sur cet appareil.",
    "settings.language.fr": "Français",
    "settings.language.en": "English",
    "settings.accountLanguage.title": "Langue du compte",
    "settings.accountLanguage.subtitle":
      "Cette langue est associée à votre compte",
    "settings.accountLanguage.hint":
      "Elle s'applique automatiquement à chaque connexion, sur n'importe quel appareil.",

    "login.tagline": "Votre école en temps réel.",
    "login.method.phone": "Connexion par téléphone",
    "login.method.email": "Connexion par email",
    "login.method.username": "Connexion par identifiant",
    "login.method.google": "Connexion Google",
    "login.fields.phone": "Numéro de téléphone",
    "login.fields.pin": "Code PIN",
    "login.fields.email": "Adresse email",
    "login.fields.password": "Mot de passe",
    "login.fields.username": "Identifiant",
    "login.placeholders.pin": "6 chiffres",
    "login.placeholders.password": "Votre mot de passe",
    "login.placeholders.username": "ex: jean.dupont",
    "login.placeholders.phone": "6XX XXX XXX",
    "login.placeholders.email": "nom@etablissement.cm",
    "login.submit": "Se connecter",
    "login.links.forgotPin": "PIN oublié ?",
    "login.links.forgotPassword": "Mot de passe oublié ?",
    "login.links.forgotUsername": "Identifiant oublié ?",
    "login.links.switchMethod": "Se connecter autrement →",
    "login.sso.info": "Accès instantané avec votre compte existant.",
    "login.sso.googleLoading": "Connexion Google...",
    "login.sso.googleContinue": "Continuer avec Google",
    "login.sso.appleContinue": "Continuer avec Apple",
    "login.sso.comingSoon": "BIENTÔT",
    "login.modal.title": "Choisir une méthode de connexion",
    "login.modal.cancel": "Annuler",
    "login.actionSheet.title": "Se connecter autrement",
    "login.footer.copyright": "© 2026 Scolive. Tous droits réservés.",
    "login.errors.invalidPhone": "Numéro de téléphone invalide.",
    "login.errors.invalidPin":
      "Le code PIN doit contenir exactement 6 chiffres.",
    "login.errors.invalidEmail": "Adresse email invalide.",
    "login.errors.passwordRequired": "Mot de passe requis.",
    "login.errors.usernameRequired": "Identifiant requis.",

    "apiErrors.invalidCredentials":
      "Identifiants incorrects. Vérifiez vos informations.",
    "apiErrors.rateLimited":
      "Trop de tentatives. Réessayez dans quelques minutes.",
    "apiErrors.accountValidationRequired":
      "Votre compte est en attente d'activation.",
    "apiErrors.accountSuspended":
      "Votre compte a été suspendu. Contactez votre administration.",
    "apiErrors.passwordChangeRequired":
      "Vous devez modifier votre mot de passe.",
    "apiErrors.profileSetupRequired": "Votre profil est incomplet.",
    "apiErrors.ssoProfileCompletionRequired":
      "Votre compte Google est reconnu, mais certaines informations de profil manquent encore. Finalisez votre profil sur le web ou contactez l'administration.",
    "apiErrors.platformCredentialSetupRequired":
      "Votre compte doit encore finaliser ses identifiants de plateforme.",
    "apiErrors.accountNotProvisioned":
      "Ce compte Google n'est pas encore autorisé par votre établissement.",
    "apiErrors.invalidSchoolAccount":
      "Ce compte Google n'est pas rattaché à cette école.",
    "apiErrors.generic":
      "Impossible de se connecter. Vérifiez votre connexion.",
    "apiErrors.googleInterrupted": "Connexion Google interrompue.",
    "apiErrors.googleMissingInfo":
      "Le compte Google ne fournit pas les informations requises.",
    "apiErrors.googleConnecting": "Connexion Google en cours...",

    "recovery.common.back": "‹ Retour",
    "recovery.common.phonePlaceholder": "6XX XXX XXX",
    "recovery.common.birthDateLabel": "Date de naissance",
    "recovery.common.birthDatePlaceholder": "JJ/MM/AAAA",
    "recovery.common.answerPlaceholder": "Votre réponse",
    "recovery.common.continue": "Continuer →",
    "recovery.common.verify": "Vérifier →",
    "recovery.common.loginButton": "Se connecter",
    "recovery.common.errors.birthDateRequired":
      "La date de naissance est obligatoire.",
    "recovery.common.errors.birthDateFormat": "Format attendu : JJ/MM/AAAA.",
    "recovery.common.errors.birthDateInvalid": "Date de naissance invalide.",
    "recovery.common.errors.answerRequired":
      "Réponse obligatoire (au moins 2 caractères).",
    "recovery.common.errors.recoveryInvalid":
      "Informations de récupération invalides.",
    "recovery.common.errors.notFound":
      "Aucun compte trouvé avec ces informations.",
    "recovery.common.errors.sessionExpired":
      "Session expirée. Recommencez depuis le début.",

    "recovery.pin.headerTitle": "Récupération de PIN",
    "recovery.pin.headerTitleSuccess": "PIN mis à jour !",
    "recovery.pin.step": "Étape {step} sur 3",
    "recovery.pin.step1.title": "Identifiez votre compte",
    "recovery.pin.step1.subtitle":
      "Renseignez votre numéro de téléphone pour retrouver l'accès à votre compte.",
    "recovery.pin.fields.phone": "Numéro de téléphone",
    "recovery.pin.step2.title": "Vérification d'identité",
    "recovery.pin.step2.subtitle":
      "Confirmez votre identité pour accéder à la réinitialisation.",
    "recovery.pin.step2.accountHint": "Compte : ",
    "recovery.pin.step3.title": "Nouveau PIN",
    "recovery.pin.step3.subtitle":
      "Choisissez un code PIN à 6 chiffres pour sécuriser votre accès.",
    "recovery.pin.fields.newPin": "Nouveau PIN",
    "recovery.pin.placeholders.newPin": "6 chiffres",
    "recovery.pin.fields.confirmPin": "Confirmer le PIN",
    "recovery.pin.placeholders.confirmPin": "Confirmez votre PIN",
    "recovery.pin.step3.submit": "Enregistrer le PIN",
    "recovery.pin.success.subtitle":
      "Votre code PIN a été modifié avec succès. Vous pouvez maintenant vous connecter.",
    "recovery.pin.errors.phoneRequired": "Le numéro de téléphone est requis.",
    "recovery.pin.errors.phoneInvalid":
      "Numéro invalide (9 chiffres attendus).",
    "recovery.pin.errors.pinFormat":
      "Le PIN doit contenir exactement 6 chiffres.",
    "recovery.pin.errors.confirmRequired": "Confirmez le PIN.",
    "recovery.pin.errors.confirmMismatch":
      "La confirmation ne correspond pas au PIN.",
    "recovery.pin.errors.samePin":
      "Le nouveau PIN doit être différent de l'actuel.",

    "recovery.password.headerTitle": "Mot de passe oublié",
    "recovery.password.headerTitleSuccess": "Mot de passe mis à jour !",
    "recovery.password.step": "Étape {step} sur {total}",
    "recovery.password.step1.title": "Réinitialiser le mot de passe",
    "recovery.password.step1.subtitle":
      "Entrez votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.",
    "recovery.password.fields.email": "Adresse email",
    "recovery.password.step1.submit": "Envoyer le lien →",
    "recovery.password.step2.title": "Vérifiez votre email",
    "recovery.password.step2.infoPrefix": "Un email a été envoyé à ",
    "recovery.password.step2.infoSuffix":
      ".\nOuvrez le lien dans l'email et copiez le code de réinitialisation ci-dessous.",
    "recovery.password.fields.token": "Code de réinitialisation",
    "recovery.password.placeholders.token": "Collez votre code ici",
    "recovery.password.step2.resend": "Renvoyer l'email",
    "recovery.password.step3.title": "Vérification d'identité",
    "recovery.password.step3.subtitle":
      "Confirmez votre identité pour sécuriser la réinitialisation.",
    "recovery.password.step3.accountHint": "Compte : ",
    "recovery.password.step4.title": "Nouveau mot de passe",
    "recovery.password.step4.subtitle":
      "Choisissez un mot de passe fort : au moins 8 caractères avec majuscules, minuscules et chiffres.",
    "recovery.password.fields.newPassword": "Nouveau mot de passe",
    "recovery.password.placeholders.newPassword": "Votre nouveau mot de passe",
    "recovery.password.fields.confirmPassword": "Confirmer le mot de passe",
    "recovery.password.placeholders.confirmPassword":
      "Confirmez votre mot de passe",
    "recovery.password.step4.submit": "Enregistrer le mot de passe",
    "recovery.password.success.subtitle":
      "Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter.",
    "recovery.password.errors.emailRequired": "L'adresse email est requise.",
    "recovery.password.errors.emailInvalid": "Adresse email invalide.",
    "recovery.password.errors.tokenInvalid":
      "Le lien de réinitialisation est invalide (trop court).",
    "recovery.password.errors.passwordTooShort":
      "Le mot de passe doit faire au moins 8 caractères.",
    "recovery.password.errors.passwordComplexity":
      "Le mot de passe doit contenir majuscules, minuscules et chiffres.",
    "recovery.password.errors.confirmRequired": "Confirmez le mot de passe.",
    "recovery.password.errors.confirmMismatch":
      "La confirmation ne correspond pas au nouveau mot de passe.",
    "recovery.password.errors.notFoundEmail":
      "Aucun compte trouvé pour cette adresse email.",
    "recovery.password.errors.tokenExpired":
      "Le lien a expiré. Recommencez depuis le début.",
    "recovery.password.errors.tokenInvalidLink":
      "Lien de réinitialisation invalide.",
    "recovery.password.errors.samePassword":
      "Le nouveau mot de passe doit être différent de l'actuel.",
    "recovery.password.errors.tokenInvalidOrExpired":
      "Lien de réinitialisation invalide ou expiré.",

    "recovery.username.headerTitle": "Récupération du compte",
    "recovery.username.headerTitleSuccess": "Mot de passe réinitialisé",
    "recovery.username.headerSubtitle":
      "Réinitialisez votre mot de passe via votre identifiant.",
    "recovery.username.fields.username": "Votre identifiant",
    "recovery.username.placeholders.username": "ex: jean.dupont",
    "recovery.username.continueButton": "Continuer",
    "recovery.username.noQuestions.warning":
      "Aucune question de récupération n'a été configurée pour ce compte. Contacte ton administration scolaire pour réinitialiser ton accès.",
    "recovery.username.backToLogin": "Retour à la connexion",
    "recovery.username.placeholders.newPassword":
      "8+ caractères, maj, min, chiffre",
    "recovery.username.step3.submit": "Réinitialiser",
    "recovery.username.success.text":
      "Votre mot de passe a été mis à jour. Vous pouvez maintenant vous connecter avec votre identifiant.",
    "recovery.username.success.headerSubtitle":
      "Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.",
    "recovery.username.errors.usernameRequired": "L'identifiant est requis.",
    "recovery.username.errors.birthDateFormat":
      "Format de date attendu : JJ/MM/AAAA.",
    "recovery.username.errors.answerTooShort":
      "Chaque réponse doit contenir au moins 2 caractères.",
    "recovery.username.errors.notFound":
      "Aucun compte trouvé pour cet identifiant.",
    "recovery.username.errors.tokenExpired":
      "Le jeton a expiré. Recommencez depuis le début.",
    "recovery.username.errors.noRecoveryQuestions":
      "Aucune question de récupération configurée.",

    "onboarding.title": "Première connexion",
    "onboarding.titleSuccess": "Activation terminée",
    "onboarding.subtitle.passwordFlow":
      "Changez votre mot de passe provisoire puis terminez la configuration du compte.",
    "onboarding.subtitle.tokenFlow":
      "Complétez votre profil, changez votre PIN et configurez la récupération.",
    "onboarding.subtitle.success":
      "Votre compte est prêt. Vous pouvez maintenant revenir à la connexion.",
    "onboarding.loadingOptions": "Chargement des options…",
    "onboarding.step1.username.label": "Identifiant",
    "onboarding.step1.temporaryPassword.label": "Mot de passe provisoire",
    "onboarding.step1.email.label": "Adresse email",
    "onboarding.step1.emailOptional.label": "Adresse email optionnelle",
    "onboarding.step1.setupToken.label": "Jeton d'activation",
    "onboarding.step2.firstName.label": "Prénom",
    "onboarding.step2.lastName.label": "Nom",
    "onboarding.step2.gender.label": "Genre",
    "onboarding.step2.gender.female": "Femme",
    "onboarding.step2.gender.male": "Homme",
    "onboarding.step2.gender.other": "Autre",
    "onboarding.step3.newPin.label": "Nouveau PIN",
    "onboarding.step3.confirmPin.label": "Confirmer le PIN",
    "onboarding.recoverySelection.title": "Choisissez 3 questions",
    "onboarding.recoverySelection.hint": "Sélection {selected}/3",
    "onboarding.recoveryAnswers.classTitle": "Classe de votre enfant",
    "onboarding.recoveryAnswers.studentTitle": "Nom de votre enfant",
    "onboarding.submitButton": "Finaliser",
    "onboarding.success.title": "Compte configuré",
    "onboarding.success.textPrefix":
      "Votre première connexion est terminée pour",
    "onboarding.success.defaultAccount": "votre compte",
    "onboarding.errors.invalidActivationLink": "Lien d'activation invalide.",
    "onboarding.errors.usernameRequired": "Identifiant requis.",
    "onboarding.errors.temporaryPasswordRequired":
      "Le mot de passe provisoire est obligatoire.",
    "onboarding.errors.setupTokenRequired": "Jeton d'activation manquant.",
    "onboarding.errors.firstNameRequired": "Le prénom est obligatoire.",
    "onboarding.errors.lastNameRequired": "Le nom est obligatoire.",
    "onboarding.errors.genderRequired": "Le genre est obligatoire.",
    "onboarding.errors.birthDateFuture":
      "La date de naissance ne peut pas être dans le futur.",
    "onboarding.errors.pinFormat":
      "Le PIN doit contenir exactement 6 chiffres.",
    "onboarding.errors.confirmPinRequired": "Confirmez le PIN.",
    "onboarding.errors.confirmPinMismatch":
      "La confirmation ne correspond pas au PIN.",
    "onboarding.errors.questionsCount": "Choisissez exactement 3 questions.",
    "onboarding.errors.questionsUnique":
      "Les 3 questions doivent être différentes.",
    "onboarding.errors.parentClassRequired":
      "La classe de votre enfant est obligatoire.",
    "onboarding.errors.parentStudentRequired":
      "Le nom de votre enfant est obligatoire.",
    "onboarding.errors.invalidCredentials":
      "Informations d'activation invalides.",
    "onboarding.errors.profileSetupRequired":
      "Le profil doit encore être complété.",
    "onboarding.errors.activationFailed":
      "Impossible de finaliser l'activation avec ces informations.",
  },
  en: {
    "settings.language.title": "Language of this device",
    "settings.language.subtitle": "Choose the application language",
    "settings.language.hint":
      "The selected language is applied immediately and saved on this device.",
    "settings.language.fr": "Français",
    "settings.language.en": "English",
    "settings.accountLanguage.title": "Account language",
    "settings.accountLanguage.subtitle":
      "This language is tied to your account",
    "settings.accountLanguage.hint":
      "It is applied automatically on every login, on any device.",

    "login.tagline": "Your school, in real time.",
    "login.method.phone": "Sign in with phone",
    "login.method.email": "Sign in with email",
    "login.method.username": "Sign in with username",
    "login.method.google": "Google sign-in",
    "login.fields.phone": "Phone number",
    "login.fields.pin": "PIN code",
    "login.fields.email": "Email address",
    "login.fields.password": "Password",
    "login.fields.username": "Username",
    "login.placeholders.pin": "6 digits",
    "login.placeholders.password": "Your password",
    "login.placeholders.username": "e.g. jean.dupont",
    "login.placeholders.phone": "6XX XXX XXX",
    "login.placeholders.email": "name@school.cm",
    "login.submit": "Sign in",
    "login.links.forgotPin": "Forgot your PIN?",
    "login.links.forgotPassword": "Forgot your password?",
    "login.links.forgotUsername": "Forgot your username?",
    "login.links.switchMethod": "Sign in another way →",
    "login.sso.info": "Instant access with your existing account.",
    "login.sso.googleLoading": "Signing in with Google...",
    "login.sso.googleContinue": "Continue with Google",
    "login.sso.appleContinue": "Continue with Apple",
    "login.sso.comingSoon": "COMING SOON",
    "login.modal.title": "Choose a sign-in method",
    "login.modal.cancel": "Cancel",
    "login.actionSheet.title": "Sign in another way",
    "login.footer.copyright": "© 2026 Scolive. All rights reserved.",
    "login.errors.invalidPhone": "Invalid phone number.",
    "login.errors.invalidPin": "The PIN code must be exactly 6 digits.",
    "login.errors.invalidEmail": "Invalid email address.",
    "login.errors.passwordRequired": "Password is required.",
    "login.errors.usernameRequired": "Username is required.",

    "apiErrors.invalidCredentials":
      "Incorrect credentials. Check your information.",
    "apiErrors.rateLimited": "Too many attempts. Try again in a few minutes.",
    "apiErrors.accountValidationRequired":
      "Your account is awaiting activation.",
    "apiErrors.accountSuspended":
      "Your account has been suspended. Contact your administration.",
    "apiErrors.passwordChangeRequired": "You must change your password.",
    "apiErrors.profileSetupRequired": "Your profile is incomplete.",
    "apiErrors.ssoProfileCompletionRequired":
      "Your Google account is recognized, but some profile information is still missing. Complete your profile on the web or contact your administration.",
    "apiErrors.platformCredentialSetupRequired":
      "Your account still needs to finalize its platform credentials.",
    "apiErrors.accountNotProvisioned":
      "This Google account is not yet authorized by your school.",
    "apiErrors.invalidSchoolAccount":
      "This Google account is not linked to this school.",
    "apiErrors.generic": "Unable to connect. Check your internet connection.",
    "apiErrors.googleInterrupted": "Google sign-in interrupted.",
    "apiErrors.googleMissingInfo":
      "The Google account did not provide the required information.",
    "apiErrors.googleConnecting": "Signing in with Google...",

    "recovery.common.back": "‹ Back",
    "recovery.common.phonePlaceholder": "6XX XXX XXX",
    "recovery.common.birthDateLabel": "Date of birth",
    "recovery.common.birthDatePlaceholder": "DD/MM/YYYY",
    "recovery.common.answerPlaceholder": "Your answer",
    "recovery.common.continue": "Continue →",
    "recovery.common.verify": "Verify →",
    "recovery.common.loginButton": "Sign in",
    "recovery.common.errors.birthDateRequired": "Date of birth is required.",
    "recovery.common.errors.birthDateFormat": "Expected format: DD/MM/YYYY.",
    "recovery.common.errors.birthDateInvalid": "Invalid date of birth.",
    "recovery.common.errors.answerRequired":
      "An answer is required (at least 2 characters).",
    "recovery.common.errors.recoveryInvalid": "Invalid recovery information.",
    "recovery.common.errors.notFound":
      "No account found with this information.",
    "recovery.common.errors.sessionExpired":
      "Session expired. Please start over.",

    "recovery.pin.headerTitle": "PIN recovery",
    "recovery.pin.headerTitleSuccess": "PIN updated!",
    "recovery.pin.step": "Step {step} of 3",
    "recovery.pin.step1.title": "Identify your account",
    "recovery.pin.step1.subtitle":
      "Enter your phone number to recover access to your account.",
    "recovery.pin.fields.phone": "Phone number",
    "recovery.pin.step2.title": "Identity verification",
    "recovery.pin.step2.subtitle": "Confirm your identity to access the reset.",
    "recovery.pin.step2.accountHint": "Account: ",
    "recovery.pin.step3.title": "New PIN",
    "recovery.pin.step3.subtitle":
      "Choose a 6-digit PIN code to secure your access.",
    "recovery.pin.fields.newPin": "New PIN",
    "recovery.pin.placeholders.newPin": "6 digits",
    "recovery.pin.fields.confirmPin": "Confirm PIN",
    "recovery.pin.placeholders.confirmPin": "Confirm your PIN",
    "recovery.pin.step3.submit": "Save PIN",
    "recovery.pin.success.subtitle":
      "Your PIN code has been successfully updated. You can now sign in.",
    "recovery.pin.errors.phoneRequired": "Phone number is required.",
    "recovery.pin.errors.phoneInvalid": "Invalid number (9 digits expected).",
    "recovery.pin.errors.pinFormat": "The PIN must be exactly 6 digits.",
    "recovery.pin.errors.confirmRequired": "Confirm the PIN.",
    "recovery.pin.errors.confirmMismatch":
      "The confirmation does not match the PIN.",
    "recovery.pin.errors.samePin":
      "The new PIN must be different from the current one.",

    "recovery.password.headerTitle": "Forgot password",
    "recovery.password.headerTitleSuccess": "Password updated!",
    "recovery.password.step": "Step {step} of {total}",
    "recovery.password.step1.title": "Reset your password",
    "recovery.password.step1.subtitle":
      "Enter your email address. We'll send you a link to reset your password.",
    "recovery.password.fields.email": "Email address",
    "recovery.password.step1.submit": "Send link →",
    "recovery.password.step2.title": "Check your email",
    "recovery.password.step2.infoPrefix": "An email has been sent to ",
    "recovery.password.step2.infoSuffix":
      ".\nOpen the link in the email and paste the reset code below.",
    "recovery.password.fields.token": "Reset code",
    "recovery.password.placeholders.token": "Paste your code here",
    "recovery.password.step2.resend": "Resend email",
    "recovery.password.step3.title": "Identity verification",
    "recovery.password.step3.subtitle":
      "Confirm your identity to secure the reset.",
    "recovery.password.step3.accountHint": "Account: ",
    "recovery.password.step4.title": "New password",
    "recovery.password.step4.subtitle":
      "Choose a strong password: at least 8 characters with uppercase, lowercase and digits.",
    "recovery.password.fields.newPassword": "New password",
    "recovery.password.placeholders.newPassword": "Your new password",
    "recovery.password.fields.confirmPassword": "Confirm password",
    "recovery.password.placeholders.confirmPassword":
      "Confirm your new password",
    "recovery.password.step4.submit": "Save password",
    "recovery.password.success.subtitle":
      "Your password has been updated successfully. You can now sign in.",
    "recovery.password.errors.emailRequired": "Email address is required.",
    "recovery.password.errors.emailInvalid": "Invalid email address.",
    "recovery.password.errors.tokenInvalid":
      "The reset link is invalid (too short).",
    "recovery.password.errors.passwordTooShort":
      "The password must be at least 8 characters long.",
    "recovery.password.errors.passwordComplexity":
      "The password must contain uppercase, lowercase and digits.",
    "recovery.password.errors.confirmRequired": "Confirm the password.",
    "recovery.password.errors.confirmMismatch":
      "The confirmation does not match the new password.",
    "recovery.password.errors.notFoundEmail":
      "No account found for this email address.",
    "recovery.password.errors.tokenExpired":
      "The link has expired. Please start over.",
    "recovery.password.errors.tokenInvalidLink": "Invalid reset link.",
    "recovery.password.errors.samePassword":
      "The new password must be different from the current one.",
    "recovery.password.errors.tokenInvalidOrExpired":
      "Invalid or expired reset link.",

    "recovery.username.headerTitle": "Account recovery",
    "recovery.username.headerTitleSuccess": "Password reset",
    "recovery.username.headerSubtitle":
      "Reset your password using your username.",
    "recovery.username.fields.username": "Your username",
    "recovery.username.placeholders.username": "e.g. john.doe",
    "recovery.username.continueButton": "Continue",
    "recovery.username.noQuestions.warning":
      "No recovery questions have been configured for this account. Contact your school administration to reset your access.",
    "recovery.username.backToLogin": "Back to sign in",
    "recovery.username.placeholders.newPassword":
      "8+ characters, upper, lower, digit",
    "recovery.username.step3.submit": "Reset",
    "recovery.username.success.text":
      "Your password has been updated. You can now sign in with your username.",
    "recovery.username.success.headerSubtitle":
      "Your password has been reset. You can now sign in.",
    "recovery.username.errors.usernameRequired": "Username is required.",
    "recovery.username.errors.birthDateFormat":
      "Expected date format: DD/MM/YYYY.",
    "recovery.username.errors.answerTooShort":
      "Each answer must be at least 2 characters long.",
    "recovery.username.errors.notFound": "No account found for this username.",
    "recovery.username.errors.tokenExpired":
      "The token has expired. Please start over.",
    "recovery.username.errors.noRecoveryQuestions":
      "No recovery questions configured.",

    "onboarding.title": "First login",
    "onboarding.titleSuccess": "Activation complete",
    "onboarding.subtitle.passwordFlow":
      "Change your temporary password then finish setting up your account.",
    "onboarding.subtitle.tokenFlow":
      "Complete your profile, change your PIN and set up account recovery.",
    "onboarding.subtitle.success":
      "Your account is ready. You can now go back to login.",
    "onboarding.loadingOptions": "Loading options…",
    "onboarding.step1.username.label": "Username",
    "onboarding.step1.temporaryPassword.label": "Temporary password",
    "onboarding.step1.email.label": "Email address",
    "onboarding.step1.emailOptional.label": "Email address (optional)",
    "onboarding.step1.setupToken.label": "Activation token",
    "onboarding.step2.firstName.label": "First name",
    "onboarding.step2.lastName.label": "Last name",
    "onboarding.step2.gender.label": "Gender",
    "onboarding.step2.gender.female": "Female",
    "onboarding.step2.gender.male": "Male",
    "onboarding.step2.gender.other": "Other",
    "onboarding.step3.newPin.label": "New PIN",
    "onboarding.step3.confirmPin.label": "Confirm PIN",
    "onboarding.recoverySelection.title": "Choose 3 questions",
    "onboarding.recoverySelection.hint": "Selected {selected}/3",
    "onboarding.recoveryAnswers.classTitle": "Your child's class",
    "onboarding.recoveryAnswers.studentTitle": "Your child's name",
    "onboarding.submitButton": "Finish",
    "onboarding.success.title": "Account ready",
    "onboarding.success.textPrefix": "Your first login is complete for",
    "onboarding.success.defaultAccount": "your account",
    "onboarding.errors.invalidActivationLink": "Invalid activation link.",
    "onboarding.errors.usernameRequired": "Username is required.",
    "onboarding.errors.temporaryPasswordRequired":
      "The temporary password is required.",
    "onboarding.errors.setupTokenRequired": "Activation token is missing.",
    "onboarding.errors.firstNameRequired": "First name is required.",
    "onboarding.errors.lastNameRequired": "Last name is required.",
    "onboarding.errors.genderRequired": "Gender is required.",
    "onboarding.errors.birthDateFuture":
      "The date of birth cannot be in the future.",
    "onboarding.errors.pinFormat": "The PIN must contain exactly 6 digits.",
    "onboarding.errors.confirmPinRequired": "Confirm the PIN.",
    "onboarding.errors.confirmPinMismatch":
      "The confirmation does not match the PIN.",
    "onboarding.errors.questionsCount": "Choose exactly 3 questions.",
    "onboarding.errors.questionsUnique": "The 3 questions must be different.",
    "onboarding.errors.parentClassRequired": "Your child's class is required.",
    "onboarding.errors.parentStudentRequired": "Your child's name is required.",
    "onboarding.errors.invalidCredentials": "Invalid activation information.",
    "onboarding.errors.profileSetupRequired":
      "The profile still needs to be completed.",
    "onboarding.errors.activationFailed":
      "Unable to complete activation with this information.",
  },
};
