/**
 * Tests i18n — module fil/actualité (mobile)
 * Vérifie l'alignement des clés fr/en du namespace `feed.*`
 * et la traduction effective de l'UI quand la locale est `en`.
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import FeedScreen from "../../app/(home)/feed";
import { feedApi } from "../../src/api/feed.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { useFeedStore } from "../../src/store/feed.store";
import { useLocaleStore } from "../../src/store/locale.store";
import { DEFAULT_LOCALE, translations } from "../../src/i18n/translations";
import { translate } from "../../src/i18n/useTranslation";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");
jest.mock("../../src/api/feed.api");

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
  usePathname: () => "/(home)/feed",
}));

const api = feedApi as jest.Mocked<typeof feedApi>;
let consoleErrorSpy: jest.SpyInstance | undefined;
let consoleWarnSpy: jest.SpyInstance | undefined;

const samplePost = {
  id: "post-1",
  schoolSlug: "college-vogt",
  type: "POST" as const,
  author: {
    id: "u1",
    fullName: "Alice Martin",
    roleLabel: "Parent délégué",
    avatarText: "AM",
  },
  title: "Réunion des parents",
  bodyHtml: "<p>Merci pour votre présence.</p>",
  createdAt: "2026-04-05T10:00:00.000Z",
  featuredUntil: null,
  audience: {
    scope: "PARENTS_ONLY" as const,
    label: "Parents uniquement",
  },
  attachments: [],
  likedByViewer: false,
  likesCount: 2,
  comments: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  const shouldSilenceActWarning = (args: unknown[]) => {
    const message = args
      .map((value) =>
        typeof value === "string"
          ? value
          : value instanceof Error
            ? value.message
            : "",
      )
      .join(" ");
    return message.includes("not wrapped in act");
  };
  consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation((...args) => {
      if (shouldSilenceActWarning(args)) {
        return;
      }
      jest.requireActual("console").error(...args);
    });
  consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation((...args) => {
    if (shouldSilenceActWarning(args)) {
      return;
    }
    jest.requireActual("console").warn(...args);
  });
  useFeedStore.getState().reset();
  useAuthStore.setState({
    user: {
      id: "user-1",
      firstName: "Robert",
      lastName: "Ntamack",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "PARENT" }],
      profileCompleted: true,
      role: "PARENT",
      activeRole: "PARENT",
    },
    schoolSlug: "college-vogt",
    isLoading: false,
    isAuthenticated: true,
    accessToken: "token",
    authErrorMessage: null,
  });
  useFamilyStore.setState({
    children: [{ id: "child-1", firstName: "Remi", lastName: "Ntamack" }],
    activeChildId: "child-1",
    isLoading: false,
  });
  api.list.mockResolvedValue({
    items: [samplePost],
    meta: { page: 1, limit: 12, total: 1, totalPages: 1 },
  });
  api.create.mockResolvedValue(samplePost);
  api.uploadInlineImage.mockResolvedValue({
    url: "http://10.0.2.2:3001/mock/media/feed.png",
  });
});

afterEach(() => {
  consoleErrorSpy?.mockRestore();
  consoleWarnSpy?.mockRestore();
  useLocaleStore.setState({ locale: DEFAULT_LOCALE });
});

async function renderFeedScreen() {
  render(<FeedScreen />);
  await waitFor(() => {
    expect(api.list).toHaveBeenCalled();
  });
}

describe("Fil d'actualité — traduction selon la locale du compte (mobile)", () => {
  it("a un namespace feed.* avec des clés fr/en alignées et non vides", () => {
    const frKeys = Object.keys(translations.fr).filter((key) =>
      key.startsWith("feed."),
    );
    const enKeys = Object.keys(translations.en).filter((key) =>
      key.startsWith("feed."),
    );

    expect(frKeys.length).toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(frKeys));

    for (const key of frKeys) {
      expect(translations.fr[key]).not.toBe("");
      expect(translations.en[key]).not.toBe("");
    }
  });

  it("affiche le titre, les filtres et l'état vide en français par défaut", async () => {
    api.list.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
    });

    await renderFeedScreen();

    expect(screen.getByTestId("module-header-title")).toHaveTextContent(
      translate("fr", "feed.page.title"),
    );
    expect(screen.getByTestId("feed-filter-all")).toHaveTextContent(
      translate("fr", "feed.filters.all"),
    );
    expect(screen.getByTestId("feed-filter-featured")).toHaveTextContent(
      translate("fr", "feed.filters.featured"),
    );
    expect(screen.getByTestId("feed-filter-polls")).toHaveTextContent(
      translate("fr", "feed.filters.polls"),
    );
    expect(screen.getByTestId("feed-filter-mine")).toHaveTextContent(
      translate("fr", "feed.filters.mine"),
    );
    expect(
      screen.getByText(translate("fr", "feed.page.emptyTitle")),
    ).toBeTruthy();
  });

  it("affiche le titre, les filtres et l'état vide en anglais quand locale=en", async () => {
    useLocaleStore.setState({ locale: "en" });
    api.list.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
    });

    await renderFeedScreen();

    expect(screen.getByTestId("module-header-title")).toHaveTextContent(
      translate("en", "feed.page.title"),
    );
    expect(screen.getByTestId("feed-filter-all")).toHaveTextContent(
      translate("en", "feed.filters.all"),
    );
    expect(screen.getByTestId("feed-filter-featured")).toHaveTextContent(
      translate("en", "feed.filters.featured"),
    );
    expect(screen.getByTestId("feed-filter-polls")).toHaveTextContent(
      translate("en", "feed.filters.polls"),
    );
    expect(screen.getByTestId("feed-filter-mine")).toHaveTextContent(
      translate("en", "feed.filters.mine"),
    );
    expect(
      screen.getByText(translate("en", "feed.page.emptyTitle")),
    ).toBeTruthy();
    expect(
      screen.queryByText(translate("fr", "feed.page.emptyTitle")),
    ).toBeNull();
  });

  it("traduit le composeur et le sélecteur de recherche en anglais", async () => {
    useLocaleStore.setState({ locale: "en" });

    await renderFeedScreen();

    fireEvent.press(screen.getByTestId("feed-open-composer"));

    expect(screen.getByTestId("feed-composer-card")).toBeTruthy();
    expect(
      screen.getByText(translate("en", "feed.composer.heading")),
    ).toBeTruthy();
    expect(
      screen.getByTestId("feed-composer-title").props.placeholder,
    ).toBe(translate("en", "feed.composer.titlePlaceholder"));
    expect(
      screen.getByTestId("feed-composer-type-post"),
    ).toHaveTextContent(translate("en", "feed.composer.modePost"));
    expect(
      screen.getByTestId("feed-composer-type-poll"),
    ).toHaveTextContent(translate("en", "feed.composer.modePoll"));
    expect(
      screen.getByText(translate("en", "feed.composer.publish")),
    ).toBeTruthy();
  });

  it("affiche le message de validation du titre en anglais lors de la soumission", async () => {
    useLocaleStore.setState({ locale: "en" });

    await renderFeedScreen();

    fireEvent.press(screen.getByTestId("feed-open-composer"));
    fireEvent.press(screen.getByTestId("feed-composer-submit"));

    await waitFor(() => {
      expect(
        screen.getByText(translate("en", "feed.validation.titleRequired")),
      ).toBeTruthy();
    });
  });
});
