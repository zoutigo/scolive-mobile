import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_LOCALE } from "../../src/i18n/translations";
import {
  LOCALE_STORAGE_KEY,
  useLocaleStore,
} from "../../src/store/locale.store";

describe("locale.store", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useLocaleStore.setState({ locale: DEFAULT_LOCALE });
  });

  it("defaults to French", () => {
    expect(useLocaleStore.getState().locale).toBe("fr");
  });

  it("updates the locale via setLocale", () => {
    useLocaleStore.getState().setLocale("en");
    expect(useLocaleStore.getState().locale).toBe("en");
  });

  it("persists the chosen locale to AsyncStorage", async () => {
    useLocaleStore.getState().setLocale("en");

    await new Promise((resolve) => setTimeout(resolve, 0));

    const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toMatchObject({
      state: { locale: "en" },
    });
  });

  it("restores the persisted locale on rehydration", async () => {
    await AsyncStorage.setItem(
      LOCALE_STORAGE_KEY,
      JSON.stringify({ state: { locale: "en" }, version: 0 }),
    );

    await useLocaleStore.persist.rehydrate();

    expect(useLocaleStore.getState().locale).toBe("en");
  });
});
