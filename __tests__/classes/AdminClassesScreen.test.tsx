import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AdminClassesScreen } from "../../src/components/classes/AdminClassesScreen";
import { timetableApi } from "../../src/api/timetable.api";
import type { TimetableClassOption } from "../../src/types/timetable.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/api/timetable.api");

const mockPush = jest.fn();
let latestFocusCallback: (() => void) | null = null;
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => {
      latestFocusCallback = callback;
      callback();
    }, [callback]);
  },
}));

jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({
    schoolSlug: "college-vogt",
    user: {
      id: "admin-1",
      firstName: "Valery",
      lastName: "Mbele",
      role: "SCHOOL_ADMIN",
      activeRole: "SCHOOL_ADMIN",
      schoolName: "Collège Vogt",
    },
  }),
}));

jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));

jest.mock("../../src/components/navigation/ModuleHeader", () => ({
  ModuleHeader: ({ title, testID }: { title: string; testID?: string }) => {
    const { Text } = require("react-native");
    return <Text testID={testID}>{title}</Text>;
  },
}));

const api = timetableApi as jest.Mocked<typeof timetableApi>;

const CLASS_6EA: TimetableClassOption = {
  classId: "class-1",
  className: "6e A",
  schoolYearId: "sy-1",
  schoolYearLabel: "2025-2026",
  subjects: [],
  studentCount: 28,
  capacity: 30,
  academicLevelId: "lvl-6e",
  academicLevelName: "6e",
  referentTeacher: { id: "teacher-1", firstName: "Amina", lastName: "Fouda" },
};

const CLASS_6EB: TimetableClassOption = {
  classId: "class-2",
  className: "6e B",
  schoolYearId: "sy-1",
  schoolYearLabel: "2025-2026",
  subjects: [],
  studentCount: 25,
  capacity: 30,
  academicLevelId: "lvl-6e",
  academicLevelName: "6e",
  referentTeacher: null,
};

const CLASS_5EA: TimetableClassOption = {
  classId: "class-3",
  className: "5e A",
  schoolYearId: "sy-1",
  schoolYearLabel: "2025-2026",
  subjects: [],
  studentCount: 20,
  capacity: 28,
  academicLevelId: "lvl-5e",
  academicLevelName: "5e",
  referentTeacher: { id: "teacher-2", firstName: "Lionel", lastName: "Ateba" },
};

function mockList(
  data: TimetableClassOption[],
  meta: Partial<{ page: number; limit: number; total: number }> = {},
) {
  api.getAdminClassList.mockResolvedValue({
    data,
    page: meta.page ?? 1,
    limit: meta.limit ?? 60,
    total: meta.total ?? data.length,
    hasMore: false,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockList([CLASS_6EA, CLASS_6EB, CLASS_5EA]);
});

describe("AdminClassesScreen — chargement initial", () => {
  it("affiche le header 'Classes'", async () => {
    render(<AdminClassesScreen />);
    expect(screen.getByTestId("admin-classes-header")).toBeTruthy();
    await waitFor(() => expect(api.getAdminClassList).toHaveBeenCalled());
  });

  it("appelle getAdminClassList avec schoolSlug et page 1 au montage", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() =>
      expect(api.getAdminClassList).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ page: 1, limit: 60 }),
      ),
    );
  });

  it("affiche le FAB de création de classe", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("admin-classes-fab-create")).toBeTruthy(),
    );
  });
});

describe("AdminClassesScreen — rafraîchissement au retour sur l'écran (focus)", () => {
  it("ne relance pas de chargement au premier focus (déjà couvert par le montage)", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() => expect(api.getAdminClassList).toHaveBeenCalledTimes(1));
  });

  it("relance getAdminClassList en page 1 quand l'écran regagne le focus", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() => expect(api.getAdminClassList).toHaveBeenCalledTimes(1));

    mockList([CLASS_6EA, CLASS_6EB, CLASS_5EA, CLASS_5EA]);
    latestFocusCallback?.();

    await waitFor(() => expect(api.getAdminClassList).toHaveBeenCalledTimes(2));
    expect(api.getAdminClassList).toHaveBeenLastCalledWith(
      "college-vogt",
      expect.objectContaining({ page: 1 }),
    );
  });
});

