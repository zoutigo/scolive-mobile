import { act, renderHook } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_LOCALE, translations } from "../../src/i18n/translations";
import { translate, useTranslation } from "../../src/i18n/useTranslation";
import { useLocaleStore } from "../../src/store/locale.store";

describe("translate", () => {
  it("returns the French string by default", () => {
    expect(translate("fr", "settings.language.title")).toBe(
      "Langue de cet appareil",
    );
  });

  it("returns the English string for the en locale", () => {
    expect(translate("en", "settings.language.title")).toBe(
      "Language of this device",
    );
  });

  it("falls back to the raw key when the key does not exist in any locale", () => {
    expect(translate("en", "does.not.exist")).toBe("does.not.exist");
  });
});

describe("homework.* translations", () => {
  it("has matching, non-empty fr/en keys", () => {
    const frKeys = Object.keys(translations.fr).filter((key) =>
      key.startsWith("homework."),
    );
    const enKeys = Object.keys(translations.en).filter((key) =>
      key.startsWith("homework."),
    );

    expect(frKeys.length).toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(frKeys));

    for (const key of frKeys) {
      expect(translations.fr[key]).not.toBe("");
      expect(translations.en[key]).not.toBe("");
    }
  });
});

describe("resources.* translations", () => {
  it("has matching, non-empty fr/en keys", () => {
    const frKeys = Object.keys(translations.fr).filter((key) =>
      key.startsWith("resources."),
    );
    const enKeys = Object.keys(translations.en).filter((key) =>
      key.startsWith("resources."),
    );

    expect(frKeys.length).toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(frKeys));

    for (const key of frKeys) {
      expect(translations.fr[key]).not.toBe("");
      expect(translations.en[key]).not.toBe("");
    }
  });
});

describe("schoolsAdmin.* translations", () => {
  it("has matching, non-empty fr/en keys", () => {
    const frKeys = Object.keys(translations.fr).filter((key) =>
      key.startsWith("schoolsAdmin."),
    );
    const enKeys = Object.keys(translations.en).filter((key) =>
      key.startsWith("schoolsAdmin."),
    );

    expect(frKeys.length).toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(frKeys));

    for (const key of frKeys) {
      expect(translations.fr[key]).not.toBe("");
      expect(translations.en[key]).not.toBe("");
    }
  });

  it("has the new admin-onboarding and location keys in both locales", () => {
    const requiredKeys = [
      "schoolsAdmin.form.adminModeEmail",
      "schoolsAdmin.form.adminModePhone",
      "schoolsAdmin.form.adminPhone",
      "schoolsAdmin.form.adminPin",
      "schoolsAdmin.form.mainAdminTitle",
      "schoolsAdmin.form.additionalAdminsTitle",
      "schoolsAdmin.form.addAdminButton",
      "schoolsAdmin.form.cityPlaceholderNoRegion",
      "schoolsAdmin.form.errors.emailRequired",
      "schoolsAdmin.form.errors.phoneRequired",
      "schoolsAdmin.form.errors.pinInvalid",
      "schoolsAdmin.detail.removeAdmin",
      "schoolsAdmin.detail.confirmRemoveAdminTitle",
      "schoolsAdmin.detail.removeAdminLastAdminHint",
    ];
    for (const key of requiredKeys) {
      expect(translations.fr[key]).toBeTruthy();
      expect(translations.en[key]).toBeTruthy();
    }
  });
});

describe("useTranslation", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useLocaleStore.setState({ locale: DEFAULT_LOCALE });
  });

  it("translates using the current locale and reacts to locale changes", () => {
    const { result } = renderHook(() => useTranslation());

    expect(result.current.locale).toBe("fr");
    expect(result.current.t("settings.language.title")).toBe(
      "Langue de cet appareil",
    );

    act(() => {
      result.current.setLocale("en");
    });

    expect(result.current.locale).toBe("en");
    expect(result.current.t("settings.language.title")).toBe(
      "Language of this device",
    );
  });
});
