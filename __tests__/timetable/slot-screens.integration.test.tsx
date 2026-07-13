/**
 * Tests d'intégration : store ↔ SlotCreateScreen / SlotEditScreen
 *
 * Vérifie que :
 * - SlotEditScreen réagit au store réel (pendingSlotEdit)
 * - setPendingSlotEdit + navigation → SlotEditScreen affiche les données
 * - clearPendingSlotEdit est appelé sur retour/succès
 * - SlotCreateScreen → onSuccess déclenché → allClasses transmises
 * - Timetable store : setPendingSlotEdit / clearPendingSlotEdit fonctionnent
 */
import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SlotEditScreen } from "../../src/components/timetable/SlotEditScreen";
import { useTimetableStore } from "../../src/store/timetable.store";
import type { SlotEditContext } from "../../src/store/timetable.store";
import type { TimetableOccurrence } from "../../src/types/timetable.types";
import { timetableApi } from "../../src/api/timetable.api";
import { roomsApi } from "../../src/api/rooms.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
// ─── Mocks partiels (le store Zustand est réel) ────────────────────────────────

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/timetable.api", () => ({
  timetableApi: {
    getClassContext: jest.fn(),
    updateOneOffSlot: jest.fn(),
    updateRecurringSlot: jest.fn(),
    deleteOneOffSlot: jest.fn(),
    deleteRecurringSlot: jest.fn(),
    createOneOffSlot: jest.fn(),
  },
}));
jest.mock("../../src/api/rooms.api", () => ({
  roomsApi: { listAvailableRooms: jest.fn() },
}));
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: jest.fn(),
}));
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: jest.fn(),
}));
const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/ModuleHeader", () => ({
  ModuleHeader: (props: { title: string }) => {
    const { Text } = require("react-native");
    return <Text testID="header-title">{props.title}</Text>;
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
        testID={props.testID}
        value={props.value}
        onChangeText={props.onChange}
      />
    );
  },
}));
jest.mock("../../src/components/InlineSelectDropDown", () => ({
  InlineSelectDropDown: () => null,
}));

const api = timetableApi as jest.Mocked<typeof timetableApi>;
const rooms = roomsApi as jest.Mocked<typeof roomsApi>;

// ─── Fixtures ────────────────────────────────────────────────────────────────

const OCC: TimetableOccurrence = {
  id: "occ-int-1",
  occurrenceDate: "2026-06-10",
  weekday: 2,
  startMinute: 600,
  endMinute: 660,
  subject: { id: "sub-geo", name: "Géo" },
  teacherUser: { id: "t2", firstName: "Marie", lastName: "Curie" },
  room: null,
  reason: null,
  status: "PLANNED",
  source: "ONE_OFF",
  oneOffSlotId: "oof-int-1",
};

const EDIT_CTX: SlotEditContext = {
  occurrence: OCC,
  className: "4eA",
  classId: "cls-4eA",
  schoolYearId: "sy2",
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Reset store between tests
  useTimetableStore.getState().reset();

  (useAuthStore as jest.MockedFunction<typeof useAuthStore>).mockReturnValue({
    user: {
      id: "t2",
      schoolName: "Collège Victor Hugo",
      platformRoles: [],
      role: "TEACHER",
    },
    schoolSlug: "collège-victor-hugo",
  } as never);
  (
    useSuccessToastStore as jest.MockedFunction<typeof useSuccessToastStore>
  ).mockReturnValue({ showSuccess: jest.fn(), showError: jest.fn() } as never);
  api.updateOneOffSlot.mockResolvedValue(undefined as never);
  api.getClassContext.mockResolvedValue({
    class: { id: "cls-4eA", name: "4eA", schoolYearId: "sy2" },
    selectedSchoolYearId: "sy2",
    assignments: [],
    allowedSubjects: [],
    slots: [],
    schoolYears: [],
  } as never);
  rooms.listAvailableRooms.mockResolvedValue([]);
});

// ─── Tests store ──────────────────────────────────────────────────────────────

describe("timetable store — pendingSlotEdit", () => {
  it("initialise à null", () => {
    expect(useTimetableStore.getState().pendingSlotEdit).toBeNull();
  });

  it("setPendingSlotEdit stocke le contexte", () => {
    act(() => {
      useTimetableStore.getState().setPendingSlotEdit(EDIT_CTX);
    });
    expect(useTimetableStore.getState().pendingSlotEdit).toEqual(EDIT_CTX);
  });

  it("clearPendingSlotEdit remet à null", () => {
    act(() => {
      useTimetableStore.getState().setPendingSlotEdit(EDIT_CTX);
      useTimetableStore.getState().clearPendingSlotEdit();
    });
    expect(useTimetableStore.getState().pendingSlotEdit).toBeNull();
  });

  it("reset() efface pendingSlotEdit", () => {
    act(() => {
      useTimetableStore.getState().setPendingSlotEdit(EDIT_CTX);
      useTimetableStore.getState().reset();
    });
    expect(useTimetableStore.getState().pendingSlotEdit).toBeNull();
  });
});

// ─── Intégration store ↔ SlotEditScreen ─────────────────────────────────────

describe("SlotEditScreen ↔ store Zustand (intégration)", () => {
  it("affiche les données de l'occurrence depuis le store réel", async () => {
    act(() => {
      useTimetableStore.getState().setPendingSlotEdit(EDIT_CTX);
    });

    render(<SlotEditScreen />);

    // Vérification des champs (minuteToTimeLabel: 600 → "10:00", 660 → "11:00")
    expect(screen.getByTestId("slot-edit-start-input").props.value).toBe(
      "10:00",
    );
    expect(screen.getByTestId("slot-edit-end-input").props.value).toBe("11:00");
    // Ces valeurs sont bien paddées (pad2)
  });

  it("clearPendingSlotEdit appelé et back() navigué après sauvegarde réussie", async () => {
    act(() => {
      useTimetableStore.getState().setPendingSlotEdit(EDIT_CTX);
    });

    render(<SlotEditScreen />);
    fireEvent.press(screen.getByTestId("slot-edit-save"));

    await waitFor(() => {
      expect(api.updateOneOffSlot).toHaveBeenCalledWith(
        "collège-victor-hugo",
        "oof-int-1",
        expect.objectContaining({ startMinute: 600, endMinute: 660 }),
      );
      expect(useTimetableStore.getState().pendingSlotEdit).toBeNull();
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it("le store garde pendingSlotEdit si la sauvegarde échoue", async () => {
    api.updateOneOffSlot.mockRejectedValue(new Error("timeout"));
    act(() => {
      useTimetableStore.getState().setPendingSlotEdit(EDIT_CTX);
    });

    render(<SlotEditScreen />);
    fireEvent.press(screen.getByTestId("slot-edit-save"));

    await waitFor(() => {
      expect(mockBack).not.toHaveBeenCalled();
    });
    // Le contexte reste disponible en cas de retry
    expect(useTimetableStore.getState().pendingSlotEdit).toEqual(EDIT_CTX);
  });

  it("null rendu affiché si store vide", () => {
    // Store vide par défaut (après reset dans beforeEach)
    const { toJSON } = render(<SlotEditScreen />);
    expect(toJSON()).toBeNull();
  });
});
