import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { TeacherClassFeedScreen } from "../../src/components/feed/TeacherClassFeedScreen";
import { feedApi } from "../../src/api/feed.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/feed.api");

const mockBack = jest.fn();
const mockOpenDrawer = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ classId: "class-6ec" }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => {
      callback();
    }, [callback]);
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: mockOpenDrawer }),
}));

const mockAuthState = {
  schoolSlug: "college-vogt",
  user: {
    id: "teacher-1",
    firstName: "Valery",
    lastName: "Mbele",
    role: "TEACHER",
    activeRole: "TEACHER",
    platformRoles: [] as string[],
  },
};

jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: (selector?: (state: typeof mockAuthState) => unknown) =>
    selector ? selector(mockAuthState) : mockAuthState,
}));

jest.mock("../../src/store/teacher-class-nav.store", () => ({
  useTeacherClassNavStore: (selector: (state: unknown) => unknown) =>
    selector({
      classOptions: {
        classes: [{ classId: "class-6ec", className: "6e C" }],
      },
    }),
}));

let capturedProps: Record<string, unknown> | null = null;

jest.mock("../../src/components/feed/FeedModuleScreen", () => ({
  FeedModuleScreen: (props: Record<string, unknown>) => {
    capturedProps = props;
    const { View } = require("react-native");
    return <View testID="teacher-class-feed-module" />;
  },
}));

const api = feedApi as jest.Mocked<typeof feedApi>;

beforeEach(() => {
  jest.clearAllMocks();
  capturedProps = null;
  api.list.mockResolvedValue({
    items: [],
    meta: { page: 1, limit: 12, total: 0, totalPages: 0 },
  });
  api.create.mockResolvedValue({
    id: "post-1",
    schoolSlug: "college-vogt",
    type: "POST",
    author: {
      id: "teacher-1",
      fullName: "Valery Mbele",
      roleLabel: "Professeur",
      avatarText: "VM",
    },
    title: "Info",
    bodyHtml: "<p>Body</p>",
    createdAt: "2026-05-01T10:00:00.000Z",
    featuredUntil: null,
    audience: {
      scope: "CLASS",
      label: "Classe 6e C",
      classId: "class-6ec",
    },
    attachments: [],
    likedByViewer: false,
    likesCount: 0,
    comments: [],
  });
  api.uploadInlineImage.mockResolvedValue({
    url: "https://example.test/image.png",
  });
});

describe("TeacherClassFeedScreen", () => {
  it("utilise le même scope métier de classe que l'élève et force la publication sur la classe courante", async () => {
    render(<TeacherClassFeedScreen />);

    expect(screen.getByTestId("teacher-class-feed-module")).toBeTruthy();
    expect(capturedProps).not.toBeNull();

    const loadPage = capturedProps?.loadPage as (input: {
      page: number;
      types: Array<"featured" | "polls">;
      search: string;
    }) => Promise<unknown>;
    const onCreatePost = capturedProps?.onCreatePost as (payload: {
      type: "POST" | "POLL";
      title: string;
      bodyHtml: string;
      audienceScope?: string;
      audienceLabel?: string;
    }) => Promise<unknown>;

    await loadPage({ page: 2, types: ["featured"], search: "conseil" });
    await onCreatePost({
      type: "POST",
      title: "Conseil de classe",
      bodyHtml: "<p>Jeudi 14h</p>",
      audienceScope: "SCHOOL_ALL",
      audienceLabel: "Toute l'école",
    });

    expect(api.list).toHaveBeenCalledWith("college-vogt", {
      viewScope: "CLASS",
      classId: "class-6ec",
      types: ["featured"],
      q: "conseil",
      page: 2,
      limit: 12,
    });
    expect(api.create).toHaveBeenCalledWith("college-vogt", {
      type: "POST",
      title: "Conseil de classe",
      bodyHtml: "<p>Jeudi 14h</p>",
      audienceScope: "CLASS",
      audienceClassId: "class-6ec",
      audienceLabel: "Classe 6e C",
    });
  });

  it("expose un header contextualisé avec le nom de classe résolu", () => {
    render(<TeacherClassFeedScreen />);

    expect(capturedProps).not.toBeNull();
    const renderHeader = capturedProps?.renderHeader as (controls: {
      openHelp: () => void;
    }) => React.ReactNode;
    render(<>{renderHeader({ openHelp: jest.fn() })}</>);

    expect(screen.getByTestId("teacher-class-feed-header")).toBeTruthy();
    expect(screen.getByTestId("teacher-class-feed-title")).toHaveTextContent(
      "Vie de classe",
    );
    expect(screen.getByTestId("teacher-class-feed-subtitle")).toHaveTextContent(
      "6e C",
    );
  });

  it("passe un contenu d'aide en sous-chapitres (nouveau standard) au module de fil", () => {
    render(<TeacherClassFeedScreen />);

    expect(capturedProps).not.toBeNull();
    const helpSections = capturedProps?.helpSections as Array<{
      title: string;
      body: string[];
    }>;
    expect(helpSections.map((section) => section.title)).toEqual([
      "Rechercher une publication",
      "Filtrer par type",
      "Appliquer les filtres",
    ]);
    expect(capturedProps?.helpBody).toBeUndefined();
  });

  it("ouvre l'aide via l'entrée « Aide » du menu ... (pas une icône séparée)", () => {
    render(<TeacherClassFeedScreen />);

    const openHelp = jest.fn();
    const renderHeader = capturedProps?.renderHeader as (controls: {
      openHelp: () => void;
    }) => React.ReactNode;
    render(<>{renderHeader({ openHelp })}</>);

    expect(screen.queryByTestId("teacher-class-feed-help-toggle")).toBeNull();

    fireEvent.press(screen.getByTestId("module-header-menu"));
    fireEvent.press(screen.getByTestId("teacher-class-feed-help-menu-item"));

    expect(openHelp).toHaveBeenCalledTimes(1);
  });
});
