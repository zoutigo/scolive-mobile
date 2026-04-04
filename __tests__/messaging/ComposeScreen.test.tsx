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
import ComposeScreen, {
  fileIcon,
  fileIconColor,
  formatFileSize,
} from "../../app/(home)/messages/compose";
import { messagingApi } from "../../src/api/messaging.api";
import { useMessagingStore } from "../../src/store/messaging.store";
import { useAuthStore } from "../../src/store/auth.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");
jest.mock("../../src/api/messaging.api");
jest.mock("../../src/store/messaging.store");
jest.mock("../../src/store/auth.store");

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockRouter = { back: mockBack, push: mockPush };
let mockRouteParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockRouteParams,
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
  MediaTypeOptions: { Images: "Images" },
}));

const mockGetDocument = jest
  .fn()
  .mockResolvedValue({ canceled: true, assets: [] });
jest.mock("expo-document-picker", () => ({
  getDocumentAsync: () => mockGetDocument(),
}));

const api = messagingApi as jest.Mocked<typeof messagingApi>;

const storeState = {
  folder: "inbox" as const,
  loadMessages: jest.fn().mockResolvedValue(undefined),
};

function renderCompose(routeParams: Record<string, string> = {}) {
  mockRouteParams = routeParams;
  return render(<ComposeScreen />);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRouteParams = {};
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    schoolSlug: "college-vogt",
  });
  (useMessagingStore as unknown as jest.Mock).mockReturnValue(storeState);
  api.getRecipients.mockImplementation(() => new Promise(() => {}));
  api.send.mockResolvedValue(undefined);
  api.uploadInlineImage.mockResolvedValue("http://10.0.2.2:9000/img.jpg");
});

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

  it("affiche le bouton Galerie", () => {
    renderCompose();
    expect(screen.getByTestId("pick-image-btn")).toBeTruthy();
  });

  it("affiche le bouton Joindre un fichier", () => {
    renderCompose();
    expect(screen.getByTestId("pick-document-btn")).toBeTruthy();
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

describe("Sélection de pièces jointes", () => {
  it("appelle DocumentPicker quand on presse 'Joindre un fichier'", async () => {
    renderCompose();
    await act(async () => {
      fireEvent.press(screen.getByTestId("pick-document-btn"));
    });
    expect(mockGetDocument).toHaveBeenCalled();
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
      fireEvent.press(screen.getByTestId("pick-document-btn"));
    });
    await waitFor(() => {
      expect(screen.getByTestId("attachments-section")).toBeTruthy();
    });
    expect(screen.getByText("bulletin-scolaire.pdf")).toBeTruthy();
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
      fireEvent.press(screen.getByTestId("pick-document-btn"));
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
      fireEvent.press(screen.getByTestId("pick-document-btn"));
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
      fireEvent.press(screen.getByTestId("pick-document-btn"));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("pick-document-btn"));
    });
    await waitFor(() => {
      expect(screen.getAllByText("doc.pdf")).toHaveLength(1);
    });
  });

  it("affiche l'avertissement serveur pour les PJ non-images", async () => {
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
      fireEvent.press(screen.getByTestId("pick-document-btn"));
    });
    await waitFor(() => {
      expect(
        screen.getByText(
          /Les pièces jointes seront disponibles dès la prochaine mise à jour/,
        ),
      ).toBeTruthy();
    });
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
      fireEvent.press(screen.getByTestId("pick-document-btn"));
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
