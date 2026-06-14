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

    "discipline.types.absence": "Absence",
    "discipline.types.absencePlural": "ABSENCES",
    "discipline.types.retard": "Retard",
    "discipline.types.retardPlural": "RETARDS",
    "discipline.types.sanction": "Sanction",
    "discipline.types.sanctionPlural": "SANCTIONS",
    "discipline.types.punition": "Punition",
    "discipline.types.punitionPlural": "PUNITIONS",

    "discipline.validation.dateRequired": "La date est obligatoire.",
    "discipline.validation.dateInvalid": "La date est invalide.",
    "discipline.validation.reasonRequired": "Le motif est obligatoire.",
    "discipline.validation.durationPositive":
      "La durée doit être un entier positif.",
    "discipline.validation.studentRequired": "Choisissez un élève.",

    "discipline.form.title": "Discipline",
    "discipline.form.eyebrowCreate": "Nouvel événement",
    "discipline.form.eyebrowEdit": "Modification",
    "discipline.form.fields.type": "Type d'événement",
    "discipline.form.fields.typeRequired": "Type d'événement *",
    "discipline.form.fields.student": "Élève",
    "discipline.form.fields.studentPlaceholder": "Choisir un élève",
    "discipline.form.fields.dateTime": "Date et heure",
    "discipline.form.fields.dateTimeRequired": "Date et heure *",
    "discipline.form.fields.dateTimePlaceholder": "2026-04-09T08:30",
    "discipline.form.fields.dateTimePlaceholderIso": "AAAA-MM-JJTHH:mm",
    "discipline.form.fields.reason": "Motif",
    "discipline.form.fields.reasonRequired": "Motif *",
    "discipline.form.fields.reasonPlaceholder":
      "Ex : travail non rendu, absence non justifiée…",
    "discipline.form.fields.reasonPlaceholderShort":
      "Ex : bus arrivé en retard",
    "discipline.form.fields.duration": "Durée (minutes)",
    "discipline.form.fields.durationOptional": "Durée (minutes, optionnel)",
    "discipline.form.fields.durationPlaceholder": "Ex : 15",
    "discipline.form.fields.durationPlaceholderAlt": "Ex : 40",
    "discipline.form.fields.description": "Description",
    "discipline.form.fields.justified": "Justifié",
    "discipline.form.fields.justifiedHint":
      "Absence ou retard justifié par les parents / administration",
    "discipline.form.fields.justifiedHintAlt":
      "Absence ou retard validé par les parents ou l'administration",
    "discipline.form.fields.comment": "Commentaire",
    "discipline.form.fields.commentOptional": "Commentaire (optionnel)",
    "discipline.form.fields.commentPlaceholder":
      "Observations supplémentaires…",
    "discipline.form.fields.commentPlaceholderAlt":
      "Observations complémentaires",
    "discipline.form.buttons.cancel": "Annuler",
    "discipline.form.buttons.create": "Créer l'événement",
    "discipline.form.buttons.edit": "Enregistrer les modifications",

    "discipline.studentSelect.placeholder": "Choisir un élève",
    "discipline.studentSelect.allStudents": "Tous les élèves",
    "discipline.studentSelect.search": "Rechercher un élève",

    "discipline.card.showDetails": "Voir les détails",
    "discipline.card.hideDetails": "Masquer les détails",
    "discipline.card.duration": "Durée",
    "discipline.card.justifiedYes": "Oui",
    "discipline.card.justifiedNo": "Non",
    "discipline.card.class": "Classe",
    "discipline.card.schoolYear": "Année scolaire",
    "discipline.card.editAria": "Modifier cet événement",
    "discipline.card.deleteAria": "Supprimer cet événement",

    "discipline.kpi.absences": "ABSENCES",
    "discipline.kpi.retards": "RETARDS",
    "discipline.kpi.sanctions": "SANCTIONS",
    "discipline.kpi.punitions": "PUNITIONS",

    "discipline.summary.allGoodTitle": "Tout va bien !",
    "discipline.summary.allGoodSubtitle":
      "Aucun événement de vie scolaire enregistré sur l'année en cours.",
    "discipline.summary.currentYear": "Cette année scolaire",
    "discipline.summary.showAll": "Tout voir",
    "discipline.summary.noEventsOfType": "Aucun événement de ce type.",
    "discipline.summary.recentEvents": "Derniers événements",
    "discipline.summary.recentEventsFiltered": "Derniers événements : {type}",
    "discipline.summary.unjustifiedPrefixOne": "{count} absence",
    "discipline.summary.unjustifiedPrefixMany": "{count} absences",
    "discipline.summary.unjustifiedSuffixOne": "non justifiée cette année.",
    "discipline.summary.unjustifiedSuffixMany": "non justifiées cette année.",

    "discipline.list.emptyTitle": "Aucun événement",
    "discipline.list.emptySubtitle":
      "Aucun événement enregistré pour cette période.",
    "discipline.list.endOfList": "Tous les événements ont été chargés",

    "discipline.delete.title": "Supprimer cet événement ?",
    "discipline.delete.irreversible": "Cette action est irréversible.",
    "discipline.delete.willBeDeleted": "sera supprimé définitivement.",
    "discipline.delete.cancel": "Annuler",
    "discipline.delete.confirm": "Supprimer",
    "discipline.delete.confirmAria": "Confirmer la suppression",

    "discipline.tabs.synthesis": "Synthèse",
    "discipline.tabs.absencesRetards": "Absences & Retards",
    "discipline.tabs.sanctionsPunitions": "Sanctions & Punitions",
    "discipline.tabs.events": "Événements",
    "discipline.tabs.booklets": "Carnets",
    "discipline.tabs.history": "Historique",
    "discipline.tabs.students": "Élèves",
    "discipline.tabs.byClass": "Par classe",

    "discipline.errors.loadData":
      "Impossible de charger les données. Réessayez.",
    "discipline.errors.refreshData": "Impossible de rafraîchir les données.",
    "discipline.errors.loadHistory": "Impossible de charger l'historique.",
    "discipline.errors.loadContext":
      "Impossible de charger le contexte de discipline.",
    "discipline.errors.loadEvents":
      "Impossible de charger les événements de discipline.",
    "discipline.errors.loadYearsClasses":
      "Impossible de charger les années et classes.",
    "discipline.errors.loadClassStudents":
      "Impossible de charger les élèves de cette classe.",
    "discipline.errors.saveGeneric": "Erreur lors de l'enregistrement.",
    "discipline.errors.deleteGeneric": "Erreur lors de la suppression.",
    "discipline.errors.saveTitle": "Enregistrement impossible",
    "discipline.errors.deleteTitle": "Suppression impossible",
    "discipline.retry": "Réessayer",

    "discipline.toasts.eventUpdatedTitle": "Événement modifié",
    "discipline.toasts.eventUpdatedMessage":
      "Les changements ont bien été enregistrés.",
    "discipline.toasts.eventUpdatedMessageClassUpdated":
      "La fiche discipline a bien été mise à jour.",
    "discipline.toasts.eventUpdatedMessageClassUpdatedAlt":
      "La fiche discipline a été mise à jour.",
    "discipline.toasts.eventCreatedTitle": "Événement créé",
    "discipline.toasts.eventRegisteredTitle": "Événement enregistré",
    "discipline.toasts.eventCreatedMessageHistory":
      "L'événement a bien été ajouté à l'historique discipline.",
    "discipline.toasts.eventCreatedMessageClass":
      "L'événement a été ajouté à l'historique de classe.",
    "discipline.toasts.eventCreatedMessageGlobal":
      "L'événement a été ajouté à l'historique.",
    "discipline.toasts.eventDeletedTitle": "Événement supprimé",
    "discipline.toasts.eventDeletedMessageHistory":
      "L'événement a été retiré de l'historique discipline.",
    "discipline.toasts.eventDeletedMessageModule":
      "L'événement a été retiré du module discipline.",

    "discipline.header.discipline": "Discipline",
    "discipline.header.vieScolaire": "Vie scolaire",
    "discipline.header.student": "Élève",

    "discipline.fab.addEvent": "Ajouter un événement de discipline",

    "discipline.empty.discipline.title": "Discipline indisponible",
    "discipline.empty.discipline.message":
      "Le contexte de classe n'a pas pu être résolu.",
    "discipline.empty.noClassEvents.title": "Aucun événement de discipline",
    "discipline.empty.noClassEvents.message":
      "Aucun événement n'a encore été saisi pour cette classe.",
    "discipline.empty.chooseStudent.title": "Choisissez un élève",
    "discipline.empty.chooseStudentClass.message":
      "La synthèse vie scolaire apparaît ici après sélection d'un élève de la classe.",
    "discipline.empty.chooseStudentGlobal.message":
      "La synthèse vie scolaire apparaît ici après sélection d'un élève.",
    "discipline.empty.searchStudent.title": "Recherchez un élève",
    "discipline.empty.searchStudent.message":
      "Saisissez un nom pour chercher dans toutes les classes, ou sélectionnez d'abord une classe.",
    "discipline.empty.noStudent.title": "Aucun élève",
    "discipline.empty.noStudent.messageSearch":
      "Aucun élève ne correspond à cette recherche.",
    "discipline.empty.noStudent.messageClass":
      "Cette classe ne contient aucun élève.",
    "discipline.empty.chooseClass.title": "Sélectionnez une classe",
    "discipline.empty.chooseClass.message":
      "Choisissez une classe pour afficher les événements de discipline.",
    "discipline.empty.noEventsHistory.title": "Aucun événement",
    "discipline.empty.noEventsHistory.message":
      "Appuyez sur + pour enregistrer un premier événement.",
    "discipline.empty.noAbsence.title": "Aucune absence ni retard",
    "discipline.empty.noAbsence.message":
      "Aucune absence ou retard n'a été enregistré sur l'année en cours.",
    "discipline.empty.noSanction.title": "Aucune sanction ni punition",
    "discipline.empty.noSanction.message":
      "Aucune sanction ou punition n'a été enregistrée sur l'année en cours.",

    "discipline.loading.students": "Chargement des élèves...",
    "discipline.loading.class": "Chargement de la classe...",
    "discipline.loading.generic": "Chargement...",

    "discipline.sections.classEvents.title": "Événements de classe",
    "discipline.sections.classEvents.subtitle":
      "Parcourez et filtrez l'historique du plus récent au plus ancien.",
    "discipline.sections.booklets.title": "Carnets",
    "discipline.sections.booklets.subtitle":
      "Sélectionnez un élève pour afficher sa synthèse vie scolaire.",
    "discipline.sections.searchStudents.title": "Rechercher un élève",
    "discipline.sections.searchStudents.subtitle":
      "Filtrez par classe ou saisissez un nom pour chercher dans toutes les classes.",
    "discipline.sections.byClass.title": "Vue par classe",
    "discipline.sections.byClass.subtitle":
      "Sélectionnez une année et une classe.",

    "discipline.filters.student": "Élève",
    "discipline.filters.allStudents": "Tous les élèves",
    "discipline.filters.year": "Année",
    "discipline.filters.class": "Classe",
    "discipline.filters.allClasses": "Toutes les classes",
    "discipline.filters.selectYear": "Choisir une année",
    "discipline.filters.selectClass": "Sélectionner une classe",
    "discipline.filters.searchByName": "Rechercher par nom",
    "discipline.filters.searchByStudent": "Recherche par élève",

    "discipline.adminTabs.students": "Élèves",
    "discipline.adminTabs.byClass": "Par classe",

    "discipline.parent.title": "Vie scolaire",
    "discipline.parent.empty.absencesRetards.title": "Aucune absence ni retard",
    "discipline.parent.empty.absencesRetards.message":
      "Aucune absence ou retard n'a été enregistré sur l'année en cours.",
    "discipline.parent.empty.sanctionsPunitions.title":
      "Aucune sanction ni punition",
    "discipline.parent.empty.sanctionsPunitions.message":
      "Aucune sanction ou punition n'a été enregistrée sur l'année en cours.",

    "homework.tabs.list": "Liste",
    "homework.tabs.agenda": "Agenda des homeworks",
    "homework.tabs.week": "Semaine",
    "homework.tabs.month": "Mois",

    "homework.form.validation.subjectRequired": "La matière est obligatoire.",
    "homework.form.validation.titleRequired": "Le titre est obligatoire.",
    "homework.form.validation.dateRequired":
      "La date attendue est obligatoire.",
    "homework.form.validation.timeRequired":
      "L'heure attendue est obligatoire.",
    "homework.form.validation.commentRequired":
      "Le commentaire ne peut pas être vide.",

    "homework.colors.black": "Noir",
    "homework.colors.blue": "Bleu",
    "homework.colors.green": "Vert",
    "homework.colors.red": "Rouge",

    "homework.card.details": "Détails",
    "homework.card.markDone": "Marquer fait",
    "homework.card.edit": "Modifier",
    "homework.card.delete": "Supprimer",
    "homework.card.expectedDatePrefix": "Date attendue : ",
    "homework.card.doneOnPrefix": "Fait le ",
    "homework.card.attachmentsSuffix": "PJ",

    "homework.status.done": "Fait",
    "homework.status.pending": "En attente",
    "homework.status.notDone": "Non fait",

    "homework.common.loading": "Chargement...",
    "homework.common.cancel": "Annuler",
    "homework.common.save": "Enregistrer",
    "homework.common.saving": "Enregistrement...",
    "homework.common.doneSuffix": "faits",

    "homework.comment.empty": "Aucun commentaire pour le moment.",
    "homework.comment.placeholder": "Ajouter un commentaire",

    "homework.control.title": "Suivi homework",
    "homework.control.doneStudentsTitle":
      "Élèves ayant déjà fait le devoir",
    "homework.control.summarySuffix": "faits",
    "homework.control.noStudentDone":
      "Aucun élève n'a encore marqué ce homework comme fait.",
    "homework.control.unavailableTitle": "Suivi indisponible",
    "homework.control.unavailableMessage":
      "Impossible de charger la liste des élèves pour ce homework.",

    "homework.form.colorMenu.title": "Couleur du texte",
    "homework.form.colorMenu.message": "Choisissez une couleur",
    "homework.form.permission.title": "Permission requise",
    "homework.form.permission.message": "Autorisez l'accès aux photos.",
    "homework.form.editTitle": "Modifier homework",
    "homework.form.createTitle": "Nouveau homework",
    "homework.form.subjectLabel": "Matière",
    "homework.form.titleLabel": "Titre",
    "homework.form.titlePlaceholder": "Ex. Exercice sur les fractions",
    "homework.form.expectedDateLabel": "Date attendue",
    "homework.form.datePlaceholder": "Choisir une date",
    "homework.form.expectedTimeLabel": "Heure attendue",
    "homework.form.timePlaceholder": "Heure",
    "homework.form.contentLabel": "Contenu",
    "homework.form.insertingImage": "Insertion de l'image...",
    "homework.form.contentPlaceholder":
      "Consignes, ressources, liens utiles...",
    "homework.form.attachmentsTitle": "Pièces jointes",
    "homework.form.attachmentsSubtitle":
      "Images, PDF, Word, Excel et autres documents scolaires",
    "homework.form.noAttachments": "Aucune pièce jointe pour le moment.",

    "homework.errors.title": "Erreur",
    "homework.errors.insertImage": "Impossible d'insérer l'image.",
    "homework.errors.addAttachment":
      "Impossible d'ajouter cette pièce jointe.",
    "homework.errors.openAttachment":
      "Impossible d'ouvrir cette pièce jointe.",
    "homework.errors.loadContext":
      "Impossible de charger le contexte homework.",

    "homework.header.title": "Homework",
    "homework.loading.module": "Chargement du module homework...",
    "homework.loading.control": "Chargement du suivi...",
    "homework.loading.detail": "Chargement du détail...",

    "homework.agenda.thisWeek": "Cette semaine",
    "homework.agenda.thisMonth": "Ce mois",
    "homework.agenda.dayTitle": "Homework du jour sélectionné",
    "homework.agenda.monthDayTitle": "Agenda du jour sélectionné",
    "homework.agenda.noDaySelected": "Aucun jour sélectionné",

    "homework.empty.title": "Aucun homework",
    "homework.empty.list":
      "Aucun homework n'est prévu à partir d'aujourd'hui.",
    "homework.empty.endOfList": "Tous les homeworks à venir sont affichés",
    "homework.empty.week":
      "Aucun homework n'est prévu sur ce jour de la semaine.",
    "homework.empty.month": "Aucun homework n'est prévu pour cette journée.",

    "homework.label": "Devoirs",
    "homework.kpi.notDone": "non faits",
    "homework.kpi.unknownClass": "Classe inconnue",
    "homework.section.empty": "Aucun devoir en cours",

    "homework.toast.updatedTitle": "Homework mis à jour",
    "homework.toast.updatedMessage":
      "Les consignes ont bien été enregistrées.",
    "homework.toast.createdTitle": "Homework créé",
    "homework.toast.createdMessage":
      "Le nouveau homework a été ajouté à l'agenda.",
    "homework.toast.saveErrorTitle": "Enregistrement impossible",
    "homework.toast.saveErrorMessage":
      "Impossible d'enregistrer ce homework.",
    "homework.toast.deletedTitle": "Homework supprimé",
    "homework.toast.deletedMessage": "Le homework a bien été retiré.",
    "homework.toast.deleteErrorTitle": "Suppression impossible",
    "homework.toast.deleteErrorMessage":
      "Impossible de supprimer ce homework.",
    "homework.toast.reopenedTitle": "Homework rouvert",
    "homework.toast.reopenedMessage":
      "Le homework est repassé en non fait.",
    "homework.toast.completedTitle": "Homework terminé",
    "homework.toast.completedMessage": "Le homework est marqué comme fait.",
    "homework.toast.statusErrorTitle": "Mise à jour impossible",
    "homework.toast.statusErrorMessage":
      "Impossible de mettre à jour l'état du homework.",
    "homework.toast.commentAddedTitle": "Commentaire ajouté",
    "homework.toast.commentAddedMessage":
      "Le commentaire a bien été enregistré.",
    "homework.toast.commentErrorTitle": "Commentaire impossible",
    "homework.toast.commentErrorMessage":
      "Impossible d'ajouter le commentaire.",

    "homework.detail.title": "Détail homework",
    "homework.detail.duePrefix": "À rendre le ",
    "homework.detail.authorPrefix": "Par ",
    "homework.detail.markUndone": "Marquer comme non fait",
    "homework.detail.markDone": "Marquer comme fait",
    "homework.detail.instructionsTitle": "Consignes",
    "homework.detail.noInstructions": "Aucune consigne détaillée.",
    "homework.detail.openInlineImage": "Ouvrir l'image insérée",
    "homework.detail.attachmentsTitle": "Pièces jointes",
    "homework.detail.noAttachments": "Aucune pièce jointe.",
    "homework.detail.studentsTitle": "Suivi des élèves",
    "homework.detail.summarySuffix": "homework faits",
    "homework.detail.noStudentData":
      "Aucune donnée élève pour ce homework.",
    "homework.detail.commentsTitle": "Commentaires",
    "homework.detail.notFoundTitle": "Homework introuvable",
    "homework.detail.notFoundMessage":
      "Impossible d'afficher le détail demandé.",

    "homework.dialog.deleteTitle": "Supprimer ce homework ?",
    "homework.dialog.deleteMessage": "Cette action est irréversible.",
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

    "discipline.types.absence": "Absence",
    "discipline.types.absencePlural": "ABSENCES",
    "discipline.types.retard": "Late arrival",
    "discipline.types.retardPlural": "LATE ARRIVALS",
    "discipline.types.sanction": "Sanction",
    "discipline.types.sanctionPlural": "SANCTIONS",
    "discipline.types.punition": "Punishment",
    "discipline.types.punitionPlural": "PUNISHMENTS",

    "discipline.validation.dateRequired": "Date is required.",
    "discipline.validation.dateInvalid": "Date is invalid.",
    "discipline.validation.reasonRequired": "Reason is required.",
    "discipline.validation.durationPositive":
      "Duration must be a positive integer.",
    "discipline.validation.studentRequired": "Choose a student.",

    "discipline.form.title": "Discipline",
    "discipline.form.eyebrowCreate": "New event",
    "discipline.form.eyebrowEdit": "Edit",
    "discipline.form.fields.type": "Event type",
    "discipline.form.fields.typeRequired": "Event type *",
    "discipline.form.fields.student": "Student",
    "discipline.form.fields.studentPlaceholder": "Choose a student",
    "discipline.form.fields.dateTime": "Date and time",
    "discipline.form.fields.dateTimeRequired": "Date and time *",
    "discipline.form.fields.dateTimePlaceholder": "2026-04-09T08:30",
    "discipline.form.fields.dateTimePlaceholderIso": "YYYY-MM-DDTHH:mm",
    "discipline.form.fields.reason": "Reason",
    "discipline.form.fields.reasonRequired": "Reason *",
    "discipline.form.fields.reasonPlaceholder":
      "E.g.: unsubmitted work, unjustified absence…",
    "discipline.form.fields.reasonPlaceholderShort": "E.g.: bus arrived late",
    "discipline.form.fields.duration": "Duration (minutes)",
    "discipline.form.fields.durationOptional": "Duration (minutes, optional)",
    "discipline.form.fields.durationPlaceholder": "E.g.: 15",
    "discipline.form.fields.durationPlaceholderAlt": "E.g.: 40",
    "discipline.form.fields.description": "Description",
    "discipline.form.fields.justified": "Justified",
    "discipline.form.fields.justifiedHint":
      "Absence or lateness justified by parents / administration",
    "discipline.form.fields.justifiedHintAlt":
      "Absence or lateness approved by parents or administration",
    "discipline.form.fields.comment": "Comment",
    "discipline.form.fields.commentOptional": "Comment (optional)",
    "discipline.form.fields.commentPlaceholder": "Additional observations…",
    "discipline.form.fields.commentPlaceholderAlt": "Additional observations",
    "discipline.form.buttons.cancel": "Cancel",
    "discipline.form.buttons.create": "Create event",
    "discipline.form.buttons.edit": "Save changes",

    "discipline.studentSelect.placeholder": "Choose a student",
    "discipline.studentSelect.allStudents": "All students",
    "discipline.studentSelect.search": "Search for a student",

    "discipline.card.showDetails": "View details",
    "discipline.card.hideDetails": "Hide details",
    "discipline.card.duration": "Duration",
    "discipline.card.justifiedYes": "Yes",
    "discipline.card.justifiedNo": "No",
    "discipline.card.class": "Class",
    "discipline.card.schoolYear": "School year",
    "discipline.card.editAria": "Edit this event",
    "discipline.card.deleteAria": "Delete this event",

    "discipline.kpi.absences": "ABSENCES",
    "discipline.kpi.retards": "LATE ARRIVALS",
    "discipline.kpi.sanctions": "SANCTIONS",
    "discipline.kpi.punitions": "PUNISHMENTS",

    "discipline.summary.allGoodTitle": "All good!",
    "discipline.summary.allGoodSubtitle":
      "No school life event recorded for the current year.",
    "discipline.summary.currentYear": "This school year",
    "discipline.summary.showAll": "Show all",
    "discipline.summary.noEventsOfType": "No events of this type.",
    "discipline.summary.recentEvents": "Recent events",
    "discipline.summary.recentEventsFiltered": "Recent events: {type}",
    "discipline.summary.unjustifiedPrefixOne": "{count} unjustified absence",
    "discipline.summary.unjustifiedPrefixMany": "{count} unjustified absences",
    "discipline.summary.unjustifiedSuffixOne": "this year.",
    "discipline.summary.unjustifiedSuffixMany": "this year.",

    "discipline.list.emptyTitle": "No events",
    "discipline.list.emptySubtitle": "No events recorded for this period.",
    "discipline.list.endOfList": "All events have been loaded",

    "discipline.delete.title": "Delete this event?",
    "discipline.delete.irreversible": "This action cannot be undone.",
    "discipline.delete.willBeDeleted": "will be permanently deleted.",
    "discipline.delete.cancel": "Cancel",
    "discipline.delete.confirm": "Delete",
    "discipline.delete.confirmAria": "Confirm deletion",

    "discipline.tabs.synthesis": "Summary",
    "discipline.tabs.absencesRetards": "Absences & Lateness",
    "discipline.tabs.sanctionsPunitions": "Sanctions & Punishments",
    "discipline.tabs.events": "Events",
    "discipline.tabs.booklets": "Records",
    "discipline.tabs.history": "History",
    "discipline.tabs.students": "Students",
    "discipline.tabs.byClass": "By class",

    "discipline.errors.loadData": "Unable to load data. Please try again.",
    "discipline.errors.refreshData": "Unable to refresh data.",
    "discipline.errors.loadHistory": "Unable to load history.",
    "discipline.errors.loadContext": "Unable to load discipline context.",
    "discipline.errors.loadEvents": "Unable to load discipline events.",
    "discipline.errors.loadYearsClasses": "Unable to load years and classes.",
    "discipline.errors.loadClassStudents":
      "Unable to load students for this class.",
    "discipline.errors.saveGeneric": "Error while saving.",
    "discipline.errors.deleteGeneric": "Error while deleting.",
    "discipline.errors.saveTitle": "Unable to save",
    "discipline.errors.deleteTitle": "Unable to delete",
    "discipline.retry": "Retry",

    "discipline.toasts.eventUpdatedTitle": "Event updated",
    "discipline.toasts.eventUpdatedMessage": "Changes have been saved.",
    "discipline.toasts.eventUpdatedMessageClassUpdated":
      "The discipline record has been updated.",
    "discipline.toasts.eventUpdatedMessageClassUpdatedAlt":
      "The discipline record has been updated.",
    "discipline.toasts.eventCreatedTitle": "Event created",
    "discipline.toasts.eventRegisteredTitle": "Event saved",
    "discipline.toasts.eventCreatedMessageHistory":
      "The event has been added to the discipline history.",
    "discipline.toasts.eventCreatedMessageClass":
      "The event has been added to the class history.",
    "discipline.toasts.eventCreatedMessageGlobal":
      "The event has been added to the history.",
    "discipline.toasts.eventDeletedTitle": "Event deleted",
    "discipline.toasts.eventDeletedMessageHistory":
      "The event has been removed from the discipline history.",
    "discipline.toasts.eventDeletedMessageModule":
      "The event has been removed from the discipline module.",

    "discipline.header.discipline": "Discipline",
    "discipline.header.vieScolaire": "School life",
    "discipline.header.student": "Student",

    "discipline.fab.addEvent": "Add a discipline event",

    "discipline.empty.discipline.title": "Discipline unavailable",
    "discipline.empty.discipline.message":
      "The class context could not be resolved.",
    "discipline.empty.noClassEvents.title": "No discipline events",
    "discipline.empty.noClassEvents.message":
      "No events have been recorded for this class yet.",
    "discipline.empty.chooseStudent.title": "Choose a student",
    "discipline.empty.chooseStudentClass.message":
      "The school life summary appears here once a student in the class is selected.",
    "discipline.empty.chooseStudentGlobal.message":
      "The school life summary appears here once a student is selected.",
    "discipline.empty.searchStudent.title": "Search for a student",
    "discipline.empty.searchStudent.message":
      "Type a name to search across all classes, or select a class first.",
    "discipline.empty.noStudent.title": "No student",
    "discipline.empty.noStudent.messageSearch":
      "No student matches this search.",
    "discipline.empty.noStudent.messageClass": "This class has no students.",
    "discipline.empty.chooseClass.title": "Select a class",
    "discipline.empty.chooseClass.message":
      "Choose a class to display discipline events.",
    "discipline.empty.noEventsHistory.title": "No events",
    "discipline.empty.noEventsHistory.message":
      "Tap + to record a first event.",
    "discipline.empty.noAbsence.title": "No absences or lateness",
    "discipline.empty.noAbsence.message":
      "No absence or lateness has been recorded for the current year.",
    "discipline.empty.noSanction.title": "No sanctions or punishments",
    "discipline.empty.noSanction.message":
      "No sanction or punishment has been recorded for the current year.",

    "discipline.loading.students": "Loading students...",
    "discipline.loading.class": "Loading class...",
    "discipline.loading.generic": "Loading...",

    "discipline.sections.classEvents.title": "Class events",
    "discipline.sections.classEvents.subtitle":
      "Browse and filter the history from most recent to oldest.",
    "discipline.sections.booklets.title": "Records",
    "discipline.sections.booklets.subtitle":
      "Select a student to view their school life summary.",
    "discipline.sections.searchStudents.title": "Search for a student",
    "discipline.sections.searchStudents.subtitle":
      "Filter by class or type a name to search across all classes.",
    "discipline.sections.byClass.title": "By-class view",
    "discipline.sections.byClass.subtitle": "Select a year and a class.",

    "discipline.filters.student": "Student",
    "discipline.filters.allStudents": "All students",
    "discipline.filters.year": "Year",
    "discipline.filters.class": "Class",
    "discipline.filters.allClasses": "All classes",
    "discipline.filters.selectYear": "Choose a year",
    "discipline.filters.selectClass": "Select a class",
    "discipline.filters.searchByName": "Search by name",
    "discipline.filters.searchByStudent": "Search by student",

    "discipline.adminTabs.students": "Students",
    "discipline.adminTabs.byClass": "By class",

    "discipline.parent.title": "School life",
    "discipline.parent.empty.absencesRetards.title": "No absences or lateness",
    "discipline.parent.empty.absencesRetards.message":
      "No absence or lateness has been recorded for the current year.",
    "discipline.parent.empty.sanctionsPunitions.title":
      "No sanctions or punishments",
    "discipline.parent.empty.sanctionsPunitions.message":
      "No sanction or punishment has been recorded for the current year.",

    "homework.tabs.list": "List",
    "homework.tabs.agenda": "Homework agenda",
    "homework.tabs.week": "Week",
    "homework.tabs.month": "Month",

    "homework.form.validation.subjectRequired": "Subject is required.",
    "homework.form.validation.titleRequired": "Title is required.",
    "homework.form.validation.dateRequired": "Due date is required.",
    "homework.form.validation.timeRequired": "Due time is required.",
    "homework.form.validation.commentRequired": "Comment cannot be empty.",

    "homework.colors.black": "Black",
    "homework.colors.blue": "Blue",
    "homework.colors.green": "Green",
    "homework.colors.red": "Red",

    "homework.card.details": "Details",
    "homework.card.markDone": "Mark done",
    "homework.card.edit": "Edit",
    "homework.card.delete": "Delete",
    "homework.card.expectedDatePrefix": "Due date: ",
    "homework.card.doneOnPrefix": "Done on ",
    "homework.card.attachmentsSuffix": "files",

    "homework.status.done": "Done",
    "homework.status.pending": "Pending",
    "homework.status.notDone": "Not done",

    "homework.common.loading": "Loading...",
    "homework.common.cancel": "Cancel",
    "homework.common.save": "Save",
    "homework.common.saving": "Saving...",
    "homework.common.doneSuffix": "done",

    "homework.comment.empty": "No comments yet.",
    "homework.comment.placeholder": "Add a comment",

    "homework.control.title": "Homework tracking",
    "homework.control.doneStudentsTitle":
      "Students who already completed it",
    "homework.control.summarySuffix": "done",
    "homework.control.noStudentDone":
      "No student has marked this homework as done yet.",
    "homework.control.unavailableTitle": "Tracking unavailable",
    "homework.control.unavailableMessage":
      "Unable to load the student list for this homework.",

    "homework.form.colorMenu.title": "Text color",
    "homework.form.colorMenu.message": "Choose a color",
    "homework.form.permission.title": "Permission required",
    "homework.form.permission.message": "Allow access to your photos.",
    "homework.form.editTitle": "Edit homework",
    "homework.form.createTitle": "New homework",
    "homework.form.subjectLabel": "Subject",
    "homework.form.titleLabel": "Title",
    "homework.form.titlePlaceholder": "E.g. Fractions exercise",
    "homework.form.expectedDateLabel": "Due date",
    "homework.form.datePlaceholder": "Choose a date",
    "homework.form.expectedTimeLabel": "Due time",
    "homework.form.timePlaceholder": "Time",
    "homework.form.contentLabel": "Content",
    "homework.form.insertingImage": "Inserting image...",
    "homework.form.contentPlaceholder":
      "Instructions, resources, useful links...",
    "homework.form.attachmentsTitle": "Attachments",
    "homework.form.attachmentsSubtitle":
      "Images, PDF, Word, Excel and other school documents",
    "homework.form.noAttachments": "No attachments yet.",

    "homework.errors.title": "Error",
    "homework.errors.insertImage": "Unable to insert the image.",
    "homework.errors.addAttachment": "Unable to add this attachment.",
    "homework.errors.openAttachment": "Unable to open this attachment.",
    "homework.errors.loadContext": "Unable to load the homework context.",

    "homework.header.title": "Homework",
    "homework.loading.module": "Loading the homework module...",
    "homework.loading.control": "Loading tracking...",
    "homework.loading.detail": "Loading details...",

    "homework.agenda.thisWeek": "This week",
    "homework.agenda.thisMonth": "This month",
    "homework.agenda.dayTitle": "Homework for the selected day",
    "homework.agenda.monthDayTitle": "Agenda for the selected day",
    "homework.agenda.noDaySelected": "No day selected",

    "homework.empty.title": "No homework",
    "homework.empty.list": "No homework is scheduled from today.",
    "homework.empty.endOfList": "All upcoming homework is displayed",
    "homework.empty.week":
      "No homework is scheduled for this day of the week.",
    "homework.empty.month": "No homework is scheduled for this day.",

    "homework.label": "Homework",
    "homework.kpi.notDone": "not done",
    "homework.kpi.unknownClass": "Unknown class",
    "homework.section.empty": "No homework in progress",

    "homework.toast.updatedTitle": "Homework updated",
    "homework.toast.updatedMessage": "The instructions have been saved.",
    "homework.toast.createdTitle": "Homework created",
    "homework.toast.createdMessage":
      "The new homework has been added to the agenda.",
    "homework.toast.saveErrorTitle": "Unable to save",
    "homework.toast.saveErrorMessage": "Unable to save this homework.",
    "homework.toast.deletedTitle": "Homework deleted",
    "homework.toast.deletedMessage": "The homework has been removed.",
    "homework.toast.deleteErrorTitle": "Unable to delete",
    "homework.toast.deleteErrorMessage": "Unable to delete this homework.",
    "homework.toast.reopenedTitle": "Homework reopened",
    "homework.toast.reopenedMessage":
      "The homework is marked as not done again.",
    "homework.toast.completedTitle": "Homework completed",
    "homework.toast.completedMessage": "The homework is marked as done.",
    "homework.toast.statusErrorTitle": "Unable to update",
    "homework.toast.statusErrorMessage":
      "Unable to update the homework status.",
    "homework.toast.commentAddedTitle": "Comment added",
    "homework.toast.commentAddedMessage": "The comment has been saved.",
    "homework.toast.commentErrorTitle": "Unable to add comment",
    "homework.toast.commentErrorMessage": "Unable to add the comment.",

    "homework.detail.title": "Homework details",
    "homework.detail.duePrefix": "Due on ",
    "homework.detail.authorPrefix": "By ",
    "homework.detail.markUndone": "Mark as not done",
    "homework.detail.markDone": "Mark as done",
    "homework.detail.instructionsTitle": "Instructions",
    "homework.detail.noInstructions": "No detailed instructions.",
    "homework.detail.openInlineImage": "Open inserted image",
    "homework.detail.attachmentsTitle": "Attachments",
    "homework.detail.noAttachments": "No attachments.",
    "homework.detail.studentsTitle": "Student tracking",
    "homework.detail.summarySuffix": "homework done",
    "homework.detail.noStudentData": "No student data for this homework.",
    "homework.detail.commentsTitle": "Comments",
    "homework.detail.notFoundTitle": "Homework not found",
    "homework.detail.notFoundMessage":
      "Unable to display the requested details.",

    "homework.dialog.deleteTitle": "Delete this homework?",
    "homework.dialog.deleteMessage": "This action cannot be undone.",
  },
};
