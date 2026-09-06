import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import AdminHealthStudentScreenRoute from "../../app/(home)/admin-sante/[studentId]";
import { healthApi } from "../../src/api/health.api";
import { useAuthStore } from "../../src/store/auth.store";
import type {
  HealthHistoryItem,
  StudentHealthCareEvent,
  StudentHealthCondition,
} from "../../src/types/health.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/health.api");
jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
    canGoBack: () => false,
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    studentId: "student-1",
    firstName: "Nathan",
    lastName: "Mbele",
    className: "CM2 A",
    age: "11",
  }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const api = healthApi as jest.Mocked<typeof healthApi>;

function paginated<T>(items: T[], page = 1, limit = 20, total = items.length) {
  return { items, page, limit, total };
}

const CARE_EVENT_1: StudentHealthCareEvent = {
  id: "care-1",
  summary: "Chute dans la cour",
  description: "Genou éraflé",
  occurredAt: new Date("2026-02-01T10:00:00Z").toISOString(),
  alertLevel: "ATTENTION",
  followUpNeeded: false,
  authorUser: { firstName: "Marie", lastName: "Ateba" },
};

const REPORT_1_HISTORY: HealthHistoryItem = {
  kind: "REPORT",
  at: "2026-02-05T10:00:00Z",
  payload: {
    id: "report-1",
    type: "ACCIDENT",
    alertLevel: "URGENT",
    description: "Crise d'asthme",
    sportRestriction: false,
    createdAt: "2026-02-05T10:00:00Z",
    acknowledgedAt: null,
    reportedByUser: { firstName: "Jean", lastName: "Mbele" },
    acknowledgedByUser: null,
  },
};

const CARE_EVENT_HISTORY: HealthHistoryItem = {
  kind: "CARE_EVENT",
  at: CARE_EVENT_1.occurredAt,
  payload: CARE_EVENT_1,
};

const CONDITION_1: StudentHealthCondition = {
  id: "cond-1",
  type: "ALLERGY",
  alertLevel: "URGENT",
  label: "Allergie arachides",
  description: "Ne pas donner d'arachides",
  active: true,
  isVisibleToAllTeachers: false,
  publicAlertLabel: null,
  createdAt: new Date("2026-01-01T10:00:00Z").toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    user: {
      id: "officer-1",
      firstName: "Marie",
      lastName: "Ateba",
      onboardingHelpEnabled: false,
      activeRole: "SCHOOL_HEALTH_OFFICER",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "SCHOOL_HEALTH_OFFICER" }],
      profileCompleted: true,
    },
  } as never);

  api.getHistory.mockResolvedValue(paginated([]));
  api.listConditions.mockResolvedValue(paginated([]));
  api.createCareEvent.mockResolvedValue(CARE_EVENT_1);
  api.updateCareEvent.mockResolvedValue({ ...CARE_EVENT_1, summary: "Maj" });
});

describe("AdminSanteStudentScreen — hero", () => {
  it("affiche le nom, la classe et l'âge de l'élève", async () => {
    render(<AdminHealthStudentScreenRoute />);

    await waitFor(() => screen.getByTestId("admin-sante-student-hero"));
    const hero = within(screen.getByTestId("admin-sante-student-hero"));
    expect(hero.getByText("Mbele Nathan")).toBeOnTheScreen();
    expect(hero.getByText("CM2 A · 11 ans")).toBeOnTheScreen();
  });
});

