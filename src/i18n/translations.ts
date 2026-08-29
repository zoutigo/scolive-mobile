export type Locale = "fr" | "en";

export const SUPPORTED_LOCALES: Locale[] = ["fr", "en"];

export const DEFAULT_LOCALE: Locale = "fr";

/**
 * Translation dictionaries, namespaced (e.g. "settings.language.title").
 * Keep `en` keys aligned with `fr` keys: useTranslation falls back fr -> key.
 */
export const translations: Record<Locale, Record<string, string>> = {
  fr: {
    "common.loading": "Chargement...",
    "common.cancel": "Annuler",
    "common.save": "Enregistrer",
    "common.delete": "Supprimer",
    "common.select": "Sélectionner",

    "financeAdmin.lockedTitle": "Module réservé au personnel administratif",
    "financeAdmin.lockedMessage":
      "Ce module mobile est disponible pour les comptes admin, gestionnaire ou comptable.",
    "financeAdmin.settings.title": "Seuil de réinscription",
    "financeAdmin.settings.description":
      "Détermine à partir de quel montant versé un élève promu est considéré réinscrit.",
    "financeAdmin.settings.firstInstallment": "1ère échéance payée",
    "financeAdmin.settings.fullPayment": "Échéancier payé en totalité",
    "financeAdmin.settings.success": "Politique de réinscription mise à jour.",
    "financeAdmin.settings.errors.save":
      "Impossible de mettre à jour la politique de réinscription.",
    "financeAdmin.schedules.title": "Échéanciers",
    "financeAdmin.schedules.empty": "Aucun échéancier défini pour le moment.",
    "financeAdmin.schedules.success.saved": "Échéancier enregistré.",
    "financeAdmin.schedules.success.deleted": "Échéancier supprimé.",
    "financeAdmin.schedules.errors.save": "Enregistrement impossible.",
    "financeAdmin.schedules.errors.delete": "Suppression impossible.",
    "financeAdmin.schedules.form.title": "Nouvel échéancier / mise à jour",
    "financeAdmin.schedules.form.subtitle":
      "Barème par niveau, filière et année scolaire",
    "financeAdmin.schedules.form.schoolYear": "Année scolaire",
    "financeAdmin.schedules.form.academicLevel": "Niveau",
    "financeAdmin.schedules.form.track": "Filière",
    "financeAdmin.schedules.form.trackNone": "Aucune filière",
    "financeAdmin.schedules.form.installments": "Échéances",
    "financeAdmin.schedules.form.label": "Libellé",
    "financeAdmin.schedules.form.amount": "Montant",
    "financeAdmin.schedules.form.addInstallment": "Ajouter une échéance",
    "financeAdmin.schedules.deleteConfirm.title": "Supprimer l'échéancier",

    "supplyListsAdmin.title": "Fournitures scolaires",
    "supplyListsAdmin.lockedTitle": "Module réservé au personnel administratif",
    "supplyListsAdmin.lockedMessage":
      "Ce module mobile est disponible pour les comptes admin, gestionnaire ou superviseur.",
    "supplyListsAdmin.empty":
      "Aucune liste de fournitures définie pour le moment.",
    "supplyListsAdmin.success.saved": "Liste de fournitures enregistrée.",
    "supplyListsAdmin.success.deleted": "Liste de fournitures supprimée.",
    "supplyListsAdmin.errors.save": "Enregistrement impossible.",
    "supplyListsAdmin.errors.delete": "Suppression impossible.",
    "supplyListsAdmin.form.title": "Nouvelle liste / mise à jour",
    "supplyListsAdmin.form.subtitle":
      "Fournitures par niveau, filière et année scolaire",
    "supplyListsAdmin.form.schoolYear": "Année scolaire",
    "supplyListsAdmin.form.academicLevel": "Niveau",
    "supplyListsAdmin.form.track": "Filière",
    "supplyListsAdmin.form.trackNone": "Aucune filière",
    "supplyListsAdmin.form.items": "Articles",
    "supplyListsAdmin.form.label": "Libellé",
    "supplyListsAdmin.form.quantity": "Quantité",
    "supplyListsAdmin.form.addItem": "Ajouter un article",
    "supplyListsAdmin.deleteConfirm.title": "Supprimer la liste de fournitures",
    "supplyListsAdmin.help.menuLabel": "Aide",
    "supplyListsAdmin.help.title": "Aide — Fournitures scolaires",
    "supplyListsAdmin.help.close": "Fermer",
    "supplyListsAdmin.help.section1Title": "À quoi sert cet écran",
    "supplyListsAdmin.help.section1Body":
      "Définissez, pour chaque niveau scolaire (et éventuellement chaque filière) d'une année donnée, la liste des fournitures que les parents doivent prévoir pour la rentrée. Cette liste est ensuite visible par les parents dans l'onglet Fournitures de l'écran Réinscription, scopée au niveau que leur enfant s'apprête à intégrer.",
    "supplyListsAdmin.help.section2Title": "Créer ou modifier une liste",
    "supplyListsAdmin.help.section2Body":
      "Touchez le bouton + pour créer une nouvelle liste, ou l'icône crayon sur une liste existante pour la modifier. Choisissez l'année scolaire, le niveau, éventuellement une filière, puis ajoutez chaque article avec son rang d'affichage, son libellé et sa quantité. Une nouvelle année scolaire reprend automatiquement les listes de l'année précédente : il suffit ensuite de les ajuster si besoin plutôt que de les ressaisir entièrement.",

    "financeAdmin.payments.title": "Paiements",
    "financeAdmin.payments.search.placeholder": "Nom ou prénom",
    "financeAdmin.payments.search.button": "Rechercher",
    "financeAdmin.payments.errors.search": "Recherche impossible.",
    "financeAdmin.payments.errors.summary":
      "Impossible de charger la situation financière de cet élève.",
    "financeAdmin.payments.errors.save":
      "Enregistrement du paiement impossible.",
    "financeAdmin.payments.success.paid": "Paiement enregistré.",
    "financeAdmin.payments.success.paidAndReinscribed":
      "Paiement enregistré : la réinscription de l'élève est confirmée.",
    "financeAdmin.payments.targetYear": "Année scolaire (réinscription)",
    "financeAdmin.payments.summary.totalPaid": "Total déjà versé",
    "financeAdmin.payments.summary.threshold":
      "Seuil de réinscription (selon la politique de l'école)",
    "financeAdmin.payments.summary.eligible":
      "Seuil atteint : élève réinscrit.",
    "financeAdmin.payments.summary.notEligible":
      "Seuil non atteint : la réinscription n'est pas encore confirmée.",
    "financeAdmin.payments.form.amount": "Montant versé",
    "financeAdmin.payments.form.submit": "Enregistrer le paiement",

    "promotionsAdmin.title": "Passages de classe",
    "promotionsAdmin.tab.decisions": "Décisions",
    "promotionsAdmin.tab.waiting": "Attente",
    "promotionsAdmin.tab.years": "Années",
    "promotionsAdmin.decisions.selectClass": "Classe (année en cours)",
    "promotionsAdmin.decisions.empty":
      "Aucun bulletin du dernier trimestre pour cette classe.",
    "promotionsAdmin.decisions.nextLevel": "Niveau cible",
    "promotionsAdmin.decisions.nextTrack": "Filière cible",
    "promotionsAdmin.decisions.trackNone": "Aucune filière",
    "promotionsAdmin.decision.PROMOTED": "Promu",
    "promotionsAdmin.decision.REPEATED": "Redouble",
    "promotionsAdmin.decision.LEFT": "Quitte l'établissement",
    "promotionsAdmin.errors.loadReports":
      "Impossible de charger les bulletins.",
    "promotionsAdmin.errors.saveDecision":
      "Enregistrement de la décision impossible.",
    "promotionsAdmin.errors.loadWaiting":
      "Impossible de charger la liste d'attente.",
    "promotionsAdmin.errors.assign": "Affectation impossible.",
    "promotionsAdmin.success.decisionSaved": "Décision enregistrée.",
    "promotionsAdmin.success.assigned": "Élève affecté à la classe.",
    "promotionsAdmin.waiting.targetYear": "Année scolaire cible",
    "promotionsAdmin.waiting.level": "Niveau",
    "promotionsAdmin.waiting.allLevels": "Tous les niveaux",
    "promotionsAdmin.waiting.targetClass": "Classe définitive",
    "promotionsAdmin.waiting.assign": "Affecter",
    "promotionsAdmin.waiting.empty":
      "Aucun élève en attente d'affectation pour ces filtres.",
    "promotionsAdmin.years.alert":
      "Aucune année scolaire suivante n'existe encore pour cette école. Créez-la pour permettre les réinscriptions, même sans l'activer tout de suite.",
    "promotionsAdmin.years.active": "Active",
    "promotionsAdmin.years.activate": "Rendre active",
    "promotionsAdmin.years.create.title": "Créer une année scolaire",
    "promotionsAdmin.years.create.label": "Libellé (ex: 2026-2027)",
    "promotionsAdmin.years.create.submit": "Créer",
    "promotionsAdmin.years.rollover.title": "Dupliquer les classes",
    "promotionsAdmin.years.rollover.source": "Année source",
    "promotionsAdmin.years.rollover.target": "Année cible",
    "promotionsAdmin.years.rollover.submit": "Dupliquer les classes",
    "promotionsAdmin.years.success.created": "Année scolaire créée.",
    "promotionsAdmin.years.success.activated": "Année scolaire activée.",
    "promotionsAdmin.years.success.rolledOver": "Classes dupliquées.",
    "promotionsAdmin.years.errors.create":
      "Création de l'année scolaire impossible.",
    "promotionsAdmin.years.errors.activate": "Activation impossible.",
    "promotionsAdmin.years.errors.rollover":
      "Duplication des classes impossible.",

    "schoolSettings.title": "Paramètres de l'école",
    "schoolSettings.tabs.levels": "Niveaux",
    "schoolSettings.lockedTitle": "Accès réservé",
    "schoolSettings.lockedMessage":
      "Seuls les administrateurs et directeurs de l'école peuvent accéder aux paramètres.",
    "schoolSettings.errors.load": "Impossible de charger les niveaux.",
    "schoolSettings.levels.intro":
      "Activez les niveaux nationaux utilisés par cette école. Les niveaux propres à l'école sont toujours actifs. L'ordre détermine le niveau suivant proposé automatiquement lors d'une décision de passage.",
    "schoolSettings.levels.own": "Niveau propre à l'école",
    "schoolSettings.levels.national": "Niveau national",
    "schoolSettings.levels.alwaysActive": "Toujours actif",
    "schoolSettings.levels.orderLabel": "Ordre",
    "schoolSettings.levels.empty.title": "Aucun niveau",
    "schoolSettings.levels.empty.message":
      "Aucun niveau académique n'est disponible pour cette école.",
    "schoolSettings.levels.errors.toggle":
      "Impossible de modifier l'activation de ce niveau.",
    "schoolSettings.levels.errors.save": "Impossible d'enregistrer l'ordre.",
    "schoolSettings.levels.errors.invalidOrder":
      "L'ordre doit être un nombre entier positif.",
    "schoolSettings.levels.success.saved": "Modification enregistrée.",
    "schoolSettings.help.menuLabel": "Aide",
    "schoolSettings.help.close": "Fermer",
    "schoolSettings.help.title": "Aide — Paramètres de l'école",
    "schoolSettings.help.section1Title": "Activer un niveau",
    "schoolSettings.help.section1Body":
      "Les niveaux nationaux du catalogue plateforme n'apparaissent pas tous automatiquement pour votre école : activez uniquement ceux que votre école utilise réellement. Les niveaux propres à votre école sont toujours actifs et n'ont pas besoin d'être activés.",
    "schoolSettings.help.section2Title": "L'ordre et la décision de passage",
    "schoolSettings.help.section2Body":
      "Le champ Ordre (modifiable sur vos niveaux propres) définit la progression pédagogique. Quand un enseignant enregistre une décision « Promu » dans l'onglet Décision de Notes, l'application propose automatiquement le niveau actif suivant dans cet ordre.",

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
    "settings.edit": "Modifier",
    "settings.currentValue": "Valeur actuelle",
    "settings.form.cancel": "Annuler",
    "settings.form.save": "Enregistrer",
    "settings.form.searchPlaceholder": "Rechercher...",
    "settings.form.noResults": "Aucun résultat",
    "components.inlineSelect.searchPlaceholder": "Rechercher...",
    "components.inlineSelect.noResults": "Aucun résultat",
    "settings.form.deviceLanguage.title": "Langue de cet appareil",
    "settings.form.deviceLanguage.subtitle":
      "Choisissez la langue de l'application",
    "settings.form.accountLanguage.title": "Langue du compte",
    "settings.form.accountLanguage.subtitle":
      "Appliquée automatiquement à chaque connexion",
    "settings.form.activeSchool.title": "École active",
    "settings.form.activeSchool.subtitle":
      "Choisissez l'établissement qui conditionne l'application",
    "settings.form.activeRole.title": "Profil actif",
    "settings.form.activeRole.subtitle": "Choisissez la navigation à afficher",
    "settings.school.title": "École active",
    "settings.school.subtitle": "Établissement qui conditionne l'application",
    "settings.role.title": "Profil actif",
    "settings.role.subtitle": "Navigation affichée dans l'application",
    "settings.role.onlyOne": "Un seul profil est disponible sur ce compte.",
    "settings.form.deviceLanguage.successTitle": "Langue mise à jour",
    "settings.form.deviceLanguage.successMessage":
      "La langue de l'appareil a été mise à jour.",
    "settings.form.accountLanguage.successTitle": "Langue mise à jour",
    "settings.form.accountLanguage.successMessage":
      "La langue de votre compte a été enregistrée.",
    "settings.form.accountLanguage.errorTitle": "Mise à jour impossible",
    "settings.form.accountLanguage.errorMessage":
      "La langue du compte n'a pas pu être mise à jour.",
    "settings.onboardingHelp.title": "Aide guidée",
    "settings.onboardingHelp.subtitle":
      "Affiche une visite guidée à la première découverte d'un module",
    "settings.form.onboardingHelp.successTitle": "Préférence enregistrée",
    "settings.form.onboardingHelp.successMessage":
      "Votre préférence d'aide guidée a été enregistrée.",
    "settings.form.onboardingHelp.errorTitle": "Mise à jour impossible",
    "settings.form.onboardingHelp.errorMessage":
      "La préférence d'aide guidée n'a pas pu être mise à jour.",
    "settings.form.resetOnboardingTours.title": "Rejouer les aides guidées",
    "settings.form.resetOnboardingTours.subtitle":
      "Efface la mémoire des visites guidées déjà vues pour les revoir au prochain passage sur chaque écran.",
    "settings.form.resetOnboardingTours.action": "Réinitialiser",
    "settings.form.resetOnboardingTours.successTitle":
      "Aides guidées réinitialisées",
    "settings.form.resetOnboardingTours.successMessage":
      "Les visites guidées réapparaîtront au prochain passage sur chaque écran concerné.",
    "settings.about.title": "À propos & mentions légales",
    "settings.about.subtitle":
      "Coordonnées de contact, CGU, mentions légales et confidentialité.",
    "settings.about.action": "Consulter",
    "aboutScreen.title": "À propos de Scolive",
    "aboutScreen.contactTitle": "Nous contacter",
    "aboutScreen.legalTitle": "Documents légaux",
    "aboutScreen.legal.cgu": "Conditions générales d'utilisation",
    "aboutScreen.legal.mentions-legales": "Mentions légales",
    "aboutScreen.legal.confidentialite": "Politique de confidentialité",
    "aboutScreen.loading": "Chargement...",
    "aboutScreen.errors.loadContact": "Impossible de charger les coordonnées.",
    "legalScreen.title": "Document légal",
    "legalScreen.loading": "Chargement...",
    "legalScreen.errors.load": "Impossible de charger ce document.",
    "legalScreen.publisherLabel": "Responsable de publication :",
    "onboardingTour.common.next": "Suivant",
    "onboardingTour.common.finish": "Terminer",
    "onboardingTour.common.tapTarget":
      "Touchez l'élément en surbrillance pour continuer.",
    "onboardingTour.common.gotIt": "J'ai compris",
    "onboardingTour.financeParent.walletTitle": "Votre porte-monnaie",
    "onboardingTour.financeParent.walletBody":
      "Creditez ce porte-monnaie a tout moment, meme avant que le conseil de classe n'ait statue. L'argent y reste disponible jusqu'a ce que vous decidiez de l'affecter a un enfant.",
    "onboardingTour.financeParent.childrenTitle": "Statut de chaque enfant",
    "onboardingTour.financeParent.childrenBody":
      "Pour chaque enfant : en attente de la decision du conseil de classe, deja reinscrit, ou pret a etre reinscrit avec le montant restant du affiche.",
    "onboardingTour.financeParent.reinscribeTitle": "Je paie et je reinscris",
    "onboardingTour.financeParent.reinscribeBody":
      "Ce bouton debite votre porte-monnaie du montant exact de la 1ere echeance de CET enfant et confirme sa reinscription en un seul geste. Un parent avec plusieurs enfants doit cliquer separement pour chacun.",
    "finSituation.wallet.balance": "Solde du porte-monnaie",
    "finSituation.wallet.topUpAmount": "Montant a crediter",
    "finSituation.wallet.topUpSubmit": "Crediter",
    "finSituation.wallet.allChildrenLoaded": "Tous les enfants ont ete charges",
    "finSituation.wallet.errors.load":
      "Impossible de charger le porte-monnaie.",
    "finSituation.wallet.errors.amount": "Montant invalide.",
    "finSituation.wallet.errors.topUp": "Depot impossible.",
    "finSituation.wallet.errors.reinscribe": "Reinscription impossible.",
    "finSituation.wallet.success.topUp": "Porte-monnaie credite.",
    "finSituation.wallet.success.reinscribed": "{firstName} est reinscrit(e) !",
    "finSituation.children.title": "Mes enfants",
    "finSituation.children.required": "Montant restant du :",
    "finSituation.children.payAndReinscribe": "Je paie et je reinscris",
    "finSituation.children.empty": "Aucun enfant rattache a votre compte.",
    "finSituation.children.status.DECISION_PENDING":
      "En attente de la decision du conseil de classe",
    "finSituation.children.status.NEXT_YEAR_NOT_OPEN":
      "Decision prise, en attente de l'ouverture de l'annee scolaire suivante par l'ecole",
    "finSituation.children.status.ALREADY_REINSCRIBED": "Deja reinscrit(e)",
    "finSituation.children.dateOfBirth": "Ne(e) le {date}",
    "finSituation.children.schoolYearStart": "Rentree scolaire : {date}",
    "finSituation.children.daysLeft": "{count} jour(s) restant(s)",
    "finSituation.children.deadlinePassed": "Date limite depassee",
    "finSituation.children.insufficientBalance":
      "Solde insuffisant : approvisionnez votre porte-monnaie de {amount} pour reinscrire.",
    "finSituation.children.confirmed.title": "Inscription confirmee !",
    "finSituation.children.confirmed.message":
      "Preparez la rentree en consultant la liste des fournitures.",
    "finSituation.children.confirmed.viewSupplies":
      "Voir la liste des fournitures",
    "finSituation.children.status.READY_TO_REINSCRIBE":
      "Pret(e) a etre reinscrit(e)",

    "reinscription.title": "Réinscription",
    "reinscription.tabs.paiement": "Paiement",
    "reinscription.tabs.fournitures": "Fournitures",
    "reinscription.children.title": "Mes enfants",
    "reinscription.children.allLoaded": "Tous les enfants ont ete charges",
    "reinscription.children.empty": "Aucun enfant rattache a votre compte.",
    "reinscription.supplies.notOpenYet":
      "L'annee suivante n'est pas encore ouverte par l'ecole.",
    "reinscription.supplies.empty":
      "Aucune liste de fournitures definie pour ce niveau pour le moment.",
    "reinscription.supplies.emptyList":
      "Aucun enfant pret pour une liste de fournitures.",
    "reinscription.supplies.allLoaded":
      "Toutes les listes de fournitures ont ete chargees",
    "reinscription.wallet.balance": "Solde du porte-monnaie",
    "reinscription.wallet.topUpLink": "Recharger",
    "reinscription.wallet.success.reinscribed":
      "{firstName} est reinscrit(e) !",
    "reinscription.wallet.errors.reinscribe": "Reinscription impossible.",
    "reinscription.errors.load": "Chargement impossible.",
    "reinscription.help.menuLabel": "Aide",
    "reinscription.help.title": "Aide — Réinscription",
    "reinscription.help.close": "Fermer",
    "reinscription.help.section1Title": "Payer et réinscrire",
    "reinscription.help.section1Body":
      "Dès qu'un enfant est promu par le conseil de classe, il apparaît dans l'onglet Paiement avec le montant restant dû (selon la politique de seuil définie par l'école : 1ère échéance ou paiement intégral) et la date limite. Rechargez votre porte-monnaie depuis Situation financière puis touchez « Je paie et je réinscris » pour régler ce montant et confirmer la réinscription en un seul geste.",
    "reinscription.help.section2Title": "Statuts affichés",
    "reinscription.help.section2Body":
      "« En attente de la décision du conseil de classe » signifie que le niveau de l'an prochain n'est pas encore décidé. « Prêt(e) à être réinscrit(e) » signifie que le paiement peut être effectué. « Déjà réinscrit(e) » confirme que la réinscription est actée.",
    "reinscription.help.section3Title": "Fournitures scolaires",
    "reinscription.help.section3Body":
      "L'onglet Fournitures liste, pour chaque enfant, les articles nécessaires pour le niveau qu'il intègre l'an prochain (et non son niveau actuel). Cette liste est gérée par l'établissement.",

    "onboardingTour.reinscription.walletTitle": "Votre porte-monnaie",
    "onboardingTour.reinscription.walletBody":
      "Voici votre solde disponible. Touchez « Recharger » pour aller créditer votre porte-monnaie depuis Situation financière.",
    "onboardingTour.reinscription.childrenTitle": "Vos enfants",
    "onboardingTour.reinscription.childrenBody":
      "Chaque enfant promu apparaît ici avec son ancien et son nouveau niveau, la date limite de réinscription et le montant restant dû.",
    "onboardingTour.reinscription.reinscribeTitle": "Payer et réinscrire",
    "onboardingTour.reinscription.reinscribeBody":
      "Ce bouton débite le montant requis de votre porte-monnaie et confirme la réinscription en un seul geste.",
    "onboardingTour.reinscription.suppliesTabTitle": "Fournitures scolaires",
    "onboardingTour.reinscription.suppliesTabBody":
      "Cet onglet liste les fournitures nécessaires pour le niveau que votre enfant intègre l'an prochain.",
    "onboardingTour.reinscription.helpToggleTitle": "Besoin d'aide ?",
    "onboardingTour.reinscription.helpToggleBody":
      "Touchez ce bouton, puis « Aide » dans le menu, pour retrouver ces explications à tout moment.",

    "reinscription.installments.show": "Voir l'échéancier",
    "reinscription.installments.hide": "Masquer l'échéancier",
    "reinscription.installments.dueDate": "Échéance :",
    "reinscription.installments.error": "Échéancier indisponible.",
    "reinscription.installments.status.PAID": "Payée",
    "reinscription.installments.status.PARTIAL": "Partielle",
    "reinscription.installments.status.UPCOMING": "À venir",
    "reinscription.installments.status.OVERDUE": "En retard",

    "onboardingTour.childTimetable.step1Title": "Changez de vue",
    "onboardingTour.childTimetable.step1Body":
      "Touchez Jour, Semaine ou Mois pour changer la façon d'afficher l'emploi du temps.",
    "onboardingTour.childTimetable.step2Title": "Naviguez dans le temps",
    "onboardingTour.childTimetable.step2Body":
      "Utilisez les flèches pour passer à la période précédente ou suivante, ou touchez le libellé pour revenir à aujourd'hui.",
    "onboardingTour.childTimetable.step3Title": "Consultez un cours",
    "onboardingTour.childTimetable.step3Body":
      "Chaque carte affiche l'horaire, la matière, l'enseignant et la salle du cours.",
    "onboardingTour.childTimetable.step4Title": "Une aide toujours disponible",
    "onboardingTour.childTimetable.step4Body":
      "Touchez ce bouton à tout moment, puis « Aide » dans le menu, pour afficher un rappel sur l'utilisation de cette page.",
    "onboardingTour.tests.step1Title": "Repérez les onglets",
    "onboardingTour.tests.step1Body":
      "« Campagnes » liste les tests à réaliser, « Tests faits » garde l'historique de vos résultats, et « À refaire » regroupe les tests qu'un administrateur vous demande de reprendre.",
    "onboardingTour.tests.step2Title": "Démarrez un test",
    "onboardingTour.tests.step2Body":
      "Dans une campagne, touchez le bouton Démarrer (ou Consulter si vous l'avez déjà fait) pour ouvrir le premier cas de test et enregistrer votre résultat.",
    "onboardingTour.tests.step3Title": "Une aide toujours disponible",
    "onboardingTour.tests.step3Body":
      "Touchez ce bouton à tout moment, puis « Aide » dans le menu, pour retrouver ce rappel sur l'utilisation du module.",
    "onboardingTour.schoolSettings.step1Title": "Onglet Niveaux",
    "onboardingTour.schoolSettings.step1Body":
      "Cet onglet regroupe les niveaux académiques utilisés par votre école. D'autres réglages viendront s'y ajouter au fil du temps.",
    "onboardingTour.schoolSettings.step2Title": "Activer un niveau",
    "onboardingTour.schoolSettings.step2Body":
      "Le bouton active ou désactive un niveau national pour votre école : seuls les niveaux actifs apparaissent ensuite comme cible possible dans l'onglet Décision de Notes. Les niveaux propres à votre école sont toujours actifs. Le champ Ordre (sur vos niveaux propres) détermine quel niveau est proposé automatiquement quand un enseignant enregistre une décision « Promu ».",
    "onboardingTour.schoolSettings.step3Title": "Une aide toujours disponible",
    "onboardingTour.schoolSettings.step3Body":
      "Touchez ce bouton à tout moment, puis « Aide » dans le menu, pour afficher un rappel sur l'utilisation de cette page.",
    "onboardingTour.disciplineSelf.step1Title": "Trois onglets",
    "onboardingTour.disciplineSelf.step1Body":
      "Touchez un onglet pour passer de la synthèse aux absences et retards, puis aux sanctions et punitions.",
    "onboardingTour.disciplineSelf.step2Title": "Filtrez par indicateur",
    "onboardingTour.disciplineSelf.step2Body":
      "Touchez une carte (absences, retards, sanctions, punitions) pour filtrer la liste des événements récents sur ce type.",
    "onboardingTour.disciplineSelf.step3Title": "Une aide toujours disponible",
    "onboardingTour.disciplineSelf.step3Body":
      "Touchez ce bouton à tout moment, puis « Aide » dans le menu, pour retrouver ces explications.",
    "onboardingTour.homework.step1Title": "Deux façons de voir vos devoirs",
    "onboardingTour.homework.step1Body":
      "« Liste » affiche vos prochains devoirs les uns après les autres, « Agenda » les organise par semaine ou par mois.",
    "onboardingTour.homework.step2Title": "La carte d'un devoir",
    "onboardingTour.homework.step2Body":
      "Touchez une carte pour voir la consigne complète et les pièces jointes. L'icône bulle affiche et ajoute des commentaires.",
    "onboardingTour.homework.step3Title": "Marquez-le comme fait",
    "onboardingTour.homework.step3Body":
      "Une fois le devoir terminé, touchez cette pastille pour le signaler à votre enseignant. Vous pouvez la retoucher pour l'annuler.",
    "onboardingTour.homework.step4Title": "Une aide toujours disponible",
    "onboardingTour.homework.step4Body":
      "Touchez ce bouton à tout moment, puis « Aide » dans le menu, pour afficher un rappel sur l'utilisation de cette page.",
    "onboardingTour.parentLanding.step1Title": "Votre menu de navigation",
    "onboardingTour.parentLanding.step1Body":
      "Touchez cette icône pour ouvrir le menu et accéder à toutes les rubriques de l'école.",
    "onboardingTour.parentLanding.step2Title": "Votre messagerie",
    "onboardingTour.parentLanding.step2Body":
      "Dans ce menu, cette entrée ouvre votre messagerie parent, où se trouvent tous vos échanges avec l'école.",
    "onboardingTour.parentLanding.step3Title": "L'espace de votre enfant",
    "onboardingTour.parentLanding.step3Body":
      "Touchez le nom de votre enfant pour déplier son espace : notes, emploi du temps, discipline et plus encore.",
    "onboardingTour.parentLanding.step4Title": "Paramètres de votre compte",
    "onboardingTour.parentLanding.step4Body":
      "Cette icône ouvre les paramètres de votre compte : coordonnées, sécurité et préférences.",
    "onboardingTour.parentLanding.step5Title": "Une aide toujours disponible",
    "onboardingTour.parentLanding.step5Body":
      "Touchez ce bouton à tout moment pour revoir un rappel sur l'utilisation de cette page et du menu de navigation.",
    "onboardingTour.feedFilters.step1Title": "Ouvrez les filtres",
    "onboardingTour.feedFilters.step1Body":
      "Touchez ce bouton pour ouvrir le panneau de filtres du fil.",
    "onboardingTour.feedFilters.step2Title": "Combinez les types",
    "onboardingTour.feedFilters.step2Body":
      "Sélectionnez un ou plusieurs types de publication : ils se combinent entre eux.",
    "onboardingTour.feedFilters.step3Title": "Validez votre sélection",
    "onboardingTour.feedFilters.step3Body":
      "Touchez Appliquer : le panneau se ferme et la liste affiche directement le résultat filtré.",
    "onboardingTour.feedFilters.step4Title": "Une aide toujours disponible",
    "onboardingTour.feedFilters.step4Body":
      "Touchez ce bouton à tout moment pour retrouver l'explication de la recherche et des filtres.",
    "settings.form.activeSchool.successTitle": "École active mise à jour",
    "settings.form.activeSchool.successMessage":
      "L'école active a été mise à jour.",
    "settings.form.activeSchool.errorTitle": "Mise à jour impossible",
    "settings.form.activeSchool.errorMessage":
      "L'école active n'a pas pu être mise à jour.",
    "settings.form.activeRole.successTitle": "Profil actif mis à jour",
    "settings.form.activeRole.successMessage":
      "Le profil actif a été mis à jour.",
    "settings.form.activeRole.errorTitle": "Mise à jour impossible",
    "settings.form.activeRole.errorMessage":
      "Le profil actif n'a pas pu être mis à jour.",

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
      "Aucun événement de discipline enregistré sur l'année en cours.",
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
    "discipline.tabs.absencesRetards": "Absences",
    "discipline.tabs.sanctionsPunitions": "Sanctions",
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
    "discipline.header.student": "Élève",

    "discipline.disciplineSelf.help.menuLabel": "Aide",
    "discipline.disciplineSelf.help.close": "Fermer",
    "discipline.disciplineSelf.help.synthese.title": "Discipline — Synthèse",
    "discipline.disciplineSelf.help.synthese.section1Title":
      "Les compteurs de l'année",
    "discipline.disciplineSelf.help.synthese.section1Body":
      "Les cartes en haut de l'écran totalisent, depuis le début de l'année scolaire, le nombre d'absences, de retards, de sanctions et de punitions. Ces chiffres se mettent à jour automatiquement dès qu'un nouvel événement est enregistré par l'établissement — vous n'avez rien à faire pour les actualiser.",
    "discipline.disciplineSelf.help.synthese.section2Title":
      "Filtrer les événements récents",
    "discipline.disciplineSelf.help.synthese.section2Body":
      "Touchez une carte (absences, retards, sanctions ou punitions) pour n'afficher, dans la liste « Événements récents » juste en dessous, que les événements de ce type — pratique pour vérifier rapidement, par exemple, si un retard signalé oralement a bien été enregistré. Touchez à nouveau la même carte (ou « Tout voir ») pour revenir à la liste complète sans filtre.",
    "discipline.disciplineSelf.help.absences.title": "Discipline — Absences",
    "discipline.disciplineSelf.help.absences.section1Title":
      "L'historique complet des absences et retards",
    "discipline.disciplineSelf.help.absences.section1Body":
      "Cet onglet liste, du plus récent au plus ancien, chaque absence et chaque retard enregistrés par l'établissement, avec leur date et leur motif si l'établissement en a précisé un. Cette liste est en lecture seule : elle reflète ce que l'établissement a saisi, elle ne peut pas être modifiée depuis l'application.",
    "discipline.disciplineSelf.help.sanctions.title": "Discipline — Sanctions",
    "discipline.disciplineSelf.help.sanctions.section1Title":
      "L'historique complet des sanctions et punitions",
    "discipline.disciplineSelf.help.sanctions.section1Body":
      "Cet onglet liste, du plus récent au plus ancien, chaque sanction et chaque punition enregistrées par l'établissement, avec leur date et leur motif. Comme l'onglet Absences, cette liste est en lecture seule et reflète uniquement ce que l'établissement a saisi.",

    "discipline.fab.addEvent": "Ajouter un événement de discipline",

    "discipline.empty.discipline.title": "Discipline indisponible",
    "discipline.empty.discipline.message":
      "Le contexte de classe n'a pas pu être résolu.",
    "discipline.empty.noClassEvents.title": "Aucun événement de discipline",
    "discipline.empty.noClassEvents.message":
      "Aucun événement n'a encore été saisi pour cette classe.",
    "discipline.empty.chooseStudent.title": "Choisissez un élève",
    "discipline.empty.chooseStudentClass.message":
      "La synthèse discipline apparaît ici après sélection d'un élève de la classe.",
    "discipline.empty.chooseStudentGlobal.message":
      "La synthèse discipline apparaît ici après sélection d'un élève.",
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
      "Sélectionnez un élève pour afficher sa synthèse discipline.",
    "discipline.sections.searchStudents.title": "Rechercher un élève",
    "discipline.sections.searchStudents.subtitle":
      "Filtrez par classe ou saisissez un nom pour chercher dans toutes les classes.",
    "discipline.sections.byClass.title": "Vue par classe",
    "discipline.sections.byClass.subtitle":
      "Sélectionnez une année et une classe.",

    "discipline.teacherHelp.menuLabel": "Aide",
    "discipline.teacherHelp.close": "J'ai compris",
    "discipline.teacherHelp.events.title":
      "Comment utiliser l'onglet Événements",
    "discipline.teacherHelp.events.section1Title": "Filtrer par élève",
    "discipline.teacherHelp.events.section1Body":
      "Choisissez un élève dans la liste pour n'afficher que ses événements, ou laissez vide pour voir toute la classe.",
    "discipline.teacherHelp.events.section2Title": "Signaler un événement",
    "discipline.teacherHelp.events.section2Body":
      "Touchez le bouton + pour signaler une absence, un retard, une sanction ou une punition.",
    "discipline.teacherHelp.carnets.title": "Comment utiliser l'onglet Carnets",
    "discipline.teacherHelp.carnets.section1Title":
      "Consulter le carnet d'un élève",
    "discipline.teacherHelp.carnets.section1Body":
      "Choisissez un élève pour afficher la synthèse de ses absences, retards, sanctions et punitions.",

    "onboardingTour.teacherDiscipline.step1Title": "Deux onglets",
    "onboardingTour.teacherDiscipline.step1Body":
      "Passez des événements récents de la classe au carnet détaillé d'un élève.",
    "onboardingTour.teacherDiscipline.step2Title": "Filtrer par élève",
    "onboardingTour.teacherDiscipline.step2Body":
      "Choisissez un élève dans la liste pour n'afficher que ses événements.",
    "onboardingTour.teacherDiscipline.step3Title": "Signaler un événement",
    "onboardingTour.teacherDiscipline.step3Body":
      "Touchez ce bouton pour signaler une absence, un retard, une sanction ou une punition.",
    "onboardingTour.teacherDiscipline.step4Title":
      "Une aide toujours disponible",
    "onboardingTour.teacherDiscipline.step4Body":
      "Touchez ce bouton à tout moment, puis « Aide » dans le menu, pour afficher un rappel adapté à l'onglet que vous consultez.",

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

    "discipline.parent.title": "Discipline",
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

    "homework.tourFallback.title": "Exemple : Exercices page 42",
    "homework.tourFallback.subject": "Mathématiques",
    "homework.tourFallback.author": "Votre enseignant",

    "homework.help.menuLabel": "Aide",
    "homework.help.close": "Fermer",
    "homework.help.list.title": "Devoirs — Liste",
    "homework.help.list.section1Title": "La vue Liste",
    "homework.help.list.section1Body":
      "Cette vue affiche vos prochains devoirs les uns après les autres, du plus proche au plus lointain dans le temps. Touchez « Agenda » en haut de l'écran pour les voir organisés par semaine ou par mois à la place.",
    "homework.help.agenda.title": "Devoirs — Agenda",
    "homework.help.agenda.section1Title": "La vue Agenda",
    "homework.help.agenda.section1Body":
      "Cette vue organise vos devoirs par semaine ou par mois : un point apparaît sous chaque jour qui contient au moins un devoir. Touchez un jour marqué pour afficher les devoirs de ce jour-là. Touchez « Liste » en haut de l'écran pour revenir à l'ordre chronologique simple.",
    "homework.help.section2Title": "La carte d'un devoir",
    "homework.help.section2Body":
      "Chaque carte affiche la matière, le titre du devoir et sa date d'échéance. Touchez une carte pour voir la consigne complète et les pièces jointes éventuelles. L'icône bulle affiche les commentaires déjà postés et permet d'en ajouter un nouveau, visible par l'enseignant et les autres élèves de la classe.",
    "homework.help.section3Title": "Marquer comme fait",
    "homework.help.section3Body":
      "Une fois le devoir terminé, touchez la pastille « Marquer fait » pour le signaler à votre enseignant : le devoir reste visible mais apparaît comme traité. Vous pouvez retoucher la même pastille pour annuler ce marquage si vous vous êtes trompé.",

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
    "homework.comment.close": "Fermer le formulaire de commentaire",

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
    "homework.form.createHeroTitle": "Création d'un devoir",
    "homework.form.createHeroSubtitle": "Consignes",
    "homework.form.editModuleTitle": "Mise à jour du devoir",
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

    "resources.header.title": "Ressources",
    "resources.tabs.assessments": "Évaluations",
    "resources.tabs.exams": "Examens",
    "resources.tabs.mine": "Mes ressources",
    "resources.tabs.favorites": "Favoris",
    "resources.tabs.moderation": "Modération",
    "resources.status.statement": "Énoncé",
    "resources.status.correction": "Corrigé",
    "resources.examType.sequenceTest": "Évaluation de séquence",
    "resources.examType.popQuiz": "Interrogation surprise",
    "resources.examType.mockExam": "Examen blanc",
    "resources.empty.message": "Aucune ressource pour ces critères.",
    "resources.card.statementButton": "Énoncé",
    "resources.card.correctionButton": "Corrigé",
    "resources.card.editButton": "Modifier",
    "resources.detail.statement": "Énoncé",
    "resources.detail.correction": "Corrigé",
    "resources.detail.edit": "Modifier",
    "resources.detail.notFound": "Ressource introuvable.",
    "resources.detail.noContent": "Aucun contenu disponible.",
    "resources.errors.addAttachment":
      "Impossible d'ajouter cette pièce jointe.",
    "resources.errors.openAttachment":
      "Impossible d'ouvrir cette pièce jointe.",
    "resources.toast.successTitle": "Ressource enregistrée",
    "resources.toast.successMessage":
      "Votre soumission est en attente de validation.",
    "resources.toast.errorTitle": "Erreur",
    "resources.moderation.approve": "Approuver",
    "resources.moderation.reject": "Rejeter",
    "resources.moderation.actionSuccess": "Action effectuée.",
    "resources.moderation.empty": "Aucune ressource en attente.",
    "resources.common.cancel": "Annuler",
    "resources.common.submit": "Enregistrer",
    "resources.form.editTitle": "Modifier la ressource",
    "resources.form.createAssessmentHeroTitle": "Nouvelle évaluation",
    "resources.form.createExamHeroTitle": "Nouvel examen",
    "resources.form.assessmentHeroSubtitle":
      "Contrôle, interrogation ou examen blanc de votre école",
    "resources.form.examHeroSubtitle": "Examen national officiel",
    "resources.form.titleLabel": "Titre",
    "resources.form.titlePlaceholder": "Ex. Contrôle chapitre 3",
    "resources.form.schoolLabel": "École",
    "resources.form.schoolPlaceholder": "Choisir une école",
    "resources.form.schoolLoading": "Chargement des écoles…",
    "resources.form.cycleLabel": "Cycle",
    "resources.form.cyclePlaceholder": "Choisir un cycle",
    "resources.form.levelLabel": "Niveau",
    "resources.form.levelPlaceholder": "Choisir un niveau",
    "resources.form.trackLabel": "Filière",
    "resources.form.trackPlaceholder": "Choisir une filière",
    "resources.form.subjectLabel": "Matière",
    "resources.form.subjectPlaceholder": "Choisir une matière",
    "resources.form.examTypeLabel": "Type",
    "resources.form.examTypePlaceholder": "Choisir un type",
    "resources.form.sequenceLabel": "Séquence",
    "resources.form.sequencePlaceholder": "Choisir une séquence",
    "resources.form.academicYearLabel": "Année académique",
    "resources.form.academicYearPlaceholder": "Choisir une année académique",
    "resources.form.statementLabel": "Énoncé",
    "resources.form.statementPlaceholder": "Rédigez l'énoncé ici…",
    "resources.form.correctionLabel": "Corrigé",
    "resources.form.correctionPlaceholder": "Rédigez le corrigé ici…",
    "resources.form.optional": "optionnel",
    "resources.form.insertingImage": "Insertion de l'image…",
    "resources.form.addAttachment": "Ajouter une pièce jointe",
    "resources.form.colorMenu.title": "Couleur du texte",
    "resources.form.colorMenu.message": "Choisissez une couleur",
    "resources.form.validation.titleRequired": "Le titre est requis.",
    "resources.form.validation.schoolRequired": "L'école est requise.",
    "resources.form.validation.schoolCycleMissing":
      "Cette école n'a pas de cycle configuré — impossible de proposer des niveaux. Contactez un administrateur.",
    "resources.form.validation.cycleRequired": "Le cycle est requis.",
    "resources.form.validation.levelRequired": "Le niveau est requis.",
    "resources.form.validation.trackRequired": "La filière est requise.",
    "resources.form.validation.subjectRequired": "La matière est requise.",
    "resources.form.validation.examTypeRequired": "Le type est requis.",
    "resources.form.validation.sequenceRequired": "La séquence est requise.",
    "resources.form.validation.academicYearRequired":
      "L'année académique est requise.",
    "resources.filters.toggleLabel": "Rechercher",
    "resources.filters.searchPlaceholder": "Rechercher par titre…",
    "resources.filters.academicYear": "Année académique",
    "resources.filters.allYears": "Toutes les années",
    "resources.filters.school": "Établissement scolaire",
    "resources.filters.allSchools": "Tous les établissements",
    "resources.filters.level": "Niveau",
    "resources.filters.allLevels": "Tous les niveaux",
    "resources.filters.sequence": "Séquence",
    "resources.filters.allSequences": "Toutes les séquences",
    "resources.filters.examType": "Type d'évaluation",
    "resources.filters.allExamTypes": "Tous les types",
    "resources.filters.reset": "Réinitialiser",
    "resources.filters.cancel": "Annuler",
    "resources.filters.apply": "Appliquer",
    "resources.filters.close": "Fermer",

    "resources.help.menuLabel": "Aide",
    "resources.help.close": "Fermer",
    "resources.help.ASSESSMENT.title": "Comment utiliser l'onglet Évaluations",
    "resources.help.EXAM.title": "Comment utiliser l'onglet Examens",
    "resources.help.browse.section1Title": "Rechercher et filtrer",
    "resources.help.browse.section1Body":
      "Utilisez le champ de recherche pour retrouver une ressource par son titre. Touchez l'icône filtre pour affiner par année scolaire, établissement, niveau, séquence ou type d'examen selon l'onglet consulté.",
    "resources.help.browse.section2Title": "Consulter une ressource",
    "resources.help.browse.section2Body":
      "Touchez une carte pour ouvrir l'énoncé ou, si disponible, le corrigé.",
    "resources.help.browse.section3Title": "Ajouter aux favoris",
    "resources.help.browse.section3Body":
      "Touchez l'icône favori sur une carte pour l'ajouter à vos favoris et la retrouver rapidement depuis l'onglet Favoris.",
    "resources.help.mine.title": "Comment utiliser l'onglet Mes ressources",
    "resources.help.mine.section1Title": "Suivre le statut de vos propositions",
    "resources.help.mine.section1Body":
      "Chaque ressource que vous avez proposée affiche le statut de son énoncé et, si présent, de son corrigé : en attente, approuvé ou refusé par la modération — pour savoir si votre proposition est déjà visible des autres utilisateurs.",
    "resources.help.mine.section2Title": "Modifier une proposition",
    "resources.help.mine.section2Body":
      "Touchez Modifier sur une de vos ressources pour corriger son contenu, avant ou après validation par la modération.",
    "resources.help.favorites.title": "Comment utiliser l'onglet Favoris",
    "resources.help.favorites.section1Title":
      "Retrouver vos ressources favorites",
    "resources.help.favorites.section1Body":
      "Cet onglet regroupe toutes les ressources ajoutées en favori depuis les onglets Évaluations et Examens. Touchez à nouveau l'icône favori sur une carte pour la retirer de cette liste.",

    "onboardingTour.resources.step1Title": "Types de ressources",
    "onboardingTour.resources.step1Body":
      "Basculez entre Évaluations, Examens et vos Favoris grâce à ces onglets.",
    "onboardingTour.resources.step2Title": "Rechercher et filtrer",
    "onboardingTour.resources.step2Body":
      "Recherchez une ressource par titre, ou touchez l'icône de filtre pour affiner par année, établissement, niveau ou type.",
    "onboardingTour.resources.step3Title": "Besoin d'aide ?",
    "onboardingTour.resources.step3Body":
      "Touchez ce bouton, puis « Aide » dans le menu, pour retrouver ces explications à tout moment.",

    "resources.form.duplicateWarningTitle":
      "Ressource peut-être déjà existante",
    "resources.form.duplicateWarningMessage":
      "Une ou plusieurs ressources similaires existent déjà. Voulez-vous vraiment créer celle-ci ?",
    "resources.form.duplicateConfirm": "Créer quand même",
    "resources.form.duplicateCancel": "Annuler",
    "resources.form.duplicateBlocked":
      "Cette ressource existe déjà (trop similaire à une ressource existante).",

    "resources.card.proposeStatement": "Proposer un énoncé",
    "resources.card.proposeCorrection": "Proposer un corrigé",

    "resources.contribution.statementHeader": "Énoncé",
    "resources.contribution.correctionHeader": "Corrigé",
    "resources.contribution.approvedLabel": "Contenu retenu",
    "resources.contribution.myContributionLabel": "Ma contribution",
    "resources.contribution.contentPlaceholder": "Rédigez le contenu ici…",
    "resources.contribution.saveDraft": "Enregistrer le brouillon",
    "resources.contribution.submit": "Soumettre à validation",
    "resources.contribution.draftSaved": "Brouillon enregistré",
    "resources.contribution.submitted": "Soumis pour validation",
    "resources.contribution.statusDraft": "Brouillon",
    "resources.contribution.statusAwaiting": "En attente de validation",
    "resources.contribution.statusApproved": "Validé",
    "resources.contribution.statusRejected": "Rejeté",
    "resources.contribution.statusDiscarded": "Non retenu",
    "resources.contribution.rejectedReasonLabel": "Motif du rejet :",
    "resources.contribution.noApprovedYet":
      "Aucun contenu validé pour le moment.",
    "resources.contribution.correctionLocked":
      "Le corrigé est proposable une fois l'énoncé validé.",
    "resources.contribution.addAttachment": "Ajouter une pièce jointe",
    "resources.contribution.insertingImage": "Insertion de l'image…",
    "resources.contribution.colorMenu.title": "Couleur du texte",
    "resources.contribution.colorMenu.message": "Choisissez une couleur",
    "resources.contribution.newProposal": "Nouvelle proposition",
    "resources.contribution.contentRequired": "Le contenu est obligatoire.",

    "resources.moderation.proposedByLabel": "Proposé par",
    "resources.moderation.approveThis": "Valider celle-ci",
    "resources.moderation.rejectThis": "Rejeter",
    "resources.moderation.rejectReasonPlaceholder":
      "Motif du rejet (optionnel)",
    "resources.moderation.conflictError":
      "Cette soumission a déjà été traitée par un autre administrateur.",
    "resources.moderation.approveSuccess": "Soumission validée.",
    "resources.moderation.rejectSuccess": "Soumission rejetée.",
    "resources.moderation.statementNotApproved":
      "L'énoncé de cette ressource n'est pas encore validé.",
    "resources.moderation.reviewHeaderStatement": "Modération — Énoncé",
    "resources.moderation.reviewHeaderCorrection": "Modération — Corrigé",
    "resources.moderation.referenceStatementLabel": "Énoncé de référence",
    "resources.moderation.submissionContentLabel": "Contenu proposé",
    "resources.moderation.editContent": "Modifier",
    "resources.moderation.saveEdit": "Enregistrer les modifications",
    "resources.moderation.editSuccess": "Contenu mis à jour.",
    "resources.moderation.notFound":
      "Cette soumission n'existe plus ou a déjà été traitée.",

    "resources.onboarding.title": "Comment contribuer une ressource",
    "resources.onboarding.step1Title": "1. Créer la fiche",
    "resources.onboarding.step1Body":
      "Renseignez les informations générales : matière, niveau, séquence ou type d'examen. La fiche apparaît ensuite dans l'onglet \"Mes ressources\".",
    "resources.onboarding.step2Title": "2. Proposer un énoncé",
    "resources.onboarding.step2Body":
      "Depuis l'onglet \"Mes ressources\", proposez l'énoncé de votre fiche. N'importe quel enseignant peut proposer un énoncé concurrent ; la plateforme valide le meilleur.",
    "resources.onboarding.step3Title": "3. Proposer un corrigé",
    "resources.onboarding.step3Body":
      'Une fois l\'énoncé validé par la plateforme, chacun peut proposer un corrigé depuis la fiche, toujours en "Mes ressources" : le meilleur corrigé est retenu lors de la validation.',
    "resources.onboarding.dontShowAgain": "Ne plus afficher",
    "resources.onboarding.start": "Commencer",

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
    "timetable.childAgenda.help.menuLabel": "Aide",
    "timetable.childAgenda.help.title": "Comment utiliser cette page",
    "timetable.childAgenda.help.close": "J'ai compris",
    "timetable.childAgenda.help.section1Title": "Changer de vue",
    "timetable.childAgenda.help.section1Body":
      "Basculez entre Jour, Semaine et Mois pour changer la façon d'afficher l'emploi du temps de votre enfant.",
    "timetable.childAgenda.help.section2Title": "Naviguer dans le temps",
    "timetable.childAgenda.help.section2Body":
      "Utilisez les flèches ou touchez le libellé de la période pour naviguer dans le temps : avancez de plusieurs mois pour retrouver un créneau précis, ou revenez à « aujourd'hui » pour consulter l'agenda du jour ou de demain.",
    "timetable.childAgenda.help.section3Title":
      "Consulter le détail d'un cours",
    "timetable.childAgenda.help.section3Body":
      "Touchez une carte de cours pour voir en un coup d'œil son horaire, l'enseignant et la salle.",

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

    "timetable.teacherAgenda.admin.modeLabel": "Rechercher par",
    "timetable.teacherAgenda.admin.userLabel": "Utilisateur",
    "timetable.teacherAgenda.admin.userPlaceholder": "Choisir un utilisateur",
    "timetable.teacherAgenda.admin.levelLabel": "Niveau",
    "timetable.teacherAgenda.admin.allLevels": "Tous les niveaux",
    "timetable.teacherAgenda.admin.classLabel": "Classe",
    "timetable.teacherAgenda.admin.classPlaceholder": "Choisir une classe",
    "timetable.teacherAgenda.admin.searchClassPlaceholder":
      "Rechercher une classe...",
    "timetable.teacherAgenda.admin.roleTeacher": "Enseignant",
    "timetable.teacherAgenda.admin.roleStudent": "Élève",
    "timetable.teacherAgenda.admin.roleStaff": "Personnel",
    "timetable.teacherAgenda.admin.filters.reset": "Réinitialiser",
    "timetable.teacherAgenda.admin.filters.close": "Fermer",
    "timetable.teacherAgenda.admin.filters.apply": "Appliquer",
    "timetable.teacherAgenda.admin.emptySelectionTitle":
      "Choisissez un utilisateur ou une classe",
    "timetable.teacherAgenda.admin.emptySelectionMessage":
      "Ouvrez les filtres pour rechercher un utilisateur ou une classe et afficher son emploi du temps.",
    "timetable.teacherAgenda.admin.noAgendaTitle": "Aucun emploi du temps",
    "timetable.teacherAgenda.admin.noAgendaMessage":
      "Ce profil ne dispose pas d'emploi du temps (personnel administratif).",
    "timetable.teacherAgenda.admin.emptyMessageStudent":
      "Aucun créneau planifié pour cet élève sur cette période.",
    "timetable.teacherAgenda.admin.selectionBanner.userPrefix": "Agenda de",
    "timetable.teacherAgenda.admin.selectionBanner.classPrefix": "Classe",
    "timetable.teacherAgenda.admin.selectionBanner.clear":
      "Effacer la sélection",

    "timetable.teacherAgenda.help.menuLabel": "Aide",
    "timetable.teacherAgenda.help.close": "J'ai compris",
    "timetable.teacherAgenda.help.mine.title": "Comment utiliser mon agenda",
    "timetable.teacherAgenda.help.mine.section1Title": "Changer de vue",
    "timetable.teacherAgenda.help.mine.section1Body":
      "Touchez Jour, Semaine ou Mois pour changer la façon d'afficher votre emploi du temps personnel.",
    "timetable.teacherAgenda.help.mine.section2Title": "Naviguer dans le temps",
    "timetable.teacherAgenda.help.mine.section2Body":
      "Utilisez les flèches pour passer à la période précédente ou suivante, ou touchez le libellé pour revenir à aujourd'hui.",
    "timetable.teacherAgenda.help.mine.section3Title": "Consulter un cours",
    "timetable.teacherAgenda.help.mine.section3Body":
      "Touchez une carte de cours pour voir la classe, la matière, la salle et modifier ou annuler ce créneau si besoin.",
    "timetable.teacherAgenda.help.classes.title":
      "Comment utiliser l'agenda de mes classes",
    "timetable.teacherAgenda.help.classes.section1Title": "Choisir la classe",
    "timetable.teacherAgenda.help.classes.section1Body":
      "Touchez une classe dans la liste en haut de l'écran pour afficher son emploi du temps complet.",
    "timetable.teacherAgenda.help.classes.section2Title":
      "Changer de vue et naviguer",
    "timetable.teacherAgenda.help.classes.section2Body":
      "Comme pour votre agenda personnel, basculez entre Jour/Semaine/Mois et utilisez les flèches pour changer de période.",
    "timetable.teacherAgenda.help.classes.section3Title": "Consulter un cours",
    "timetable.teacherAgenda.help.classes.section3Body":
      "Touchez une carte de cours pour voir le détail complet du créneau pour cette classe.",

    "onboardingTour.teacherAgenda.step1Title": "Deux vues",
    "onboardingTour.teacherAgenda.step1Body":
      "Touchez un onglet pour passer de votre agenda personnel à l'emploi du temps de vos classes.",
    "onboardingTour.teacherAgenda.step2Title": "Changez de vue",
    "onboardingTour.teacherAgenda.step2Body":
      "Touchez Jour, Semaine ou Mois pour changer la façon d'afficher l'emploi du temps.",
    "onboardingTour.teacherAgenda.step3Title": "Naviguez dans le temps",
    "onboardingTour.teacherAgenda.step3Body":
      "Utilisez les flèches pour passer à la période précédente ou suivante, ou touchez le libellé pour revenir à aujourd'hui.",
    "onboardingTour.teacherAgenda.step4Title": "Une aide toujours disponible",
    "onboardingTour.teacherAgenda.step4Body":
      "Touchez ce bouton à tout moment, puis « Aide » dans le menu, pour afficher un rappel adapté à l'onglet que vous consultez.",

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

    "messaging.help.menuLabel": "Aide",
    "messaging.help.title": "Messagerie",
    "messaging.help.close": "Fermer",
    "messaging.help.section1Title": "Organiser vos messages",
    "messaging.help.section1Body":
      "Utilisez les onglets Réception, Envoyés, Brouillons et Archives pour retrouver vos messages selon leur statut.",
    "messaging.help.section2Title": "Écrire un message",
    "messaging.help.section2Body":
      "Touchez le bouton + pour composer un nouveau message. Un brouillon en cours d'écriture est automatiquement enregistré dans l'onglet Brouillons.",

    "onboardingTour.messages.step1Title": "Vos dossiers",
    "onboardingTour.messages.step1Body":
      "Basculez entre Réception, Envoyés, Brouillons et Archives grâce à ces onglets.",
    "onboardingTour.messages.step2Title": "Écrire un message",
    "onboardingTour.messages.step2Body":
      "Touchez ce bouton pour composer un nouveau message.",
    "onboardingTour.messages.step3Title": "Besoin d'aide ?",
    "onboardingTour.messages.step3Body":
      "Touchez ce bouton, puis « Aide » dans le menu, pour retrouver ces explications à tout moment.",

    "messaging.compose.titleNew": "Nouveau message",
    "messaging.compose.titleReply": "Répondre",
    "messaging.compose.titleForward": "Transférer",
    "messaging.compose.titleEditDraft": "Modifier le brouillon",
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
    "messaging.compose.errors.attachmentUploadFailed":
      "Impossible d'ajouter cette pièce jointe. Réessayez.",
    "messaging.compose.errors.draftLoadFailedTitle": "Erreur",
    "messaging.compose.errors.draftLoadFailedMessage":
      "Impossible de charger ce brouillon.",
    "messaging.compose.attachingFile": "Ajout de la pièce jointe...",

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
    "messaging.actions.editDraft": "Modifier le brouillon",
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
    "tests.campaigns.progressCompact": "{done}/{total} testés",
    "tests.campaigns.search.placeholder": "Rechercher une campagne",
    "tests.campaigns.search.accessibilityLabel": "Rechercher une campagne",
    "tests.campaigns.search.clearAccessibilityLabel": "Effacer la recherche",
    "tests.campaigns.filters.mineAccessibilityLabel":
      "Afficher uniquement mes campagnes assignées",
    "tests.campaigns.filters.resetSearch": "Réinitialiser",
    "tests.campaigns.filters.statusLabel": "Statut",
    "tests.filters.panelTitle": "Filtres",
    "tests.filters.toggleAccessibilityLabel": "Filtres",
    "tests.filters.reset": "Réinitialiser",
    "tests.filters.close": "Fermer",
    "tests.filters.apply": "Appliquer",
    "tests.filters.mineOnlyLabel": "Mes campagnes uniquement",
    "tests.campaigns.emptySearchTitle": "Aucun résultat",
    "tests.campaigns.emptySearchMessage":
      "Aucune campagne ne correspond à votre recherche ou vos filtres.",
    "tests.campaigns.actions.start": "Démarrer",
    "tests.campaigns.actions.review": "Consulter",
    "tests.tourFallback.title": "Exemple de campagne",
    "tests.tourFallback.description":
      "Ceci est un exemple affiché uniquement pendant la visite guidée.",
    "tests.help.menuLabel": "Aide",
    "tests.help.close": "Fermer",
    "tests.help.title": "Aide — Tests",
    "tests.help.section1Title": "Résumé",
    "tests.help.section1Body":
      "Cet onglet donne une vue d'ensemble : nombre de campagnes, campagnes en cours/à venir/terminées, nombre total de cas de test et de tests restants. La carte « À faire aujourd'hui » met en avant la campagne la plus urgente (échéance la plus proche) qu'il vous reste à terminer, avec un bouton pour la démarrer directement. Toucher une carte de statistique (Campagnes, En cours, etc.) ouvre directement l'onglet Campagnes filtré sur ce statut.",
    "tests.help.section2Title": "Campagnes",
    "tests.help.section2Body":
      "Une campagne regroupe plusieurs cas de test à réaliser. Utilisez la barre de recherche pour retrouver une campagne par son titre ou sa description, et le bouton en forme d'entonnoir à droite pour ouvrir le panneau de filtres (statut All/In progress/Upcoming/Completed, et affichage limité à vos campagnes assignées — ce dernier filtre est activé par défaut si des campagnes vous ont été assignées). Chaque carte affiche votre progression au format {done}/{total} et l'échéance si elle existe. Touchez la carte, ou le bouton Démarrer/Consulter, pour ouvrir la campagne : le bouton affiche Démarrer tant qu'aucun test n'a été terminé, puis Consulter une fois qu'au moins un cas a été soumis. Dans une campagne, chaque cas de test a lui aussi son bouton Démarrer/Consulter ; une fois dessus, touchez « Voir la spec du test » pour déplier l'objectif, les prérequis, le résultat attendu et les étapes (repliés par défaut), puis le bouton « Saisir le résultat du test » en bas de l'écran pour enregistrer votre résultat.",
    "tests.help.section3Title": "Tests faits",
    "tests.help.section3Body":
      "Retrouvez ici l'historique de vos résultats déjà soumis (réussi, échoué, bloqué, ignoré...). Recherchez un test par son titre ou celui de sa campagne, et touchez le bouton entonnoir pour filtrer par statut, par campagne, ou pour limiter l'affichage à vos campagnes assignées. Touchez un résultat pour en voir le détail (commentaire, captures, appareil utilisé).",
    "tests.help.section4Title": "À refaire",
    "tests.help.section4Body":
      "Un administrateur peut vous demander de reprendre un test après examen de votre résultat (avec une note explicative). Cet onglet regroupe ces demandes de reprise. Recherchez ou utilisez le bouton entonnoir pour filtrer par campagne ou limiter l'affichage à vos campagnes assignées. Touchez une carte pour ouvrir le cas de test et soumettre un nouveau résultat.",
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
    "tests.detail.viewSpecToggle": "Voir la spec du test",
    "tests.detail.hideSpecToggle": "Masquer la spec du test",
    "tests.detail.statusPlaceholder": "Sélectionnez le statut du test",
    "tests.detail.validation.statusRequired":
      "Sélectionnez un statut avant d'enregistrer.",
    "tests.detail.fabAdd": "Saisir le résultat du test",
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
    "tests.tabs.toRedo": "À refaire",

    "tests.toRedo.emptyTitle": "Aucun test à refaire",
    "tests.toRedo.emptyMessage":
      "Les tests qu'un administrateur vous demande de refaire apparaîtront ici.",
    "tests.toRedo.search.placeholder": "Rechercher un test",
    "tests.toRedo.search.accessibilityLabel": "Rechercher un test",
    "tests.toRedo.search.clearAccessibilityLabel": "Effacer la recherche",
    "tests.toRedo.filters.campaign": "Campagne",
    "tests.toRedo.filters.campaignAll": "Toutes campagnes",
    "tests.toRedo.filters.mineAccessibilityLabel":
      "Afficher uniquement mes campagnes assignées",
    "tests.toRedo.emptySearchTitle": "Aucun résultat",
    "tests.toRedo.emptySearchMessage":
      "Aucun test à refaire ne correspond à votre recherche ou vos filtres.",
    "tests.toRedo.cardCampaign": "Campagne : {title}",
    "tests.toRedo.requestedOn": "Reprise demandée le {date}",

    "tests.detail.reworkBanner.title": "Ce test doit être refait",
    "tests.detail.reworkBanner.noNote":
      "Un administrateur a demandé une reprise de ce test.",
    "tests.detail.reworkBanner.formNote":
      "Vous saisissez un nouveau résultat suite à une demande de reprise.",

    "tests.executions.filters.status": "Statut",
    "tests.executions.filters.statusAll": "Tous statuts",
    "tests.executions.filters.campaign": "Campagne",
    "tests.executions.filters.campaignAll": "Toutes campagnes",
    "tests.executions.emptyTitle": "Aucun test réalisé",
    "tests.executions.emptyMessage":
      "Vos résultats de test apparaîtront ici une fois soumis.",
    "tests.executions.search.placeholder": "Rechercher un test",
    "tests.executions.search.accessibilityLabel": "Rechercher un test",
    "tests.executions.search.clearAccessibilityLabel": "Effacer la recherche",
    "tests.executions.emptySearchTitle": "Aucun résultat",
    "tests.executions.emptySearchMessage":
      "Aucun test réalisé ne correspond à votre recherche.",
    "tests.executions.filters.mineAccessibilityLabel":
      "Afficher uniquement mes campagnes assignées",
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
    "tests.summary.kpi.mineCaption": "dont {count} pour moi",
    "tests.summary.highlight.title": "À faire aujourd'hui",
    "tests.summary.highlight.campaignBadge": "Campagne",
    "tests.summary.highlight.cta": "Faire la campagne",
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

    "siteContentAdmin.title": "Contenu du site",
    "siteContentAdmin.subtitle":
      "Coordonnées de contact et documents légaux publics",
    "siteContentAdmin.restricted":
      "Réservé aux administrateurs de la plateforme.",
    "siteContentAdmin.tabs.contact": "Contact",
    "siteContentAdmin.tabs.legal": "Documents légaux",
    "siteContentAdmin.tabs.messages": "Messages",
    "siteContentAdmin.contact.emailLabel": "Email",
    "siteContentAdmin.contact.phoneLabel": "Téléphone",
    "siteContentAdmin.contact.addressStreetLabel": "Voie",
    "siteContentAdmin.contact.addressDistrictLabel": "Quartier",
    "siteContentAdmin.contact.addressCityLabel": "Ville",
    "siteContentAdmin.contact.addressCountryLabel": "Pays",
    "siteContentAdmin.contact.legalRepresentativeFirstNameLabel":
      "Responsable légal — Prénom",
    "siteContentAdmin.contact.legalRepresentativeLastNameLabel":
      "Responsable légal — Nom",
    "siteContentAdmin.contact.save": "Enregistrer",
    "siteContentAdmin.contact.loadError":
      "Impossible de charger les coordonnées de contact.",
    "siteContentAdmin.contact.saveSuccess": "Coordonnées mises à jour.",
    "siteContentAdmin.contact.saveError":
      "Impossible d'enregistrer les coordonnées.",
    "siteContentAdmin.contact.error.email": "Email invalide.",
    "siteContentAdmin.contact.error.phone": "Le téléphone est requis.",
    "siteContentAdmin.contact.error.addressStreet": "La voie est requise.",
    "siteContentAdmin.contact.error.addressCity": "La ville est requise.",
    "siteContentAdmin.contact.error.addressCountry": "Le pays est requis.",
    "siteContentAdmin.contact.edit": "Modifier",
    "siteContentAdmin.contact.cancel": "Annuler",
    "siteContentAdmin.contact.notProvided": "Non renseigné",
    "siteContentAdmin.contact.addressGroupLabel": "Adresse",
    "siteContentAdmin.legal.slugLabel": "Document",
    "siteContentAdmin.legal.slug.cgu": "CGU",
    "siteContentAdmin.legal.slug.mentions-legales": "Mentions légales",
    "siteContentAdmin.legal.slug.confidentialite": "Confidentialité",
    "siteContentAdmin.legal.localeLabel": "Langue",
    "siteContentAdmin.legal.locale.fr": "Français",
    "siteContentAdmin.legal.locale.en": "Anglais",
    "siteContentAdmin.legal.listError":
      "Impossible de charger les versions de ce document.",
    "siteContentAdmin.legal.empty": "Aucune version pour l'instant.",
    "siteContentAdmin.legal.version": "Version",
    "siteContentAdmin.legal.status.DRAFT": "Brouillon",
    "siteContentAdmin.legal.status.PUBLISHED": "Publié",
    "siteContentAdmin.legal.status.ARCHIVED": "Archivé",
    "siteContentAdmin.legal.edit": "Modifier",
    "siteContentAdmin.legal.publish": "Publier",
    "siteContentAdmin.legal.delete": "Supprimer",
    "siteContentAdmin.legal.newDraftTitle": "Nouveau brouillon",
    "siteContentAdmin.legal.titleLabel": "Titre",
    "siteContentAdmin.legal.contentLabel": "Contenu",
    "siteContentAdmin.legal.createDraft": "Créer le brouillon",
    "siteContentAdmin.legal.saveDraft": "Enregistrer le brouillon",
    "siteContentAdmin.legal.cancel": "Annuler",
    "siteContentAdmin.legal.error.title": "Le titre est requis.",
    "siteContentAdmin.legal.error.content": "Le contenu est requis.",
    "siteContentAdmin.legal.createSuccess": "Brouillon créé.",
    "siteContentAdmin.legal.createError": "Impossible de créer le brouillon.",
    "siteContentAdmin.legal.saveDraftSuccess": "Brouillon enregistré.",
    "siteContentAdmin.legal.saveDraftError":
      "Impossible d'enregistrer le brouillon.",
    "siteContentAdmin.legal.publishConfirmTitle": "Publier ce document ?",
    "siteContentAdmin.legal.publishConfirm":
      "La version publiée actuelle sera archivée et remplacée par celle-ci.",
    "siteContentAdmin.legal.publishSuccess": "Document publié.",
    "siteContentAdmin.legal.publishError": "Impossible de publier le document.",
    "siteContentAdmin.legal.deleteConfirmTitle": "Supprimer ce brouillon ?",
    "siteContentAdmin.legal.deleteConfirm": "Cette action est irréversible.",
    "siteContentAdmin.legal.deleteSuccess": "Brouillon supprimé.",
    "siteContentAdmin.legal.deleteError":
      "Impossible de supprimer ce brouillon.",
    "siteContentAdmin.editor.colorMenuTitle": "Couleur du texte",
    "siteContentAdmin.editor.colorMenuMessage": "Choix rapide",
    "siteContentAdmin.editor.cancel": "Annuler",
    "siteContentAdmin.messages.listError":
      "Impossible de charger les prises de contact.",
    "siteContentAdmin.messages.emptyTitle": "Aucune prise de contact.",
    "siteContentAdmin.messages.previous": "Précédent",
    "siteContentAdmin.messages.next": "Suivant",
    "siteContentAdmin.messages.loading": "Chargement...",
    "siteContentAdmin.messages.read": "Message lu",
    "siteContentAdmin.messages.reply": "Répondre par email",
    "siteContentAdmin.help.toggle": "Aide",
    "siteContentAdmin.help.close": "J'ai compris",
    "siteContentAdmin.help.contact.title": "Comment utiliser l'onglet Contact",
    "siteContentAdmin.help.contact.section1Title":
      "Consulter les coordonnées publiques",
    "siteContentAdmin.help.contact.section1Body":
      "Cet onglet affiche les coordonnées de contact (email, téléphone, adresse, représentant légal) affichées publiquement sur le site vitrine de l'école.",
    "siteContentAdmin.help.contact.section2Title": "Modifier les coordonnées",
    "siteContentAdmin.help.contact.section2Body":
      "Touchez Modifier pour corriger une information, puis Enregistrer. La mise à jour est immédiatement visible sur le site public.",
    "siteContentAdmin.help.legal.title":
      "Comment utiliser l'onglet Documents légaux",
    "siteContentAdmin.help.legal.section1Title":
      "Choisir le document et la langue",
    "siteContentAdmin.help.legal.section1Body":
      "Sélectionnez le document (CGU, mentions légales, confidentialité) puis la langue à modifier — chaque document existe indépendamment pour chaque langue proposée sur le site.",
    "siteContentAdmin.help.legal.section2Title":
      "Créer ou modifier un brouillon",
    "siteContentAdmin.help.legal.section2Body":
      "Touchez Nouveau brouillon pour rédiger une nouvelle version, ou Modifier sur un brouillon existant. Un brouillon peut être corrigé librement tant qu'il n'est pas publié, sans affecter la version visible sur le site.",
    "siteContentAdmin.help.legal.section3Title":
      "Publier ou supprimer un document",
    "siteContentAdmin.help.legal.section3Body":
      "Publier un brouillon remplace immédiatement la version visible sur le site pour cette langue et ce document ; les anciennes versions publiées restent consultables dans l'historique. Supprimer retire définitivement un brouillon qui ne doit plus être conservé.",
    "siteContentAdmin.help.messages.title":
      "Comment utiliser l'onglet Messages",
    "siteContentAdmin.help.messages.section1Title":
      "Consulter les messages reçus",
    "siteContentAdmin.help.messages.section1Body":
      "Cet onglet liste les demandes envoyées via le formulaire de contact public du site, des plus récentes aux plus anciennes. Touchez un message pour lire son détail — il est alors marqué comme lu.",

    "onboardingTour.siteContent.step1Title": "Contact, documents et messages",
    "onboardingTour.siteContent.step1Body":
      "Basculez entre les coordonnées de contact publiques, les documents légaux (CGU, mentions légales, confidentialité) et les prises de contact reçues via le formulaire public.",
    "onboardingTour.siteContent.step2Title": "Modifier les coordonnées",
    "onboardingTour.siteContent.step2Body":
      "Les coordonnées sont affichées en lecture seule. Touchez ce bouton pour ouvrir le formulaire de modification, adresse comprise (voie, quartier, ville, pays).",
    "onboardingTour.siteContent.step3Title": "Choisir le document et la langue",
    "onboardingTour.siteContent.step3Body":
      "Sélectionnez le document et la langue pour voir ses versions (brouillon, publiée, archivées).",
    "onboardingTour.siteContent.step4Title": "Créer une nouvelle version",
    "onboardingTour.siteContent.step4Body":
      "Rédigez un nouveau brouillon puis publiez-le pour remplacer la version en ligne.",
    "onboardingTour.siteContent.step5Title": "Besoin d'aide ?",
    "onboardingTour.siteContent.step5Body":
      "Retrouvez à tout moment un rappel de l'usage de cet écran via ce bouton.",

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
    "testsAdmin.executions.rework.request": "Demander une reprise",
    "testsAdmin.executions.rework.cancel": "Annuler la demande",
    "testsAdmin.executions.rework.title": "Demander une reprise de ce test",
    "testsAdmin.executions.rework.requestedBy":
      "Reprise demandée par {name} le {date}",
    "testsAdmin.executions.rework.noteLabel": "Note (optionnel)",
    "testsAdmin.executions.rework.notePlaceholder":
      "Ex. Merci de refaire ce test sur la version 1.4",
    "testsAdmin.executions.rework.submit": "Valider",
    "testsAdmin.executions.rework.submitting": "Enregistrement…",
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
    "feed.filters.toggleAccessibilityLabel": "Filtres",
    "feed.filters.typeGroupLabel": "Type de publication",
    "feed.filters.authorGroupLabel": "Auteur",
    "feed.filters.reset": "Réinitialiser",
    "feed.filters.close": "Fermer",
    "feed.filters.apply": "Appliquer",
    "feed.filters.resultsLabel": "{count} publication(s) au total",

    "feed.search.placeholder": "Rechercher une publication",
    "feed.search.toggle": "Rechercher",

    "feed.help.toggle": "Aide",
    "feed.help.close": "J'ai compris",

    "feed.unavailable.title": "Fil indisponible",
    "feed.unavailable.message":
      "Ce rôle ne dispose pas encore du module d'actualité.",

    "feed.errors.loadFailed": "Impossible de charger le fil.",
    "feed.errors.childContextMissing": "Contexte enfant introuvable.",
    "feed.errors.classContextMissing": "Contexte classe introuvable.",
    "feed.errors.schoolMissing": "Établissement introuvable",
    "feed.errors.openAttachmentTitle": "Erreur",
    "feed.errors.openAttachment": "Impossible d'ouvrir cette pièce jointe.",

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
    "feed.attachments.uploading": "Envoi en cours…",
    "feed.attachments.uploadError":
      "Échec de l'envoi de la pièce jointe. Réessayez.",
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
    "feed.classLife.help.title": "Vie de classe",
    "feed.classLife.help.menuLabel": "Aide",
    "feed.classLife.help.section1Title": "À quoi sert ce fil",
    "feed.classLife.help.section1Body":
      "Ce fil regroupe toutes les publications de la classe (annonces, messages, sondages) dans l'ordre chronologique, les plus récentes en premier. Il sert de mémoire commune : plutôt que de disperser l'information dans des messages séparés, tout ce qui concerne la classe reste consultable à un seul endroit, y compris après plusieurs jours.",
    "feed.classLife.help.section2Title": "Rechercher une publication",
    "feed.classLife.help.section2Body":
      "Utilisez la barre de recherche pour retrouver une publication par mot-clé (dans son titre ou son texte). C'est utile dès que le fil contient plusieurs semaines d'historique et que vous cherchez une information précise (ex. une date de sortie scolaire) sans faire défiler toute la liste.",
    "feed.classLife.help.section3Title": "Filtrer par type et par auteur",
    "feed.classLife.help.section3Body":
      "Le bouton filtre (icône entonnoir) ouvre un panneau où vous pouvez combiner plusieurs types de publication (« à la une », sondages) et n'afficher que vos propres publications. Utile pour se concentrer sur un seul sujet, par exemple ne voir que les sondages en cours. Une fois votre sélection faite, validez avec « Appliquer » pour mettre à jour la liste ; le bouton filtre reste teinté tant qu'un filtre est actif, pour vous rappeler que la liste est restreinte.",
    "feed.classLife.help.section4Title": "Types de publications",
    "feed.classLife.help.section4Body":
      "Une publication marquée d'une étoile (icône scintillante) est « à la une » : mise en avant par l'auteur car jugée particulièrement importante, elle reste visible même après avoir été dépassée par des publications plus récentes. Un sondage affiche une question et des options à choix : touchez une option pour voter, le résultat (nombre de voix par option) apparaît immédiatement après votre vote, qui n'est pas modifiable ensuite.",
    "feed.classLife.help.section5Title": "Réagir à une publication",
    "feed.classLife.help.section5Body":
      "Le cœur ajoute ou retire un « j'aime » et affiche le nombre total de personnes ayant aimé la publication — un signal rapide d'approbation sans écrire de message. La bulle de commentaires affiche le nombre de réponses déjà postées et déplie la liste des commentaires en la touchant. Le bouton « Réagir » ouvre un champ de texte avec des émojis rapides à ajouter d'un tap : écrivez votre réponse (ou insérez un émoji) puis validez avec « Envoyer » pour publier votre commentaire, visible par toute la classe.",
    "feed.classLife.help.section6Title": "Pièces jointes et images",
    "feed.classLife.help.section6Body":
      "Une publication peut contenir des images insérées directement dans le texte (touchez-les pour les afficher en plein écran) et des fichiers joints (documents, PDF...) listés sous le texte avec leur nom et leur taille : touchez un fichier pour l'ouvrir ou le télécharger.",
    "feed.classLife.help.section7Title": "Publier et gérer vos publications",
    "feed.classLife.help.section7Body":
      "Le bouton rond en bas de l'écran ouvre le formulaire de publication : rédigez un texte, ajoutez éventuellement des images ou pièces jointes, ou créez un sondage. Vous pouvez supprimer une publication que vous avez vous-même créée grâce à l'icône corbeille qui apparaît sur celle-ci ; les publications des autres membres de la classe ne peuvent pas être supprimées depuis cet écran.",

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
    "feed.page.help.title": "Rechercher et filtrer",
    "feed.page.help.body1":
      "Utilisez la barre de recherche pour retrouver une publication par mot-clé.",
    "feed.page.help.body2":
      "Le bouton filtre à droite ouvre un panneau où vous pouvez combiner plusieurs types de publication (à la une, sondages) et n'afficher que vos propres publications.",
    "feed.page.help.body3":
      "Une fois votre sélection faite, validez avec Appliquer pour mettre à jour la liste.",
    "feed.detail.headerTitle": "Publication",
    "feed.detail.backToList": "Retour à la liste",
    "feed.composer.titleLabel": "Titre",
    "feed.composer.contentLabel": "Contenu",
    "feed.comments.summaryNone": "Soyez le premier à réagir",
    "feed.comments.summaryOne": "1 commentaire",
    "feed.comments.summaryMany": "{count} commentaires",

    "notes.tabs.evaluations": "Évaluations",
    "notes.tabs.notes": "Notes",
    "notes.tabs.council": "Conseil classe",
    "notes.tabs.reports": "Bulletins",
    "notes.tabs.decision": "Décision",

    "notes.decision.intro":
      "Synthèse annuelle et décision de passage, réservée au professeur référent de la classe.",
    "notes.decision.synthesis.term1": "T1",
    "notes.decision.synthesis.term2": "T2",
    "notes.decision.synthesis.term3": "T3",
    "notes.decision.synthesis.yearly": "Moy. annuelle",
    "notes.decision.synthesis.rankPrefix": "Rang",
    "notes.decision.synthesis.rankSeparator": "/",
    "notes.decision.empty.title": "Aucun bulletin",
    "notes.decision.empty.message":
      "Aucun bulletin du 3ème trimestre n'est disponible pour cette classe.",
    "notes.decision.errors.load": "Impossible de charger les décisions",
    "notes.decision.errors.save": "Impossible d'enregistrer la décision",
    "notes.decision.success.saved": "Décision enregistrée",
    "notes.decision.decisionPlaceholder": "Décision",
    "notes.decision.noDecision": "Aucune décision",

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
    "notes.teacher.loading.students": "Chargement des élèves…",
    "notes.teacher.filters.studentLabel": "ÉLÈVE",
    "notes.teacher.filters.subjectLabel": "MATIÈRE",
    "notes.teacher.filters.allSubjects": "Toutes les matières",
    "notes.teacher.picker.selectStudent": "Sélectionner un élève",
    "notes.teacher.picker.filterBySubject": "Filtrer par matière",
    "notes.teacher.search.placeholder": "Rechercher un élève…",
    "notes.teacher.search.accessibilityLabel": "Rechercher un élève",
    "notes.teacher.search.noResults": "Aucun élève trouvé",
    "notes.teacher.filters.toggleAccessibilityLabel": "Filtres",
    "notes.teacher.filters.termLabel": "Trimestre",
    "notes.teacher.filters.viewLabel": "Vue",

    "notes.reports.search.placeholder": "Rechercher un élève…",
    "notes.reports.search.accessibilityLabel": "Rechercher un élève",
    "notes.reports.filter.toggleAccessibilityLabel": "Filtres",
    "notes.reports.filter.termLabel": "Trimestre",
    "notes.reports.empty.title": "Aucun bulletin",
    "notes.reports.empty.message":
      "Aucun élève n'est inscrit dans cette classe.",
    "notes.reports.detail.backToList": "Retour à la liste",
    "notes.reports.detail.generalTitle": "Appréciation générale",
    "notes.reports.detail.subjectsTitle": "Appréciations par matière",
    "notes.reports.detail.addAppreciation": "Ajouter une appréciation",
    "notes.reports.detail.editAppreciation": "Modifier",
    "notes.reports.detail.saveField": "Enregistrer",
    "notes.reports.detail.cancel": "Annuler",
    "notes.reports.detail.noAppreciation": "Aucune appréciation renseignée",
    "notes.reports.detail.sequenceAverage": "Moyenne séquence :",
    "notes.reports.detail.termAverage": "Moyenne du trimestre",
    "notes.reports.meta.saveMeta": "Enregistrer",
    "notes.reports.detail.rankAndClassAverage":
      "Rang {rank}/{total} · Moy. classe {classAverage}/20",
    "notes.reports.detail.appreciationPlaceholder": "Saisir une appréciation…",
    "notes.reports.detail.appreciationRequired":
      "L'appréciation ne peut pas être vide.",
    "notes.reports.yearly.councilLabel":
      "Synthèse annuelle — moyenne des trimestres disponibles",

    "notes.child.tabs.notes": "Notes",
    "notes.child.tabs.reports": "Bulletins",

    "notes.terms.term1": "Trimestre 1",
    "notes.terms.term2": "Trimestre 2",
    "notes.terms.term3": "Trimestre 3",
    "notes.terms.yearly": "Année",
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
    "notes.form.permission.title": "Permission refusée",
    "notes.form.permission.message": "Autorisez l'accès à la galerie.",
    "notes.form.errors.insertImageTitle": "Image non ajoutée",
    "notes.form.errors.insertImage": "Impossible d'ajouter l'image.",
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
    "notes.manager.search.accessibilityLabel": "Rechercher une évaluation",
    "notes.manager.filters.toggleAccessibilityLabel": "Filtres",
    "notes.manager.filters.typeLabel": "Type d'évaluation",
    "notes.manager.filters.sequenceLabel": "Séquence",
    "notes.manager.filters.completionLabel": "Notes saisies",
    "notes.manager.filters.allOption": "Tous",
    "notes.manager.filters.completionComplete": "Toutes saisies",
    "notes.manager.filters.completionIncomplete": "Incomplètes",
    "notes.manager.filters.reset": "Réinitialiser",
    "notes.manager.filters.close": "Fermer",
    "notes.manager.filters.apply": "Appliquer",
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
    "notes.manager.scores.ungradedSuffix": "non saisies",
    "notes.manager.scores.draftBanner":
      "Brouillon — les notes ne seront visibles dans l'onglet Notes qu'après publication de l'évaluation.",
    "notes.manager.scores.emptyTitle": "Aucun élève",
    "notes.manager.scores.emptyMessage":
      "Sélectionnez un élève dans le filtre ou vérifiez le chargement.",
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
    "notes.manager.toast.attachmentErrorTitle": "Ouverture impossible",
    "notes.manager.toast.attachmentErrorMessage":
      "Impossible d'ouvrir la pièce jointe.",
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

    "notes.manager.help.menuLabel": "Aide",
    "notes.manager.help.close": "J'ai compris",
    "notes.manager.help.evaluations.title":
      "Comment utiliser l'onglet Évaluations",
    "notes.manager.help.evaluations.section1Title": "Rechercher et filtrer",
    "notes.manager.help.evaluations.section1Body":
      "Utilisez la recherche pour retrouver une évaluation par titre. Touchez l'icône filtre pour affiner la liste par type d'évaluation, par séquence ou par statut de saisie (complète ou incomplète) — utile pour repérer rapidement les évaluations auxquelles il manque encore des notes.",
    "notes.manager.help.evaluations.section2Title":
      "Statut brouillon ou publié",
    "notes.manager.help.evaluations.section2Body":
      "Une évaluation créée en brouillon n'est visible ni par les élèves ni par les parents, et ses notes n'apparaissent pas dans leur onglet Notes tant qu'elle n'est pas publiée. Publiez-la dès que son barème et sa date sont définitifs pour la rendre visible ; le badge Brouillon ou Publié sur chaque carte indique son état actuel.",
    "notes.manager.help.evaluations.section3Title":
      "Suivre l'avancement de la saisie",
    "notes.manager.help.evaluations.section3Body":
      "Chaque carte affiche le nombre de notes déjà saisies sur l'effectif de la classe. L'icône de saisie change de couleur selon que la saisie est complète ou encore incomplète, pour repérer d'un coup d'œil les évaluations à finaliser.",
    "notes.manager.help.evaluations.section4Title": "Créer une évaluation",
    "notes.manager.help.evaluations.section4Body":
      "Touchez le bouton + pour créer une nouvelle évaluation : titre, matière, type, séquence, date, barème et coefficient. Enregistrez-la comme brouillon pour la préparer à l'avance, ou publiez-la directement si elle est prête.",
    "notes.manager.help.evaluations.section5Title":
      "Modifier ou supprimer une évaluation",
    "notes.manager.help.evaluations.section5Body":
      "Depuis chaque carte, touchez Détails pour consulter toutes les informations de l'évaluation, Modifier pour corriger son barème, sa date ou son type, ou Supprimer pour la retirer définitivement — utile en cas d'erreur de création, avant que des notes n'y soient rattachées.",
    "notes.manager.help.evaluations.section6Title":
      "Saisir ou modifier les notes",
    "notes.manager.help.evaluations.section6Body":
      "Touchez une évaluation, ou l'action Notes de sa carte, pour ouvrir la saisie et entrer ou corriger la note de chaque élève. Tant que l'évaluation reste en brouillon, un bandeau le rappelle : les notes saisies restent invisibles des familles jusqu'à la publication.",
    "notes.manager.help.notes.title": "Comment utiliser l'onglet Notes",
    "notes.manager.help.notes.section1Title": "Rechercher un élève",
    "notes.manager.help.notes.section1Body":
      "Recherchez un élève par nom pour consulter toutes ses notes et sa moyenne, matière par matière.",
    "notes.manager.help.notes.section2Title":
      "Filtrer par matière, trimestre ou séquence",
    "notes.manager.help.notes.section2Body":
      "Touchez l'icône filtre pour restreindre les résultats à une matière, un trimestre ou une séquence précise — utile pour vérifier rapidement les notes d'une période donnée sans faire défiler tout l'historique de l'élève.",
    "notes.manager.help.notes.section3Title": "Changer d'affichage",
    "notes.manager.help.notes.section3Body":
      "Basculez entre la liste des évaluations, les moyennes par matière et les graphiques d'évolution pour analyser les résultats de l'élève sous l'angle qui vous intéresse.",
    "notes.manager.help.reports.title": "Comment utiliser l'onglet Bulletins",
    "notes.manager.help.reports.section1Title":
      "Rechercher un élève et choisir un trimestre",
    "notes.manager.help.reports.section1Body":
      "Recherchez un élève, puis touchez la carte du trimestre souhaité pour ouvrir son bulletin complet : moyennes par séquence et par matière. Une fois le bulletin généré par l'école, la date de publication apparaît en bas du bulletin.",
    "notes.manager.help.reports.section2Title":
      "Rédiger l'appréciation de matière",
    "notes.manager.help.reports.section2Body":
      "Pour chaque matière que vous enseignez, touchez Modifier pour rédiger ou corriger l'appréciation qui apparaîtra sur le bulletin de l'élève. Les matières que vous n'enseignez pas restent en lecture seule.",
    "notes.manager.help.reports.section3Title":
      "Rédiger l'appréciation générale (professeur référent)",
    "notes.manager.help.reports.section3Body":
      "Si vous êtes professeur référent de la classe, une appréciation générale de conseil de classe est également modifiable, en plus des appréciations par matière — elle résume l'avis du conseil sur l'ensemble du trimestre de l'élève.",
    "notes.manager.help.decision.title": "Comment utiliser l'onglet Décision",
    "notes.manager.help.decision.section1Title": "Ouvrir la carte d'un élève",
    "notes.manager.help.decision.section1Body":
      "Chaque élève est d'abord affiché replié, avec juste son nom et une pastille rouge « Aucune décision » tant qu'aucune décision n'a été enregistrée. Touchez la carte pour l'ouvrir : elle affiche alors les moyennes des trois trimestres, la moyenne annuelle et le rang de l'élève dans sa classe (ex. 3e sur 28) — de quoi statuer en connaissance de cause sur son passage.",
    "notes.manager.help.decision.section2Title": "Choisir la décision",
    "notes.manager.help.decision.section2Body":
      "Sélectionnez Passage, Redoublement ou Départ pour chaque élève. Cette décision détermine si l'élève poursuit dans la classe supérieure, refait son année, ou quitte l'établissement.",
    "notes.manager.help.decision.section3Title":
      "Niveau cible proposé automatiquement",
    "notes.manager.help.decision.section3Body":
      "Sauf en cas de Départ, indiquez le niveau de destination pour l'année suivante. L'application le propose automatiquement dès que vous choisissez Passage (niveau suivant) ou Redoublement (même niveau) — vous pouvez toujours le changer manuellement avant d'enregistrer. Seuls les niveaux activés pour votre école dans Paramètres > Niveaux apparaissent dans cette liste.",
    "notes.manager.help.decision.section4Title": "Enregistrer",
    "notes.manager.help.decision.section4Body":
      "Touchez Enregistrer pour valider la décision de cet élève : la carte se referme automatiquement et affiche désormais la décision prise à la place de « Aucune décision ».",

    "onboardingTour.teacherNotes.step1Title": "Les onglets",
    "onboardingTour.teacherNotes.step1Body":
      "Passez des évaluations aux notes par élève, puis aux bulletins de conseil de classe. Si vous êtes professeur référent de la classe, un onglet Décision apparaît en plus pour statuer sur le passage.",
    "onboardingTour.teacherNotes.step2Title": "Rechercher et filtrer",
    "onboardingTour.teacherNotes.step2Body":
      "Touchez l'icône filtre pour affiner la liste des évaluations par type, séquence ou statut de saisie.",
    "onboardingTour.teacherNotes.step3Title": "Créer une évaluation",
    "onboardingTour.teacherNotes.step3Body":
      "Touchez ce bouton pour créer une nouvelle évaluation avec son barème et sa date.",
    "onboardingTour.teacherNotes.step4Title": "Une aide toujours disponible",
    "onboardingTour.teacherNotes.step4Body":
      "Touchez ce bouton à tout moment, puis « Aide » dans le menu, pour afficher un rappel adapté à l'onglet que vous consultez.",

    "notes.child.title": "Évaluations et moyennes",
    "notes.child.subtitle.student": "Élève",
    "notes.child.help.menuLabel": "Aide",
    "notes.child.help.close": "Fermer",
    "notes.child.help.notes.title": "Notes — Évaluations et moyennes",
    "notes.child.help.notes.section1Title": "Filtrer les résultats",
    "notes.child.help.notes.section1Body":
      "Le bouton filtre change le trimestre consulté, la vue (évaluations, moyennes ou graphiques) et, si plusieurs séquences existent, la séquence affichée. Ces réglages s'appliquent immédiatement à la liste ci-dessous.",
    "notes.child.help.notes.section2Title":
      "Trois façons de lire les résultats",
    "notes.child.help.notes.section2Body":
      "La vue Évaluations liste chaque note obtenue, matière par matière. La vue Moyennes compare la moyenne de votre enfant à celle de la classe pour repérer rapidement un écart. La vue Graphiques affiche un comparatif et un radar par matière sur l'année, utile pour visualiser une évolution ou un point faible récurrent. Touchez une évaluation ou une moyenne pour voir son détail (barème, coefficient, appréciation de l'enseignant).",
    "notes.child.help.reports.title": "Notes — Bulletins",
    "notes.child.help.reports.section1Title": "Consulter les bulletins",
    "notes.child.help.reports.section1Body":
      "Cet onglet liste les bulletins déjà publiés par l'établissement, un par trimestre. Touchez un bulletin pour l'ouvrir : il détaille, matière par matière, la moyenne obtenue et l'appréciation rédigée par l'enseignant, ainsi qu'une appréciation générale du conseil de classe si elle a été renseignée. Un bulletin non encore publié par l'établissement n'apparaît pas dans cette liste.",
    "onboardingTour.childNotes.tabsTitle": "Deux onglets",
    "onboardingTour.childNotes.tabsBody":
      "Notes affiche les évaluations et moyennes du trimestre en cours. Bulletins affiche les bulletins déjà publiés.",
    "onboardingTour.childNotes.filtersTitle": "Filtrez la vue",
    "onboardingTour.childNotes.filtersBody":
      "Changez de trimestre, de vue (évaluations, moyennes, graphiques) ou de séquence depuis ce bouton.",
    "onboardingTour.childNotes.helpToggleTitle": "Une aide toujours disponible",
    "onboardingTour.childNotes.helpToggleBody":
      "Touchez ce bouton, puis « Aide » dans le menu, pour retrouver à tout moment le fonctionnement de cet écran.",
    "notes.panel.notes": "Notes",
    "notes.panel.loading": "Chargement des notes publiées...",
    "notes.panel.emptyTitle": "Aucune note publiée",
    "notes.panel.emptyMessage":
      "Les évaluations publiées pour cet enfant apparaîtront ici.",
    "notes.panel.viewEval": "Eval",
    "notes.panel.viewAvg": "Moy",
    "notes.panel.viewChart": "Graph",
    "notes.panel.filters.toggleAccessibilityLabel": "Filtres",
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
    "notes.admin.filters.year": "Année",
    "notes.admin.filters.allYears": "Toutes les années",
    "notes.admin.filters.level": "Niveau",
    "notes.admin.filters.allLevels": "Tous les niveaux",
    "notes.admin.filters.class": "Classe",
    "notes.admin.filters.classPlaceholder": "Choisir une classe",
    "notes.admin.filters.allClasses": "Toutes les classes",
    "notes.admin.search.placeholder": "Rechercher une évaluation…",
    "notes.admin.loading.evaluations": "Chargement des évaluations…",
    "notes.admin.loading.classes": "Chargement des classes…",
    "notes.admin.error.loadFailed": "Impossible de charger les classes.",
    "notes.admin.error.title": "Erreur",
    "notes.admin.evaluations.emptyTitle": "Aucune évaluation",
    "notes.admin.evaluations.emptyMessage":
      "Aucune évaluation disponible pour les filtres sélectionnés.",
    "notes.admin.evaluations.noResultTitle": "Aucun résultat",
    "notes.admin.evaluations.noResultMessage": "Modifiez votre recherche.",
    "notes.admin.fab.create": "Créer une évaluation",
    "notes.admin.fab.selectClassFirst":
      "Choisissez une classe dans les filtres pour créer une évaluation.",

    // App index — session expirée
    "app.sessionExpired.title": "Session expirée",
    "app.sessionExpired.subtitle":
      "Votre espace a été verrouillé en toute sécurité",
    "app.sessionExpired.message":
      "Votre session a expiré. Veuillez vous connecter à nouveau.",
    "app.sessionExpired.reconnect": "Se reconnecter",

    "childHome.help.menuLabel": "Aide",
    "childHome.help.title": "Accueil enfant",
    "childHome.help.close": "Fermer",
    "childHome.help.section1Title": "Trois indicateurs",
    "childHome.help.section1Body":
      "La moyenne générale, les devoirs non faits et les messages non lus sont résumés en un coup d'œil. Touchez une carte pour ouvrir directement le module correspondant.",
    "childHome.help.section2Title": "Des blocs résumés",
    "childHome.help.section2Body":
      "Chaque bloc (dernières évaluations, fil d'actualité, messages non lus) affiche un aperçu. Touchez « Voir plus » en haut à droite du bloc pour ouvrir le module complet.",
    "childHome.help.section3Title": "Fournitures scolaires",
    "childHome.help.section3Body":
      "Dès que le conseil de classe a décidé du niveau que votre enfant intègre l'an prochain, un bloc « Fournitures » apparaît ici avec un aperçu des articles nécessaires pour ce niveau. Touchez ce bloc pour ouvrir l'écran Réinscription et voir la liste complète.",
    "childHome.supplies.title": "Fournitures scolaires",
    "childHome.supplies.linkLabel": "Voir tout",
    "childHome.supplies.empty":
      "Aucune liste de fournitures définie pour ce niveau pour le moment.",
    "onboardingTour.childHome.kpisTitle": "Trois indicateurs",
    "onboardingTour.childHome.kpisBody":
      "Moyenne, devoirs non faits et messages non lus : touchez une carte pour ouvrir le module correspondant.",
    "onboardingTour.childHome.sectionsTitle": "Des blocs résumés",
    "onboardingTour.childHome.sectionsBody":
      "Chaque bloc affiche un aperçu du module. Touchez « Voir plus » pour l'ouvrir en entier.",
    "onboardingTour.childHome.helpToggleTitle": "Une aide toujours disponible",
    "onboardingTour.childHome.helpToggleBody":
      "Touchez ce bouton, puis « Aide » dans le menu, pour retrouver à tout moment le fonctionnement de cet écran.",

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
    "home.hero.role.healthOfficer": "Responsable santé",
    "home.hero.role.teacher": "Enseignant(e)",
    "home.hero.role.parent": "Parent",
    "home.hero.role.student": "Élève",

    // Accueil Directeur/Administrateur d'école — tableau de bord
    "home.school.dashboard.title": "Tableau de bord {year}",
    "home.school.kpi.classes": "Classes",
    "home.school.kpi.students": "Élèves",
    "home.school.kpi.teachers": "Enseignants",
    "home.school.kpi.parents": "Parents",
    "home.school.kpi.subjects": "Matières",
    "home.school.kpi.rooms": "Salles",

    // Accueil plateforme — KPI ressources (devoirs / examens)
    "home.platform.overview.title": "Vue d'ensemble",
    "home.platform.quickAccess.title": "Accès rapides",
    "home.platform.kpi.schools": "Écoles",
    "home.platform.kpi.users": "Utilisateurs",
    "home.platform.kpi.students": "Élèves",
    "home.platform.resources.title": "Ressources",
    "home.platform.resources.assessments.title": "Devoirs",
    "home.platform.resources.exams.title": "Examens",
    "home.platform.resources.kpi.withoutStatement": "Sans énoncé",
    "home.platform.resources.kpi.withoutCorrection": "Sans corrigé",
    "home.platform.resources.kpi.statementsToApprove": "Énoncés à approuver",
    "home.platform.resources.kpi.correctionsToApprove": "Corrigés à approuver",

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
    "home.parent.help.toggle": "Aide sur cette page",
    "home.parent.help.title": "Votre espace parent",
    "home.parent.help.close": "Fermer",
    "home.parent.help.section1Title": "Vos enfants",
    "home.parent.help.section1Body":
      "Chaque enfant scolarisé sous votre compte apparaît sous forme de carte, avec son nom et sa classe. Le badge à côté du titre indique le nombre total d'enfants rattachés à votre compte. Touchez la carte d'un enfant pour ouvrir son espace personnel (emploi du temps, notes, devoirs, discipline, fil de classe...).",
    "home.parent.help.section2Title": "Accès rapides",
    "home.parent.help.section2Body":
      "Ces quatre raccourcis mènent directement aux rubriques les plus consultées, sans passer par le menu de navigation : « Fil d'actualité » (publications de l'école et des classes), « Finances » (frais de scolarité et paiements), « Messagerie » (échanges avec l'établissement — un badge rouge indique le nombre de messages non lus) et « Documents » (fichiers partagés par l'école).",
    "home.parent.help.section3Title": "Actualités de l'école",
    "home.parent.help.section3Body":
      "Les publications les plus récentes destinées à l'ensemble de l'école s'affichent ici en aperçu. Touchez « Voir tout » pour ouvrir le fil complet et consulter l'historique.",
    "home.parent.help.section4Title": "Retrouver toutes les rubriques",
    "home.parent.help.section4Body":
      "Cette page ne montre que l'essentiel. Pour tout le reste (paramètres du compte, autres modules...), touchez l'icône Menu dans la barre du bas : elle ouvre la navigation complète vers toutes les rubriques disponibles pour votre compte.",

    "home.teacher.help.toggle": "Aide sur cette page",
    "home.teacher.help.title": "Votre tableau de bord enseignant",
    "home.teacher.help.section1Title": "Vos classes",
    "home.teacher.help.section1Body":
      "Chaque carte représente une classe qui vous est assignée, avec son nombre d'élèves et un résumé rapide (nombre de devoirs ouverts, nombre d'évaluations en attente de saisie). Touchez une carte pour ouvrir le menu rapide de cette classe (emploi du temps, notes, discipline, vie de classe).",
    "home.teacher.help.section2Title": "Messages non lus",
    "home.teacher.help.section2Body":
      "Cette section affiche vos messages non lus les plus récents, avec l'expéditeur et l'objet. Le badge numéroté indique combien de messages restent à lire. Touchez un message pour l'ouvrir directement, ou « Messagerie » pour accéder à toute votre boîte de réception.",
    "home.teacher.help.section3Title": "Emploi du temps du jour",
    "home.teacher.help.section3Body":
      "Cette section liste vos cours du jour dans l'ordre chronologique, avec leur horaire et la classe concernée. Touchez « Agenda » pour consulter l'emploi du temps complet de la semaine ou du mois.",
    "home.teacher.help.section4Title": "Évaluations à saisir",
    "home.teacher.help.section4Body":
      "Cette section liste vos évaluations dont les notes n'ont pas encore été entièrement saisies, avec un badge indiquant leur nombre. Touchez « Cahier de notes » pour ouvrir le module complet et compléter la saisie.",
    "home.teacher.help.section5Title": "Devoirs en cours",
    "home.teacher.help.section5Body":
      "Cette section liste les devoirs que vous avez donnés et dont l'échéance n'est pas encore passée, avec leur classe et leur date d'échéance. Touchez « Voir tout » pour gérer l'ensemble de vos devoirs.",
    "home.teacher.help.close": "J'ai compris",

    "onboardingTour.teacherHome.step1Title": "Vos classes",
    "onboardingTour.teacherHome.step1Body":
      "Touchez une carte de classe pour ouvrir rapidement son emploi du temps, ses notes, sa discipline ou sa vie de classe.",
    "onboardingTour.teacherHome.step2Title": "Évaluations en attente",
    "onboardingTour.teacherHome.step2Body":
      "Touchez « Cahier de notes » pour saisir les notes des évaluations en attente.",
    "onboardingTour.teacherHome.step3Title": "Une aide toujours disponible",
    "onboardingTour.teacherHome.step3Body":
      "Touchez ce bouton à tout moment pour revoir cette présentation du tableau de bord.",

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
    "header.home.menuAction": "Menu",
    "header.home.logoutAction": "Se déconnecter",
    "header.home.logoutConfirmTitle": "Se déconnecter ?",
    "header.home.logoutConfirmMessage":
      "Vous serez redirigé vers l'écran de connexion. Vos données locales seront effacées.",
    "header.home.logoutConfirmConfirm": "Se déconnecter",
    "header.home.logoutConfirmCancel": "Annuler",

    // Module Écoles (plateforme)
    "schoolsAdmin.header.title": "Écoles",
    "schoolsAdmin.header.subtitle":
      "Gestion des établissements de la plateforme",
    "schoolsAdmin.tabs.synthese": "Synthèse",
    "schoolsAdmin.tabs.list": "Liste",
    "schoolsAdmin.tabs.help": "Aide",
    "schoolsAdmin.search.placeholder": "Nom, slug, ville, région, pays...",
    "schoolsAdmin.search.accessibilityLabel": "Rechercher une école",
    "schoolsAdmin.filters.toggleAccessibilityLabel": "Filtrer les écoles",
    "schoolsAdmin.filters.cycleLabel": "Cycle",
    "schoolsAdmin.filters.languageLabel": "Système linguistique",
    "schoolsAdmin.filters.allOption": "Tous",
    "schoolsAdmin.filters.apply": "Appliquer",
    "schoolsAdmin.filters.reset": "Réinitialiser",
    "schoolsAdmin.filters.close": "Fermer",
    "classesAdmin.header.title": "Classes",
    "classesAdmin.search.placeholder": "Rechercher une classe...",
    "classesAdmin.search.accessibilityLabel": "Rechercher une classe",
    "classesAdmin.filters.toggleAccessibilityLabel": "Filtrer les classes",
    "classesAdmin.filters.levelLabel": "Niveau",
    "classesAdmin.filters.allOption": "Tous",
    "classesAdmin.filters.apply": "Appliquer",
    "classesAdmin.filters.reset": "Réinitialiser",
    "classesAdmin.filters.close": "Fermer",
    "classesAdmin.loading": "Chargement des classes…",
    "classesAdmin.loadMore": "Charger plus",
    "classesAdmin.levels.none": "Sans niveau",
    "classesAdmin.card.noReferent": "Aucun enseignant référent",
    "classesAdmin.fabCreate": "Créer une classe",
    "classesAdmin.empty.title": "Aucune classe",
    "classesAdmin.empty.message":
      "Créez votre première classe avec le bouton ci-dessous.",
    "classesAdmin.empty.titleSearch": "Aucun résultat",
    "classesAdmin.empty.messageSearch":
      "Aucune classe ne correspond à votre recherche ou vos filtres.",
    "classesAdmin.errors.load": "Impossible de charger les classes.",
    "classesAdmin.form.headerTitle": "Nouvelle classe",
    "classesAdmin.form.heroTitle": "Créer une classe",
    "classesAdmin.form.heroSubtitle":
      "Renseignez les informations de la nouvelle classe.",
    "classesAdmin.form.loadingOptions": "Chargement des options…",
    "classesAdmin.form.nameLabel": "Nom de la classe",
    "classesAdmin.form.namePlaceholder": "ex : 6e A",
    "classesAdmin.form.levelLabel": "Niveau",
    "classesAdmin.form.levelPlaceholder": "Choisir un niveau",
    "classesAdmin.form.trackLabel": "Filière",
    "classesAdmin.form.trackPlaceholder": "Choisir une filière",
    "classesAdmin.form.curriculumLabel": "Curriculum",
    "classesAdmin.form.curriculumPlaceholder": "Choisir un curriculum",
    "classesAdmin.form.referentLabel": "Enseignant référent",
    "classesAdmin.form.referentPlaceholder": "Choisir un enseignant",
    "classesAdmin.form.capacityLabel": "Capacité",
    "classesAdmin.form.capacityPlaceholder": "ex : 30",
    "classesAdmin.form.noneOption": "Aucun",
    "classesAdmin.form.submit": "Créer la classe",
    "classesAdmin.form.successTitle": "Classe créée",
    "classesAdmin.form.successMessage": "La classe a été créée avec succès.",
    "classesAdmin.form.errorTitle": "Erreur",
    "classesAdmin.detail.fabViewStudents": "Voir les élèves",
    "classesAdmin.referent.headerTitle": "Enseignant référent",
    "classesAdmin.referent.heroTitle": "Définir l'enseignant référent",
    "classesAdmin.referent.submit": "Enregistrer",
    "classesAdmin.referent.successTitle": "Enseignant référent défini",
    "classesAdmin.referent.successMessage":
      "L'enseignant référent de la classe a été mis à jour.",
    "classesAdmin.addStudent.headerTitle": "Ajouter un élève",
    "classesAdmin.addStudent.searchPlaceholder":
      "Rechercher un élève par nom...",
    "classesAdmin.addStudent.loading": "Chargement des élèves…",
    "classesAdmin.addStudent.empty.title": "Aucun élève",
    "classesAdmin.addStudent.empty.message":
      "Aucun élève ne correspond à votre recherche.",
    "classesAdmin.addStudent.successTitle": "Élève ajouté",
    "classesAdmin.addStudent.successMessageSuffix":
      "a été ajouté(e) à la classe.",
    "classesAdmin.students.headerTitle": "Élèves",
    "classesAdmin.students.tabLabel": "Élèves",
    "classesAdmin.students.fabAdd": "Ajouter un élève",
    "classesAdmin.students.fabReferent": "Enseignant référent",
    "classesAdmin.students.loading": "Chargement…",
    "classesAdmin.students.studentsSuffix": "élèves",
    "classesAdmin.students.empty.title": "Aucun élève",
    "classesAdmin.students.empty.message":
      "Aucun élève n'est encore inscrit dans cette classe.",
    "schoolsAdmin.access.deniedTitle": "Accès non autorisé",
    "schoolsAdmin.access.deniedMessage":
      "Ce module est réservé aux administrateurs de la plateforme.",
    "schoolsAdmin.help.title": "Mode d'emploi",
    "schoolsAdmin.help.body":
      "Créez une école avec son school admin, modifiez ses informations (cycle, système linguistique) et suivez sa répartition d'utilisateurs depuis sa fiche détaillée.",
    "schoolsAdmin.help.example.title": "Exemple concret, de bout en bout",
    "schoolsAdmin.help.example.intro":
      "Cas d'un lycée francophone secondaire. Chaque étape se fait dans son propre module, dans cet ordre.",
    "schoolsAdmin.help.example.step1.title": "1. Créer l'école",
    "schoolsAdmin.help.example.step1.body":
      "Ici, renseignez nom, slug, puis choisissez le Cycle (Primaire ou Secondaire) et le Système linguistique (Francophone, Anglophone ou Bilingue). Ce choix est le pivot : il détermine automatiquement quels niveaux et curriculums du catalogue national seront visibles pour cette école.",
    "schoolsAdmin.help.example.step2.title": "2. Rien à faire (automatique)",
    "schoolsAdmin.help.example.step2.body":
      'Le catalogue national (Cycle > Niveaux > Filières > Curriculums > Matières) déjà en place et correspondant au cycle et à la langue apparaît automatiquement dans le module Curriculums de l\'école, marqué "national".',
    "schoolsAdmin.help.example.step3.title": "3. Cas standard : rien de plus",
    "schoolsAdmin.help.example.step3.body":
      "Si le catalogue national suffit, passez directement à la création des classes (étape 6) en vous appuyant sur les niveaux, filières et curriculums nationaux.",
    "schoolsAdmin.help.example.step4.title":
      "4. (Optionnel) Filière propre à l'école",
    "schoolsAdmin.help.example.step4.body":
      "Si l'école a besoin d'une filière absente du catalogue national, créez-la dans le module Curriculums, onglet Filières. Une filière n'est rattachée à rien tant qu'elle n'est pas utilisée dans un curriculum.",
    "schoolsAdmin.help.example.step5.title":
      "5. (Optionnel) Curriculum propre à l'école",
    "schoolsAdmin.help.example.step5.body":
      "Si le curriculum national ne convient pas, créez dans Curriculums un curriculum propre combinant un niveau (national ou propre) et, si besoin, une filière. Rattachez ensuite les matières avec coefficient et volume horaire.",
    "schoolsAdmin.help.example.step6.title": "6. Créer une année scolaire",
    "schoolsAdmin.help.example.step6.body":
      "Dans le module Années scolaires, créez l'année en cours pour l'école et définissez-la comme active.",
    "schoolsAdmin.help.example.step7.title": "7. Créer une classe",
    "schoolsAdmin.help.example.step7.body":
      "Dans le module Classes, choisissez l'année scolaire puis le niveau, la filière (si besoin) et le curriculum : nationaux ou propres à l'école, ils sont interchangeables. C'est cette combinaison qui fixe les matières et coefficients des élèves de la classe.",
    "schoolsAdmin.empty.title": "Aucune école",
    "schoolsAdmin.empty.messageDefault":
      "Créez la première école de la plateforme.",
    "schoolsAdmin.empty.messageSearch":
      "Aucune école ne correspond à la recherche.",

    "schoolsAdmin.cycle.PRIMARY": "Primaire",
    "schoolsAdmin.cycle.SECONDARY": "Secondaire",
    "schoolsAdmin.cycle.UNSET": "Non classées",
    "schoolsAdmin.language.FRANCOPHONE": "Francophone",
    "schoolsAdmin.language.ANGLOPHONE": "Anglophone",
    "schoolsAdmin.language.BILINGUAL": "Bilingue",

    "schoolsAdmin.synthese.overviewTitle": "Vue d'ensemble",
    "schoolsAdmin.synthese.totalSchools": "Écoles",
    "schoolsAdmin.synthese.totalStudents": "Élèves",
    "schoolsAdmin.synthese.totalClasses": "Classes",
    "schoolsAdmin.synthese.byCycleTitle": "Répartition par cycle",
    "schoolsAdmin.synthese.schoolsLabel": "écoles",
    "schoolsAdmin.synthese.studentsLabel": "élèves",
    "schoolsAdmin.synthese.classesLabel": "classes",
    "schoolsAdmin.synthese.empty":
      "Aucune donnée à synthétiser tant qu'aucune école n'est créée.",

    "schoolsAdmin.card.usersLabel": "utilisateurs",
    "schoolsAdmin.card.classesLabel": "classes",
    "schoolsAdmin.card.studentsLabel": "élèves",
    "schoolsAdmin.card.academicYearPrefix": "Année en cours",
    "schoolsAdmin.card.noAcademicYear": "Aucune année active",
    "schoolsAdmin.card.view": "Voir",
    "schoolsAdmin.card.edit": "Modifier",
    "schoolsAdmin.card.delete": "Supprimer",

    "schoolsAdmin.fab.create": "Créer une école",

    "schoolsAdmin.form.createHeroTitle": "Nouvelle école",
    "schoolsAdmin.form.createHeroSubtitle":
      "Créez un établissement et son school admin",
    "schoolsAdmin.form.editHeroTitle": "Modifier l'école",
    "schoolsAdmin.form.editHeroSubtitle":
      "Mettez à jour les informations de l'établissement",
    "schoolsAdmin.form.name": "Nom de l'école",
    "schoolsAdmin.form.namePlaceholder": "Ex: Collège Vogt",
    "schoolsAdmin.form.country": "Pays",
    "schoolsAdmin.form.countryPlaceholder": "Cameroun",
    "schoolsAdmin.form.region": "Région",
    "schoolsAdmin.form.regionPlaceholder": "Choisir une région",
    "schoolsAdmin.form.city": "Ville",
    "schoolsAdmin.form.cityPlaceholder": "Choisir une ville",
    "schoolsAdmin.form.cityPlaceholderNoRegion": "Choisir une région d'abord",
    "schoolsAdmin.form.cycle": "Cycle",
    "schoolsAdmin.form.cyclePlaceholder": "Sélectionner un cycle",
    "schoolsAdmin.form.languageSystem": "Système linguistique",
    "schoolsAdmin.form.languageSystemPlaceholder": "Sélectionner un système",
    "schoolsAdmin.form.adminEmail": "Email du school admin",
    "schoolsAdmin.form.adminEmailPlaceholder": "admin@ecole.cm",
    "schoolsAdmin.form.adminPhone": "Téléphone",
    "schoolsAdmin.form.adminPhonePlaceholder": "699001122",
    "schoolsAdmin.form.adminPin": "PIN initial",
    "schoolsAdmin.form.adminModeEmail": "Email",
    "schoolsAdmin.form.adminModePhone": "Téléphone + PIN",
    "schoolsAdmin.form.mainAdminTitle": "Administrateur principal",
    "schoolsAdmin.form.additionalAdminsTitle":
      "Administrateurs supplémentaires",
    "schoolsAdmin.form.additionalAdminTitle": "Administrateur",
    "schoolsAdmin.form.addAdminButton": "+ Ajouter un administrateur",
    "schoolsAdmin.form.activationCodeBanner":
      "Code d'activation à transmettre à l'administrateur",
    "schoolsAdmin.form.submitCreate": "Créer l'école",
    "schoolsAdmin.form.submittingCreate": "Création...",
    "schoolsAdmin.form.submitEdit": "Enregistrer",
    "schoolsAdmin.form.submittingEdit": "Enregistrement...",
    "schoolsAdmin.form.cancel": "Annuler",
    "schoolsAdmin.form.errors.nameRequired":
      "Le nom de l'école est obligatoire.",
    "schoolsAdmin.form.errors.emailInvalid":
      "L'email du school admin est invalide.",
    "schoolsAdmin.form.errors.emailRequired": "L'email est obligatoire.",
    "schoolsAdmin.form.errors.phoneRequired": "Le téléphone est obligatoire.",
    "schoolsAdmin.form.errors.pinInvalid":
      "Le PIN doit contenir exactement 6 chiffres.",
    "schoolsAdmin.toast.additionalAdminsFailedTitle":
      "Certains administrateurs n'ont pas pu être ajoutés",

    "schoolsAdmin.toast.createdTitle": "École créée",
    "schoolsAdmin.toast.createdExisting":
      "L'école a été créée et rattachée au school admin existant.",
    "schoolsAdmin.toast.createdNew":
      "L'école a été créée, un email a été envoyé au school admin.",
    "schoolsAdmin.toast.createFailedTitle": "Création impossible",
    "schoolsAdmin.toast.updatedTitle": "École modifiée",
    "schoolsAdmin.toast.updatedMessage": "Les changements ont été enregistrés.",
    "schoolsAdmin.toast.updateFailedTitle": "Modification impossible",
    "schoolsAdmin.toast.deletedTitle": "École supprimée",
    "schoolsAdmin.toast.deletedMessage":
      "L'école a été retirée de la plateforme.",
    "schoolsAdmin.toast.deleteFailedTitle": "Suppression impossible",

    "schoolsAdmin.confirmDelete.title": "Supprimer l'école",
    "schoolsAdmin.confirmDelete.confirm": "Supprimer",
    "schoolsAdmin.confirmDelete.cancel": "Annuler",

    "schoolsAdmin.detail.headerSubtitlePrefix": "École",
    "schoolsAdmin.detail.loading": "Chargement de l'école...",
    "schoolsAdmin.detail.notFoundTitle": "École introuvable",
    "schoolsAdmin.detail.notFoundMessage":
      "Cette école n'existe plus ou a été supprimée.",
    "schoolsAdmin.detail.sections.identity": "Informations générales",
    "schoolsAdmin.detail.sections.schoolSystem": "Système scolaire",
    "schoolsAdmin.detail.schoolSystemEmpty":
      "Aucune filière ni curriculum configuré pour cette école.",
    "schoolsAdmin.detail.schoolSystemTracksTitle": "Filières",
    "schoolsAdmin.detail.schoolSystemNoTracks": "Aucune filière",
    "schoolsAdmin.detail.schoolSystemCurriculumsTitle": "Curriculums",
    "schoolsAdmin.detail.schoolSystemNoCurriculums": "Aucun curriculum",
    "schoolsAdmin.detail.schoolSystemViewFull": "Voir le catalogue complet",
    "schoolsAdmin.detail.sections.users": "Utilisateurs (année en cours)",
    "schoolsAdmin.detail.sections.admins": "Administrateurs de l'école",
    "schoolsAdmin.detail.sections.stats": "Statistiques globales",
    "schoolsAdmin.detail.location": "Localisation",
    "schoolsAdmin.detail.cycle": "Cycle",
    "schoolsAdmin.detail.language": "Système linguistique",
    "schoolsAdmin.detail.noLocation": "Non renseignée",
    "schoolsAdmin.detail.noCycle": "Non renseigné",
    "schoolsAdmin.detail.noLanguage": "Non renseigné",
    "schoolsAdmin.detail.roleStaff": "Staff",
    "schoolsAdmin.detail.roleTeachers": "Enseignants",
    "schoolsAdmin.detail.roleParents": "Parents",
    "schoolsAdmin.detail.roleStudents": "Élèves",
    "schoolsAdmin.detail.statsUsersTotal": "Utilisateurs (total)",
    "schoolsAdmin.detail.statsClasses": "Classes",
    "schoolsAdmin.detail.statsStudentsTotal": "Élèves (total)",
    "schoolsAdmin.detail.statsGrades": "Notes saisies",
    "schoolsAdmin.detail.adminEmpty": "Aucun school admin rattaché.",
    "schoolsAdmin.detail.addAdminTitle": "Ajouter un school admin",
    "schoolsAdmin.detail.addAdminSubmit": "Ajouter",
    "schoolsAdmin.detail.addAdminSubmitting": "Ajout...",
    "schoolsAdmin.detail.addAdminSuccessTitle": "School admin ajouté",
    "schoolsAdmin.detail.addAdminSuccessMessage":
      "Le school admin a été rattaché à l'école.",
    "schoolsAdmin.detail.addAdminFailedTitle": "Ajout impossible",
    "schoolsAdmin.detail.resendInvite": "Renvoyer l'invitation",
    "schoolsAdmin.detail.resendInviteSuccessTitle": "Invitation renvoyée",
    "schoolsAdmin.detail.resendInviteSuccessMessage":
      "Un nouvel email a été envoyé au school admin.",
    "schoolsAdmin.detail.resendInviteFailedTitle": "Envoi impossible",
    "schoolsAdmin.detail.pendingBadge": "En attente",
    "schoolsAdmin.detail.activeBadge": "Actif",
    "schoolsAdmin.detail.removeAdmin": "Retirer",
    "schoolsAdmin.detail.removeAdminLastAdminHint":
      "Impossible de retirer le dernier administrateur.",
    "schoolsAdmin.detail.confirmRemoveAdminTitle": "Retirer l'administrateur",
    "schoolsAdmin.detail.confirmRemoveAdminMessage":
      "Cette personne perdra son accès d'administrateur à cette école.",
    "schoolsAdmin.detail.confirmRemoveAdminConfirm": "Retirer",
    "schoolsAdmin.detail.confirmRemoveAdminCancel": "Annuler",
    "schoolsAdmin.detail.removeAdminSuccessTitle": "Administrateur retiré",
    "schoolsAdmin.detail.removeAdminSuccessMessage":
      "L'administrateur a été retiré de l'école.",
    "schoolsAdmin.detail.removeAdminFailedTitle": "Suppression impossible",
    "schoolsAdmin.detail.activationCodeBanner":
      "Code d'activation à transmettre à l'administrateur",

    "users.header.title": "Utilisateurs",
    "users.search.placeholder": "Nom, prénom, email, téléphone…",
    "users.search.accessibilityLabel": "Rechercher un utilisateur",
    "users.filters.toggleAccessibilityLabel": "Filtrer les utilisateurs",
    "users.filters.roleLabel": "Rôle",
    "users.filters.accountLabel": "Compte",
    "users.filters.yearLabel": "Année scolaire",
    "users.filters.allYears": "Toutes les années",
    "users.filters.yearHint":
      "Disponible uniquement pour les rôles Élève et Enseignant.",
    "users.filters.close": "Fermer",
    "users.filters.reset": "Réinitialiser",
    "users.filters.apply": "Appliquer",
    "users.role.ALL": "Tous",
    "users.role.TEACHER": "Enseignants",
    "users.role.PARENT": "Parents",
    "users.role.STUDENT": "Élèves",
    "users.role.SCHOOL_ADMIN": "Admins",
    "users.role.SCHOOL_MANAGER": "Directeurs",
    "users.role.SUPERVISOR": "Superviseurs",
    "users.role.SCHOOL_ACCOUNTANT": "Comptables",
    "users.role.SCHOOL_STAFF": "Personnel",
    "users.role.SCHOOL_HEALTH_OFFICER": "Responsables santé",
    "users.role.short.TEACHER": "ENS",
    "users.role.short.PARENT": "PAR",
    "users.role.short.STUDENT": "ELE",
    "users.role.short.SCHOOL_ADMIN": "ADM",
    "users.role.short.SCHOOL_MANAGER": "DIR",
    "users.role.short.SUPERVISOR": "SUP",
    "users.role.short.SCHOOL_ACCOUNTANT": "CPT",
    "users.role.short.SCHOOL_STAFF": "PER",
    "users.role.short.SCHOOL_HEALTH_OFFICER": "SAN",
    "users.account.ALL": "Tous",
    "users.account.WITH_ACCOUNT": "Avec compte",
    "users.account.WITHOUT_ACCOUNT": "Sans compte",
    "users.loading": "Chargement des utilisateurs…",
    "users.endOfList": "Tous les utilisateurs ont été chargés",
    "users.totalCount.singular": "{count} utilisateur",
    "users.totalCount.plural": "{count} utilisateurs",
    "users.empty.title": "Aucun utilisateur",
    "users.empty.message": "Aucun utilisateur enregistré dans l'établissement.",
    "users.empty.titleSearch": "Aucun résultat",
    "users.empty.messageSearch": "Modifiez vos critères de recherche.",
    "users.errors.loadFailed": "Impossible de charger les utilisateurs.",
    "users.create.fabAccessibilityLabel": "Créer un utilisateur",
    "users.create.chooseType.title": "Nouvel utilisateur",
    "users.create.chooseType.subtitle": "Choisissez le type de compte à créer.",
    "users.create.hero.TEACHER.title": "Créer un enseignant",
    "users.create.hero.TEACHER.subtitle":
      "Téléphone + PIN ou email + mot de passe initial.",
    "users.create.hero.STUDENT.title": "Créer un élève",
    "users.create.hero.STUDENT.subtitle":
      "Identité et classe obligatoires ; l'accès au compte est optionnel.",
    "users.create.hero.PARENT.title": "Créer un parent",
    "users.create.hero.PARENT.subtitle":
      "Rattachez le parent à un élève, puis renseignez son contact.",
    "users.create.hero.SCHOOL_MANAGER.title": "Créer un responsable",
    "users.create.hero.SCHOOL_MANAGER.subtitle":
      "Téléphone + PIN ou email + mot de passe initial.",
    "users.create.hero.SUPERVISOR.title": "Créer un surveillant",
    "users.create.hero.SUPERVISOR.subtitle":
      "Téléphone + PIN ou email + mot de passe initial.",
    "users.create.hero.SCHOOL_ACCOUNTANT.title": "Créer un comptable",
    "users.create.hero.SCHOOL_ACCOUNTANT.subtitle":
      "Téléphone + PIN ou email + mot de passe initial.",
    "users.create.hero.SCHOOL_STAFF.title": "Créer un membre du personnel",
    "users.create.hero.SCHOOL_STAFF.subtitle":
      "Téléphone + PIN ou email + mot de passe initial.",
    "users.create.hero.SCHOOL_HEALTH_OFFICER.title":
      "Créer un responsable santé",
    "users.create.hero.SCHOOL_HEALTH_OFFICER.subtitle":
      "Téléphone + PIN ou email + mot de passe initial.",
    "users.create.contactMode.label": "Mode de création",
    "users.create.contactMode.phone": "Téléphone + PIN",
    "users.create.contactMode.email": "Email + mot de passe",
    "users.create.field.phone.label": "Téléphone",
    "users.create.field.phone.placeholder": "699001122",
    "users.create.field.pin.label": "PIN initial",
    "users.create.field.pin.placeholder": "123456",
    "users.create.field.email.label": "Email",
    "users.create.field.email.placeholder": "nom@ecole.cm",
    "users.create.field.password.label": "Mot de passe initial",
    "users.create.field.password.placeholder": "MotDePasse123",
    "users.create.field.firstName.label": "Prénom",
    "users.create.field.firstName.placeholder": "Prénom de l'élève",
    "users.create.field.lastName.label": "Nom",
    "users.create.field.lastName.placeholder": "Nom de l'élève",
    "users.create.field.level.label": "Niveau",
    "users.create.field.level.placeholder": "Choisir un niveau",
    "users.create.field.class.label": "Classe",
    "users.create.field.class.placeholder": "Choisir une classe",
    "users.create.field.dateOfBirth.label": "Date de naissance",
    "users.create.field.dateOfBirth.placeholder": "Sélectionner une date",
    "users.create.field.access.sectionTitle": "Accès",
    "users.create.field.access.hint":
      'L\'élève est créé sans compte. Le compte (identifiant et mot de passe) se crée ensuite via "Créer un accès" sur sa fiche.',
    "users.create.field.student.label": "Élève à rattacher",
    "users.create.field.student.placeholder": "Rechercher un élève…",
    "users.create.field.student.noResults": "Aucun élève trouvé.",
    "users.create.field.function.label": "Fonction (optionnel)",
    "users.create.field.function.placeholder": "Choisir une fonction",
    "users.create.field.function.newPlaceholder":
      "Nouvelle fonction (ex. Bibliothécaire)",
    "users.create.field.function.add": "Ajouter",
    "users.create.field.function.createError":
      "Impossible de créer cette fonction. Réessayez.",
    "users.create.submit.TEACHER": "Créer l'enseignant",
    "users.create.submit.STUDENT": "Créer l'élève",
    "users.create.submit.PARENT": "Créer le parent",
    "users.create.submit.SCHOOL_MANAGER": "Créer le responsable",
    "users.create.submit.SUPERVISOR": "Créer le surveillant",
    "users.create.submit.SCHOOL_ACCOUNTANT": "Créer le comptable",
    "users.create.submit.SCHOOL_STAFF": "Créer le membre du personnel",
    "users.create.submit.SCHOOL_HEALTH_OFFICER": "Créer le responsable santé",
    "users.create.success.title": "Utilisateur créé",
    "users.create.success.message": "Le compte a été créé avec succès.",
    "users.create.errors.title": "Création impossible",
    "users.assignParent.mode.existing": "Parent existant",
    "users.assignParent.mode.new": "Nouveau parent",
    "users.assignParent.new.submit": "Créer et associer le parent",
    "users.detail.forms.editRoles.title": "Modifier les rôles",
    "users.detail.forms.editRoles.subtitle":
      "Cochez les rôles à attribuer à cet utilisateur.",
    "users.detail.forms.editRoles.submit": "Enregistrer les rôles",
    "users.detail.forms.assignTeacher.title": "Nouvelle affectation",
    "users.detail.forms.assignTeacher.subtitle":
      "Associez cet enseignant à une classe et une matière.",
    "users.detail.forms.assignTeacher.submit": "Créer l'affectation",
    "users.detail.forms.assignTeacher.schoolYear.label": "Année scolaire",
    "users.detail.forms.assignTeacher.schoolYear.placeholder":
      "Choisir une année",
    "users.detail.forms.assignTeacher.class.label": "Classe",
    "users.detail.forms.assignTeacher.class.placeholder": "Choisir une classe",
    "users.detail.forms.assignTeacher.subject.label": "Matière",
    "users.detail.forms.assignTeacher.subject.placeholder":
      "Choisir une matière",
    "users.detail.forms.assignChild.title": "Affecter un enfant",
    "users.detail.forms.assignChild.subtitle":
      "Recherchez l'élève à rattacher à ce parent.",
    "users.detail.forms.assignChild.submit": "Affecter l'enfant",
    "users.detail.forms.assignChild.searchPlaceholder":
      "Nom ou prénom de l'élève...",
    "users.detail.forms.assignChild.empty": "Aucun élève trouvé.",
    "users.detail.forms.assignParent.title": "Associer un parent",
    "users.detail.forms.assignParent.subtitle":
      "Recherchez un parent existant ou créez-en un nouveau.",
    "users.detail.forms.assignParent.submit": "Associer le parent",
    "users.detail.forms.assignParent.searchPlaceholder":
      "Nom ou prénom du parent...",
    "users.detail.forms.assignParent.empty": "Aucun parent trouvé.",
    "users.detail.forms.createAccess.title": "Créer un accès élève",
    "users.detail.forms.createAccess.subtitle":
      "Génère un identifiant et un mot de passe temporaire.",
    "users.detail.forms.createAccess.submit": "Créer l'accès",
    "users.detail.forms.createAccess.usernameLabel": "Identifiant",
    "users.detail.forms.createAccess.usernamePlaceholder": "ex: JeanDUPONT",
    "users.detail.forms.createAccess.info":
      "Un mot de passe temporaire sera généré automatiquement. L'élève devra le changer à la première connexion.",
    "users.detail.forms.createAccess.suggestionLoading":
      "Génération de l'identifiant unique…",
    "users.detail.forms.createAccess.suggestionError":
      "Suggestion automatique indisponible. Vérifie l'identifiant avant de créer l'accès.",
    "users.detail.forms.createAccess.errorMin":
      "L'identifiant doit faire au moins 3 caractères.",
    "users.detail.forms.createAccess.errorAlnum":
      "Lettres et chiffres uniquement.",
    "users.detail.forms.createAccess.errorTaken":
      "Cet identifiant est déjà utilisé. Choisis-en un autre.",
    "rooms.search.placeholder": "Rechercher une salle",
    "rooms.search.accessibilityLabel": "Rechercher une salle",
    "rooms.filters.toggleAccessibilityLabel": "Filtres des salles",
    "rooms.filters.allOption": "Tous",
    "rooms.filters.statusLabel": "Statut",
    "rooms.filters.status.AVAILABLE": "Disponible",
    "rooms.filters.status.UNAVAILABLE": "Indisponible",
    "rooms.filters.status.MAINTENANCE": "Maintenance",
    "rooms.filters.simultaneityLabel": "Simultanéité",
    "rooms.filters.simultaneity.SINGLE": "Simple (1 créneau)",
    "rooms.filters.simultaneity.MULTIPLE": "Multiple (>1 créneau)",
    "rooms.filters.availabilityLabel": "Disponibilité",
    "rooms.filters.availabilityFromDate": "Du",
    "rooms.filters.availabilityToDate": "Au",
    "rooms.filters.availabilityStartTime": "De",
    "rooms.filters.availabilityEndTime": "À",
    "rooms.filters.reset": "Réinitialiser",
    "rooms.filters.close": "Fermer",
    "rooms.filters.apply": "Appliquer",
    "rooms.empty.title": "Aucune salle",
    "rooms.empty.messageDefault":
      "Ajoutez une première salle depuis le bouton flottant.",
    "rooms.empty.messageSearch":
      "Ajustez votre recherche ou vos filtres pour retrouver une salle.",
    "rooms.detail.headerTitle": "Détail de la salle",
    "rooms.detail.infoTitle": "Informations",
    "rooms.detail.capacityLabel": "Capacité",
    "rooms.detail.maxConcurrentSlotsLabel": "Créneaux simultanés max.",
    "rooms.detail.statusLabel": "Statut",
    "rooms.detail.descriptionLabel": "Description",
    "rooms.detail.noDescription": "Aucune description",
    "rooms.detail.agendaTitle": "Agenda d'occupation",
    "rooms.detail.viewWeek": "Semaine",
    "rooms.detail.viewMonth": "Mois",
    "rooms.detail.loading": "Chargement de la salle...",
    "rooms.detail.errorLoad": "Impossible de charger cette salle.",
    "rooms.detail.notFound": "Salle introuvable.",

    "health.title": "Santé",
    "health.parent.help.menuLabel": "Aide",
    "health.parent.help.title": "Santé",
    "health.parent.help.close": "Fermer",
    "health.parent.help.section1Title": "Conditions",
    "health.parent.help.section1Body":
      "L'onglet Conditions regroupe les allergies, pathologies et consignes durables de votre enfant, avec un niveau d'alerte (info, attention, urgence) visible d'un coup d'œil.",
    "health.parent.help.section2Title": "Historique",
    "health.parent.help.section2Body":
      "L'onglet Historique fusionne les soins reçus à l'école et les événements que vous signalez vous-même, triés du plus récent au plus ancien.",
    "health.parent.help.section3Title": "Signaler un événement",
    "health.parent.help.section3Body":
      "Le bouton + en bas de l'écran ajoute une condition de santé depuis l'onglet Conditions, ou signale un événement (maladie, accident...) depuis l'onglet Historique. L'enseignant référent est automatiquement informé pour un signalement.",
    "health.parent.tabs.conditions": "Conditions",
    "health.parent.tabs.history": "Historique",
    "health.parent.loading": "Chargement…",
    "health.parent.search.placeholderConditions": "Rechercher une condition…",
    "health.parent.search.placeholderHistory": "Rechercher dans l'historique…",
    "health.parent.search.accessibilityLabel": "Rechercher",
    "health.parent.filters.toggleAccessibilityLabel": "Filtres",
    "health.parent.filters.reset": "Réinitialiser",
    "health.parent.filters.close": "Fermer",
    "health.parent.filters.apply": "Appliquer",
    "health.parent.filters.typeLabel": "Type",
    "health.parent.filters.allTypes": "Tous",
    "health.parent.filters.alertLevelLabel": "Niveau d'alerte",
    "health.parent.filters.allLevels": "Tous",
    "health.parent.filters.statusLabel": "Statut",
    "health.parent.filters.status.all": "Tous",
    "health.parent.filters.status.active": "Actives",
    "health.parent.filters.status.inactive": "Résolues",
    "health.parent.filters.originLabel": "Origine",
    "health.parent.filters.allOrigins": "Toutes",
    "health.parent.filters.originSchool": "École",
    "health.parent.filters.originParent": "Vous",
    "health.parent.filters.reportTypeLabel": "Type de signalement",
    "health.parent.filters.allReportTypes": "Tous",
    "health.parent.empty.conditionsTitle": "Aucune condition de santé",
    "health.parent.empty.conditionsSearch":
      "Aucune condition ne correspond à votre recherche.",
    "health.parent.empty.historyTitle": "Aucun événement",
    "health.parent.empty.historySearch":
      "Aucun événement ne correspond à votre recherche.",
    "health.parent.fab.addCondition": "Ajouter une condition",
    "health.parent.fab.addReport": "Signaler un événement",
    "health.parent.form.cancel": "Annuler",
    "health.parent.form.active": "Condition toujours active",
    "health.parent.form.successTitle": "Enregistré",
    "health.parent.form.errorTitle": "Erreur",
    "health.parent.form.createConditionSuccess":
      "La condition de santé a été ajoutée.",
    "health.parent.form.editConditionSuccess":
      "La condition de santé a été mise à jour.",
    "health.parent.form.createReportSuccess":
      "L'événement a été signalé à l'école.",
    "health.parent.form.hero.createConditionTitle": "Ajouter une condition",
    "health.parent.form.hero.createConditionSubtitle":
      "Allergie, pathologie, traitement ou consigne particulière.",
    "health.parent.form.hero.editConditionTitle": "Modifier la condition",
    "health.parent.form.hero.editConditionSubtitle":
      "Mettez à jour les informations ou marquez-la comme résolue.",
    "health.parent.form.hero.createReportTitle": "Signaler un événement",
    "health.parent.form.hero.createReportSubtitle":
      "Maladie, accident, traitement... l'enseignant référent est automatiquement informé.",
    "health.parent.detail.editAction": "Modifier",
    "health.parent.detail.statusLabel": "Statut",
    "health.parent.detail.visibleToTeachers":
      "Visible par l'équipe pédagogique",
    "health.parent.detail.careBy": "Pris en charge par",
    "health.parent.detail.reportedBy": "Signalé par",
    "health.parent.detail.followUpNeeded": "Suivi nécessaire",
    "health.parent.detail.origin.school": "École",
    "health.parent.detail.origin.parent": "Vous",
    "health.parent.detail.yes": "Oui",
    "health.parent.detail.no": "Non",
    "health.parent.card.active": "Active",
    "health.parent.card.inactive": "Résolue",
    "health.tabs.conditions": "Informations importantes",
    "health.tabs.care": "Soins à l'école",
    "health.tabs.reports": "Événements hors école",
    "health.tabs.history": "Historique",
    "health.conditions.empty": "Aucune information de santé enregistrée.",
    "health.care.empty": "Aucun soin enregistré à l'école.",
    "health.reports.empty": "Aucun événement signalé.",
    "health.reports.acknowledged": "Pris en compte par l'école",
    "health.reports.pending": "En attente de lecture par l'école",
    "health.reports.acknowledgeAction": "Marquer comme pris en compte",
    "health.history.empty": "Aucun élément dans l'historique.",
    "health.form.conditionType": "Type",
    "health.form.alertLevel": "Niveau",
    "health.form.label": "Intitulé",
    "health.form.labelPlaceholder": "Ex : Allergie aux arachides",
    "health.form.description": "Description",
    "health.form.descriptionPlaceholder": "Décrivez la situation",
    "health.form.submitCondition": "Ajouter cette information",
    "health.form.reportType": "Type d'événement",
    "health.form.submitReport": "Signaler cet événement",
    "health.form.sportRestriction": "Restriction sportive associée",
    "health.form.careSummaryPlaceholder": "Ex : Chute dans la cour",
    "health.form.submitCareEvent": "Enregistrer ce soin",
    "health.validation.labelRequired": "L'intitulé est requis.",
    "health.validation.descriptionRequired": "La description est requise.",
    "health.errors.load": "Impossible de charger les informations de santé.",
    "health.errors.createFailed": "Impossible d'enregistrer cette information.",
    "health.alertLevel.INFO": "Information",
    "health.alertLevel.ATTENTION": "Attention",
    "health.alertLevel.URGENT": "Urgent",
    "health.conditionType.ALLERGY": "Allergie",
    "health.conditionType.PATHOLOGY": "Pathologie",
    "health.conditionType.TREATMENT": "Traitement",
    "health.conditionType.INSTRUCTION": "Instruction particulière",
    "health.conditionType.OTHER": "Autre",
    "health.reportType.MALADIE": "Maladie",
    "health.reportType.TRAITEMENT": "Traitement",
    "health.reportType.ACCIDENT": "Accident",
    "health.reportType.CONSULTATION": "Consultation médicale",
    "health.reportType.HOSPITALISATION": "Hospitalisation",
    "health.reportType.VACCINATION": "Vaccination",
    "health.reportType.RESTRICTION_SPORT": "Restriction sportive",
    "health.reportType.AUTRE": "Autre",
    "health.school.searchPlaceholder": "Rechercher un élève…",
    "health.school.noStudent": "Aucun élève trouvé.",
    "health.school.urgencyTitle": "Informations critiques",
    "health.school.contacts": "Contacts",
    "health.admin.tabs.synthese": "Synthèse",
    "health.admin.tabs.cares": "Cares",
    "health.admin.tabs.eleves": "Élèves",
    "health.admin.scope.school": "École entière",
    "health.admin.scope.classLabel": "Classe",
    "health.admin.scope.allClasses": "Toute l'école",
    "health.admin.stats.activeConditions": "Conditions actives",
    "health.admin.stats.studentsWithConditions": "Élèves concernés",
    "health.admin.stats.careEvents7d": "Soins (7 derniers jours)",
    "health.admin.stats.careEvents30d": "Soins (30 derniers jours)",
    "health.admin.stats.reportsPending": "Signalements en attente",
    "health.admin.stats.byAlertLevel": "Répartition par niveau d'alerte",
    "health.admin.stats.loading": "Chargement des statistiques…",
    "health.admin.stats.error": "Impossible de charger les statistiques.",
    "health.admin.cares.search.placeholder": "Rechercher un élève…",
    "health.admin.cares.search.accessibilityLabel": "Rechercher",
    "health.admin.cares.filters.toggleAccessibilityLabel": "Filtres",
    "health.admin.cares.filters.reset": "Réinitialiser",
    "health.admin.cares.filters.close": "Fermer",
    "health.admin.cares.filters.apply": "Appliquer",
    "health.admin.cares.filters.alertLevelLabel": "Niveau d'alerte",
    "health.admin.cares.filters.allLevels": "Tous",
    "health.admin.cares.filters.reportTypeLabel": "Type de signalement",
    "health.admin.cares.filters.allReportTypes": "Tous",
    "health.admin.cares.filters.statusLabel": "Statut",
    "health.admin.cares.filters.statusAll": "Tous",
    "health.admin.cares.filters.statusAcknowledged": "Acquittés",
    "health.admin.cares.filters.statusPending": "En attente",
    "health.admin.cares.empty.title": "Aucun signalement",
    "health.admin.cares.empty.default": "Aucun signalement pour le moment.",
    "health.admin.cares.empty.search":
      "Aucun signalement ne correspond à votre recherche.",
    "health.admin.cares.card.pending": "En attente",
    "health.admin.cares.card.acknowledged": "Acquitté",
    "health.admin.eleves.search.placeholder": "Rechercher un élève…",
    "health.admin.eleves.search.accessibilityLabel": "Rechercher",
    "health.admin.eleves.filters.toggleAccessibilityLabel": "Filtres",
    "health.admin.eleves.filters.reset": "Réinitialiser",
    "health.admin.eleves.filters.close": "Fermer",
    "health.admin.eleves.filters.apply": "Appliquer",
    "health.admin.eleves.filters.classLabel": "Classe",
    "health.admin.eleves.filters.allClasses": "Toutes",
    "health.admin.eleves.empty.title": "Aucun élève",
    "health.admin.eleves.empty.default": "Aucun élève pour le moment.",
    "health.admin.eleves.empty.search":
      "Aucun élève ne correspond à votre recherche.",
    "health.admin.eleves.card.ageUnit": "ans",
    "health.admin.eleves.card.noClass": "Sans classe",
    "health.admin.profile.tabs.cares": "Cares",
    "health.admin.profile.tabs.conditions": "Conditions",
    "health.admin.profile.hero.noClass": "Sans classe",
    "health.admin.profile.hero.ageUnknown": "Âge inconnu",
    "health.admin.profile.fab.addCare": "Ajouter un soin",
    "health.admin.profile.form.hero.createTitle": "Ajouter un soin",
    "health.admin.profile.form.hero.createSubtitle":
      "Enregistrez un soin prodigué à l'élève.",
    "health.admin.profile.form.hero.editTitle": "Modifier le soin",
    "health.admin.profile.form.hero.editSubtitle":
      "Mettez à jour les informations de ce soin.",
    "health.admin.profile.form.submitEdit": "Enregistrer les modifications",
    "health.admin.profile.toasts.careCreatedTitle": "Soin enregistré",
    "health.admin.profile.toasts.careCreatedMessage":
      "Le soin a été ajouté avec succès.",
    "health.admin.profile.toasts.careUpdatedTitle": "Soin modifié",
    "health.admin.profile.toasts.careUpdatedMessage":
      "Le soin a été mis à jour avec succès.",
    "health.admin.profile.errors.load": "Impossible de charger la fiche santé.",
    "health.admin.profile.errors.saveGeneric":
      "Impossible d'enregistrer ce soin.",
    "health.admin.profile.empty.caresTitle": "Aucun soin",
    "health.admin.profile.empty.cares": "Aucun soin enregistré.",
    "health.admin.profile.empty.conditionsTitle": "Aucune condition",
    "health.admin.profile.empty.conditions":
      "Aucune condition de santé enregistrée.",
    "health.admin.profile.editAction": "Modifier",
    "health.admin.profile.byPrefix": "par",
    "onboardingTour.healthParent.tabsTitle": "2 onglets pour s'y retrouver",
    "onboardingTour.healthParent.tabsBody":
      "Conditions regroupe les allergies, pathologies et consignes durables. Historique regroupe les soins reçus à l'école et les événements que vous signalez, triés par date.",
    "onboardingTour.healthParent.searchTitle": "Recherche et filtres",
    "onboardingTour.healthParent.searchBody":
      "Recherchez par mot-clé et affinez avec les filtres (type, niveau d'alerte...) sur chaque onglet.",
    "onboardingTour.healthParent.fabTitle": "Ajouter une information",
    "onboardingTour.healthParent.fabBody":
      "Le bouton + ajoute une condition de santé (onglet Conditions) ou signale un événement hors école (onglet Historique). L'enseignant référent est automatiquement informé pour un signalement.",
    "onboardingTour.healthParent.helpToggleTitle":
      "Une aide toujours disponible",
    "onboardingTour.healthParent.helpToggleBody":
      "Touchez ce bouton, puis « Aide » dans le menu, pour retrouver à tout moment le fonctionnement de cet écran.",
    "onboardingTour.healthSchool.tabsTitle": "3 onglets pour s'y retrouver",
    "onboardingTour.healthSchool.tabsBody":
      "Synthèse regroupe les statistiques de l'école ou d'une classe. Cares liste les signalements des parents, du plus récent au plus ancien. Élèves permet de retrouver la fiche santé de chaque élève.",
    "onboardingTour.healthSchool.searchTitle": "Recherche et filtres",
    "onboardingTour.healthSchool.searchBody":
      "Recherchez un élève et affinez les résultats avec les filtres (niveau d'alerte, type, classe…).",
    "onboardingTour.healthSchool.studentFabTitle": "Fiche élève",
    "onboardingTour.healthSchool.studentFabBody":
      "Ouvrez la fiche d'un élève pour voir ses soins et conditions de santé, et utilisez le bouton + pour enregistrer un nouveau soin.",
  },
  en: {
    "common.loading": "Loading...",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.delete": "Delete",
    "common.select": "Select",

    "financeAdmin.lockedTitle": "Module reserved for administrative staff",
    "financeAdmin.lockedMessage":
      "This mobile module is available for admin, manager or accountant accounts.",
    "financeAdmin.settings.title": "Re-enrollment threshold",
    "financeAdmin.settings.description":
      "Determines how much a promoted student's family must pay to be considered re-enrolled.",
    "financeAdmin.settings.firstInstallment": "First installment paid",
    "financeAdmin.settings.fullPayment": "Full schedule paid",
    "financeAdmin.settings.success": "Re-enrollment policy updated.",
    "financeAdmin.settings.errors.save":
      "Could not update the re-enrollment policy.",
    "financeAdmin.schedules.title": "Fee schedules",
    "financeAdmin.schedules.empty": "No fee schedule defined yet.",
    "financeAdmin.schedules.success.saved": "Fee schedule saved.",
    "financeAdmin.schedules.success.deleted": "Fee schedule deleted.",
    "financeAdmin.schedules.errors.save": "Unable to save.",
    "financeAdmin.schedules.errors.delete": "Unable to delete.",
    "financeAdmin.schedules.form.title": "New fee schedule / update",
    "financeAdmin.schedules.form.subtitle":
      "Schedule by level, track and school year",
    "financeAdmin.schedules.form.schoolYear": "School year",
    "financeAdmin.schedules.form.academicLevel": "Level",
    "financeAdmin.schedules.form.track": "Track",
    "financeAdmin.schedules.form.trackNone": "No track",
    "financeAdmin.schedules.form.installments": "Installments",
    "financeAdmin.schedules.form.label": "Label",
    "financeAdmin.schedules.form.amount": "Amount",
    "financeAdmin.schedules.form.addInstallment": "Add installment",
    "financeAdmin.schedules.deleteConfirm.title": "Delete fee schedule",

    "supplyListsAdmin.title": "School supplies",
    "supplyListsAdmin.lockedTitle": "Module reserved for admin staff",
    "supplyListsAdmin.lockedMessage":
      "This mobile module is available for admin, manager or supervisor accounts.",
    "supplyListsAdmin.empty": "No supply list defined yet.",
    "supplyListsAdmin.success.saved": "Supply list saved.",
    "supplyListsAdmin.success.deleted": "Supply list deleted.",
    "supplyListsAdmin.errors.save": "Unable to save.",
    "supplyListsAdmin.errors.delete": "Unable to delete.",
    "supplyListsAdmin.form.title": "New supply list / update",
    "supplyListsAdmin.form.subtitle":
      "Supplies by level, track and school year",
    "supplyListsAdmin.form.schoolYear": "School year",
    "supplyListsAdmin.form.academicLevel": "Level",
    "supplyListsAdmin.form.track": "Track",
    "supplyListsAdmin.form.trackNone": "No track",
    "supplyListsAdmin.form.items": "Items",
    "supplyListsAdmin.form.label": "Label",
    "supplyListsAdmin.form.quantity": "Quantity",
    "supplyListsAdmin.form.addItem": "Add an item",
    "supplyListsAdmin.deleteConfirm.title": "Delete supply list",
    "supplyListsAdmin.help.menuLabel": "Help",
    "supplyListsAdmin.help.title": "Help — School supplies",
    "supplyListsAdmin.help.close": "Close",
    "supplyListsAdmin.help.section1Title": "What this screen is for",
    "supplyListsAdmin.help.section1Body":
      "Define, for each school level (and optionally each track) of a given year, the list of supplies parents need to prepare for the new school year. This list is then visible to parents in the Supplies tab of the Re-enrollment screen, scoped to the level their child is about to enter.",
    "supplyListsAdmin.help.section2Title": "Create or edit a list",
    "supplyListsAdmin.help.section2Body":
      "Tap the + button to create a new list, or the pencil icon on an existing list to edit it. Choose the school year, level, optionally a track, then add each item with its display rank, label and quantity. A new school year automatically carries forward the previous year's lists — you only need to adjust them if needed rather than re-entering everything.",

    "financeAdmin.payments.title": "Payments",
    "financeAdmin.payments.search.placeholder": "First or last name",
    "financeAdmin.payments.search.button": "Search",
    "financeAdmin.payments.errors.search": "Unable to search.",
    "financeAdmin.payments.errors.summary":
      "Unable to load this student's financial status.",
    "financeAdmin.payments.errors.save": "Unable to save the payment.",
    "financeAdmin.payments.success.paid": "Payment recorded.",
    "financeAdmin.payments.success.paidAndReinscribed":
      "Payment recorded: the student's re-enrollment is confirmed.",
    "financeAdmin.payments.targetYear": "School year (re-enrollment)",
    "financeAdmin.payments.summary.totalPaid": "Total already paid",
    "financeAdmin.payments.summary.threshold":
      "Re-enrollment threshold (per school policy)",
    "financeAdmin.payments.summary.eligible":
      "Threshold reached: student re-enrolled.",
    "financeAdmin.payments.summary.notEligible":
      "Threshold not reached: re-enrollment is not confirmed yet.",
    "financeAdmin.payments.form.amount": "Amount paid",
    "financeAdmin.payments.form.submit": "Record payment",

    "promotionsAdmin.title": "Grade promotion",
    "promotionsAdmin.tab.decisions": "Decisions",
    "promotionsAdmin.tab.waiting": "Waiting",
    "promotionsAdmin.tab.years": "Years",
    "promotionsAdmin.decisions.selectClass": "Class (current year)",
    "promotionsAdmin.decisions.empty":
      "No last-term report card for this class.",
    "promotionsAdmin.decisions.nextLevel": "Target level",
    "promotionsAdmin.decisions.nextTrack": "Target track",
    "promotionsAdmin.decisions.trackNone": "No track",
    "promotionsAdmin.decision.PROMOTED": "Promoted",
    "promotionsAdmin.decision.REPEATED": "Repeated",
    "promotionsAdmin.decision.LEFT": "Left the school",
    "promotionsAdmin.errors.loadReports": "Unable to load report cards.",
    "promotionsAdmin.errors.saveDecision": "Unable to save the decision.",
    "promotionsAdmin.errors.loadWaiting": "Unable to load the waiting list.",
    "promotionsAdmin.errors.assign": "Unable to assign.",
    "promotionsAdmin.success.decisionSaved": "Decision saved.",
    "promotionsAdmin.success.assigned": "Student assigned to class.",
    "promotionsAdmin.waiting.targetYear": "Target school year",
    "promotionsAdmin.waiting.level": "Level",
    "promotionsAdmin.waiting.allLevels": "All levels",
    "promotionsAdmin.waiting.targetClass": "Final class",
    "promotionsAdmin.waiting.assign": "Assign",
    "promotionsAdmin.waiting.empty":
      "No student waiting for assignment with these filters.",
    "promotionsAdmin.years.alert":
      "No next school year exists yet for this school. Create it to allow re-enrollments, even without activating it right away.",
    "promotionsAdmin.years.active": "Active",
    "promotionsAdmin.years.activate": "Set as active",
    "promotionsAdmin.years.create.title": "Create a school year",
    "promotionsAdmin.years.create.label": "Label (e.g. 2026-2027)",
    "promotionsAdmin.years.create.submit": "Create",
    "promotionsAdmin.years.rollover.title": "Duplicate classes",
    "promotionsAdmin.years.rollover.source": "Source year",
    "promotionsAdmin.years.rollover.target": "Target year",
    "promotionsAdmin.years.rollover.submit": "Duplicate classes",
    "promotionsAdmin.years.success.created": "School year created.",
    "promotionsAdmin.years.success.activated": "School year activated.",
    "promotionsAdmin.years.success.rolledOver": "Classes duplicated.",
    "promotionsAdmin.years.errors.create": "Unable to create the school year.",
    "promotionsAdmin.years.errors.activate": "Unable to activate.",
    "promotionsAdmin.years.errors.rollover": "Unable to duplicate classes.",

    "schoolSettings.title": "School settings",
    "schoolSettings.tabs.levels": "Levels",
    "schoolSettings.lockedTitle": "Restricted access",
    "schoolSettings.lockedMessage":
      "Only school admins and managers can access the school settings.",
    "schoolSettings.errors.load": "Unable to load the levels.",
    "schoolSettings.levels.intro":
      "Activate the national levels used by this school. Levels created for this school are always active. The order determines the level automatically suggested for the next promotion decision.",
    "schoolSettings.levels.own": "School-owned level",
    "schoolSettings.levels.national": "National level",
    "schoolSettings.levels.alwaysActive": "Always active",
    "schoolSettings.levels.orderLabel": "Order",
    "schoolSettings.levels.empty.title": "No level",
    "schoolSettings.levels.empty.message":
      "No academic level is available for this school.",
    "schoolSettings.levels.errors.toggle":
      "Unable to change this level's activation.",
    "schoolSettings.levels.errors.save": "Unable to save the order.",
    "schoolSettings.levels.errors.invalidOrder":
      "The order must be a positive integer.",
    "schoolSettings.levels.success.saved": "Change saved.",
    "schoolSettings.help.menuLabel": "Help",
    "schoolSettings.help.close": "Close",
    "schoolSettings.help.title": "Help — School settings",
    "schoolSettings.help.section1Title": "Activating a level",
    "schoolSettings.help.section1Body":
      "Not every national level from the platform catalog automatically applies to your school — activate only the ones your school actually uses. Levels created for your school are always active and never need activating.",
    "schoolSettings.help.section2Title": "Order and the promotion decision",
    "schoolSettings.help.section2Body":
      'The Order field (editable on your own levels) defines the pedagogical progression. When a teacher records a "Promoted" decision in the Decision tab of Notes, the app automatically suggests the next active level in that order.',

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
    "settings.edit": "Edit",
    "settings.currentValue": "Current value",
    "settings.form.cancel": "Cancel",
    "settings.form.save": "Save",
    "settings.form.searchPlaceholder": "Search...",
    "settings.form.noResults": "No results",
    "components.inlineSelect.searchPlaceholder": "Search...",
    "components.inlineSelect.noResults": "No results",
    "settings.form.deviceLanguage.title": "Language of this device",
    "settings.form.deviceLanguage.subtitle": "Choose the application language",
    "settings.form.accountLanguage.title": "Account language",
    "settings.form.accountLanguage.subtitle":
      "Applied automatically on every login",
    "settings.form.activeSchool.title": "Active school",
    "settings.form.activeSchool.subtitle":
      "Choose the establishment that drives the app",
    "settings.form.activeRole.title": "Active profile",
    "settings.form.activeRole.subtitle": "Choose the navigation to display",
    "settings.school.title": "Active school",
    "settings.school.subtitle": "Establishment that drives the app",
    "settings.role.title": "Active profile",
    "settings.role.subtitle": "Navigation displayed in the app",
    "settings.role.onlyOne": "Only one profile is available on this account.",
    "settings.form.deviceLanguage.successTitle": "Language updated",
    "settings.form.deviceLanguage.successMessage":
      "The device language has been updated.",
    "settings.form.accountLanguage.successTitle": "Language updated",
    "settings.form.accountLanguage.successMessage":
      "Your account language has been saved.",
    "settings.form.accountLanguage.errorTitle": "Update failed",
    "settings.form.accountLanguage.errorMessage":
      "The account language could not be updated.",
    "settings.onboardingHelp.title": "Guided help",
    "settings.onboardingHelp.subtitle":
      "Show a guided tour the first time you open a module",
    "settings.form.onboardingHelp.successTitle": "Preference saved",
    "settings.form.onboardingHelp.successMessage":
      "Your guided help preference has been saved.",
    "settings.form.onboardingHelp.errorTitle": "Update failed",
    "settings.form.onboardingHelp.errorMessage":
      "The guided help preference could not be updated.",
    "settings.form.resetOnboardingTours.title": "Replay guided tours",
    "settings.form.resetOnboardingTours.subtitle":
      "Clears the memory of already-seen guided tours so they show again next time you visit each screen.",
    "settings.form.resetOnboardingTours.action": "Reset",
    "settings.form.resetOnboardingTours.successTitle": "Guided tours reset",
    "settings.form.resetOnboardingTours.successMessage":
      "Guided tours will reappear next time you visit each relevant screen.",
    "settings.about.title": "About & legal notices",
    "settings.about.subtitle":
      "Contact details, terms of service, legal notice and privacy policy.",
    "settings.about.action": "View",
    "aboutScreen.title": "About Scolive",
    "aboutScreen.contactTitle": "Contact us",
    "aboutScreen.legalTitle": "Legal documents",
    "aboutScreen.legal.cgu": "Terms of service",
    "aboutScreen.legal.mentions-legales": "Legal notice",
    "aboutScreen.legal.confidentialite": "Privacy policy",
    "aboutScreen.loading": "Loading...",
    "aboutScreen.errors.loadContact": "Could not load contact details.",
    "legalScreen.title": "Legal document",
    "legalScreen.loading": "Loading...",
    "legalScreen.errors.load": "Could not load this document.",
    "legalScreen.publisherLabel": "Publication director:",
    "onboardingTour.common.next": "Next",
    "onboardingTour.common.finish": "Finish",
    "onboardingTour.common.tapTarget":
      "Tap the highlighted element to continue.",
    "onboardingTour.common.gotIt": "Got it",
    "onboardingTour.financeParent.walletTitle": "Your wallet",
    "onboardingTour.financeParent.walletBody":
      "Top up this wallet at any time, even before the class council has decided. The money stays available until you choose to allocate it to a child.",
    "onboardingTour.financeParent.childrenTitle": "Each child's status",
    "onboardingTour.financeParent.childrenBody":
      "For each child: waiting on the class council decision, already re-enrolled, or ready to re-enroll with the remaining amount due shown.",
    "onboardingTour.financeParent.reinscribeTitle": "Pay and re-enroll",
    "onboardingTour.financeParent.reinscribeBody":
      "This button debits your wallet for the exact amount of THIS child's first installment and confirms their re-enrollment in one step. A parent with several children must tap separately for each one.",
    "finSituation.wallet.balance": "Wallet balance",
    "finSituation.wallet.topUpAmount": "Amount to top up",
    "finSituation.wallet.topUpSubmit": "Top up",
    "finSituation.wallet.allChildrenLoaded": "All children have been loaded",
    "finSituation.wallet.errors.load": "Unable to load the wallet.",
    "finSituation.wallet.errors.amount": "Invalid amount.",
    "finSituation.wallet.errors.topUp": "Unable to top up.",
    "finSituation.wallet.errors.reinscribe": "Unable to re-enroll.",
    "finSituation.wallet.success.topUp": "Wallet topped up.",
    "finSituation.wallet.success.reinscribed": "{firstName} is re-enrolled!",
    "finSituation.children.title": "My children",
    "finSituation.children.required": "Remaining amount due:",
    "finSituation.children.payAndReinscribe": "Pay and re-enroll",
    "finSituation.children.empty": "No child linked to your account.",
    "finSituation.children.status.DECISION_PENDING":
      "Waiting on the class council decision",
    "finSituation.children.status.NEXT_YEAR_NOT_OPEN":
      "Decision made, waiting for the school to open next school year",
    "finSituation.children.status.ALREADY_REINSCRIBED": "Already re-enrolled",
    "finSituation.children.status.READY_TO_REINSCRIBE": "Ready to re-enroll",
    "finSituation.children.dateOfBirth": "Born on {date}",
    "finSituation.children.schoolYearStart": "School year starts: {date}",
    "finSituation.children.daysLeft": "{count} day(s) left",
    "finSituation.children.deadlinePassed": "Deadline passed",
    "finSituation.children.insufficientBalance":
      "Insufficient balance: top up your wallet by {amount} to re-enroll.",
    "finSituation.children.confirmed.title": "Re-enrollment confirmed!",
    "finSituation.children.confirmed.message":
      "Get ready for the new school year by checking the supply list.",
    "finSituation.children.confirmed.viewSupplies": "View the supply list",

    "reinscription.title": "Re-enrollment",
    "reinscription.tabs.paiement": "Payment",
    "reinscription.tabs.fournitures": "Supplies",
    "reinscription.children.title": "My children",
    "reinscription.children.allLoaded": "All children have been loaded",
    "reinscription.children.empty": "No child linked to your account.",
    "reinscription.supplies.notOpenYet":
      "Next year has not been opened by the school yet.",
    "reinscription.supplies.empty":
      "No supply list defined for this level yet.",
    "reinscription.supplies.emptyList": "No child ready for a supply list yet.",
    "reinscription.supplies.allLoaded": "All supply lists have been loaded",
    "reinscription.wallet.balance": "Wallet balance",
    "reinscription.wallet.topUpLink": "Top up",
    "reinscription.wallet.success.reinscribed": "{firstName} is re-enrolled!",
    "reinscription.wallet.errors.reinscribe": "Unable to re-enroll.",
    "reinscription.errors.load": "Unable to load.",
    "reinscription.help.menuLabel": "Help",
    "reinscription.help.title": "Help — Re-enrollment",
    "reinscription.help.close": "Close",
    "reinscription.help.section1Title": "Pay and re-enroll",
    "reinscription.help.section1Body":
      'As soon as a child is promoted by the class council, they appear in the Payment tab with the remaining amount due (based on the threshold policy set by the school: first installment or full payment) and the deadline. Top up your wallet from Financial situation then tap "Pay and re-enroll" to settle that amount and confirm re-enrollment in one action.',
    "reinscription.help.section2Title": "Displayed statuses",
    "reinscription.help.section2Body":
      '"Awaiting class council decision" means next year\'s level has not been decided yet. "Ready to re-enroll" means payment can be made. "Already re-enrolled" confirms re-enrollment is done.',
    "reinscription.help.section3Title": "School supplies",
    "reinscription.help.section3Body":
      "The Supplies tab lists, for each child, the items needed for the level they are moving into next year (not their current level). This list is managed by the school.",

    "onboardingTour.reinscription.walletTitle": "Your wallet",
    "onboardingTour.reinscription.walletBody":
      'This is your available balance. Tap "Top up" to go credit your wallet from Financial situation.',
    "onboardingTour.reinscription.childrenTitle": "Your children",
    "onboardingTour.reinscription.childrenBody":
      "Every promoted child appears here with their previous and new level, the re-enrollment deadline and the remaining amount due.",
    "onboardingTour.reinscription.reinscribeTitle": "Pay and re-enroll",
    "onboardingTour.reinscription.reinscribeBody":
      "This button debits the required amount from your wallet and confirms re-enrollment in one action.",
    "onboardingTour.reinscription.suppliesTabTitle": "School supplies",
    "onboardingTour.reinscription.suppliesTabBody":
      "This tab lists the supplies needed for the level your child is moving into next year.",
    "onboardingTour.reinscription.helpToggleTitle": "Need help?",
    "onboardingTour.reinscription.helpToggleBody":
      'Tap this button, then "Help" in the menu, to find these explanations again at any time.',

    "reinscription.installments.show": "View schedule",
    "reinscription.installments.hide": "Hide schedule",
    "reinscription.installments.dueDate": "Due:",
    "reinscription.installments.error": "Schedule unavailable.",
    "reinscription.installments.status.PAID": "Paid",
    "reinscription.installments.status.PARTIAL": "Partial",
    "reinscription.installments.status.UPCOMING": "Upcoming",
    "reinscription.installments.status.OVERDUE": "Overdue",

    "onboardingTour.childTimetable.step1Title": "Switch views",
    "onboardingTour.childTimetable.step1Body":
      "Tap Day, Week or Month to change how the schedule is displayed.",
    "onboardingTour.childTimetable.step2Title": "Navigate through time",
    "onboardingTour.childTimetable.step2Body":
      "Use the arrows to move to the previous or next period, or tap the label to jump back to today.",
    "onboardingTour.childTimetable.step3Title": "Check a course",
    "onboardingTour.childTimetable.step3Body":
      "Each card shows the time, subject, teacher and room for the course.",
    "onboardingTour.childTimetable.step4Title": "Help is always available",
    "onboardingTour.childTimetable.step4Body":
      'Tap this button at any time, then "Help" in the menu, to see a reminder of how to use this page.',
    "onboardingTour.tests.step1Title": "Find your way around the tabs",
    "onboardingTour.tests.step1Body":
      '"Campaigns" lists the tests to run, "Tests done" keeps a history of your results, and "To redo" gathers the tests an administrator asks you to redo.',
    "onboardingTour.tests.step2Title": "Start a test",
    "onboardingTour.tests.step2Body":
      "Inside a campaign, tap Start (or Review if you already did it) to open the first test case and record your result.",
    "onboardingTour.tests.step3Title": "Help is always available",
    "onboardingTour.tests.step3Body":
      'Tap this button at any time, then "Help" in the menu, to see this reminder about the module again.',
    "onboardingTour.schoolSettings.step1Title": "Levels tab",
    "onboardingTour.schoolSettings.step1Body":
      "This tab groups the academic levels used by your school. More settings will be added here over time.",
    "onboardingTour.schoolSettings.step2Title": "Activate a level",
    "onboardingTour.schoolSettings.step2Body":
      'This switch activates or deactivates a national level for your school: only active levels then appear as a possible target in the Decision tab of Notes. Levels created for your school are always active. The Order field (on your own levels) determines which level is automatically suggested when a teacher records a "Promoted" decision.',
    "onboardingTour.schoolSettings.step3Title": "Help is always available",
    "onboardingTour.schoolSettings.step3Body":
      'Tap this button at any time, then "Help" in the menu, to see a reminder of how to use this page.',
    "onboardingTour.disciplineSelf.step1Title": "Three tabs",
    "onboardingTour.disciplineSelf.step1Body":
      "Tap a tab to switch between the summary, absences and lateness, then sanctions and punishments.",
    "onboardingTour.disciplineSelf.step2Title": "Filter by indicator",
    "onboardingTour.disciplineSelf.step2Body":
      "Tap a card (absences, lateness, sanctions, punishments) to filter the recent events list to that type.",
    "onboardingTour.disciplineSelf.step3Title": "Help is always available",
    "onboardingTour.disciplineSelf.step3Body":
      'Tap this button at any time, then "Help" in the menu, to see these explanations again.',
    "onboardingTour.homework.step1Title": "Two ways to see your homework",
    "onboardingTour.homework.step1Body":
      '"List" shows your upcoming homework one after another, "Agenda" organizes them by week or month.',
    "onboardingTour.homework.step2Title": "A homework card",
    "onboardingTour.homework.step2Body":
      "Tap a card to see the full instructions and attachments. The bubble icon shows and adds comments.",
    "onboardingTour.homework.step3Title": "Mark it as done",
    "onboardingTour.homework.step3Body":
      "Once you're done, tap this toggle to let your teacher know. Tap it again to undo.",
    "onboardingTour.homework.step4Title": "Help is always available",
    "onboardingTour.homework.step4Body":
      'Tap this button any time, then "Help" in the menu, to see a reminder of how to use this page.',
    "onboardingTour.parentLanding.step1Title": "Your navigation menu",
    "onboardingTour.parentLanding.step1Body":
      "Tap this icon to open the menu and reach every section of the school.",
    "onboardingTour.parentLanding.step2Title": "Your messaging",
    "onboardingTour.parentLanding.step2Body":
      "In this menu, this entry opens your parent messaging, where all your exchanges with the school live.",
    "onboardingTour.parentLanding.step3Title": "Your child's space",
    "onboardingTour.parentLanding.step3Body":
      "Tap your child's name to expand their space: grades, timetable, discipline and more.",
    "onboardingTour.parentLanding.step4Title": "Your account settings",
    "onboardingTour.parentLanding.step4Body":
      "This icon opens your account settings: contact details, security and preferences.",
    "onboardingTour.parentLanding.step5Title": "Help is always available",
    "onboardingTour.parentLanding.step5Body":
      "Tap this button anytime for a reminder on how to use this page and the navigation menu.",
    "onboardingTour.feedFilters.step1Title": "Open the filters",
    "onboardingTour.feedFilters.step1Body":
      "Tap this button to open the feed's filter panel.",
    "onboardingTour.feedFilters.step2Title": "Combine post types",
    "onboardingTour.feedFilters.step2Body":
      "Select one or more post types: they combine with each other.",
    "onboardingTour.feedFilters.step3Title": "Confirm your selection",
    "onboardingTour.feedFilters.step3Body":
      "Tap Apply: the panel closes and the list shows the filtered result right away.",
    "onboardingTour.feedFilters.step4Title": "Help is always available",
    "onboardingTour.feedFilters.step4Body":
      "Tap this button anytime to see the search and filters explanation again.",
    "settings.form.activeSchool.successTitle": "Active school updated",
    "settings.form.activeSchool.successMessage":
      "The active school has been updated.",
    "settings.form.activeSchool.errorTitle": "Update failed",
    "settings.form.activeSchool.errorMessage":
      "The active school could not be updated.",
    "settings.form.activeRole.successTitle": "Active profile updated",
    "settings.form.activeRole.successMessage":
      "The active profile has been updated.",
    "settings.form.activeRole.errorTitle": "Update failed",
    "settings.form.activeRole.errorMessage":
      "The active profile could not be updated.",

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
      "No discipline event recorded for the current year.",
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
    "discipline.tabs.absencesRetards": "Absences",
    "discipline.tabs.sanctionsPunitions": "Sanctions",
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
    "discipline.header.student": "Student",

    "discipline.disciplineSelf.help.menuLabel": "Help",
    "discipline.disciplineSelf.help.close": "Close",
    "discipline.disciplineSelf.help.synthese.title": "Discipline — Summary",
    "discipline.disciplineSelf.help.synthese.section1Title":
      "The year's counters",
    "discipline.disciplineSelf.help.synthese.section1Body":
      "The cards at the top of the screen total, since the start of the school year, the number of absences, lateness, sanctions and punishments. These numbers update automatically as soon as a new event is recorded by the school — you don't need to do anything to refresh them.",
    "discipline.disciplineSelf.help.synthese.section2Title":
      "Filtering recent events",
    "discipline.disciplineSelf.help.synthese.section2Body":
      'Tap a card (absences, lateness, sanctions or punishments) to only show, in the "Recent events" list just below, events of that type — useful to quickly check, for example, whether a lateness reported verbally was actually recorded. Tap the same card again (or "Show all") to go back to the full unfiltered list.',
    "discipline.disciplineSelf.help.absences.title": "Discipline — Absences",
    "discipline.disciplineSelf.help.absences.section1Title":
      "The full history of absences and lateness",
    "discipline.disciplineSelf.help.absences.section1Body":
      "This tab lists, most recent first, every absence and lateness recorded by the school, with its date and its reason if the school specified one. This list is read-only: it reflects what the school entered and cannot be edited from the app.",
    "discipline.disciplineSelf.help.sanctions.title": "Discipline — Sanctions",
    "discipline.disciplineSelf.help.sanctions.section1Title":
      "The full history of sanctions and punishments",
    "discipline.disciplineSelf.help.sanctions.section1Body":
      "This tab lists, most recent first, every sanction and punishment recorded by the school, with its date and its reason. Like the Absences tab, this list is read-only and only reflects what the school entered.",

    "discipline.fab.addEvent": "Add a discipline event",

    "discipline.empty.discipline.title": "Discipline unavailable",
    "discipline.empty.discipline.message":
      "The class context could not be resolved.",
    "discipline.empty.noClassEvents.title": "No discipline events",
    "discipline.empty.noClassEvents.message":
      "No events have been recorded for this class yet.",
    "discipline.empty.chooseStudent.title": "Choose a student",
    "discipline.empty.chooseStudentClass.message":
      "The discipline summary appears here once a student in the class is selected.",
    "discipline.empty.chooseStudentGlobal.message":
      "The discipline summary appears here once a student is selected.",
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
      "Select a student to view their discipline summary.",
    "discipline.sections.searchStudents.title": "Search for a student",
    "discipline.sections.searchStudents.subtitle":
      "Filter by class or type a name to search across all classes.",
    "discipline.sections.byClass.title": "By-class view",
    "discipline.sections.byClass.subtitle": "Select a year and a class.",

    "discipline.teacherHelp.menuLabel": "Help",
    "discipline.teacherHelp.close": "Got it",
    "discipline.teacherHelp.events.title": "How to use the Events tab",
    "discipline.teacherHelp.events.section1Title": "Filter by student",
    "discipline.teacherHelp.events.section1Body":
      "Choose a student from the list to only show their events, or leave it empty to see the whole class.",
    "discipline.teacherHelp.events.section2Title": "Report an event",
    "discipline.teacherHelp.events.section2Body":
      "Tap the + button to report an absence, a tardy, a sanction or a punishment.",
    "discipline.teacherHelp.carnets.title": "How to use the Booklets tab",
    "discipline.teacherHelp.carnets.section1Title": "Check a student's booklet",
    "discipline.teacherHelp.carnets.section1Body":
      "Choose a student to see the summary of their absences, tardies, sanctions and punishments.",

    "onboardingTour.teacherDiscipline.step1Title": "Two tabs",
    "onboardingTour.teacherDiscipline.step1Body":
      "Switch from the class's recent events to a student's detailed booklet.",
    "onboardingTour.teacherDiscipline.step2Title": "Filter by student",
    "onboardingTour.teacherDiscipline.step2Body":
      "Choose a student from the list to only show their events.",
    "onboardingTour.teacherDiscipline.step3Title": "Report an event",
    "onboardingTour.teacherDiscipline.step3Body":
      "Tap this button to report an absence, a tardy, a sanction or a punishment.",
    "onboardingTour.teacherDiscipline.step4Title": "Help is always available",
    "onboardingTour.teacherDiscipline.step4Body":
      'Tap this button at any time, then "Help" in the menu, for a reminder tailored to the tab you\'re viewing.',

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

    "discipline.parent.title": "Discipline",
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

    "homework.tourFallback.title": "Example: Exercises page 42",
    "homework.tourFallback.subject": "Mathematics",
    "homework.tourFallback.author": "Your teacher",

    "homework.help.menuLabel": "Help",
    "homework.help.close": "Close",
    "homework.help.list.title": "Homework — List",
    "homework.help.list.section1Title": "The List view",
    "homework.help.list.section1Body":
      'This view shows your upcoming homework one after another, from the nearest due date to the farthest. Tap "Agenda" at the top of the screen to see it organized by week or month instead.',
    "homework.help.agenda.title": "Homework — Agenda",
    "homework.help.agenda.section1Title": "The Agenda view",
    "homework.help.agenda.section1Body":
      'This view organizes your homework by week or month: a dot appears under each day that has at least one homework. Tap a marked day to show that day\'s homework. Tap "List" at the top of the screen to go back to the simple chronological order.',
    "homework.help.section2Title": "A homework card",
    "homework.help.section2Body":
      "Each card shows the subject, the homework title and its due date. Tap a card to see the full instructions and any attachments. The bubble icon shows comments already posted and lets you add a new one, visible to the teacher and the other students in the class.",
    "homework.help.section3Title": "Mark as done",
    "homework.help.section3Body":
      'Once the homework is finished, tap the "Mark done" toggle to let your teacher know: the homework stays visible but appears as completed. You can tap the same toggle again to undo it if you made a mistake.',

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
    "homework.comment.close": "Close comment form",

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
    "homework.form.createHeroTitle": "Creating a homework",
    "homework.form.createHeroSubtitle": "Instructions",
    "homework.form.editModuleTitle": "Update homework",
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

    "resources.header.title": "Resources",
    "resources.tabs.assessments": "Assessments",
    "resources.tabs.exams": "Exams",
    "resources.tabs.mine": "My resources",
    "resources.tabs.favorites": "Favorites",
    "resources.tabs.moderation": "Moderation",
    "resources.status.statement": "Statement",
    "resources.status.correction": "Correction",
    "resources.examType.sequenceTest": "Sequence test",
    "resources.examType.popQuiz": "Pop quiz",
    "resources.examType.mockExam": "Mock exam",
    "resources.empty.message": "No resource matches these criteria.",
    "resources.card.statementButton": "Statement",
    "resources.card.correctionButton": "Correction",
    "resources.card.editButton": "Edit",
    "resources.detail.statement": "Statement",
    "resources.detail.correction": "Correction",
    "resources.detail.edit": "Edit",
    "resources.detail.notFound": "Resource not found.",
    "resources.detail.noContent": "No content available.",
    "resources.errors.addAttachment": "Could not add this attachment.",
    "resources.errors.openAttachment": "Could not open this attachment.",
    "resources.toast.successTitle": "Resource saved",
    "resources.toast.successMessage": "Your submission is pending approval.",
    "resources.toast.errorTitle": "Error",
    "resources.moderation.approve": "Approve",
    "resources.moderation.reject": "Reject",
    "resources.moderation.actionSuccess": "Action completed.",
    "resources.moderation.empty": "No resource pending review.",
    "resources.common.cancel": "Cancel",
    "resources.common.submit": "Save",
    "resources.form.editTitle": "Edit resource",
    "resources.form.createAssessmentHeroTitle": "New assessment",
    "resources.form.createExamHeroTitle": "New exam",
    "resources.form.assessmentHeroSubtitle":
      "Test, pop quiz or mock exam from your school",
    "resources.form.examHeroSubtitle": "Official national exam",
    "resources.form.titleLabel": "Title",
    "resources.form.titlePlaceholder": "E.g. Chapter 3 test",
    "resources.form.schoolLabel": "School",
    "resources.form.schoolPlaceholder": "Choose a school",
    "resources.form.schoolLoading": "Loading schools…",
    "resources.form.cycleLabel": "Cycle",
    "resources.form.cyclePlaceholder": "Choose a cycle",
    "resources.form.levelLabel": "Level",
    "resources.form.levelPlaceholder": "Choose a level",
    "resources.form.trackLabel": "Track",
    "resources.form.trackPlaceholder": "Choose a track",
    "resources.form.subjectLabel": "Subject",
    "resources.form.subjectPlaceholder": "Choose a subject",
    "resources.form.examTypeLabel": "Type",
    "resources.form.examTypePlaceholder": "Choose a type",
    "resources.form.sequenceLabel": "Sequence",
    "resources.form.sequencePlaceholder": "Choose a sequence",
    "resources.form.academicYearLabel": "Academic year",
    "resources.form.academicYearPlaceholder": "Choose an academic year",
    "resources.form.statementLabel": "Statement",
    "resources.form.statementPlaceholder": "Write the statement here…",
    "resources.form.correctionLabel": "Correction",
    "resources.form.correctionPlaceholder": "Write the correction here…",
    "resources.form.optional": "optional",
    "resources.form.insertingImage": "Inserting image…",
    "resources.form.addAttachment": "Add an attachment",
    "resources.form.colorMenu.title": "Text color",
    "resources.form.colorMenu.message": "Choose a color",
    "resources.form.validation.titleRequired": "Title is required.",
    "resources.form.validation.schoolRequired": "School is required.",
    "resources.form.validation.schoolCycleMissing":
      "This school has no cycle configured — levels cannot be offered. Contact an administrator.",
    "resources.form.validation.cycleRequired": "Cycle is required.",
    "resources.form.validation.levelRequired": "Level is required.",
    "resources.form.validation.trackRequired": "Track is required.",
    "resources.form.validation.subjectRequired": "Subject is required.",
    "resources.form.validation.examTypeRequired": "Type is required.",
    "resources.form.validation.sequenceRequired": "Sequence is required.",
    "resources.form.validation.academicYearRequired":
      "Academic year is required.",
    "resources.filters.toggleLabel": "Search",
    "resources.filters.searchPlaceholder": "Search by title…",
    "resources.filters.academicYear": "Academic year",
    "resources.filters.allYears": "All years",
    "resources.filters.school": "School",
    "resources.filters.allSchools": "All schools",
    "resources.filters.level": "Level",
    "resources.filters.allLevels": "All levels",
    "resources.filters.sequence": "Sequence",
    "resources.filters.allSequences": "All sequences",
    "resources.filters.examType": "Assessment type",
    "resources.filters.allExamTypes": "All types",
    "resources.filters.reset": "Reset",
    "resources.filters.cancel": "Cancel",
    "resources.filters.apply": "Apply",
    "resources.filters.close": "Close",

    "resources.help.menuLabel": "Help",
    "resources.help.close": "Close",
    "resources.help.ASSESSMENT.title": "How to use the Assessments tab",
    "resources.help.EXAM.title": "How to use the Exams tab",
    "resources.help.browse.section1Title": "Search and filter",
    "resources.help.browse.section1Body":
      "Use the search field to find a resource by title. Tap the filter icon to narrow down by academic year, school, level, sequence, or exam type depending on the tab you're on.",
    "resources.help.browse.section2Title": "View a resource",
    "resources.help.browse.section2Body":
      "Tap a card to open its statement or, if available, its correction.",
    "resources.help.browse.section3Title": "Add to favorites",
    "resources.help.browse.section3Body":
      "Tap the favorite icon on a card to add it to your favorites and find it again quickly from the Favorites tab.",
    "resources.help.mine.title": "How to use the My resources tab",
    "resources.help.mine.section1Title": "Track your submissions' status",
    "resources.help.mine.section1Body":
      "Each resource you submitted shows the status of its statement and, if present, its correction: pending, approved, or rejected by moderation — so you know whether your submission is already visible to other users.",
    "resources.help.mine.section2Title": "Edit a submission",
    "resources.help.mine.section2Body":
      "Tap Edit on one of your resources to correct its content, before or after moderation approval.",
    "resources.help.favorites.title": "How to use the Favorites tab",
    "resources.help.favorites.section1Title": "Find your favorite resources",
    "resources.help.favorites.section1Body":
      "This tab gathers every resource you added to favorites from the Assessments and Exams tabs. Tap the favorite icon again on a card to remove it from this list.",

    "onboardingTour.resources.step1Title": "Resource types",
    "onboardingTour.resources.step1Body":
      "Switch between Assessments, Exams and your Favorites with these tabs.",
    "onboardingTour.resources.step2Title": "Search and filter",
    "onboardingTour.resources.step2Body":
      "Search for a resource by title, or tap the filter icon to narrow down by year, school, level or type.",
    "onboardingTour.resources.step3Title": "Need help?",
    "onboardingTour.resources.step3Body":
      'Tap this button, then "Help" in the menu, to find these explanations again at any time.',

    "resources.form.duplicateWarningTitle": "This resource may already exist",
    "resources.form.duplicateWarningMessage":
      "One or more similar resources already exist. Do you really want to create this one?",
    "resources.form.duplicateConfirm": "Create anyway",
    "resources.form.duplicateCancel": "Cancel",
    "resources.form.duplicateBlocked":
      "This resource already exists (too similar to an existing resource).",

    "resources.card.proposeStatement": "Propose a statement",
    "resources.card.proposeCorrection": "Propose a correction",

    "resources.contribution.statementHeader": "Statement",
    "resources.contribution.correctionHeader": "Correction",
    "resources.contribution.approvedLabel": "Approved content",
    "resources.contribution.myContributionLabel": "My contribution",
    "resources.contribution.contentPlaceholder": "Write the content here…",
    "resources.contribution.saveDraft": "Save draft",
    "resources.contribution.submit": "Submit for review",
    "resources.contribution.draftSaved": "Draft saved",
    "resources.contribution.submitted": "Submitted for review",
    "resources.contribution.statusDraft": "Draft",
    "resources.contribution.statusAwaiting": "Pending review",
    "resources.contribution.statusApproved": "Approved",
    "resources.contribution.statusRejected": "Rejected",
    "resources.contribution.statusDiscarded": "Not retained",
    "resources.contribution.rejectedReasonLabel": "Rejection reason:",
    "resources.contribution.noApprovedYet": "No approved content yet.",
    "resources.contribution.correctionLocked":
      "The correction can be proposed once the statement is approved.",
    "resources.contribution.addAttachment": "Add an attachment",
    "resources.contribution.insertingImage": "Inserting image…",
    "resources.contribution.colorMenu.title": "Text color",
    "resources.contribution.colorMenu.message": "Choose a color",
    "resources.contribution.newProposal": "New proposal",
    "resources.contribution.contentRequired": "Content is required.",

    "resources.moderation.proposedByLabel": "Proposed by",
    "resources.moderation.approveThis": "Approve this one",
    "resources.moderation.rejectThis": "Reject",
    "resources.moderation.rejectReasonPlaceholder":
      "Rejection reason (optional)",
    "resources.moderation.conflictError":
      "This submission was already handled by another administrator.",
    "resources.moderation.approveSuccess": "Submission approved.",
    "resources.moderation.rejectSuccess": "Submission rejected.",
    "resources.moderation.statementNotApproved":
      "This resource's statement is not approved yet.",
    "resources.moderation.reviewHeaderStatement": "Moderation — Statement",
    "resources.moderation.reviewHeaderCorrection": "Moderation — Correction",
    "resources.moderation.referenceStatementLabel": "Reference statement",
    "resources.moderation.submissionContentLabel": "Submitted content",
    "resources.moderation.editContent": "Edit",
    "resources.moderation.saveEdit": "Save changes",
    "resources.moderation.editSuccess": "Content updated.",
    "resources.moderation.notFound":
      "This submission no longer exists or was already handled.",

    "resources.onboarding.title": "How to contribute a resource",
    "resources.onboarding.step1Title": "1. Create the record",
    "resources.onboarding.step1Body":
      'Fill in the general information: subject, level, sequence or exam type. The record then appears in the "My resources" tab.',
    "resources.onboarding.step2Title": "2. Propose a statement",
    "resources.onboarding.step2Body":
      'From the "My resources" tab, propose the statement for your record. Any teacher can propose a competing statement; the platform approves the best one.',
    "resources.onboarding.step3Title": "3. Propose a correction",
    "resources.onboarding.step3Body":
      'Once the statement is approved by the platform, anyone can propose a correction from the record, still in "My resources": the best correction is retained on approval.',
    "resources.onboarding.dontShowAgain": "Don't show again",
    "resources.onboarding.start": "Get started",

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
    "timetable.childAgenda.help.menuLabel": "Help",
    "timetable.childAgenda.help.title": "How to use this page",
    "timetable.childAgenda.help.close": "Got it",
    "timetable.childAgenda.help.section1Title": "Switch views",
    "timetable.childAgenda.help.section1Body":
      "Switch between Day, Week and Month to change how your child's timetable is displayed.",
    "timetable.childAgenda.help.section2Title": "Navigate through time",
    "timetable.childAgenda.help.section2Body":
      "Use the arrows or tap the period label to move through time: jump several months ahead to find a specific slot, or return to \"today\" for today's or tomorrow's agenda.",
    "timetable.childAgenda.help.section3Title": "Check a course's details",
    "timetable.childAgenda.help.section3Body":
      "Tap a course card to see its time, teacher and room at a glance.",

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

    "timetable.teacherAgenda.admin.modeLabel": "Search by",
    "timetable.teacherAgenda.admin.userLabel": "User",
    "timetable.teacherAgenda.admin.userPlaceholder": "Choose a user",
    "timetable.teacherAgenda.admin.levelLabel": "Level",
    "timetable.teacherAgenda.admin.allLevels": "All levels",
    "timetable.teacherAgenda.admin.classLabel": "Class",
    "timetable.teacherAgenda.admin.classPlaceholder": "Choose a class",
    "timetable.teacherAgenda.admin.searchClassPlaceholder": "Search a class...",
    "timetable.teacherAgenda.admin.roleTeacher": "Teacher",
    "timetable.teacherAgenda.admin.roleStudent": "Student",
    "timetable.teacherAgenda.admin.roleStaff": "Staff",
    "timetable.teacherAgenda.admin.filters.reset": "Reset",
    "timetable.teacherAgenda.admin.filters.close": "Close",
    "timetable.teacherAgenda.admin.filters.apply": "Apply",
    "timetable.teacherAgenda.admin.emptySelectionTitle":
      "Choose a user or a class",
    "timetable.teacherAgenda.admin.emptySelectionMessage":
      "Open the filters to search for a user or a class and display their schedule.",
    "timetable.teacherAgenda.admin.noAgendaTitle": "No schedule",
    "timetable.teacherAgenda.admin.noAgendaMessage":
      "This profile has no schedule (administrative staff).",
    "timetable.teacherAgenda.admin.emptyMessageStudent":
      "No slot scheduled for this student during this period.",
    "timetable.teacherAgenda.admin.selectionBanner.userPrefix": "Schedule for",
    "timetable.teacherAgenda.admin.selectionBanner.classPrefix": "Class",
    "timetable.teacherAgenda.admin.selectionBanner.clear": "Clear selection",

    "timetable.teacherAgenda.help.menuLabel": "Help",
    "timetable.teacherAgenda.help.close": "Got it",
    "timetable.teacherAgenda.help.mine.title": "How to use your agenda",
    "timetable.teacherAgenda.help.mine.section1Title": "Switch views",
    "timetable.teacherAgenda.help.mine.section1Body":
      "Tap Day, Week or Month to change how your personal schedule is displayed.",
    "timetable.teacherAgenda.help.mine.section2Title": "Navigate through time",
    "timetable.teacherAgenda.help.mine.section2Body":
      "Use the arrows to move to the previous or next period, or tap the label to jump back to today.",
    "timetable.teacherAgenda.help.mine.section3Title": "Check a course",
    "timetable.teacherAgenda.help.mine.section3Body":
      "Tap a course card to see the class, subject, room, and to edit or cancel that slot if needed.",
    "timetable.teacherAgenda.help.classes.title":
      "How to use your classes' agenda",
    "timetable.teacherAgenda.help.classes.section1Title": "Choose a class",
    "timetable.teacherAgenda.help.classes.section1Body":
      "Tap a class in the list at the top of the screen to display its full timetable.",
    "timetable.teacherAgenda.help.classes.section2Title":
      "Switch views and navigate",
    "timetable.teacherAgenda.help.classes.section2Body":
      "Just like your personal agenda, switch between Day/Week/Month and use the arrows to change period.",
    "timetable.teacherAgenda.help.classes.section3Title": "Check a course",
    "timetable.teacherAgenda.help.classes.section3Body":
      "Tap a course card to see the full detail of that slot for this class.",

    "onboardingTour.teacherAgenda.step1Title": "Two views",
    "onboardingTour.teacherAgenda.step1Body":
      "Tap a tab to switch between your personal agenda and your classes' timetable.",
    "onboardingTour.teacherAgenda.step2Title": "Switch views",
    "onboardingTour.teacherAgenda.step2Body":
      "Tap Day, Week or Month to change how the schedule is displayed.",
    "onboardingTour.teacherAgenda.step3Title": "Navigate through time",
    "onboardingTour.teacherAgenda.step3Body":
      "Use the arrows to move to the previous or next period, or tap the label to jump back to today.",
    "onboardingTour.teacherAgenda.step4Title": "Help is always available",
    "onboardingTour.teacherAgenda.step4Body":
      'Tap this button at any time, then "Help" in the menu, for a reminder tailored to the tab you\'re viewing.',

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

    "messaging.help.menuLabel": "Help",
    "messaging.help.title": "Messaging",
    "messaging.help.close": "Close",
    "messaging.help.section1Title": "Organize your messages",
    "messaging.help.section1Body":
      "Use the Inbox, Sent, Drafts and Archive tabs to find your messages by status.",
    "messaging.help.section2Title": "Write a message",
    "messaging.help.section2Body":
      "Tap the + button to compose a new message. A message in progress is automatically saved in the Drafts tab.",

    "onboardingTour.messages.step1Title": "Your folders",
    "onboardingTour.messages.step1Body":
      "Switch between Inbox, Sent, Drafts and Archive with these tabs.",
    "onboardingTour.messages.step2Title": "Write a message",
    "onboardingTour.messages.step2Body":
      "Tap this button to compose a new message.",
    "onboardingTour.messages.step3Title": "Need help?",
    "onboardingTour.messages.step3Body":
      'Tap this button, then "Help" in the menu, to find these explanations again at any time.',

    "messaging.compose.titleNew": "New message",
    "messaging.compose.titleReply": "Reply",
    "messaging.compose.titleForward": "Forward",
    "messaging.compose.titleEditDraft": "Edit draft",
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
    "messaging.compose.errors.attachmentUploadFailed":
      "Unable to add this attachment. Please try again.",
    "messaging.compose.errors.draftLoadFailedTitle": "Error",
    "messaging.compose.errors.draftLoadFailedMessage":
      "Unable to load this draft.",
    "messaging.compose.attachingFile": "Adding attachment...",

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
    "messaging.actions.editDraft": "Edit draft",
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
    "tests.campaigns.progressCompact": "{done}/{total} completed",
    "tests.campaigns.search.placeholder": "Search campaigns",
    "tests.campaigns.search.accessibilityLabel": "Search campaigns",
    "tests.campaigns.search.clearAccessibilityLabel": "Clear search",
    "tests.campaigns.filters.mineAccessibilityLabel":
      "Show only campaigns assigned to me",
    "tests.campaigns.filters.resetSearch": "Reset",
    "tests.campaigns.filters.statusLabel": "Status",
    "tests.filters.panelTitle": "Filters",
    "tests.filters.toggleAccessibilityLabel": "Filters",
    "tests.filters.reset": "Reset",
    "tests.filters.close": "Close",
    "tests.filters.apply": "Apply",
    "tests.filters.mineOnlyLabel": "My campaigns only",
    "tests.campaigns.emptySearchTitle": "No results",
    "tests.campaigns.emptySearchMessage":
      "No campaign matches your search or filters.",
    "tests.campaigns.actions.start": "Start",
    "tests.campaigns.actions.review": "Review",
    "tests.tourFallback.title": "Example campaign",
    "tests.tourFallback.description":
      "This is a sample shown only during the guided tour.",
    "tests.help.menuLabel": "Help",
    "tests.help.close": "Close",
    "tests.help.title": "Help — Tests",
    "tests.help.section1Title": "Summary",
    "tests.help.section1Body":
      'This tab gives an overview: number of campaigns, campaigns in progress/upcoming/completed, total test cases and remaining tests. The "To do today" card highlights the most urgent campaign (nearest due date) you still have to finish, with a button to start it directly. Tapping a stat card (Campaigns, In progress, etc.) opens the Campaigns tab filtered on that status.',
    "tests.help.section2Title": "Campaigns",
    "tests.help.section2Body":
      'A campaign groups several test cases to run. Use the search bar to find a campaign by its title or description, and the funnel-shaped button on the right to open the filter panel (status All/In progress/Upcoming/Completed, and restricting the list to campaigns assigned to you — this filter is on by default when you have assigned campaigns). Each card shows your progress as {done}/{total} and the due date if any. Tap the card, or the Start/Review button, to open the campaign: the button reads Start until you have completed at least one case, then Review once you have submitted at least one result. Inside a campaign, each test case also has its own Start/Review button; once inside, tap "View test spec" to expand the objective, preconditions, expected result and steps (collapsed by default), then the "Enter the test result" button at the bottom of the screen to record your result.',
    "tests.help.section3Title": "Tests done",
    "tests.help.section3Body":
      "Find here the history of results you already submitted (passed, failed, blocked, skipped...). Search a test by its title or its campaign's title, and tap the funnel button to filter by status, by campaign, or to restrict the list to campaigns assigned to you. Tap a result to see its detail (comment, screenshots, device used).",
    "tests.help.section4Title": "To redo",
    "tests.help.section4Body":
      "An administrator may ask you to redo a test after reviewing your result (with an explanatory note). This tab gathers these rework requests. Search or use the funnel button to filter by campaign or restrict the list to campaigns assigned to you. Tap a card to open the test case and submit a new result.",
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
    "tests.detail.viewSpecToggle": "View test spec",
    "tests.detail.hideSpecToggle": "Hide test spec",
    "tests.detail.statusPlaceholder": "Select the test status",
    "tests.detail.validation.statusRequired": "Select a status before saving.",
    "tests.detail.fabAdd": "Enter the test result",
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
    "tests.tabs.toRedo": "To redo",

    "tests.toRedo.emptyTitle": "No tests to redo",
    "tests.toRedo.emptyMessage":
      "Tests an administrator asks you to redo will appear here.",
    "tests.toRedo.search.placeholder": "Search a test",
    "tests.toRedo.search.accessibilityLabel": "Search a test",
    "tests.toRedo.search.clearAccessibilityLabel": "Clear search",
    "tests.toRedo.filters.campaign": "Campaign",
    "tests.toRedo.filters.campaignAll": "All campaigns",
    "tests.toRedo.filters.mineAccessibilityLabel":
      "Show only campaigns assigned to me",
    "tests.toRedo.emptySearchTitle": "No results",
    "tests.toRedo.emptySearchMessage":
      "No test to redo matches your search or filters.",
    "tests.toRedo.cardCampaign": "Campaign: {title}",
    "tests.toRedo.requestedOn": "Rework requested on {date}",

    "tests.detail.reworkBanner.title": "This test needs to be redone",
    "tests.detail.reworkBanner.noNote":
      "An administrator requested a rework of this test.",
    "tests.detail.reworkBanner.formNote":
      "You are submitting a new result following a rework request.",

    "tests.executions.filters.status": "Status",
    "tests.executions.filters.statusAll": "All statuses",
    "tests.executions.filters.campaign": "Campaign",
    "tests.executions.filters.campaignAll": "All campaigns",
    "tests.executions.emptyTitle": "No test done yet",
    "tests.executions.emptyMessage":
      "Your test results will appear here once submitted.",
    "tests.executions.search.placeholder": "Search a test",
    "tests.executions.search.accessibilityLabel": "Search a test",
    "tests.executions.search.clearAccessibilityLabel": "Clear search",
    "tests.executions.emptySearchTitle": "No results",
    "tests.executions.emptySearchMessage":
      "No completed test matches your search.",
    "tests.executions.filters.mineAccessibilityLabel":
      "Show only campaigns assigned to me",
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
    "tests.summary.kpi.mineCaption": "incl. {count} for me",
    "tests.summary.highlight.title": "To do today",
    "tests.summary.highlight.campaignBadge": "Campaign",
    "tests.summary.highlight.cta": "Take the campaign",
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

    "siteContentAdmin.title": "Site content",
    "siteContentAdmin.subtitle": "Public contact details and legal documents",
    "siteContentAdmin.restricted": "Reserved for platform administrators.",
    "siteContentAdmin.tabs.contact": "Contact",
    "siteContentAdmin.tabs.legal": "Legal documents",
    "siteContentAdmin.tabs.messages": "Messages",
    "siteContentAdmin.contact.emailLabel": "Email",
    "siteContentAdmin.contact.phoneLabel": "Phone",
    "siteContentAdmin.contact.addressStreetLabel": "Street",
    "siteContentAdmin.contact.addressDistrictLabel": "District",
    "siteContentAdmin.contact.addressCityLabel": "City",
    "siteContentAdmin.contact.addressCountryLabel": "Country",
    "siteContentAdmin.contact.legalRepresentativeFirstNameLabel":
      "Legal representative — First name",
    "siteContentAdmin.contact.legalRepresentativeLastNameLabel":
      "Legal representative — Last name",
    "siteContentAdmin.contact.save": "Save",
    "siteContentAdmin.contact.loadError": "Unable to load contact details.",
    "siteContentAdmin.contact.saveSuccess": "Contact details updated.",
    "siteContentAdmin.contact.saveError": "Unable to save contact details.",
    "siteContentAdmin.contact.error.email": "Invalid email.",
    "siteContentAdmin.contact.error.phone": "Phone number is required.",
    "siteContentAdmin.contact.error.addressStreet": "Street is required.",
    "siteContentAdmin.contact.error.addressCity": "City is required.",
    "siteContentAdmin.contact.error.addressCountry": "Country is required.",
    "siteContentAdmin.contact.edit": "Edit",
    "siteContentAdmin.contact.cancel": "Cancel",
    "siteContentAdmin.contact.notProvided": "Not provided",
    "siteContentAdmin.contact.addressGroupLabel": "Address",
    "siteContentAdmin.legal.slugLabel": "Document",
    "siteContentAdmin.legal.slug.cgu": "Terms of Service",
    "siteContentAdmin.legal.slug.mentions-legales": "Legal Notice",
    "siteContentAdmin.legal.slug.confidentialite": "Privacy Policy",
    "siteContentAdmin.legal.localeLabel": "Language",
    "siteContentAdmin.legal.locale.fr": "French",
    "siteContentAdmin.legal.locale.en": "English",
    "siteContentAdmin.legal.listError":
      "Unable to load this document's versions.",
    "siteContentAdmin.legal.empty": "No version yet.",
    "siteContentAdmin.legal.version": "Version",
    "siteContentAdmin.legal.status.DRAFT": "Draft",
    "siteContentAdmin.legal.status.PUBLISHED": "Published",
    "siteContentAdmin.legal.status.ARCHIVED": "Archived",
    "siteContentAdmin.legal.edit": "Edit",
    "siteContentAdmin.legal.publish": "Publish",
    "siteContentAdmin.legal.delete": "Delete",
    "siteContentAdmin.legal.newDraftTitle": "New draft",
    "siteContentAdmin.legal.titleLabel": "Title",
    "siteContentAdmin.legal.contentLabel": "Content",
    "siteContentAdmin.legal.createDraft": "Create draft",
    "siteContentAdmin.legal.saveDraft": "Save draft",
    "siteContentAdmin.legal.cancel": "Cancel",
    "siteContentAdmin.legal.error.title": "Title is required.",
    "siteContentAdmin.legal.error.content": "Content is required.",
    "siteContentAdmin.legal.createSuccess": "Draft created.",
    "siteContentAdmin.legal.createError": "Unable to create the draft.",
    "siteContentAdmin.legal.saveDraftSuccess": "Draft saved.",
    "siteContentAdmin.legal.saveDraftError": "Unable to save the draft.",
    "siteContentAdmin.legal.publishConfirmTitle": "Publish this document?",
    "siteContentAdmin.legal.publishConfirm":
      "The currently published version will be archived and replaced by this one.",
    "siteContentAdmin.legal.publishSuccess": "Document published.",
    "siteContentAdmin.legal.publishError": "Unable to publish the document.",
    "siteContentAdmin.legal.deleteConfirmTitle": "Delete this draft?",
    "siteContentAdmin.legal.deleteConfirm": "This action cannot be undone.",
    "siteContentAdmin.legal.deleteSuccess": "Draft deleted.",
    "siteContentAdmin.legal.deleteError": "Unable to delete this draft.",
    "siteContentAdmin.editor.colorMenuTitle": "Text color",
    "siteContentAdmin.editor.colorMenuMessage": "Quick pick",
    "siteContentAdmin.editor.cancel": "Cancel",
    "siteContentAdmin.messages.listError":
      "Unable to load contact submissions.",
    "siteContentAdmin.messages.emptyTitle": "No contact submissions.",
    "siteContentAdmin.messages.previous": "Previous",
    "siteContentAdmin.messages.next": "Next",
    "siteContentAdmin.messages.loading": "Loading...",
    "siteContentAdmin.messages.read": "Message read",
    "siteContentAdmin.messages.reply": "Reply by email",
    "siteContentAdmin.help.toggle": "Help",
    "siteContentAdmin.help.close": "Got it",
    "siteContentAdmin.help.contact.title": "How to use the Contact tab",
    "siteContentAdmin.help.contact.section1Title":
      "Review the public contact details",
    "siteContentAdmin.help.contact.section1Body":
      "This tab shows the contact details (email, phone, address, legal representative) publicly displayed on the school's showcase site.",
    "siteContentAdmin.help.contact.section2Title": "Edit the contact details",
    "siteContentAdmin.help.contact.section2Body":
      "Tap Edit to correct any information, then Save. The update is immediately visible on the public site.",
    "siteContentAdmin.help.legal.title": "How to use the Legal documents tab",
    "siteContentAdmin.help.legal.section1Title":
      "Pick the document and language",
    "siteContentAdmin.help.legal.section1Body":
      "Select the document (Terms of Service, Legal Notice, Privacy Policy) then the language to edit — each document exists independently for every language offered on the site.",
    "siteContentAdmin.help.legal.section2Title": "Create or edit a draft",
    "siteContentAdmin.help.legal.section2Body":
      "Tap New draft to write a new version, or Edit on an existing draft. A draft can be freely corrected until it's published, without affecting the version visible on the site.",
    "siteContentAdmin.help.legal.section3Title": "Publish or delete a document",
    "siteContentAdmin.help.legal.section3Body":
      "Publishing a draft immediately replaces the version visible on the site for that language and document; previously published versions stay viewable in the history. Delete permanently removes a draft that no longer needs to be kept.",
    "siteContentAdmin.help.messages.title": "How to use the Messages tab",
    "siteContentAdmin.help.messages.section1Title": "Review received messages",
    "siteContentAdmin.help.messages.section1Body":
      "This tab lists submissions sent through the site's public contact form, newest first. Tap a message to read its details — it is then marked as read.",

    "onboardingTour.siteContent.step1Title": "Contact, documents and messages",
    "onboardingTour.siteContent.step1Body":
      "Switch between the public contact details, the legal documents (Terms of Service, Legal Notice, Privacy Policy) and the submissions received through the public contact form.",
    "onboardingTour.siteContent.step2Title": "Edit contact details",
    "onboardingTour.siteContent.step2Body":
      "Contact details are shown read-only. Tap this button to open the edit form, including the address (street, district, city, country).",
    "onboardingTour.siteContent.step3Title": "Pick the document and language",
    "onboardingTour.siteContent.step3Body":
      "Select the document and language to see its versions (draft, published, archived).",
    "onboardingTour.siteContent.step4Title": "Create a new version",
    "onboardingTour.siteContent.step4Body":
      "Draft a new version, then publish it to replace the live one.",
    "onboardingTour.siteContent.step5Title": "Need help?",
    "onboardingTour.siteContent.step5Body":
      "Come back to this button any time for a reminder of how this screen works.",

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
    "testsAdmin.executions.rework.request": "Request rework",
    "testsAdmin.executions.rework.cancel": "Cancel request",
    "testsAdmin.executions.rework.title": "Request a rework of this test",
    "testsAdmin.executions.rework.requestedBy":
      "Rework requested by {name} on {date}",
    "testsAdmin.executions.rework.noteLabel": "Note (optional)",
    "testsAdmin.executions.rework.notePlaceholder":
      "E.g. Please redo this test on version 1.4",
    "testsAdmin.executions.rework.submit": "Confirm",
    "testsAdmin.executions.rework.submitting": "Saving…",
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
    "feed.filters.toggleAccessibilityLabel": "Filters",
    "feed.filters.typeGroupLabel": "Post type",
    "feed.filters.authorGroupLabel": "Author",
    "feed.filters.reset": "Reset",
    "feed.filters.close": "Close",
    "feed.filters.apply": "Apply",
    "feed.filters.resultsLabel": "{count} post(s) total",

    "feed.search.placeholder": "Search a post",
    "feed.search.toggle": "Search",

    "feed.help.toggle": "Help",
    "feed.help.close": "Got it",

    "feed.unavailable.title": "Feed unavailable",
    "feed.unavailable.message":
      "This role does not have access to the news feed module yet.",

    "feed.errors.loadFailed": "Unable to load the feed.",
    "feed.errors.childContextMissing": "Child context not found.",
    "feed.errors.classContextMissing": "Class context not found.",
    "feed.errors.schoolMissing": "School not found",
    "feed.errors.openAttachmentTitle": "Error",
    "feed.errors.openAttachment": "Unable to open this attachment.",

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
    "feed.attachments.uploading": "Uploading…",
    "feed.attachments.uploadError": "Failed to upload attachment. Try again.",
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
    "feed.classLife.help.title": "Class life",
    "feed.classLife.help.menuLabel": "Help",
    "feed.classLife.help.section1Title": "What this feed is for",
    "feed.classLife.help.section1Body":
      "This feed gathers every post for the class (announcements, messages, polls) in chronological order, most recent first. It acts as a shared memory: instead of scattering information across separate messages, everything about the class stays available in one place, even after several days.",
    "feed.classLife.help.section2Title": "Search for a post",
    "feed.classLife.help.section2Body":
      "Use the search bar to find a post by keyword (in its title or text). This is useful once the feed holds several weeks of history and you need a specific piece of information (e.g. a field trip date) without scrolling through the whole list.",
    "feed.classLife.help.section3Title": "Filter by type and by author",
    "feed.classLife.help.section3Body":
      'The filter button (funnel icon) opens a panel where you can combine several post types ("featured", polls) and show only your own posts. Useful to focus on a single topic, for example seeing only ongoing polls. Once you\'ve made your selection, confirm with "Apply" to update the list; the filter button stays highlighted while a filter is active, as a reminder that the list is restricted.',
    "feed.classLife.help.section4Title": "Post types",
    "feed.classLife.help.section4Body":
      'A post marked with a star (sparkle icon) is "featured": highlighted by its author as particularly important, it stays visible even after being overtaken by more recent posts. A poll shows a question with choices: tap an option to vote, the result (vote count per option) appears immediately after you vote, and your vote can\'t be changed afterwards.',
    "feed.classLife.help.section5Title": "Reacting to a post",
    "feed.classLife.help.section5Body":
      'The heart adds or removes a "like" and shows the total number of people who liked the post — a quick way to signal approval without writing a message. The comment bubble shows how many replies have already been posted and expands the comment list when tapped. The "React" button opens a text field with quick emojis you can add with a tap: write your reply (or insert an emoji) then confirm with "Send" to publish your comment, visible to the whole class.',
    "feed.classLife.help.section6Title": "Attachments and images",
    "feed.classLife.help.section6Body":
      "A post can contain images inserted directly in the text (tap them to view full screen) and attached files (documents, PDFs...) listed below the text with their name and size: tap a file to open or download it.",
    "feed.classLife.help.section7Title": "Publishing and managing your posts",
    "feed.classLife.help.section7Body":
      "The round button at the bottom of the screen opens the posting form: write some text, optionally add images or attachments, or create a poll. You can delete a post you created yourself using the trash icon that appears on it; posts from other class members can't be deleted from this screen.",

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
    "feed.page.help.title": "Search and filter",
    "feed.page.help.body1": "Use the search bar to find a post by keyword.",
    "feed.page.help.body2":
      "The filter button on the right opens a panel where you can combine several post types (featured, polls) and show only your own posts.",
    "feed.page.help.body3":
      "Once you've made your selection, confirm with Apply to update the list.",
    "feed.detail.headerTitle": "Post",
    "feed.detail.backToList": "Back to list",
    "feed.composer.titleLabel": "Title",
    "feed.composer.contentLabel": "Content",
    "feed.comments.summaryNone": "Be the first to react",
    "feed.comments.summaryOne": "1 comment",
    "feed.comments.summaryMany": "{count} comments",

    "notes.tabs.evaluations": "Evaluations",
    "notes.tabs.notes": "Notes",
    "notes.tabs.council": "Class council",
    "notes.tabs.reports": "Reports",
    "notes.tabs.decision": "Decision",

    "notes.decision.intro":
      "Yearly synthesis and promotion decision, restricted to the class's referent teacher.",
    "notes.decision.synthesis.term1": "T1",
    "notes.decision.synthesis.term2": "T2",
    "notes.decision.synthesis.term3": "T3",
    "notes.decision.synthesis.yearly": "Yearly avg.",
    "notes.decision.synthesis.rankPrefix": "Rank",
    "notes.decision.synthesis.rankSeparator": "/",
    "notes.decision.empty.title": "No report",
    "notes.decision.empty.message":
      "No term 3 report is available for this class yet.",
    "notes.decision.errors.load": "Unable to load decisions",
    "notes.decision.errors.save": "Unable to save decision",
    "notes.decision.success.saved": "Decision saved",
    "notes.decision.decisionPlaceholder": "Decision",
    "notes.decision.noDecision": "No decision",

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
    "notes.teacher.loading.students": "Loading students…",
    "notes.teacher.filters.studentLabel": "STUDENT",
    "notes.teacher.filters.subjectLabel": "SUBJECT",
    "notes.teacher.filters.allSubjects": "All subjects",
    "notes.teacher.picker.selectStudent": "Select a student",
    "notes.teacher.picker.filterBySubject": "Filter by subject",
    "notes.teacher.search.placeholder": "Search for a student…",
    "notes.teacher.search.accessibilityLabel": "Search for a student",
    "notes.teacher.search.noResults": "No student found",
    "notes.teacher.filters.toggleAccessibilityLabel": "Filters",
    "notes.teacher.filters.termLabel": "Term",
    "notes.teacher.filters.viewLabel": "View",

    "notes.reports.search.placeholder": "Search for a student…",
    "notes.reports.search.accessibilityLabel": "Search for a student",
    "notes.reports.filter.toggleAccessibilityLabel": "Filters",
    "notes.reports.filter.termLabel": "Term",
    "notes.reports.empty.title": "No report",
    "notes.reports.empty.message": "No student is enrolled in this class.",
    "notes.reports.detail.backToList": "Back to list",
    "notes.reports.detail.generalTitle": "General assessment",
    "notes.reports.detail.subjectsTitle": "Assessment per subject",
    "notes.reports.detail.addAppreciation": "Add an assessment",
    "notes.reports.detail.editAppreciation": "Edit",
    "notes.reports.detail.saveField": "Save",
    "notes.reports.detail.cancel": "Cancel",
    "notes.reports.detail.noAppreciation": "No assessment yet",
    "notes.reports.detail.sequenceAverage": "Sequence average:",
    "notes.reports.detail.termAverage": "Term average",
    "notes.reports.meta.saveMeta": "Save",
    "notes.reports.detail.rankAndClassAverage":
      "Rank {rank}/{total} · Class avg. {classAverage}/20",
    "notes.reports.detail.appreciationPlaceholder": "Enter an assessment…",
    "notes.reports.detail.appreciationRequired":
      "The assessment cannot be empty.",
    "notes.reports.yearly.councilLabel":
      "Yearly synthesis — average of available terms",

    "notes.child.tabs.notes": "Notes",
    "notes.child.tabs.reports": "Reports",

    "notes.terms.term1": "Term 1",
    "notes.terms.term2": "Term 2",
    "notes.terms.term3": "Term 3",
    "notes.terms.yearly": "Year",
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
    "notes.form.permission.title": "Permission denied",
    "notes.form.permission.message": "Allow access to the gallery.",
    "notes.form.errors.insertImageTitle": "Image not added",
    "notes.form.errors.insertImage": "Unable to add the image.",
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
    "notes.manager.search.accessibilityLabel": "Search for an evaluation",
    "notes.manager.filters.toggleAccessibilityLabel": "Filters",
    "notes.manager.filters.typeLabel": "Evaluation type",
    "notes.manager.filters.sequenceLabel": "Sequence",
    "notes.manager.filters.completionLabel": "Grades entered",
    "notes.manager.filters.allOption": "All",
    "notes.manager.filters.completionComplete": "All entered",
    "notes.manager.filters.completionIncomplete": "Incomplete",
    "notes.manager.filters.reset": "Reset",
    "notes.manager.filters.close": "Close",
    "notes.manager.filters.apply": "Apply",
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
    "notes.manager.scores.ungradedSuffix": "not graded",
    "notes.manager.scores.draftBanner":
      "Draft — grades will only be visible in the Grades tab once the evaluation is published.",
    "notes.manager.scores.emptyTitle": "No student",
    "notes.manager.scores.emptyMessage":
      "Select a student in the filter or check loading.",
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
    "notes.manager.toast.attachmentErrorTitle": "Unable to open",
    "notes.manager.toast.attachmentErrorMessage":
      "Unable to open the attachment.",
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

    "notes.manager.help.menuLabel": "Help",
    "notes.manager.help.close": "Got it",
    "notes.manager.help.evaluations.title": "How to use the Evaluations tab",
    "notes.manager.help.evaluations.section1Title": "Search and filter",
    "notes.manager.help.evaluations.section1Body":
      "Use the search field to find an evaluation by title. Tap the filter icon to narrow the list by evaluation type, sequence, or entry status (complete or incomplete) — handy for quickly spotting evaluations still missing scores.",
    "notes.manager.help.evaluations.section2Title": "Draft or published status",
    "notes.manager.help.evaluations.section2Body":
      "An evaluation created as a draft is not visible to students or parents, and its scores don't show up in their Notes tab until it's published. Publish it once its scale and date are final to make it visible; the Draft or Published badge on each card shows its current state.",
    "notes.manager.help.evaluations.section3Title": "Track entry progress",
    "notes.manager.help.evaluations.section3Body":
      "Each card shows how many scores have been entered out of the class size. The scores icon changes color depending on whether entry is complete or still incomplete, so you can spot at a glance which evaluations still need finishing.",
    "notes.manager.help.evaluations.section4Title": "Create an evaluation",
    "notes.manager.help.evaluations.section4Body":
      "Tap the + button to create a new evaluation: title, subject, type, sequence, date, scale and coefficient. Save it as a draft to prepare it in advance, or publish it right away if it's ready.",
    "notes.manager.help.evaluations.section5Title":
      "Edit or delete an evaluation",
    "notes.manager.help.evaluations.section5Body":
      "From each card, tap Details to review all the evaluation's information, Edit to correct its scale, date or type, or Delete to remove it permanently — useful if it was created by mistake, before any scores are attached to it.",
    "notes.manager.help.evaluations.section6Title": "Enter or edit scores",
    "notes.manager.help.evaluations.section6Body":
      "Tap an evaluation, or its Scores action, to open score entry and enter or correct each student's score. While the evaluation stays in draft, a banner reminds you: entered scores stay invisible to families until it's published.",
    "notes.manager.help.notes.title": "How to use the Notes tab",
    "notes.manager.help.notes.section1Title": "Look up a student",
    "notes.manager.help.notes.section1Body":
      "Search for a student by name to see all their scores and averages, subject by subject.",
    "notes.manager.help.notes.section2Title":
      "Filter by subject, term or sequence",
    "notes.manager.help.notes.section2Body":
      "Tap the filter icon to narrow results down to a specific subject, term, or sequence — handy for quickly checking a given period's scores without scrolling through the student's whole history.",
    "notes.manager.help.notes.section3Title": "Switch views",
    "notes.manager.help.notes.section3Body":
      "Switch between the evaluations list, subject averages, and progress charts to look at the student's results from whichever angle you need.",
    "notes.manager.help.reports.title": "How to use the Reports tab",
    "notes.manager.help.reports.section1Title":
      "Find a student and pick a term",
    "notes.manager.help.reports.section1Body":
      "Search for a student, then tap the card for the term you want to open their full report: averages by sequence and by subject. Once the school generates the report, the publication date appears at the bottom of it.",
    "notes.manager.help.reports.section2Title": "Write the subject remark",
    "notes.manager.help.reports.section2Body":
      "For each subject you teach, tap Edit to write or correct the remark that will appear on the student's report. Subjects you don't teach stay read-only.",
    "notes.manager.help.reports.section3Title":
      "Write the general remark (referent teacher)",
    "notes.manager.help.reports.section3Body":
      "If you are the class's referent teacher, a general class-council remark is also editable, in addition to the per-subject remarks — it sums up the council's opinion on the student's whole term.",
    "notes.manager.help.decision.title": "How to use the Decision tab",
    "notes.manager.help.decision.section1Title": "Open a student's card",
    "notes.manager.help.decision.section1Body":
      'Each student is first shown collapsed, with just their name and a red "No decision" badge until a decision has been saved. Tap the card to open it: it then shows the three term averages, the yearly average and the student\'s rank in class (e.g. 3rd out of 28) — enough to decide on promotion with full context.',
    "notes.manager.help.decision.section2Title": "Choose the decision",
    "notes.manager.help.decision.section2Body":
      "Select Promoted, Repeated or Left for each student. This decision determines whether the student moves up to the next class, repeats the year, or leaves the school.",
    "notes.manager.help.decision.section3Title":
      "Target level suggested automatically",
    "notes.manager.help.decision.section3Body":
      "Unless Left is selected, pick the destination level for next year. The app suggests it automatically as soon as you choose Promoted (next level) or Repeated (same level) — you can always change it manually before saving. Only levels activated for your school in Settings > Levels appear in this list.",
    "notes.manager.help.decision.section4Title": "Save",
    "notes.manager.help.decision.section4Body":
      'Tap Save to confirm this student\'s decision: the card closes automatically and now shows the decision taken instead of "No decision".',

    "onboardingTour.teacherNotes.step1Title": "The tabs",
    "onboardingTour.teacherNotes.step1Body":
      "Switch from evaluations to per-student scores, then to class-council reports. If you're the class's referent teacher, an extra Decision tab appears to decide on promotion.",
    "onboardingTour.teacherNotes.step2Title": "Search and filter",
    "onboardingTour.teacherNotes.step2Body":
      "Tap the filter icon to narrow down the evaluation list by type, sequence or entry status.",
    "onboardingTour.teacherNotes.step3Title": "Create an evaluation",
    "onboardingTour.teacherNotes.step3Body":
      "Tap this button to create a new evaluation with its scale and date.",
    "onboardingTour.teacherNotes.step4Title": "Help is always available",
    "onboardingTour.teacherNotes.step4Body":
      'Tap this button at any time, then "Help" in the menu, for a reminder tailored to the tab you\'re viewing.',

    "notes.child.title": "Evaluations and averages",
    "notes.child.subtitle.student": "Student",
    "notes.child.help.menuLabel": "Help",
    "notes.child.help.close": "Close",
    "notes.child.help.notes.title": "Grades — Evaluations and averages",
    "notes.child.help.notes.section1Title": "Filter the results",
    "notes.child.help.notes.section1Body":
      "The filter button changes the term you're viewing, the view (evaluations, averages or charts) and, when several sequences exist, the displayed sequence. These settings apply immediately to the list below.",
    "notes.child.help.notes.section2Title": "Three ways to read the results",
    "notes.child.help.notes.section2Body":
      "The Evaluations view lists each grade received, subject by subject. The Averages view compares your child's average to the class average, to quickly spot a gap. The Charts view shows a year-long comparison and a per-subject radar, useful to visualize a trend or a recurring weak spot. Tap an evaluation or an average to see its detail (scale, coefficient, teacher's comment).",
    "notes.child.help.reports.title": "Grades — Report cards",
    "notes.child.help.reports.section1Title": "Viewing report cards",
    "notes.child.help.reports.section1Body":
      "This tab lists the report cards already published by the school, one per term. Tap a report card to open it: it details, subject by subject, the average achieved and the teacher's comment, plus a general comment from the class council if one was provided. A report card not yet published by the school does not appear in this list.",
    "onboardingTour.childNotes.tabsTitle": "Two tabs",
    "onboardingTour.childNotes.tabsBody":
      "Grades shows the current term's evaluations and averages. Reports shows already published report cards.",
    "onboardingTour.childNotes.filtersTitle": "Filter the view",
    "onboardingTour.childNotes.filtersBody":
      "Change the term, the view (evaluations, averages, charts) or the sequence from this button.",
    "onboardingTour.childNotes.helpToggleTitle": "Help is always available",
    "onboardingTour.childNotes.helpToggleBody":
      'Tap this button, then "Help" in the menu, to find how this screen works at any time.',
    "notes.panel.notes": "Notes",
    "notes.panel.loading": "Loading published grades...",
    "notes.panel.emptyTitle": "No published grade",
    "notes.panel.emptyMessage":
      "Published evaluations for this child will appear here.",
    "notes.panel.viewEval": "Eval",
    "notes.panel.viewAvg": "Avg",
    "notes.panel.viewChart": "Chart",
    "notes.panel.filters.toggleAccessibilityLabel": "Filters",
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
    "notes.admin.filters.year": "Year",
    "notes.admin.filters.allYears": "All years",
    "notes.admin.filters.level": "Level",
    "notes.admin.filters.allLevels": "All levels",
    "notes.admin.filters.class": "Class",
    "notes.admin.filters.classPlaceholder": "Choose a class",
    "notes.admin.filters.allClasses": "All classes",
    "notes.admin.search.placeholder": "Search for an evaluation…",
    "notes.admin.loading.evaluations": "Loading evaluations…",
    "notes.admin.loading.classes": "Loading classes…",
    "notes.admin.error.loadFailed": "Unable to load classes.",
    "notes.admin.error.title": "Error",
    "notes.admin.evaluations.emptyTitle": "No evaluation",
    "notes.admin.evaluations.emptyMessage":
      "No evaluation available for the selected filters.",
    "notes.admin.evaluations.noResultTitle": "No result",
    "notes.admin.evaluations.noResultMessage": "Try adjusting your search.",
    "notes.admin.fab.create": "Create an evaluation",
    "notes.admin.fab.selectClassFirst":
      "Pick a class in the filters to create an evaluation.",

    // App index — session expired
    "app.sessionExpired.title": "Session expired",
    "app.sessionExpired.subtitle": "Your space has been securely locked",
    "app.sessionExpired.message":
      "Your session has expired. Please log in again.",
    "app.sessionExpired.reconnect": "Log in again",

    "childHome.help.menuLabel": "Help",
    "childHome.help.title": "Child home",
    "childHome.help.close": "Close",
    "childHome.help.section1Title": "Three indicators",
    "childHome.help.section1Body":
      "The overall average, undone homework and unread messages are summarized at a glance. Tap a card to open the matching module directly.",
    "childHome.help.section2Title": "Summary blocks",
    "childHome.help.section2Body":
      'Each block (latest evaluations, news feed, unread messages) shows a preview. Tap "See more" at the top right of the block to open the full module.',
    "childHome.help.section3Title": "School supplies",
    "childHome.help.section3Body":
      'As soon as the class council has decided which level your child is moving into next year, a "Supplies" block appears here with a preview of the items needed for that level. Tap this block to open the Re-enrollment screen and see the full list.',
    "childHome.supplies.title": "School supplies",
    "childHome.supplies.linkLabel": "See all",
    "childHome.supplies.empty": "No supply list defined for this level yet.",
    "onboardingTour.childHome.kpisTitle": "Three indicators",
    "onboardingTour.childHome.kpisBody":
      "Average, undone homework and unread messages: tap a card to open the matching module.",
    "onboardingTour.childHome.sectionsTitle": "Summary blocks",
    "onboardingTour.childHome.sectionsBody":
      'Each block shows a preview of the module. Tap "See more" to open it fully.',
    "onboardingTour.childHome.helpToggleTitle": "Help is always available",
    "onboardingTour.childHome.helpToggleBody":
      'Tap this button, then "Help" in the menu, to find how this screen works at any time.',

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

    // School admin/manager home — dashboard
    "home.school.dashboard.title": "{year} dashboard",
    "home.school.kpi.classes": "Classes",
    "home.school.kpi.students": "Students",
    "home.school.kpi.teachers": "Teachers",
    "home.school.kpi.parents": "Parents",
    "home.school.kpi.subjects": "Subjects",
    "home.school.kpi.rooms": "Rooms",

    // Platform home — resource KPIs (assessments / exams)
    "home.platform.overview.title": "Overview",
    "home.platform.quickAccess.title": "Quick access",
    "home.platform.kpi.schools": "Schools",
    "home.platform.kpi.users": "Users",
    "home.platform.kpi.students": "Students",
    "home.platform.resources.title": "Resources",
    "home.platform.resources.assessments.title": "Assessments",
    "home.platform.resources.exams.title": "Exams",
    "home.platform.resources.kpi.withoutStatement": "Missing statement",
    "home.platform.resources.kpi.withoutCorrection": "Missing correction",
    "home.platform.resources.kpi.statementsToApprove": "Statements to approve",
    "home.platform.resources.kpi.correctionsToApprove":
      "Corrections to approve",

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
    "home.parent.help.toggle": "Help on this page",
    "home.parent.help.title": "Your family space",
    "home.parent.help.close": "Close",
    "home.parent.help.section1Title": "Your children",
    "home.parent.help.section1Body":
      "Every child enrolled under your account appears as a card, with their name and class. The badge next to the title shows the total number of children linked to your account. Tap a child's card to open their personal space (timetable, grades, homework, discipline, class feed...).",
    "home.parent.help.section2Title": "Quick access",
    "home.parent.help.section2Body":
      'These four shortcuts take you straight to the most visited sections without going through the navigation menu: "News feed" (school and class posts), "Finance" (tuition fees and payments), "Messaging" (conversations with the school — a red badge shows the number of unread messages) and "Documents" (files shared by the school).',
    "home.parent.help.section3Title": "School news",
    "home.parent.help.section3Body":
      'The most recent posts aimed at the whole school appear here as a preview. Tap "See all" to open the full feed and browse its history.',
    "home.parent.help.section4Title": "Finding every other section",
    "home.parent.help.section4Body":
      "This page only shows the essentials. For everything else (account settings, other modules...), tap the Menu icon in the bottom bar: it opens the full navigation to every section available for your account.",

    "home.teacher.help.toggle": "Help on this page",
    "home.teacher.help.title": "Your teacher dashboard",
    "home.teacher.help.section1Title": "Your classes",
    "home.teacher.help.section1Body":
      "Each card represents a class assigned to you, with its student count and a quick summary (number of open homework, number of evaluations awaiting scores). Tap a card to open that class's quick menu (timetable, grades, discipline, class life).",
    "home.teacher.help.section2Title": "Unread messages",
    "home.teacher.help.section2Body":
      'This section shows your most recent unread messages, with sender and subject. The numbered badge shows how many messages are still unread. Tap a message to open it directly, or "Messaging" to access your full inbox.',
    "home.teacher.help.section3Title": "Today's timetable",
    "home.teacher.help.section3Body":
      'This section lists today\'s lessons in chronological order, with their time slot and class. Tap "Agenda" to view the full weekly or monthly timetable.',
    "home.teacher.help.section4Title": "Evaluations to grade",
    "home.teacher.help.section4Body":
      'This section lists your evaluations whose scores haven\'t been fully entered yet, with a badge showing their count. Tap "Grade book" to open the full module and complete the grading.',
    "home.teacher.help.section5Title": "Ongoing homework",
    "home.teacher.help.section5Body":
      "This section lists the homework you've assigned whose due date hasn't passed yet, with its class and due date. Tap \"See all\" to manage all of your homework.",
    "home.teacher.help.close": "Got it",

    "onboardingTour.teacherHome.step1Title": "Your classes",
    "onboardingTour.teacherHome.step1Body":
      "Tap a class card to quickly open its timetable, grades, discipline or class life.",
    "onboardingTour.teacherHome.step2Title": "Pending evaluations",
    "onboardingTour.teacherHome.step2Body":
      'Tap "Grade book" to enter scores for evaluations awaiting grading.',
    "onboardingTour.teacherHome.step3Title": "Help is always available",
    "onboardingTour.teacherHome.step3Body":
      "Tap this button at any time to replay this dashboard overview.",

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
    "header.home.menuAction": "Menu",
    "header.home.logoutAction": "Sign out",
    "header.home.logoutConfirmTitle": "Sign out?",
    "header.home.logoutConfirmMessage":
      "You will be redirected to the login screen. Your local data will be cleared.",
    "header.home.logoutConfirmConfirm": "Sign out",
    "header.home.logoutConfirmCancel": "Cancel",

    // Schools module (platform)
    "schoolsAdmin.header.title": "Schools",
    "schoolsAdmin.header.subtitle": "Manage the platform's schools",
    "schoolsAdmin.tabs.synthese": "Overview",
    "schoolsAdmin.tabs.list": "List",
    "schoolsAdmin.tabs.help": "Help",
    "schoolsAdmin.search.placeholder": "Name, slug, city, region, country...",
    "schoolsAdmin.search.accessibilityLabel": "Search a school",
    "schoolsAdmin.filters.toggleAccessibilityLabel": "Filter schools",
    "schoolsAdmin.filters.cycleLabel": "Cycle",
    "schoolsAdmin.filters.languageLabel": "Language system",
    "schoolsAdmin.filters.allOption": "All",
    "schoolsAdmin.filters.apply": "Apply",
    "schoolsAdmin.filters.reset": "Reset",
    "schoolsAdmin.filters.close": "Close",
    "classesAdmin.header.title": "Classes",
    "classesAdmin.search.placeholder": "Search a class...",
    "classesAdmin.search.accessibilityLabel": "Search a class",
    "classesAdmin.filters.toggleAccessibilityLabel": "Filter classes",
    "classesAdmin.filters.levelLabel": "Level",
    "classesAdmin.filters.allOption": "All",
    "classesAdmin.filters.apply": "Apply",
    "classesAdmin.filters.reset": "Reset",
    "classesAdmin.filters.close": "Close",
    "classesAdmin.loading": "Loading classes…",
    "classesAdmin.loadMore": "Load more",
    "classesAdmin.levels.none": "No level",
    "classesAdmin.card.noReferent": "No referent teacher",
    "classesAdmin.fabCreate": "Create a class",
    "classesAdmin.empty.title": "No classes",
    "classesAdmin.empty.message":
      "Create your first class with the button below.",
    "classesAdmin.empty.titleSearch": "No results",
    "classesAdmin.empty.messageSearch":
      "No class matches your search or filters.",
    "classesAdmin.errors.load": "Unable to load classes.",
    "classesAdmin.form.headerTitle": "New class",
    "classesAdmin.form.heroTitle": "Create a class",
    "classesAdmin.form.heroSubtitle": "Fill in the new class information.",
    "classesAdmin.form.loadingOptions": "Loading options…",
    "classesAdmin.form.nameLabel": "Class name",
    "classesAdmin.form.namePlaceholder": "e.g. 6th A",
    "classesAdmin.form.levelLabel": "Level",
    "classesAdmin.form.levelPlaceholder": "Choose a level",
    "classesAdmin.form.trackLabel": "Track",
    "classesAdmin.form.trackPlaceholder": "Choose a track",
    "classesAdmin.form.curriculumLabel": "Curriculum",
    "classesAdmin.form.curriculumPlaceholder": "Choose a curriculum",
    "classesAdmin.form.referentLabel": "Referent teacher",
    "classesAdmin.form.referentPlaceholder": "Choose a teacher",
    "classesAdmin.form.capacityLabel": "Capacity",
    "classesAdmin.form.capacityPlaceholder": "e.g. 30",
    "classesAdmin.form.noneOption": "None",
    "classesAdmin.form.submit": "Create the class",
    "classesAdmin.form.successTitle": "Class created",
    "classesAdmin.form.successMessage": "The class was created successfully.",
    "classesAdmin.form.errorTitle": "Error",
    "classesAdmin.detail.fabViewStudents": "View students",
    "classesAdmin.referent.headerTitle": "Referent teacher",
    "classesAdmin.referent.heroTitle": "Set the referent teacher",
    "classesAdmin.referent.submit": "Save",
    "classesAdmin.referent.successTitle": "Referent teacher set",
    "classesAdmin.referent.successMessage":
      "The class referent teacher has been updated.",
    "classesAdmin.addStudent.headerTitle": "Add a student",
    "classesAdmin.addStudent.searchPlaceholder": "Search a student by name...",
    "classesAdmin.addStudent.loading": "Loading students…",
    "classesAdmin.addStudent.empty.title": "No students",
    "classesAdmin.addStudent.empty.message": "No student matches your search.",
    "classesAdmin.addStudent.successTitle": "Student added",
    "classesAdmin.addStudent.successMessageSuffix": "was added to the class.",
    "classesAdmin.students.headerTitle": "Students",
    "classesAdmin.students.tabLabel": "Students",
    "classesAdmin.students.fabAdd": "Add a student",
    "classesAdmin.students.fabReferent": "Referent teacher",
    "classesAdmin.students.loading": "Loading…",
    "classesAdmin.students.studentsSuffix": "students",
    "classesAdmin.students.empty.title": "No students",
    "classesAdmin.students.empty.message":
      "No student is enrolled in this class yet.",
    "schoolsAdmin.access.deniedTitle": "Access denied",
    "schoolsAdmin.access.deniedMessage":
      "This module is restricted to platform administrators.",
    "schoolsAdmin.help.title": "How it works",
    "schoolsAdmin.help.body":
      "Create a school with its school admin, edit its information (cycle, language system) and track its user breakdown from its detail page.",
    "schoolsAdmin.help.example.title": "Concrete end-to-end example",
    "schoolsAdmin.help.example.intro":
      "Case of a secondary French-speaking school. Each step happens in its own module, in this order.",
    "schoolsAdmin.help.example.step1.title": "1. Create the school",
    "schoolsAdmin.help.example.step1.body":
      "Here, fill in name and slug, then choose the Cycle (Primary or Secondary) and the Language system (French-speaking, English-speaking or Bilingual). This choice is the pivot: it automatically determines which national catalog levels and curriculums will be visible for this school.",
    "schoolsAdmin.help.example.step2.title": "2. Nothing to do (automatic)",
    "schoolsAdmin.help.example.step2.body":
      'The national catalog (Cycle > Levels > Tracks > Curriculums > Subjects) already in place and matching the cycle and language automatically appears in the school\'s Curriculums module, flagged "national".',
    "schoolsAdmin.help.example.step3.title": "3. Standard case: nothing more",
    "schoolsAdmin.help.example.step3.body":
      "If the national catalog is enough, go straight to creating classes (step 6) using the national levels, tracks and curriculums.",
    "schoolsAdmin.help.example.step4.title":
      "4. (Optional) School-specific track",
    "schoolsAdmin.help.example.step4.body":
      "If the school needs a track missing from the national catalog, create it in the Curriculums module, Tracks tab. A track is attached to nothing until it is used in a curriculum.",
    "schoolsAdmin.help.example.step5.title":
      "5. (Optional) School-specific curriculum",
    "schoolsAdmin.help.example.step5.body":
      "If the national curriculum doesn't fit, create a school-specific curriculum in Curriculums combining a level (national or own) and, if needed, a track. Then attach subjects with coefficient and weekly hours.",
    "schoolsAdmin.help.example.step6.title": "6. Create a school year",
    "schoolsAdmin.help.example.step6.body":
      "In the School years module, create the current year for the school and set it as active.",
    "schoolsAdmin.help.example.step7.title": "7. Create a class",
    "schoolsAdmin.help.example.step7.body":
      "In the Classes module, choose the school year, then the level, the track (if needed) and the curriculum: national or school-specific, they are interchangeable. This combination sets the subjects and coefficients for the class's students.",
    "schoolsAdmin.empty.title": "No schools",
    "schoolsAdmin.empty.messageDefault": "Create the platform's first school.",
    "schoolsAdmin.empty.messageSearch": "No school matches your search.",

    "schoolsAdmin.cycle.PRIMARY": "Primary",
    "schoolsAdmin.cycle.SECONDARY": "Secondary",
    "schoolsAdmin.cycle.UNSET": "Unclassified",
    "schoolsAdmin.language.FRANCOPHONE": "French-speaking",
    "schoolsAdmin.language.ANGLOPHONE": "English-speaking",
    "schoolsAdmin.language.BILINGUAL": "Bilingual",

    "schoolsAdmin.synthese.overviewTitle": "Overview",
    "schoolsAdmin.synthese.totalSchools": "Schools",
    "schoolsAdmin.synthese.totalStudents": "Students",
    "schoolsAdmin.synthese.totalClasses": "Classes",
    "schoolsAdmin.synthese.byCycleTitle": "Breakdown by cycle",
    "schoolsAdmin.synthese.schoolsLabel": "schools",
    "schoolsAdmin.synthese.studentsLabel": "students",
    "schoolsAdmin.synthese.classesLabel": "classes",
    "schoolsAdmin.synthese.empty":
      "Nothing to summarize yet — no school has been created.",

    "schoolsAdmin.card.usersLabel": "users",
    "schoolsAdmin.card.classesLabel": "classes",
    "schoolsAdmin.card.studentsLabel": "students",
    "schoolsAdmin.card.academicYearPrefix": "Current year",
    "schoolsAdmin.card.noAcademicYear": "No active year",
    "schoolsAdmin.card.view": "View",
    "schoolsAdmin.card.edit": "Edit",
    "schoolsAdmin.card.delete": "Delete",

    "schoolsAdmin.fab.create": "Create a school",

    "schoolsAdmin.form.createHeroTitle": "New school",
    "schoolsAdmin.form.createHeroSubtitle":
      "Create an establishment and its school admin",
    "schoolsAdmin.form.editHeroTitle": "Edit school",
    "schoolsAdmin.form.editHeroSubtitle":
      "Update the establishment's information",
    "schoolsAdmin.form.name": "School name",
    "schoolsAdmin.form.namePlaceholder": "E.g: Vogt College",
    "schoolsAdmin.form.country": "Country",
    "schoolsAdmin.form.countryPlaceholder": "Cameroon",
    "schoolsAdmin.form.region": "Region",
    "schoolsAdmin.form.regionPlaceholder": "Choose a region",
    "schoolsAdmin.form.city": "City",
    "schoolsAdmin.form.cityPlaceholder": "Choose a city",
    "schoolsAdmin.form.cityPlaceholderNoRegion": "Choose a region first",
    "schoolsAdmin.form.cycle": "Cycle",
    "schoolsAdmin.form.cyclePlaceholder": "Select a cycle",
    "schoolsAdmin.form.languageSystem": "Language system",
    "schoolsAdmin.form.languageSystemPlaceholder": "Select a system",
    "schoolsAdmin.form.adminEmail": "School admin email",
    "schoolsAdmin.form.adminEmailPlaceholder": "admin@school.cm",
    "schoolsAdmin.form.adminPhone": "Phone",
    "schoolsAdmin.form.adminPhonePlaceholder": "699001122",
    "schoolsAdmin.form.adminPin": "Initial PIN",
    "schoolsAdmin.form.adminModeEmail": "Email",
    "schoolsAdmin.form.adminModePhone": "Phone + PIN",
    "schoolsAdmin.form.mainAdminTitle": "Main administrator",
    "schoolsAdmin.form.additionalAdminsTitle": "Additional administrators",
    "schoolsAdmin.form.additionalAdminTitle": "Administrator",
    "schoolsAdmin.form.addAdminButton": "+ Add an administrator",
    "schoolsAdmin.form.activationCodeBanner":
      "Activation code to share with the administrator",
    "schoolsAdmin.form.submitCreate": "Create school",
    "schoolsAdmin.form.submittingCreate": "Creating...",
    "schoolsAdmin.form.submitEdit": "Save",
    "schoolsAdmin.form.submittingEdit": "Saving...",
    "schoolsAdmin.form.cancel": "Cancel",
    "schoolsAdmin.form.errors.nameRequired": "The school name is required.",
    "schoolsAdmin.form.errors.emailRequired": "Email is required.",
    "schoolsAdmin.form.errors.phoneRequired": "Phone is required.",
    "schoolsAdmin.form.errors.pinInvalid":
      "The PIN must contain exactly 6 digits.",
    "schoolsAdmin.toast.additionalAdminsFailedTitle":
      "Some administrators could not be added",
    "schoolsAdmin.form.errors.emailInvalid":
      "The school admin email is invalid.",

    "schoolsAdmin.toast.createdTitle": "School created",
    "schoolsAdmin.toast.createdExisting":
      "The school was created and linked to the existing school admin.",
    "schoolsAdmin.toast.createdNew":
      "The school was created, an email was sent to the school admin.",
    "schoolsAdmin.toast.createFailedTitle": "Creation failed",
    "schoolsAdmin.toast.updatedTitle": "School updated",
    "schoolsAdmin.toast.updatedMessage": "The changes have been saved.",
    "schoolsAdmin.toast.updateFailedTitle": "Update failed",
    "schoolsAdmin.toast.deletedTitle": "School deleted",
    "schoolsAdmin.toast.deletedMessage":
      "The school has been removed from the platform.",
    "schoolsAdmin.toast.deleteFailedTitle": "Deletion failed",

    "schoolsAdmin.confirmDelete.title": "Delete school",
    "schoolsAdmin.confirmDelete.confirm": "Delete",
    "schoolsAdmin.confirmDelete.cancel": "Cancel",

    "schoolsAdmin.detail.headerSubtitlePrefix": "School",
    "schoolsAdmin.detail.loading": "Loading school...",
    "schoolsAdmin.detail.notFoundTitle": "School not found",
    "schoolsAdmin.detail.notFoundMessage":
      "This school no longer exists or was deleted.",
    "schoolsAdmin.detail.sections.identity": "General information",
    "schoolsAdmin.detail.sections.schoolSystem": "School system",
    "schoolsAdmin.detail.schoolSystemEmpty":
      "No track or curriculum configured for this school.",
    "schoolsAdmin.detail.schoolSystemTracksTitle": "Tracks",
    "schoolsAdmin.detail.schoolSystemNoTracks": "No track",
    "schoolsAdmin.detail.schoolSystemCurriculumsTitle": "Curriculums",
    "schoolsAdmin.detail.schoolSystemNoCurriculums": "No curriculum",
    "schoolsAdmin.detail.schoolSystemViewFull": "View full catalog",
    "schoolsAdmin.detail.sections.users": "Users (current year)",
    "schoolsAdmin.detail.sections.admins": "School administrators",
    "schoolsAdmin.detail.sections.stats": "Overall statistics",
    "schoolsAdmin.detail.location": "Location",
    "schoolsAdmin.detail.cycle": "Cycle",
    "schoolsAdmin.detail.language": "Language system",
    "schoolsAdmin.detail.noLocation": "Not provided",
    "schoolsAdmin.detail.noCycle": "Not provided",
    "schoolsAdmin.detail.noLanguage": "Not provided",
    "schoolsAdmin.detail.roleStaff": "Staff",
    "schoolsAdmin.detail.roleTeachers": "Teachers",
    "schoolsAdmin.detail.roleParents": "Parents",
    "schoolsAdmin.detail.roleStudents": "Students",
    "schoolsAdmin.detail.statsUsersTotal": "Users (total)",
    "schoolsAdmin.detail.statsClasses": "Classes",
    "schoolsAdmin.detail.statsStudentsTotal": "Students (total)",
    "schoolsAdmin.detail.statsGrades": "Grades recorded",
    "schoolsAdmin.detail.adminEmpty": "No school admin linked yet.",
    "schoolsAdmin.detail.addAdminTitle": "Add a school admin",
    "schoolsAdmin.detail.addAdminSubmit": "Add",
    "schoolsAdmin.detail.addAdminSubmitting": "Adding...",
    "schoolsAdmin.detail.addAdminSuccessTitle": "School admin added",
    "schoolsAdmin.detail.addAdminSuccessMessage":
      "The school admin has been linked to the school.",
    "schoolsAdmin.detail.addAdminFailedTitle": "Adding failed",
    "schoolsAdmin.detail.resendInvite": "Resend invite",
    "schoolsAdmin.detail.resendInviteSuccessTitle": "Invite resent",
    "schoolsAdmin.detail.resendInviteSuccessMessage":
      "A new email was sent to the school admin.",
    "schoolsAdmin.detail.resendInviteFailedTitle": "Sending failed",
    "schoolsAdmin.detail.pendingBadge": "Pending",
    "schoolsAdmin.detail.activeBadge": "Active",
    "schoolsAdmin.detail.removeAdmin": "Remove",
    "schoolsAdmin.detail.removeAdminLastAdminHint":
      "The last administrator cannot be removed.",
    "schoolsAdmin.detail.confirmRemoveAdminTitle": "Remove administrator",
    "schoolsAdmin.detail.confirmRemoveAdminMessage":
      "This person will lose administrator access to this school.",
    "schoolsAdmin.detail.confirmRemoveAdminConfirm": "Remove",
    "schoolsAdmin.detail.confirmRemoveAdminCancel": "Cancel",
    "schoolsAdmin.detail.removeAdminSuccessTitle": "Administrator removed",
    "schoolsAdmin.detail.removeAdminSuccessMessage":
      "The administrator has been removed from the school.",
    "schoolsAdmin.detail.removeAdminFailedTitle": "Removal failed",
    "schoolsAdmin.detail.activationCodeBanner":
      "Activation code to share with the administrator",

    "users.header.title": "Users",
    "users.search.placeholder": "Name, surname, email, phone…",
    "users.search.accessibilityLabel": "Search for a user",
    "users.filters.toggleAccessibilityLabel": "Filter users",
    "users.filters.roleLabel": "Role",
    "users.filters.accountLabel": "Account",
    "users.filters.yearLabel": "School year",
    "users.filters.allYears": "All years",
    "users.filters.yearHint":
      "Only available for the Student and Teacher roles.",
    "users.filters.close": "Close",
    "users.filters.reset": "Reset",
    "users.filters.apply": "Apply",
    "users.role.ALL": "All",
    "users.role.TEACHER": "Teachers",
    "users.role.PARENT": "Parents",
    "users.role.STUDENT": "Students",
    "users.role.SCHOOL_ADMIN": "Admins",
    "users.role.SCHOOL_MANAGER": "Managers",
    "users.role.SUPERVISOR": "Supervisors",
    "users.role.SCHOOL_ACCOUNTANT": "Accountants",
    "users.role.SCHOOL_STAFF": "Staff",
    "users.role.SCHOOL_HEALTH_OFFICER": "Health officers",
    "users.role.short.TEACHER": "TEA",
    "users.role.short.PARENT": "PAR",
    "users.role.short.STUDENT": "STU",
    "users.role.short.SCHOOL_ADMIN": "ADM",
    "users.role.short.SCHOOL_MANAGER": "MGR",
    "users.role.short.SUPERVISOR": "SUP",
    "users.role.short.SCHOOL_ACCOUNTANT": "ACC",
    "users.role.short.SCHOOL_STAFF": "STF",
    "users.role.short.SCHOOL_HEALTH_OFFICER": "HLT",
    "users.account.ALL": "All",
    "users.account.WITH_ACCOUNT": "With account",
    "users.account.WITHOUT_ACCOUNT": "Without account",
    "users.loading": "Loading users…",
    "users.endOfList": "All users have been loaded",
    "users.totalCount.singular": "{count} user",
    "users.totalCount.plural": "{count} users",
    "users.empty.title": "No users",
    "users.empty.message": "No users registered in this school.",
    "users.empty.titleSearch": "No results",
    "users.empty.messageSearch": "Adjust your search criteria.",
    "users.errors.loadFailed": "Unable to load users.",
    "users.create.fabAccessibilityLabel": "Create a user",
    "users.create.chooseType.title": "New user",
    "users.create.chooseType.subtitle": "Choose the type of account to create.",
    "users.create.hero.TEACHER.title": "Create a teacher",
    "users.create.hero.TEACHER.subtitle":
      "Phone + PIN or email + initial password.",
    "users.create.hero.STUDENT.title": "Create a student",
    "users.create.hero.STUDENT.subtitle":
      "Identity and class are required; account access is optional.",
    "users.create.hero.PARENT.title": "Create a parent",
    "users.create.hero.PARENT.subtitle":
      "Link the parent to a student, then enter their contact details.",
    "users.create.hero.SCHOOL_MANAGER.title": "Create a manager",
    "users.create.hero.SCHOOL_MANAGER.subtitle":
      "Phone + PIN or email + initial password.",
    "users.create.hero.SUPERVISOR.title": "Create a supervisor",
    "users.create.hero.SUPERVISOR.subtitle":
      "Phone + PIN or email + initial password.",
    "users.create.hero.SCHOOL_ACCOUNTANT.title": "Create an accountant",
    "users.create.hero.SCHOOL_ACCOUNTANT.subtitle":
      "Phone + PIN or email + initial password.",
    "users.create.hero.SCHOOL_STAFF.title": "Create a staff member",
    "users.create.hero.SCHOOL_STAFF.subtitle":
      "Phone + PIN or email + initial password.",
    "users.create.hero.SCHOOL_HEALTH_OFFICER.title": "Create a health officer",
    "users.create.hero.SCHOOL_HEALTH_OFFICER.subtitle":
      "Phone + PIN or email + initial password.",
    "users.create.contactMode.label": "Creation mode",
    "users.create.contactMode.phone": "Phone + PIN",
    "users.create.contactMode.email": "Email + password",
    "users.create.field.phone.label": "Phone",
    "users.create.field.phone.placeholder": "699001122",
    "users.create.field.pin.label": "Initial PIN",
    "users.create.field.pin.placeholder": "123456",
    "users.create.field.email.label": "Email",
    "users.create.field.email.placeholder": "name@school.cm",
    "users.create.field.password.label": "Initial password",
    "users.create.field.password.placeholder": "Password123",
    "users.create.field.firstName.label": "First name",
    "users.create.field.firstName.placeholder": "Student's first name",
    "users.create.field.lastName.label": "Last name",
    "users.create.field.lastName.placeholder": "Student's last name",
    "users.create.field.level.label": "Level",
    "users.create.field.level.placeholder": "Choose a level",
    "users.create.field.class.label": "Class",
    "users.create.field.class.placeholder": "Choose a class",
    "users.create.field.dateOfBirth.label": "Date of birth",
    "users.create.field.dateOfBirth.placeholder": "Select a date",
    "users.create.field.access.sectionTitle": "Access",
    "users.create.field.access.hint":
      'The student is created without an account. The account (username and password) is created afterwards via "Create access" on their profile.',
    "users.create.field.student.label": "Student to link",
    "users.create.field.student.placeholder": "Search for a student…",
    "users.create.field.student.noResults": "No student found.",
    "users.create.field.function.label": "Function (optional)",
    "users.create.field.function.placeholder": "Choose a function",
    "users.create.field.function.newPlaceholder":
      "New function (e.g. Librarian)",
    "users.create.field.function.add": "Add",
    "users.create.field.function.createError":
      "Could not create this function. Please try again.",
    "users.create.submit.TEACHER": "Create teacher",
    "users.create.submit.STUDENT": "Create student",
    "users.create.submit.PARENT": "Create parent",
    "users.create.submit.SCHOOL_MANAGER": "Create manager",
    "users.create.submit.SUPERVISOR": "Create supervisor",
    "users.create.submit.SCHOOL_ACCOUNTANT": "Create accountant",
    "users.create.submit.SCHOOL_STAFF": "Create staff member",
    "users.create.submit.SCHOOL_HEALTH_OFFICER": "Create health officer",
    "users.create.success.title": "User created",
    "users.create.success.message": "The account was created successfully.",
    "users.create.errors.title": "Unable to create",
    "users.assignParent.mode.existing": "Existing parent",
    "users.assignParent.mode.new": "New parent",
    "users.assignParent.new.submit": "Create and link the parent",
    "users.detail.forms.editRoles.title": "Edit roles",
    "users.detail.forms.editRoles.subtitle":
      "Check the roles to grant to this user.",
    "users.detail.forms.editRoles.submit": "Save roles",
    "users.detail.forms.assignTeacher.title": "New assignment",
    "users.detail.forms.assignTeacher.subtitle":
      "Link this teacher to a class and a subject.",
    "users.detail.forms.assignTeacher.submit": "Create assignment",
    "users.detail.forms.assignTeacher.schoolYear.label": "School year",
    "users.detail.forms.assignTeacher.schoolYear.placeholder": "Choose a year",
    "users.detail.forms.assignTeacher.class.label": "Class",
    "users.detail.forms.assignTeacher.class.placeholder": "Choose a class",
    "users.detail.forms.assignTeacher.subject.label": "Subject",
    "users.detail.forms.assignTeacher.subject.placeholder": "Choose a subject",
    "users.detail.forms.assignChild.title": "Assign a child",
    "users.detail.forms.assignChild.subtitle":
      "Search for the student to link to this parent.",
    "users.detail.forms.assignChild.submit": "Assign child",
    "users.detail.forms.assignChild.searchPlaceholder":
      "Student first or last name...",
    "users.detail.forms.assignChild.empty": "No student found.",
    "users.detail.forms.assignParent.title": "Link a parent",
    "users.detail.forms.assignParent.subtitle":
      "Search for an existing parent or create a new one.",
    "users.detail.forms.assignParent.submit": "Link parent",
    "users.detail.forms.assignParent.searchPlaceholder":
      "Parent first or last name...",
    "users.detail.forms.assignParent.empty": "No parent found.",
    "users.detail.forms.createAccess.title": "Create a student access",
    "users.detail.forms.createAccess.subtitle":
      "Generates a username and a temporary password.",
    "users.detail.forms.createAccess.submit": "Create access",
    "users.detail.forms.createAccess.usernameLabel": "Username",
    "users.detail.forms.createAccess.usernamePlaceholder": "e.g. JohnDOE",
    "users.detail.forms.createAccess.info":
      "A temporary password will be generated automatically. The student will have to change it on first login.",
    "users.detail.forms.createAccess.suggestionLoading":
      "Generating a unique username…",
    "users.detail.forms.createAccess.suggestionError":
      "Automatic suggestion unavailable. Check the username before creating the access.",
    "users.detail.forms.createAccess.errorMin":
      "The username must be at least 3 characters long.",
    "users.detail.forms.createAccess.errorAlnum": "Letters and digits only.",
    "users.detail.forms.createAccess.errorTaken":
      "This username is already taken. Choose another one.",
    "rooms.search.placeholder": "Search for a room",
    "rooms.search.accessibilityLabel": "Search for a room",
    "rooms.filters.toggleAccessibilityLabel": "Room filters",
    "rooms.filters.allOption": "All",
    "rooms.filters.statusLabel": "Status",
    "rooms.filters.status.AVAILABLE": "Available",
    "rooms.filters.status.UNAVAILABLE": "Unavailable",
    "rooms.filters.status.MAINTENANCE": "Maintenance",
    "rooms.filters.simultaneityLabel": "Simultaneity",
    "rooms.filters.simultaneity.SINGLE": "Single (1 slot)",
    "rooms.filters.simultaneity.MULTIPLE": "Multiple (>1 slot)",
    "rooms.filters.availabilityLabel": "Availability",
    "rooms.filters.availabilityFromDate": "From",
    "rooms.filters.availabilityToDate": "To",
    "rooms.filters.availabilityStartTime": "From",
    "rooms.filters.availabilityEndTime": "To",
    "rooms.filters.reset": "Reset",
    "rooms.filters.close": "Close",
    "rooms.filters.apply": "Apply",
    "rooms.empty.title": "No rooms",
    "rooms.empty.messageDefault": "Add a first room from the floating button.",
    "rooms.empty.messageSearch":
      "Adjust your search or filters to find a room.",
    "rooms.detail.headerTitle": "Room detail",
    "rooms.detail.infoTitle": "Information",
    "rooms.detail.capacityLabel": "Capacity",
    "rooms.detail.maxConcurrentSlotsLabel": "Max. simultaneous slots",
    "rooms.detail.statusLabel": "Status",
    "rooms.detail.descriptionLabel": "Description",
    "rooms.detail.noDescription": "No description",
    "rooms.detail.agendaTitle": "Occupancy agenda",
    "rooms.detail.viewWeek": "Week",
    "rooms.detail.viewMonth": "Month",
    "rooms.detail.loading": "Loading room...",
    "rooms.detail.errorLoad": "Unable to load this room.",
    "rooms.detail.notFound": "Room not found.",

    "health.title": "Health",
    "health.parent.help.menuLabel": "Help",
    "health.parent.help.title": "Health",
    "health.parent.help.close": "Close",
    "health.parent.help.section1Title": "Conditions",
    "health.parent.help.section1Body":
      "The Conditions tab groups your child's allergies, pathologies and long-standing instructions, with an alert level (info, warning, emergency) visible at a glance.",
    "health.parent.help.section2Title": "History",
    "health.parent.help.section2Body":
      "The History tab merges care received at school and events you report yourself, sorted from most recent to oldest.",
    "health.parent.help.section3Title": "Report an event",
    "health.parent.help.section3Body":
      "The + button at the bottom of the screen adds a health condition from the Conditions tab, or reports an event (illness, accident...) from the History tab. The referent teacher is automatically notified for a report.",
    "health.parent.tabs.conditions": "Conditions",
    "health.parent.tabs.history": "History",
    "health.parent.loading": "Loading…",
    "health.parent.search.placeholderConditions": "Search a condition…",
    "health.parent.search.placeholderHistory": "Search in history…",
    "health.parent.search.accessibilityLabel": "Search",
    "health.parent.filters.toggleAccessibilityLabel": "Filters",
    "health.parent.filters.reset": "Reset",
    "health.parent.filters.close": "Close",
    "health.parent.filters.apply": "Apply",
    "health.parent.filters.typeLabel": "Type",
    "health.parent.filters.allTypes": "All",
    "health.parent.filters.alertLevelLabel": "Alert level",
    "health.parent.filters.allLevels": "All",
    "health.parent.filters.statusLabel": "Status",
    "health.parent.filters.status.all": "All",
    "health.parent.filters.status.active": "Active",
    "health.parent.filters.status.inactive": "Resolved",
    "health.parent.filters.originLabel": "Origin",
    "health.parent.filters.allOrigins": "All",
    "health.parent.filters.originSchool": "School",
    "health.parent.filters.originParent": "You",
    "health.parent.filters.reportTypeLabel": "Report type",
    "health.parent.filters.allReportTypes": "All",
    "health.parent.empty.conditionsTitle": "No health condition",
    "health.parent.empty.conditionsSearch": "No condition matches your search.",
    "health.parent.empty.historyTitle": "No event",
    "health.parent.empty.historySearch": "No event matches your search.",
    "health.parent.fab.addCondition": "Add a condition",
    "health.parent.fab.addReport": "Report an event",
    "health.parent.form.cancel": "Cancel",
    "health.parent.form.active": "Condition still active",
    "health.parent.form.successTitle": "Saved",
    "health.parent.form.errorTitle": "Error",
    "health.parent.form.createConditionSuccess":
      "The health condition was added.",
    "health.parent.form.editConditionSuccess":
      "The health condition was updated.",
    "health.parent.form.createReportSuccess":
      "The event was reported to the school.",
    "health.parent.form.hero.createConditionTitle": "Add a condition",
    "health.parent.form.hero.createConditionSubtitle":
      "Allergy, pathology, treatment or special instruction.",
    "health.parent.form.hero.editConditionTitle": "Edit the condition",
    "health.parent.form.hero.editConditionSubtitle":
      "Update the information or mark it as resolved.",
    "health.parent.form.hero.createReportTitle": "Report an event",
    "health.parent.form.hero.createReportSubtitle":
      "Illness, accident, treatment... the referent teacher is automatically notified.",
    "health.parent.detail.editAction": "Edit",
    "health.parent.detail.statusLabel": "Status",
    "health.parent.detail.visibleToTeachers": "Visible to the teaching team",
    "health.parent.detail.careBy": "Handled by",
    "health.parent.detail.reportedBy": "Reported by",
    "health.parent.detail.followUpNeeded": "Follow-up needed",
    "health.parent.detail.origin.school": "School",
    "health.parent.detail.origin.parent": "You",
    "health.parent.detail.yes": "Yes",
    "health.parent.detail.no": "No",
    "health.parent.card.active": "Active",
    "health.parent.card.inactive": "Resolved",
    "health.tabs.conditions": "Important information",
    "health.tabs.care": "Care at school",
    "health.tabs.reports": "Events outside school",
    "health.tabs.history": "History",
    "health.conditions.empty": "No health information recorded.",
    "health.care.empty": "No care recorded at school.",
    "health.reports.empty": "No event reported.",
    "health.reports.acknowledged": "Acknowledged by the school",
    "health.reports.pending": "Awaiting review by the school",
    "health.reports.acknowledgeAction": "Mark as acknowledged",
    "health.history.empty": "No item in the history.",
    "health.form.conditionType": "Type",
    "health.form.alertLevel": "Level",
    "health.form.label": "Label",
    "health.form.labelPlaceholder": "E.g. Peanut allergy",
    "health.form.description": "Description",
    "health.form.descriptionPlaceholder": "Describe the situation",
    "health.form.submitCondition": "Add this information",
    "health.form.reportType": "Event type",
    "health.form.submitReport": "Report this event",
    "health.form.sportRestriction": "Sport restriction attached",
    "health.form.careSummaryPlaceholder": "E.g. Fell in the yard",
    "health.form.submitCareEvent": "Record this care",
    "health.validation.labelRequired": "Label is required.",
    "health.validation.descriptionRequired": "Description is required.",
    "health.errors.load": "Unable to load health information.",
    "health.errors.createFailed": "Unable to save this information.",
    "health.alertLevel.INFO": "Information",
    "health.alertLevel.ATTENTION": "Attention",
    "health.alertLevel.URGENT": "Urgent",
    "health.conditionType.ALLERGY": "Allergy",
    "health.conditionType.PATHOLOGY": "Pathology",
    "health.conditionType.TREATMENT": "Treatment",
    "health.conditionType.INSTRUCTION": "Special instruction",
    "health.conditionType.OTHER": "Other",
    "health.reportType.MALADIE": "Illness",
    "health.reportType.TRAITEMENT": "Treatment",
    "health.reportType.ACCIDENT": "Accident",
    "health.reportType.CONSULTATION": "Medical consultation",
    "health.reportType.HOSPITALISATION": "Hospitalization",
    "health.reportType.VACCINATION": "Vaccination",
    "health.reportType.RESTRICTION_SPORT": "Sport restriction",
    "health.reportType.AUTRE": "Other",
    "health.school.searchPlaceholder": "Search a student…",
    "health.school.noStudent": "No student found.",
    "health.school.urgencyTitle": "Critical information",
    "health.school.contacts": "Contacts",
    "health.admin.tabs.synthese": "Summary",
    "health.admin.tabs.cares": "Cares",
    "health.admin.tabs.eleves": "Students",
    "health.admin.scope.school": "Whole school",
    "health.admin.scope.classLabel": "Class",
    "health.admin.scope.allClasses": "Whole school",
    "health.admin.stats.activeConditions": "Active conditions",
    "health.admin.stats.studentsWithConditions": "Students affected",
    "health.admin.stats.careEvents7d": "Cares (last 7 days)",
    "health.admin.stats.careEvents30d": "Cares (last 30 days)",
    "health.admin.stats.reportsPending": "Pending reports",
    "health.admin.stats.byAlertLevel": "Breakdown by alert level",
    "health.admin.stats.loading": "Loading statistics…",
    "health.admin.stats.error": "Unable to load statistics.",
    "health.admin.cares.search.placeholder": "Search a student…",
    "health.admin.cares.search.accessibilityLabel": "Search",
    "health.admin.cares.filters.toggleAccessibilityLabel": "Filters",
    "health.admin.cares.filters.reset": "Reset",
    "health.admin.cares.filters.close": "Close",
    "health.admin.cares.filters.apply": "Apply",
    "health.admin.cares.filters.alertLevelLabel": "Alert level",
    "health.admin.cares.filters.allLevels": "All",
    "health.admin.cares.filters.reportTypeLabel": "Report type",
    "health.admin.cares.filters.allReportTypes": "All",
    "health.admin.cares.filters.statusLabel": "Status",
    "health.admin.cares.filters.statusAll": "All",
    "health.admin.cares.filters.statusAcknowledged": "Acknowledged",
    "health.admin.cares.filters.statusPending": "Pending",
    "health.admin.cares.empty.title": "No report",
    "health.admin.cares.empty.default": "No report yet.",
    "health.admin.cares.empty.search": "No report matches your search.",
    "health.admin.cares.card.pending": "Pending",
    "health.admin.cares.card.acknowledged": "Acknowledged",
    "health.admin.eleves.search.placeholder": "Search a student…",
    "health.admin.eleves.search.accessibilityLabel": "Search",
    "health.admin.eleves.filters.toggleAccessibilityLabel": "Filters",
    "health.admin.eleves.filters.reset": "Reset",
    "health.admin.eleves.filters.close": "Close",
    "health.admin.eleves.filters.apply": "Apply",
    "health.admin.eleves.filters.classLabel": "Class",
    "health.admin.eleves.filters.allClasses": "All",
    "health.admin.eleves.empty.title": "No student",
    "health.admin.eleves.empty.default": "No student yet.",
    "health.admin.eleves.empty.search": "No student matches your search.",
    "health.admin.eleves.card.ageUnit": "yo",
    "health.admin.eleves.card.noClass": "No class",
    "health.admin.profile.tabs.cares": "Cares",
    "health.admin.profile.tabs.conditions": "Conditions",
    "health.admin.profile.hero.noClass": "No class",
    "health.admin.profile.hero.ageUnknown": "Age unknown",
    "health.admin.profile.fab.addCare": "Add a care",
    "health.admin.profile.form.hero.createTitle": "Add a care",
    "health.admin.profile.form.hero.createSubtitle":
      "Record a care given to the student.",
    "health.admin.profile.form.hero.editTitle": "Edit the care",
    "health.admin.profile.form.hero.editSubtitle":
      "Update this care's information.",
    "health.admin.profile.form.submitEdit": "Save changes",
    "health.admin.profile.toasts.careCreatedTitle": "Care saved",
    "health.admin.profile.toasts.careCreatedMessage":
      "The care was added successfully.",
    "health.admin.profile.toasts.careUpdatedTitle": "Care updated",
    "health.admin.profile.toasts.careUpdatedMessage":
      "The care was updated successfully.",
    "health.admin.profile.errors.load": "Unable to load the health profile.",
    "health.admin.profile.errors.saveGeneric": "Unable to save this care.",
    "health.admin.profile.empty.caresTitle": "No care",
    "health.admin.profile.empty.cares": "No care recorded.",
    "health.admin.profile.empty.conditionsTitle": "No condition",
    "health.admin.profile.empty.conditions": "No health condition recorded.",
    "health.admin.profile.editAction": "Edit",
    "health.admin.profile.byPrefix": "by",
    "onboardingTour.healthParent.tabsTitle": "2 tabs to find things easily",
    "onboardingTour.healthParent.tabsBody":
      "Conditions groups allergies, pathologies and long-standing instructions. History groups care received at school and events you report, sorted by date.",
    "onboardingTour.healthParent.searchTitle": "Search and filters",
    "onboardingTour.healthParent.searchBody":
      "Search by keyword and refine with filters (type, alert level...) on each tab.",
    "onboardingTour.healthParent.fabTitle": "Add information",
    "onboardingTour.healthParent.fabBody":
      "The + button adds a health condition (Conditions tab) or reports an event outside school (History tab). The referent teacher is automatically notified for a report.",
    "onboardingTour.healthParent.helpToggleTitle": "Help is always available",
    "onboardingTour.healthParent.helpToggleBody":
      'Tap this button, then "Help" in the menu, to find how this screen works at any time.',
    "onboardingTour.healthSchool.tabsTitle": "3 tabs to find things easily",
    "onboardingTour.healthSchool.tabsBody":
      "Summary groups the school's or a class's statistics. Cares lists parent reports, from most recent to oldest. Students lets you find each student's health profile.",
    "onboardingTour.healthSchool.searchTitle": "Search and filters",
    "onboardingTour.healthSchool.searchBody":
      "Search a student and refine results with filters (alert level, type, class…).",
    "onboardingTour.healthSchool.studentFabTitle": "Student profile",
    "onboardingTour.healthSchool.studentFabBody":
      "Open a student's profile to see their cares and health conditions, and use the + button to record a new care.",
  },
};
