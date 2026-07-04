import React from "react";
import { Alert } from "react-native";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { FeedComposerCard } from "../../src/components/feed/FeedComposerCard";
import { __setMockEditorContentHtml } from "../../__mocks__/react-native-pell-rich-editor";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");

const mockGetDocument = jest
  .fn()
  .mockResolvedValue({ canceled: true, assets: [] });
const mockRequestGallery = jest.fn().mockResolvedValue({ status: "granted" });
const mockLaunchLibrary = jest
  .fn()
  .mockResolvedValue({ canceled: true, assets: [] });

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: (...args: unknown[]) => mockGetDocument(...args),
}));

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: () => mockRequestGallery(),
  launchImageLibraryAsync: () => mockLaunchLibrary(),
}));

describe("FeedComposerCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    __setMockEditorContentHtml("");
  });

  it("publie une actualité simple", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={onSubmit}
        onUploadInlineImage={jest.fn()}
      />,
    );

    fireEvent.changeText(
      screen.getByTestId("feed-composer-title"),
      "Réunion des parents",
    );
    fireEvent.press(screen.getByTestId("rich-editor-set-content"));
    fireEvent.press(screen.getByTestId("feed-composer-submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "POST",
          title: "Réunion des parents",
          audienceScope: "PARENTS_ONLY",
        }),
      );
    });
  });

  it("publie en utilisant le HTML réel de l'éditeur si onChange est en retard", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    __setMockEditorContentHtml("<p>Contenu récupéré au submit</p>");

    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={onSubmit}
        onUploadInlineImage={jest.fn()}
      />,
    );

    fireEvent.changeText(
      screen.getByTestId("feed-composer-title"),
      "Annonce importante",
    );
    fireEvent.press(screen.getByTestId("feed-composer-submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          bodyHtml: "<p>Contenu récupéré au submit</p>",
          title: "Annonce importante",
        }),
      );
    });
  });

  it("affiche une erreur inline si le titre est vide au submit", async () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("feed-composer-submit"));
    });

    await waitFor(() => {
      expect(screen.getByText("Le titre est obligatoire.")).toBeTruthy();
    });
  });

  it("affiche l'erreur de titre en temps réel si la valeur ne contient que des espaces", async () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );

    // " " differs from the default "" → isDirty=true; trim() → "" → invalid
    fireEvent.changeText(screen.getByTestId("feed-composer-title"), " ");

    await waitFor(() => {
      expect(screen.getByText("Le titre est obligatoire.")).toBeTruthy();
    });
  });

  it("affiche une erreur inline si le contenu est vide (pas d'Alert)", async () => {
    const onSubmit = jest.fn();

    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={onSubmit}
        onUploadInlineImage={jest.fn()}
      />,
    );

    fireEvent.changeText(
      screen.getByTestId("feed-composer-title"),
      "Annonce importante",
    );
    fireEvent.press(screen.getByTestId("feed-composer-submit"));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Ajoutez du contenu avant de publier cette actualité.",
        ),
      ).toBeTruthy();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalledWith(
      "Contenu manquant",
      expect.any(String),
    );
  });

  it("le bouton Publier est actif sans saisie (pas de blocage canSubmit)", () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );

    const submitBtn = screen.getByTestId("feed-composer-submit");
    expect(submitBtn.props.accessibilityState?.disabled).toBeFalsy();
  });

  it("construit un sondage valide", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <FeedComposerCard
        viewerRole="TEACHER"
        onSubmit={onSubmit}
        onUploadInlineImage={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId("feed-composer-type-poll"));
    fireEvent.changeText(
      screen.getByTestId("feed-composer-title"),
      "Transport",
    );
    fireEvent.press(screen.getByTestId("rich-editor-set-content"));
    fireEvent.changeText(
      screen.getByTestId("feed-composer-poll-question"),
      "Quel horaire préférez-vous ?",
    );
    fireEvent.changeText(
      screen.getByTestId("feed-composer-poll-option-1"),
      "07:30",
    );
    fireEvent.changeText(
      screen.getByTestId("feed-composer-poll-option-2"),
      "08:00",
    );
    fireEvent.press(screen.getByTestId("feed-composer-submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "POLL",
          pollQuestion: "Quel horaire préférez-vous ?",
          pollOptions: ["07:30", "08:00"],
        }),
      );
    });
  });

  it("affiche une erreur si la question de sondage est vide au submit", async () => {
    render(
      <FeedComposerCard
        viewerRole="TEACHER"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId("feed-composer-type-poll"));
    fireEvent.changeText(
      screen.getByTestId("feed-composer-title"),
      "Transport",
    );
    fireEvent.press(screen.getByTestId("rich-editor-set-content"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("feed-composer-submit"));
    });

    await waitFor(() => {
      expect(screen.getByText("La question est obligatoire.")).toBeTruthy();
    });
  });

  it("uploade et liste une pièce jointe sélectionnée", async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: "reglement.pdf",
          size: 4096,
          uri: "file:///tmp/reglement.pdf",
          mimeType: "application/pdf",
        },
      ],
    });
    const onUploadAttachment = jest.fn().mockResolvedValue({
      fileName: "reglement.pdf",
      fileUrl: "https://cdn.example.com/feed/reglement.pdf",
      sizeLabel: "4 Ko",
    });

    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn().mockResolvedValue(undefined)}
        onUploadInlineImage={jest.fn()}
        onUploadAttachment={onUploadAttachment}
      />,
    );

    fireEvent.press(screen.getByTestId("feed-add-attachment"));

    await waitFor(() => {
      expect(onUploadAttachment).toHaveBeenCalledWith({
        uri: "file:///tmp/reglement.pdf",
        mimeType: "application/pdf",
        fileName: "reglement.pdf",
      });
      expect(screen.getByText("reglement.pdf")).toBeTruthy();
    });
  });

  it("envoie l'attachment uploadé (avec fileUrl) au submit", async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: "reglement.pdf",
          size: 4096,
          uri: "file:///tmp/reglement.pdf",
          mimeType: "application/pdf",
        },
      ],
    });
    const onUploadAttachment = jest.fn().mockResolvedValue({
      fileName: "reglement.pdf",
      fileUrl: "https://cdn.example.com/feed/reglement.pdf",
      sizeLabel: "4 Ko",
    });
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={onSubmit}
        onUploadInlineImage={jest.fn()}
        onUploadAttachment={onUploadAttachment}
      />,
    );

    fireEvent.press(screen.getByTestId("feed-add-attachment"));
    await waitFor(() => screen.getByText("reglement.pdf"));

    fireEvent.changeText(screen.getByTestId("feed-composer-title"), "Réunion");
    fireEvent.press(screen.getByTestId("rich-editor-set-content"));
    fireEvent.press(screen.getByTestId("feed-composer-submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          attachments: [
            {
              fileName: "reglement.pdf",
              sizeLabel: "4 Ko",
              fileUrl: "https://cdn.example.com/feed/reglement.pdf",
            },
          ],
        }),
      );
    });
  });

  it("affiche une erreur si l'upload de la pièce jointe échoue", async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          name: "reglement.pdf",
          size: 4096,
          uri: "file:///tmp/reglement.pdf",
          mimeType: "application/pdf",
        },
      ],
    });
    const onUploadAttachment = jest
      .fn()
      .mockRejectedValue(new Error("Échec de l'envoi de la pièce jointe."));

    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn().mockResolvedValue(undefined)}
        onUploadInlineImage={jest.fn()}
        onUploadAttachment={onUploadAttachment}
      />,
    );

    fireEvent.press(screen.getByTestId("feed-add-attachment"));

    await waitFor(() => {
      expect(screen.getByTestId("feed-composer-attachment-error")).toBeTruthy();
    });
    expect(screen.queryByText("reglement.pdf")).toBeNull();
  });

  it("upload une image inline depuis la galerie", async () => {
    const onUploadInlineImage = jest
      .fn()
      .mockResolvedValue({ url: "http://10.0.2.2:3001/mock/media/feed.png" });
    mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file:///tmp/feed.png",
          fileName: "feed.png",
          mimeType: "image/png",
        },
      ],
    });

    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn().mockResolvedValue(undefined)}
        onUploadInlineImage={onUploadInlineImage}
      />,
    );

    fireEvent.press(screen.getByTestId("toolbar-insert-image"));

    await waitFor(() => {
      expect(onUploadInlineImage).toHaveBeenCalledWith(
        expect.objectContaining({ name: "feed.png" }),
      );
    });
  });
});

