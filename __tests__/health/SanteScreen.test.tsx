import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import SanteScreenRoute from "../../app/(home)/sante/[childId]";
import { healthApi } from "../../src/api/health.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import type {
  StudentHealthCareEvent,
  StudentHealthCondition,
  StudentHealthReport,
} from "../../src/types/health.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/health.api");
jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    canGoBack: () => false,
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({ childId: "child-1" }),
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

const CARE_EVENT_1: StudentHealthCareEvent = {
  id: "care-1",
  summary: "Chute dans la cour",
  description: null,
  occurredAt: new Date("2026-02-01T10:00:00Z").toISOString(),
  alertLevel: "ATTENTION",
  followUpNeeded: false,
  authorUser: { firstName: "Marie", lastName: "Ateba" },
};

const REPORT_1: StudentHealthReport = {
  id: "report-1",
  type: "ACCIDENT",
  alertLevel: "ATTENTION",
  description: "Crise d'asthme",
  sportRestriction: false,
  createdAt: new Date("2026-02-05T10:00:00Z").toISOString(),
  acknowledgedAt: null,
  reportedByUser: { firstName: "Jean", lastName: "Mbele" },
  acknowledgedByUser: null,
};

function paginated<T>(items: T[], page = 1, limit = 20, total = items.length) {
  return { items, page, limit, total };
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    user: {
      id: "parent-1",
      firstName: "Jean",
      lastName: "Mbele",
      onboardingHelpEnabled: false,
      activeRole: "PARENT",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "PARENT" }],
      profileCompleted: true,
    },
  } as never);
  useFamilyStore.setState({
    children: [{ id: "child-1", firstName: "Nathan", lastName: "Mbele" }],
  } as never);

  api.listConditions.mockResolvedValue(paginated([]));
  api.getHistory.mockResolvedValue(paginated([]));
  api.createCondition.mockResolvedValue(CONDITION_1);
  api.updateCondition.mockResolvedValue({ ...CONDITION_1, active: false });
  api.createReport.mockResolvedValue(REPORT_1);
});

