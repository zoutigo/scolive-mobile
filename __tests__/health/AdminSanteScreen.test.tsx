import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import AdminSanteScreenRoute from "../../app/(home)/admin-sante/index";
import { healthApi } from "../../src/api/health.api";
import { teachersApi } from "../../src/api/teachers.api";
import { useAuthStore } from "../../src/store/auth.store";
import type {
  SchoolHealthReportItem,
  SchoolHealthStats,
  SchoolHealthStudentSummary,
} from "../../src/types/health.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/health.api");
jest.mock("../../src/api/teachers.api");
jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: mockPush,
    canGoBack: () => false,
    navigate: jest.fn(),
  }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => {
      callback();
    }, [callback]);
  },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const api = healthApi as jest.Mocked<typeof healthApi>;
const teachers = teachersApi as jest.Mocked<typeof teachersApi>;

function paginated<T>(items: T[], page = 1, limit = 20, total = items.length) {
  return { items, page, limit, total };
}

const STATS: SchoolHealthStats = {
  scope: "SCHOOL",
  classId: null,
  activeConditionsByAlertLevel: { INFO: 2, ATTENTION: 1, URGENT: 3 },
  activeConditionsTotal: 6,
  studentsWithActiveConditions: 4,
  careEventsLast7Days: 5,
  careEventsLast30Days: 20,
  reportsPendingAcknowledgement: 2,
};

const REPORT_1: SchoolHealthReportItem = {
  id: "report-1",
  type: "ACCIDENT",
  alertLevel: "URGENT",
  description: "Crise d'asthme",
  sportRestriction: false,
  createdAt: new Date("2026-02-05T10:00:00Z").toISOString(),
  acknowledgedAt: null,
  student: {
    id: "student-1",
    firstName: "Nathan",
    lastName: "Mbele",
    class: { id: "class-1", name: "CM2 A" },
  },
  reportedByUser: { firstName: "Jean", lastName: "Mbele" },
  acknowledgedByUser: null,
};

const STUDENT_1: SchoolHealthStudentSummary = {
  id: "student-1",
  firstName: "Nathan",
  lastName: "Mbele",
  class: { id: "class-1", name: "CM2 A" },
  birthDate: "2015-08-04",
  age: 11,
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    user: {
      id: "officer-1",
      firstName: "Marie",
      lastName: "Ateba",
      schoolName: "Collège Vogt",
      onboardingHelpEnabled: false,
      activeRole: "SCHOOL_HEALTH_OFFICER",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "SCHOOL_HEALTH_OFFICER" }],
      profileCompleted: true,
    },
  } as never);

  teachers.listClassrooms.mockResolvedValue([
    {
      id: "class-1",
      name: "CM2 A",
      schoolYear: { id: "year-1", label: "2025-2026" },
    },
  ] as never);
  api.getSchoolStats.mockResolvedValue(STATS);
  api.listSchoolReports.mockResolvedValue(paginated([]));
  api.listSchoolStudents.mockResolvedValue(paginated([]));
});

describe("AdminSanteScreen — onglet Synthèse", () => {
  it("charge et affiche les statistiques école au montage", async () => {
    render(<AdminSanteScreenRoute />);

    await waitFor(() => {
      expect(
        screen.getByTestId("admin-kpi-active-conditions"),
      ).toBeOnTheScreen();
    });
    expect(api.getSchoolStats).toHaveBeenCalledWith("college-vogt", {
      classId: undefined,
    });
    expect(screen.getByText("6")).toBeOnTheScreen();
    expect(screen.getByText("4")).toBeOnTheScreen();
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    api.getSchoolStats.mockRejectedValueOnce(new Error("boom"));
    render(<AdminSanteScreenRoute />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-synthese-error")).toBeOnTheScreen();
    });
  });
});