describe("FeedComposerCard — image inline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    __setMockEditorContentHtml("");
  });

  it("insère une image avec width:100%, max-width:100%, height:auto et display:block", async () => {
    const { __mockEditorMethods: mockEditorMethods } = jest.requireMock(
      "react-native-pell-rich-editor",
    );
    const onUploadInlineImage = jest
      .fn()
      .mockResolvedValue({ url: "http://10.0.2.2:3001/mock/media/feed.png" });
    mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file:///tmp/feed.png",
          fileName: "feed.png",
          mimeType: "image/png",
        },
      ],
    });

    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn().mockResolvedValue(undefined)}
        onUploadInlineImage={onUploadInlineImage}
      />,
    );

    fireEvent.press(screen.getByTestId("toolbar-insert-image"));

    await waitFor(() => {
      expect(mockEditorMethods.insertImage).toHaveBeenCalledWith(
        "http://10.0.2.2:3001/mock/media/feed.png",
        expect.stringContaining("height:auto"),
      );
    });

    const style = mockEditorMethods.insertImage.mock.calls[0]?.[1] as string;
    expect(style).toContain("width:100%");
    expect(style).toContain("max-width:100%");
    expect(style).toContain("display:block");
  });

  it("ne plante pas quand onHeightChange est déclenché depuis la WebView", async () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("rich-editor-simulate-height-change"));
    });
    expect(screen.getByTestId("feed-rich-editor")).toBeTruthy();
  });

  it("ne plante pas quand du contenu est ajouté et que la hauteur grandit", async () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId("rich-editor-set-content"));
    });
    expect(screen.getByTestId("feed-rich-editor")).toBeTruthy();
  });

  it("affiche une erreur si l'upload d'image inline échoue", async () => {
    const onUploadInlineImage = jest
      .fn()
      .mockRejectedValue(new Error("UPLOAD_FAILED"));
    mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file:///tmp/feed-err.png",
          fileName: "feed-err.png",
          mimeType: "image/png",
        },
      ],
    });

    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={onUploadInlineImage}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("toolbar-insert-image"));
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.any(String),
        "UPLOAD_FAILED",
      );
    });
  });
});

