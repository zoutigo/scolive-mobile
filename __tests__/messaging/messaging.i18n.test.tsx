/**
 * Tests i18n — module messagerie (mobile)
 * Vérifie l'alignement des clés fr/en du namespace `messaging.*`
 * et la traduction effective de l'UI quand la locale est `en`.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import MessagesScreen from "../../app/(home)/messages/index";
import { useMessagingStore } from "../../src/store/messaging.store";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { useLocaleStore } from "../../src/store/locale.store";
import { DEFAULT_LOCALE, translations } from "../../src/i18n/translations";
import { translate } from "../../src/i18n/useTranslation";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockRouter = { push: mockPush, back: mockBack };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/messages",
  useLocalSearchParams: () => ({}),
}));

jest.mock("../../src/store/messaging.store");
jest.mock("../../src/store/auth.store");

const defaultStoreState = {
  folder: "inbox" as const,
  messages: [],
  meta: null,
  isLoading: false,
  isRefreshing: false,
  search: "",
  unreadCount: 0,
  setFolder: jest.fn(),
  setSearch: jest.fn(),
  loadMessages: jest.fn().mockResolvedValue(undefined),
  refreshMessages: jest.fn().mockResolvedValue(undefined),
  loadMoreMessages: jest.fn().mockResolvedValue(undefined),
  loadUnreadCount: jest.fn().mockResolvedValue(undefined),
  markLocalRead: jest.fn(),
  removeLocal: jest.fn(),
  reset: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (useMessagingStore as unknown as jest.Mock).mockReturnValue(
    defaultStoreState,
  );
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    user: {
      id: "parent-1",
      firstName: "Valery",
      lastName: "Mbele",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "PARENT" }],
      profileCompleted: true,
      role: "PARENT",
      activeRole: "PARENT",
    },
    schoolSlug: "college-vogt",
    logout: jest.fn(),
  });
  useFamilyStore.setState({
    children: [
      {
        id: "child-1",
        firstName: "Remi",
        lastName: "Ntamack",
        className: "6e C",
      },
    ],
    activeChildId: "child-1",
    isLoading: false,
    loadChildren: jest.fn(async () => {}),
    clearChildren: jest.fn(),
  });
});

afterEach(() => {
  useLocaleStore.setState({ locale: DEFAULT_LOCALE });
});

describe("Messagerie — traduction selon la locale du compte (mobile)", () => {
  it("a un namespace messaging.* avec des clés fr/en alignées et non vides", () => {
    const frKeys = Object.keys(translations.fr).filter((key) =>
      key.startsWith("messaging."),
    );
    const enKeys = Object.keys(translations.en).filter((key) =>
      key.startsWith("messaging."),
    );

    expect(frKeys.length).toBeGreaterThan(0);
    expect(new Set(enKeys)).toEqual(new Set(frKeys));

    for (const key of frKeys) {
      expect(translations.fr[key]).not.toBe("");
      expect(translations.en[key]).not.toBe("");
    }
  });

  it("affiche le titre, les onglets de dossiers et le bouton de recherche en français par défaut", () => {
    render(<MessagesScreen />);

    expect(screen.getByTestId("messages-header-title")).toHaveTextContent(
      translate("fr", "messaging.title"),
    );
    expect(screen.getByTestId("folder-tab-inbox")).toHaveTextContent(
      translate("fr", "messaging.folders.inbox"),
    );
    expect(screen.getByTestId("folder-tab-sent")).toHaveTextContent(
      translate("fr", "messaging.folders.sent"),
    );
    expect(
      screen.getByText(translate("fr", "messaging.list.emptyInbox")),
    ).toBeTruthy();
  });

  it("affiche le titre, les onglets de dossiers et l'état vide en anglais quand locale=en", () => {
    useLocaleStore.setState({ locale: "en" });

    render(<MessagesScreen />);

    expect(screen.getByTestId("messages-header-title")).toHaveTextContent(
      translate("en", "messaging.title"),
    );
    expect(screen.getByTestId("folder-tab-inbox")).toHaveTextContent(
      translate("en", "messaging.folders.inbox"),
    );
    expect(screen.getByTestId("folder-tab-sent")).toHaveTextContent(
      translate("en", "messaging.folders.sent"),
    );
    expect(screen.getByTestId("folder-tab-drafts")).toHaveTextContent(
      translate("en", "messaging.folders.drafts"),
    );
    expect(screen.getByTestId("folder-tab-archive")).toHaveTextContent(
      translate("en", "messaging.folders.archive"),
    );

    expect(
      screen.getByText(translate("en", "messaging.list.emptyInbox")),
    ).toBeTruthy();
    expect(
      screen.queryByText(translate("fr", "messaging.list.emptyInbox")),
    ).toBeNull();
  });

  it("affiche le bouton de recherche de message en anglais quand locale=en", () => {
    useLocaleStore.setState({ locale: "en" });
    useFamilyStore.setState({ activeChildId: null });

    render(<MessagesScreen />);

    expect(
      screen.getByText(translate("en", "messaging.list.searchEntry")),
    ).toBeTruthy();

    fireEvent.press(screen.getByTestId("messages-search-btn"));

    expect(screen.getByTestId("messages-search-input").props.placeholder).toBe(
      translate("en", "messaging.list.searchPlaceholder"),
    );
  });
});