describe("AdminClassesScreen — groupement par niveau", () => {
  it("groupe les classes par niveau avec le titre de niveau", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("admin-classes-card-class-1")).toBeTruthy(),
    );
    expect(screen.getByTestId("admin-classes-level-group-lvl-6e")).toBeTruthy();
    expect(screen.getByTestId("admin-classes-level-group-lvl-5e")).toBeTruthy();
    expect(screen.getByTestId("admin-classes-card-class-1")).toBeTruthy();
    expect(screen.getByTestId("admin-classes-card-class-2")).toBeTruthy();
    expect(screen.getByTestId("admin-classes-card-class-3")).toBeTruthy();
  });

  it("affiche effectif/capacité et l'enseignant référent sur chaque card", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("admin-classes-card-class-1")).toBeTruthy(),
    );
    expect(screen.getByText("28/30")).toBeTruthy();
    expect(screen.getByText("Amina Fouda")).toBeTruthy();
    expect(screen.getByText("Aucun enseignant référent")).toBeTruthy();
  });

  it("navigue vers la fiche classe au tap sur une card", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("admin-classes-card-class-1")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("admin-classes-card-class-1"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/admin-classes/[classId]",
      params: { classId: "class-1" },
    });
  });
});

describe("AdminClassesScreen — FAB création", () => {
  it("navigue vers l'écran de création de classe au tap sur le FAB", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("admin-classes-fab-create")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("admin-classes-fab-create"));
    expect(mockPush).toHaveBeenCalledWith("/(home)/admin-classes/new");
  });
});

describe("AdminClassesScreen — recherche live", () => {
  it("relance getAdminClassList avec search après le debounce", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() => expect(api.getAdminClassList).toHaveBeenCalledTimes(1));

    mockList([CLASS_6EA]);
    fireEvent.changeText(
      screen.getByTestId("admin-classes-search-input"),
      "6e A",
    );

    await new Promise((resolve) => setTimeout(resolve, 650));

    await waitFor(() =>
      expect(api.getAdminClassList).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({ search: "6e A", page: 1 }),
      ),
    );
  });

  it("le bouton clear vide la recherche et relance sans search", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() => expect(api.getAdminClassList).toHaveBeenCalledTimes(1));

    fireEvent.changeText(
      screen.getByTestId("admin-classes-search-input"),
      "6e A",
    );
    await new Promise((resolve) => setTimeout(resolve, 650));
    await waitFor(() =>
      expect(api.getAdminClassList).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({ search: "6e A" }),
      ),
    );

    fireEvent.press(screen.getByTestId("admin-classes-search-clear"));
    await new Promise((resolve) => setTimeout(resolve, 650));
    await waitFor(() =>
      expect(api.getAdminClassList).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({ search: undefined }),
      ),
    );
  });

  it("affiche le message vide dédié à la recherche sans résultat", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() => expect(api.getAdminClassList).toHaveBeenCalledTimes(1));

    mockList([]);
    fireEvent.changeText(
      screen.getByTestId("admin-classes-search-input"),
      "zzz",
    );
    await new Promise((resolve) => setTimeout(resolve, 650));

    await waitFor(() =>
      expect(screen.getByText("Aucun résultat")).toBeTruthy(),
    );
    expect(
      screen.getByText(
        "Aucune classe ne correspond à votre recherche ou vos filtres.",
      ),
    ).toBeTruthy();
  });
});

