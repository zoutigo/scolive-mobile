import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AssistanceGuideAdminForms } from "../../src/components/tickets/AssistanceGuideAdminForms";
import { helpGuidesApi } from "../../src/api/help-guides.api";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { __mockEditorMethods } from "../../__mocks__/react-native-pell-rich-editor";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock("../../src/api/help-guides.api", () => ({
  helpGuidesApi: {
    getCurrent: jest.fn(),
    listGlobalAdmin: jest.fn(),
    listSchoolAdmin: jest.fn(),
    createGlobalGuide: jest.fn(),
    createSchoolGuide: jest.fn(),
    createGlobalChapter: jest.fn(),
    createSchoolChapter: jest.fn(),
    uploadInlineImage: jest.fn(),
    uploadInlineVideo: jest.fn(),
  },
}));

const mockApi = helpGuidesApi as jest.Mocked<typeof helpGuidesApi>;

function makeGuideItem(overrides: Partial<{ id: string; title: string }> = {}) {
  return {
    id: overrides.id ?? "guide-1",
    schoolId: null,
    schoolName: null,
    audience: "PARENT" as const,
    title: overrides.title ?? "Guide parent",
    slug: "guide-parent",
    description: null,
    status: "PUBLISHED" as const,
    chapterCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe("AssistanceGuideAdminForms", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSuccessToastStore.setState({
      visible: false,
      variant: "success",
      title: "",
      message: "",
    });

    mockApi.getCurrent.mockResolvedValue({
      permissions: { canManageGlobal: true, canManageSchool: false },
      schoolScope: null,
      resolvedAudience: "PARENT",
      sources: [],
      defaultSourceKey: "global",
    });
    mockApi.listGlobalAdmin.mockResolvedValue({ items: [makeGuideItem()] });
  });

  it("affiche le formulaire de création de guide et de chapitre", async () => {
    render(<AssistanceGuideAdminForms onDone={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByTestId("assistance-guide-admin-forms-mobile"),
      ).toBeTruthy();
    });

    expect(
      screen.getByTestId("assistance-guide-admin-guide-title"),
    ).toBeTruthy();
    expect(
      screen.getByTestId("assistance-guide-admin-chapter-title"),
    ).toBeTruthy();
  });

  it("câblage scroll-vers-erreur : submit guide avec titre vide ne crashe pas et bloque l'appel API", async () => {
    render(<AssistanceGuideAdminForms onDone={jest.fn()} />);
    await waitFor(() =>
      expect(
        screen.getByTestId("assistance-guide-admin-guide-title"),
      ).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(
        screen.getByTestId("assistance-guide-admin-create-guide-submit"),
      );
    });

    expect(mockApi.createGlobalGuide).not.toHaveBeenCalled();
  });

  it("crée un guide puis affiche un toast de succès", async () => {
    mockApi.createGlobalGuide.mockResolvedValue(
      makeGuideItem({ id: "guide-2", title: "Nouveau guide" }),
    );

    render(<AssistanceGuideAdminForms onDone={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByTestId("assistance-guide-admin-forms-mobile"),
      ).toBeTruthy();
    });

    fireEvent.changeText(
      screen.getByTestId("assistance-guide-admin-guide-title"),
      "Nouveau guide",
    );

    await act(async () => {
      fireEvent.press(
        screen.getByTestId("assistance-guide-admin-create-guide-submit"),
      );
    });

    await waitFor(() => {
      expect(mockApi.createGlobalGuide).toHaveBeenCalledWith({
        title: "Nouveau guide",
        audience: "PARENT",
      });
    });
    expect(useSuccessToastStore.getState().visible).toBe(true);
    expect(useSuccessToastStore.getState().variant).toBe("success");
  });

  it("appelle onDone au clic sur Terminé", async () => {
    const onDone = jest.fn();
    render(<AssistanceGuideAdminForms onDone={onDone} />);

    await waitFor(() => {
      expect(
        screen.getByTestId("assistance-guide-admin-forms-mobile"),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("assistance-guide-admin-done"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("uploade et insère une image dans l'éditeur de chapitre", async () => {
    (
      require("expo-image-picker")
        .requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({ status: "granted" });
    (
      require("expo-image-picker").launchImageLibraryAsync as jest.Mock
    ).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///photo.jpg",
          fileName: "photo.jpg",
          mimeType: "image/jpeg",
        },
      ],
    });
    mockApi.uploadInlineImage.mockResolvedValue({
      url: "https://example.com/chapter-img.jpg",
    });

    render(<AssistanceGuideAdminForms onDone={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByTestId("assistance-guide-admin-forms-mobile"),
      ).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId("toolbar-insert-image"));
    });

    expect(mockApi.uploadInlineImage).toHaveBeenCalledWith({
      uri: "file:///photo.jpg",
      name: "photo.jpg",
      mimeType: "image/jpeg",
    });
    expect(__mockEditorMethods.insertImage).toHaveBeenCalledWith(
      "https://example.com/chapter-img.jpg",
      expect.any(String),
    );
  });

  it("uploade et insère une vidéo dans l'éditeur de chapitre", async () => {
    (
      require("expo-image-picker")
        .requestMediaLibraryPermissionsAsync as jest.Mock
    ).mockResolvedValue({ status: "granted" });
    (
      require("expo-image-picker").launchImageLibraryAsync as jest.Mock
    ).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///clip.mp4",
          fileName: "clip.mp4",
          mimeType: "video/mp4",
        },
      ],
    });
    mockApi.uploadInlineVideo.mockResolvedValue({
      url: "https://example.com/chapter-video.mp4",
    });

    render(<AssistanceGuideAdminForms onDone={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByTestId("assistance-guide-admin-forms-mobile"),
      ).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId("editor-video-btn"));
    });

    expect(mockApi.uploadInlineVideo).toHaveBeenCalledWith({
      uri: "file:///clip.mp4",
      name: "clip.mp4",
      mimeType: "video/mp4",
    });
    expect(__mockEditorMethods.command).toHaveBeenCalledWith(
      expect.stringContaining("https://example.com/chapter-video.mp4"),
    );
  });
});
