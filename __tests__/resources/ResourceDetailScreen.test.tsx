import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import { ResourceDetailScreen } from "../../src/components/resources/ResourceDetailScreen";
import { resourcesApi } from "../../src/api/resources.api";
import { downloadAndOpenAttachment } from "../../src/utils/attachment-download";

jest.mock("../../src/utils/attachment-download");
const mockDownloadAndOpenAttachment =
  downloadAndOpenAttachment as jest.MockedFunction<
    typeof downloadAndOpenAttachment
  >;
import { useAuthStore } from "../../src/store/auth.store";
import type {
  ResourceDetail,
  ResourceSubmission,
} from "../../src/types/resources.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/resources.api");
jest.mock("../../src/store/auth.store");
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
jest.mock("../../src/components/editor/RichEditorField", () => {
  const {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
  } = require("react");
  const { TextInput } = require("react-native");
  const RichEditorField = forwardRef((props: any, ref: any) => {
    const [value, setValue] = useState(props.initialHtml ?? "");
    const valueRef = useRef(value);
    valueRef.current = value;
    const focus = jest.fn();
    useImperativeHandle(ref, () => ({
      getContentHtml: async () => valueRef.current,
      focus,
    }));
    return (
      <TextInput
        testID={props.editorTestID}
        value={value}
        onChangeText={setValue}
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
  activeRole: "TEACHER" as const,
};

const READER_USER = {
  id: "student-1",
  memberships: [{ schoolId: "school-1", role: "STUDENT" as const }],
  platformRoles: [] as never[],
  activeRole: "STUDENT" as const,
};

const SUPPORT_USER = {
  id: "support-1",
  memberships: [] as never[],
  platformRoles: ["SUPPORT"] as never[],
  activeRole: "SUPPORT" as const,
};

const BASE_DETAIL: ResourceDetail = {
  id: "res-1",
  kind: "ASSESSMENT",
  schoolId: "school-1",
  academicLevelId: "level-1",
  trackId: null,
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
  track: null,
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
    mockCanGoBack.mockReturnValue(false);
    mockUseAuthStore.mockReturnValue({ user: READER_USER } as never);
    mockResourcesApi.listSubmissions.mockResolvedValue([]);
    mockDownloadAndOpenAttachment.mockResolvedValue(undefined);
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
    expect(
      within(
        screen.getByTestId("resources-detail-content-statement"),
      ).getByTestId("rich-editor-initial-content").props.children,
    ).toBe("<p>Voici l'<i>énoncé</i> complet</p>");
    expect(
      screen.getByTestId("resources-detail-attachment-statement-0"),
    ).toBeTruthy();
    expect(
      screen.queryByTestId("resources-detail-attachment-statement-1"),
    ).toBeNull();
  });

  it("RÉGRESSION : n'affiche jamais le formulaire de contribution sur un contenu déjà approuvé, même pour un contributeur (canContribute=true)", async () => {
    mockUseAuthStore.mockReturnValue({ user: TEACHER_USER } as never);
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    render(<ResourceDetailScreen resourceId="res-1" part="statement" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-content-statement"),
      ).toBeTruthy(),
    );
    expect(
      screen.queryByTestId("resources-detail-editor-statement"),
    ).toBeNull();
    expect(screen.queryByText("Ma contribution")).toBeNull();
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
      expect(mockDownloadAndOpenAttachment).toHaveBeenCalledWith(
        expect.objectContaining({
          fileUrl: "https://files.example.com/sujet.pdf",
        }),
      ),
    );
  });

  it("un rôle purement plateforme (support) ne voit pas la zone de contribution", async () => {
    mockUseAuthStore.mockReturnValue({ user: SUPPORT_USER } as never);
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

  it("un élève (rôle actif STUDENT) a accès à la contribution : le module ressources est national, aucun rôle scolaire n'est privilégié", async () => {
    mockUseAuthStore.mockReturnValue({ user: READER_USER } as never);
    mockResourcesApi.getResource.mockResolvedValue({
      ...BASE_DETAIL,
      statementStatus: "PENDING",
      statementContent: null,
    });
    render(<ResourceDetailScreen resourceId="res-1" part="statement" />);

    await waitFor(() =>
      expect(mockResourcesApi.listSubmissions).toHaveBeenCalledWith(
        "res-1",
        "statement",
      ),
    );
    expect(
      screen.getByTestId("resources-detail-editor-statement"),
    ).toBeTruthy();
  });

  it("un membership TEACHER sur une autre école ne donne pas accès à la contribution quand le rôle actif est un rôle plateforme sans rattachement pédagogique", async () => {
    mockUseAuthStore.mockReturnValue({
      user: {
        ...TEACHER_USER,
        activeRole: "SUPPORT" as const,
      },
    } as never);
    mockResourcesApi.getResource.mockResolvedValue({
      ...BASE_DETAIL,
      statementStatus: "PENDING",
      statementContent: null,
    });
    render(<ResourceDetailScreen resourceId="res-1" part="statement" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-no-approved-statement"),
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

  it("RÉGRESSION : n'affiche jamais le formulaire de contribution sur un corrigé déjà approuvé, même pour un contributeur (canContribute=true)", async () => {
    mockUseAuthStore.mockReturnValue({ user: TEACHER_USER } as never);
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
      screen.queryByTestId("resources-detail-editor-correction"),
    ).toBeNull();
    expect(screen.queryByText("Ma contribution")).toBeNull();
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
    fireEvent.changeText(
      screen.getByTestId("resources-detail-editor-correction"),
      "<p>Contenu du brouillon</p>",
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

    fireEvent.press(screen.getByTestId("resources-detail-submit-correction"));

    await waitFor(() =>
      expect(mockResourcesApi.submitSubmission).toHaveBeenCalledWith(
        "res-1",
        draft.id,
      ),
    );
  });

  it("RÉGRESSION : le bouton Soumettre reste actif sans brouillon préalable et soumet directement un contenu valide", async () => {
    mockUseAuthStore.mockReturnValue({ user: TEACHER_USER } as never);
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    mockResourcesApi.listSubmissions.mockResolvedValue([]);
    const created = makeSubmission({
      status: "DRAFT",
      content: "<p>Contenu</p>",
    });
    mockResourcesApi.saveSubmissionDraft.mockResolvedValue(created);
    mockResourcesApi.submitSubmission.mockResolvedValue({
      ...created,
      status: "AWAITING",
    });

    render(<ResourceDetailScreen resourceId="res-1" part="correction" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-editor-correction"),
      ).toBeTruthy(),
    );

    // Aucun brouillon n'a été enregistré au préalable : le bouton doit
    // rester actif dès le chargement (jamais bloqué par l'absence de
    // submission active), conformément au standard formulaires.
    expect(
      screen.getByTestId("resources-detail-submit-correction").props
        .accessibilityState?.disabled,
    ).toBe(false);

    fireEvent.changeText(
      screen.getByTestId("resources-detail-editor-correction"),
      "<p>Contenu saisi directement</p>",
    );
    fireEvent.press(screen.getByTestId("resources-detail-submit-correction"));

    await waitFor(() =>
      expect(mockResourcesApi.saveSubmissionDraft).toHaveBeenCalledWith(
        "res-1",
        "correction",
        expect.objectContaining({ content: expect.any(String) }),
      ),
    );
    await waitFor(() =>
      expect(mockResourcesApi.submitSubmission).toHaveBeenCalledWith(
        "res-1",
        created.id,
      ),
    );
  });

  it("affiche une erreur sous l'éditeur et bloque l'appel API si le contenu est vide à la soumission", async () => {
    mockUseAuthStore.mockReturnValue({ user: TEACHER_USER } as never);
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    mockResourcesApi.listSubmissions.mockResolvedValue([]);

    render(<ResourceDetailScreen resourceId="res-1" part="correction" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-editor-correction"),
      ).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("resources-detail-submit-correction"));

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-content-error-correction"),
      ).toBeTruthy(),
    );
    expect(mockResourcesApi.saveSubmissionDraft).not.toHaveBeenCalled();
    expect(mockResourcesApi.submitSubmission).not.toHaveBeenCalled();
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

  it("le bouton Annuler revient à l'écran précédent sans appel API", async () => {
    mockUseAuthStore.mockReturnValue({ user: TEACHER_USER } as never);
    mockCanGoBack.mockReturnValue(true);
    mockResourcesApi.getResource.mockResolvedValue(BASE_DETAIL);
    mockResourcesApi.listSubmissions.mockResolvedValue([]);

    render(<ResourceDetailScreen resourceId="res-1" part="correction" />);

    await waitFor(() =>
      expect(
        screen.getByTestId("resources-detail-editor-correction"),
      ).toBeTruthy(),
    );
    fireEvent.press(screen.getByTestId("resources-detail-cancel-correction"));

    expect(mockRouterBack).toHaveBeenCalled();
    expect(mockResourcesApi.saveSubmissionDraft).not.toHaveBeenCalled();
    expect(mockResourcesApi.submitSubmission).not.toHaveBeenCalled();
  });
});
