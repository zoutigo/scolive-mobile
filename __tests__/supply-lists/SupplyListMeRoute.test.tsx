import React from "react";
import { render, screen } from "@testing-library/react-native";
import SupplyListMeRoute from "../../app/(home)/fournitures/me";
import { supplyListsApi } from "../../src/api/supply-lists.api";
import { timetableApi } from "../../src/api/timetable.api";
import { useAuthStore } from "../../src/store/auth.store";

const mockPush = jest.fn();

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/supply-lists.api");
jest.mock("../../src/api/timetable.api");
jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const supplyListsApiMock = supplyListsApi as jest.Mocked<typeof supplyListsApi>;
const timetableApiMock = timetableApi as jest.Mocked<typeof timetableApi>;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ schoolSlug: "college-vogt" } as never);
  timetableApiMock.getMyTimetable.mockResolvedValue({
    student: {
      id: "self-student-1",
      firstName: "Lisa",
      lastName: "MBELE",
    },
    class: { id: "class-1", name: "6e C" },
  } as never);
  supplyListsApiMock.getMyChildSupplyList.mockResolvedValue({
    targetSchoolYearId: "sy-2026",
    targetSchoolYearLabel: "2026-2027",
    seen: false,
    items: [{ id: "i1", rank: 1, label: "Cahier", quantity: 1, note: null }],
  });
});

describe("SupplyListMeRoute", () => {
  it("resout l'eleve via timetable/me et affiche sa liste sans jamais la marquer comme vue", async () => {
    render(<SupplyListMeRoute />);

    expect(await screen.findByText(/Cahier/)).toBeTruthy();
    expect(supplyListsApiMock.getMyChildSupplyList).toHaveBeenCalledWith(
      "college-vogt",
      "self-student-1",
    );
    expect(supplyListsApiMock.markMyChildSupplyListSeen).not.toHaveBeenCalled();
  });
});
