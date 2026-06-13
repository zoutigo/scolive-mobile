export type Locale = "fr" | "en";

export const SUPPORTED_LOCALES: Locale[] = ["fr", "en"];

export const DEFAULT_LOCALE: Locale = "fr";

/**
 * Translation dictionaries, namespaced (e.g. "settings.language.title").
 * Keep `en` keys aligned with `fr` keys: useTranslation falls back fr -> key.
 */
export const translations: Record<Locale, Record<string, string>> = {
  fr: {
    "settings.language.title": "Langue",
    "settings.language.subtitle": "Choisissez la langue de l'application",
    "settings.language.hint":
      "La langue choisie est appliquée immédiatement et conservée sur cet appareil.",
    "settings.language.fr": "Français",
    "settings.language.en": "English",
  },
  en: {
    "settings.language.title": "Language",
    "settings.language.subtitle": "Choose the application language",
    "settings.language.hint":
      "The selected language is applied immediately and saved on this device.",
    "settings.language.fr": "Français",
    "settings.language.en": "English",
  },
};
