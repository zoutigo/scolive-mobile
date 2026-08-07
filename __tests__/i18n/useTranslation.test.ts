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

describe("timetable.childAgenda.help.* translations", () => {
  it("has matching, non-empty fr/en keys", () => {
    const frKeys = Object.keys(translations.fr).filter((key) =>
      key.startsWith("timetable.childAgenda.help."),
    );
    const enKeys = Object.keys(translations.en).filter((key) =>
      key.startsWith("timetable.childAgenda.help."),
    );

    expect(frKeys.length).toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(frKeys));

    for (const key of frKeys) {
      expect(translations.fr[key]).not.toBe("");
      expect(translations.en[key]).not.toBe("");
    }
  });
});

describe("aboutScreen.* / legalScreen.* / settings.about.* translations", () => {
  it("has matching, non-empty fr/en keys", () => {
    const prefixes = ["aboutScreen.", "legalScreen.", "settings.about."];
    const frKeys = Object.keys(translations.fr).filter((key) =>
      prefixes.some((prefix) => key.startsWith(prefix)),
    );
    const enKeys = Object.keys(translations.en).filter((key) =>
      prefixes.some((prefix) => key.startsWith(prefix)),
    );

    expect(frKeys.length).toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(frKeys));

    for (const key of frKeys) {
      expect(translations.fr[key]).not.toBe("");
      expect(translations.en[key]).not.toBe("");
    }
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

describe("onboardingTour.* translations", () => {
  it("has matching, non-empty fr/en keys", () => {
    const frKeys = Object.keys(translations.fr).filter((key) =>
      key.startsWith("onboardingTour."),
    );
    const enKeys = Object.keys(translations.en).filter((key) =>
      key.startsWith("onboardingTour."),
    );

    expect(frKeys.length).toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(frKeys));

    for (const key of frKeys) {
      expect(translations.fr[key]).not.toBe("");
      expect(translations.en[key]).not.toBe("");
    }
  });

  it("has the child-timetable pilot tour steps in both locales", () => {
    const requiredKeys = [
      "onboardingTour.common.next",
      "onboardingTour.common.finish",
      "onboardingTour.common.tapTarget",
      "onboardingTour.common.gotIt",
      "onboardingTour.childTimetable.step1Title",
      "onboardingTour.childTimetable.step1Body",
      "onboardingTour.childTimetable.step2Title",
      "onboardingTour.childTimetable.step2Body",
      "onboardingTour.childTimetable.step3Title",
      "onboardingTour.childTimetable.step3Body",
      "onboardingTour.childTimetable.step4Title",
      "onboardingTour.childTimetable.step4Body",
    ];

    for (const key of requiredKeys) {
      expect(translations.fr[key]).toBeTruthy();
      expect(translations.en[key]).toBeTruthy();
    }
  });

  it("has the vie-scolaire tour steps and help modal content in both locales", () => {
    const requiredKeys = [
      "onboardingTour.vieScolaire.step1Title",
      "onboardingTour.vieScolaire.step1Body",
      "onboardingTour.vieScolaire.step2Title",
      "onboardingTour.vieScolaire.step2Body",
      "onboardingTour.vieScolaire.step3Title",
      "onboardingTour.vieScolaire.step3Body",
      "discipline.vieScolaire.help.menuLabel",
      "discipline.vieScolaire.help.close",
      "discipline.vieScolaire.help.synthese.title",
      "discipline.vieScolaire.help.synthese.section1Title",
      "discipline.vieScolaire.help.synthese.section1Body",
      "discipline.vieScolaire.help.synthese.section2Title",
      "discipline.vieScolaire.help.synthese.section2Body",
      "discipline.vieScolaire.help.absences.title",
      "discipline.vieScolaire.help.absences.section1Title",
      "discipline.vieScolaire.help.absences.section1Body",
      "discipline.vieScolaire.help.sanctions.title",
      "discipline.vieScolaire.help.sanctions.section1Title",
      "discipline.vieScolaire.help.sanctions.section1Body",
    ];

    for (const key of requiredKeys) {
      expect(translations.fr[key]).toBeTruthy();
      expect(translations.en[key]).toBeTruthy();
    }
  });

  it("has the parent-landing tour steps in both locales", () => {
    const requiredKeys = [
      "onboardingTour.parentLanding.step1Title",
      "onboardingTour.parentLanding.step1Body",
      "onboardingTour.parentLanding.step2Title",
      "onboardingTour.parentLanding.step2Body",
      "onboardingTour.parentLanding.step3Title",
      "onboardingTour.parentLanding.step3Body",
      "onboardingTour.parentLanding.step4Title",
      "onboardingTour.parentLanding.step4Body",
      "onboardingTour.parentLanding.step5Title",
      "onboardingTour.parentLanding.step5Body",
    ];

    for (const key of requiredKeys) {
      expect(translations.fr[key]).toBeTruthy();
      expect(translations.en[key]).toBeTruthy();
    }
  });

  it("has the teacher-agenda tour steps and per-tab help modal content in both locales", () => {
    const requiredKeys = [
      "onboardingTour.teacherAgenda.step1Title",
      "onboardingTour.teacherAgenda.step1Body",
      "onboardingTour.teacherAgenda.step2Title",
      "onboardingTour.teacherAgenda.step2Body",
      "onboardingTour.teacherAgenda.step3Title",
      "onboardingTour.teacherAgenda.step3Body",
      "onboardingTour.teacherAgenda.step4Title",
      "onboardingTour.teacherAgenda.step4Body",
      "timetable.teacherAgenda.help.menuLabel",
      "timetable.teacherAgenda.help.close",
      "timetable.teacherAgenda.help.mine.title",
      "timetable.teacherAgenda.help.mine.section1Title",
      "timetable.teacherAgenda.help.mine.section1Body",
      "timetable.teacherAgenda.help.mine.section2Title",
      "timetable.teacherAgenda.help.mine.section2Body",
      "timetable.teacherAgenda.help.mine.section3Title",
      "timetable.teacherAgenda.help.mine.section3Body",
      "timetable.teacherAgenda.help.classes.title",
      "timetable.teacherAgenda.help.classes.section1Title",
      "timetable.teacherAgenda.help.classes.section1Body",
      "timetable.teacherAgenda.help.classes.section2Title",
      "timetable.teacherAgenda.help.classes.section2Body",
      "timetable.teacherAgenda.help.classes.section3Title",
      "timetable.teacherAgenda.help.classes.section3Body",
    ];

    for (const key of requiredKeys) {
      expect(translations.fr[key]).toBeTruthy();
      expect(translations.en[key]).toBeTruthy();
    }
  });

  it("has the teacher-notes tour steps and per-tab help modal content in both locales", () => {
    const requiredKeys = [
      "onboardingTour.teacherNotes.step1Title",
      "onboardingTour.teacherNotes.step1Body",
      "onboardingTour.teacherNotes.step2Title",
      "onboardingTour.teacherNotes.step2Body",
      "onboardingTour.teacherNotes.step3Title",
      "onboardingTour.teacherNotes.step3Body",
      "onboardingTour.teacherNotes.step4Title",
      "onboardingTour.teacherNotes.step4Body",
      "notes.manager.help.menuLabel",
      "notes.manager.help.close",
      "notes.manager.help.evaluations.title",
      "notes.manager.help.evaluations.section1Title",
      "notes.manager.help.evaluations.section1Body",
      "notes.manager.help.evaluations.section2Title",
      "notes.manager.help.evaluations.section2Body",
      "notes.manager.help.evaluations.section3Title",
      "notes.manager.help.evaluations.section3Body",
      "notes.manager.help.notes.title",
      "notes.manager.help.notes.section1Title",
      "notes.manager.help.notes.section1Body",
      "notes.manager.help.reports.title",
      "notes.manager.help.reports.section1Title",
      "notes.manager.help.reports.section1Body",
    ];

    for (const key of requiredKeys) {
      expect(translations.fr[key]).toBeTruthy();
      expect(translations.en[key]).toBeTruthy();
    }
  });

  it("has the teacher-discipline tour steps and per-tab help modal content in both locales", () => {
    const requiredKeys = [
      "onboardingTour.teacherDiscipline.step1Title",
      "onboardingTour.teacherDiscipline.step1Body",
      "onboardingTour.teacherDiscipline.step2Title",
      "onboardingTour.teacherDiscipline.step2Body",
      "onboardingTour.teacherDiscipline.step3Title",
      "onboardingTour.teacherDiscipline.step3Body",
      "onboardingTour.teacherDiscipline.step4Title",
      "onboardingTour.teacherDiscipline.step4Body",
      "discipline.teacherHelp.menuLabel",
      "discipline.teacherHelp.close",
      "discipline.teacherHelp.events.title",
      "discipline.teacherHelp.events.section1Title",
      "discipline.teacherHelp.events.section1Body",
      "discipline.teacherHelp.events.section2Title",
      "discipline.teacherHelp.events.section2Body",
      "discipline.teacherHelp.carnets.title",
      "discipline.teacherHelp.carnets.section1Title",
      "discipline.teacherHelp.carnets.section1Body",
    ];

    for (const key of requiredKeys) {
      expect(translations.fr[key]).toBeTruthy();
      expect(translations.en[key]).toBeTruthy();
    }
  });

  it("has the teacher-class-feed (Vie de classe) sub-chapter help content in both locales", () => {
    const requiredKeys = [
      "feed.classLife.help.menuLabel",
      "feed.classLife.help.section1Title",
      "feed.classLife.help.section1Body",
      "feed.classLife.help.section2Title",
      "feed.classLife.help.section2Body",
      "feed.classLife.help.section3Title",
      "feed.classLife.help.section3Body",
      "feed.classLife.help.section4Title",
      "feed.classLife.help.section4Body",
      "feed.classLife.help.section5Title",
      "feed.classLife.help.section5Body",
      "feed.classLife.help.section6Title",
      "feed.classLife.help.section6Body",
      "feed.classLife.help.section7Title",
      "feed.classLife.help.section7Body",
    ];

    for (const key of requiredKeys) {
      expect(translations.fr[key]).toBeTruthy();
      expect(translations.en[key]).toBeTruthy();
    }
  });

  it("has the teacher-home tour steps and help modal content in both locales", () => {
    const requiredKeys = [
      "onboardingTour.teacherHome.step1Title",
      "onboardingTour.teacherHome.step1Body",
      "onboardingTour.teacherHome.step2Title",
      "onboardingTour.teacherHome.step2Body",
      "onboardingTour.teacherHome.step3Title",
      "onboardingTour.teacherHome.step3Body",
      "home.teacher.help.toggle",
      "home.teacher.help.title",
      "home.teacher.help.section1Title",
      "home.teacher.help.section1Body",
      "home.teacher.help.section2Title",
      "home.teacher.help.section2Body",
      "home.teacher.help.section3Title",
      "home.teacher.help.section3Body",
      "home.teacher.help.section4Title",
      "home.teacher.help.section4Body",
      "home.teacher.help.section5Title",
      "home.teacher.help.section5Body",
      "home.teacher.help.close",
    ];

    for (const key of requiredKeys) {
      expect(translations.fr[key]).toBeTruthy();
      expect(translations.en[key]).toBeTruthy();
    }
  });

  it("has the parent-landing help modal content in both locales", () => {
    const requiredKeys = [
      "home.parent.help.toggle",
      "home.parent.help.title",
      "home.parent.help.section1Title",
      "home.parent.help.section1Body",
      "home.parent.help.section2Title",
      "home.parent.help.section2Body",
      "home.parent.help.section3Title",
      "home.parent.help.section3Body",
      "home.parent.help.section4Title",
      "home.parent.help.section4Body",
      "home.parent.help.close",
    ];

    for (const key of requiredKeys) {
      expect(translations.fr[key]).toBeTruthy();
      expect(translations.en[key]).toBeTruthy();
    }
  });
});

describe("settings.onboardingHelp.* translations", () => {
  it("has matching, non-empty fr/en keys", () => {
    const frKeys = Object.keys(translations.fr).filter(
      (key) =>
        key.startsWith("settings.onboardingHelp.") ||
        key.startsWith("settings.form.onboardingHelp."),
    );
    const enKeys = Object.keys(translations.en).filter(
      (key) =>
        key.startsWith("settings.onboardingHelp.") ||
        key.startsWith("settings.form.onboardingHelp."),
    );

    expect(frKeys.length).toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(frKeys));

    for (const key of frKeys) {
      expect(translations.fr[key]).not.toBe("");
      expect(translations.en[key]).not.toBe("");
    }
  });
});

describe("settings.form.resetOnboardingTours.* translations", () => {
  it("has matching, non-empty fr/en keys", () => {
    const frKeys = Object.keys(translations.fr).filter((key) =>
      key.startsWith("settings.form.resetOnboardingTours."),
    );
    const enKeys = Object.keys(translations.en).filter((key) =>
      key.startsWith("settings.form.resetOnboardingTours."),
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

describe("siteContentAdmin.* and onboardingTour.siteContent.* translations", () => {
  it("has matching, non-empty fr/en keys", () => {
    const frKeys = Object.keys(translations.fr).filter(
      (key) =>
        key.startsWith("siteContentAdmin.") ||
        key.startsWith("onboardingTour.siteContent."),
    );
    const enKeys = Object.keys(translations.en).filter(
      (key) =>
        key.startsWith("siteContentAdmin.") ||
        key.startsWith("onboardingTour.siteContent."),
    );

    expect(frKeys.length).toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(frKeys));

    for (const key of frKeys) {
      expect(translations.fr[key]).not.toBe("");
      expect(translations.en[key]).not.toBe("");
    }
  });
});
