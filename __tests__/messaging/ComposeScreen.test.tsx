/**
 * Tests fonctionnels & intégration — écran de composition (messages/compose.tsx)
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "react-native";
import ComposeScreen, {
  buildFormatBlockCommand,
  fileIcon,
  fileIconColor,
  formatFileSize,
  resolveAttachmentMimeType,
  TEXT_COLOR_PRESETS,
} from "../../app/(home)/messages/compose";
import { messagingApi } from "../../src/api/messaging.api";
import { useMessagingStore } from "../../src/store/messaging.store";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");
jest.mock("../../src/api/messaging.api");
jest.mock("../../src/store/messaging.store");
jest.mock("../../src/store/auth.store");

const { __mockEditorMethods: mockEditorMethods } = jest.requireMock(
  "react-native-pell-rich-editor",
);

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockRouter = { back: mockBack, push: mockPush };
let mockRouteParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockRouteParams,
  usePathname: () => "/(home)/messages/compose",
}));

jest.mock("../../src/components/messaging/RecipientPickerModal", () => ({
  RecipientPickerModal: (props: {
    visible: boolean;
    onConfirm: (recipients: Array<{ value: string; label: string }>) => void;
  }) => {
    const React = require("react");
    const { Text, TouchableOpacity } = require("react-native");
    const { visible, onConfirm } = props;
    if (!visible) return null;
    return React.createElement(
      TouchableOpacity,
      {
        testID: "recipient-modal-confirm",
        onPress: () => onConfirm([{ value: "t1", label: "Alice Martin" }]),
      },
      React.createElement(Text, null, "Confirmer destinataire"),
    );
  },
}));

const mockRequestGallery = jest.fn().mockResolvedValue({ status: "granted" });
const mockRequestCamera = jest.fn().mockResolvedValue({ status: "granted" });
const mockLaunchLibrary = jest
  .fn()
  .mockResolvedValue({ canceled: true, assets: [] });
const mockLaunchCamera = jest
  .fn()
  .mockResolvedValue({ canceled: true, assets: [] });
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: () => mockRequestGallery(),
  requestCameraPermissionsAsync: () => mockRequestCamera(),
  launchImageLibraryAsync: () => mockLaunchLibrary(),
  launchCameraAsync: () => mockLaunchCamera(),
}));

const mockGetDocument = jest
  .fn()
  .mockResolvedValue({ canceled: true, assets: [] });
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: (...args: unknown[]) => mockGetDocument(...args),
}));

const api = messagingApi as jest.Mocked<typeof messagingApi>;
const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
const consoleErrorSpy = jest
  .spyOn(console, "error")
  .mockImplementation(jest.fn());

const storeState = {
  folder: "inbox" as const,
  loadMessages: jest.fn().mockResolvedValue(undefined),
};
const showFeedbackToast = jest.fn();

function renderCompose(routeParams: Record<string, string> = {}) {
  mockRouteParams = routeParams;
  return render(<ComposeScreen />);
}

beforeEach(() => {
  jest.clearAllMocks();
  consoleErrorSpy.mockClear();
  mockEditorMethods.insertImage.mockClear();
  mockEditorMethods.setForeColor.mockClear();
  mockEditorMethods.command.mockClear();
  mockRouteParams = {};
  useSuccessToastStore.setState({ show: showFeedbackToast });
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    schoolSlug: "college-vogt",
  });
  (useMessagingStore as unknown as jest.Mock).mockReturnValue(storeState);
  api.getRecipients.mockImplementation(() => new Promise(() => {}));
  api.send.mockResolvedValue(undefined);
  api.uploadInlineImage.mockResolvedValue("http://10.0.2.2:9000/img.jpg");
});

function pressAlertAction(label: string) {
  const actions = alertSpy.mock.calls.at(-1)?.[2] as
    | Array<{ text?: string; onPress?: () => void }>
    | undefined;
  const action = actions?.find((entry) => entry.text === label);
  action?.onPress?.();
}

async function fillSendableForm() {
  fireEvent.press(screen.getByTestId("recipients-field"));
  fireEvent.press(screen.getByTestId("recipient-modal-confirm"));
  fireEvent.changeText(screen.getByTestId("subject-input"), "Objet test");
  fireEvent.press(screen.getByTestId("rich-editor-set-content"));
  await waitFor(() => {
    expect(
      screen.getByTestId("send-btn").props.accessibilityState?.disabled ??
        screen.getByTestId("send-btn").props.disabled,
    ).toBe(false);
  });
}

describe("Rendu du formulaire", () => {
  it("affiche le titre 'Nouveau message'", () => {
    renderCompose();
    expect(screen.getByText("Nouveau message")).toBeTruthy();
    expect(screen.getByTestId("compose-menu-btn")).toBeTruthy();
  });

  it("affiche le champ Objet", () => {
    renderCompose();
    expect(screen.getByTestId("subject-input")).toBeTruthy();
  });

  it("affiche le champ destinataires", () => {
    renderCompose();
    expect(screen.getByTestId("recipients-field")).toBeTruthy();
  });

  it("affiche l'éditeur rich text", () => {
    renderCompose();
    expect(screen.getByTestId("rich-editor")).toBeTruthy();
  });

  it("affiche la toolbar de formatage", () => {
    renderCompose();
    expect(screen.getByTestId("rich-toolbar")).toBeTruthy();
  });

  it("affiche un bouton unique pour joindre un contenu", () => {
    renderCompose();
    expect(screen.getByTestId("compose-action-bar")).toBeTruthy();
    expect(screen.getByTestId("compose-action-bar")).toHaveStyle({
      flexDirection: "row",
    });
    expect(screen.getByTestId("attachment-actions-btn")).toBeTruthy();
  });

  it("affiche un bouton pour enregistrer en brouillon", () => {
    renderCompose();
    expect(screen.getByTestId("save-draft-btn")).toBeTruthy();
  });

  it("affiche les outils rapides de l'éditeur", () => {
    renderCompose();
    expect(screen.getByTestId("editor-quick-tools")).toBeTruthy();
    expect(screen.getByTestId("editor-color-btn")).toBeTruthy();
    expect(screen.getByTestId("editor-heading-btn")).toBeTruthy();
    expect(screen.getByTestId("editor-quote-btn")).toBeTruthy();
    expect(screen.queryByText("Couleur")).toBeNull();
    expect(screen.queryByText("Titre")).toBeNull();
    expect(screen.queryByText("Citation")).toBeNull();
  });
});

describe("Bouton Envoyer", () => {
  it("est désactivé par défaut (formulaire vide)", () => {
    renderCompose();
    const btn = screen.getByTestId("send-btn");
    expect(
      btn.props.accessibilityState?.disabled ?? btn.props.disabled,
    ).toBeTruthy();
  });

  it("s'active quand le formulaire est complet", async () => {
    renderCompose();
    await fillSendableForm();
    const btn = screen.getByTestId("send-btn");
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(
      false,
    );
  });
});

describe("Outils de l'éditeur", () => {
  it("ouvre le menu de couleur du texte", () => {
    renderCompose();

    fireEvent.press(screen.getByTestId("editor-color-btn"));

    expect(alertSpy).toHaveBeenCalledWith(
      "Couleur du texte",
      "Choisissez une couleur",
      expect.any(Array),
    );
  });

  it("applique une couleur au texte", () => {
    renderCompose();

    fireEvent.press(screen.getByTestId("editor-color-btn"));
    pressAlertAction("Bleu profond");

    expect(mockEditorMethods.setForeColor).toHaveBeenCalledWith(
      TEXT_COLOR_PRESETS[0].value,
    );
  });

  it("applique le format titre", () => {
    renderCompose();

    fireEvent.press(screen.getByTestId("editor-heading-btn"));

    expect(mockEditorMethods.command).toHaveBeenCalledWith(
      buildFormatBlockCommand("h2"),
    );
  });

  it("applique le format citation", () => {
    renderCompose();

    fireEvent.press(screen.getByTestId("editor-quote-btn"));

    expect(mockEditorMethods.command).toHaveBeenCalledWith(
      buildFormatBlockCommand("blockquote"),
    );
  });
});

describe("Enregistrement en brouillon", () => {
  it("reste désactivé tant qu'aucun contenu n'est saisi", () => {
    renderCompose();
    const btn = screen.getByTestId("save-draft-btn");
    expect(
      btn.props.accessibilityState?.disabled ?? btn.props.disabled,
    ).toBeTruthy();
  });

  it("s'active dès qu'un sujet est saisi", () => {
    renderCompose();
    fireEvent.changeText(screen.getByTestId("subject-input"), "Réunion");
    const btn = screen.getByTestId("save-draft-btn");
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBe(
      false,
    );
  });

  it("enregistre le brouillon avec isDraft=true", async () => {
    renderCompose();
    fireEvent.changeText(screen.getByTestId("subject-input"), "Suivi parent");

    await act(async () => {
      fireEvent.press(screen.getByTestId("save-draft-btn"));
    });

    expect(api.send).toHaveBeenCalledWith(
      "college-vogt",
      expect.objectContaining({
        subject: "Suivi parent",
        isDraft: true,
      }),
    );
    expect(showFeedbackToast).toHaveBeenCalledWith({
      variant: "success",
      title: "Brouillon enregistré",
      message: "Votre brouillon a bien été sauvegardé.",
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it("utilise des valeurs de secours si le corps est vide", async () => {
    renderCompose();
    fireEvent.press(screen.getByTestId("recipients-field"));
    fireEvent.press(screen.getByTestId("recipient-modal-confirm"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("save-draft-btn"));
    });

    expect(api.send).toHaveBeenCalledWith(
      "college-vogt",
      expect.objectContaining({
        subject: "Brouillon sans objet",
        body: "<p>&nbsp;</p>",
        recipientUserIds: ["t1"],
        isDraft: true,
      }),
    );
  });
});

describe("Sélection de pièces jointes", () => {
  it("ouvre le menu de jointure quand on presse 'Joindre'", async () => {
    renderCompose();
    fireEvent.press(screen.getByTestId("attachment-actions-btn"));
    expect(alertSpy).toHaveBeenCalledWith(
      "Joindre un fichier",
      "Choisissez le type de contenu",
      expect.any(Array),
    );
  });

  it("appelle DocumentPicker après choix 'Insérer un fichier'", async () => {
    renderCompose();
    fireEvent.press(screen.getByTestId("attachment-actions-btn"));

    await act(async () => {
      pressAlertAction("Insérer un fichier");
    });

    expect(mockGetDocument).toHaveBeenCalledWith({
      type: "*/*",
      multiple: true,
      copyToCacheDirectory: true,
    });
  });

  it("ouvre la galerie après choix 'Ouvrir la galerie'", async () => {
    renderCompose();
    fireEvent.press(screen.getByTestId("attachment-actions-btn"));

    await act(async () => {
      pressAlertAction("Ouvrir la galerie");
    });

    expect(mockRequestGallery).toHaveBeenCalled();
    expect(mockLaunchLibrary).toHaveBeenCalled();
  });

  it("ajoute une image en pièce jointe depuis 'Joindre > Ouvrir la galerie' sans insertion inline", async () => {
    mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file:///tmp/photo-jointe.jpg",
          mimeType: "image/jpeg",
          fileName: "photo-jointe.jpg",
          fileSize: 4096,
        },
      ],
    });

    renderCompose();
    fireEvent.press(screen.getByTestId("attachment-actions-btn"));

    await act(async () => {
      pressAlertAction("Ouvrir la galerie");
    });

    await waitFor(() => {
      expect(screen.getByText("photo-jointe.jpg")).toBeTruthy();
    });
    expect(api.uploadInlineImage).not.toHaveBeenCalled();
    expect(mockEditorMethods.insertImage).not.toHaveBeenCalled();
  });

  it("ouvre la caméra après choix 'Prendre une photo'", async () => {
    renderCompose();
    fireEvent.press(screen.getByTestId("attachment-actions-btn"));

    await act(async () => {
      pressAlertAction("Prendre une photo");
    });

    expect(mockRequestCamera).toHaveBeenCalled();
    expect(mockLaunchCamera).toHaveBeenCalled();
  });

  it("ajoute une photo en pièce jointe depuis 'Joindre > Prendre une photo' sans insertion inline", async () => {
    mockLaunchCamera.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file:///tmp/photo-camera.jpg",
          mimeType: "image/jpeg",
          fileName: "photo-camera.jpg",
          fileSize: 5120,
        },
      ],
    });

    renderCompose();
    fireEvent.press(screen.getByTestId("attachment-actions-btn"));

    await act(async () => {
      pressAlertAction("Prendre une photo");
    });

    await waitFor(() => {
      expect(screen.getByText("photo-camera.jpg")).toBeTruthy();
    });
    expect(api.uploadInlineImage).not.toHaveBeenCalled();
    expect(mockEditorMethods.insertImage).not.toHaveBeenCalled();
  });

  it("affiche les fichiers attachés après sélection", async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: "bulletin-scolaire.pdf",
          size: 153600,
          mimeType: "application/pdf",
          uri: "file:///tmp/bulletin.pdf",
        },
      ],
    });
    renderCompose();
    await act(async () => {
      fireEvent.press(screen.getByTestId("attachment-actions-btn"));
      pressAlertAction("Insérer un fichier");
    });
    await waitFor(() => {
      expect(screen.getByTestId("attachments-section")).toBeTruthy();
    });
    expect(screen.getByText("bulletin-scolaire.pdf")).toBeTruthy();
  });

  it("déduit un type MIME exploitable à partir de l'extension si Android renvoie application/octet-stream", async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: "bulletin-scolaire.pdf",
          size: 153600,
          mimeType: "application/octet-stream",
          uri: "file:///tmp/bulletin-scolaire.pdf",
        },
      ],
    });

    renderCompose();
    await fillSendableForm();

    await act(async () => {
      fireEvent.press(screen.getByTestId("attachment-actions-btn"));
      pressAlertAction("Insérer un fichier");
    });

    fireEvent.press(screen.getByTestId("send-btn"));

    await waitFor(() => {
      expect(api.send).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          attachments: [
            expect.objectContaining({
              name: "bulletin-scolaire.pdf",
              mimeType: "application/pdf",
            }),
          ],
        }),
      );
    });
    expect(showFeedbackToast).toHaveBeenCalledWith({
      variant: "success",
      title: "Message envoyé",
      message: "Votre message a bien été envoyé.",
    });
  });

  it("affiche la taille du fichier formatée", async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: "cours.docx",
          size: 51200,
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          uri: "file:///tmp/cours.docx",
        },
      ],
    });
    renderCompose();
    await act(async () => {
      fireEvent.press(screen.getByTestId("attachment-actions-btn"));
      pressAlertAction("Insérer un fichier");
    });
    await waitFor(() => {
      expect(screen.getByText("50 Ko")).toBeTruthy();
    });
  });

  it("permet de supprimer une pièce jointe", async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: "doc.pdf",
          size: 1024,
          mimeType: "application/pdf",
          uri: "file:///tmp/doc.pdf",
        },
      ],
    });
    renderCompose();
    await act(async () => {
      fireEvent.press(screen.getByTestId("attachment-actions-btn"));
      pressAlertAction("Insérer un fichier");
    });
    await waitFor(() => {
      expect(screen.getByText("doc.pdf")).toBeTruthy();
    });
    fireEvent.press(screen.getByTestId(/remove-attachment-/));
    await waitFor(() => {
      expect(screen.queryByText("doc.pdf")).toBeNull();
    });
  });

  it("déduplique les fichiers identiques", async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: "doc.pdf",
          size: 1024,
          mimeType: "application/pdf",
          uri: "file:///tmp/doc.pdf",
        },
      ],
    });
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: "doc.pdf",
          size: 1024,
          mimeType: "application/pdf",
          uri: "file:///tmp/doc.pdf",
        },
      ],
    });
    renderCompose();
    await act(async () => {
      fireEvent.press(screen.getByTestId("attachment-actions-btn"));
      pressAlertAction("Insérer un fichier");
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("attachment-actions-btn"));
      pressAlertAction("Insérer un fichier");
    });
    await waitFor(() => {
      expect(screen.getAllByText("doc.pdf")).toHaveLength(1);
    });
  });

  it("n'affiche plus d'avertissement serveur obsolète pour les PJ", async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: "rapport.pdf",
          size: 2048,
          mimeType: "application/pdf",
          uri: "file:///tmp/rapport.pdf",
        },
      ],
    });
    renderCompose();
    await act(async () => {
      fireEvent.press(screen.getByTestId("attachment-actions-btn"));
      pressAlertAction("Insérer un fichier");
    });
    await waitFor(() => {
      expect(screen.getByText("rapport.pdf")).toBeTruthy();
    });
    expect(
      screen.queryByText(
        /Les pièces jointes seront disponibles dès la prochaine mise à jour/,
      ),
    ).toBeNull();
  });
});