describe("AdminSanteStudentScreen — onglet Cares", () => {
  it("charge l'historique fusionné au montage, du plus récent au plus ancien", async () => {
    api.getHistory.mockResolvedValueOnce(
      paginated([REPORT_1_HISTORY, CARE_EVENT_HISTORY]),
    );
    render(<AdminHealthStudentScreenRoute />);

    await waitFor(() => {
      expect(screen.getByText("Crise d'asthme")).toBeOnTheScreen();
      expect(screen.getByText("Chute dans la cour")).toBeOnTheScreen();
    });
    expect(api.getHistory).toHaveBeenCalledWith(
      "college-vogt",
      "student-1",
      expect.objectContaining({ page: 1 }),
    );
  });

  it("un item soin (école) affiche un lien Modifier, pas un signalement parent", async () => {
    api.getHistory.mockResolvedValueOnce(
      paginated([REPORT_1_HISTORY, CARE_EVENT_HISTORY]),
    );
    render(<AdminHealthStudentScreenRoute />);

    await waitFor(() => screen.getByTestId("care-event-edit-care-1"));
    expect(screen.queryByTestId("report-edit-report-1")).toBeNull();
  });

  it("message vide dédié quand aucun soin n'est enregistré", async () => {
    render(<AdminHealthStudentScreenRoute />);
    await waitFor(() => {
      expect(screen.getByText("Aucun soin enregistré.")).toBeOnTheScreen();
    });
  });

  it("acquitte un signalement en attente depuis la fiche élève", async () => {
    api.getHistory.mockResolvedValue(
      paginated([REPORT_1_HISTORY, CARE_EVENT_HISTORY]),
    );
    api.acknowledgeReport.mockResolvedValue({
      ...REPORT_1_HISTORY.payload,
      acknowledgedAt: "2026-02-06T08:00:00Z",
    });
    render(<AdminHealthStudentScreenRoute />);

    await waitFor(() =>
      expect(
        screen.getByTestId("report-acknowledge-report-1"),
      ).toBeOnTheScreen(),
    );
    fireEvent.press(screen.getByTestId("report-acknowledge-report-1"));

    await waitFor(() => {
      expect(api.acknowledgeReport).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        "report-1",
      );
    });
    expect(api.getHistory).toHaveBeenLastCalledWith(
      "college-vogt",
      "student-1",
      expect.objectContaining({ page: 1 }),
    );
  });

  it("n'affiche pas le bouton d'acquittement pour un signalement déjà acquitté", async () => {
    api.getHistory.mockResolvedValueOnce(
      paginated([
        {
          ...REPORT_1_HISTORY,
          payload: {
            ...REPORT_1_HISTORY.payload,
            acknowledgedAt: "2026-02-06T08:00:00Z",
          },
        },
      ]),
    );
    render(<AdminHealthStudentScreenRoute />);

    await waitFor(() => screen.getByText("Crise d'asthme"));
    expect(screen.queryByTestId("report-acknowledge-report-1")).toBeNull();
  });

  describe("pagination", () => {
    it("charge la page suivante au load-more", async () => {
      api.getHistory.mockResolvedValueOnce(
        paginated([CARE_EVENT_HISTORY], 1, 1, 2),
      );
      render(<AdminHealthStudentScreenRoute />);
      await waitFor(() => screen.getByTestId("admin-sante-student-cares-list"));

      api.getHistory.mockResolvedValueOnce(
        paginated(
          [
            {
              ...REPORT_1_HISTORY,
              payload: { ...REPORT_1_HISTORY.payload, id: "report-2" },
            },
          ],
          2,
          1,
          2,
        ),
      );
      fireEvent(
        screen.getByTestId("admin-sante-student-cares-list"),
        "onEndReached",
        {
          distanceFromEnd: 0,
        },
      );

      await waitFor(() => {
        expect(api.getHistory).toHaveBeenCalledWith(
          "college-vogt",
          "student-1",
          expect.objectContaining({ page: 2 }),
        );
      });
    });
  });
});

describe("AdminSanteStudentScreen — onglet Conditions", () => {
  it("charge les conditions au changement d'onglet", async () => {
    api.listConditions.mockResolvedValueOnce(paginated([CONDITION_1]));
    render(<AdminHealthStudentScreenRoute />);

    fireEvent.press(screen.getByTestId("admin-sante-student-tab-conditions"));

    await waitFor(() => {
      expect(screen.getByText("Allergie arachides")).toBeOnTheScreen();
    });
    expect(api.listConditions).toHaveBeenCalledWith(
      "college-vogt",
      "student-1",
      expect.objectContaining({ page: 1 }),
    );
  });

  it("message vide dédié quand aucune condition n'est enregistrée", async () => {
    render(<AdminHealthStudentScreenRoute />);
    fireEvent.press(screen.getByTestId("admin-sante-student-tab-conditions"));

    await waitFor(() => {
      expect(
        screen.getByText("Aucune condition de santé enregistrée."),
      ).toBeOnTheScreen();
    });
  });
});