describe("AdminSanteScreen — onglet Cares", () => {
  async function goToCaresTab() {
    render(<AdminSanteScreenRoute />);
    fireEvent.press(screen.getByTestId("admin-sante-tab-cares"));
    await waitFor(() => expect(api.listSchoolReports).toHaveBeenCalled());
  }

  it("charge les signalements au changement d'onglet, page 1 par défaut", async () => {
    api.listSchoolReports.mockResolvedValueOnce(paginated([REPORT_1]));
    await goToCaresTab();

    await waitFor(() => {
      expect(screen.getByText("Mbele Nathan")).toBeOnTheScreen();
    });
    expect(api.listSchoolReports).toHaveBeenCalledWith(
      "college-vogt",
      expect.objectContaining({ page: 1, search: "" }),
    );
  });

  it("recherche live avec debounce puis appelle l'API avec le terme saisi", async () => {
    await goToCaresTab();
    api.listSchoolReports.mockClear();

    fireEvent.changeText(
      screen.getByTestId("admin-cares-search-input"),
      "mbele",
    );
    await new Promise((resolve) => setTimeout(resolve, 650));

    await waitFor(() => {
      expect(api.listSchoolReports).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ search: "mbele" }),
      );
    });
  });

  it("le clear vide la recherche et relance sans terme", async () => {
    await goToCaresTab();
    fireEvent.changeText(
      screen.getByTestId("admin-cares-search-input"),
      "mbele",
    );
    await new Promise((resolve) => setTimeout(resolve, 650));
    api.listSchoolReports.mockClear();

    fireEvent.press(screen.getByTestId("admin-cares-search-clear"));
    await new Promise((resolve) => setTimeout(resolve, 650));

    await waitFor(() => {
      expect(api.listSchoolReports).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ search: "" }),
      );
    });
  });

  it("message vide dédié à la recherche sans résultat", async () => {
    await goToCaresTab();
    fireEvent.changeText(screen.getByTestId("admin-cares-search-input"), "zzz");
    await new Promise((resolve) => setTimeout(resolve, 650));

    await waitFor(() => {
      expect(
        screen.getByText("Aucun signalement ne correspond à votre recherche."),
      ).toBeOnTheScreen();
    });
  });

  it("bouton filtre inactif par défaut, actif après Apply", async () => {
    await goToCaresTab();
    const toggle = screen.getByTestId("admin-cares-filter-toggle");
    expect(StyleSheet_flatten(toggle.props.style).backgroundColor).not.toBe(
      "#247C72",
    );

    fireEvent.press(toggle);
    fireEvent.press(screen.getByTestId("admin-cares-filter-status-pending"));
    fireEvent.press(screen.getByTestId("admin-cares-filter-apply"));

    await waitFor(() => {
      expect(api.listSchoolReports).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          filters: expect.objectContaining({ acknowledged: false }),
        }),
      );
    });
    expect(screen.queryByTestId("admin-cares-filter-panel")).toBeNull();
  });

  it("sélectionne le dernier type de signalement de la liste déroulante (option non masquée par la barre d'actions)", async () => {
    await goToCaresTab();
    fireEvent.press(screen.getByTestId("admin-cares-filter-toggle"));
    fireEvent.press(screen.getByTestId("admin-cares-filter-reportType"));
    fireEvent.press(
      screen.getByTestId("admin-cares-filter-reportType-option-AUTRE"),
    );
    fireEvent.press(screen.getByTestId("admin-cares-filter-apply"));

    await waitFor(() => {
      expect(api.listSchoolReports).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          filters: expect.objectContaining({ reportType: "AUTRE" }),
        }),
      );
    });
  });

  it("Reset vide draft ET applied, panneau reste ouvert", async () => {
    await goToCaresTab();
    fireEvent.press(screen.getByTestId("admin-cares-filter-toggle"));
    fireEvent.press(screen.getByTestId("admin-cares-filter-status-pending"));
    fireEvent.press(screen.getByTestId("admin-cares-filter-apply"));
    await waitFor(() =>
      expect(screen.queryByTestId("admin-cares-filter-panel")).toBeNull(),
    );

    fireEvent.press(screen.getByTestId("admin-cares-filter-toggle"));
    fireEvent.press(screen.getByTestId("admin-cares-filter-reset"));

    expect(screen.getByTestId("admin-cares-filter-panel")).toBeOnTheScreen();
    await waitFor(() => {
      expect(api.listSchoolReports).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({
          filters: expect.objectContaining({ acknowledged: null }),
        }),
      );
    });
  });

  it("Close referme le panneau sans appliquer le brouillon en cours", async () => {
    await goToCaresTab();
    fireEvent.press(screen.getByTestId("admin-cares-filter-toggle"));
    fireEvent.press(screen.getByTestId("admin-cares-filter-status-pending"));
    api.listSchoolReports.mockClear();

    fireEvent.press(screen.getByTestId("admin-cares-filter-close"));

    expect(screen.queryByTestId("admin-cares-filter-panel")).toBeNull();
    expect(api.listSchoolReports).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId("admin-cares-filter-toggle"));
    const pendingChip = screen.getByTestId("admin-cares-filter-status-pending");
    expect(
      StyleSheet_flatten(pendingChip.props.style).backgroundColor,
    ).not.toBe("#247C72");
  });

  it("tap sur une card de signalement navigue vers la fiche élève", async () => {
    api.listSchoolReports.mockResolvedValueOnce(paginated([REPORT_1]));
    await goToCaresTab();

    await waitFor(() => screen.getByTestId("admin-cares-item-report-1"));
    fireEvent.press(screen.getByTestId("admin-cares-item-report-1"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(home)/admin-sante/[studentId]",
        params: expect.objectContaining({ studentId: "student-1" }),
      }),
    );
  });

  it("acquitte un signalement en attente sans naviguer vers la fiche élève", async () => {
    api.listSchoolReports.mockResolvedValue(paginated([REPORT_1]));
    api.acknowledgeReport.mockResolvedValue({
      ...REPORT_1,
      acknowledgedAt: "2026-02-06T08:00:00Z",
    });
    await goToCaresTab();

    await waitFor(() => screen.getByTestId("admin-cares-acknowledge-report-1"));
    fireEvent.press(screen.getByTestId("admin-cares-acknowledge-report-1"));

    await waitFor(() => {
      expect(api.acknowledgeReport).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        "report-1",
      );
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("n'affiche pas le bouton d'acquittement pour un signalement déjà acquitté", async () => {
    api.listSchoolReports.mockResolvedValueOnce(
      paginated([{ ...REPORT_1, acknowledgedAt: "2026-02-06T08:00:00Z" }]),
    );
    await goToCaresTab();

    await waitFor(() => screen.getByTestId("admin-cares-item-report-1"));
    expect(screen.queryByTestId("admin-cares-acknowledge-report-1")).toBeNull();
  });

  describe("pagination", () => {
    it("charge la page suivante au load-more, sans dupliquer la page 1", async () => {
      api.listSchoolReports.mockResolvedValueOnce(
        paginated([REPORT_1], 1, 1, 2),
      );
      await goToCaresTab();
      await waitFor(() => screen.getByTestId("admin-cares-list"));

      api.listSchoolReports.mockResolvedValueOnce(
        paginated([{ ...REPORT_1, id: "report-2" }], 2, 1, 2),
      );
      fireEvent(screen.getByTestId("admin-cares-list"), "onEndReached", {
        distanceFromEnd: 0,
      });

      await waitFor(() => {
        expect(api.listSchoolReports).toHaveBeenCalledWith(
          "college-vogt",
          expect.objectContaining({ page: 2 }),
        );
      });
    });

    it("ne charge pas de page suivante si hasMore est faux", async () => {
      api.listSchoolReports.mockResolvedValueOnce(
        paginated([REPORT_1], 1, 20, 1),
      );
      await goToCaresTab();
      await waitFor(() => screen.getByTestId("admin-cares-list"));
      api.listSchoolReports.mockClear();

      fireEvent(screen.getByTestId("admin-cares-list"), "onEndReached", {
        distanceFromEnd: 0,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(api.listSchoolReports).not.toHaveBeenCalled();
    });
  });
});

describe("AdminSanteScreen — onglet Élèves", () => {
  async function goToElevesTab() {
    render(<AdminSanteScreenRoute />);
    fireEvent.press(screen.getByTestId("admin-sante-tab-eleves"));
    await waitFor(() => expect(api.listSchoolStudents).toHaveBeenCalled());
  }

  it("charge les élèves au changement d'onglet, page 1 par défaut", async () => {
    api.listSchoolStudents.mockResolvedValueOnce(paginated([STUDENT_1]));
    await goToElevesTab();

    await waitFor(() => screen.getByText("Mbele Nathan"));
    expect(api.listSchoolStudents).toHaveBeenCalledWith(
      "college-vogt",
      expect.objectContaining({ page: 1, search: "" }),
    );
  });

  it("affiche la classe et l'âge de l'élève", async () => {
    api.listSchoolStudents.mockResolvedValueOnce(paginated([STUDENT_1]));
    await goToElevesTab();

    await waitFor(() => {
      expect(screen.getByText("CM2 A · 11 ans")).toBeOnTheScreen();
    });
  });

  it("filtre par classe et applique", async () => {
    await goToElevesTab();
    fireEvent.press(screen.getByTestId("admin-eleves-filter-toggle"));
    expect(screen.getByTestId("admin-eleves-filter-panel")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("admin-eleves-filter-apply"));

    await waitFor(() => {
      expect(api.listSchoolStudents).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({
          filters: expect.objectContaining({ classId: null }),
        }),
      );
    });
  });

  it("message vide dédié à la recherche sans résultat", async () => {
    await goToElevesTab();
    fireEvent.changeText(
      screen.getByTestId("admin-eleves-search-input"),
      "zzz",
    );
    await new Promise((resolve) => setTimeout(resolve, 650));

    await waitFor(() => {
      expect(
        screen.getByText("Aucun élève ne correspond à votre recherche."),
      ).toBeOnTheScreen();
    });
  });

  it("tap sur une card élève navigue vers sa fiche santé avec les métadonnées", async () => {
    api.listSchoolStudents.mockResolvedValueOnce(paginated([STUDENT_1]));
    await goToElevesTab();

    await waitFor(() => screen.getByTestId("admin-eleves-item-student-1"));
    fireEvent.press(screen.getByTestId("admin-eleves-item-student-1"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: "/(home)/admin-sante/[studentId]",
        params: expect.objectContaining({
          studentId: "student-1",
          firstName: "Nathan",
          lastName: "Mbele",
          className: "CM2 A",
          age: "11",
        }),
      }),
    );
  });

  describe("pagination", () => {
    it("charge la page suivante au load-more", async () => {
      api.listSchoolStudents.mockResolvedValueOnce(
        paginated([STUDENT_1], 1, 1, 2),
      );
      await goToElevesTab();
      await waitFor(() => screen.getByTestId("admin-eleves-list"));

      api.listSchoolStudents.mockResolvedValueOnce(
        paginated([{ ...STUDENT_1, id: "student-2" }], 2, 1, 2),
      );
      fireEvent(screen.getByTestId("admin-eleves-list"), "onEndReached", {
        distanceFromEnd: 0,
      });

      await waitFor(() => {
        expect(api.listSchoolStudents).toHaveBeenCalledWith(
          "college-vogt",
          expect.objectContaining({ page: 2 }),
        );
      });
    });

    it("un changement de recherche après un load-more relance en page 1", async () => {
      api.listSchoolStudents.mockResolvedValueOnce(
        paginated([STUDENT_1], 1, 1, 2),
      );
      await goToElevesTab();
      await waitFor(() => screen.getByTestId("admin-eleves-list"));
      api.listSchoolStudents.mockResolvedValueOnce(
        paginated([{ ...STUDENT_1, id: "student-2" }], 2, 1, 2),
      );
      fireEvent(screen.getByTestId("admin-eleves-list"), "onEndReached", {
        distanceFromEnd: 0,
      });
      await waitFor(() =>
        expect(api.listSchoolStudents).toHaveBeenCalledWith(
          "college-vogt",
          expect.objectContaining({ page: 2 }),
        ),
      );

      fireEvent.changeText(
        screen.getByTestId("admin-eleves-search-input"),
        "nat",
      );
      await new Promise((resolve) => setTimeout(resolve, 650));

      await waitFor(() => {
        expect(api.listSchoolStudents).toHaveBeenLastCalledWith(
          "college-vogt",
          expect.objectContaining({ page: 1, search: "nat" }),
        );
      });
    });
  });
});

function StyleSheet_flatten(style: unknown) {
  const { StyleSheet } = require("react-native");
  return StyleSheet.flatten(style) ?? {};
}
