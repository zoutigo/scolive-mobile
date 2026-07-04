import React from "react";
import { Alert } from "react-native";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { RichEditor } from "react-native-pell-rich-editor";
import {
  RichEditorField,
  type RichEditorFieldRef,
} from "../../src/components/editor/RichEditorField";
import {
  __mockEditorMethods,
  __setMockEditorContentHtml,
} from "../../__mocks__/react-native-pell-rich-editor";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");

const mockRequestGallery = jest.fn().mockResolvedValue({ status: "granted" });
const mockLaunchLibrary = jest.fn().mockResolvedValue({
  canceled: false,
  assets: [
    { uri: "file://photo.jpg", fileName: "photo.jpg", mimeType: "image/jpeg" },
  ],
});

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: () => mockRequestGallery(),
  launchImageLibraryAsync: (...args: unknown[]) => mockLaunchLibrary(...args),
}));

const labels = {
  colorMenuTitle: "Couleur",
  colorMenuMessage: "Choisir une couleur",
  cancel: "Annuler",
  permissionDeniedTitle: "Permission refusée",
  permissionDeniedMessage: "Autorisez l'accès à la galerie.",
  imageErrorTitle: "Image non ajoutée",
  imageErrorFallbackMessage: "Impossible d'ajouter l'image.",
  videoErrorTitle: "Vidéo non ajoutée",
  videoErrorFallbackMessage: "Impossible d'ajouter la vidéo.",
};

const colorPresets = [
  { label: "Bleu", value: "#0C5FA8" },
  { label: "Noir", value: "#1B1F23" },
];