describe("AdminClassesScreen — filtre niveau", () => {
  it("le bouton filtre n'est pas actif par défaut, panneau fermé", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() => expect(api.getAdminClassList).toHaveBeenCalledTimes(1));
    expect(screen.queryByTestId("admin-classes-filter-panel")).toBeNull();
  });

  it("ouvre le panneau au tap sur le bouton filtre", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() => expect(api.getAdminClassList).toHaveBeenCalledTimes(1));
    fireEvent.press(screen.getByTestId("admin-classes-filter-toggle"));
    expect(screen.getByTestId("admin-classes-filter-panel")).toBeTruthy();
  });

  it("le panneau expose un chip par niveau détecté dans les classes chargées", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("admin-classes-card-class-1")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("admin-classes-filter-toggle"));
    expect(
      screen.getByTestId("admin-classes-filter-level-lvl-6e"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("admin-classes-filter-level-lvl-5e"),
    ).toBeTruthy();
  });

  it("Apply applique le filtre, ferme le panneau, relance en page 1", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("admin-classes-card-class-1")).toBeTruthy(),
    );

    mockList([CLASS_5EA]);
    fireEvent.press(screen.getByTestId("admin-classes-filter-toggle"));
    fireEvent.press(screen.getByTestId("admin-classes-filter-level-lvl-5e"));
    fireEvent.press(screen.getByTestId("admin-classes-filter-apply"));

    expect(screen.queryByTestId("admin-classes-filter-panel")).toBeNull();
    await waitFor(() =>
      expect(api.getAdminClassList).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({ academicLevelId: "lvl-5e", page: 1 }),
      ),
    );

    const toggle = screen.getByTestId("admin-classes-filter-toggle");
    const flatStyle = [toggle.props.style].flat();
    expect(
      flatStyle.some(
        (s: Record<string, unknown>) => s && s.backgroundColor === "#247C72",
      ),
    ).toBe(true);
  });

  it("Reset vide le filtre appliqué et garde le panneau ouvert", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("admin-classes-card-class-1")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("admin-classes-filter-toggle"));
    fireEvent.press(screen.getByTestId("admin-classes-filter-level-lvl-5e"));
    fireEvent.press(screen.getByTestId("admin-classes-filter-apply"));

    await waitFor(() =>
      expect(api.getAdminClassList).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({ academicLevelId: "lvl-5e" }),
      ),
    );

    fireEvent.press(screen.getByTestId("admin-classes-filter-toggle"));
    fireEvent.press(screen.getByTestId("admin-classes-filter-reset"));

    expect(screen.getByTestId("admin-classes-filter-panel")).toBeTruthy();
    await waitFor(() =>
      expect(api.getAdminClassList).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({ academicLevelId: undefined }),
      ),
    );
  });

  it("Close referme le panneau sans appliquer le brouillon", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("admin-classes-card-class-1")).toBeTruthy(),
    );
    const callsBeforeClose = api.getAdminClassList.mock.calls.length;

    fireEvent.press(screen.getByTestId("admin-classes-filter-toggle"));
    fireEvent.press(screen.getByTestId("admin-classes-filter-level-lvl-5e"));
    fireEvent.press(screen.getByTestId("admin-classes-filter-close"));

    expect(screen.queryByTestId("admin-classes-filter-panel")).toBeNull();
    expect(api.getAdminClassList).toHaveBeenCalledTimes(callsBeforeClose);

    fireEvent.press(screen.getByTestId("admin-classes-filter-toggle"));
    const allChip = screen.getByTestId("admin-classes-filter-level-all");
    const flatStyle = [allChip.props.style].flat();
    expect(
      flatStyle.some(
        (s: Record<string, unknown>) => s && s.backgroundColor === "#247C72",
      ),
    ).toBe(true);
  });

  it("masque le FAB de création pendant que le panneau est ouvert", async () => {
    render(<AdminClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("admin-classes-fab-create")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("admin-classes-filter-toggle"));
    expect(screen.queryByTestId("admin-classes-fab-create")).toBeNull();
    fireEvent.press(screen.getByTestId("admin-classes-filter-close"));
    expect(screen.getByTestId("admin-classes-fab-create")).toBeTruthy();
  });
});

describe("AdminClassesScreen — pagination (charger plus)", () => {
  it("affiche le bouton 'Charger plus' quand hasMore, absent sinon", async () => {
    api.getAdminClassList.mockResolvedValueOnce({
      data: [CLASS_6EA],
      page: 1,
      limit: 1,
      total: 2,
      hasMore: true,
    });
    render(<AdminClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("admin-classes-load-more")).toBeTruthy(),
    );
  });

  it("charge la page 2 au tap sur 'Charger plus' et concatène les résultats", async () => {
    api.getAdminClassList.mockResolvedValueOnce({
      data: [CLASS_6EA],
      page: 1,
      limit: 1,
      total: 2,
      hasMore: true,
    });
    render(<AdminClassesScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("admin-classes-load-more")).toBeTruthy(),
    );

    api.getAdminClassList.mockResolvedValueOnce({
      data: [CLASS_5EA],
      page: 2,
      limit: 1,
      total: 2,
      hasMore: false,
    });
    fireEvent.press(screen.getByTestId("admin-classes-load-more"));

    await waitFor(() =>
      expect(api.getAdminClassList).toHaveBeenLastCalledWith(
        "college-vogt",
        expect.objectContaining({ page: 2 }),
      ),
    );
    await waitFor(() =>
      expect(screen.getByTestId("admin-classes-card-class-3")).toBeTruthy(),
    );
    expect(screen.getByTestId("admin-classes-card-class-1")).toBeTruthy();
    expect(screen.queryByTestId("admin-classes-load-more")).toBeNull();
  });
});

describe("AdminClassesScreen — erreurs", () => {
  it("affiche un message d'erreur si le chargement échoue", async () => {
    api.getAdminClassList.mockRejectedValueOnce(new Error("Erreur réseau"));
    render(<AdminClassesScreen />);
    await waitFor(() => expect(screen.getByText("Erreur réseau")).toBeTruthy());
  });
});

describe("AdminClassesScreen — état vide sans classe", () => {
  it("affiche l'état vide par défaut sans recherche/filtre", async () => {
    mockList([]);
    render(<AdminClassesScreen />);
    await waitFor(() => expect(screen.getByText("Aucune classe")).toBeTruthy());
    expect(
      screen.getByText(
        "Créez votre première classe avec le bouton ci-dessous.",
      ),
    ).toBeTruthy();
  });
});
