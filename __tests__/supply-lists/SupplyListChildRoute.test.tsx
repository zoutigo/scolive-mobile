import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import SupplyListChildScreenRoute from "../../app/(home)/fournitures/[childId]";
import { supplyListsApi } from "../../src/api/supply-lists.api";
import { useFamilyStore } from "../../src/store/family.store";
import { useAuthStore } from "../../src/store/auth.store";

const mockPush = jest.fn();

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/supply-lists.api");
jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ childId: "child-1" }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const supplyListsApiMock = supplyListsApi as jest.Mocked<typeof supplyListsApi>;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ schoolSlug: "college-vogt" } as never);
  useFamilyStore.setState({
    children: [
      {
        id: "child-1",
        firstName: "Remi",
        lastName: "Ntamack",
        classId: "class-1",
      },
    ],
  } as never);
  supplyListsApiMock.getMyChildSupplyList.mockResolvedValue({
    targetSchoolYearId: "sy-2026",
    targetSchoolYearLabel: "2026-2027",
    seen: false,
    items: [{ id: "i1", rank: 1, label: "Cahier", quantity: 1, note: null }],
  });
});

describe("SupplyListChildScreenRoute", () => {
  it("resout le libelle de l'enfant depuis le family store et charge sa liste", async () => {
    render(<SupplyListChildScreenRoute />);

    expect(await screen.findByText(/Cahier/)).toBeTruthy();
    expect(supplyListsApiMock.getMyChildSupplyList).toHaveBeenCalledWith(
      "college-vogt",
      "child-1",
    );
    expect(screen.getByTestId("supply-list-header")).toBeTruthy();
  });

  it("revient vers l'accueil de l'enfant au retour", async () => {
    render(<SupplyListChildScreenRoute />);
    await waitFor(() => screen.getByTestId("btn-back"));

    fireEvent.press(screen.getByTestId("btn-back"));
    expect(mockPush).toHaveBeenCalled();
  });
});