describe("AdminSanteStudentScreen — FAB + formulaire soin (création/modification)", () => {
  it("le FAB ouvre le formulaire de création", async () => {
    render(<AdminHealthStudentScreenRoute />);
    await waitFor(() => screen.getByTestId("admin-sante-student-fab"));

    fireEvent.press(screen.getByTestId("admin-sante-student-fab"));

    expect(screen.getByTestId("admin-care-form")).toBeOnTheScreen();
    expect(screen.getByText("Ajouter un soin")).toBeOnTheScreen();
  });

  it("soumission création : appelle createCareEvent, toast, retour à l'onglet Cares", async () => {
    render(<AdminHealthStudentScreenRoute />);
    await waitFor(() => screen.getByTestId("admin-sante-student-fab"));
    fireEvent.press(screen.getByTestId("admin-sante-student-fab"));

    fireEvent.changeText(
      screen.getByTestId("care-form-summary"),
      "Petite coupure",
    );
    fireEvent.press(screen.getByTestId("care-form-alertLevel-ATTENTION"));
    fireEvent.press(screen.getByTestId("care-form-submit"));

    await waitFor(() => {
      expect(api.createCareEvent).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        {
          summary: "Petite coupure",
          alertLevel: "ATTENTION",
          description: undefined,
        },
      );
    });
    await waitFor(() => {
      expect(screen.queryByTestId("admin-care-form")).toBeNull();
    });
  });

  it("submit bloqué (bouton reste actif mais erreur inline) si le résumé est vide", async () => {
    render(<AdminHealthStudentScreenRoute />);
    await waitFor(() => screen.getByTestId("admin-sante-student-fab"));
    fireEvent.press(screen.getByTestId("admin-sante-student-fab"));

    fireEvent.press(screen.getByTestId("care-form-submit"));

    await waitFor(() => {
      expect(screen.getByTestId("care-form-summary-error")).toBeOnTheScreen();
    });
    expect(api.createCareEvent).not.toHaveBeenCalled();
  });

  it("le lien Modifier d'un soin ouvre le formulaire pré-rempli en édition", async () => {
    api.getHistory.mockResolvedValueOnce(paginated([CARE_EVENT_HISTORY]));
    render(<AdminHealthStudentScreenRoute />);
    await waitFor(() => screen.getByTestId("care-event-edit-care-1"));

    fireEvent.press(screen.getByTestId("care-event-edit-care-1"));

    expect(screen.getByTestId("admin-care-form")).toBeOnTheScreen();
    expect(screen.getByText("Modifier le soin")).toBeOnTheScreen();
    expect(screen.getByTestId("care-form-summary").props.value).toBe(
      "Chute dans la cour",
    );
  });

  it("soumission modification : appelle updateCareEvent avec l'id du soin édité", async () => {
    api.getHistory.mockResolvedValueOnce(paginated([CARE_EVENT_HISTORY]));
    render(<AdminHealthStudentScreenRoute />);
    await waitFor(() => screen.getByTestId("care-event-edit-care-1"));
    fireEvent.press(screen.getByTestId("care-event-edit-care-1"));

    fireEvent.changeText(
      screen.getByTestId("care-form-summary"),
      "Chute mise à jour",
    );
    fireEvent.press(screen.getByTestId("care-form-submit"));

    await waitFor(() => {
      expect(api.updateCareEvent).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
        "care-1",
        expect.objectContaining({ summary: "Chute mise à jour" }),
      );
    });
  });

  it("annuler depuis le formulaire revient à l'onglet Cares sans appeler l'API", async () => {
    render(<AdminHealthStudentScreenRoute />);
    await waitFor(() => screen.getByTestId("admin-sante-student-fab"));
    fireEvent.press(screen.getByTestId("admin-sante-student-fab"));

    fireEvent.press(screen.getByTestId("care-form-cancel"));

    expect(screen.queryByTestId("admin-care-form")).toBeNull();
    expect(api.createCareEvent).not.toHaveBeenCalled();
    expect(api.updateCareEvent).not.toHaveBeenCalled();
  });
});
