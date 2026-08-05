/**
 * Tests unitaires du hook useSelfStudentContext.
 * Couvre : résolution de l'identité self via /timetable/me (sans childId),
 * état de chargement, gestion d'erreur.
 */
import { renderHook, waitFor } from "@testing-library/react-native";
import { timetableApi } from "../../src/api/timetable.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSelfStudentContext } from "../../src/hooks/useSelfStudentContext";
import type { MyTimetableResponse } from "../../src/types/timetable.types";

jest.mock("../../src/api/timetable.api");

const mockTimetableApi = timetableApi as jest.Mocked<typeof timetableApi>;

function makeTimetableResponse(): MyTimetableResponse {
  return {
    student: { id: "student-self-1", firstName: "Lisa", lastName: "Mbele" },
    class: { id: "class-1", name: "6ème A" },
    slots: [],
    oneOffSlots: [],
    slotExceptions: [],
    occurrences: [],
    calendarEvents: [],
    subjectStyles: [],
  } as unknown as MyTimetableResponse;
}

describe("useSelfStudentContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ schoolSlug: "ecole-test" } as never);
  });

  it("resolves the student's own identity without passing a childId", async () => {
    mockTimetableApi.getMyTimetable.mockResolvedValue(makeTimetableResponse());

    const { result } = renderHook(() => useSelfStudentContext());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockTimetableApi.getMyTimetable).toHaveBeenCalledWith(
      "ecole-test",
      {},
    );
    expect(result.current.studentId).toBe("student-self-1");
    expect(result.current.firstName).toBe("Lisa");
    expect(result.current.classId).toBe("class-1");
    expect(result.current.className).toBe("6ème A");
    expect(result.current.error).toBeNull();
  });

  it("exposes an error when self-resolution fails", async () => {
    mockTimetableApi.getMyTimetable.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useSelfStudentContext());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("self-context-load-failed");
    expect(result.current.studentId).toBeUndefined();
  });
});