describe("SanteScreen (vue parent) — onglet Conditions", () => {
  it("charge les conditions au montage", async () => {
    api.listConditions.mockResolvedValueOnce(paginated([CONDITION_1]));

    render(<SanteScreenRoute />);

    await waitFor(() => {
      expect(screen.getByText("Allergie arachides")).toBeOnTheScreen();
    });
    expect(api.listConditions).toHaveBeenCalledWith(
      "college-vogt",
      "child-1",
      expect.objectContaining({
        page: 1,
        search: "",
        filters: expect.any(Object),
      }),
    );
  });

  it("recherche en live avec debounce (300ms)", async () => {
    render(<SanteScreenRoute />);
    await waitFor(() => expect(api.listConditions).toHaveBeenCalledTimes(1));

    fireEvent.changeText(
      screen.getByTestId("sante-conditions-search-input"),
      "arachide",
    );

    await new Promise((resolve) => setTimeout(resolve, 650));

    await waitFor(() => {
      expect(api.listConditions).toHaveBeenLastCalledWith(
        "college-vogt",
        "child-1",
        expect.objectContaining({ page: 1, search: "arachide" }),
      );
    });
  });

  it("bascule le bouton filtre en actif après Apply, et le remet à zéro après Reset", async () => {
    render(<SanteScreenRoute />);
    await waitFor(() => expect(api.listConditions).toHaveBeenCalledTimes(1));

    fireEvent.press(screen.getByTestId("sante-conditions-filter-toggle"));
    expect(
      screen.getByTestId("sante-conditions-filter-panel"),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("sante-conditions-filter-type-ALLERGY"));
    fireEvent.press(screen.getByTestId("sante-conditions-filter-apply"));

    await waitFor(() => {
      expect(api.listConditions).toHaveBeenLastCalledWith(
        "college-vogt",
        "child-1",
        expect.objectContaining({
          filters: expect.objectContaining({ type: "ALLERGY" }),
        }),
      );
    });
    expect(
      screen.queryByTestId("sante-conditions-filter-panel"),
    ).not.toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("sante-conditions-filter-toggle"));
    fireEvent.press(screen.getByTestId("sante-conditions-filter-reset"));

    await waitFor(() => {
      expect(api.listConditions).toHaveBeenLastCalledWith(
        "college-vogt",
        "child-1",
        expect.objectContaining({
          filters: expect.objectContaining({ type: null }),
        }),
      );
    });
    // Reset keeps the panel open (only Apply/Close dismiss it)
    expect(
      screen.getByTestId("sante-conditions-filter-panel"),
    ).toBeOnTheScreen();
  });

  it("Close referme le panneau sans appliquer le brouillon", async () => {
    render(<SanteScreenRoute />);
    await waitFor(() => expect(api.listConditions).toHaveBeenCalledTimes(1));

    fireEvent.press(screen.getByTestId("sante-conditions-filter-toggle"));
    fireEvent.press(screen.getByTestId("sante-conditions-filter-type-ALLERGY"));
    fireEvent.press(screen.getByTestId("sante-conditions-filter-close"));

    expect(
      screen.queryByTestId("sante-conditions-filter-panel"),
    ).not.toBeOnTheScreen();
    // No extra API call triggered by the abandoned draft
    expect(api.listConditions).toHaveBeenCalledTimes(1);
  });

  it("le FAB masque le panneau de filtres et n'apparaît pas quand il est ouvert", async () => {
    render(<SanteScreenRoute />);
    await waitFor(() => expect(api.listConditions).toHaveBeenCalledTimes(1));

    expect(screen.getByTestId("sante-fab")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("sante-conditions-filter-toggle"));
    expect(screen.queryByTestId("sante-fab")).not.toBeOnTheScreen();
  });

  it("charge la page suivante via onEndReached (pagination)", async () => {
    api.listConditions.mockResolvedValueOnce(paginated([CONDITION_1], 1, 1, 2));
    render(<SanteScreenRoute />);
    await waitFor(() => expect(api.listConditions).toHaveBeenCalledTimes(1));

    api.listConditions.mockResolvedValueOnce(
      paginated([{ ...CONDITION_1, id: "cond-2" }], 2, 1, 2),
    );
    fireEvent(screen.getByTestId("sante-conditions-list"), "onEndReached", {
      distanceFromEnd: 0,
    });

    await waitFor(() => {
      expect(api.listConditions).toHaveBeenLastCalledWith(
        "college-vogt",
        "child-1",
        expect.objectContaining({ page: 2 }),
      );
    });
  });

  it("FAB → tab forms (création condition) → soumission → retour sur Conditions", async () => {
    render(<SanteScreenRoute />);
    await waitFor(() => expect(api.listConditions).toHaveBeenCalledTimes(1));

    fireEvent.press(screen.getByTestId("sante-fab"));
    expect(screen.getByTestId("sante-condition-form-hero")).toBeOnTheScreen();
    expect(screen.queryByTestId("sante-fab")).not.toBeOnTheScreen();

    fireEvent.changeText(
      screen.getByTestId("condition-form-label"),
      "Allergie arachides",
    );
    fireEvent.press(screen.getByTestId("condition-form-submit"));

    await waitFor(() => {
      expect(api.createCondition).toHaveBeenCalledWith(
        "college-vogt",
        "child-1",
        expect.objectContaining({ label: "Allergie arachides" }),
      );
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("sante-conditions-tab")).toBeOnTheScreen();
      },
      { timeout: 3000 },
    );
  });

  it("condition visible de tous les enseignants : bloque sans libellé, envoie le libellé une fois renseigné", async () => {
    render(<SanteScreenRoute />);
    await waitFor(() => expect(api.listConditions).toHaveBeenCalledTimes(1));

    fireEvent.press(screen.getByTestId("sante-fab"));
    fireEvent.changeText(
      screen.getByTestId("condition-form-label"),
      "Asthme sévère",
    );
    fireEvent(
      screen.getByTestId("condition-form-visibleToAllTeachers"),
      "valueChange",
      true,
    );
    fireEvent.press(screen.getByTestId("condition-form-submit"));

    await waitFor(() => {
      expect(
        screen.getByTestId("condition-form-publicAlertLabel-error"),
      ).toBeOnTheScreen();
    });
    expect(api.createCondition).not.toHaveBeenCalled();

    fireEvent.changeText(
      screen.getByTestId("condition-form-publicAlertLabel"),
      "Asthme — inhalateur dans le cartable",
    );
    fireEvent.press(screen.getByTestId("condition-form-submit"));

    await waitFor(() => {
      expect(api.createCondition).toHaveBeenCalledWith(
        "college-vogt",
        "child-1",
        expect.objectContaining({
          isVisibleToAllTeachers: true,
          publicAlertLabel: "Asthme — inhalateur dans le cartable",
        }),
      );
    });
  });

  it("Annuler dans le formulaire revient au tab d'origine sans appeler l'API", async () => {
    render(<SanteScreenRoute />);
    await waitFor(() => expect(api.listConditions).toHaveBeenCalledTimes(1));

    fireEvent.press(screen.getByTestId("sante-fab"));
    fireEvent.press(screen.getByTestId("condition-form-cancel"));

    expect(screen.getByTestId("sante-conditions-tab")).toBeOnTheScreen();
    expect(api.createCondition).not.toHaveBeenCalled();
  });

  it("erreurs de validation affichées, API non appelée", async () => {
    render(<SanteScreenRoute />);
    await waitFor(() => expect(api.listConditions).toHaveBeenCalledTimes(1));

    fireEvent.press(screen.getByTestId("sante-fab"));
    fireEvent.press(screen.getByTestId("condition-form-submit"));

    await waitFor(() => {
      expect(
        screen.getByTestId("condition-form-label-error"),
      ).toBeOnTheScreen();
    });
    expect(api.createCondition).not.toHaveBeenCalled();
  });

  it("carte condition → détail → Modifier → formulaire pré-rempli → sauvegarde", async () => {
    api.listConditions.mockResolvedValueOnce(paginated([CONDITION_1]));
    render(<SanteScreenRoute />);
    await waitFor(() =>
      expect(
        screen.getByTestId(`sante-condition-card-${CONDITION_1.id}`),
      ).toBeOnTheScreen(),
    );

    fireEvent.press(
      screen.getByTestId(`sante-condition-card-${CONDITION_1.id}`),
    );
    expect(screen.getByTestId("sante-condition-detail")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("sante-condition-detail-edit"));
    expect(screen.getByTestId("sante-condition-form-hero")).toBeOnTheScreen();
    expect(screen.getByTestId("condition-form-label").props.value).toBe(
      "Allergie arachides",
    );

    fireEvent.press(screen.getByTestId("condition-form-submit"));

    await waitFor(() => {
      expect(api.updateCondition).toHaveBeenCalledWith(
        "college-vogt",
        "child-1",
        CONDITION_1.id,
        expect.objectContaining({ label: "Allergie arachides" }),
      );
    });
  });

  it("flèche retour du header : depuis detail, revient au tab d'origine sans navigation router", async () => {
    api.listConditions.mockResolvedValueOnce(paginated([CONDITION_1]));
    render(<SanteScreenRoute />);
    await waitFor(() =>
      expect(
        screen.getByTestId(`sante-condition-card-${CONDITION_1.id}`),
      ).toBeOnTheScreen(),
    );

    fireEvent.press(
      screen.getByTestId(`sante-condition-card-${CONDITION_1.id}`),
    );
    expect(screen.getByTestId("sante-condition-detail")).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("sante-back"));
    expect(screen.getByTestId("sante-conditions-tab")).toBeOnTheScreen();
  });
});

