import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react-native";
import { AssistanceFaqPanel } from "../../src/components/tickets/AssistanceFaqPanel";
import { helpFaqsApi } from "../../src/api/help-faqs.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor", () => {
  const React = require("react");
  const { View } = require("react-native");

  const RichEditor = React.forwardRef(
    (
      _props: unknown,
      ref: React.Ref<{
        setContentHTML: () => void;
        setForeColor: () => void;
        command: () => void;
      }>,
    ) => {
      React.useImperativeHandle(ref, () => ({
        setContentHTML: () => undefined,
        setForeColor: () => undefined,
        command: () => undefined,
      }));
      return <View testID="mock-rich-editor" />;
    },
  );

  return {
    RichEditor,
    RichToolbar: () => <View testID="mock-rich-toolbar" />,
    actions: {
      setBold: "setBold",
      setItalic: "setItalic",
      setUnderline: "setUnderline",
      setStrikethrough: "setStrikethrough",
      insertBulletsList: "insertBulletsList",
      insertOrderedList: "insertOrderedList",
      insertImage: "insertImage",
    },
  };
});

jest.mock("../../src/api/help-faqs.api", () => ({
  helpFaqsApi: {
    getCurrent: jest.fn(),
    getThemes: jest.fn(),
    search: jest.fn(),
    listGlobalAdmin: jest.fn(),
    listSchoolAdmin: jest.fn(),
    createGlobalFaq: jest.fn(),
    createSchoolFaq: jest.fn(),
    updateGlobalFaq: jest.fn(),
    updateSchoolFaq: jest.fn(),
    deleteGlobalFaq: jest.fn(),
    deleteSchoolFaq: jest.fn(),
    createGlobalTheme: jest.fn(),
    createSchoolTheme: jest.fn(),
    updateGlobalTheme: jest.fn(),
    updateSchoolTheme: jest.fn(),
    deleteGlobalTheme: jest.fn(),
    deleteSchoolTheme: jest.fn(),
    createGlobalItem: jest.fn(),
    createSchoolItem: jest.fn(),
    updateGlobalItem: jest.fn(),
    updateSchoolItem: jest.fn(),
    deleteGlobalItem: jest.fn(),
    deleteSchoolItem: jest.fn(),
  },
}));

const mockApi = helpFaqsApi as jest.Mocked<typeof helpFaqsApi>;

describe("AssistanceFaqPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockApi.getCurrent.mockResolvedValue({
      permissions: { canManageGlobal: true, canManageSchool: false },
      schoolScope: null,
      resolvedAudience: "TEACHER",
      defaultSourceKey: "global",
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
        },
      ],
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

    mockApi.search.mockResolvedValue({
      sources: [],
      items: [
        {
          id: "item-1",
          themeId: "theme-1",
          orderIndex: 1,
          question: "Comment informer les parents d'un changement d'horaire ?",
          answerHtml: "<p>Publiez une annonce et envoyez un message ciblé.</p>",
          answerJson: {
            html: "<p>Publiez une annonce et envoyez un message ciblé.</p>",
          },
          answerText: "Publiez une annonce et envoyez un message ciblé.",
          status: "PUBLISHED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          faqId: "faq-1",
          sourceKey: "global",
          scopeType: "GLOBAL",
          scopeLabel: "Scolive",
          schoolId: null,
          schoolName: null,
          themeTitle: "Messagerie",
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

  it("charge la faq et affiche les formulaires admin", async () => {
    render(<AssistanceFaqPanel />);

    await waitFor(() => {
      expect(
        screen.getAllByText("FAQ enseignant").length,
      ).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getAllByText("Messagerie").length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByTestId("assistance-faq-admin-forms-mobile"),
    ).toBeTruthy();
  });

  it("masque les formulaires admin sans role platform local", async () => {
    render(<AssistanceFaqPanel canManageOverride={false} />);

    await waitFor(() => {
      expect(
        screen.getAllByText("FAQ enseignant").length,
      ).toBeGreaterThanOrEqual(1);
    });

    expect(
      screen.queryByTestId("assistance-faq-admin-forms-mobile"),
    ).toBeNull();
  });

  it("ouvre le contenu d'un thème", async () => {
    render(<AssistanceFaqPanel />);

    await waitFor(() => {
      expect(screen.getAllByText("Messagerie").length).toBeGreaterThanOrEqual(
        1,
      );
    });

    fireEvent.press(screen.getAllByText("Messagerie")[0]);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Comment informer les parents d'un changement d'horaire ?",
        ),
      ).toBeTruthy();
    });
  });
});
