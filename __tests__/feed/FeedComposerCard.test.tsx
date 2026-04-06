import React from "react";
import { Alert } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { FeedComposerCard } from "../../src/components/feed/FeedComposerCard";
import { __setMockEditorContentHtml } from "../../__mocks__/react-native-pell-rich-editor";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");

const mockGetDocument = jest.fn().mockResolvedValue({ canceled: true, assets: [] });
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

  it("bloque la publication si le contenu est vide", async () => {
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
      "Annonce importante",
    );
    fireEvent.press(screen.getByTestId("feed-composer-submit"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Contenu manquant",
        "Ajoutez du contenu avant de publier cette actualité.",
      );
    });
    expect(onSubmit).not.toHaveBeenCalled();
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
    fireEvent.changeText(screen.getByTestId("feed-composer-title"), "Transport");
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

  it("liste une pièce jointe sélectionnée", async () => {
    mockGetDocument.mockResolvedValueOnce({
      canceled: false,
      assets: [{ name: "reglement.pdf", size: 4096 }],
    });

    render(
      <FeedComposerCard
        viewerRole="PARENT"
        onSubmit={jest.fn().mockResolvedValue(undefined)}
        onUploadInlineImage={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByTestId("feed-add-attachment"));

    await waitFor(() => {
      expect(screen.getByText("reglement.pdf")).toBeTruthy();
    });
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