describe("Envoi avec pièces jointes", () => {
  it("transmet les pièces jointes à l'API lors de l'envoi", async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: "doc.pdf",
          size: 1024,
          mimeType: "application/pdf",
          uri: "file:///tmp/doc.pdf",
        },
      ],
    });

    renderCompose();
    await fillSendableForm();
    await act(async () => {
      fireEvent.press(screen.getByTestId("attachment-actions-btn"));
      pressAlertAction("Insérer un fichier");
    });
    await waitFor(() => {
      expect(screen.getByText("doc.pdf")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("send-btn"));

    await waitFor(() => {
      expect(api.send).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          attachments: [
            {
              uri: "file:///tmp/doc.pdf",
              name: "doc.pdf",
              mimeType: "application/pdf",
              size: 1024,
            },
          ],
        }),
      );
    });
  });

  it("affiche une erreur si l'envoi échoue", async () => {
    api.send.mockRejectedValueOnce(new Error("SEND_MESSAGE_FAILED"));

    renderCompose();
    await fillSendableForm();

    await act(async () => {
      fireEvent.press(screen.getByTestId("send-btn"));
    });

    await waitFor(() => {
      expect(showFeedbackToast).toHaveBeenCalledWith({
        variant: "error",
        title: "Envoi impossible",
        message: "Impossible d'envoyer le message. Réessayez.",
      });
    });
  });

  it("affiche le vrai message backend même si l'erreur remonte en 502", async () => {
    api.send.mockRejectedValueOnce({
      name: "MessagingMultipartError",
      message: "Type upload non supporte",
      statusCode: 502,
      responseBody:
        '{"message":"Type upload non supporte","error":"Bad Gateway","statusCode":502}',
    });

    renderCompose();
    await fillSendableForm();

    await act(async () => {
      fireEvent.press(screen.getByTestId("send-btn"));
    });

    await waitFor(() => {
      expect(showFeedbackToast).toHaveBeenCalledWith({
        variant: "error",
        title: "Envoi impossible",
        message: "Type upload non supporte",
      });
    });
  });
});

