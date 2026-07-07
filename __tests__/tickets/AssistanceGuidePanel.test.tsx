import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AssistanceGuidePanel } from "../../src/components/tickets/AssistanceGuidePanel";
import { helpGuidesApi } from "../../src/api/help-guides.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("../../src/api/help-guides.api", () => ({
  helpGuidesApi: {
    getCurrent: jest.fn(),
    getPlan: jest.fn(),
    getChapter: jest.fn(),
    search: jest.fn(),
    listGlobalAdmin: jest.fn(),
    listSchoolAdmin: jest.fn(),
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

  it("charge le guide et affiche le bouton de gestion pour un admin", async () => {
    const onManage = jest.fn();
    render(<AssistanceGuidePanel onManage={onManage} />);

    await waitFor(() => {
      expect(screen.getAllByText("Guide parent").length).toBeGreaterThanOrEqual(
        1,
      );
    });

    expect(screen.getAllByText("Messagerie").length).toBeGreaterThanOrEqual(1);

    const manageBtn = screen.getByTestId("assistance-guide-manage-btn");
    expect(manageBtn).toBeTruthy();
    fireEvent.press(manageBtn);
    expect(onManage).toHaveBeenCalledTimes(1);
  });

  it("masque le bouton de gestion sans role platform local", async () => {
    render(<AssistanceGuidePanel canManageOverride={false} />);

    await waitFor(() => {
      expect(screen.getAllByText("Guide parent").length).toBeGreaterThanOrEqual(
        1,
      );
    });

    expect(screen.queryByTestId("assistance-guide-manage-btn")).toBeNull();
  });
});