describe("FeedComposerCard — design header-band et footer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    __setMockEditorContentHtml("");
  });

  it("affiche le heading dans le header band", () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );
    expect(screen.getByText("Partager une actualité")).toBeTruthy();
  });

  it("l'eyebrow affiche 'Post' par défaut (type POST)", () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );
    expect(screen.getByTestId("feed-composer-eyebrow")).toHaveTextContent(
      "Post",
    );
  });

  it("l'eyebrow passe à 'Sondage' quand on sélectionne POLL", () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByTestId("feed-composer-type-poll"));
    expect(screen.getByTestId("feed-composer-eyebrow")).toHaveTextContent(
      "Sondage",
    );
  });

  it("le header contient le bouton fermer quand onCancel est fourni", () => {
    const onCancel = jest.fn();
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByTestId("feed-composer-close")).toBeTruthy();
    fireEvent.press(screen.getByTestId("feed-composer-close"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("n'affiche pas le bouton fermer quand onCancel est absent", () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );
    expect(screen.queryByTestId("feed-composer-close")).toBeNull();
  });

  it("le footer affiche le bouton Annuler quand onCancel est fourni", () => {
    const onCancel = jest.fn();
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByTestId("feed-composer-cancel")).toBeTruthy();
    fireEvent.press(screen.getByTestId("feed-composer-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("le footer n'affiche pas Annuler si onCancel est absent", () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );
    expect(screen.queryByTestId("feed-composer-cancel")).toBeNull();
  });

  it("le bouton Publier du footer a le style primaire", () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );
    expect(screen.getByTestId("feed-composer-submit")).toHaveStyle({
      backgroundColor: "#08467D",
    });
  });

  it("le bouton Annuler du footer a le style neutre (fond blanc)", () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
        onCancel={jest.fn()}
      />,
    );
    expect(screen.getByTestId("feed-composer-cancel")).toHaveStyle({
      backgroundColor: "#FFFFFF",
    });
  });

  it("la card a le fond crème du nouveau design", () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );
    expect(screen.getByTestId("feed-composer-card")).toHaveStyle({
      backgroundColor: "#FFF8EE",
    });
  });

  it("le chip POLL actif a le fond primaire", () => {
    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn()}
        onUploadInlineImage={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByTestId("feed-composer-type-poll"));
    expect(screen.getByTestId("feed-composer-type-poll")).toHaveStyle({
      backgroundColor: "#08467D",
    });
    expect(screen.getByTestId("feed-composer-type-post")).toHaveStyle({
      backgroundColor: "#FFFFFF",
    });
  });
});
