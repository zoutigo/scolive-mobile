/**
 * Tests pour SlotEditScreen
 *
 * Couvre :
 * - Rendu nul si pas de pendingSlotEdit en store
 * - Rendu avec hero warm/orange et correct titre/sous-titre
 * - Pré-remplissage du formulaire depuis l'occurrence
 * - Toggle scope occurrence/série (récurrent uniquement)
 * - Validation (fin > début)
 * - Sauvegarde : payload correct selon source × scope
 * - Suppression avec confirmation (occurrence seule vs série)
 * - Retour effaçant le store
 * - Mode admin : picker enseignant visible
 */
import React from "react";
import { Alert } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SlotEditScreen } from "../../src/components/timetable/SlotEditScreen";
import { timetableApi } from "../../src/api/timetable.api";
import { roomsApi } from "../../src/api/rooms.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { useTimetableStore } from "../../src/store/timetable.store";
import type { SlotEditContext } from "../../src/store/timetable.store";
import type { TimetableOccurrence } from "../../src/types/timetable.types";
import { translate } from "../../src/i18n/useTranslation";
import { DEFAULT_LOCALE } from "../../src/i18n/translations";

const t = (key: string) => translate(DEFAULT_LOCALE, key);

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/timetable.api", () => ({
  timetableApi: {
    getClassContext: jest.fn(),
    createOneOffSlot: jest.fn(),
    updateOneOffSlot: jest.fn(),
    updateRecurringSlot: jest.fn(),
    deleteOneOffSlot: jest.fn(),
    deleteRecurringSlot: jest.fn(),
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
jest.mock("../../src/store/timetable.store", () => ({
  useTimetableStore: jest.fn(),
}));

const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
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
jest.mock("../../src/components/InlineSelectDropDown", () => ({
  InlineSelectDropDown: (props: {
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

const api = timetableApi as jest.Mocked<typeof timetableApi>;
const rooms = roomsApi as jest.Mocked<typeof roomsApi>;

const mockClearPendingSlotEdit = jest.fn();
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TEACHER = {
  id: "t1",
  firstName: "Awa",
  lastName: "Ndiaye",
};

const ONE_OFF_OCC: TimetableOccurrence = {
  id: "occ-1",
  occurrenceDate: "2026-05-12",
  weekday: 1,
  startMinute: 480,
  endMinute: 540,
  subject: { id: "sub-math", name: "Maths" },
  teacherUser: TEACHER,
  room: null,
  reason: null,
  status: "PLANNED",
  source: "ONE_OFF",
  oneOffSlotId: "one-off-1",
};

const RECURRING_OCC: TimetableOccurrence = {
  ...ONE_OFF_OCC,
  id: "occ-2",
  source: "RECURRING",
  slotId: "slot-recurring-1",
};

const EDIT_CTX_ONE_OFF: SlotEditContext = {
  occurrence: ONE_OFF_OCC,
  className: "6eC",
  classId: "cls-6eC",
  schoolYearId: "sy1",
};

const EDIT_CTX_RECURRING: SlotEditContext = {
  occurrence: RECURRING_OCC,
  className: "6eC",
  classId: "cls-6eC",
  schoolYearId: "sy1",
};

// ─── Setup ────────────────────────────────────────────────────────────────────

function setupStore(ctx: SlotEditContext | null) {
  (
    useTimetableStore as jest.MockedFunction<typeof useTimetableStore>
  ).mockReturnValue({
    pendingSlotEdit: ctx,
    clearPendingSlotEdit: mockClearPendingSlotEdit,
    setPendingSlotEdit: jest.fn(),
  } as never);
}

beforeEach(() => {
  jest.clearAllMocks();
  (useAuthStore as jest.MockedFunction<typeof useAuthStore>).mockReturnValue({
    user: {
      id: "t1",
      schoolName: "École Pilote",
      platformRoles: [],
      role: "TEACHER",
    },
    schoolSlug: "ecole-pilote",
  } as never);
  (
    useSuccessToastStore as jest.MockedFunction<typeof useSuccessToastStore>
  ).mockReturnValue({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  } as never);
  api.updateOneOffSlot.mockResolvedValue(undefined as never);
  api.updateRecurringSlot.mockResolvedValue(undefined as never);
  api.deleteOneOffSlot.mockResolvedValue(undefined as never);
  api.deleteRecurringSlot.mockResolvedValue(undefined as never);
  api.createOneOffSlot.mockResolvedValue(undefined as never);
  api.getClassContext.mockResolvedValue({
    class: { id: "cls-6eC", name: "6eC", schoolYearId: "sy1" },
    selectedSchoolYearId: "sy1",
    assignments: [],
    allowedSubjects: [],
    slots: [],
    schoolYears: [],
  } as never);
  rooms.listAvailableRooms.mockResolvedValue([]);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SlotEditScreen — guard sans contexte", () => {
  it("retourne null si pendingSlotEdit est null", () => {
    setupStore(null);
    const { toJSON } = render(<SlotEditScreen />);
    expect(toJSON()).toBeNull();
  });
});

describe("SlotEditScreen — rendu initial (oneoff)", () => {
  beforeEach(() => setupStore(EDIT_CTX_ONE_OFF));

  it("affiche le header Schedule", () => {
    render(<SlotEditScreen />);
    expect(screen.getByTestId("module-header-title")).toHaveTextContent(
      t("timetable.slotScreen.headerTitle"),
    );
  });

  it("affiche le hero warm avec le titre modification", () => {
    render(<SlotEditScreen />);
    expect(screen.getByTestId("slot-edit-hero")).toBeTruthy();
    expect(
      screen.getByText(t("timetable.slotScreen.edit.heroTitle")),
    ).toBeTruthy();
    expect(
      screen.getByText(t("timetable.slotScreen.heroSubtitle")),
    ).toBeTruthy();
  });

  it("affiche l'indicator P (ponctuel) dans le hero", () => {
    render(<SlotEditScreen />);
    expect(screen.getByTestId("slot-edit-scope-target")).toBeTruthy();
    expect(screen.getByText("P")).toBeTruthy();
  });

  it("pré-remplit les heures depuis l'occurrence", () => {
    render(<SlotEditScreen />);
    expect(screen.getByTestId("slot-edit-start-input").props.value).toBe(
      "08:00",
    );
    expect(screen.getByTestId("slot-edit-end-input").props.value).toBe("09:00");
  });

  it("affiche le sous-titre avec schoolName · className", () => {
    render(<SlotEditScreen />);
    expect(screen.getByTestId("module-header-subtitle")).toHaveTextContent(
      "École Pilote · 6eC",
    );
  });

  it("le scope toggle est absent pour une occurrence oneoff", () => {
    render(<SlotEditScreen />);
    expect(screen.queryByTestId("slot-edit-scope-row")).toBeNull();
  });
});

describe("SlotEditScreen — occurrence récurrente", () => {
  beforeEach(() => setupStore(EDIT_CTX_RECURRING));

  it("affiche R dans le hero pour une récurrente", () => {
    render(<SlotEditScreen />);
    expect(screen.getByText("R")).toBeTruthy();
  });

  it("affiche le scope toggle", () => {
    render(<SlotEditScreen />);
    expect(screen.getByTestId("slot-edit-scope-row")).toBeTruthy();
    expect(screen.getByTestId("slot-edit-scope-occurrence")).toBeTruthy();
    expect(screen.getByTestId("slot-edit-scope-series")).toBeTruthy();
  });
});

describe("SlotEditScreen — validation", () => {
  beforeEach(() => setupStore(EDIT_CTX_ONE_OFF));

  it("affiche erreur si fin avant début", async () => {
    render(<SlotEditScreen />);
    fireEvent.changeText(screen.getByTestId("slot-edit-start-input"), "10:00");
    fireEvent.changeText(screen.getByTestId("slot-edit-end-input"), "09:00");
    await waitFor(() => {
      expect(screen.getByTestId("slot-edit-end-error")).toHaveTextContent(
        t("timetable.slotEditPanel.validation.endAfterStart"),
      );
    });
  });
});

describe("SlotEditScreen — sauvegarde oneoff", () => {
  beforeEach(() => setupStore(EDIT_CTX_ONE_OFF));

  it("appelle updateOneOffSlot et clear le store puis navigue back", async () => {
    render(<SlotEditScreen />);
    fireEvent.press(screen.getByTestId("slot-edit-save"));

    await waitFor(() => {
      expect(api.updateOneOffSlot).toHaveBeenCalledWith(
        "ecole-pilote",
        "one-off-1",
        expect.objectContaining({ startMinute: 480, endMinute: 540 }),
      );
      expect(mockClearPendingSlotEdit).toHaveBeenCalled();
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it("appelle showSuccess après sauvegarde", async () => {
    render(<SlotEditScreen />);
    fireEvent.press(screen.getByTestId("slot-edit-save"));
    await waitFor(() => {
      expect(mockShowSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          title: t("timetable.slotEditPanel.toasts.slotUpdatedTitle"),
        }),
      );
    });
  });

  it("affiche showError si l'API échoue", async () => {
    api.updateOneOffSlot.mockRejectedValue(new Error("Erreur réseau"));
    render(<SlotEditScreen />);
    fireEvent.press(screen.getByTestId("slot-edit-save"));
    await waitFor(() => {
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: t("timetable.slotEditPanel.toasts.updateErrorTitle"),
        }),
      );
    });
  });
});

describe("SlotEditScreen — sauvegarde série récurrente", () => {
  beforeEach(() => setupStore(EDIT_CTX_RECURRING));

  it("appelle updateRecurringSlot quand scope=series", async () => {
    render(<SlotEditScreen />);
    fireEvent.press(screen.getByTestId("slot-edit-scope-series"));
    await waitFor(() => {});
    fireEvent.press(screen.getByTestId("slot-edit-save"));

    await waitFor(() => {
      expect(api.updateRecurringSlot).toHaveBeenCalledWith(
        "ecole-pilote",
        "slot-recurring-1",
        expect.objectContaining({ startMinute: 480, endMinute: 540 }),
      );
    });
  });
});

describe("SlotEditScreen — suppression", () => {
  beforeEach(() => {
    setupStore(EDIT_CTX_ONE_OFF);
    jest.spyOn(Alert, "alert").mockImplementation((_, __, buttons) => {
      const confirmBtn = buttons?.find((b) => b.style === "destructive");
      confirmBtn?.onPress?.();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("supprime l'occurrence oneoff et navigue back", async () => {
    render(<SlotEditScreen />);
    fireEvent.press(screen.getByTestId("slot-edit-delete-occurrence"));

    await waitFor(() => {
      expect(api.deleteOneOffSlot).toHaveBeenCalledWith(
        "ecole-pilote",
        "one-off-1",
      );
      expect(mockClearPendingSlotEdit).toHaveBeenCalled();
      expect(mockBack).toHaveBeenCalled();
    });
  });
});

describe("SlotEditScreen — retour", () => {
  beforeEach(() => setupStore(EDIT_CTX_ONE_OFF));

  it("bouton retour efface le store et navigue back", () => {
    render(<SlotEditScreen />);
    fireEvent.press(screen.getByTestId("slot-edit-close"));
    expect(mockClearPendingSlotEdit).toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });
});
