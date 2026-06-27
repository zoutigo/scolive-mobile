/**
 * Tests — AccountScreen : section changement d'email + accountApi (requestEmailChange, linkSsoAccount)
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AccountScreen } from "../../src/components/account/AccountScreen";
import { SuccessToastHost } from "../../src/components/feedback/SuccessToastHost";
import { accountApi } from "../../src/api/account.api";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";
import { apiFetch } from "../../src/api/client";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/account.api");
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));
jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
  useDrawer: () => ({
    openDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    closeDrawer: jest.fn(),
  }),
}));
jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
}));

const api = accountApi as jest.Mocked<typeof accountApi>;
const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

const CURRENT_EMAIL = "remi@example.com";
const NEW_EMAIL = "remi-new@example.com";

function baseSetup() {
  useSuccessToastStore.getState().hide();
  useAuthStore.setState({
    user: {
      id: "user-1",
      firstName: "Remi",
      lastName: "Ntamack",
      email: CURRENT_EMAIL,
      phone: "237650123456",
      gender: "M",
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

  api.getMe.mockResolvedValue({
    firstName: "Remi",
    lastName: "Ntamack",
    gender: "M",
    preferredLocale: "FR",
    email: CURRENT_EMAIL,
    phone: "237650123456",
    role: "PARENT",
    activeRole: "PARENT",
    platformRoles: [],
    memberships: [{ schoolId: "school-1", role: "PARENT" }],
    schoolSlug: "college-vogt",
    hasPassword: true,
    hasPhoneCredential: true,
  });

  api.getRecoveryOptions.mockResolvedValue({
    schoolRoles: ["PARENT"],
    questions: [],
    classes: [],
    students: [],
    selectedQuestions: [],
    birthDate: "",
    parentClassId: null,
    parentStudentId: null,
  });
}

// ── AccountScreen integration : changement d'email ────────────────────────────

describe("AccountScreen — changement d'email", () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    baseSetup();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  function renderScreen() {
    return render(
      <>
        <AccountScreen />
        <SuccessToastHost />
      </>,
    );
  }

  it("affiche l'email actuel dans la section personal", async () => {
    renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId("account-current-email")).toHaveTextContent(
        CURRENT_EMAIL,
      ),
    );
  });

  it("affiche le bouton Modifier l'email", async () => {
    renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId("account-change-email-button")).toBeTruthy(),
    );
  });

  it("ouvre le formulaire de changement au clic sur Modifier", async () => {
    renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId("account-change-email-button")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("account-change-email-button"));

    expect(screen.getByTestId("account-change-email-input")).toBeTruthy();
  });

  it("ferme le formulaire au clic sur Annuler", async () => {
    renderScreen();

    await waitFor(() =>
      fireEvent.press(screen.getByTestId("account-change-email-button")),
    );

    fireEvent.press(screen.getByTestId("account-cancel-change-email"));

    expect(screen.queryByTestId("account-change-email-input")).toBeNull();
  });

  it("appelle requestEmailChange avec le bon email et ferme le formulaire", async () => {
    api.requestEmailChange.mockResolvedValueOnce({
      success: true,
      message: "Lien envoye.",
    });

    renderScreen();

    await waitFor(() =>
      fireEvent.press(screen.getByTestId("account-change-email-button")),
    );

    fireEvent.changeText(
      screen.getByTestId("account-change-email-input"),
      NEW_EMAIL,
    );
    fireEvent.press(screen.getByTestId("account-submit-change-email"));

    await waitFor(() => {
      expect(api.requestEmailChange).toHaveBeenCalledWith({ email: NEW_EMAIL });
    });

    expect(screen.queryByTestId("account-change-email-input")).toBeNull();
  });

  it("n'affiche pas le bouton Modifier quand l'utilisateur n'a pas d'email", async () => {
    api.getMe.mockResolvedValue({
      firstName: "Marie",
      lastName: "Sans Email",
      gender: "F",
      preferredLocale: "FR",
      email: null,
      phone: "237650000000",
      role: "PARENT",
      activeRole: "PARENT",
      platformRoles: [],
      memberships: [{ schoolId: "school-1", role: "PARENT" }],
      schoolSlug: "college-vogt",
      hasPassword: false,
      hasPhoneCredential: true,
    });

    renderScreen();

    await waitFor(() =>
      expect(screen.queryByTestId("account-change-email-button")).toBeNull(),
    );
    // Le formulaire add-email classique doit être présent
    expect(screen.getByTestId("account-add-email-input")).toBeTruthy();
  });
});

// ── accountApi unit tests ──────────────────────────────────────────────────────

describe("accountApi.requestEmailChange", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("appelle POST /me/request-email-change avec le bon payload", async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, message: "ok" });

    const realApi = jest.requireActual<{ accountApi: typeof accountApi }>(
      "../../src/api/account.api",
    ).accountApi;

    await realApi.requestEmailChange({ email: NEW_EMAIL });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/me/request-email-change",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: NEW_EMAIL }),
      }),
      true,
    );
  });
});

describe("accountApi.linkSsoAccount", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("appelle POST /me/link-sso avec le bon payload", async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true });

    const realApi = jest.requireActual<{ accountApi: typeof accountApi }>(
      "../../src/api/account.api",
    ).accountApi;

    await realApi.linkSsoAccount({
      provider: "GOOGLE",
      providerAccountId: "sub-abc",
      email: CURRENT_EMAIL,
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/me/link-sso",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          provider: "GOOGLE",
          providerAccountId: "sub-abc",
          email: CURRENT_EMAIL,
        }),
      }),
      true,
    );
  });
});
