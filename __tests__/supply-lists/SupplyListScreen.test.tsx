import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { SupplyListScreen } from "../../src/components/supply-lists/SupplyListScreen";
import { supplyListsApi } from "../../src/api/supply-lists.api";
import { useAuthStore } from "../../src/store/auth.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/supply-lists.api");
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const supplyListsApiMock = supplyListsApi as jest.Mocked<typeof supplyListsApi>;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ schoolSlug: "college-vogt" } as never);
});

describe("SupplyListScreen", () => {
  it("affiche un etat 'pas encore ouverte' quand aucune annee cible n'est resolue", async () => {
    supplyListsApiMock.getMyChildSupplyList.mockResolvedValue({
      targetSchoolYearId: null,
      items: [],
    });
    render(
      <SupplyListScreen
        studentId="student-1"
        studentLabel="Remi Ntamack"
        viewerRole="parent"
        onBack={jest.fn()}
      />,
    );

    expect(
      await screen.findByText(
        /La liste de fournitures sera disponible une fois/,
      ),
    ).toBeTruthy();
    expect(supplyListsApiMock.markMyChildSupplyListSeen).not.toHaveBeenCalled();
  });

  it("affiche les articles tries par rang et marque la liste comme vue pour un parent", async () => {
    supplyListsApiMock.getMyChildSupplyList.mockResolvedValue({
      targetSchoolYearId: "sy-2026",
      targetSchoolYearLabel: "2026-2027",
      seen: false,
      items: [
        { id: "i2", rank: 2, label: "Stylo bleu", quantity: 4, note: null },
        {
          id: "i1",
          rank: 1,
          label: "Cahier 100 pages",
          quantity: 3,
          note: "Grand format",
        },
      ],
    });
    render(
      <SupplyListScreen
        studentId="student-1"
        studentLabel="Remi Ntamack"
        viewerRole="parent"
        onBack={jest.fn()}
      />,
    );

    expect(await screen.findByText(/Cahier 100 pages/)).toBeTruthy();
    expect(screen.getByText(/Stylo bleu/)).toBeTruthy();
    expect(screen.getByText(/Grand format/)).toBeTruthy();
    expect(screen.getByText(/2026-2027/)).toBeTruthy();

    await waitFor(() =>
      expect(supplyListsApiMock.markMyChildSupplyListSeen).toHaveBeenCalledWith(
        "college-vogt",
        "student-1",
      ),
    );
  });

  it("ne marque jamais une liste comme vue pour une consultation eleve", async () => {
    supplyListsApiMock.getMyChildSupplyList.mockResolvedValue({
      targetSchoolYearId: "sy-2026",
      targetSchoolYearLabel: "2026-2027",
      seen: false,
      items: [{ id: "i1", rank: 1, label: "Cahier", quantity: 1, note: null }],
    });
    render(
      <SupplyListScreen
        studentId="student-1"
        studentLabel="Remi Ntamack"
        viewerRole="student"
        onBack={jest.fn()}
      />,
    );

    expect(await screen.findByText(/Cahier/)).toBeTruthy();
    expect(supplyListsApiMock.markMyChildSupplyListSeen).not.toHaveBeenCalled();
  });

  it("ne remarque pas une liste deja vue", async () => {
    supplyListsApiMock.getMyChildSupplyList.mockResolvedValue({
      targetSchoolYearId: "sy-2026",
      targetSchoolYearLabel: "2026-2027",
      seen: true,
      items: [{ id: "i1", rank: 1, label: "Cahier", quantity: 1, note: null }],
    });
    render(
      <SupplyListScreen
        studentId="student-1"
        studentLabel="Remi Ntamack"
        viewerRole="parent"
        onBack={jest.fn()}
      />,
    );

    expect(await screen.findByText(/Cahier/)).toBeTruthy();
    expect(supplyListsApiMock.markMyChildSupplyListSeen).not.toHaveBeenCalled();
  });
});