describe("Gestion d'erreurs locales", () => {
  it("affiche une erreur si le sélecteur de fichiers échoue", async () => {
    mockGetDocument.mockRejectedValueOnce(new Error("picker failed"));

    renderCompose();

    await act(async () => {
      fireEvent.press(screen.getByTestId("attachment-actions-btn"));
      pressAlertAction("Insérer un fichier");
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Erreur",
        "Impossible d'ouvrir le sélecteur de fichiers.",
      );
    });
  });

  it("affiche une erreur si l'upload d'image inline échoue", async () => {
    mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file:///tmp/photo.jpg",
          mimeType: "image/jpeg",
          fileName: "photo.jpg",
        },
      ],
    });
    api.uploadInlineImage.mockRejectedValueOnce(
      new Error("IMAGE_UPLOAD_FAILED"),
    );

    renderCompose();

    await act(async () => {
      fireEvent.press(screen.getByTestId("toolbar-insert-image"));
      pressAlertAction("Galerie");
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        "Erreur",
        "Impossible d'insérer l'image. Réessayez.",
      );
    });
  });

  it("passe bien par l'upload inline quand l'image est insérée depuis le toolbar", async () => {
    mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file:///tmp/photo-inline.jpg",
          mimeType: "image/jpeg",
          fileName: "photo-inline.jpg",
        },
      ],
    });

    renderCompose();

    await act(async () => {
      fireEvent.press(screen.getByTestId("toolbar-insert-image"));
      pressAlertAction("Galerie");
    });

    await waitFor(() => {
      expect(api.uploadInlineImage).toHaveBeenCalledWith(
        "college-vogt",
        "file:///tmp/photo-inline.jpg",
        "image/jpeg",
        "photo-inline.jpg",
      );
    });
    expect(mockEditorMethods.insertImage).toHaveBeenCalled();
  });
});

