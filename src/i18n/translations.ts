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
    "apiErrors.apiUnreachable":
      "Le serveur est inaccessible. Vérifiez que l'API est démarrée (port 3001).",
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
    "discipline.form.fields.date": "Date",
    "discipline.form.fields.time": "Heure",
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
    "discipline.form.hero.createTitle": "Nouvel événement de discipline",
    "discipline.form.hero.editTitle": "Modifier l'événement",
    "discipline.form.hero.createSubtitle":
      "Renseignez l'élève, le type et le motif de l'événement.",
    "discipline.form.hero.editSubtitle":
      "Mettez à jour les informations de cet événement de discipline.",

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

    "discipline.filters.title": "Filtres",
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
    "homework.control.doneStudentsTitle": "Élèves ayant déjà fait le devoir",
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
    "homework.errors.addAttachment": "Impossible d'ajouter cette pièce jointe.",
    "homework.errors.openAttachment": "Impossible d'ouvrir cette pièce jointe.",
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
    "homework.empty.list": "Aucun homework n'est prévu à partir d'aujourd'hui.",
    "homework.empty.endOfList": "Tous les homeworks à venir sont affichés",
    "homework.empty.week":
      "Aucun homework n'est prévu sur ce jour de la semaine.",
    "homework.empty.month": "Aucun homework n'est prévu pour cette journée.",

    "homework.label": "Devoirs",
    "homework.kpi.notDone": "non faits",
    "homework.kpi.unknownClass": "Classe inconnue",
    "homework.section.empty": "Aucun devoir en cours",

    "homework.toast.updatedTitle": "Homework mis à jour",
    "homework.toast.updatedMessage": "Les consignes ont bien été enregistrées.",
    "homework.toast.createdTitle": "Homework créé",
    "homework.toast.createdMessage":
      "Le nouveau homework a été ajouté à l'agenda.",
    "homework.toast.saveErrorTitle": "Enregistrement impossible",
    "homework.toast.saveErrorMessage": "Impossible d'enregistrer ce homework.",
    "homework.toast.deletedTitle": "Homework supprimé",
    "homework.toast.deletedMessage": "Le homework a bien été retiré.",
    "homework.toast.deleteErrorTitle": "Suppression impossible",
    "homework.toast.deleteErrorMessage": "Impossible de supprimer ce homework.",
    "homework.toast.reopenedTitle": "Homework rouvert",
    "homework.toast.reopenedMessage": "Le homework est repassé en non fait.",
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
    "homework.detail.noStudentData": "Aucune donnée élève pour ce homework.",
    "homework.detail.commentsTitle": "Commentaires",
    "homework.detail.notFoundTitle": "Homework introuvable",
    "homework.detail.notFoundMessage":
      "Impossible d'afficher le détail demandé.",

    "homework.dialog.deleteTitle": "Supprimer ce homework ?",
    "homework.dialog.deleteMessage": "Cette action est irréversible.",

    "timetable.common.thisWeek": "Cette semaine",
    "timetable.common.thisMonth": "Ce mois",
    "timetable.common.cancel": "Annuler",
    "timetable.common.update": "Mettre à jour",
    "timetable.common.roomToConfirm": "Salle à confirmer",
    "timetable.common.noCourseTitle": "Aucun cours",
    "timetable.common.loadingAgenda": "Chargement de l'agenda...",
    "timetable.common.weekSelectedSlotLabel": "CRÉNEAU SÉLECTIONNÉ",
    "timetable.common.weekSelectedSlotPlaceholder":
      "Sélectionnez un créneau dans le tableau pour afficher son détail.",
    "timetable.common.statusPlanned": "Prévu",
    "timetable.common.statusCancelled": "Annulé",
    "timetable.common.sourceException": "Exception",
    "timetable.common.sourceAdjusted": "Ajusté",
    "timetable.common.courseCancelled": "Cours annulé",
    "timetable.common.noClosureTitle": "Aucune fermeture enregistrée",
    "timetable.common.noClosureMessage":
      "Les jours fériés et vacances créés pour l'école apparaîtront ici.",
    "timetable.common.unknownSchoolYear": "Année non définie",
    "timetable.common.viewDay": "Jour",
    "timetable.common.viewWeek": "Semaine",
    "timetable.common.viewMonth": "Mois",
    "timetable.common.today": "Aujourd'hui",
    "timetable.common.edit": "MODIFIER",

    "timetable.weekdays.monFull": "Lundi",
    "timetable.weekdays.tueFull": "Mardi",
    "timetable.weekdays.wedFull": "Mercredi",
    "timetable.weekdays.thuFull": "Jeudi",
    "timetable.weekdays.friFull": "Vendredi",
    "timetable.weekdays.satFull": "Samedi",
    "timetable.weekdays.sunFull": "Dimanche",
    "timetable.weekdays.monCompact": "L",
    "timetable.weekdays.tueCompact": "M",
    "timetable.weekdays.wedCompact": "M",
    "timetable.weekdays.thuCompact": "J",
    "timetable.weekdays.friCompact": "V",
    "timetable.weekdays.satCompact": "S",
    "timetable.weekdays.sunCompact": "D",

    "timetable.childAgenda.emptyDayMessage":
      "Aucun créneau n'est prévu pour cette journée.",
    "timetable.childAgenda.unavailableTitle":
      "Impossible d'afficher ce planning",
    "timetable.childAgenda.unavailableMessage":
      "Vérifiez que l'enfant est bien lié à ce compte parent.",
    "timetable.childAgenda.roomPrefix": "SALLE",
    "timetable.childAgenda.monthAgendaLabel": "AGENDA DU JOUR SELECTIONNE",
    "timetable.childAgenda.detail.subject": "Matière :",
    "timetable.childAgenda.detail.class": "Classe :",
    "timetable.childAgenda.detail.day": "Jour :",
    "timetable.childAgenda.detail.time": "Horaire :",
    "timetable.childAgenda.detail.teacher": "Enseignant :",
    "timetable.childAgenda.detail.room": "Salle :",

    "timetable.classesScreen.headerTitle": "Mes classes",
    "timetable.classesScreen.schoolYear.title": "Année scolaire",
    "timetable.classesScreen.schoolYear.subtitle":
      "Filtrez vos classes pour garder un périmètre clair avant de gérer le planning.",
    "timetable.classesScreen.schoolYear.label": "Année",
    "timetable.classesScreen.schoolYear.activeSuffix": "active",
    "timetable.classesScreen.classes.title": "Classes accessibles",
    "timetable.classesScreen.classes.subtitle":
      "Le module ouvre la page agenda mobile de la classe. Les restrictions backend du rôle enseignant restent respectées.",
    "timetable.classesScreen.loading": "Chargement des classes...",
    "timetable.classesScreen.empty.title": "Aucune classe trouvée",
    "timetable.classesScreen.empty.message":
      "Aucune affectation exploitable n'a été trouvée sur cette année.",
    "timetable.classesScreen.studentSingular": "élève",
    "timetable.classesScreen.studentPlural": "élèves",

    "timetable.teacherAgenda.headerTitle": "Agenda",
    "timetable.teacherAgenda.tabs.users": "Utilisateurs",
    "timetable.teacherAgenda.tabs.classes": "Classes",
    "timetable.teacherAgenda.tabs.mine": "Mon agenda",
    "timetable.teacherAgenda.tabs.myClasses": "Mes classes",
    "timetable.teacherAgenda.classTabLabelDefault": "Agenda de classe",
    "timetable.teacherAgenda.classTabLabelPrefix": "Agenda",
    "timetable.teacherAgenda.errors.loadMyAgenda":
      "Impossible de charger votre agenda pour le moment.",
    "timetable.teacherAgenda.errors.loadTeachers":
      "Impossible de charger la liste des enseignants.",
    "timetable.teacherAgenda.errors.loadTeacherAgenda":
      "Impossible de charger l'agenda de cet enseignant.",
    "timetable.teacherAgenda.searchTeacherPlaceholder":
      "Chercher un enseignant...",
    "timetable.teacherAgenda.loadingTeachers": "Chargement des enseignants...",
    "timetable.teacherAgenda.noResultTitle": "Aucun résultat",
    "timetable.teacherAgenda.noResultMessage":
      "Aucun enseignant ne correspond à votre recherche.",
    "timetable.teacherAgenda.emptyMessageMine":
      "Aucun créneau n'est planifié pour vous sur cette période.",
    "timetable.teacherAgenda.emptyMessageTeacher":
      "Aucun créneau planifié pour cet enseignant sur cette période.",
    "timetable.teacherAgenda.emptyMessageClass":
      "Aucun créneau planifié pour cette classe sur cette période.",
    "timetable.teacherAgenda.selectTeacherTitle": "Sélectionnez un enseignant",
    "timetable.teacherAgenda.selectTeacherMessage":
      "Choisissez un enseignant ci-dessus pour consulter son agenda.",
    "timetable.teacherAgenda.loadingClasses": "Chargement des classes...",
    "timetable.teacherAgenda.noClassTitle": "Aucune classe accessible",
    "timetable.teacherAgenda.noClassMessage":
      "Aucune affectation trouvée pour ce profil.",
    "timetable.teacherAgenda.selectClassPlaceholder": "Sélectionner une classe",
    "timetable.teacherAgenda.chooseClassTitle": "Choisir une classe",

    "timetable.classManager.defaultTitle": "Emploi du temps",
    "timetable.classManager.headerSubtitle": "Emploi du temps de la classe",
    "timetable.classManager.dateRangeTo": "au",
    "timetable.classManager.validation.chooseSubject":
      "Choisissez une matière.",
    "timetable.classManager.validation.chooseTeacher":
      "Choisissez un enseignant.",
    "timetable.classManager.validation.timeFormat": "Format HH:MM attendu.",
    "timetable.classManager.validation.dateFormat":
      "Format AAAA-MM-JJ attendu.",
    "timetable.classManager.validation.holidayLabelRequired":
      "Le libellé de fermeture est obligatoire.",
    "timetable.classManager.validation.startLabel": "Début",
    "timetable.classManager.validation.endLabel": "Fin",
    "timetable.classManager.validation.timeFormatError":
      "doit être au format HH:MM.",
    "timetable.classManager.toast.slotUpdatedTitle": "Créneau mis à jour",
    "timetable.classManager.toast.slotUpdatedMessage":
      "Le planning hebdomadaire a été actualisé.",
    "timetable.classManager.toast.slotCreatedTitle": "Créneau ajouté",
    "timetable.classManager.toast.slotCreatedMessage":
      "Le nouveau cours apparaît maintenant dans l'agenda.",
    "timetable.classManager.toast.slotsCreatedMultiMessage":
      "Les créneaux ont été ajoutés à l'agenda.",
    "timetable.classManager.toast.slotRejectedTitle": "Créneau refusé",
    "timetable.classManager.toast.slotRejectedMessage":
      "Impossible d'enregistrer ce créneau.",
    "timetable.classManager.toast.oneOffUpdatedTitle": "Séance modifiée",
    "timetable.classManager.toast.oneOffUpdatedMessage":
      "L'exception de planning a été mise à jour.",
    "timetable.classManager.toast.oneOffCreatedTitle":
      "Séance exceptionnelle ajoutée",
    "timetable.classManager.toast.oneOffCreatedMessage":
      "Le créneau ponctuel apparaît maintenant dans l'agenda.",
    "timetable.classManager.toast.oneOffRejectedTitle":
      "Séance non enregistrée",
    "timetable.classManager.toast.oneOffRejectedMessage":
      "Impossible d'enregistrer cette séance.",
    "timetable.classManager.toast.holidayUpdatedTitle": "Fermeture mise à jour",
    "timetable.classManager.toast.holidayUpdatedMessage":
      "Le calendrier école a été actualisé.",
    "timetable.classManager.toast.holidayCreatedTitle": "Fermeture ajoutée",
    "timetable.classManager.toast.holidayCreatedMessage":
      "Le calendrier de l'école a été mis à jour.",
    "timetable.classManager.toast.holidayRejectedTitle": "Fermeture refusée",
    "timetable.classManager.toast.holidayRejectedMessage":
      "Impossible d'enregistrer cette fermeture.",
    "timetable.classManager.toast.slotDeletedTitle": "Créneau supprimé",
    "timetable.classManager.toast.slotDeletedMessage":
      "Le cours hebdomadaire ne fait plus partie du planning.",
    "timetable.classManager.toast.deleteImpossibleTitle":
      "Suppression impossible",
    "timetable.classManager.toast.slotDeleteErrorMessage":
      "Impossible de supprimer ce créneau.",
    "timetable.classManager.toast.oneOffDeletedTitle": "Séance supprimée",
    "timetable.classManager.toast.oneOffDeletedMessage":
      "Le créneau ponctuel ne figure plus dans l'agenda.",
    "timetable.classManager.toast.oneOffDeleteErrorMessage":
      "Impossible de supprimer cette séance.",
    "timetable.classManager.toast.holidayDeletedTitle": "Fermeture supprimée",
    "timetable.classManager.toast.holidayDeletedMessage":
      "Le calendrier école a été mis à jour.",
    "timetable.classManager.toast.holidayDeleteErrorMessage":
      "Impossible de supprimer cette fermeture.",
    "timetable.classManager.nav.title": "Navigation",
    "timetable.classManager.nav.subtitle":
      "Passez du planning visualisé aux formulaires de gestion.",
    "timetable.classManager.nav.tabLabel": "Onglet",
    "timetable.classManager.nav.tabAgenda": "Agenda",
    "timetable.classManager.nav.tabSlots": "Créneaux",
    "timetable.classManager.nav.tabOneOff": "Exceptions",
    "timetable.classManager.nav.tabHolidays": "Fermetures",
    "timetable.classManager.loadingTitle": "Chargement",
    "timetable.classManager.loadingClass": "Chargement de la classe...",
    "timetable.classManager.accessTitle": "Accès",
    "timetable.classManager.accessDeniedTitle": "Classe indisponible",
    "timetable.classManager.accessDeniedMessage":
      "Le backend n'autorise peut-être pas la gestion de cette classe pour votre rôle.",
    "timetable.classManager.agenda.title": "Agenda consolidé",
    "timetable.classManager.agenda.subtitle":
      "Vue unifiée des créneaux récurrents, ajustements et annulations.",
    "timetable.classManager.agenda.emptyTitle": "Aucun créneau chargé",
    "timetable.classManager.agenda.emptyMessage":
      "Commencez par ajouter un créneau ou élargir la période côté écran.",
    "timetable.classManager.slots.editTitle": "Modifier un créneau",
    "timetable.classManager.slots.newTitle": "Nouveau créneau hebdomadaire",
    "timetable.classManager.slots.subtitle":
      "Le formulaire reste scrollable pour laisser de la place au clavier et sécuriser la saisie E2E.",
    "timetable.classManager.fields.subject": "Matière",
    "timetable.classManager.fields.teacher": "Enseignant",
    "timetable.classManager.fields.day": "Jour",
    "timetable.classManager.fields.days": "Jours de la semaine",
    "timetable.classManager.validation.chooseDays":
      "Sélectionnez au moins un jour.",
    "timetable.classManager.fields.start": "Début",
    "timetable.classManager.fields.end": "Fin",
    "timetable.classManager.fields.room": "Salle",
    "timetable.classManager.fields.roomNone": "Aucune",
    "timetable.classManager.room.statusUnavailable": "indisponible",
    "timetable.classManager.room.statusMaintenance": "en maintenance",
    "timetable.classManager.room.statusFull": "complet",
    "timetable.classManager.fields.activeFrom": "Actif du",
    "timetable.classManager.fields.activeTo": "Actif au",
    "timetable.classManager.fields.date": "Date",
    "timetable.classManager.fields.status": "Statut",
    "timetable.classManager.fields.label": "Libellé",
    "timetable.classManager.placeholders.isoDate": "AAAA-MM-JJ",
    "timetable.classManager.placeholders.holidayLabel": "Fête de la jeunesse",
    "timetable.classManager.timePicker.startTitle": "Heure de début",
    "timetable.classManager.timePicker.endTitle": "Heure de fin",
    "timetable.classManager.weekdays.mon": "Lun",
    "timetable.classManager.weekdays.tue": "Mar",
    "timetable.classManager.weekdays.wed": "Mer",
    "timetable.classManager.weekdays.thu": "Jeu",
    "timetable.classManager.weekdays.fri": "Ven",
    "timetable.classManager.weekdays.sat": "Sam",
    "timetable.classManager.weekdays.sun": "Dim",
    "timetable.classManager.buttons.updateSlot": "Mettre à jour",
    "timetable.classManager.buttons.addSlot": "Ajouter le créneau",
    "timetable.classManager.buttons.updateOneOff": "Mettre à jour",
    "timetable.classManager.buttons.addOneOff": "Ajouter la séance",
    "timetable.classManager.buttons.updateHoliday": "Mettre à jour",
    "timetable.classManager.buttons.addHoliday": "Ajouter la fermeture",
    "timetable.classManager.existingSlots.title": "Créneaux existants",
    "timetable.classManager.existingSlots.subtitle":
      "Chaque ligne peut être modifiée ou supprimée.",
    "timetable.classManager.existingSlots.emptyTitle":
      "Pas encore de créneau récurrent",
    "timetable.classManager.existingSlots.emptyMessage":
      "Ajoutez le premier cours hebdomadaire pour cette classe.",
    "timetable.classManager.existingSlots.dayPrefix": "jour",
    "timetable.classManager.oneoff.editTitle": "Modifier une séance",
    "timetable.classManager.oneoff.newTitle": "Nouvelle séance ponctuelle",
    "timetable.classManager.oneoff.subtitle":
      "Utilisez cet onglet pour les permutations, remplacements et cours exceptionnels.",
    "timetable.classManager.existingOneOff.title": "Séances ponctuelles",
    "timetable.classManager.existingOneOff.subtitle":
      "Historique des exceptions déjà créées pour cette classe.",
    "timetable.classManager.existingOneOff.emptyTitle": "Aucune exception",
    "timetable.classManager.existingOneOff.emptyMessage":
      "Les cours ponctuels, reports et annulations apparaîtront ici.",
    "timetable.classManager.holidays.editTitle": "Modifier une fermeture",
    "timetable.classManager.holidays.newTitle": "Nouvelle fermeture",
    "timetable.classManager.holidays.subtitle":
      "Réservé aux rôles établissement. Sert pour congés, ponts et jours fériés.",
    "timetable.classManager.holidays.calendarTitle": "Calendrier établissement",
    "timetable.classManager.holidays.calendarSubtitle":
      "Événements école répercutés dans la lecture des emplois du temps.",

    "timetable.oneOffPanel.title": "Nouveau créneau",
    "timetable.oneOffPanel.fields.class": "Classe",
    "timetable.oneOffPanel.slotType.oneoff": "Ponctuel",
    "timetable.oneOffPanel.slotType.recurring": "Récurrent",
    "timetable.oneOffPanel.fields.activeFrom": "À partir du",
    "timetable.oneOffPanel.fields.activeTo": "Jusqu'au (optionnel)",
    "timetable.oneOffPanel.fields.weekdayLabel": "Jour",
    "timetable.oneOffPanel.addButton": "Ajouter ce créneau",
    "timetable.oneOffPanel.addRecurringButton": "Ajouter ce créneau récurrent",
    "timetable.oneOffPanel.contextError":
      "Impossible de charger le contexte de la classe.",
    "timetable.oneOffPanel.validation.chooseClass": "Choisissez une classe.",
    "timetable.oneOffPanel.validation.startRequired":
      "Renseignez l'heure de début.",
    "timetable.oneOffPanel.validation.endRequired":
      "Renseignez l'heure de fin.",
    "timetable.oneOffPanel.validation.roomRequired": "Renseignez une salle.",
    "timetable.oneOffPanel.validation.endAfterStart":
      "La fin doit être après le début.",
    "timetable.oneOffPanel.validation.activeFromRequired":
      "Renseignez la date de début.",
    "timetable.oneOffPanel.validation.activeToAfterFrom":
      "La date de fin doit être après la date de début.",
    "timetable.oneOffPanel.toasts.createdTitle": "Séance ajoutée",
    "timetable.oneOffPanel.toasts.createdMessage":
      "Le créneau apparaît maintenant dans l'agenda.",
    "timetable.oneOffPanel.toasts.recurringCreatedTitle":
      "Créneau récurrent ajouté",
    "timetable.oneOffPanel.toasts.recurringCreatedMessage":
      "Le créneau récurrent a été créé dans l'emploi du temps.",
    "timetable.oneOffPanel.toasts.createErrorTitle": "Création impossible",

    "timetable.slotScreen.headerTitle": "Schedule",
    "timetable.slotScreen.create.heroTitle": "Créer un créneau",
    "timetable.slotScreen.edit.heroTitle": "Modifier un créneau",
    "timetable.slotScreen.heroSubtitle": "Définir la date, l'heure et la salle",

    "timetable.slotEditPanel.title": "MODIFIER CE CRÉNEAU",
    "timetable.slotEditPanel.scope.occurrence": "Ce créneau",
    "timetable.slotEditPanel.scope.series": "Toute la série",
    "timetable.slotEditPanel.validation.startRequired":
      "Renseignez l'heure de début.",
    "timetable.slotEditPanel.validation.endRequired":
      "Renseignez l'heure de fin.",
    "timetable.slotEditPanel.validation.roomRequired": "Renseignez une salle.",
    "timetable.slotEditPanel.validation.endAfterStart":
      "La fin doit être après le début.",
    "timetable.slotEditPanel.buttons.back": "Retour",
    "timetable.slotEditPanel.buttons.delete": "Supprimer",
    "timetable.slotEditPanel.buttons.save": "Modifier",
    "timetable.slotEditPanel.confirm.deleteSeriesTitle":
      "Supprimer toute la série ?",
    "timetable.slotEditPanel.confirm.deleteOccurrenceTitle":
      "Supprimer ce créneau ?",
    "timetable.slotEditPanel.confirm.deleteSeriesMessage":
      "Tous les cours de cette série hebdomadaire seront supprimés.",
    "timetable.slotEditPanel.confirm.deleteOccurrenceMessage":
      "Ce cours sera annulé pour cette date uniquement.",
    "timetable.slotEditPanel.toasts.seriesUpdatedTitle": "Série modifiée",
    "timetable.slotEditPanel.toasts.seriesUpdatedMessage":
      "Tous les cours de cette série ont été mis à jour.",
    "timetable.slotEditPanel.toasts.slotUpdatedTitle": "Créneau modifié",
    "timetable.slotEditPanel.toasts.slotUpdatedMessage":
      "Ce cours a été mis à jour.",
    "timetable.slotEditPanel.toasts.exceptionUpdatedMessage":
      "Ce cours a été modifié pour cette date uniquement.",
    "timetable.slotEditPanel.toasts.updateErrorTitle":
      "Modification impossible",
    "timetable.slotEditPanel.toasts.seriesDeletedTitle": "Série supprimée",
    "timetable.slotEditPanel.toasts.seriesDeletedMessage":
      "Tous les cours de cette série ont été supprimés.",
    "timetable.slotEditPanel.toasts.slotDeletedTitle": "Créneau supprimé",
    "timetable.slotEditPanel.toasts.slotDeletedMessage":
      "Ce cours a été supprimé.",
    "timetable.slotEditPanel.toasts.slotCancelledTitle": "Créneau annulé",
    "timetable.slotEditPanel.toasts.slotCancelledMessage":
      "Ce cours est annulé pour cette date uniquement.",
    "timetable.slotEditPanel.toasts.deleteErrorTitle": "Suppression impossible",

    "messaging.title": "Messagerie",
    "messaging.folders.inbox": "Réception",
    "messaging.folders.sent": "Envoyés",
    "messaging.folders.drafts": "Brouillons",
    "messaging.folders.archive": "Archives",

    "messaging.list.searchPlaceholder": "Rechercher…",
    "messaging.list.searchEntry": "Rechercher un message",
    "messaging.list.emptyNoResult": "Aucun résultat",
    "messaging.list.emptyInbox": "Aucun message reçu",
    "messaging.list.emptySent": "Aucun message envoyé",
    "messaging.list.emptyDrafts": "Aucun brouillon",
    "messaging.list.emptyArchive": "Archives vides",
    "messaging.list.emptySearchHint": "Essayez avec d'autres mots-clés",
    "messaging.list.emptyDefaultHint": "Les messages apparaîtront ici",
    "messaging.list.endOfList": "Tous les messages ont été chargés",
    "messaging.list.draftTag": "Brouillon · ",
    "messaging.list.noSubject": "(sans objet)",
    "messaging.list.unknownSender": "Expéditeur inconnu",
    "messaging.list.recipientSingular": "1 destinataire",
    "messaging.list.recipientPlural": "{count} destinataires",

    "messaging.compose.titleNew": "Nouveau message",
    "messaging.compose.titleReply": "Répondre",
    "messaging.compose.titleForward": "Transférer",
    "messaging.compose.recipientsLabel": "À",
    "messaging.compose.subjectLabel": "Objet",
    "messaging.compose.subjectPlaceholder": "Objet du message",
    "messaging.compose.recipientsLoading": "Chargement des contacts…",
    "messaging.compose.recipientsPlaceholder": "Choisir des destinataires",
    "messaging.compose.recipientsError": "Choisissez au moins un destinataire.",
    "messaging.compose.bodyPlaceholder": "Rédigez votre message…",
    "messaging.compose.bodyError": "Rédigez un message avant d'envoyer.",
    "messaging.compose.subjectError": "L'objet est obligatoire.",
    "messaging.compose.insertingImage": "Insertion de l'image…",
    "messaging.compose.attachmentsTitle": "Pièces jointes ({count})",
    "messaging.compose.attachments.forwardedTag": "transféré",
    "messaging.compose.attachBtn": "Joindre",
    "messaging.compose.draftBtn": "Brouillon",
    "messaging.compose.sendBtn": "Envoyer",
    "messaging.compose.defaultDraftSubject": "Brouillon sans objet",

    "messaging.compose.insertImage.title": "Insérer une image",
    "messaging.compose.insertImage.message": "Choisissez la source",
    "messaging.compose.insertImage.gallery": "Galerie",
    "messaging.compose.insertImage.camera": "Appareil photo",
    "messaging.compose.cancel": "Annuler",

    "messaging.compose.imageEdit.title": "Modifier l'image",
    "messaging.compose.imageEdit.size": "Taille",
    "messaging.compose.imageEdit.sizeSmall": "Petite",
    "messaging.compose.imageEdit.sizeMedium": "Moyenne",
    "messaging.compose.imageEdit.sizeLarge": "Grande",
    "messaging.compose.imageEdit.sizeFull": "Pleine largeur",
    "messaging.compose.imageEdit.align": "Alignement",
    "messaging.compose.imageEdit.alignLeft": "Gauche",
    "messaging.compose.imageEdit.alignCenter": "Centre",
    "messaging.compose.imageEdit.alignRight": "Droite",
    "messaging.compose.imageEdit.delete": "Supprimer l'image",
    "messaging.compose.imageEdit.close": "Fermer",

    "messaging.compose.attachMenu.title": "Joindre un fichier",
    "messaging.compose.attachMenu.message": "Choisissez le type de contenu",
    "messaging.compose.attachMenu.takePhoto": "Prendre une photo",
    "messaging.compose.attachMenu.openGallery": "Ouvrir la galerie",
    "messaging.compose.attachMenu.insertFile": "Insérer un fichier",

    "messaging.compose.colorMenu.title": "Couleur du texte",
    "messaging.compose.colorMenu.message": "Choisissez une couleur",
    "messaging.compose.colorMenu.deepBlue": "Bleu profond",
    "messaging.compose.colorMenu.supportGreen": "Vert soutien",
    "messaging.compose.colorMenu.alertRed": "Rouge alerte",
    "messaging.compose.colorMenu.black": "Noir",

    "messaging.compose.errors.permissionDeniedTitle": "Permission refusée",
    "messaging.compose.errors.galleryPermission":
      "Autorisez l'accès à la galerie.",
    "messaging.compose.errors.cameraPermission":
      "Autorisez l'accès à la caméra.",
    "messaging.compose.errors.genericTitle": "Erreur",
    "messaging.compose.errors.insertImageFailed":
      "Impossible d'insérer l'image. Réessayez.",
    "messaging.compose.errors.documentPickerFailed":
      "Impossible d'ouvrir le sélecteur de fichiers.",

    "messaging.compose.toasts.draftSavedTitle": "Brouillon enregistré",
    "messaging.compose.toasts.draftSavedMessage":
      "Votre brouillon a bien été sauvegardé.",
    "messaging.compose.toasts.draftSaveErrorTitle": "Enregistrement impossible",
    "messaging.compose.toasts.draftSaveErrorMessage":
      "Impossible d'enregistrer le brouillon.",
    "messaging.compose.toasts.sentTitle": "Message envoyé",
    "messaging.compose.toasts.sentMessage": "Votre message a bien été envoyé.",
    "messaging.compose.toasts.sendErrorTitle": "Envoi impossible",
    "messaging.compose.toasts.sendErrorMessage":
      "Impossible d'envoyer le message. Réessayez.",

    "messaging.detail.draftBadge": "Brouillon",
    "messaging.detail.fromYou": "Vous",
    "messaging.detail.fromLabel": "De : ",
    "messaging.detail.recipientsToggleSingular": "1 destinataire",
    "messaging.detail.recipientsTogglePlural": "{count} destinataires",
    "messaging.detail.recipientsSectionTitle": "Destinataires",
    "messaging.detail.header.inboxPrefix": "Boîte de réception de {user} · ",
    "messaging.detail.header.sent": "Messages envoyés de {user} · {total}",
    "messaging.detail.header.drafts": "Brouillons de {user} · {total}",
    "messaging.detail.header.archive": "Archives de {user} · {total}",
    "messaging.detail.attachmentsTitle": "Pièces jointes",
    "messaging.detail.errors.loadFailedTitle": "Erreur",
    "messaging.detail.errors.loadFailedMessage":
      "Impossible de charger ce message.",
    "messaging.detail.errors.markUnreadFailedTitle": "Erreur",
    "messaging.detail.errors.markUnreadFailedMessage":
      "Impossible de marquer ce message comme non lu.",
    "messaging.detail.errors.openAttachmentFailedTitle": "Erreur",
    "messaging.detail.errors.openAttachmentFailedMessage":
      "Impossible d'ouvrir cette pièce jointe sur cet appareil.",

    "messaging.detail.reply.quoteHeader": "Le {date}, {sender} a écrit :",
    "messaging.detail.forward.subjectPrefix": "Tr : ",
    "messaging.detail.forward.quoteHeader":
      "---------- Message transféré ----------",
    "messaging.detail.forward.quoteFrom": "De : {sender}",
    "messaging.detail.forward.quoteDate": "Date : {date}",
    "messaging.detail.forward.quoteSubject": "Objet : {subject}",
    "messaging.detail.forward.quoteTo": "À : {recipients}",

    "messaging.actions.reply": "Répondre",
    "messaging.actions.forward": "Transférer",
    "messaging.actions.markUnread": "Non lu",
    "messaging.actions.archive": "Archiver",
    "messaging.actions.unarchive": "Restaurer",
    "messaging.actions.delete": "Supprimer",
    "messaging.actions.deleteDialog.title": "Supprimer ce message ?",
    "messaging.actions.deleteDialog.message":
      "Le message sera définitivement supprimé de votre messagerie.",
    "messaging.actions.deleteDialog.confirm": "Supprimer",
    "messaging.actions.deleteDialog.cancel": "Annuler",

    "messaging.toasts.markedUnreadTitle": "Message marqué non lu",
    "messaging.toasts.markedUnreadMessage":
      "Vous le retrouverez non lu dans votre boîte.",
    "messaging.toasts.archivedTitle": "Message archivé",
    "messaging.toasts.archivedMessage":
      "Le message a été déplacé dans les archives.",
    "messaging.toasts.unarchivedTitle": "Message restauré",
    "messaging.toasts.unarchivedMessage":
      "Le message a été retiré des archives.",
    "messaging.toasts.archiveErrorTitle": "Archivage impossible",
    "messaging.toasts.archiveErrorMessage": "Impossible d'archiver ce message.",
    "messaging.toasts.deletedTitle": "Message supprimé",
    "messaging.toasts.deletedMessage": "Le message a bien été supprimé.",
    "messaging.toasts.deleteErrorTitle": "Suppression impossible",
    "messaging.toasts.deleteErrorMessage":
      "Impossible de supprimer ce message.",

    "messaging.recipientPicker.title": "Destinataires",
    "messaging.recipientPicker.cancel": "Annuler",
    "messaging.recipientPicker.confirm": "OK ({count})",
    "messaging.recipientPicker.searchPlaceholder":
      "Rechercher un destinataire…",
    "messaging.recipientPicker.emptyResult": "Aucun destinataire trouvé",
    "messaging.recipientPicker.defaultTeacherSubtitle": "Enseignant(e)",

    "messaging.nav.unreadMessagesTitle": "Messages non lus",
    "messaging.nav.unreadMessagesLabel": "Messages",
    "messaging.nav.unreadMessagesSub": "non lus",
    "messaging.nav.noUnreadMessages": "Aucun message non lu",
    "messaging.nav.loading": "Chargement…",

    "tests.title": "Tests",
    "tests.common.cancel": "Annuler",
    "tests.common.noValue": "—",
    "tests.common.restrictedTitle": "Accès restreint",
    "tests.common.restrictedMessage":
      "Ce module est réservé aux utilisateurs déclarés comme testeurs.",
    "tests.common.errors.loadTitle": "Chargement impossible",
    "tests.common.errors.loadGeneric":
      "Impossible de charger les données de tests.",
    "tests.common.errors.submitTitle": "Envoi impossible",
    "tests.common.errors.submitGeneric":
      "Impossible d'enregistrer ce résultat de test.",
    "tests.status.todo": "À faire",
    "tests.status.notStarted": "Non démarré",
    "tests.status.inProgress": "En cours",
    "tests.status.passed": "Validé",
    "tests.status.failed": "Échoué",
    "tests.status.blocked": "Bloqué",
    "tests.status.skipped": "Ignoré",
    "tests.priority.low": "Priorité basse",
    "tests.priority.medium": "Priorité moyenne",
    "tests.priority.high": "Priorité haute",
    "tests.priority.critical": "Critique",
    "tests.campaigns.subtitle": "Campagnes de recette",
    "tests.campaigns.emptyTitle": "Aucune campagne active",
    "tests.campaigns.emptyMessage":
      "Les prochaines campagnes de test apparaîtront ici.",
    "tests.campaigns.totalCases": "{count} tests",
    "tests.campaigns.dueLabel": "Échéance {date}",
    "tests.campaigns.targetVersion": "Version cible {version}",
    "tests.campaigns.progressLabel": "{done} tests réalisés sur {total}",
    "tests.cases.subtitle": "Liste des tests",
    "tests.cases.executionCount": "{count} résultats",
    "tests.detail.subtitle": "Détail du test",
    "tests.detail.objective": "Objectif",
    "tests.detail.preconditions": "Prérequis",
    "tests.detail.expectedResult": "Résultat attendu",
    "tests.detail.steps": "Étapes",
    "tests.detail.noSteps": "Aucune étape détaillée.",
    "tests.detail.completedBy": "Déjà réalisé par",
    "tests.detail.noCompletedUsers":
      "Aucun testeur n'a encore soumis de résultat.",
    "tests.detail.submitTitle": "Soumettre mon résultat",
    "tests.detail.resultPlaceholder":
      "Décrivez ce que vous avez observé pendant le test…",
    "tests.detail.commentPlaceholder":
      "Commentaire complémentaire ou contexte utile…",
    "tests.detail.submit": "Enregistrer le résultat",
    "tests.detail.submitting": "Enregistrement…",
    "tests.detail.historyTitle": "Historique des résultats",
    "tests.detail.historyEmpty":
      "Aucun résultat n'a encore été enregistré pour ce test.",
    "tests.detail.permissions.title": "Permission requise",
    "tests.detail.permissions.gallery":
      "Autorisez l'accès à la galerie pour joindre une capture.",
    "tests.detail.permissions.camera":
      "Autorisez l'accès à la caméra pour joindre une capture.",
    "tests.detail.attachments.title": "Ajouter des captures",
    "tests.detail.attachments.message":
      "Choisissez la source des images du résultat.",
    "tests.detail.attachments.camera": "Prendre une photo",
    "tests.detail.attachments.gallery": "Ouvrir la galerie",
    "tests.detail.attachments.add": "Ajouter des captures",
    "tests.detail.attachments.image": "Image",
    "tests.detail.attachments.file": "Fichier",
    "tests.detail.heroSubtitle": "Renseignez le statut et les détails du test",
    "tests.detail.fabAdd": "Saisir un résultat",
    "tests.detail.viewResults": "Voir les résultats",
    "tests.detail.formModalTitle": "Soumettre mon résultat",
    "tests.detail.toastSuccessTitle": "Résultat enregistré",
    "tests.detail.toastSuccessMessage":
      "Votre résultat a bien été pris en compte.",
    "tests.detail.sections.info": "Informations du test",
    "tests.detail.validation.resultRequired":
      "Décrivez le résultat observé avant d'enregistrer.",
    "tests.detail.validation.attachmentsRequired":
      "Ce test exige au moins une capture en preuve.",

    "tests.tabs.summary": "Synthèse",
    "tests.tabs.campaigns": "Campagnes",
    "tests.tabs.executions": "Tests réalisés",

    "tests.executions.filters.status": "Statut",
    "tests.executions.filters.statusAll": "Tous statuts",
    "tests.executions.filters.campaign": "Campagne",
    "tests.executions.filters.campaignAll": "Toutes campagnes",
    "tests.executions.emptyTitle": "Aucun test réalisé",
    "tests.executions.emptyMessage":
      "Vos résultats de test apparaîtront ici une fois soumis.",
    "tests.executions.cardCampaign": "Campagne : {title}",
    "tests.executions.detail.subtitle": "Détail du résultat",
    "tests.executions.detail.resultLabel": "Résultat",
    "tests.executions.detail.commentLabel": "Commentaire",
    "tests.executions.detail.deviceLabel": "Appareil",
    "tests.executions.detail.versionLabel": "Version",
    "tests.executions.detail.attachmentsLabel": "Captures",
    "tests.executions.detail.swipeHint": "Glissez pour passer au suivant",
    "tests.executions.detail.editFab": "Modifier le résultat",
    "tests.executions.edit.heroTitle": "Modifier le résultat",
    "tests.executions.edit.heroSubtitle":
      "Mettez à jour le statut et les détails",
    "tests.executions.edit.submit": "Enregistrer les modifications",
    "tests.executions.edit.submitting": "Enregistrement…",
    "tests.executions.edit.cancel": "Annuler",
    "tests.executions.edit.toastSuccessTitle": "Résultat mis à jour",
    "tests.executions.edit.toastSuccessMessage":
      "La modification a bien été enregistrée.",
    "tests.executions.edit.validation.resultRequired":
      "Le résultat est obligatoire.",

    "tests.summary.subtitle": "Vue d'ensemble",
    "tests.summary.kpi.totalCampaigns": "Campagnes",
    "tests.summary.kpi.inProgress": "En cours",
    "tests.summary.kpi.completed": "Terminées",
    "tests.summary.kpi.upcoming": "À venir",
    "tests.summary.kpi.totalCases": "Cas de test",
    "tests.summary.kpi.myExecutions": "Mes résultats",
    "tests.summary.kpi.pending": "Tests restants",
    "tests.summary.highlight.title": "À faire aujourd'hui",
    "tests.summary.highlight.campaignBadge": "Campagne",
    "tests.summary.highlight.cta": "Ouvrir le test",
    "tests.summary.highlight.empty":
      "Tous les tests visibles sont à jour. Bravo !",
    "tests.summary.emptyTitle": "Aucune campagne active",
    "tests.summary.emptyMessage":
      "Revenez plus tard pour suivre vos campagnes de test.",

    "tests.campaigns.filters.all": "Toutes",
    "tests.campaigns.filters.inProgress": "En cours",
    "tests.campaigns.filters.upcoming": "À commencer",
    "tests.campaigns.filters.completed": "Terminées",
    "tests.campaigns.status.inProgress": "En cours",
    "tests.campaigns.status.upcoming": "À commencer",
    "tests.campaigns.status.completed": "Terminée",

    "testsAdmin.title": "Tests (admin)",
    "testsAdmin.subtitle": "Pilotage global des campagnes de recette",
    "testsAdmin.tabs.summary": "Synthèse",
    "testsAdmin.tabs.campaigns": "Campagnes",
    "testsAdmin.tabs.testers": "Testeurs",
    "testsAdmin.tabs.executions": "Tests réalisés",
    "testsAdmin.common.cancel": "Annuler",
    "testsAdmin.common.save": "Enregistrer",
    "testsAdmin.common.saving": "Enregistrement…",
    "testsAdmin.common.close": "Fermer",
    "testsAdmin.common.errors.loadGeneric":
      "Impossible de charger les données.",
    "testsAdmin.common.errors.submitGeneric":
      "Une erreur est survenue, veuillez réessayer.",
    "testsAdmin.summary.kpi.campaignsActive": "Campagnes actives",
    "testsAdmin.summary.kpi.campaignsTotal": "Campagnes totales",
    "testsAdmin.summary.kpi.totalCases": "Cas de test",
    "testsAdmin.summary.kpi.testersCount": "Testeurs actifs",
    "testsAdmin.summary.kpi.executions": "Exécutions",
    "testsAdmin.summary.kpi.successRate": "Taux de réussite",
    "testsAdmin.summary.kpi.pendingReview": "À traiter",

    "testsAdmin.executions.filters.status": "Statut",
    "testsAdmin.executions.filters.statusAll": "Tous statuts",
    "testsAdmin.executions.filters.campaign": "Campagne",
    "testsAdmin.executions.filters.campaignAll": "Toutes campagnes",
    "testsAdmin.executions.filters.tester": "Testeur",
    "testsAdmin.executions.filters.testerAll": "Tous testeurs",
    "testsAdmin.executions.filters.reviewed": "Traitement",
    "testsAdmin.executions.filters.reviewedAll": "Tous",
    "testsAdmin.executions.filters.reviewedPending": "À traiter",
    "testsAdmin.executions.filters.reviewedDone": "Traités",
    "testsAdmin.executions.emptyTitle": "Aucun test réalisé",
    "testsAdmin.executions.emptyMessage":
      "Aucune exécution ne correspond à ces filtres.",
    "testsAdmin.executions.cardTester": "Par {name}",
    "testsAdmin.executions.cardCampaign": "Campagne : {title}",
    "testsAdmin.executions.reviewedBadge": "Traité",
    "testsAdmin.executions.pendingBadge": "À traiter",
    "testsAdmin.executions.detail.subtitle": "Détail du résultat",
    "testsAdmin.executions.detail.resultLabel": "Résultat",
    "testsAdmin.executions.detail.commentLabel": "Commentaire",
    "testsAdmin.executions.detail.deviceLabel": "Appareil",
    "testsAdmin.executions.detail.versionLabel": "Version",
    "testsAdmin.executions.detail.attachmentsLabel": "Captures",
    "testsAdmin.executions.detail.swipeHint": "Glissez pour passer au suivant",
    "testsAdmin.executions.detail.reviewedBy": "Traité par {name} le {date}",
    "testsAdmin.executions.review.markReviewed": "Marquer traité",
    "testsAdmin.executions.review.unmark": "Annuler le traitement",
    "testsAdmin.executions.review.title": "Marquer ce test comme traité",
    "testsAdmin.executions.review.noteLabel": "Note (optionnel)",
    "testsAdmin.executions.review.notePlaceholder":
      "Ex. Corrigé dans la version 1.3",
    "testsAdmin.executions.review.submit": "Valider",
    "testsAdmin.executions.review.submitting": "Enregistrement…",
    "testsAdmin.campaigns.searchPlaceholder": "Rechercher par numéro ou titre…",
    "testsAdmin.campaigns.filters.all": "Tous statuts",
    "testsAdmin.campaigns.filters.draft": "Brouillon",
    "testsAdmin.campaigns.filters.active": "Active",
    "testsAdmin.campaigns.filters.archived": "Archivée",
    "testsAdmin.campaigns.status.draft": "Brouillon",
    "testsAdmin.campaigns.status.active": "Active",
    "testsAdmin.campaigns.status.archived": "Archivée",
    "testsAdmin.campaigns.empty": "Aucune campagne.",
    "testsAdmin.campaigns.testCasesCount": "{count} cas de test",
    "testsAdmin.campaigns.referencePrefix": "CMP-{reference}",
    "testsAdmin.campaigns.createButton": "Nouvelle campagne",
    "testsAdmin.detail.back": "Retour aux campagnes",
    "testsAdmin.detail.editCampaign": "Modifier la campagne",
    "testsAdmin.detail.deleteCampaign": "Supprimer la campagne",
    "testsAdmin.detail.deleteCampaignConfirmTitle":
      "Supprimer cette campagne ?",
    "testsAdmin.detail.deleteCampaignConfirmMessage":
      "Cette action est irréversible et supprimera aussi ses cas de test.",
    "testsAdmin.detail.testersTitle": "Testeurs affectés",
    "testsAdmin.detail.assignButton": "Affecter à un testeur",
    "testsAdmin.detail.noAssignments": "Aucun testeur affecté.",
    "testsAdmin.detail.unassign": "Retirer",
    "testsAdmin.detail.quickMessage": "Message rapide",
    "testsAdmin.detail.casesTitle": "{count} cas de test",
    "testsAdmin.detail.addCase": "Ajouter un cas",
    "testsAdmin.detail.recycle": "Recycler",
    "testsAdmin.detail.recycling": "Recyclage…",
    "testsAdmin.detail.recycledOn": "Recyclé le {date}",
    "testsAdmin.detail.edit": "Modifier",
    "testsAdmin.detail.delete": "Supprimer",
    "testsAdmin.detail.deleteCaseConfirmTitle": "Supprimer ce cas de test ?",
    "testsAdmin.detail.deleteCaseConfirmMessage":
      "Cette action est irréversible.",
    "testsAdmin.detail.executionsCount": "{count} exécution(s)",
    "testsAdmin.detail.referencePrefix": "CAS-{reference}",
    "testsAdmin.caseDetail.title": "Détail du cas de test",
    "testsAdmin.caseDetail.swipeHint": "Glissez pour passer au cas suivant",
    "testsAdmin.caseDetail.updateSuccessTitle": "Cas de test modifié",
    "testsAdmin.caseDetail.updateSuccessMessage":
      "Les modifications ont été enregistrées.",
    "testsAdmin.caseDetail.recycleSuccessTitle": "Cas de test recyclé",
    "testsAdmin.caseDetail.recycleSuccessMessage":
      "Le cas de test a été recyclé.",
    "testsAdmin.caseDetail.deleteSuccessTitle": "Cas de test supprimé",
    "testsAdmin.caseDetail.deleteSuccessMessage":
      "Le cas de test a été supprimé.",
    "testsAdmin.executions.detail.viewCase": "Voir la demande complète",
    "testsAdmin.executions.detail.caseContentTitle": "Contenu du test",
    "testsAdmin.executions.detail.quickMessage": "Message rapide au testeur",
    "testsAdmin.assign.title": "Affecter une campagne",
    "testsAdmin.assign.testerLabel": "Testeur",
    "testsAdmin.assign.testerPlaceholder": "Choisir un testeur…",
    "testsAdmin.assign.testerRequired": "Choisissez un testeur.",
    "testsAdmin.assign.noteLabel": "Note",
    "testsAdmin.assign.notePlaceholder": "ex: Prioritaire avant vendredi",
    "testsAdmin.assign.submit": "Affecter",
    "testsAdmin.assign.submitting": "Affectation…",
    "testsAdmin.campaignForm.createTitle": "Nouvelle campagne",
    "testsAdmin.campaignForm.editTitle": "Modifier la campagne",
    "testsAdmin.campaignForm.titleLabel": "Titre",
    "testsAdmin.campaignForm.titlePlaceholder": "ex: Recette mobile v1",
    "testsAdmin.campaignForm.titleRequired": "Le titre est obligatoire.",
    "testsAdmin.campaignForm.descriptionLabel": "Description",
    "testsAdmin.campaignForm.targetVersionLabel": "Version cible",
    "testsAdmin.campaignForm.startsAtLabel": "Date de début",
    "testsAdmin.campaignForm.dueAtLabel": "Date d'échéance",
    "testsAdmin.campaignForm.statusLabel": "Statut",
    "testsAdmin.caseForm.createTitle": "Nouveau cas de test",
    "testsAdmin.caseForm.editTitle": "Modifier le cas de test",
    "testsAdmin.caseForm.titleLabel": "Titre",
    "testsAdmin.caseForm.titlePlaceholder": "ex: Connexion par email",
    "testsAdmin.caseForm.titleRequired": "Le titre est obligatoire.",
    "testsAdmin.caseForm.moduleLabel": "Module",
    "testsAdmin.caseForm.objectiveLabel": "Objectif",
    "testsAdmin.caseForm.preconditionsLabel": "Prérequis",
    "testsAdmin.caseForm.expectedResultLabel": "Résultat attendu",
    "testsAdmin.caseForm.expectedResultRequired":
      "Le résultat attendu est obligatoire.",
    "testsAdmin.caseForm.priorityLabel": "Priorité",
    "testsAdmin.caseForm.priority.low": "Faible",
    "testsAdmin.caseForm.priority.medium": "Moyenne",
    "testsAdmin.caseForm.priority.high": "Haute",
    "testsAdmin.caseForm.priority.critical": "Critique",
    "testsAdmin.caseForm.evidenceRequiredLabel": "Capture d'écran obligatoire",
    "testsAdmin.caseForm.dueAtLabel": "Date d'échéance",
    "testsAdmin.testers.searchPlaceholder": "Rechercher un testeur par nom…",
    "testsAdmin.testers.empty": "Aucun testeur.",
    "testsAdmin.testers.campaigns": "Campagnes",
    "testsAdmin.testers.executions": "Tests faits",
    "testsAdmin.testers.passed": "OK",
    "testsAdmin.testers.failed": "NOK",
    "testsAdmin.message.title": "Message rapide à {name}",
    "testsAdmin.message.subjectLabel": "Sujet",
    "testsAdmin.message.subjectPlaceholder": "ex: Merci de tester le module",
    "testsAdmin.message.subjectRequired": "Le sujet est obligatoire.",
    "testsAdmin.message.bodyLabel": "Message",
    "testsAdmin.message.bodyPlaceholder": "Pouvez-vous rejouer la campagne ?",
    "testsAdmin.message.bodyRequired": "Le message est obligatoire.",
    "testsAdmin.message.send": "Envoyer",
    "testsAdmin.message.sending": "Envoi…",
    "testsAdmin.message.sent": "Message envoyé.",
    "testsAdmin.message.noSchool": "Ce testeur n'est rattaché à aucune école.",

    "feed.filters.all": "Tout",
    "feed.filters.featured": "À la une",
    "feed.filters.polls": "Sondages",
    "feed.filters.mine": "Mes posts",

    "feed.search.placeholder": "Rechercher une publication",

    "feed.unavailable.title": "Fil indisponible",
    "feed.unavailable.message":
      "Ce rôle ne dispose pas encore du module d'actualité.",

    "feed.errors.loadFailed": "Impossible de charger le fil.",
    "feed.errors.childContextMissing": "Contexte enfant introuvable.",
    "feed.errors.classContextMissing": "Contexte classe introuvable.",
    "feed.errors.schoolMissing": "Établissement introuvable",

    "feed.toast.pollPublishedTitle": "Sondage publié",
    "feed.toast.postPublishedTitle": "Actualité publiée",
    "feed.toast.pollPublishedMessage":
      "Le sondage est maintenant visible dans le fil.",
    "feed.toast.postPublishedMessage":
      "Votre publication a été ajoutée au fil d'actualité.",
    "feed.toast.publishErrorTitle": "Publication impossible",
    "feed.toast.publishErrorMessage":
      "Impossible de publier cette actualité pour le moment.",
    "feed.toast.likeErrorTitle": "Réaction indisponible",
    "feed.toast.likeErrorMessage": "Impossible d'enregistrer votre réaction.",
    "feed.toast.commentErrorTitle": "Commentaire non envoyé",
    "feed.toast.commentErrorMessage": "Impossible d'ajouter ce commentaire.",
    "feed.toast.voteErrorTitle": "Vote indisponible",
    "feed.toast.voteErrorMessage": "Impossible d'enregistrer votre vote.",
    "feed.toast.deleteSuccessTitle": "Publication supprimée",
    "feed.toast.deleteErrorTitle": "Suppression impossible",
    "feed.toast.deleteErrorMessage":
      "Impossible de supprimer cette publication.",
    "feed.toast.imageErrorTitle": "Image non ajoutée",
    "feed.toast.imageErrorMessage": "Impossible d'ajouter l'image.",

    "feed.empty.noResultsTitle": "Aucun résultat",
    "feed.empty.noResultsMessage": "Essayez d'autres mots-clés.",

    "feed.composer.infoLabel": "Info",
    "feed.composer.pollLabel": "Sondage",
    "feed.composer.eyebrow": "Publication",
    "feed.composer.heading": "Partager une actualité",
    "feed.composer.modePost": "Post",
    "feed.composer.modePoll": "Sondage",
    "feed.composer.titlePlaceholder": "Titre de la publication",
    "feed.composer.editorPlaceholder": "Rédigez le contenu de l'actualité…",
    "feed.composer.pollQuestionPlaceholder": "Question du sondage",
    "feed.composer.pollOptionPlaceholder": "Option {number}",
    "feed.composer.addOption": "Ajouter une option",
    "feed.composer.featuredStandard": "Standard",
    "feed.composer.featured3Days": "3 j",
    "feed.composer.featured7Days": "7 j",
    "feed.composer.publishing": "Publication…",
    "feed.composer.publishPoll": "Publier le sondage",
    "feed.composer.publish": "Publier",
    "feed.composer.colorMenuTitle": "Couleur du texte",
    "feed.composer.colorMenuMessage": "Choisissez une couleur",
    "feed.composer.colorDeepBlue": "Bleu profond",
    "feed.composer.colorSchoolGreen": "Vert école",
    "feed.composer.colorAlertRed": "Rouge alerte",
    "feed.composer.colorBlack": "Noir",
    "feed.composer.cancel": "Annuler",

    "feed.fileSize.bytes": "o",
    "feed.fileSize.kb": "Ko",
    "feed.fileSize.mb": "Mo",

    "feed.validation.titleRequired": "Le titre est obligatoire.",
    "feed.validation.pollQuestionRequired": "La question est obligatoire.",
    "feed.validation.pollOptionsMin":
      "Au moins 2 options non vides sont requises.",
    "feed.validation.bodyRequired":
      "Ajoutez du contenu avant de publier cette actualité.",

    "feed.permission.galleryDeniedTitle": "Permission refusée",
    "feed.permission.galleryDeniedMessage": "Autorisez l'accès à la galerie.",

    "feed.deleteDialog.title": "Supprimer cette publication ?",
    "feed.deleteDialog.subtitle": "Action visible immédiatement",
    "feed.deleteDialog.message":
      "La publication sera retirée du {context} pour les lecteurs autorisés.",
    "feed.deleteDialog.confirm": "Supprimer",
    "feed.deleteDialog.cancel": "Annuler",

    "feed.audience.parentsOnly": "Parents uniquement",
    "feed.audience.myClass": "Ma classe",
    "feed.audience.wholeSchool": "Toute l'école",
    "feed.audience.parentsAndStudents": "Parents & élèves",
    "feed.audience.staffOnly": "Équipe interne",
    "feed.audience.classLabel": "Classe {name}",

    "feed.attachments.title": "Pièces jointes",
    "feed.attachments.add": "Joindre",
    "feed.attachments.empty": "Aucune pièce jointe pour cette publication.",
    "feed.attachments.summaryMultiple": "{count} pièces jointes",

    "feed.post.noText": "Publication sans texte.",
    "feed.post.voteUnit": "vote",
    "feed.post.voteUnitPlural": "votes",
    "feed.post.selectedSuffix": ", sélectionné",
    "feed.post.likesAria": "Réactions {count}",
    "feed.post.likedSuffix": ", aimée",
    "feed.post.commentsAria": "Commentaires {count}",
    "feed.post.hideReaction": "Masquer réaction",
    "feed.post.react": "Réagir",
    "feed.post.commentPlaceholder": "Ajouter un commentaire...",
    "feed.post.addEmojiAria": "Ajouter {emoji}",
    "feed.post.submitComment": "Commenter",

    "feed.classLife.title": "Vie de classe",
    "feed.classLife.endOfList": "Fin des publications de classe",
    "feed.classLife.emptyTitle": "Aucune actualité de classe",
    "feed.classLife.emptyMessageChild":
      "Les informations collectives partagées à la classe apparaîtront ici.",
    "feed.classLife.emptyMessageTeacher":
      "Les informations partagées avec cette classe apparaîtront ici.",
    "feed.classLife.deleteSuccess":
      "Cette publication n'apparaît plus dans la vie de classe.",
    "feed.classLife.context": "fil de classe",
    "feed.classLife.studentFallback": "Élève",
    "feed.classLife.classWithId": "Classe {classId}",
    "feed.classLife.classActive": "Classe active",

    "feed.page.title": "Fil d'actualité",
    "feed.page.endOfList": "Vous avez atteint la fin du fil",
    "feed.page.emptyTitle": "Aucune actualité pour le moment",
    "feed.page.emptyMessage":
      "Les informations importantes de l'établissement apparaîtront ici.",
    "feed.page.deleteSuccess": "Cette actualité n'apparaît plus dans le fil.",
    "feed.page.context": "fil d'actualité",
    "feed.page.heroTitle": "Partager une annonce utile",
    "feed.page.heroSubtitle":
      "Informations d'école, rappels, sondages et vie quotidienne.",
    "feed.detail.headerTitle": "Publication",
    "feed.detail.backToList": "Retour à la liste",
    "feed.composer.titleLabel": "Titre",
    "feed.composer.contentLabel": "Contenu",
    "feed.comments.summaryNone": "Soyez le premier à réagir",
    "feed.comments.summaryOne": "1 commentaire",
    "feed.comments.summaryMany": "{count} commentaires",

    "notes.tabs.evaluations": "Évaluations",
    "notes.tabs.scores": "Saisie notes",
    "notes.tabs.notes": "Notes",
    "notes.tabs.council": "Conseil classe",

    "notes.classes.title": "Cahier de notes",
    "notes.classes.filterTitle": "Filtrer par année",
    "notes.classes.filterSubtitle":
      "Les classes accessibles dépendent de vos affectations et de votre rôle.",
    "notes.classes.yearLabel": "Année scolaire",
    "notes.classes.listTitle": "Classes accessibles",
    "notes.classes.listSubtitle":
      "Accédez au cahier de notes de chaque classe et reprenez là où vous vous êtes arrêté.",
    "notes.classes.loading": "Chargement des classes...",
    "notes.classes.emptyTitle": "Aucune classe disponible",
    "notes.classes.emptyMessage":
      "Aucune classe accessible n'a été trouvée pour ce profil.",
    "notes.classes.studentSingular": "élève",
    "notes.classes.studentPlural": "élèves",

    "notes.teacher.empty.title": "Aucun élève",
    "notes.teacher.empty.message":
      "Aucun élève n'est inscrit dans cette classe.",
    "notes.teacher.filters.studentLabel": "ÉLÈVE",
    "notes.teacher.filters.subjectLabel": "MATIÈRE",
    "notes.teacher.filters.allSubjects": "Toutes les matières",
    "notes.teacher.picker.selectStudent": "Sélectionner un élève",
    "notes.teacher.picker.filterBySubject": "Filtrer par matière",

    "notes.terms.term1": "Trimestre 1",
    "notes.terms.term2": "Trimestre 2",
    "notes.terms.term3": "Trimestre 3",
    "notes.sequences.seq1": "T1 — Séquence 1",
    "notes.sequences.seq2": "T1 — Séquence 2 (examen)",
    "notes.sequences.seq3": "T2 — Séquence 3",
    "notes.sequences.seq4": "T2 — Séquence 4 (examen)",
    "notes.sequences.seq5": "T3 — Séquence 5",
    "notes.sequences.seq6": "T3 — Séquence 6 (examen)",

    "notes.scoreStatus.absent": "Abs",
    "notes.scoreStatus.excused": "Disp",
    "notes.scoreStatus.notGraded": "NE",

    "notes.delta.atClassLevel": "Au niveau de la classe",
    "notes.delta.vsClass": "pts vs classe",

    "notes.dateNotSet": "Date non définie",

    "notes.form.backToList": "Liste des évaluations",
    "notes.form.sections.identification": "Identification",
    "notes.form.sections.classification": "Classification",
    "notes.form.sections.planning": "Planification",
    "notes.form.sections.description": "Description",
    "notes.form.sections.attachments": "Pièces jointes",
    "notes.form.fields.title": "Titre",
    "notes.form.fields.titlePlaceholder": "Composition de mathématiques",
    "notes.form.fields.subject": "Matière",
    "notes.form.fields.subjectPlaceholder": "Sélectionner une matière",
    "notes.form.fields.branch": "Sous-branche",
    "notes.form.fields.branchPlaceholder": "Sélectionner une sous-branche",
    "notes.form.fields.type": "Type",
    "notes.form.fields.typePlaceholder": "Sélectionner un type",
    "notes.form.fields.scheduledDate": "Date prévue",
    "notes.form.fields.datePlaceholder": "Choisir une date",
    "notes.form.fields.dateTitle": "Date de l'évaluation",
    "notes.form.fields.time": "Heure",
    "notes.form.fields.timeTitle": "Heure de l'évaluation",
    "notes.form.fields.coefficient": "Coefficient",
    "notes.form.fields.maxScore": "Barème",
    "notes.form.fields.sequence": "Séquence",
    "notes.form.fields.sequencePlaceholder": "Sélectionner une séquence",
    "notes.form.fields.isFinalExam": "Examen de séquence",
    "notes.form.fields.isFinalExamHint":
      "Cochez si c'est l'examen final de la séquence (obligatoire pour compter dans la moyenne)",
    "notes.form.termAutoSuffix": "calculé automatiquement d'après la date",
    "notes.form.sequenceTermBadge": "Trimestre détecté",
    "notes.form.validation.sequenceRequired": "Séquence requise",
    "notes.form.descriptionPlaceholder":
      "Consignes, compétences visées, modalités…",
    "notes.form.addAttachment": "Ajouter un fichier",
    "notes.form.noAttachment":
      "Aucune pièce jointe. Ajoutez un sujet, une consigne ou un barème.",
    "notes.form.saveDraft": "Sauvegarder brouillon",
    "notes.form.save": "Enregistrer",
    "notes.form.publish": "Publier",
    "notes.form.colorMenu.title": "Couleur du texte",
    "notes.form.colorMenu.message": "Choisissez une couleur",
    "notes.form.colorMenu.cancel": "Annuler",
    "notes.form.colors.blue": "Bleu",
    "notes.form.colors.green": "Vert",
    "notes.form.colors.red": "Rouge",
    "notes.form.colors.black": "Noir",
    "notes.form.validation.titleRequired": "Titre requis (min. 3 caractères)",
    "notes.form.validation.titleTooLong": "Titre trop long",
    "notes.form.validation.subjectRequired": "Matière requise",
    "notes.form.validation.typeRequired": "Type d'évaluation requis",
    "notes.form.validation.dateRequired": "Date requise",
    "notes.form.validation.dateInvalid": "Date invalide",
    "notes.form.validation.timeInvalid": "Heure invalide",
    "notes.form.validation.coefficientRequired": "Coefficient requis",
    "notes.form.validation.coefficientMin": "Min 0.25",
    "notes.form.validation.maxScoreRequired": "Barème requis",
    "notes.form.validation.maxScoreMin": "Min 1",

    "notes.score.noteLabel": "Note",
    "notes.score.modify": "Modifier",
    "notes.score.save": "Enregistrer",
    "notes.score.comment": "Commentaire",
    "notes.score.commentPlaceholder": "Observation individuelle…",
    "notes.score.saveComment": "Enregistrer le commentaire",
    "notes.score.status.notGraded": "Non noté",
    "notes.score.status.entered": "Noté",
    "notes.score.status.absent": "Absent",
    "notes.score.status.excused": "Dispensé",
    "notes.score.validation.required": "La note est requise",
    "notes.score.validation.invalid": "Valeur invalide (nombre ≥ 0)",
    "notes.score.validation.aboveMax": "Note supérieure au barème",

    "notes.manager.header.title": "Notes",
    "notes.manager.header.classPrefix": "Classe",
    "notes.manager.access.title": "Accès non autorisé",
    "notes.manager.access.message":
      "Ce module est réservé aux enseignants et aux rôles établissement.",
    "notes.manager.search.placeholder": "Rechercher une évaluation…",
    "notes.manager.loading.notebook": "Chargement du cahier de notes...",
    "notes.manager.loading.form": "Chargement du formulaire…",
    "notes.manager.loading.evaluations": "Chargement des évaluations...",
    "notes.manager.loading.scores": "Chargement des élèves…",
    "notes.manager.loading.detail": "Chargement du détail de l'évaluation...",
    "notes.manager.loading.section": "Chargement",
    "notes.manager.evalList.backToList": "Liste des évaluations",
    "notes.manager.evalList.statusPublished": "Publié",
    "notes.manager.evalList.statusDraft": "Brouillon",
    "notes.manager.evalList.scoresSaisies": "scores saisis • coeff.",
    "notes.manager.evalList.actionDetails": "Détails",
    "notes.manager.evalList.actionEdit": "Modifier",
    "notes.manager.evalList.actionScores": "Notes",
    "notes.manager.evalList.actionDelete": "Supprimer",
    "notes.manager.evalList.empty.title": "Aucune évaluation",
    "notes.manager.evalList.empty.message":
      "Appuyez sur + pour créer la première évaluation de cette classe.",
    "notes.manager.detail.sectionTitle": "Détails de l'évaluation",
    "notes.manager.detail.labelTitle": "Titre",
    "notes.manager.detail.labelStatus": "Statut",
    "notes.manager.detail.labelSubject": "Matière",
    "notes.manager.detail.labelType": "Type",
    "notes.manager.detail.labelPeriod": "Période",
    "notes.manager.detail.labelDate": "Date prévue",
    "notes.manager.detail.labelCoefficient": "Coefficient",
    "notes.manager.detail.labelMaxScore": "Barème",
    "notes.manager.detail.labelDescription": "Description",
    "notes.manager.detail.labelProgress": "Progression",
    "notes.manager.detail.scoresSaisies": "scores saisis",
    "notes.manager.detail.editEval": "Modifier l'évaluation",
    "notes.manager.detail.enterScores": "Saisir les notes",
    "notes.manager.scores.allStudents": "Tous les élèves",
    "notes.manager.scores.draftBanner":
      "Brouillon — les notes ne seront visibles dans l'onglet Notes qu'après publication de l'évaluation.",
    "notes.manager.scores.emptyTitle": "Aucun élève",
    "notes.manager.scores.emptyMessage":
      "Sélectionnez un élève dans le filtre ou vérifiez le chargement.",
    "notes.manager.scoresTab.sectionTitle": "Saisie des notes",
    "notes.manager.scoresTab.subtitle":
      "Choisissez une évaluation puis renseignez note, statut et commentaire.",
    "notes.manager.scoresTab.evalLabel": "Évaluation",
    "notes.manager.scoresTab.emptyTitle": "Aucune évaluation sélectionnée",
    "notes.manager.scoresTab.emptyMessage":
      "Créez ou sélectionnez une évaluation pour commencer la saisie.",
    "notes.manager.council.sectionTitle": "Conseil de classe",
    "notes.manager.council.subtitle":
      "Saisissez les appréciations générales et par matière pour chaque élève.",
    "notes.manager.council.periodLabel": "Période",
    "notes.manager.council.statusLabel": "Statut",
    "notes.manager.council.statusDraft": "Brouillon",
    "notes.manager.council.statusPublished": "Publié",
    "notes.manager.council.dateLabel": "Date du conseil",
    "notes.manager.council.generalAppreciation": "Appréciation générale",
    "notes.manager.council.generalPlaceholder": "Bilan général de l'élève",
    "notes.manager.council.subjectPlaceholder": "Appréciation par matière",
    "notes.manager.council.save": "Enregistrer le conseil",
    "notes.manager.deleteConfirm.title": "Supprimer l'évaluation ?",
    "notes.manager.deleteConfirm.message":
      "Cette action est irréversible. Les notes saisies seront également supprimées.",
    "notes.manager.deleteConfirm.confirm": "Supprimer",
    "notes.manager.deleteConfirm.cancel": "Annuler",
    "notes.manager.toast.scoreTitle": "Note enregistrée",
    "notes.manager.toast.scoreMessage": "La note a bien été sauvegardée.",
    "notes.manager.toast.scoreErrorTitle": "Saisie impossible",
    "notes.manager.toast.scoreErrorMessage":
      "Impossible d'enregistrer la note.",
    "notes.manager.toast.deleteTitle": "Évaluation supprimée",
    "notes.manager.toast.deleteMessage":
      "L'évaluation et ses notes associées ont été supprimées.",
    "notes.manager.toast.deleteErrorTitle": "Suppression impossible",
    "notes.manager.toast.deleteErrorMessage":
      "Impossible de supprimer cette évaluation.",
    "notes.manager.toast.councilTitle": "Conseil de classe enregistré",
    "notes.manager.toast.councilMessage":
      "Les appréciations de période ont bien été sauvegardées.",
    "notes.manager.toast.councilErrorTitle": "Enregistrement impossible",
    "notes.manager.toast.councilErrorMessage":
      "Impossible d'enregistrer les appréciations.",
    "notes.manager.toast.createTitle": "Évaluation créée",
    "notes.manager.toast.createMessage": "L'évaluation a bien été enregistrée.",
    "notes.manager.toast.updateTitle": "Évaluation mise à jour",
    "notes.manager.toast.updateMessage":
      "Les modifications ont bien été enregistrées.",

    "notes.child.title": "Évaluations et moyennes",
    "notes.child.subtitle.student": "Élève",
    "notes.panel.notes": "Notes",
    "notes.panel.loading": "Chargement des notes publiées...",
    "notes.panel.emptyTitle": "Aucune note publiée",
    "notes.panel.emptyMessage":
      "Les évaluations publiées pour cet enfant apparaîtront ici.",
    "notes.panel.viewEval": "Eval",
    "notes.panel.viewAvg": "Moy",
    "notes.panel.viewChart": "Graph",
    "notes.evals.emptyTitle": "Aucune évaluation",
    "notes.evals.emptyMessage":
      "Les notes publiées pour cette période apparaîtront ici.",
    "notes.evals.inlineEmpty": "Aucune note publiée dans cette matière.",
    "notes.evals.generalAverage": "MOYENNE GÉNÉRALE",
    "notes.evals.generalHint":
      "Synthèse des évaluations publiées sur la période.",
    "notes.evals.legendAbs": "Abs",
    "notes.evals.legendAbsent": "Absent",
    "notes.evals.legendDisp": "Disp",
    "notes.evals.legendDispense": "Dispensé",
    "notes.evals.legendNE": "NE",
    "notes.evals.legendNonEvalue": "Non évalué",
    "notes.period.badge": "BULLETIN DE PÉRIODE",
    "notes.period.published": "DONNÉES PUBLIÉES",
    "notes.period.statStudentAvg": "Moyenne élève",
    "notes.period.statClassAvg": "Moyenne classe",
    "notes.period.amplitude": "Amplitude",
    "notes.period.statBestSubject": "Matière forte",
    "notes.period.statWatchSubject": "Point de vigilance",
    "notes.period.noData": "Aucune donnée",
    "notes.avgs.title": "Moyennes",
    "notes.avgs.emptyTitle": "Aucune moyenne calculable",
    "notes.avgs.emptyMessage":
      "Les moyennes apparaîtront dès qu'une matière aura des notes publiées.",
    "notes.avgs.coef": "Coef.",
    "notes.avgs.classLabel": "Classe :",
    "notes.avgs.minLabel": "Min :",
    "notes.avgs.maxLabel": "Max :",
    "notes.avgs.generalAverage": "MOYENNE GÉNÉRALE",
    "notes.avgs.positioning":
      "Positionnement global de l'élève sur la période.",
    "notes.charts.title": "Graphiques",
    "notes.charts.emptyTitle": "Graphiques indisponibles",
    "notes.charts.emptyMessage":
      "Il faut des moyennes élève et classe pour afficher cette vue.",
    "notes.charts.comparisonTitle": "Comparaison par matière",
    "notes.charts.comparisonSubtitle":
      "Chaque bande représente l'amplitude min-max de la classe, avec la position de l'élève et de la moyenne de classe.",
    "notes.charts.legendStudent": "Moyenne élève",
    "notes.charts.legendClass": "Moyenne classe",
    "notes.charts.legendRange": "Min - max classe",
    "notes.charts.radarTitle": "Radar des moyennes",
    "notes.charts.radarSubtitle":
      "Vue globale des matières les plus fortes et des écarts avec la classe.",
    "notes.charts.radarReadTitle": "Lecture du radar",
    "notes.charts.radarReadText":
      "Plus le tracé se rapproche du bord, plus la moyenne est élevée.",
    "notes.charts.radarCompareTitle": "Comparaison",
    "notes.charts.radarCompareText":
      "Le tracé bleu représente l'élève. Le gris correspond à la classe.",
    "notes.charts.student": "Élève",
    "notes.charts.class": "Classe",
    "notes.charts.yearBadge": "ANNÉE SCOLAIRE",
    "notes.detail.evalTitle": "Détail de l'évaluation",
    "notes.detail.avgTitle": "Détail de la moyenne",
    "notes.detail.statNote": "Note",
    "notes.detail.statStatus": "Statut",
    "notes.detail.statDate": "Date",
    "notes.detail.statCoefficient": "Coefficient",
    "notes.detail.statusAbsent": "Absent",
    "notes.detail.statusExcused": "Dispensé",
    "notes.detail.statusNotGraded": "Non évalué",
    "notes.detail.statusGraded": "Note saisie",
    "notes.detail.avgLead":
      "Comparez l'élève à la classe et identifiez l'amplitude observée.",
    "notes.detail.statStudent": "Élève",
    "notes.detail.statClass": "Classe",
    "notes.detail.statMin": "Min",
    "notes.detail.statMax": "Max",
    "notes.detail.context": "Contexte",
    "notes.detail.noComparison": "Aucune comparaison disponible",

    "notes.admin.title": "Notes",
    "notes.admin.tabs.byStudent": "Par élève",
    "notes.admin.tabs.byClass": "Par classe",
    "notes.admin.filters.year": "Année",
    "notes.admin.filters.yearPlaceholder": "Choisir une année",
    "notes.admin.filters.class": "Classe",
    "notes.admin.filters.allClasses": "Toutes les classes",
    "notes.admin.search.placeholder": "Rechercher un élève…",
    "notes.admin.loading.students": "Chargement des élèves…",
    "notes.admin.loading.classes": "Chargement des classes…",
    "notes.admin.error.loadFailed": "Impossible de charger les classes.",
    "notes.admin.error.title": "Erreur",
    "notes.admin.students.emptyTitle": "Aucun élève",
    "notes.admin.students.emptyMessage":
      "Aucun élève disponible pour les filtres sélectionnés.",
    "notes.admin.students.noResultTitle": "Aucun résultat",
    "notes.admin.students.noResultMessage": "Modifiez votre recherche.",
    "notes.admin.classes.emptyTitle": "Aucune classe",
    "notes.admin.classes.emptyMessage":
      "Aucune classe disponible pour cette année scolaire.",

    // App index — session expirée
    "app.sessionExpired.title": "Session expirée",
    "app.sessionExpired.subtitle":
      "Votre espace a été verrouillé en toute sécurité",
    "app.sessionExpired.message":
      "Votre session a expiré. Veuillez vous connecter à nouveau.",
    "app.sessionExpired.reconnect": "Se reconnecter",

    // Home index — fallback
    "home.fallback.welcome": "Bienvenue, {firstName} {lastName}",

    // Hero d'accueil (générique, toutes pages d'accueil)
    "home.hero.greeting": "Bonjour cher",
    "home.hero.role.platformSuperAdmin": "Super administrateur",
    "home.hero.role.platformAdmin": "Administrateur",
    "home.hero.role.platformSales": "Commercial",
    "home.hero.role.platformSupport": "Support",
    "home.hero.role.schoolAdmin": "Administrateur",
    "home.hero.role.schoolManager": "Directeur",
    "home.hero.role.supervisor": "Superviseur",
    "home.hero.role.accountant": "Comptable",
    "home.hero.role.staff": "Personnel",
    "home.hero.role.teacher": "Enseignant(e)",
    "home.hero.role.parent": "Parent",
    "home.hero.role.student": "Élève",

    // Accueil Parent
    "home.parent.children.title": "Mes enfants",
    "home.parent.children.empty.title": "Aucun enfant associé",
    "home.parent.children.empty.subtitle":
      "Vos enfants inscrits apparaîtront ici",
    "home.parent.quickAccess.title": "Accès rapides",
    "home.parent.quickAccess.feed.label": "Fil d'actualité",
    "home.parent.quickAccess.feed.sub": "Informations de l'école",
    "home.parent.quickAccess.finance.label": "Finances",
    "home.parent.quickAccess.finance.sub": "Paiements et solde",
    "home.parent.quickAccess.messaging.label": "Messagerie",
    "home.parent.quickAccess.messaging.sub": "Contacter l'équipe",
    "home.parent.quickAccess.documents.label": "Documents",
    "home.parent.quickAccess.documents.sub": "Bulletins, certificats…",
    "home.parent.news.title": "Actualités",
    "home.parent.news.seeAll": "Voir tout",
    "home.parent.news.empty.title": "Aucune actualité",
    "home.parent.news.empty.subtitle":
      "Les informations de l'établissement apparaîtront ici",

    // Placeholder screen
    "placeholder.subtitle": "Module en cours de développement",
    "placeholder.body": "Cette fonctionnalité sera disponible prochainement.",
    "placeholder.defaultTitle": "Module",

    // Teacher class timetable route
    "classRoute.timetable.headerTitle": "Emploi du temps",
    "classRoute.timetable.tabLabel": "Emploi du temps",

    // Vérification de version au démarrage
    "startup.checking": "Vérification de la version…",
    "startup.error.title": "Connexion impossible",
    "startup.error.message":
      "Nous n'avons pas pu vérifier que votre application est à jour. Vérifiez votre connexion puis réessayez.",
    "startup.error.retry": "Réessayer",

    // Bottom tab bar
    "nav.tabs.home": "Accueil",
    "nav.tabs.account": "Mon compte",
    "nav.tabs.assistance": "Assistance",

    // Changement d'email
    "account.email.current": "Email actuel",
    "account.email.changeButton": "Modifier l'email",
    "account.email.changeTitle": "Changer d'adresse email",
    "account.email.newPlaceholder": "nouvelle@adresse.com",
    "account.email.sendLink": "Envoyer le lien",
    "account.email.sending": "Envoi...",
    "account.email.cancel": "Annuler",
    "account.email.successMessage":
      "Un lien de confirmation a ete envoye a la nouvelle adresse. Verifiez votre boite mail.",
    "account.email.errors.invalid": "Adresse email invalide.",
    "account.email.errors.sameEmail":
      "Le nouvel email est identique a l'actuel.",
    "account.email.errors.sendFailed":
      "Impossible d'envoyer le lien. Reessayez.",
    "nav.tabs.menu": "Menu",
    "nav.tabs.tests": "Tests",

    // ConfirmDialog (générique)
    "confirmDialog.badge.danger": "Action sensible",
    "confirmDialog.badge.warning": "Attention",
    "confirmDialog.badge.info": "Information",
    "confirmDialog.defaultConfirm": "Confirmer",
    "confirmDialog.defaultCancel": "Annuler",

    // Home header (AppHeader, variante accueil)
    "header.home.loginAction": "Se connecter",
    "header.home.logoutAction": "Se déconnecter",
    "header.home.logoutConfirmTitle": "Se déconnecter ?",
    "header.home.logoutConfirmMessage":
      "Vous serez redirigé vers l'écran de connexion. Vos données locales seront effacées.",
    "header.home.logoutConfirmConfirm": "Se déconnecter",
    "header.home.logoutConfirmCancel": "Annuler",
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
    "apiErrors.apiUnreachable":
      "Server unreachable. Make sure the API is running (port 3001).",
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
    "discipline.form.fields.date": "Date",
    "discipline.form.fields.time": "Time",
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
    "discipline.form.hero.createTitle": "New discipline event",
    "discipline.form.hero.editTitle": "Edit event",
    "discipline.form.hero.createSubtitle":
      "Fill in the student, type and reason for the event.",
    "discipline.form.hero.editSubtitle":
      "Update the details of this discipline event.",

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

    "discipline.filters.title": "Filters",
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
    "homework.control.doneStudentsTitle": "Students who already completed it",
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
    "homework.empty.week": "No homework is scheduled for this day of the week.",
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

    "timetable.common.thisWeek": "This week",
    "timetable.common.thisMonth": "This month",
    "timetable.common.cancel": "Cancel",
    "timetable.common.update": "Update",
    "timetable.common.roomToConfirm": "Room to be confirmed",
    "timetable.common.noCourseTitle": "No class",
    "timetable.common.loadingAgenda": "Loading the schedule...",
    "timetable.common.weekSelectedSlotLabel": "SELECTED SLOT",
    "timetable.common.weekSelectedSlotPlaceholder":
      "Select a slot in the table to display its details.",
    "timetable.common.statusPlanned": "Planned",
    "timetable.common.statusCancelled": "Cancelled",
    "timetable.common.sourceException": "Exception",
    "timetable.common.sourceAdjusted": "Adjusted",
    "timetable.common.courseCancelled": "Class cancelled",
    "timetable.common.noClosureTitle": "No closure recorded",
    "timetable.common.noClosureMessage":
      "Public holidays and school breaks created for the school will appear here.",
    "timetable.common.unknownSchoolYear": "Unknown school year",
    "timetable.common.viewDay": "Day",
    "timetable.common.viewWeek": "Week",
    "timetable.common.viewMonth": "Month",
    "timetable.common.today": "Today",
    "timetable.common.edit": "EDIT",

    "timetable.weekdays.monFull": "Monday",
    "timetable.weekdays.tueFull": "Tuesday",
    "timetable.weekdays.wedFull": "Wednesday",
    "timetable.weekdays.thuFull": "Thursday",
    "timetable.weekdays.friFull": "Friday",
    "timetable.weekdays.satFull": "Saturday",
    "timetable.weekdays.sunFull": "Sunday",
    "timetable.weekdays.monCompact": "M",
    "timetable.weekdays.tueCompact": "T",
    "timetable.weekdays.wedCompact": "W",
    "timetable.weekdays.thuCompact": "T",
    "timetable.weekdays.friCompact": "F",
    "timetable.weekdays.satCompact": "S",
    "timetable.weekdays.sunCompact": "S",

    "timetable.childAgenda.emptyDayMessage":
      "No class is scheduled for this day.",
    "timetable.childAgenda.unavailableTitle": "Unable to display this schedule",
    "timetable.childAgenda.unavailableMessage":
      "Check that the child is linked to this parent account.",
    "timetable.childAgenda.roomPrefix": "ROOM",
    "timetable.childAgenda.monthAgendaLabel": "SELECTED DAY AGENDA",
    "timetable.childAgenda.detail.subject": "Subject:",
    "timetable.childAgenda.detail.class": "Class:",
    "timetable.childAgenda.detail.day": "Day:",
    "timetable.childAgenda.detail.time": "Time:",
    "timetable.childAgenda.detail.teacher": "Teacher:",
    "timetable.childAgenda.detail.room": "Room:",

    "timetable.classesScreen.headerTitle": "My classes",
    "timetable.classesScreen.schoolYear.title": "School year",
    "timetable.classesScreen.schoolYear.subtitle":
      "Filter your classes to keep a clear scope before managing the schedule.",
    "timetable.classesScreen.schoolYear.label": "Year",
    "timetable.classesScreen.schoolYear.activeSuffix": "active",
    "timetable.classesScreen.classes.title": "Accessible classes",
    "timetable.classesScreen.classes.subtitle":
      "The module opens the mobile schedule page for the class. Backend restrictions for the teacher role are still enforced.",
    "timetable.classesScreen.loading": "Loading classes...",
    "timetable.classesScreen.empty.title": "No class found",
    "timetable.classesScreen.empty.message":
      "No usable assignment was found for this year.",
    "timetable.classesScreen.studentSingular": "student",
    "timetable.classesScreen.studentPlural": "students",

    "timetable.teacherAgenda.headerTitle": "Schedule",
    "timetable.teacherAgenda.tabs.users": "Users",
    "timetable.teacherAgenda.tabs.classes": "Classes",
    "timetable.teacherAgenda.tabs.mine": "My schedule",
    "timetable.teacherAgenda.tabs.myClasses": "My classes",
    "timetable.teacherAgenda.classTabLabelDefault": "Class schedule",
    "timetable.teacherAgenda.classTabLabelPrefix": "Schedule",
    "timetable.teacherAgenda.errors.loadMyAgenda":
      "Unable to load your schedule at the moment.",
    "timetable.teacherAgenda.errors.loadTeachers":
      "Unable to load the list of teachers.",
    "timetable.teacherAgenda.errors.loadTeacherAgenda":
      "Unable to load this teacher's schedule.",
    "timetable.teacherAgenda.searchTeacherPlaceholder": "Search a teacher...",
    "timetable.teacherAgenda.loadingTeachers": "Loading teachers...",
    "timetable.teacherAgenda.noResultTitle": "No results",
    "timetable.teacherAgenda.noResultMessage":
      "No teacher matches your search.",
    "timetable.teacherAgenda.emptyMessageMine":
      "No slot is scheduled for you during this period.",
    "timetable.teacherAgenda.emptyMessageTeacher":
      "No slot scheduled for this teacher during this period.",
    "timetable.teacherAgenda.emptyMessageClass":
      "No slot scheduled for this class during this period.",
    "timetable.teacherAgenda.selectTeacherTitle": "Select a teacher",
    "timetable.teacherAgenda.selectTeacherMessage":
      "Choose a teacher above to view their schedule.",
    "timetable.teacherAgenda.loadingClasses": "Loading classes...",
    "timetable.teacherAgenda.noClassTitle": "No class accessible",
    "timetable.teacherAgenda.noClassMessage":
      "No assignment found for this profile.",
    "timetable.teacherAgenda.selectClassPlaceholder": "Select a class",
    "timetable.teacherAgenda.chooseClassTitle": "Choose a class",

    "timetable.classManager.defaultTitle": "Timetable",
    "timetable.classManager.headerSubtitle": "Class timetable",
    "timetable.classManager.dateRangeTo": "to",
    "timetable.classManager.validation.chooseSubject": "Choose a subject.",
    "timetable.classManager.validation.chooseTeacher": "Choose a teacher.",
    "timetable.classManager.validation.timeFormat": "HH:MM format expected.",
    "timetable.classManager.validation.dateFormat":
      "YYYY-MM-DD format expected.",
    "timetable.classManager.validation.holidayLabelRequired":
      "The closure label is required.",
    "timetable.classManager.validation.startLabel": "Start",
    "timetable.classManager.validation.endLabel": "End",
    "timetable.classManager.validation.timeFormatError":
      "must be in HH:MM format.",
    "timetable.classManager.toast.slotUpdatedTitle": "Slot updated",
    "timetable.classManager.toast.slotUpdatedMessage":
      "The weekly schedule has been updated.",
    "timetable.classManager.toast.slotCreatedTitle": "Slot added",
    "timetable.classManager.toast.slotCreatedMessage":
      "The new class now appears in the schedule.",
    "timetable.classManager.toast.slotsCreatedMultiMessage":
      "The slots have been added to the schedule.",
    "timetable.classManager.toast.slotRejectedTitle": "Slot rejected",
    "timetable.classManager.toast.slotRejectedMessage":
      "Unable to save this slot.",
    "timetable.classManager.toast.oneOffUpdatedTitle": "Session updated",
    "timetable.classManager.toast.oneOffUpdatedMessage":
      "The schedule exception has been updated.",
    "timetable.classManager.toast.oneOffCreatedTitle":
      "Exceptional session added",
    "timetable.classManager.toast.oneOffCreatedMessage":
      "The one-off slot now appears in the schedule.",
    "timetable.classManager.toast.oneOffRejectedTitle": "Session not saved",
    "timetable.classManager.toast.oneOffRejectedMessage":
      "Unable to save this session.",
    "timetable.classManager.toast.holidayUpdatedTitle": "Closure updated",
    "timetable.classManager.toast.holidayUpdatedMessage":
      "The school calendar has been updated.",
    "timetable.classManager.toast.holidayCreatedTitle": "Closure added",
    "timetable.classManager.toast.holidayCreatedMessage":
      "The school calendar has been updated.",
    "timetable.classManager.toast.holidayRejectedTitle": "Closure rejected",
    "timetable.classManager.toast.holidayRejectedMessage":
      "Unable to save this closure.",
    "timetable.classManager.toast.slotDeletedTitle": "Slot deleted",
    "timetable.classManager.toast.slotDeletedMessage":
      "The weekly class is no longer part of the schedule.",
    "timetable.classManager.toast.deleteImpossibleTitle": "Deletion failed",
    "timetable.classManager.toast.slotDeleteErrorMessage":
      "Unable to delete this slot.",
    "timetable.classManager.toast.oneOffDeletedTitle": "Session deleted",
    "timetable.classManager.toast.oneOffDeletedMessage":
      "The one-off slot is no longer in the schedule.",
    "timetable.classManager.toast.oneOffDeleteErrorMessage":
      "Unable to delete this session.",
    "timetable.classManager.toast.holidayDeletedTitle": "Closure deleted",
    "timetable.classManager.toast.holidayDeletedMessage":
      "The school calendar has been updated.",
    "timetable.classManager.toast.holidayDeleteErrorMessage":
      "Unable to delete this closure.",
    "timetable.classManager.nav.title": "Navigation",
    "timetable.classManager.nav.subtitle":
      "Switch from the schedule view to the management forms.",
    "timetable.classManager.nav.tabLabel": "Tab",
    "timetable.classManager.nav.tabAgenda": "Schedule",
    "timetable.classManager.nav.tabSlots": "Slots",
    "timetable.classManager.nav.tabOneOff": "Exceptions",
    "timetable.classManager.nav.tabHolidays": "Closures",
    "timetable.classManager.loadingTitle": "Loading",
    "timetable.classManager.loadingClass": "Loading the class...",
    "timetable.classManager.accessTitle": "Access",
    "timetable.classManager.accessDeniedTitle": "Class unavailable",
    "timetable.classManager.accessDeniedMessage":
      "The backend may not allow managing this class for your role.",
    "timetable.classManager.agenda.title": "Consolidated schedule",
    "timetable.classManager.agenda.subtitle":
      "Unified view of recurring slots, adjustments and cancellations.",
    "timetable.classManager.agenda.emptyTitle": "No slot loaded",
    "timetable.classManager.agenda.emptyMessage":
      "Start by adding a slot or widening the period on screen.",
    "timetable.classManager.slots.editTitle": "Edit a slot",
    "timetable.classManager.slots.newTitle": "New weekly slot",
    "timetable.classManager.slots.subtitle":
      "The form stays scrollable to leave room for the keyboard and ensure reliable E2E input.",
    "timetable.classManager.fields.subject": "Subject",
    "timetable.classManager.fields.days": "Days of the week",
    "timetable.classManager.validation.chooseDays": "Select at least one day.",
    "timetable.classManager.fields.teacher": "Teacher",
    "timetable.classManager.fields.day": "Day",
    "timetable.classManager.fields.start": "Start",
    "timetable.classManager.fields.end": "End",
    "timetable.classManager.fields.room": "Room",
    "timetable.classManager.fields.roomNone": "None",
    "timetable.classManager.room.statusUnavailable": "unavailable",
    "timetable.classManager.room.statusMaintenance": "under maintenance",
    "timetable.classManager.room.statusFull": "full",
    "timetable.classManager.fields.activeFrom": "Active from",
    "timetable.classManager.fields.activeTo": "Active until",
    "timetable.classManager.fields.date": "Date",
    "timetable.classManager.fields.status": "Status",
    "timetable.classManager.fields.label": "Label",
    "timetable.classManager.placeholders.isoDate": "YYYY-MM-DD",
    "timetable.classManager.placeholders.holidayLabel": "Youth festival",
    "timetable.classManager.timePicker.startTitle": "Start time",
    "timetable.classManager.timePicker.endTitle": "End time",
    "timetable.classManager.weekdays.mon": "Mon",
    "timetable.classManager.weekdays.tue": "Tue",
    "timetable.classManager.weekdays.wed": "Wed",
    "timetable.classManager.weekdays.thu": "Thu",
    "timetable.classManager.weekdays.fri": "Fri",
    "timetable.classManager.weekdays.sat": "Sat",
    "timetable.classManager.weekdays.sun": "Sun",
    "timetable.classManager.buttons.updateSlot": "Update",
    "timetable.classManager.buttons.addSlot": "Add the slot",
    "timetable.classManager.buttons.updateOneOff": "Update",
    "timetable.classManager.buttons.addOneOff": "Add the session",
    "timetable.classManager.buttons.updateHoliday": "Update",
    "timetable.classManager.buttons.addHoliday": "Add the closure",
    "timetable.classManager.existingSlots.title": "Existing slots",
    "timetable.classManager.existingSlots.subtitle":
      "Each row can be edited or deleted.",
    "timetable.classManager.existingSlots.emptyTitle": "No recurring slot yet",
    "timetable.classManager.existingSlots.emptyMessage":
      "Add the first weekly class for this class.",
    "timetable.classManager.existingSlots.dayPrefix": "day",
    "timetable.classManager.oneoff.editTitle": "Edit a session",
    "timetable.classManager.oneoff.newTitle": "New one-off session",
    "timetable.classManager.oneoff.subtitle":
      "Use this tab for swaps, substitutions and exceptional classes.",
    "timetable.classManager.existingOneOff.title": "One-off sessions",
    "timetable.classManager.existingOneOff.subtitle":
      "History of exceptions already created for this class.",
    "timetable.classManager.existingOneOff.emptyTitle": "No exception",
    "timetable.classManager.existingOneOff.emptyMessage":
      "One-off classes, reschedules and cancellations will appear here.",
    "timetable.classManager.holidays.editTitle": "Edit a closure",
    "timetable.classManager.holidays.newTitle": "New closure",
    "timetable.classManager.holidays.subtitle":
      "Reserved for school staff roles. Used for holidays, bridge days and public holidays.",
    "timetable.classManager.holidays.calendarTitle": "School calendar",
    "timetable.classManager.holidays.calendarSubtitle":
      "School events reflected in the timetable views.",

    "timetable.oneOffPanel.title": "New slot",
    "timetable.oneOffPanel.fields.class": "Class",
    "timetable.oneOffPanel.slotType.oneoff": "One-time",
    "timetable.oneOffPanel.slotType.recurring": "Recurring",
    "timetable.oneOffPanel.fields.activeFrom": "From",
    "timetable.oneOffPanel.fields.activeTo": "Until (optional)",
    "timetable.oneOffPanel.fields.weekdayLabel": "Day",
    "timetable.oneOffPanel.addButton": "Add this slot",
    "timetable.oneOffPanel.addRecurringButton": "Add recurring slot",
    "timetable.oneOffPanel.contextError": "Unable to load the class context.",
    "timetable.oneOffPanel.validation.chooseClass": "Choose a class.",
    "timetable.oneOffPanel.validation.startRequired": "Enter the start time.",
    "timetable.oneOffPanel.validation.endRequired": "Enter the end time.",
    "timetable.oneOffPanel.validation.roomRequired": "Enter a room.",
    "timetable.oneOffPanel.validation.endAfterStart":
      "The end time must be after the start time.",
    "timetable.oneOffPanel.validation.activeFromRequired":
      "Enter a start date.",
    "timetable.oneOffPanel.validation.activeToAfterFrom":
      "End date must be after start date.",
    "timetable.oneOffPanel.toasts.createdTitle": "Class added",
    "timetable.oneOffPanel.toasts.createdMessage":
      "The slot now appears in the schedule.",
    "timetable.oneOffPanel.toasts.recurringCreatedTitle":
      "Recurring slot added",
    "timetable.oneOffPanel.toasts.recurringCreatedMessage":
      "The recurring slot has been added to the timetable.",
    "timetable.oneOffPanel.toasts.createErrorTitle": "Creation failed",

    "timetable.slotScreen.headerTitle": "Schedule",
    "timetable.slotScreen.create.heroTitle": "Create a slot",
    "timetable.slotScreen.edit.heroTitle": "Edit a slot",
    "timetable.slotScreen.heroSubtitle": "Set the date, time and room",

    "timetable.slotEditPanel.title": "EDIT THIS SLOT",
    "timetable.slotEditPanel.scope.occurrence": "This slot",
    "timetable.slotEditPanel.scope.series": "Whole series",
    "timetable.slotEditPanel.validation.startRequired": "Enter the start time.",
    "timetable.slotEditPanel.validation.endRequired": "Enter the end time.",
    "timetable.slotEditPanel.validation.roomRequired": "Enter a room.",
    "timetable.slotEditPanel.validation.endAfterStart":
      "The end time must be after the start time.",
    "timetable.slotEditPanel.buttons.back": "Back",
    "timetable.slotEditPanel.buttons.delete": "Delete",
    "timetable.slotEditPanel.buttons.save": "Update",
    "timetable.slotEditPanel.confirm.deleteSeriesTitle":
      "Delete the whole series?",
    "timetable.slotEditPanel.confirm.deleteOccurrenceTitle":
      "Delete this slot?",
    "timetable.slotEditPanel.confirm.deleteSeriesMessage":
      "All classes in this weekly series will be deleted.",
    "timetable.slotEditPanel.confirm.deleteOccurrenceMessage":
      "This class will be cancelled for this date only.",
    "timetable.slotEditPanel.toasts.seriesUpdatedTitle": "Series updated",
    "timetable.slotEditPanel.toasts.seriesUpdatedMessage":
      "All classes in this series have been updated.",
    "timetable.slotEditPanel.toasts.slotUpdatedTitle": "Slot updated",
    "timetable.slotEditPanel.toasts.slotUpdatedMessage":
      "This class has been updated.",
    "timetable.slotEditPanel.toasts.exceptionUpdatedMessage":
      "This class has been updated for this date only.",
    "timetable.slotEditPanel.toasts.updateErrorTitle": "Update failed",
    "timetable.slotEditPanel.toasts.seriesDeletedTitle": "Series deleted",
    "timetable.slotEditPanel.toasts.seriesDeletedMessage":
      "All classes in this series have been deleted.",
    "timetable.slotEditPanel.toasts.slotDeletedTitle": "Slot deleted",
    "timetable.slotEditPanel.toasts.slotDeletedMessage":
      "This class has been deleted.",
    "timetable.slotEditPanel.toasts.slotCancelledTitle": "Slot cancelled",
    "timetable.slotEditPanel.toasts.slotCancelledMessage":
      "This class is cancelled for this date only.",
    "timetable.slotEditPanel.toasts.deleteErrorTitle": "Deletion failed",

    "messaging.title": "Messages",
    "messaging.folders.inbox": "Inbox",
    "messaging.folders.sent": "Sent",
    "messaging.folders.drafts": "Drafts",
    "messaging.folders.archive": "Archive",

    "messaging.list.searchPlaceholder": "Search…",
    "messaging.list.searchEntry": "Search a message",
    "messaging.list.emptyNoResult": "No results",
    "messaging.list.emptyInbox": "No received messages",
    "messaging.list.emptySent": "No sent messages",
    "messaging.list.emptyDrafts": "No drafts",
    "messaging.list.emptyArchive": "Archive is empty",
    "messaging.list.emptySearchHint": "Try different keywords",
    "messaging.list.emptyDefaultHint": "Messages will appear here",
    "messaging.list.endOfList": "All messages have been loaded",
    "messaging.list.draftTag": "Draft · ",
    "messaging.list.noSubject": "(no subject)",
    "messaging.list.unknownSender": "Unknown sender",
    "messaging.list.recipientSingular": "1 recipient",
    "messaging.list.recipientPlural": "{count} recipients",

    "messaging.compose.titleNew": "New message",
    "messaging.compose.titleReply": "Reply",
    "messaging.compose.titleForward": "Forward",
    "messaging.compose.recipientsLabel": "To",
    "messaging.compose.subjectLabel": "Subject",
    "messaging.compose.subjectPlaceholder": "Message subject",
    "messaging.compose.recipientsLoading": "Loading contacts…",
    "messaging.compose.recipientsPlaceholder": "Choose recipients",
    "messaging.compose.recipientsError": "Choose at least one recipient.",
    "messaging.compose.bodyPlaceholder": "Write your message…",
    "messaging.compose.bodyError": "Write a message before sending.",
    "messaging.compose.subjectError": "Subject is required.",
    "messaging.compose.insertingImage": "Inserting image…",
    "messaging.compose.attachmentsTitle": "Attachments ({count})",
    "messaging.compose.attachments.forwardedTag": "forwarded",
    "messaging.compose.attachBtn": "Attach",
    "messaging.compose.draftBtn": "Draft",
    "messaging.compose.sendBtn": "Send",
    "messaging.compose.defaultDraftSubject": "Draft without subject",

    "messaging.compose.insertImage.title": "Insert an image",
    "messaging.compose.insertImage.message": "Choose a source",
    "messaging.compose.insertImage.gallery": "Gallery",
    "messaging.compose.insertImage.camera": "Camera",
    "messaging.compose.cancel": "Cancel",

    "messaging.compose.imageEdit.title": "Edit image",
    "messaging.compose.imageEdit.size": "Size",
    "messaging.compose.imageEdit.sizeSmall": "Small",
    "messaging.compose.imageEdit.sizeMedium": "Medium",
    "messaging.compose.imageEdit.sizeLarge": "Large",
    "messaging.compose.imageEdit.sizeFull": "Full width",
    "messaging.compose.imageEdit.align": "Alignment",
    "messaging.compose.imageEdit.alignLeft": "Left",
    "messaging.compose.imageEdit.alignCenter": "Center",
    "messaging.compose.imageEdit.alignRight": "Right",
    "messaging.compose.imageEdit.delete": "Delete image",
    "messaging.compose.imageEdit.close": "Close",

    "messaging.compose.attachMenu.title": "Attach a file",
    "messaging.compose.attachMenu.message": "Choose the content type",
    "messaging.compose.attachMenu.takePhoto": "Take a photo",
    "messaging.compose.attachMenu.openGallery": "Open gallery",
    "messaging.compose.attachMenu.insertFile": "Insert a file",

    "messaging.compose.colorMenu.title": "Text color",
    "messaging.compose.colorMenu.message": "Choose a color",
    "messaging.compose.colorMenu.deepBlue": "Deep blue",
    "messaging.compose.colorMenu.supportGreen": "Support green",
    "messaging.compose.colorMenu.alertRed": "Alert red",
    "messaging.compose.colorMenu.black": "Black",

    "messaging.compose.errors.permissionDeniedTitle": "Permission denied",
    "messaging.compose.errors.galleryPermission":
      "Allow access to the gallery.",
    "messaging.compose.errors.cameraPermission": "Allow access to the camera.",
    "messaging.compose.errors.genericTitle": "Error",
    "messaging.compose.errors.insertImageFailed":
      "Unable to insert the image. Please try again.",
    "messaging.compose.errors.documentPickerFailed":
      "Unable to open the file picker.",

    "messaging.compose.toasts.draftSavedTitle": "Draft saved",
    "messaging.compose.toasts.draftSavedMessage":
      "Your draft has been saved successfully.",
    "messaging.compose.toasts.draftSaveErrorTitle": "Unable to save",
    "messaging.compose.toasts.draftSaveErrorMessage":
      "Unable to save the draft.",
    "messaging.compose.toasts.sentTitle": "Message sent",
    "messaging.compose.toasts.sentMessage":
      "Your message has been sent successfully.",
    "messaging.compose.toasts.sendErrorTitle": "Unable to send",
    "messaging.compose.toasts.sendErrorMessage":
      "Unable to send the message. Please try again.",

    "messaging.detail.draftBadge": "Draft",
    "messaging.detail.fromYou": "You",
    "messaging.detail.fromLabel": "From: ",
    "messaging.detail.recipientsToggleSingular": "1 recipient",
    "messaging.detail.recipientsTogglePlural": "{count} recipients",
    "messaging.detail.recipientsSectionTitle": "Recipients",
    "messaging.detail.header.inboxPrefix": "{user}'s inbox · ",
    "messaging.detail.header.sent": "{user}'s sent messages · {total}",
    "messaging.detail.header.drafts": "{user}'s drafts · {total}",
    "messaging.detail.header.archive": "{user}'s archive · {total}",
    "messaging.detail.attachmentsTitle": "Attachments",
    "messaging.detail.errors.loadFailedTitle": "Error",
    "messaging.detail.errors.loadFailedMessage": "Unable to load this message.",
    "messaging.detail.errors.markUnreadFailedTitle": "Error",
    "messaging.detail.errors.markUnreadFailedMessage":
      "Unable to mark this message as unread.",
    "messaging.detail.errors.openAttachmentFailedTitle": "Error",
    "messaging.detail.errors.openAttachmentFailedMessage":
      "Unable to open this attachment on this device.",

    "messaging.detail.reply.quoteHeader": "On {date}, {sender} wrote:",
    "messaging.detail.forward.subjectPrefix": "Fwd: ",
    "messaging.detail.forward.quoteHeader":
      "---------- Forwarded message ----------",
    "messaging.detail.forward.quoteFrom": "From: {sender}",
    "messaging.detail.forward.quoteDate": "Date: {date}",
    "messaging.detail.forward.quoteSubject": "Subject: {subject}",
    "messaging.detail.forward.quoteTo": "To: {recipients}",

    "messaging.actions.reply": "Reply",
    "messaging.actions.forward": "Forward",
    "messaging.actions.markUnread": "Unread",
    "messaging.actions.archive": "Archive",
    "messaging.actions.unarchive": "Restore",
    "messaging.actions.delete": "Delete",
    "messaging.actions.deleteDialog.title": "Delete this message?",
    "messaging.actions.deleteDialog.message":
      "The message will be permanently deleted from your mailbox.",
    "messaging.actions.deleteDialog.confirm": "Delete",
    "messaging.actions.deleteDialog.cancel": "Cancel",

    "messaging.toasts.markedUnreadTitle": "Marked as unread",
    "messaging.toasts.markedUnreadMessage":
      "You'll find it unread in your mailbox.",
    "messaging.toasts.archivedTitle": "Message archived",
    "messaging.toasts.archivedMessage":
      "The message has been moved to the archive.",
    "messaging.toasts.unarchivedTitle": "Message restored",
    "messaging.toasts.unarchivedMessage":
      "The message has been removed from the archive.",
    "messaging.toasts.archiveErrorTitle": "Unable to archive",
    "messaging.toasts.archiveErrorMessage": "Unable to archive this message.",
    "messaging.toasts.deletedTitle": "Message deleted",
    "messaging.toasts.deletedMessage":
      "The message has been deleted successfully.",
    "messaging.toasts.deleteErrorTitle": "Unable to delete",
    "messaging.toasts.deleteErrorMessage": "Unable to delete this message.",

    "messaging.recipientPicker.title": "Recipients",
    "messaging.recipientPicker.cancel": "Cancel",
    "messaging.recipientPicker.confirm": "OK ({count})",
    "messaging.recipientPicker.searchPlaceholder": "Search a recipient…",
    "messaging.recipientPicker.emptyResult": "No recipients found",
    "messaging.recipientPicker.defaultTeacherSubtitle": "Teacher",

    "messaging.nav.unreadMessagesTitle": "Unread messages",
    "messaging.nav.unreadMessagesLabel": "Messages",
    "messaging.nav.unreadMessagesSub": "unread",
    "messaging.nav.noUnreadMessages": "No unread messages",
    "messaging.nav.loading": "Loading…",

    "tests.title": "Tests",
    "tests.common.cancel": "Cancel",
    "tests.common.noValue": "—",
    "tests.common.restrictedTitle": "Restricted access",
    "tests.common.restrictedMessage":
      "This module is reserved for users marked as testers.",
    "tests.common.errors.loadTitle": "Unable to load",
    "tests.common.errors.loadGeneric": "Unable to load the test data.",
    "tests.common.errors.submitTitle": "Unable to submit",
    "tests.common.errors.submitGeneric": "Unable to save this test result.",
    "tests.status.todo": "To do",
    "tests.status.notStarted": "Not started",
    "tests.status.inProgress": "In progress",
    "tests.status.passed": "Passed",
    "tests.status.failed": "Failed",
    "tests.status.blocked": "Blocked",
    "tests.status.skipped": "Skipped",
    "tests.priority.low": "Low priority",
    "tests.priority.medium": "Medium priority",
    "tests.priority.high": "High priority",
    "tests.priority.critical": "Critical",
    "tests.campaigns.subtitle": "Manual test campaigns",
    "tests.campaigns.emptyTitle": "No active campaign",
    "tests.campaigns.emptyMessage":
      "Upcoming manual test campaigns will appear here.",
    "tests.campaigns.totalCases": "{count} tests",
    "tests.campaigns.dueLabel": "Due {date}",
    "tests.campaigns.targetVersion": "Target version {version}",
    "tests.campaigns.progressLabel": "{done} tests completed out of {total}",
    "tests.cases.subtitle": "Test list",
    "tests.cases.executionCount": "{count} results",
    "tests.detail.subtitle": "Test details",
    "tests.detail.objective": "Objective",
    "tests.detail.preconditions": "Preconditions",
    "tests.detail.expectedResult": "Expected result",
    "tests.detail.steps": "Steps",
    "tests.detail.noSteps": "No detailed steps.",
    "tests.detail.completedBy": "Already completed by",
    "tests.detail.noCompletedUsers": "No tester has submitted a result yet.",
    "tests.detail.submitTitle": "Submit my result",
    "tests.detail.resultPlaceholder":
      "Describe what you observed during the test…",
    "tests.detail.commentPlaceholder": "Additional comment or useful context…",
    "tests.detail.submit": "Save result",
    "tests.detail.submitting": "Saving…",
    "tests.detail.historyTitle": "Result history",
    "tests.detail.historyEmpty":
      "No result has been recorded for this test yet.",
    "tests.detail.permissions.title": "Permission required",
    "tests.detail.permissions.gallery":
      "Allow access to the gallery to attach screenshots.",
    "tests.detail.permissions.camera":
      "Allow access to the camera to attach screenshots.",
    "tests.detail.attachments.title": "Add screenshots",
    "tests.detail.attachments.message":
      "Choose the source for the result images.",
    "tests.detail.attachments.camera": "Take a photo",
    "tests.detail.attachments.gallery": "Open gallery",
    "tests.detail.attachments.add": "Add screenshots",
    "tests.detail.attachments.image": "Image",
    "tests.detail.attachments.file": "File",
    "tests.detail.heroSubtitle": "Fill in the result status and details",
    "tests.detail.fabAdd": "Submit a result",
    "tests.detail.viewResults": "View results",
    "tests.detail.formModalTitle": "Submit my result",
    "tests.detail.toastSuccessTitle": "Result saved",
    "tests.detail.toastSuccessMessage": "Your result has been recorded.",
    "tests.detail.sections.info": "Test information",
    "tests.detail.validation.resultRequired":
      "Describe the observed result before saving.",
    "tests.detail.validation.attachmentsRequired":
      "This test requires at least one screenshot as evidence.",

    "tests.tabs.summary": "Summary",
    "tests.tabs.campaigns": "Campaigns",
    "tests.tabs.executions": "Tests done",

    "tests.executions.filters.status": "Status",
    "tests.executions.filters.statusAll": "All statuses",
    "tests.executions.filters.campaign": "Campaign",
    "tests.executions.filters.campaignAll": "All campaigns",
    "tests.executions.emptyTitle": "No test done yet",
    "tests.executions.emptyMessage":
      "Your test results will appear here once submitted.",
    "tests.executions.cardCampaign": "Campaign: {title}",
    "tests.executions.detail.subtitle": "Result detail",
    "tests.executions.detail.resultLabel": "Result",
    "tests.executions.detail.commentLabel": "Comment",
    "tests.executions.detail.deviceLabel": "Device",
    "tests.executions.detail.versionLabel": "Version",
    "tests.executions.detail.attachmentsLabel": "Screenshots",
    "tests.executions.detail.swipeHint": "Swipe to go to the next one",
    "tests.executions.detail.editFab": "Edit result",
    "tests.executions.edit.heroTitle": "Edit result",
    "tests.executions.edit.heroSubtitle": "Update the status and details",
    "tests.executions.edit.submit": "Save changes",
    "tests.executions.edit.submitting": "Saving…",
    "tests.executions.edit.cancel": "Cancel",
    "tests.executions.edit.toastSuccessTitle": "Result updated",
    "tests.executions.edit.toastSuccessMessage": "The changes have been saved.",
    "tests.executions.edit.validation.resultRequired": "Result is required.",

    "tests.summary.subtitle": "Overview",
    "tests.summary.kpi.totalCampaigns": "Campaigns",
    "tests.summary.kpi.inProgress": "In progress",
    "tests.summary.kpi.completed": "Completed",
    "tests.summary.kpi.upcoming": "Upcoming",
    "tests.summary.kpi.totalCases": "Test cases",
    "tests.summary.kpi.myExecutions": "My results",
    "tests.summary.kpi.pending": "Remaining tests",
    "tests.summary.highlight.title": "To do today",
    "tests.summary.highlight.campaignBadge": "Campaign",
    "tests.summary.highlight.cta": "Open test",
    "tests.summary.highlight.empty":
      "Every visible test is up to date. Nice work!",
    "tests.summary.emptyTitle": "No active campaign",
    "tests.summary.emptyMessage": "Upcoming test campaigns will appear here.",

    "tests.campaigns.filters.all": "All",
    "tests.campaigns.filters.inProgress": "In progress",
    "tests.campaigns.filters.upcoming": "Upcoming",
    "tests.campaigns.filters.completed": "Completed",
    "tests.campaigns.status.inProgress": "In progress",
    "tests.campaigns.status.upcoming": "Upcoming",
    "tests.campaigns.status.completed": "Completed",

    "testsAdmin.title": "Tests (admin)",
    "testsAdmin.subtitle": "Global management of test campaigns",
    "testsAdmin.tabs.summary": "Summary",
    "testsAdmin.tabs.campaigns": "Campaigns",
    "testsAdmin.tabs.testers": "Testers",
    "testsAdmin.tabs.executions": "Tests done",
    "testsAdmin.common.cancel": "Cancel",
    "testsAdmin.common.save": "Save",
    "testsAdmin.common.saving": "Saving…",
    "testsAdmin.common.close": "Close",
    "testsAdmin.common.errors.loadGeneric": "Unable to load the data.",
    "testsAdmin.common.errors.submitGeneric":
      "Something went wrong, please try again.",
    "testsAdmin.summary.kpi.campaignsActive": "Active campaigns",
    "testsAdmin.summary.kpi.campaignsTotal": "Total campaigns",
    "testsAdmin.summary.kpi.totalCases": "Test cases",
    "testsAdmin.summary.kpi.testersCount": "Active testers",
    "testsAdmin.summary.kpi.executions": "Executions",
    "testsAdmin.summary.kpi.successRate": "Success rate",
    "testsAdmin.summary.kpi.pendingReview": "Pending review",

    "testsAdmin.executions.filters.status": "Status",
    "testsAdmin.executions.filters.statusAll": "All statuses",
    "testsAdmin.executions.filters.campaign": "Campaign",
    "testsAdmin.executions.filters.campaignAll": "All campaigns",
    "testsAdmin.executions.filters.tester": "Tester",
    "testsAdmin.executions.filters.testerAll": "All testers",
    "testsAdmin.executions.filters.reviewed": "Review status",
    "testsAdmin.executions.filters.reviewedAll": "All",
    "testsAdmin.executions.filters.reviewedPending": "Pending",
    "testsAdmin.executions.filters.reviewedDone": "Reviewed",
    "testsAdmin.executions.emptyTitle": "No test done yet",
    "testsAdmin.executions.emptyMessage": "No execution matches these filters.",
    "testsAdmin.executions.cardTester": "By {name}",
    "testsAdmin.executions.cardCampaign": "Campaign: {title}",
    "testsAdmin.executions.reviewedBadge": "Reviewed",
    "testsAdmin.executions.pendingBadge": "Pending",
    "testsAdmin.executions.detail.subtitle": "Result detail",
    "testsAdmin.executions.detail.resultLabel": "Result",
    "testsAdmin.executions.detail.commentLabel": "Comment",
    "testsAdmin.executions.detail.deviceLabel": "Device",
    "testsAdmin.executions.detail.versionLabel": "Version",
    "testsAdmin.executions.detail.attachmentsLabel": "Screenshots",
    "testsAdmin.executions.detail.swipeHint": "Swipe to go to the next one",
    "testsAdmin.executions.detail.reviewedBy": "Reviewed by {name} on {date}",
    "testsAdmin.executions.review.markReviewed": "Mark as reviewed",
    "testsAdmin.executions.review.unmark": "Undo review",
    "testsAdmin.executions.review.title": "Mark this test as reviewed",
    "testsAdmin.executions.review.noteLabel": "Note (optional)",
    "testsAdmin.executions.review.notePlaceholder": "E.g. Fixed in version 1.3",
    "testsAdmin.executions.review.submit": "Confirm",
    "testsAdmin.executions.review.submitting": "Saving…",
    "testsAdmin.campaigns.searchPlaceholder": "Search by number or title…",
    "testsAdmin.campaigns.filters.all": "All statuses",
    "testsAdmin.campaigns.filters.draft": "Draft",
    "testsAdmin.campaigns.filters.active": "Active",
    "testsAdmin.campaigns.filters.archived": "Archived",
    "testsAdmin.campaigns.status.draft": "Draft",
    "testsAdmin.campaigns.status.active": "Active",
    "testsAdmin.campaigns.status.archived": "Archived",
    "testsAdmin.campaigns.empty": "No campaign.",
    "testsAdmin.campaigns.testCasesCount": "{count} test cases",
    "testsAdmin.campaigns.referencePrefix": "CMP-{reference}",
    "testsAdmin.campaigns.createButton": "New campaign",
    "testsAdmin.detail.back": "Back to campaigns",
    "testsAdmin.detail.editCampaign": "Edit campaign",
    "testsAdmin.detail.deleteCampaign": "Delete campaign",
    "testsAdmin.detail.deleteCampaignConfirmTitle": "Delete this campaign?",
    "testsAdmin.detail.deleteCampaignConfirmMessage":
      "This action is irreversible and will also delete its test cases.",
    "testsAdmin.detail.testersTitle": "Assigned testers",
    "testsAdmin.detail.assignButton": "Assign to a tester",
    "testsAdmin.detail.noAssignments": "No tester assigned.",
    "testsAdmin.detail.unassign": "Remove",
    "testsAdmin.detail.quickMessage": "Quick message",
    "testsAdmin.detail.casesTitle": "{count} test cases",
    "testsAdmin.detail.addCase": "Add a case",
    "testsAdmin.detail.recycle": "Recycle",
    "testsAdmin.detail.recycling": "Recycling…",
    "testsAdmin.detail.recycledOn": "Recycled on {date}",
    "testsAdmin.detail.edit": "Edit",
    "testsAdmin.detail.delete": "Delete",
    "testsAdmin.detail.deleteCaseConfirmTitle": "Delete this test case?",
    "testsAdmin.detail.deleteCaseConfirmMessage":
      "This action is irreversible.",
    "testsAdmin.detail.executionsCount": "{count} execution(s)",
    "testsAdmin.detail.referencePrefix": "CAS-{reference}",
    "testsAdmin.caseDetail.title": "Test case detail",
    "testsAdmin.caseDetail.swipeHint": "Swipe to go to the next case",
    "testsAdmin.caseDetail.updateSuccessTitle": "Test case updated",
    "testsAdmin.caseDetail.updateSuccessMessage": "Your changes were saved.",
    "testsAdmin.caseDetail.recycleSuccessTitle": "Test case recycled",
    "testsAdmin.caseDetail.recycleSuccessMessage":
      "The test case was recycled.",
    "testsAdmin.caseDetail.deleteSuccessTitle": "Test case deleted",
    "testsAdmin.caseDetail.deleteSuccessMessage": "The test case was deleted.",
    "testsAdmin.executions.detail.viewCase": "View the full request",
    "testsAdmin.executions.detail.caseContentTitle": "Test content",
    "testsAdmin.executions.detail.quickMessage": "Quick message to tester",
    "testsAdmin.assign.title": "Assign a campaign",
    "testsAdmin.assign.testerLabel": "Tester",
    "testsAdmin.assign.testerPlaceholder": "Choose a tester…",
    "testsAdmin.assign.testerRequired": "Choose a tester.",
    "testsAdmin.assign.noteLabel": "Note",
    "testsAdmin.assign.notePlaceholder": "e.g. Priority before Friday",
    "testsAdmin.assign.submit": "Assign",
    "testsAdmin.assign.submitting": "Assigning…",
    "testsAdmin.campaignForm.createTitle": "New campaign",
    "testsAdmin.campaignForm.editTitle": "Edit campaign",
    "testsAdmin.campaignForm.titleLabel": "Title",
    "testsAdmin.campaignForm.titlePlaceholder": "e.g. Mobile recipe v1",
    "testsAdmin.campaignForm.titleRequired": "Title is required.",
    "testsAdmin.campaignForm.descriptionLabel": "Description",
    "testsAdmin.campaignForm.targetVersionLabel": "Target version",
    "testsAdmin.campaignForm.startsAtLabel": "Start date",
    "testsAdmin.campaignForm.dueAtLabel": "Due date",
    "testsAdmin.campaignForm.statusLabel": "Status",
    "testsAdmin.caseForm.createTitle": "New test case",
    "testsAdmin.caseForm.editTitle": "Edit test case",
    "testsAdmin.caseForm.titleLabel": "Title",
    "testsAdmin.caseForm.titlePlaceholder": "e.g. Login via email",
    "testsAdmin.caseForm.titleRequired": "Title is required.",
    "testsAdmin.caseForm.moduleLabel": "Module",
    "testsAdmin.caseForm.objectiveLabel": "Objective",
    "testsAdmin.caseForm.preconditionsLabel": "Preconditions",
    "testsAdmin.caseForm.expectedResultLabel": "Expected result",
    "testsAdmin.caseForm.expectedResultRequired":
      "The expected result is required.",
    "testsAdmin.caseForm.priorityLabel": "Priority",
    "testsAdmin.caseForm.priority.low": "Low",
    "testsAdmin.caseForm.priority.medium": "Medium",
    "testsAdmin.caseForm.priority.high": "High",
    "testsAdmin.caseForm.priority.critical": "Critical",
    "testsAdmin.caseForm.evidenceRequiredLabel": "Screenshot required",
    "testsAdmin.caseForm.dueAtLabel": "Due date",
    "testsAdmin.testers.searchPlaceholder": "Search a tester by name…",
    "testsAdmin.testers.empty": "No tester.",
    "testsAdmin.testers.campaigns": "Campaigns",
    "testsAdmin.testers.executions": "Tests done",
    "testsAdmin.testers.passed": "OK",
    "testsAdmin.testers.failed": "NOK",
    "testsAdmin.message.title": "Quick message to {name}",
    "testsAdmin.message.subjectLabel": "Subject",
    "testsAdmin.message.subjectPlaceholder": "e.g. Please test this module",
    "testsAdmin.message.subjectRequired": "The subject is required.",
    "testsAdmin.message.bodyLabel": "Message",
    "testsAdmin.message.bodyPlaceholder": "Can you replay the campaign?",
    "testsAdmin.message.bodyRequired": "The message is required.",
    "testsAdmin.message.send": "Send",
    "testsAdmin.message.sending": "Sending…",
    "testsAdmin.message.sent": "Message sent.",
    "testsAdmin.message.noSchool": "This tester is not enrolled in any school.",

    "feed.filters.all": "All",
    "feed.filters.featured": "Featured",
    "feed.filters.polls": "Polls",
    "feed.filters.mine": "My posts",

    "feed.search.placeholder": "Search a post",

    "feed.unavailable.title": "Feed unavailable",
    "feed.unavailable.message":
      "This role does not have access to the news feed module yet.",

    "feed.errors.loadFailed": "Unable to load the feed.",
    "feed.errors.childContextMissing": "Child context not found.",
    "feed.errors.classContextMissing": "Class context not found.",
    "feed.errors.schoolMissing": "School not found",

    "feed.toast.pollPublishedTitle": "Poll published",
    "feed.toast.postPublishedTitle": "Post published",
    "feed.toast.pollPublishedMessage": "The poll is now visible in the feed.",
    "feed.toast.postPublishedMessage":
      "Your post has been added to the news feed.",
    "feed.toast.publishErrorTitle": "Unable to publish",
    "feed.toast.publishErrorMessage":
      "Unable to publish this post at the moment.",
    "feed.toast.likeErrorTitle": "Reaction unavailable",
    "feed.toast.likeErrorMessage": "Unable to save your reaction.",
    "feed.toast.commentErrorTitle": "Comment not sent",
    "feed.toast.commentErrorMessage": "Unable to add this comment.",
    "feed.toast.voteErrorTitle": "Vote unavailable",
    "feed.toast.voteErrorMessage": "Unable to save your vote.",
    "feed.toast.deleteSuccessTitle": "Post deleted",
    "feed.toast.deleteErrorTitle": "Unable to delete",
    "feed.toast.deleteErrorMessage": "Unable to delete this post.",
    "feed.toast.imageErrorTitle": "Image not added",
    "feed.toast.imageErrorMessage": "Unable to add the image.",

    "feed.empty.noResultsTitle": "No results",
    "feed.empty.noResultsMessage": "Try different keywords.",

    "feed.composer.infoLabel": "Info",
    "feed.composer.pollLabel": "Poll",
    "feed.composer.eyebrow": "Post",
    "feed.composer.heading": "Share a post",
    "feed.composer.modePost": "Post",
    "feed.composer.modePoll": "Poll",
    "feed.composer.titlePlaceholder": "Post title",
    "feed.composer.editorPlaceholder": "Write the post content…",
    "feed.composer.pollQuestionPlaceholder": "Poll question",
    "feed.composer.pollOptionPlaceholder": "Option {number}",
    "feed.composer.addOption": "Add an option",
    "feed.composer.featuredStandard": "Standard",
    "feed.composer.featured3Days": "3 d",
    "feed.composer.featured7Days": "7 d",
    "feed.composer.publishing": "Publishing…",
    "feed.composer.publishPoll": "Publish the poll",
    "feed.composer.publish": "Publish",
    "feed.composer.colorMenuTitle": "Text color",
    "feed.composer.colorMenuMessage": "Choose a color",
    "feed.composer.colorDeepBlue": "Deep blue",
    "feed.composer.colorSchoolGreen": "School green",
    "feed.composer.colorAlertRed": "Alert red",
    "feed.composer.colorBlack": "Black",
    "feed.composer.cancel": "Cancel",

    "feed.fileSize.bytes": "B",
    "feed.fileSize.kb": "KB",
    "feed.fileSize.mb": "MB",

    "feed.validation.titleRequired": "Title is required.",
    "feed.validation.pollQuestionRequired": "The question is required.",
    "feed.validation.pollOptionsMin":
      "At least 2 non-empty options are required.",
    "feed.validation.bodyRequired":
      "Add some content before publishing this post.",

    "feed.permission.galleryDeniedTitle": "Permission denied",
    "feed.permission.galleryDeniedMessage": "Allow access to the gallery.",

    "feed.deleteDialog.title": "Delete this post?",
    "feed.deleteDialog.subtitle": "This action is immediate",
    "feed.deleteDialog.message":
      "The post will be removed from the {context} for authorized readers.",
    "feed.deleteDialog.confirm": "Delete",
    "feed.deleteDialog.cancel": "Cancel",

    "feed.audience.parentsOnly": "Parents only",
    "feed.audience.myClass": "My class",
    "feed.audience.wholeSchool": "Whole school",
    "feed.audience.parentsAndStudents": "Parents & students",
    "feed.audience.staffOnly": "Staff only",
    "feed.audience.classLabel": "Class {name}",

    "feed.attachments.title": "Attachments",
    "feed.attachments.add": "Attach",
    "feed.attachments.empty": "No attachments for this post.",
    "feed.attachments.summaryMultiple": "{count} attachments",

    "feed.post.noText": "Post with no text.",
    "feed.post.voteUnit": "vote",
    "feed.post.voteUnitPlural": "votes",
    "feed.post.selectedSuffix": ", selected",
    "feed.post.likesAria": "Reactions {count}",
    "feed.post.likedSuffix": ", liked",
    "feed.post.commentsAria": "Comments {count}",
    "feed.post.hideReaction": "Hide reaction",
    "feed.post.react": "React",
    "feed.post.commentPlaceholder": "Add a comment...",
    "feed.post.addEmojiAria": "Add {emoji}",
    "feed.post.submitComment": "Comment",

    "feed.classLife.title": "Class life",
    "feed.classLife.endOfList": "End of class posts",
    "feed.classLife.emptyTitle": "No class news",
    "feed.classLife.emptyMessageChild":
      "Group information shared with the class will appear here.",
    "feed.classLife.emptyMessageTeacher":
      "Information shared with this class will appear here.",
    "feed.classLife.deleteSuccess":
      "This post no longer appears in the class life feed.",
    "feed.classLife.context": "class feed",
    "feed.classLife.studentFallback": "Student",
    "feed.classLife.classWithId": "Class {classId}",
    "feed.classLife.classActive": "Active class",

    "feed.page.title": "News feed",
    "feed.page.endOfList": "You have reached the end of the feed",
    "feed.page.emptyTitle": "No news yet",
    "feed.page.emptyMessage":
      "Important information from the school will appear here.",
    "feed.page.deleteSuccess": "This post no longer appears in the feed.",
    "feed.page.context": "news feed",
    "feed.page.heroTitle": "Share a useful announcement",
    "feed.page.heroSubtitle":
      "School information, reminders, polls and everyday life.",
    "feed.detail.headerTitle": "Post",
    "feed.detail.backToList": "Back to list",
    "feed.composer.titleLabel": "Title",
    "feed.composer.contentLabel": "Content",
    "feed.comments.summaryNone": "Be the first to react",
    "feed.comments.summaryOne": "1 comment",
    "feed.comments.summaryMany": "{count} comments",

    "notes.tabs.evaluations": "Evaluations",
    "notes.tabs.scores": "Score entry",
    "notes.tabs.notes": "Notes",
    "notes.tabs.council": "Class council",

    "notes.classes.title": "Grade book",
    "notes.classes.filterTitle": "Filter by school year",
    "notes.classes.filterSubtitle":
      "Accessible classes depend on your assignments and your role.",
    "notes.classes.yearLabel": "School year",
    "notes.classes.listTitle": "Accessible classes",
    "notes.classes.listSubtitle":
      "Open the grade book for each class and pick up where you left off.",
    "notes.classes.loading": "Loading classes...",
    "notes.classes.emptyTitle": "No class available",
    "notes.classes.emptyMessage":
      "No accessible class was found for this profile.",
    "notes.classes.studentSingular": "student",
    "notes.classes.studentPlural": "students",

    "notes.teacher.empty.title": "No student",
    "notes.teacher.empty.message": "No student is enrolled in this class.",
    "notes.teacher.filters.studentLabel": "STUDENT",
    "notes.teacher.filters.subjectLabel": "SUBJECT",
    "notes.teacher.filters.allSubjects": "All subjects",
    "notes.teacher.picker.selectStudent": "Select a student",
    "notes.teacher.picker.filterBySubject": "Filter by subject",

    "notes.terms.term1": "Term 1",
    "notes.terms.term2": "Term 2",
    "notes.terms.term3": "Term 3",
    "notes.sequences.seq1": "T1 — Sequence 1",
    "notes.sequences.seq2": "T1 — Sequence 2 (exam)",
    "notes.sequences.seq3": "T2 — Sequence 3",
    "notes.sequences.seq4": "T2 — Sequence 4 (exam)",
    "notes.sequences.seq5": "T3 — Sequence 5",
    "notes.sequences.seq6": "T3 — Sequence 6 (exam)",

    "notes.scoreStatus.absent": "Abs",
    "notes.scoreStatus.excused": "Exc",
    "notes.scoreStatus.notGraded": "NG",

    "notes.delta.atClassLevel": "At class level",
    "notes.delta.vsClass": "pts vs class",

    "notes.dateNotSet": "Date not set",

    "notes.form.backToList": "Evaluations list",
    "notes.form.sections.identification": "Identification",
    "notes.form.sections.classification": "Classification",
    "notes.form.sections.planning": "Scheduling",
    "notes.form.sections.description": "Description",
    "notes.form.sections.attachments": "Attachments",
    "notes.form.fields.title": "Title",
    "notes.form.fields.titlePlaceholder": "Math test",
    "notes.form.fields.subject": "Subject",
    "notes.form.fields.subjectPlaceholder": "Select a subject",
    "notes.form.fields.branch": "Sub-branch",
    "notes.form.fields.branchPlaceholder": "Select a sub-branch",
    "notes.form.fields.type": "Type",
    "notes.form.fields.typePlaceholder": "Select a type",
    "notes.form.fields.scheduledDate": "Scheduled date",
    "notes.form.fields.datePlaceholder": "Choose a date",
    "notes.form.fields.dateTitle": "Evaluation date",
    "notes.form.fields.time": "Time",
    "notes.form.fields.timeTitle": "Evaluation time",
    "notes.form.fields.coefficient": "Coefficient",
    "notes.form.fields.maxScore": "Max score",
    "notes.form.fields.sequence": "Sequence",
    "notes.form.fields.sequencePlaceholder": "Select a sequence",
    "notes.form.fields.isFinalExam": "Sequence exam",
    "notes.form.fields.isFinalExamHint":
      "Check if this is the final exam of the sequence (required to count in the average)",
    "notes.form.termAutoSuffix": "automatically computed from the date",
    "notes.form.sequenceTermBadge": "Detected term",
    "notes.form.validation.sequenceRequired": "Sequence required",
    "notes.form.descriptionPlaceholder":
      "Instructions, targeted skills, modalities…",
    "notes.form.addAttachment": "Add a file",
    "notes.form.noAttachment":
      "No attachment. Add a topic, an instruction sheet or a grading scale.",
    "notes.form.saveDraft": "Save draft",
    "notes.form.save": "Save",
    "notes.form.publish": "Publish",
    "notes.form.colorMenu.title": "Text color",
    "notes.form.colorMenu.message": "Choose a color",
    "notes.form.colorMenu.cancel": "Cancel",
    "notes.form.colors.blue": "Blue",
    "notes.form.colors.green": "Green",
    "notes.form.colors.red": "Red",
    "notes.form.colors.black": "Black",
    "notes.form.validation.titleRequired": "Title required (min. 3 characters)",
    "notes.form.validation.titleTooLong": "Title too long",
    "notes.form.validation.subjectRequired": "Subject required",
    "notes.form.validation.typeRequired": "Evaluation type required",
    "notes.form.validation.dateRequired": "Date required",
    "notes.form.validation.dateInvalid": "Invalid date",
    "notes.form.validation.timeInvalid": "Invalid time",
    "notes.form.validation.coefficientRequired": "Coefficient required",
    "notes.form.validation.coefficientMin": "Min 0.25",
    "notes.form.validation.maxScoreRequired": "Max score required",
    "notes.form.validation.maxScoreMin": "Min 1",

    "notes.score.noteLabel": "Grade",
    "notes.score.modify": "Edit",
    "notes.score.save": "Save",
    "notes.score.comment": "Comment",
    "notes.score.commentPlaceholder": "Individual observation…",
    "notes.score.saveComment": "Save comment",
    "notes.score.status.notGraded": "Not graded",
    "notes.score.status.entered": "Graded",
    "notes.score.status.absent": "Absent",
    "notes.score.status.excused": "Excused",
    "notes.score.validation.required": "Grade is required",
    "notes.score.validation.invalid": "Invalid value (number ≥ 0)",
    "notes.score.validation.aboveMax": "Grade above max score",

    "notes.manager.header.title": "Grades",
    "notes.manager.header.classPrefix": "Class",
    "notes.manager.access.title": "Unauthorized access",
    "notes.manager.access.message":
      "This module is restricted to teachers and school roles.",
    "notes.manager.search.placeholder": "Search for an evaluation…",
    "notes.manager.loading.notebook": "Loading grade book...",
    "notes.manager.loading.form": "Loading form…",
    "notes.manager.loading.evaluations": "Loading evaluations...",
    "notes.manager.loading.scores": "Loading students…",
    "notes.manager.loading.detail": "Loading evaluation detail...",
    "notes.manager.loading.section": "Loading",
    "notes.manager.evalList.backToList": "Evaluations list",
    "notes.manager.evalList.statusPublished": "Published",
    "notes.manager.evalList.statusDraft": "Draft",
    "notes.manager.evalList.scoresSaisies": "scores entered • coeff.",
    "notes.manager.evalList.actionDetails": "Details",
    "notes.manager.evalList.actionEdit": "Edit",
    "notes.manager.evalList.actionScores": "Grades",
    "notes.manager.evalList.actionDelete": "Delete",
    "notes.manager.evalList.empty.title": "No evaluation",
    "notes.manager.evalList.empty.message":
      "Tap + to create the first evaluation for this class.",
    "notes.manager.detail.sectionTitle": "Evaluation details",
    "notes.manager.detail.labelTitle": "Title",
    "notes.manager.detail.labelStatus": "Status",
    "notes.manager.detail.labelSubject": "Subject",
    "notes.manager.detail.labelType": "Type",
    "notes.manager.detail.labelPeriod": "Period",
    "notes.manager.detail.labelDate": "Scheduled date",
    "notes.manager.detail.labelCoefficient": "Coefficient",
    "notes.manager.detail.labelMaxScore": "Max score",
    "notes.manager.detail.labelDescription": "Description",
    "notes.manager.detail.labelProgress": "Progress",
    "notes.manager.detail.scoresSaisies": "scores entered",
    "notes.manager.detail.editEval": "Edit evaluation",
    "notes.manager.detail.enterScores": "Enter grades",
    "notes.manager.scores.allStudents": "All students",
    "notes.manager.scores.draftBanner":
      "Draft — grades will only be visible in the Grades tab once the evaluation is published.",
    "notes.manager.scores.emptyTitle": "No student",
    "notes.manager.scores.emptyMessage":
      "Select a student in the filter or check loading.",
    "notes.manager.scoresTab.sectionTitle": "Score entry",
    "notes.manager.scoresTab.subtitle":
      "Choose an evaluation then fill in the grade, status and comment.",
    "notes.manager.scoresTab.evalLabel": "Evaluation",
    "notes.manager.scoresTab.emptyTitle": "No evaluation selected",
    "notes.manager.scoresTab.emptyMessage":
      "Create or select an evaluation to start entering grades.",
    "notes.manager.council.sectionTitle": "Class council",
    "notes.manager.council.subtitle":
      "Enter general and subject-level comments for each student.",
    "notes.manager.council.periodLabel": "Period",
    "notes.manager.council.statusLabel": "Status",
    "notes.manager.council.statusDraft": "Draft",
    "notes.manager.council.statusPublished": "Published",
    "notes.manager.council.dateLabel": "Council date",
    "notes.manager.council.generalAppreciation": "General assessment",
    "notes.manager.council.generalPlaceholder": "General student assessment",
    "notes.manager.council.subjectPlaceholder": "Assessment per subject",
    "notes.manager.council.save": "Save council",
    "notes.manager.deleteConfirm.title": "Delete evaluation?",
    "notes.manager.deleteConfirm.message":
      "This action is irreversible. The entered grades will also be deleted.",
    "notes.manager.deleteConfirm.confirm": "Delete",
    "notes.manager.deleteConfirm.cancel": "Cancel",
    "notes.manager.toast.scoreTitle": "Grade saved",
    "notes.manager.toast.scoreMessage": "The grade has been saved.",
    "notes.manager.toast.scoreErrorTitle": "Entry failed",
    "notes.manager.toast.scoreErrorMessage": "Unable to save the grade.",
    "notes.manager.toast.deleteTitle": "Evaluation deleted",
    "notes.manager.toast.deleteMessage":
      "The evaluation and its grades have been deleted.",
    "notes.manager.toast.deleteErrorTitle": "Deletion failed",
    "notes.manager.toast.deleteErrorMessage":
      "Unable to delete this evaluation.",
    "notes.manager.toast.councilTitle": "Class council saved",
    "notes.manager.toast.councilMessage":
      "The period assessments have been saved.",
    "notes.manager.toast.councilErrorTitle": "Save failed",
    "notes.manager.toast.councilErrorMessage":
      "Unable to save the assessments.",
    "notes.manager.toast.createTitle": "Evaluation created",
    "notes.manager.toast.createMessage": "The evaluation has been saved.",
    "notes.manager.toast.updateTitle": "Evaluation updated",
    "notes.manager.toast.updateMessage": "The changes have been saved.",

    "notes.child.title": "Evaluations and averages",
    "notes.child.subtitle.student": "Student",
    "notes.panel.notes": "Notes",
    "notes.panel.loading": "Loading published grades...",
    "notes.panel.emptyTitle": "No published grade",
    "notes.panel.emptyMessage":
      "Published evaluations for this child will appear here.",
    "notes.panel.viewEval": "Eval",
    "notes.panel.viewAvg": "Avg",
    "notes.panel.viewChart": "Chart",
    "notes.evals.emptyTitle": "No evaluation",
    "notes.evals.emptyMessage":
      "Published grades for this period will appear here.",
    "notes.evals.inlineEmpty": "No published grade in this subject.",
    "notes.evals.generalAverage": "GENERAL AVERAGE",
    "notes.evals.generalHint":
      "Summary of published evaluations for the period.",
    "notes.evals.legendAbs": "Abs",
    "notes.evals.legendAbsent": "Absent",
    "notes.evals.legendDisp": "Exc",
    "notes.evals.legendDispense": "Excused",
    "notes.evals.legendNE": "NG",
    "notes.evals.legendNonEvalue": "Not graded",
    "notes.period.badge": "PERIOD REPORT",
    "notes.period.published": "PUBLISHED DATA",
    "notes.period.statStudentAvg": "Student average",
    "notes.period.statClassAvg": "Class average",
    "notes.period.amplitude": "Range",
    "notes.period.statBestSubject": "Top subject",
    "notes.period.statWatchSubject": "Watch point",
    "notes.period.noData": "No data",
    "notes.avgs.title": "Averages",
    "notes.avgs.emptyTitle": "No average available",
    "notes.avgs.emptyMessage":
      "Averages will appear once a subject has published grades.",
    "notes.avgs.coef": "Coef.",
    "notes.avgs.classLabel": "Class:",
    "notes.avgs.minLabel": "Min:",
    "notes.avgs.maxLabel": "Max:",
    "notes.avgs.generalAverage": "GENERAL AVERAGE",
    "notes.avgs.positioning": "Overall student positioning for the period.",
    "notes.charts.title": "Charts",
    "notes.charts.emptyTitle": "Charts unavailable",
    "notes.charts.emptyMessage":
      "Student and class averages are required to display this view.",
    "notes.charts.comparisonTitle": "Subject comparison",
    "notes.charts.comparisonSubtitle":
      "Each band represents the class min-max range, with the student and class average positions.",
    "notes.charts.legendStudent": "Student average",
    "notes.charts.legendClass": "Class average",
    "notes.charts.legendRange": "Class min - max",
    "notes.charts.radarTitle": "Averages radar",
    "notes.charts.radarSubtitle":
      "Global view of the strongest subjects and class gaps.",
    "notes.charts.radarReadTitle": "Reading the radar",
    "notes.charts.radarReadText":
      "The closer the trace is to the edge, the higher the average.",
    "notes.charts.radarCompareTitle": "Comparison",
    "notes.charts.radarCompareText":
      "The blue trace represents the student. The grey corresponds to the class.",
    "notes.charts.student": "Student",
    "notes.charts.class": "Class",
    "notes.charts.yearBadge": "SCHOOL YEAR",
    "notes.detail.evalTitle": "Evaluation detail",
    "notes.detail.avgTitle": "Average detail",
    "notes.detail.statNote": "Grade",
    "notes.detail.statStatus": "Status",
    "notes.detail.statDate": "Date",
    "notes.detail.statCoefficient": "Coefficient",
    "notes.detail.statusAbsent": "Absent",
    "notes.detail.statusExcused": "Excused",
    "notes.detail.statusNotGraded": "Not graded",
    "notes.detail.statusGraded": "Grade entered",
    "notes.detail.avgLead":
      "Compare the student to the class and identify the observed range.",
    "notes.detail.statStudent": "Student",
    "notes.detail.statClass": "Class",
    "notes.detail.statMin": "Min",
    "notes.detail.statMax": "Max",
    "notes.detail.context": "Context",
    "notes.detail.noComparison": "No comparison available",

    "notes.admin.title": "Grades",
    "notes.admin.tabs.byStudent": "By student",
    "notes.admin.tabs.byClass": "By class",
    "notes.admin.filters.year": "Year",
    "notes.admin.filters.yearPlaceholder": "Choose a year",
    "notes.admin.filters.class": "Class",
    "notes.admin.filters.allClasses": "All classes",
    "notes.admin.search.placeholder": "Search for a student…",
    "notes.admin.loading.students": "Loading students…",
    "notes.admin.loading.classes": "Loading classes…",
    "notes.admin.error.loadFailed": "Unable to load classes.",
    "notes.admin.error.title": "Error",
    "notes.admin.students.emptyTitle": "No student",
    "notes.admin.students.emptyMessage":
      "No student available for the selected filters.",
    "notes.admin.students.noResultTitle": "No result",
    "notes.admin.students.noResultMessage": "Try adjusting your search.",
    "notes.admin.classes.emptyTitle": "No class",
    "notes.admin.classes.emptyMessage":
      "No class available for this school year.",

    // App index — session expired
    "app.sessionExpired.title": "Session expired",
    "app.sessionExpired.subtitle": "Your space has been securely locked",
    "app.sessionExpired.message":
      "Your session has expired. Please log in again.",
    "app.sessionExpired.reconnect": "Log in again",

    // Home index — fallback
    "home.fallback.welcome": "Welcome, {firstName} {lastName}",

    // Home hero (generic, all home pages)
    "home.hero.greeting": "Hello dear",
    "home.hero.role.platformSuperAdmin": "Super admin",
    "home.hero.role.platformAdmin": "Administrator",
    "home.hero.role.platformSales": "Sales",
    "home.hero.role.platformSupport": "Support",
    "home.hero.role.schoolAdmin": "Administrator",
    "home.hero.role.schoolManager": "Principal",
    "home.hero.role.supervisor": "Supervisor",
    "home.hero.role.accountant": "Accountant",
    "home.hero.role.staff": "Staff",
    "home.hero.role.teacher": "Teacher",
    "home.hero.role.parent": "Parent",
    "home.hero.role.student": "Student",

    // Parent home
    "home.parent.children.title": "My children",
    "home.parent.children.empty.title": "No child linked yet",
    "home.parent.children.empty.subtitle":
      "Your enrolled children will appear here",
    "home.parent.quickAccess.title": "Quick access",
    "home.parent.quickAccess.feed.label": "News feed",
    "home.parent.quickAccess.feed.sub": "School information",
    "home.parent.quickAccess.finance.label": "Finance",
    "home.parent.quickAccess.finance.sub": "Payments and balance",
    "home.parent.quickAccess.messaging.label": "Messaging",
    "home.parent.quickAccess.messaging.sub": "Contact the staff",
    "home.parent.quickAccess.documents.label": "Documents",
    "home.parent.quickAccess.documents.sub": "Report cards, certificates…",
    "home.parent.news.title": "News",
    "home.parent.news.seeAll": "See all",
    "home.parent.news.empty.title": "No news yet",
    "home.parent.news.empty.subtitle": "School announcements will appear here",

    // Placeholder screen
    "placeholder.subtitle": "Module under development",
    "placeholder.body": "This feature will be available soon.",
    "placeholder.defaultTitle": "Module",

    // Teacher class timetable route
    "classRoute.timetable.headerTitle": "Timetable",
    "classRoute.timetable.tabLabel": "Timetable",

    // Startup version check
    "startup.checking": "Checking app version…",
    "startup.error.title": "Unable to continue",
    "startup.error.message":
      "We couldn't verify that your app is up to date. Check your connection and try again.",
    "startup.error.retry": "Retry",

    // Bottom tab bar
    "nav.tabs.home": "Home",
    "nav.tabs.account": "My account",
    "nav.tabs.assistance": "Support",

    // Email change
    "account.email.current": "Current email",
    "account.email.changeButton": "Change email",
    "account.email.changeTitle": "Change email address",
    "account.email.newPlaceholder": "new@address.com",
    "account.email.sendLink": "Send link",
    "account.email.sending": "Sending...",
    "account.email.cancel": "Cancel",
    "account.email.successMessage":
      "A confirmation link has been sent to the new address. Check your inbox.",
    "account.email.errors.invalid": "Invalid email address.",
    "account.email.errors.sameEmail":
      "The new email is the same as the current one.",
    "account.email.errors.sendFailed":
      "Unable to send the link. Please try again.",
    "nav.tabs.menu": "Menu",
    "nav.tabs.tests": "Tests",

    // ConfirmDialog (generic)
    "confirmDialog.badge.danger": "Sensitive action",
    "confirmDialog.badge.warning": "Warning",
    "confirmDialog.badge.info": "Information",
    "confirmDialog.defaultConfirm": "Confirm",
    "confirmDialog.defaultCancel": "Cancel",

    // Home header (AppHeader, home variant)
    "header.home.loginAction": "Sign in",
    "header.home.logoutAction": "Sign out",
    "header.home.logoutConfirmTitle": "Sign out?",
    "header.home.logoutConfirmMessage":
      "You will be redirected to the login screen. Your local data will be cleared.",
    "header.home.logoutConfirmConfirm": "Sign out",
    "header.home.logoutConfirmCancel": "Cancel",
  },
};