describe("RichEditorField", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
    __setMockEditorContentHtml("");
    mockRequestGallery.mockResolvedValue({ status: "granted" });
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file://photo.jpg",
          fileName: "photo.jpg",
          mimeType: "image/jpeg",
        },
      ],
    });
  });

  it("rend la barre d'outils et l'éditeur", () => {
    render(
      <RichEditorField
        placeholder="Écrire ici…"
        colorPresets={colorPresets}
        labels={labels}
      />,
    );

    expect(screen.getByTestId("rich-toolbar")).toBeTruthy();
    expect(screen.getByTestId("rich-editor")).toBeTruthy();
  });

  describe("auto-resize", () => {
    it("grandit quand le contenu WebView devient plus haut que la hauteur minimale", () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
          minHeight={200}
        />,
      );

      expect(
        (
          screen.UNSAFE_getByType(RichEditor).props.style as Array<{
            height?: number;
          }>
        ).find((entry) => typeof entry?.height === "number")?.height,
      ).toBe(200);

      fireEvent.press(screen.getByTestId("rich-editor-simulate-height-change"));

      expect(
        (
          screen.UNSAFE_getByType(RichEditor).props.style as Array<{
            height?: number;
          }>
        ).find((entry) => typeof entry?.height === "number")?.height,
      ).toBe(480);
    });

    it("ne redescend jamais sous minHeight même si le WebView reporte une hauteur plus petite", () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
          minHeight={500}
        />,
      );

      // Le mock ne peut reporter que 480, inférieur au minHeight custom de 500.
      fireEvent.press(screen.getByTestId("rich-editor-simulate-height-change"));

      expect(
        (
          screen.UNSAFE_getByType(RichEditor).props.style as Array<{
            height?: number;
          }>
        ).find((entry) => typeof entry?.height === "number")?.height,
      ).toBe(500);
    });
  });

  describe("insertion d'image", () => {
    it("insère l'image uploadée dans l'éditeur", async () => {
      const onUploadInlineImage = jest
        .fn()
        .mockResolvedValue({ url: "http://localhost:9000/homework/img.jpg" });
      const onChangeHtml = jest.fn();

      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
          onUploadInlineImage={onUploadInlineImage}
          onChangeHtml={onChangeHtml}
        />,
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId("toolbar-insert-image"));
      });

      expect(onUploadInlineImage).toHaveBeenCalledWith({
        uri: "file://photo.jpg",
        name: "photo.jpg",
        mimeType: "image/jpeg",
      });
      expect(__mockEditorMethods.insertImage).toHaveBeenCalledWith(
        "http://localhost:9000/homework/img.jpg",
        expect.stringContaining("width:100%"),
      );
      expect(onChangeHtml).toHaveBeenCalledWith(
        expect.stringContaining("http://localhost:9000/homework/img.jpg"),
      );
    });

    it("n'appelle pas onUploadInlineImage si aucun uploader n'est fourni", async () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
        />,
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId("toolbar-insert-image"));
      });

      expect(mockRequestGallery).not.toHaveBeenCalled();
      expect(__mockEditorMethods.insertImage).not.toHaveBeenCalled();
    });

    it("bloque l'insertion et affiche une alerte si la permission galerie est refusée", async () => {
      mockRequestGallery.mockResolvedValueOnce({ status: "denied" });
      const onUploadInlineImage = jest.fn();

      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
          onUploadInlineImage={onUploadInlineImage}
        />,
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId("toolbar-insert-image"));
      });

      expect(onUploadInlineImage).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        labels.permissionDeniedTitle,
        labels.permissionDeniedMessage,
      );
    });

    it("affiche une alerte d'erreur si l'upload échoue", async () => {
      const onUploadInlineImage = jest
        .fn()
        .mockRejectedValue(new Error("Réseau indisponible"));

      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
          onUploadInlineImage={onUploadInlineImage}
        />,
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId("toolbar-insert-image"));
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        labels.imageErrorTitle,
        "Réseau indisponible",
      );
    });

    it("n'insère rien si l'utilisateur annule la sélection", async () => {
      mockLaunchLibrary.mockResolvedValueOnce({ canceled: true, assets: [] });
      const onUploadInlineImage = jest.fn();

      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
          onUploadInlineImage={onUploadInlineImage}
        />,
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId("toolbar-insert-image"));
      });

      expect(onUploadInlineImage).not.toHaveBeenCalled();
      expect(__mockEditorMethods.insertImage).not.toHaveBeenCalled();
    });
  });

  describe("mise en forme", () => {
    it("applique un titre H2", () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
          headingButtonTestID="heading-btn"
        />,
      );

      fireEvent.press(screen.getByTestId("heading-btn"));

      expect(__mockEditorMethods.command).toHaveBeenCalledWith(
        expect.stringContaining("<h2>"),
      );
    });

    it("applique une citation", () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
          quoteButtonTestID="quote-btn"
        />,
      );

      fireEvent.press(screen.getByTestId("quote-btn"));

      expect(__mockEditorMethods.command).toHaveBeenCalledWith(
        expect.stringContaining("<blockquote>"),
      );
    });

    it("ouvre le menu de couleurs et applique la couleur choisie", () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
          colorButtonTestID="color-btn"
        />,
      );

      fireEvent.press(screen.getByTestId("color-btn"));

      expect(Alert.alert).toHaveBeenCalledWith(
        labels.colorMenuTitle,
        labels.colorMenuMessage,
        expect.any(Array),
      );

      const alertOptions = (Alert.alert as jest.Mock).mock
        .calls[0][2] as Array<{
        text: string;
        onPress?: () => void;
      }>;
      const blackOption = alertOptions.find((option) => option.text === "Noir");
      blackOption?.onPress?.();

      expect(__mockEditorMethods.setForeColor).toHaveBeenCalledWith("#1B1F23");
    });
  });

  describe("insertion de vidéo", () => {
    const mockLaunchVideo = jest.fn();

    beforeEach(() => {
      mockLaunchVideo.mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: "file://clip.mp4",
            fileName: "clip.mp4",
            mimeType: "video/mp4",
          },
        ],
      });
      mockLaunchLibrary.mockImplementation((...args: unknown[]) =>
        mockLaunchVideo(...args),
      );
    });

    it("insère une balise vidéo quand onUploadInlineVideo est fourni", async () => {
      const onUploadInlineVideo = jest
        .fn()
        .mockResolvedValue({ url: "http://localhost:9000/video.mp4" });

      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
          onUploadInlineVideo={onUploadInlineVideo}
          videoButtonTestID="video-btn"
        />,
      );

      await act(async () => {
        fireEvent.press(screen.getByTestId("video-btn"));
      });

      expect(onUploadInlineVideo).toHaveBeenCalledWith({
        uri: "file://clip.mp4",
        name: "clip.mp4",
        mimeType: "video/mp4",
      });
      expect(__mockEditorMethods.command).toHaveBeenCalledWith(
        expect.stringContaining("http://localhost:9000/video.mp4"),
      );
    });

    it("n'affiche pas le bouton vidéo si onUploadInlineVideo est absent", () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
          videoButtonTestID="video-btn"
        />,
      );

      expect(screen.queryByTestId("video-btn")).toBeNull();
    });
  });

  describe("panneau flottant de redimensionnement/alignement d'image (partagé avec la messagerie)", () => {
    it("installe le handler de tap sur les images une fois l'éditeur prêt", async () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
        />,
      );

      // Le mock déclenche editorInitializedCallback via setTimeout(0), comme le
      // ferait le pont WebView réel une fois le contenu chargé.
      await waitFor(() => {
        expect(__mockEditorMethods.commandDOM).toHaveBeenCalledWith(
          expect.stringContaining("__rnImgListenerAdded"),
        );
      });
    });

    it("affiche le panneau au tap sur une image et applique un redimensionnement", () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
        />,
      );

      expect(screen.queryByTestId("image-edit-panel")).toBeNull();

      fireEvent.press(screen.getByTestId("rich-editor-simulate-image-tap"));

      expect(screen.getByTestId("image-edit-panel")).toBeTruthy();

      fireEvent.press(screen.getByTestId("image-size-50"));

      expect(__mockEditorMethods.commandDOM).toHaveBeenLastCalledWith(
        expect.stringContaining('data-rn-id="img_1"'),
      );
      expect(__mockEditorMethods.commandDOM).toHaveBeenLastCalledWith(
        expect.stringContaining("width = '50%'"),
      );
    });

    it("applique un alignement gauche/centre/droite sur l'image sélectionnée", () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
        />,
      );

      fireEvent.press(screen.getByTestId("rich-editor-simulate-image-tap"));

      fireEvent.press(screen.getByTestId("image-align-left"));
      expect(__mockEditorMethods.commandDOM).toHaveBeenLastCalledWith(
        expect.stringContaining("float = 'left'"),
      );

      fireEvent.press(screen.getByTestId("image-align-right"));
      expect(__mockEditorMethods.commandDOM).toHaveBeenLastCalledWith(
        expect.stringContaining("float = 'right'"),
      );

      fireEvent.press(screen.getByTestId("image-align-center"));
      expect(__mockEditorMethods.commandDOM).toHaveBeenLastCalledWith(
        expect.stringContaining("float = 'none'"),
      );
    });

    it("supprime l'image sélectionnée et referme le panneau", () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
        />,
      );

      fireEvent.press(screen.getByTestId("rich-editor-simulate-image-tap"));
      fireEvent.press(screen.getByTestId("image-delete-btn"));

      expect(__mockEditorMethods.commandDOM).toHaveBeenLastCalledWith(
        expect.stringContaining("removeChild"),
      );
      expect(screen.queryByTestId("image-edit-panel")).toBeNull();
    });

    it("ferme le panneau via le bouton close", () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
        />,
      );

      fireEvent.press(screen.getByTestId("rich-editor-simulate-image-tap"));
      expect(screen.getByTestId("image-edit-panel")).toBeTruthy();

      fireEvent.press(screen.getByTestId("image-edit-close"));
      expect(screen.queryByTestId("image-edit-panel")).toBeNull();
    });

    it("referme le panneau quand on clique en dehors de l'image", () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
        />,
      );

      fireEvent.press(screen.getByTestId("rich-editor-simulate-image-tap"));
      expect(screen.getByTestId("image-edit-panel")).toBeTruthy();

      fireEvent.press(screen.getByTestId("rich-editor-simulate-click-outside"));
      expect(screen.queryByTestId("image-edit-panel")).toBeNull();
    });

    it("n'affiche pas le panneau tant qu'aucune image n'a été sélectionnée", () => {
      render(
        <RichEditorField
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
        />,
      );

      expect(screen.queryByTestId("image-edit-panel")).toBeNull();
      expect(__mockEditorMethods.commandDOM).not.toHaveBeenCalledWith(
        expect.stringContaining("removeChild"),
      );
    });
  });

  describe("API impérative (ref)", () => {
    it("getContentHtml retourne le HTML réel du WebView", async () => {
      __setMockEditorContentHtml("<p>Contenu réel</p>");
      const ref = React.createRef<RichEditorFieldRef>();

      render(
        <RichEditorField
          ref={ref}
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
        />,
      );

      await expect(ref.current?.getContentHtml()).resolves.toBe(
        "<p>Contenu réel</p>",
      );
    });

    it("getContentHtml retombe sur le state local si le WebView ne répond rien", async () => {
      __setMockEditorContentHtml("");
      const ref = React.createRef<RichEditorFieldRef>();

      render(
        <RichEditorField
          ref={ref}
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
          initialHtml="<p>Valeur initiale</p>"
        />,
      );

      await expect(ref.current?.getContentHtml()).resolves.toBe(
        "<p>Valeur initiale</p>",
      );
    });

    it("clear() vide le contenu de l'éditeur", () => {
      const ref = React.createRef<RichEditorFieldRef>();

      render(
        <RichEditorField
          ref={ref}
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
        />,
      );

      act(() => {
        ref.current?.clear();
      });

      expect(__mockEditorMethods.setContentHTML).toHaveBeenCalledWith("");
    });

    it("setContentHtml() remplace le contenu affiché (ex: changement d'élément édité)", async () => {
      const ref = React.createRef<RichEditorFieldRef>();

      render(
        <RichEditorField
          ref={ref}
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
        />,
      );

      act(() => {
        ref.current?.setContentHtml("<p>Nouvelle réponse</p>");
      });

      expect(__mockEditorMethods.setContentHTML).toHaveBeenCalledWith(
        "<p>Nouvelle réponse</p>",
      );

      __setMockEditorContentHtml("");
      await expect(ref.current?.getContentHtml()).resolves.toBe(
        "<p>Nouvelle réponse</p>",
      );
    });

    it("focus() donne le focus au contenu éditable", () => {
      const ref = React.createRef<RichEditorFieldRef>();

      render(
        <RichEditorField
          ref={ref}
          placeholder="Écrire ici…"
          colorPresets={colorPresets}
          labels={labels}
        />,
      );

      act(() => {
        ref.current?.focus();
      });

      expect(__mockEditorMethods.focusContentEditor).toHaveBeenCalledTimes(1);
    });
  });
});