describe("SanteScreen (vue parent) — onglet Historique", () => {
  it("fusionne soins et signalements triés par date (chargés via /health/history)", async () => {
    api.getHistory.mockResolvedValueOnce(
      paginated([
        { kind: "REPORT" as const, at: REPORT_1.createdAt, payload: REPORT_1 },
        {
          kind: "CARE_EVENT" as const,
          at: CARE_EVENT_1.occurredAt,
          payload: CARE_EVENT_1,
        },
      ]),
    );

    render(<SanteScreenRoute />);
    fireEvent.press(screen.getByTestId("sante-tab-history"));

    await waitFor(() => {
      expect(screen.getByText("Chute dans la cour")).toBeOnTheScreen();
    });
    expect(api.getHistory).toHaveBeenCalledWith(
      "college-vogt",
      "child-1",
      expect.objectContaining({ page: 1 }),
    );
  });

  it("FAB toujours visible sur Historique → formulaire = signalement uniquement", async () => {
    render(<SanteScreenRoute />);
    fireEvent.press(screen.getByTestId("sante-tab-history"));
    await waitFor(() => expect(api.getHistory).toHaveBeenCalledTimes(1));

    expect(screen.getByTestId("sante-fab")).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId("sante-fab"));

    expect(screen.getByTestId("sante-report-form-hero")).toBeOnTheScreen();

    fireEvent.changeText(
      screen.getByTestId("report-form-description"),
      "Crise d'asthme",
    );
    fireEvent.press(screen.getByTestId("report-form-submit"));

    await waitFor(() => {
      expect(api.createReport).toHaveBeenCalledWith(
        "college-vogt",
        "child-1",
        expect.objectContaining({ description: "Crise d'asthme" }),
      );
    });
  });

  it("applique le filtre origine et réinitialise la page à 1", async () => {
    render(<SanteScreenRoute />);
    fireEvent.press(screen.getByTestId("sante-tab-history"));
    await waitFor(() => expect(api.getHistory).toHaveBeenCalledTimes(1));

    fireEvent.press(screen.getByTestId("sante-history-filter-toggle"));
    fireEvent.press(
      screen.getByTestId("sante-history-filter-origin-CARE_EVENT"),
    );
    fireEvent.press(screen.getByTestId("sante-history-filter-apply"));

    await waitFor(() => {
      expect(api.getHistory).toHaveBeenLastCalledWith(
        "college-vogt",
        "child-1",
        expect.objectContaining({
          page: 1,
          filters: expect.objectContaining({ origin: "CARE_EVENT" }),
        }),
      );
    });
  });

  it("carte historique (soin) → détail en lecture seule", async () => {
    api.getHistory.mockResolvedValueOnce(
      paginated([
        {
          kind: "CARE_EVENT" as const,
          at: CARE_EVENT_1.occurredAt,
          payload: CARE_EVENT_1,
        },
      ]),
    );
    render(<SanteScreenRoute />);
    fireEvent.press(screen.getByTestId("sante-tab-history"));

    await waitFor(() =>
      expect(
        screen.getByTestId(`sante-history-card-CARE_EVENT-${CARE_EVENT_1.id}`),
      ).toBeOnTheScreen(),
    );
    fireEvent.press(
      screen.getByTestId(`sante-history-card-CARE_EVENT-${CARE_EVENT_1.id}`),
    );

    expect(screen.getByTestId("sante-care-event-detail")).toBeOnTheScreen();
    expect(screen.getByText("Marie Ateba")).toBeOnTheScreen();
  });

  it("charge la page suivante via onEndReached (pagination historique)", async () => {
    api.getHistory.mockResolvedValueOnce(
      paginated(
        [
          {
            kind: "CARE_EVENT" as const,
            at: CARE_EVENT_1.occurredAt,
            payload: CARE_EVENT_1,
          },
        ],
        1,
        1,
        2,
      ),
    );
    render(<SanteScreenRoute />);
    fireEvent.press(screen.getByTestId("sante-tab-history"));
    await waitFor(() => expect(api.getHistory).toHaveBeenCalledTimes(1));

    api.getHistory.mockResolvedValueOnce(
      paginated(
        [
          {
            kind: "REPORT" as const,
            at: REPORT_1.createdAt,
            payload: REPORT_1,
          },
        ],
        2,
        1,
        2,
      ),
    );
    fireEvent(screen.getByTestId("sante-history-list"), "onEndReached", {
      distanceFromEnd: 0,
    });

    await waitFor(() => {
      expect(api.getHistory).toHaveBeenLastCalledWith(
        "college-vogt",
        "child-1",
        expect.objectContaining({ page: 2 }),
      );
    });
  });
});

describe("SanteScreen (vue parent) — aide", () => {
  it("ouvre et ferme la modale d'aide depuis le menu du header", async () => {
    render(<SanteScreenRoute />);

    await waitFor(() => {
      expect(screen.getByTestId("sante-header")).toBeOnTheScreen();
    });

    expect(screen.queryByTestId("sante-help-modal-title")).toBeNull();

    fireEvent.press(screen.getByTestId("module-header-menu"));
    fireEvent.press(screen.getByTestId("sante-help-menu-item"));

    expect(screen.getByTestId("sante-help-modal-title")).toHaveTextContent(
      "Santé",
    );
    expect(
      screen.getByText(/allergies, pathologies et consignes durables/),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(/soins reçus à l'école et les événements/),
    ).toBeOnTheScreen();

    fireEvent.press(screen.getByTestId("sante-help-modal-close"));
    expect(screen.queryByTestId("sante-help-modal-title")).toBeNull();
  });
});
