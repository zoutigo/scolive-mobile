import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { ClassTimetableManagerScreen } from "../../src/components/timetable/ClassTimetableManagerScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { useTimetableStore } from "../../src/store/timetable.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockListAvailableRooms = jest.fn();
jest.mock("../../src/api/rooms.api", () => ({
  roomsApi: {
    listRooms: jest.fn().mockResolvedValue([]),
    listAvailableRooms: (...args: unknown[]) => mockListAvailableRooms(...args),
  },
}));

const mockBack = jest.fn();
const mockLoadClassContext = jest.fn();
const mockLoadClassTimetable = jest.fn();
const mockCreateRecurringSlot = jest.fn().mockResolvedValue(undefined);

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ classId: "class-1", schoolYearId: "sy1" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockListAvailableRooms.mockResolvedValue([
    {
      id: "room-1",
      name: "B14",
      description: null,
      capacity: 30,
      maxConcurrentSlots: 1,
      status: "AVAILABLE",
      occupiedSlots: 0,
      isAvailable: true,
    },
    {
      id: "room-gym",
      name: "Gymnase",
      description: null,
      capacity: 100,
      maxConcurrentSlots: 3,
      status: "AVAILABLE",
      occupiedSlots: 3,
      isAvailable: false,
    },
  ]);
  useSuccessToastStore.getState().hide();
  useAuthStore.setState({
    user: {
      id: "u1",
      firstName: "Valery",
      lastName: "Mbele",
      platformRoles: [],
      memberships: [{ schoolId: "s1", role: "SCHOOL_ADMIN" }],
      profileCompleted: true,
      role: "SCHOOL_ADMIN",
      activeRole: "SCHOOL_ADMIN",
    },
    schoolSlug: "college-vogt",
    accessToken: "token",
    isAuthenticated: true,
    isLoading: false,
    authErrorMessage: null,
  });

  useTimetableStore.setState({
    classContext: {
      class: {
        id: "class-1",
        name: "6e A",
        schoolId: "s1",
        schoolYearId: "sy1",
        academicLevelId: null,
        curriculumId: null,
        referentTeacherUserId: "u1",
      },
      allowedSubjects: [{ id: "math", name: "Maths" }],
      assignments: [
        {
          teacherUserId: "t1",
          subjectId: "math",
          subject: { id: "math", name: "Maths" },
          teacherUser: {
            id: "t1",
            firstName: "Paul",
            lastName: "Manga",
            email: null,
          },
        },
      ],
      subjectStyles: [],
      schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
      selectedSchoolYearId: "sy1",
    },
    classTimetable: {
      class: { id: "class-1", schoolYearId: "sy1", academicLevelId: null },
      slots: [],
      oneOffSlots: [],
      slotExceptions: [],
      occurrences: [],
      calendarEvents: [],
      subjectStyles: [],
    },
    isLoadingClassContext: false,
    isLoadingClassTimetable: false,
    isSubmitting: false,
    errorMessage: null,
    loadClassContext: mockLoadClassContext.mockResolvedValue({
      selectedSchoolYearId: "sy1",
      class: { schoolYearId: "sy1" },
      assignments: [{ subjectId: "math", teacherUserId: "t1" }],
    }),
    loadClassTimetable: mockLoadClassTimetable.mockResolvedValue(undefined),
    createRecurringSlot: mockCreateRecurringSlot,
    updateRecurringSlot: jest.fn(),
    deleteRecurringSlot: jest.fn(),
    createOneOffSlot: jest.fn(),
    updateOneOffSlot: jest.fn(),
    deleteOneOffSlot: jest.fn(),
    createCalendarEvent: mockCreateCalendarEvent,
    updateCalendarEvent: jest.fn(),
    deleteCalendarEvent: jest.fn(),
    clearError: jest.fn(),
  } as never);
});

const mockCreateCalendarEvent = jest.fn().mockResolvedValue(undefined);

