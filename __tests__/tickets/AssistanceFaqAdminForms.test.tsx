import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AssistanceFaqAdminForms } from "../../src/components/tickets/AssistanceFaqAdminForms";
import { helpFaqsApi } from "../../src/api/help-faqs.api";
import { useSuccessToastStore } from "../../src/store/success-toast.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
// react-native-pell-rich-editor est auto-mocké via __mocks__/react-native-pell-rich-editor.js

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock("../../src/api/help-faqs.api", () => ({
  helpFaqsApi: {
    getCurrent: jest.fn(),
    getThemes: jest.fn(),
    listGlobalAdmin: jest.fn(),
    listSchoolAdmin: jest.fn(),
    createGlobalFaq: jest.fn(),
    createSchoolFaq: jest.fn(),
    updateGlobalFaq: jest.fn(),
    updateSchoolFaq: jest.fn(),
    createGlobalTheme: jest.fn(),
    createSchoolTheme: jest.fn(),
    updateGlobalTheme: jest.fn(),
    updateSchoolTheme: jest.fn(),
    createGlobalItem: jest.fn(),
    createSchoolItem: jest.fn(),
    updateGlobalItem: jest.fn(),
    updateSchoolItem: jest.fn(),
    uploadInlineImage: jest.fn(),
  },
}));

const mockApi = helpFaqsApi as jest.Mocked<typeof helpFaqsApi>;

describe("AssistanceFaqAdminForms", () => {
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
      resolvedAudience: "TEACHER",
      defaultSourceKey: "global",
      sources: [],
    });

    mockApi.getThemes.mockResolvedValue({
      sources: [
        {
          key: "global",
          scopeType: "GLOBAL",
          scopeLabel: "Scolive",
          schoolId: null,
          schoolName: null,
          faq: {
            id: "faq-1",
            schoolId: null,
            schoolName: null,
            audience: "TEACHER",
            title: "FAQ enseignant",
            slug: "faq-enseignant",
            description: "Réponses utiles pour la classe.",
            status: "PUBLISHED",
            themeCount: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          themes: [
            {
              id: "theme-1",
              faqId: "faq-1",
              orderIndex: 1,
              title: "Messagerie",
              slug: "messagerie",
              description: "Questions sur les échanges avec les familles.",
              status: "PUBLISHED",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              items: [
                {
                  id: "item-1",
                  themeId: "theme-1",
                  orderIndex: 1,
                  question:
                    "Comment informer les parents d'un changement d'horaire ?",
                  answerHtml:
                    "<p>Publiez une annonce et envoyez un message ciblé.</p>",
                  answerJson: {
                    html: "<p>Publiez une annonce et envoyez un message ciblé.</p>",
                  },
                  answerText:
                    "Publiez une annonce et envoyez un message ciblé.",
                  status: "PUBLISHED",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
            },
          ],
        },
      ],
    });

    mockApi.listGlobalAdmin.mockResolvedValue({
      items: [
        {
          id: "faq-1",
          schoolId: null,
          schoolName: null,
          audience: "TEACHER",
          title: "FAQ enseignant",
          slug: "faq-enseignant",
          description: "Réponses utiles pour la classe.",
          status: "PUBLISHED",
          themeCount: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });
  });

  it("charge la FAQ et affiche les formulaires d'administration", async () => {
    render(<AssistanceFaqAdminForms onDone={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByTestId("assistance-faq-admin-forms-mobile"),
      ).toBeTruthy();
    });

    expect(screen.getByTestId("assistance-faq-admin-faq-title")).toBeTruthy();
    expect(screen.getByTestId("assistance-faq-admin-theme-title")).toBeTruthy();
    expect(
      screen.getByTestId("assistance-faq-admin-item-question"),
    ).toBeTruthy();
  });

  it("appelle onDone au clic sur Terminé", async () => {
    const onDone = jest.fn();
    render(<AssistanceFaqAdminForms onDone={onDone} />);

    await waitFor(() => {
      expect(
        screen.getByTestId("assistance-faq-admin-forms-mobile"),
      ).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("assistance-faq-admin-done"));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("uploade et insère une image dans l'éditeur de réponse FAQ", async () => {
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
      url: "https://example.com/faq-answer-img.jpg",
    });

    render(<AssistanceFaqAdminForms onDone={jest.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByTestId("assistance-faq-admin-forms-mobile"),
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

    const {
      __mockEditorMethods,
    } = require("../../__mocks__/react-native-pell-rich-editor");
    expect(__mockEditorMethods.insertImage).toHaveBeenCalledWith(
      "https://example.com/faq-answer-img.jpg",
      expect.any(String),
    );
  });
});
