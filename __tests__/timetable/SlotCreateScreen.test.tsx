/**
 * Tests pour SlotCreateScreen
 *
 * Couvre :
 * - Rendu initial : hero teal, picker de classe, formulaire vide
 * - Sélection de classe → chargement du contexte → matières disponibles
 * - Toggle ponctuel / récurrent
 * - Validation Zod (mode onChange) : erreurs à la frappe
 * - Bouton submit toujours actif (jamais désactivé sur form invalide)
 * - Soumission réussie oneoff : payload correct + toast + back()
 * - Soumission réussie récurrent : payload correct + toast + back()
 * - Erreur API affichée en bannière inline
 * - Filtrage des matières par enseignant
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SlotCreateScreen } from "../../src/components/timetable/SlotCreateScreen";
import { timetableApi } from "../../src/api/timetable.api";
import { roomsApi } from "../../src/api/rooms.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { translate } from "../../src/i18n/useTranslation";
import { DEFAULT_LOCALE } from "../../src/i18n/translations";
import type {
  ClassTimetableContextResponse,
  TimetableClassOption,
} from "../../src/types/timetable.types";

const t = (key: string) => translate(DEFAULT_LOCALE, key);

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/timetable.api", () => ({
  timetableApi: {
    getClassContext: jest.fn(),
    createOneOffSlot: jest.fn(),
    createRecurringSlot: jest.fn(),
  },
}));
jest.mock("../../src/api/rooms.api", () => ({
  roomsApi: { listAvailableRooms: jest.fn() },
}));
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: jest.fn(),
}));
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: jest.fn(),
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/ModuleHeader", () => ({
  ModuleHeader: (props: { title: string; subtitle?: string | null }) => {
    const { Text, View } = require("react-native");
    return (
      <View testID="module-header">
        <Text testID="module-header-title">{props.title}</Text>
        {props.subtitle ? (
          <Text testID="module-header-subtitle">{props.subtitle}</Text>
        ) : null}
      </View>
    );
  },
}));
jest.mock("../../src/components/DatePickerField", () => ({
  DatePickerField: (props: {
    value: string;
    onChange: (v: string) => void;
    testID?: string;
  }) => {
    const { TextInput } = require("react-native");
    return (
      <TextInput
        testID={props.testID ?? "date-picker"}
        value={props.value}
        onChangeText={props.onChange}
      />
    );
  },
}));
jest.mock("../../src/components/TimePickerField", () => ({
  TimePickerField: (props: {
    value: string;
    onChange: (v: string) => void;
    onBlur: () => void;
    testID?: string;
  }) => {
    const { TextInput } = require("react-native");
    return (
      <TextInput
        testID={props.testID ?? "time-picker"}
        value={props.value}
        onChangeText={props.onChange}
        onBlur={props.onBlur}
      />
    );
  },
}));
jest.mock("../../src/components/SelectDropdown", () => ({
  SelectDropdown: (props: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    testID?: string;
  }) => {
    const { View, TouchableOpacity, Text } = require("react-native");
    return (
      <View testID={props.testID ?? "select-dropdown"}>
        {props.options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => props.onChange(opt.value)}
            testID={`${props.testID ?? "select"}-opt-${opt.value}`}
          >
            <Text>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  },
}));

const mockBack = jest.fn();
const mockShowSuccess = jest.fn();
const mockOnSuccess = jest.fn();

const api = timetableApi as jest.Mocked<typeof timetableApi>;
const rooms = roomsApi as jest.Mocked<typeof roomsApi>;

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ALL_CLASSES: TimetableClassOption[] = [
  {
    classId: "cls-6eC",
    className: "6eC",
    schoolYearId: "sy1",
    schoolYearLabel: "2025-2026",
    studentCount: 28,
    subjects: [],
  },
  {
    classId: "cls-5eB",
    className: "5eB",
    schoolYearId: "sy1",
    schoolYearLabel: "2025-2026",
    studentCount: 30,
    subjects: [],
  },
];

const CLASS_CTX: ClassTimetableContextResponse = {
  class: {
    id: "cls-6eC",
    name: "6eC",
    schoolId: "s1",
    schoolYearId: "sy1",
    academicLevelId: null,
    curriculumId: null,
    referentTeacherUserId: null,
  },
  selectedSchoolYearId: "sy1",
  assignments: [
    {
      teacherUserId: "teacher-1",
      subjectId: "sub-math",
      subject: { id: "sub-math", name: "Maths" },
      teacherUser: { id: "teacher-1", firstName: "A", lastName: "B" },
    },
  ],
  allowedSubjects: [
    { id: "sub-math", name: "Maths" },
    { id: "sub-fr", name: "Français" },
  ],
  subjectStyles: [],
  schoolYears: [],
};

const CURRENT_USER = {
  id: "teacher-1",
  firstName: "Jean",
  lastName: "Dupont",
  schoolName: "École Pilote",
  platformRoles: [] as never[],
  role: "TEACHER" as const,
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  (useAuthStore as jest.MockedFunction<typeof useAuthStore>).mockReturnValue({
    user: CURRENT_USER,
    schoolSlug: "ecole-pilote",
  } as never);
  (
    useSuccessToastStore as jest.MockedFunction<typeof useSuccessToastStore>
  ).mockReturnValue({
    showSuccess: mockShowSuccess,
    showError: jest.fn(),
  } as never);
  api.getClassContext.mockResolvedValue(CLASS_CTX);
  api.createOneOffSlot.mockResolvedValue(undefined as never);
  api.createRecurringSlot.mockResolvedValue(undefined as never);
  rooms.listAvailableRooms.mockResolvedValue([]);
});

const defaultProps = {
  schoolSlug: "ecole-pilote",
  allClasses: ALL_CLASSES,
  onSuccess: mockOnSuccess,
};

function renderCreate(
  props?: Partial<
    typeof defaultProps & {
      prefilledClassId?: string;
      prefilledDate?: string;
      prefilledTeacherId?: string;
    }
  >,
) {
  return render(<SlotCreateScreen {...defaultProps} {...props} />);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SlotCreateScreen — rendu initial", () => {
  it("affiche le header avec titre Schedule", () => {
    renderCreate();
    expect(screen.getByTestId("module-header-title")).toHaveTextContent(
      t("timetable.slotScreen.headerTitle"),
    );
  });

  it("affiche le hero teal avec le bon titre", () => {
    renderCreate();
    expect(screen.getByTestId("slot-create-hero")).toBeTruthy();
    expect(
      screen.getByText(t("timetable.slotScreen.create.heroTitle")),
    ).toBeTruthy();
    expect(
      screen.getByText(t("timetable.slotScreen.heroSubtitle")),
    ).toBeTruthy();
  });

  it("affiche le picker de classe avec toutes les classes", () => {
    renderCreate();
    expect(screen.getByTestId("slot-create-class-cls-6eC")).toBeTruthy();
    expect(screen.getByTestId("slot-create-class-cls-5eB")).toBeTruthy();
  });

  it("préselectionne la classe passée en prop", () => {
    renderCreate({ prefilledClassId: "cls-6eC" });
    // Context doit être chargé
    expect(api.getClassContext).toHaveBeenCalledWith("ecole-pilote", "cls-6eC");
  });

  it("affiche le sous-titre avec schoolName + className une fois la classe sélectionnée", async () => {
    renderCreate({ prefilledClassId: "cls-6eC" });
    await waitFor(() => {
      expect(screen.getByTestId("module-header-subtitle")).toHaveTextContent(
        "École Pilote · 6eC",
      );
    });
  });
});

describe("SlotCreateScreen — sélection de classe", () => {
  it("charge le contexte de classe après sélection", async () => {
    renderCreate();
    fireEvent.press(screen.getByTestId("slot-create-class-cls-6eC"));
    await waitFor(() => {
      expect(api.getClassContext).toHaveBeenCalledWith(
        "ecole-pilote",
        "cls-6eC",
      );
    });
  });

  it("affiche les matières après chargement du contexte", async () => {
    renderCreate();
    fireEvent.press(screen.getByTestId("slot-create-class-cls-6eC"));
    await waitFor(() => {
      expect(screen.getByTestId("slot-create-subject-sub-math")).toBeTruthy();
    });
  });

  it("filtre les matières par enseignant connecté", async () => {
    const ctxWithMultipleTeachers: ClassTimetableContextResponse = {
      ...CLASS_CTX,
      assignments: [
        {
          teacherUserId: "teacher-1",
          subjectId: "sub-math",
          subject: { id: "sub-math", name: "Maths" },
          teacherUser: { id: "teacher-1", firstName: "A", lastName: "B" },
        },
        {
          teacherUserId: "teacher-2",
          subjectId: "sub-fr",
          subject: { id: "sub-fr", name: "Français" },
          teacherUser: { id: "teacher-2", firstName: "C", lastName: "D" },
        },
      ],
    };
    api.getClassContext.mockResolvedValue(ctxWithMultipleTeachers);
    renderCreate();
    fireEvent.press(screen.getByTestId("slot-create-class-cls-6eC"));
    await waitFor(() => {
      // teacher-1 enseigne seulement Maths
      expect(screen.queryByTestId("slot-create-subject-sub-math")).toBeTruthy();
      expect(
        screen.queryByTestId("slot-create-subject-sub-fr"),
      ).not.toBeTruthy();
    });
  });
});

describe("SlotCreateScreen — toggle ponctuel / récurrent", () => {
  async function selectClass() {
    fireEvent.press(screen.getByTestId("slot-create-class-cls-6eC"));
    await waitFor(() => {
      expect(screen.getByTestId("slot-create-type-oneoff")).toBeTruthy();
    });
  }

  it("affiche les champs oneoff par défaut", async () => {
    renderCreate();
    await selectClass();
    expect(screen.getByTestId("slot-create-date-input")).toBeTruthy();
  });

  it("passe en mode récurrent au clic sur Récurrent", async () => {
    renderCreate();
    await selectClass();
    fireEvent.press(screen.getByTestId("slot-create-type-recurring"));
    await waitFor(() => {
      expect(screen.getByTestId("slot-create-activefrom-input")).toBeTruthy();
      expect(screen.getByTestId("slot-create-weekday-1")).toBeTruthy();
    });
  });
});

describe("SlotCreateScreen — validation Zod (mode onChange)", () => {
  async function selectClass() {
    fireEvent.press(screen.getByTestId("slot-create-class-cls-6eC"));
    await waitFor(() => {
      expect(screen.queryByTestId("slot-create-start-input")).toBeTruthy();
    });
  }

  it("erreur heure fin avant début affichée à la frappe", async () => {
    renderCreate();
    await selectClass();
    fireEvent.changeText(
      screen.getByTestId("slot-create-start-input"),
      "10:00",
    );
    fireEvent.changeText(screen.getByTestId("slot-create-end-input"), "09:00");
    await waitFor(() => {
      expect(screen.getByTestId("slot-create-end-error")).toHaveTextContent(
        t("timetable.oneOffPanel.validation.endAfterStart"),
      );
    });
  });
});

describe("SlotCreateScreen — bouton submit", () => {
  it("le bouton submit est actif et jamais désactivé par la validation du formulaire", async () => {
    renderCreate({ prefilledClassId: "cls-6eC" });
    // Attendre que le contexte se charge et que le bouton apparaisse
    await waitFor(() => {
      expect(screen.queryByTestId("slot-create-save")).toBeTruthy();
    });
    const btn = screen.getByTestId("slot-create-save");
    // Le bouton n'est jamais disabled à cause de l'état du formulaire (seulement pendant isSaving)
    expect(btn.props.accessibilityState?.disabled).toBeFalsy();
  });
});

describe("SlotCreateScreen — soumission oneoff", () => {
  it("appelle createOneOffSlot avec les bons params et affiche le toast", async () => {
    renderCreate({ prefilledClassId: "cls-6eC", prefilledDate: "2026-05-12" });
    await waitFor(() => {
      expect(screen.queryByTestId("slot-create-subject-sub-math")).toBeTruthy();
    });

    // Sélectionner la matière
    fireEvent.press(screen.getByTestId("slot-create-subject-sub-math"));
    // Valeurs par défaut : 08:00-09:00, date prefilled

    fireEvent.press(screen.getByTestId("slot-create-save"));

    await waitFor(() => {
      expect(api.createOneOffSlot).toHaveBeenCalledWith(
        "ecole-pilote",
        "cls-6eC",
        expect.objectContaining({
          occurrenceDate: "2026-05-12",
          startMinute: 480,
          endMinute: 540,
          subjectId: "sub-math",
          teacherUserId: "teacher-1",
          status: "PLANNED",
        }),
      );
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          title: t("timetable.oneOffPanel.toasts.createdTitle"),
        }),
      );
    });
  });
});

describe("SlotCreateScreen — soumission récurrente", () => {
  it("appelle createRecurringSlot pour chaque jour sélectionné", async () => {
    renderCreate({ prefilledClassId: "cls-6eC", prefilledDate: "2026-05-12" });
    await waitFor(() => {
      expect(screen.queryByTestId("slot-create-type-recurring")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("slot-create-type-recurring"));
    await waitFor(() => {
      expect(screen.queryByTestId("slot-create-weekday-2")).toBeTruthy();
    });

    // Sélection matière
    fireEvent.press(screen.getByTestId("slot-create-subject-sub-math"));

    // Ajouter mardi (2) en plus du lundi (1) déjà coché
    fireEvent.press(screen.getByTestId("slot-create-weekday-2"));

    fireEvent.press(screen.getByTestId("slot-create-save"));

    await waitFor(() => {
      expect(api.createRecurringSlot).toHaveBeenCalledTimes(2);
      const calls = api.createRecurringSlot.mock.calls;
      const weekdays = calls.map((c) => c[2].weekday).sort();
      expect(weekdays).toEqual([1, 2]);
    });
  });
});

describe("SlotCreateScreen — erreur API", () => {
  it("affiche la bannière d'erreur en cas d'échec API", async () => {
    api.createOneOffSlot.mockRejectedValue(new Error("Erreur serveur de test"));
    renderCreate({ prefilledClassId: "cls-6eC", prefilledDate: "2026-05-12" });
    await waitFor(() => {
      expect(screen.queryByTestId("slot-create-subject-sub-math")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId("slot-create-subject-sub-math"));
    fireEvent.press(screen.getByTestId("slot-create-save"));

    await waitFor(() => {
      expect(screen.getByTestId("slot-create-api-error")).toBeTruthy();
    });
  });
});
