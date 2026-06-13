import { act, renderHook } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_LOCALE } from "../../src/i18n/translations";
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
