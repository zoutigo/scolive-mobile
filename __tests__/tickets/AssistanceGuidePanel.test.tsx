import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AssistanceGuidePanel } from "../../src/components/tickets/AssistanceGuidePanel";
import { helpGuidesApi } from "../../src/api/help-guides.api";
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
    getPlan: jest.fn(),
    getChapter: jest.fn(),
    search: jest.fn(),
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

describe("AssistanceGuidePanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockApi.getCurrent.mockResolvedValue({
      permissions: { canManageGlobal: true, canManageSchool: false },
      schoolScope: null,
      resolvedAudience: "PARENT",
      sources: [
        {
          key: "global",
          scopeType: "GLOBAL",
          scopeLabel: "Scolive",
          schoolId: null,
          schoolName: null,
          guide: {
            id: "guide-1",
            schoolId: null,
            schoolName: null,
            audience: "PARENT",
            title: "Guide parent",
            slug: "guide-parent",
            description: null,
            status: "PUBLISHED",
            chapterCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      ],
      defaultSourceKey: "global",
    });

    mockApi.getPlan.mockResolvedValue({
      sources: [
        {
          key: "global",
          scopeType: "GLOBAL",
          scopeLabel: "Scolive",
          schoolId: null,
          schoolName: null,
          guide: {
            id: "guide-1",
            schoolId: null,
            schoolName: null,
            audience: "PARENT",
            title: "Guide parent",
            slug: "guide-parent",
            description: null,
            status: "PUBLISHED",
            chapterCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          items: [
            {
              id: "c1",
              title: "Messagerie",
              slug: "messagerie",
              parentId: null,
              orderIndex: 1,
              depth: 0,
              contentType: "RICH_TEXT",
              status: "PUBLISHED",
              children: [],
            },
          ],
        },
      ],
    });

    mockApi.getChapter.mockResolvedValue({
      source: undefined,
      chapter: {
        id: "c1",
        guideId: "guide-1",
        parentId: null,
        orderIndex: 1,
        title: "Messagerie",
        slug: "messagerie",
        summary: "Résumé",
        contentType: "RICH_TEXT",
        contentHtml: "<p>Contenu</p>",
        contentJson: { html: "<p>Contenu</p>" },
        videoUrl: null,
        contentText: "Contenu",
        status: "PUBLISHED",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    mockApi.listGlobalAdmin.mockResolvedValue({
      items: [
        {
          id: "guide-1",
          schoolId: null,
          schoolName: null,
          audience: "PARENT",
          title: "Guide parent",
          slug: "guide-parent",
          description: null,
          status: "PUBLISHED",
          chapterCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
  });

  it("charge le guide et affiche les formulaires admin", async () => {
    render(<AssistanceGuidePanel />);

    await waitFor(() => {
      expect(screen.getAllByText("Guide parent").length).toBeGreaterThanOrEqual(
        1,
      );
    });

    expect(screen.getAllByText("Messagerie").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByTestId("assistance-guide-admin-forms-mobile"),
    ).toBeTruthy();
  });

  it("masque les formulaires admin sans role platform local", async () => {
    render(<AssistanceGuidePanel canManageOverride={false} />);

    await waitFor(() => {
      expect(screen.getAllByText("Guide parent").length).toBeGreaterThanOrEqual(
        1,
      );
    });

    expect(
      screen.queryByTestId("assistance-guide-admin-forms-mobile"),
    ).toBeNull();
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

    render(<AssistanceGuidePanel />);

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

    render(<AssistanceGuidePanel />);

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
