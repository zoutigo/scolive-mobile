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
import { useAuthStore } from "../../src/store/auth.store";
import type {
  ResourceDetail,
  ResourceSubmission,
} from "../../src/types/resources.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/resources.api");
jest.mock("../../src/store/auth.store");
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
jest.mock("../../src/components/editor/RichEditorField", () => {
  const { forwardRef, useImperativeHandle } = require("react");
  const { TextInput } = require("react-native");
  const RichEditorField = forwardRef((props: any, ref: any) => {
    useImperativeHandle(ref, () => ({
      getContentHtml: async () => props.initialHtml ?? "",
    }));
    return (
      <TextInput
        testID={props.editorTestID}
        value={props.initialHtml}
        onChangeText={() => {}}
        placeholder={props.placeholder}
      />
    );
  });
  return { RichEditorField };
});

const mockResourcesApi = resourcesApi as jest.Mocked<typeof resourcesApi>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

const TEACHER_USER = {
  id: "teacher-1",
  memberships: [{ schoolId: "school-1", role: "TEACHER" as const }],
  platformRoles: [] as never[],
};

const READER_USER = {
  id: "student-1",
  memberships: [{ schoolId: "school-1", role: "STUDENT" as const }],
  platformRoles: [] as never[],
};

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
  statementContent: "<p>Voici l'<i>énoncé</i> complet</p>",
  statementStatus: "APPROVED",
  correctionContent: "<p>Le <b>corrigé</b> détaillé</p>",
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
    {
      id: "att-2",
      part: "CORRECTION",
      fileName: "corrige.pdf",
      fileUrl: "https://files.example.com/corrige.pdf",
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
    status: "DRAFT",
    content: "<p>Brouillon</p>",
    reason: null,
    createdAt: "2026-07-02T10:00:00.000Z",
    updatedAt: "2026-07-02T10:00:00.000Z",
    reviewedAt: null,
    authorUser: { id: "teacher-1", firstName: "Paul", lastName: "Martin" },
    attachments: [],
    ...overrides,
  };
}

describe("ResourceDetailScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: READER_USER } as never);
    mockResourcesApi.listSubmissions.mockResolvedValue([]);
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

  it("affiche le contenu approuvé en texte, sans les pièces jointes de l'autre partie", async () => {
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

  it("affiche un message quand aucun contenu n'est encore approuvé", async () => {
    mockResourcesApi.getResource.mockResolvedValue({
      ...BASE_DETAIL,
      correctionContent: null,
      correctionStatus: "PENDING",
    });
    render(<ResourceDetailScreen resourceId="res-1" part="correction" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-no-approved-correction"),
      ).toBeTruthy(),
    );
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

  it("un lecteur (élève) ne voit pas la zone de contribution", async () => {
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    render(<ResourceDetailScreen resourceId="res-1" part="statement" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-content-statement"),
      ).toBeTruthy(),
    );
    expect(mockResourcesApi.listSubmissions).not.toHaveBeenCalled();
    expect(
      screen.queryByTestId("resources-detail-editor-statement"),
    ).toBeNull();
  });

  it("un enseignant voit un message verrouillé pour le corrigé tant que l'énoncé n'est pas approuvé", async () => {
    mockUseAuthStore.mockReturnValue({ user: TEACHER_USER } as never);
    mockResourcesApi.getResource.mockResolvedValue({
      ...BASE_DETAIL,
      statementStatus: "PENDING",
    });
    render(<ResourceDetailScreen resourceId="res-1" part="correction" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-correction-locked"),
      ).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("resources-detail-editor-correction"),
    ).toBeNull();
  });

  it("un enseignant peut enregistrer un brouillon puis le soumettre", async () => {
    mockUseAuthStore.mockReturnValue({ user: TEACHER_USER } as never);
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    mockResourcesApi.listSubmissions.mockResolvedValue([]);
    const draft = makeSubmission({ status: "DRAFT" });
    mockResourcesApi.saveSubmissionDraft.mockResolvedValue(draft);
    mockResourcesApi.submitSubmission.mockResolvedValue({
      ...draft,
      status: "AWAITING",
    });

    render(<ResourceDetailScreen resourceId="res-1" part="correction" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-editor-correction"),
      ).toBeTruthy(),
    );
    fireEvent.press(
      screen.getByTestId("resources-detail-save-draft-correction"),
    );

    await waitFor(() =>
      expect(mockResourcesApi.saveSubmissionDraft).toHaveBeenCalledWith(
        "res-1",
        "correction",
        expect.objectContaining({ content: expect.any(String) }),
      ),
    );

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-submit-correction").props
          .accessibilityState?.disabled,
      ).toBe(false),
    );
    fireEvent.press(screen.getByTestId("resources-detail-submit-correction"));

    await waitFor(() =>
      expect(mockResourcesApi.submitSubmission).toHaveBeenCalledWith(
        "res-1",
        draft.id,
      ),
    );
  });

  it("affiche le statut « en attente » et masque l'éditeur quand la soumission est AWAITING", async () => {
    mockUseAuthStore.mockReturnValue({ user: TEACHER_USER } as never);
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    mockResourcesApi.listSubmissions.mockResolvedValue([
      makeSubmission({ status: "AWAITING" }),
    ]);

    render(<ResourceDetailScreen resourceId="res-1" part="correction" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-my-status-correction"),
      ).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("resources-detail-editor-correction"),
    ).toBeNull();
  });

  it("affiche le motif de rejet et permet une nouvelle proposition", async () => {
    mockUseAuthStore.mockReturnValue({ user: TEACHER_USER } as never);
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    mockResourcesApi.listSubmissions.mockResolvedValue([
      makeSubmission({ status: "REJECTED", reason: "Contenu incomplet" }),
    ]);

    render(<ResourceDetailScreen resourceId="res-1" part="correction" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-last-resolved-correction"),
      ).toBeTruthy(),
    );
    expect(screen.getByText(/Contenu incomplet/)).toBeTruthy();
    expect(
      screen.getByTestId("resources-detail-editor-correction"),
    ).toBeTruthy();
  });
});
