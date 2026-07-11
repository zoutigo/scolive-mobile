import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Linking } from "react-native";
import { ModerationReviewScreen } from "../../src/components/resources/ModerationReviewScreen";
import { resourcesApi, resourcesAdminApi } from "../../src/api/resources.api";
import type {
  ResourceDetail,
  ResourceSubmission,
} from "../../src/types/resources.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/resources.api");
const mockRouterBack = jest.fn();
const mockRouterNavigate = jest.fn();
const mockCanGoBack = jest.fn(() => false);
jest.mock("expo-router", () => ({
  useRouter: () => ({
    canGoBack: mockCanGoBack,
    back: mockRouterBack,
    navigate: mockRouterNavigate,
  }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockResourcesApi = resourcesApi as jest.Mocked<typeof resourcesApi>;
const mockResourcesAdminApi = resourcesAdminApi as jest.Mocked<
  typeof resourcesAdminApi
>;

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
  statementContent: "<p>Voici l'énoncé complet</p>",
  statementStatus: "APPROVED",
  correctionContent: null,
  correctionStatus: "PENDING",
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-01T10:00:00.000Z",
  school: { id: "school-1", name: "École Test" },
  academicLevel: { id: "level-1", code: "6EME", label: "6ème" },
  subject: { id: "subject-1", name: "Mathématiques" },
  authorUser: { id: "teacher-1", firstName: "Paul", lastName: "Martin" },
  attachments: [
    {
      id: "att-1",
      part: "STATEMENT",
      fileName: "sujet.pdf",
      fileUrl: "https://files.example.com/sujet.pdf",
    },
  ],
};

function makeSubmission(
  overrides: Partial<ResourceSubmission> = {},
): ResourceSubmission {
  return {
    id: "sub-1",
    resourceId: "res-1",
    part: "CORRECTION",
    status: "AWAITING",
    content: "<p>Voici le corrigé proposé</p>",
    reason: null,
    createdAt: "2026-07-02T10:00:00.000Z",
    updatedAt: "2026-07-02T10:00:00.000Z",
    reviewedAt: null,
    authorUser: { id: "teacher-2", firstName: "Léa", lastName: "Dupont" },
    attachments: [
      {
        id: "att-9",
        part: "CORRECTION",
        fileName: "correction-scanne.pdf",
        fileUrl: "https://files.example.com/correction-scanne.pdf",
      },
    ],
    ...overrides,
  };
}

describe("ModerationReviewScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(false);
  });

  it("affiche un message d'erreur si la soumission n'est plus trouvée", async () => {
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    mockResourcesApi.listSubmissions.mockResolvedValue([]);

    render(
      <ModerationReviewScreen
        submissionId="missing-sub"
        resourceId="res-1"
        part="correction"
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-moderation-review-notfound"),
      ).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("resources-moderation-review-approve"),
    ).toBeNull();
  });

  it("modération d'un corrigé : affiche l'énoncé de référence approuvé et le contenu proposé", async () => {
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    mockResourcesApi.listSubmissions.mockResolvedValue([makeSubmission()]);

    render(
      <ModerationReviewScreen
        submissionId="sub-1"
        resourceId="res-1"
        part="correction"
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-moderation-review-reference"),
      ).toBeTruthy(),
    );
    expect(
      screen.getByTestId("resources-moderation-review-reference").props
        .children,
    ).toBe("Voici l'énoncé complet");
    expect(
      screen.getByTestId("resources-moderation-review-content").props
        .children,
    ).toBe("Voici le corrigé proposé");
    expect(screen.getByText(/Léa Dupont/)).toBeTruthy();
    expect(mockResourcesApi.listSubmissions).toHaveBeenCalledWith(
      "res-1",
      "correction",
    );
  });

  it("modération d'un corrigé : signale quand l'énoncé n'est pas encore approuvé", async () => {
    mockResourcesApi.getResource.mockResolvedValue({
      ...BASE_DETAIL,
      statementStatus: "PENDING",
    });
    mockResourcesApi.listSubmissions.mockResolvedValue([makeSubmission()]);

    render(
      <ModerationReviewScreen
        submissionId="sub-1"
        resourceId="res-1"
        part="correction"
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-moderation-review-content"),
      ).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("resources-moderation-review-reference"),
    ).toBeNull();
  });

  it("modération d'un énoncé : n'affiche aucun bloc de référence", async () => {
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    mockResourcesApi.listSubmissions.mockResolvedValue([
      makeSubmission({ part: "STATEMENT", content: "<p>Nouvel énoncé</p>" }),
    ]);

    render(
      <ModerationReviewScreen
        submissionId="sub-1"
        resourceId="res-1"
        part="statement"
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-moderation-review-content"),
      ).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("resources-moderation-review-reference"),
    ).toBeNull();
    expect(mockResourcesApi.listSubmissions).toHaveBeenCalledWith(
      "res-1",
      "statement",
    );
  });

  it("ouvre une pièce jointe au tap", async () => {
    const openURLSpy = jest
      .spyOn(Linking, "openURL")
      .mockResolvedValue(true as never);
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    mockResourcesApi.listSubmissions.mockResolvedValue([makeSubmission()]);

    render(
      <ModerationReviewScreen
        submissionId="sub-1"
        resourceId="res-1"
        part="correction"
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-moderation-review-attachment-0"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("resources-moderation-review-attachment-0"),
    );

    expect(openURLSpy).toHaveBeenCalledWith(
      "https://files.example.com/correction-scanne.pdf",
    );
  });

  it("approuve la soumission puis revient en arrière", async () => {
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    mockResourcesApi.listSubmissions.mockResolvedValue([makeSubmission()]);
    mockResourcesAdminApi.approveSubmission.mockResolvedValue({
      ...BASE_DETAIL,
    });

    render(
      <ModerationReviewScreen
        submissionId="sub-1"
        resourceId="res-1"
        part="correction"
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-moderation-review-approve"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-moderation-review-approve"));

    await waitFor(() =>
      expect(mockResourcesAdminApi.approveSubmission).toHaveBeenCalledWith(
        "sub-1",
      ),
    );
    await waitFor(() => expect(mockRouterNavigate).toHaveBeenCalledWith("/"));
  });

  it("rejette la soumission avec le motif saisi puis revient en arrière", async () => {
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    mockResourcesApi.listSubmissions.mockResolvedValue([makeSubmission()]);
    mockResourcesAdminApi.rejectSubmission.mockResolvedValue(
      makeSubmission({ status: "REJECTED" }),
    );

    render(
      <ModerationReviewScreen
        submissionId="sub-1"
        resourceId="res-1"
        part="correction"
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-moderation-review-reject"),
      ).toBeTruthy(),
    );
    fireEvent.changeText(
      screen.getByTestId("resources-moderation-review-reason"),
      "Corrigé incomplet",
    );
    fireEvent.press(screen.getByTestId("resources-moderation-review-reject"));

    await waitFor(() =>
      expect(mockResourcesAdminApi.rejectSubmission).toHaveBeenCalledWith(
        "sub-1",
        "Corrigé incomplet",
      ),
    );
    await waitFor(() => expect(mockRouterNavigate).toHaveBeenCalledWith("/"));
  });

  it("conflit de concurrence (409) : affiche un message explicite et recharge la soumission", async () => {
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    mockResourcesApi.listSubmissions.mockResolvedValue([makeSubmission()]);
    mockResourcesAdminApi.approveSubmission.mockRejectedValue(
      Object.assign(new Error("Conflit"), { statusCode: 409 }),
    );

    render(
      <ModerationReviewScreen
        submissionId="sub-1"
        resourceId="res-1"
        part="correction"
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-moderation-review-approve"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-moderation-review-approve"));

    await waitFor(() =>
      expect(mockResourcesAdminApi.approveSubmission).toHaveBeenCalled(),
    );
    await waitFor(() =>
      expect(mockResourcesApi.listSubmissions).toHaveBeenCalledTimes(2),
    );
    expect(mockRouterNavigate).not.toHaveBeenCalled();
  });
});