describe("Mode réponse", () => {
  it("affiche 'Répondre' dans le titre", () => {
    renderCompose({ replyToSubject: "Convocation" });
    expect(screen.getByText("Répondre")).toBeTruthy();
  });

  it("préremplit le sujet avec 'Re:' si absent", () => {
    renderCompose({ replyToSubject: "Compte rendu" });
    expect(screen.getByDisplayValue("Re: Compte rendu")).toBeTruthy();
  });

  it("ne double pas le préfixe 'Re:'", () => {
    renderCompose({ replyToSubject: "Re: Compte rendu" });
    expect(screen.getByDisplayValue("Re: Compte rendu")).toBeTruthy();
  });
});

describe("fileIcon()", () => {
  it("retourne document-text-outline pour PDF", () => {
    expect(fileIcon("application/pdf")).toBe("document-text-outline");
  });

  it("retourne document-outline pour Word", () => {
    expect(
      fileIcon(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe("document-outline");
  });

  it("retourne grid-outline pour Excel", () => {
    expect(
      fileIcon(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
    ).toBe("grid-outline");
  });

  it("retourne easel-outline pour PowerPoint", () => {
    expect(
      fileIcon(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ),
    ).toBe("easel-outline");
  });

  it("retourne image-outline pour les images", () => {
    expect(fileIcon("image/jpeg")).toBe("image-outline");
  });

  it("retourne attach-outline pour type inconnu", () => {
    expect(fileIcon("application/octet-stream")).toBe("attach-outline");
  });
});

describe("resolveAttachmentMimeType()", () => {
  it("conserve un type MIME précis quand il est déjà fourni", () => {
    expect(
      resolveAttachmentMimeType({
        name: "cours.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  it("normalise les alias courants", () => {
    expect(
      resolveAttachmentMimeType({
        name: "photo.jpg",
        mimeType: "image/jpg",
      }),
    ).toBe("image/jpeg");
  });

  it("déduit le type MIME depuis l'extension si Android renvoie application/octet-stream", () => {
    expect(
      resolveAttachmentMimeType({
        name: "emploi-du-temps.xlsx",
        mimeType: "application/octet-stream",
      }),
    ).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  });

  it("retombe sur application/octet-stream si rien n'est déductible", () => {
    expect(
      resolveAttachmentMimeType({
        name: "document-sans-extension",
        mimeType: undefined,
      }),
    ).toBe("application/octet-stream");
  });
});

describe("buildFormatBlockCommand()", () => {
  it("construit la commande attendue pour un titre", () => {
    expect(buildFormatBlockCommand("h2")).toBe(
      "document.execCommand('formatBlock', false, '<h2>'); true;",
    );
  });

  it("construit la commande attendue pour une citation", () => {
    expect(buildFormatBlockCommand("blockquote")).toBe(
      "document.execCommand('formatBlock', false, '<blockquote>'); true;",
    );
  });
});

describe("fileIconColor()", () => {
  it("retourne rouge pour PDF", () => {
    expect(fileIconColor("application/pdf")).toBe("#DC3545");
  });

  it("retourne bleu Word pour .docx", () => {
    expect(
      fileIconColor(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe("#2B579A");
  });

  it("retourne vert Excel pour .xlsx", () => {
    expect(
      fileIconColor(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ),
    ).toBe("#217346");
  });

  it("retourne orange PowerPoint pour .pptx", () => {
    expect(
      fileIconColor(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ),
    ).toBe("#D24726");
  });
});

describe("formatFileSize()", () => {
  it("affiche en octets si < 1Ko", () => {
    expect(formatFileSize(512)).toBe("512 o");
  });

  it("affiche en Ko si < 1Mo", () => {
    expect(formatFileSize(51200)).toBe("50 Ko");
  });

  it("affiche en Mo si >= 1Mo", () => {
    expect(formatFileSize(2 * 1024 * 1024)).toBe("2.0 Mo");
  });
});