describe("ClassTimetableManagerScreen", () => {
  it("charge le contexte et l'agenda de classe au montage", async () => {
    render(<ClassTimetableManagerScreen />);

    expect(screen.getByTestId("class-timetable-header")).toBeOnTheScreen();
    expect(screen.getByTestId("class-timetable-back-btn")).toBeOnTheScreen();

    await waitFor(() => {
      expect(mockLoadClassContext).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        "sy1",
      );
    });
  });

  it("permet d'ajouter un créneau récurrent", async () => {
    render(<ClassTimetableManagerScreen />);

    await waitFor(() => {
      expect(mockLoadClassContext).toHaveBeenCalled();
    });
    fireEvent.press(screen.getByTestId("class-timetable-tab-slots"));
    fireEvent.press(screen.getByTestId("slot-form-submit"));

    await waitFor(() => {
      expect(mockCreateRecurringSlot).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        expect.objectContaining({
          subjectId: "math",
          teacherUserId: "t1",
          weekday: 1,
        }),
      );
    });
  });

  it("affiche les salles disponibles et soumet la salle sélectionnée", async () => {
    render(<ClassTimetableManagerScreen />);

    await waitFor(() => {
      expect(mockLoadClassContext).toHaveBeenCalled();
    });
    fireEvent.press(screen.getByTestId("class-timetable-tab-slots"));

    await waitFor(() => {
      expect(mockListAvailableRooms).toHaveBeenCalled();
    });

    expect(await screen.findByTestId("slot-form-room-room-1")).toBeTruthy();
    expect(screen.getByText("B14")).toBeTruthy();
    expect(screen.getByText("Gymnase (complet)")).toBeTruthy();

    fireEvent.press(screen.getByTestId("slot-form-room-room-1"));
    fireEvent.press(screen.getByTestId("slot-form-submit"));

    await waitFor(() => {
      expect(mockCreateRecurringSlot).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        expect.objectContaining({ roomId: "room-1" }),
      );
    });
  });

  it("marque une salle indisponible ou en maintenance dans le sélecteur", async () => {
    mockListAvailableRooms.mockResolvedValue([
      {
        id: "room-2",
        name: "A08",
        description: null,
        capacity: 25,
        maxConcurrentSlots: 1,
        status: "UNAVAILABLE",
        occupiedSlots: 0,
        isAvailable: false,
      },
    ]);

    render(<ClassTimetableManagerScreen />);
    await waitFor(() => expect(mockLoadClassContext).toHaveBeenCalled());
    fireEvent.press(screen.getByTestId("class-timetable-tab-slots"));

    expect(await screen.findByText("A08 (indisponible)")).toBeTruthy();
  });

  it("utilise le sélecteur d'heure réutilisable pour le formulaire récurrent", async () => {
    render(<ClassTimetableManagerScreen />);

    await waitFor(() => {
      expect(mockLoadClassContext).toHaveBeenCalled();
    });
    fireEvent.press(screen.getByTestId("class-timetable-tab-slots"));
    fireEvent.press(screen.getByTestId("slot-form-start"));
    await waitFor(() =>
      expect(screen.getByTestId("slot-form-start-modal")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("slot-form-start-hour-09"));
    fireEvent.press(screen.getByTestId("slot-form-start-minute-15"));
    fireEvent.press(screen.getByTestId("slot-form-start-confirm"));

    fireEvent.press(screen.getByTestId("slot-form-end"));
    await waitFor(() =>
      expect(screen.getByTestId("slot-form-end-modal")).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("slot-form-end-hour-10"));
    fireEvent.press(screen.getByTestId("slot-form-end-minute-05"));
    fireEvent.press(screen.getByTestId("slot-form-end-confirm"));
    fireEvent.press(screen.getByTestId("slot-form-submit"));

    await waitFor(() => {
      expect(mockCreateRecurringSlot).toHaveBeenCalledWith(
        "college-vogt",
        "class-1",
        expect.objectContaining({
          startMinute: 555,
          endMinute: 605,
        }),
      );
    });
  });

  it("le bouton du formulaire créneau est actif par défaut (pas de blocage isValid)", async () => {
    render(<ClassTimetableManagerScreen />);
    await waitFor(() => expect(mockLoadClassContext).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId("class-timetable-tab-slots"));

    const submitBtn = screen.getByTestId("slot-form-submit");
    expect(submitBtn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("valide le libellé de fermeture et affiche une erreur si vide", async () => {
    render(<ClassTimetableManagerScreen />);
    await waitFor(() => expect(mockLoadClassContext).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId("class-timetable-tab-holidays"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("holiday-form-submit"));
    });

    await waitFor(() => {
      expect(
        screen.getByText("Le libellé de fermeture est obligatoire."),
      ).toBeTruthy();
    });
    expect(mockCreateCalendarEvent).not.toHaveBeenCalled();
  });

  it("câblage scroll-vers-erreur : onLayout sur la section fermeture ne crashe pas", async () => {
    render(<ClassTimetableManagerScreen />);
    await waitFor(() => expect(mockLoadClassContext).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId("class-timetable-tab-holidays"));

    const labelGroup = screen.getByTestId("holiday-form-label").parent;
    expect(() =>
      fireEvent(labelGroup!, "layout", {
        nativeEvent: { layout: { x: 0, y: 80, width: 320, height: 60 } },
      }),
    ).not.toThrow();

    await act(async () => {
      fireEvent.press(screen.getByTestId("holiday-form-submit"));
    });

    await waitFor(() => {
      expect(
        screen.getByText("Le libellé de fermeture est obligatoire."),
      ).toBeTruthy();
    });
  });

  it("soumet une fermeture valide", async () => {
    render(<ClassTimetableManagerScreen />);
    await waitFor(() => expect(mockLoadClassContext).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId("class-timetable-tab-holidays"));
    fireEvent.changeText(
      screen.getByTestId("holiday-form-label"),
      "Fête nationale",
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("holiday-form-submit"));
    });

    await waitFor(() => {
      expect(mockCreateCalendarEvent).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({ label: "Fête nationale", scope: "SCHOOL" }),
      );
    });
  });

  describe("Sélection multi-jours des créneaux récurrents", () => {
    it("sélectionne plusieurs jours et crée un slot par jour", async () => {
      render(<ClassTimetableManagerScreen />);
      await waitFor(() => expect(mockLoadClassContext).toHaveBeenCalled());
      fireEvent.press(screen.getByTestId("class-timetable-tab-slots"));

      // Lundi déjà sélectionné par défaut, on ajoute Mercredi et Vendredi
      fireEvent.press(screen.getByTestId("slot-form-weekday-3")); // Mer
      fireEvent.press(screen.getByTestId("slot-form-weekday-5")); // Ven
      fireEvent.press(screen.getByTestId("slot-form-submit"));

      await waitFor(() => {
        expect(mockCreateRecurringSlot).toHaveBeenCalledTimes(3);
        expect(mockCreateRecurringSlot).toHaveBeenCalledWith(
          "college-vogt",
          "class-1",
          expect.objectContaining({ weekday: 1 }),
        );
        expect(mockCreateRecurringSlot).toHaveBeenCalledWith(
          "college-vogt",
          "class-1",
          expect.objectContaining({ weekday: 3 }),
        );
        expect(mockCreateRecurringSlot).toHaveBeenCalledWith(
          "college-vogt",
          "class-1",
          expect.objectContaining({ weekday: 5 }),
        );
      });
    });

    it("désélectionner le seul jour sélectionné ne décoche pas (1 minimum)", async () => {
      render(<ClassTimetableManagerScreen />);
      await waitFor(() => expect(mockLoadClassContext).toHaveBeenCalled());
      fireEvent.press(screen.getByTestId("class-timetable-tab-slots"));

      // Lundi seul sélectionné : essai de décocher ne doit pas vider la liste
      fireEvent.press(screen.getByTestId("slot-form-weekday-1"));
      fireEvent.press(screen.getByTestId("slot-form-submit"));

      await waitFor(() => {
        // Le submit crée toujours au moins 1 slot (lundi reste sélectionné)
        expect(mockCreateRecurringSlot).toHaveBeenCalledWith(
          "college-vogt",
          "class-1",
          expect.objectContaining({ weekday: 1 }),
        );
      });
    });

    it("en édition (slotEditId), affiche un PillSelector mono-sélection", async () => {
      const mockUpdateRecurringSlot = jest.fn().mockResolvedValue(undefined);
      useTimetableStore.setState(
        (s) =>
          ({
            ...s,
            updateRecurringSlot: mockUpdateRecurringSlot,
            classTimetable: {
              class: {
                id: "class-1",
                schoolYearId: "sy1",
                academicLevelId: null,
              },
              slots: [
                {
                  id: "slot-edit-1",
                  weekday: 3,
                  startMinute: 480,
                  endMinute: 570,
                  room: null,
                  roomId: null,
                  activeFromDate: "2025-09-01",
                  activeToDate: "2026-06-30",
                  subject: { id: "math", name: "Maths" },
                  teacherUser: {
                    id: "t1",
                    firstName: "Paul",
                    lastName: "Manga",
                    email: null,
                  },
                },
              ],
              oneOffSlots: [],
              slotExceptions: [],
              occurrences: [],
              calendarEvents: [],
              subjectStyles: [],
            },
          }) as never,
      );

      render(<ClassTimetableManagerScreen />);
      await waitFor(() => expect(mockLoadClassContext).toHaveBeenCalled());

      // On bascule sur l'onglet slots
      fireEvent.press(screen.getByTestId("class-timetable-tab-slots"));

      // On clique sur "edit" du slot existant
      fireEvent.press(screen.getByTestId("slot-edit-slot-edit-1"));

      // Le formulaire est maintenant en mode édition (slotEditId défini)
      // On change le jour (Mercredi vers Jeudi)
      fireEvent.press(screen.getByTestId("slot-form-weekday-4")); // Jeu
      fireEvent.press(screen.getByTestId("slot-form-submit"));

      await waitFor(() => {
        expect(mockUpdateRecurringSlot).toHaveBeenCalledWith(
          "college-vogt",
          "slot-edit-1",
          expect.objectContaining({ weekday: 4 }),
        );
        // En édition, create ne doit pas avoir été appelé
        expect(mockCreateRecurringSlot).not.toHaveBeenCalled();
      });
    });
  });
});
