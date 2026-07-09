import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Linking } from "react-native";
import { ResourceDetailScreen } from "../../src/components/resources/ResourceDetailScreen";
import { resourcesApi } from "../../src/api/resources.api";
import type { ResourceDetail } from "../../src/types/resources.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/resources.api");
jest.mock("expo-router", () => ({
  useRouter: () => ({
    canGoBack: () => false,
    back: jest.fn(),
    navigate: jest.fn(),
  }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockResourcesApi = resourcesApi as jest.Mocked<typeof resourcesApi>;

const BASE_DETAIL: ResourceDetail = {
  id: "res-1",
  kind: "ASSESSMENT",
  schoolId: "school-1",
  academicLevelId: "level-1",
  subjectId: "subject-1",
  examType: "SEQUENCE_TEST",
  sequence: "SEQ_1",
  academicYearLabel: "2025-2026",
  title: "Contrôle chapitre 3",
  authorUserId: "teacher-1",
  statementStatus: "APPROVED",
  correctionContent: "<p>Le <b>corrigé</b> détaillé</p>",
  correctionStatus: "PENDING",
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-01T10:00:00.000Z",
  school: { id: "school-1", name: "École Test" },
  academicLevel: { id: "level-1", code: "6EME", label: "6ème" },
  subject: { id: "subject-1", name: "Mathématiques" },
  authorUser: { id: "teacher-1", firstName: "Paul", lastName: "Martin" },
  statementContent: "<p>Voici l'<i>énoncé</i> complet</p>",
  attachments: [
    {
      id: "att-1",
      part: "STATEMENT",
      fileName: "sujet.pdf",
      fileUrl: "https://files.example.com/sujet.pdf",
    },
    {
      id: "att-2",
      part: "CORRECTION",
      fileName: "corrige.pdf",
      fileUrl: "https://files.example.com/corrige.pdf",
    },
  ],
};

describe("ResourceDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("affiche un loader pendant le chargement", () => {
    mockResourcesApi.getResource.mockReturnValue(new Promise(() => {}));
    render(<ResourceDetailScreen resourceId="res-1" part="statement" />);

    expect(
      screen.getByTestId("resources-detail-screen-statement"),
    ).toBeTruthy();
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    mockResourcesApi.getResource.mockRejectedValue(new Error("boom"));
    render(<ResourceDetailScreen resourceId="res-1" part="statement" />);

    await waitFor(() =>
      expect(mockResourcesApi.getResource).toHaveBeenCalledWith("res-1"),
    );
    await waitFor(() =>
      expect(
        screen.queryByTestId("resources-detail-content-statement"),
      ).toBeNull(),
    );
  });

  it("affiche l'énoncé en texte, sans les pièces jointes du corrigé", async () => {
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    render(<ResourceDetailScreen resourceId="res-1" part="statement" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-content-statement"),
      ).toBeTruthy(),
    );
    expect(screen.getByText("Voici l' énoncé complet")).toBeTruthy();
    expect(
      screen.getByTestId("resources-detail-attachment-statement-0"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("resources-detail-attachment-statement-1"),
    ).toBeNull();
  });

  it("affiche le corrigé et son badge de statut quand il n'est pas approuvé", async () => {
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    render(<ResourceDetailScreen resourceId="res-1" part="correction" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-content-correction"),
      ).toBeTruthy(),
    );
    expect(screen.getByText("Le corrigé détaillé")).toBeTruthy();
    expect(
      screen.getByTestId("resources-detail-status-correction"),
    ).toBeTruthy();
  });

  it("masque le badge de statut quand le corrigé est approuvé", async () => {
    mockResourcesApi.getResource.mockResolvedValue({
      ...BASE_DETAIL,
      correctionStatus: "APPROVED",
    });
    render(<ResourceDetailScreen resourceId="res-1" part="correction" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-content-correction"),
      ).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("resources-detail-status-correction"),
    ).toBeNull();
  });

  it("ouvre la pièce jointe au tap", async () => {
    const openURLSpy = jest
      .spyOn(Linking, "canOpenURL")
      .mockResolvedValue(true);
    const openSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    render(<ResourceDetailScreen resourceId="res-1" part="statement" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-attachment-statement-0"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("resources-detail-attachment-statement-0"),
    );

    await waitFor(() =>
      expect(openSpy).toHaveBeenCalledWith(
        "https://files.example.com/sujet.pdf",
      ),
    );
    openURLSpy.mockRestore();
    openSpy.mockRestore();
  });
});
