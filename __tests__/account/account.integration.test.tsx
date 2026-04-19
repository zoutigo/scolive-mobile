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

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/account.api");
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));
jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
  useDrawer: () => ({ openDrawer: jest.fn(), closeDrawer: jest.fn() }),
}));

const api = accountApi as jest.Mocked<typeof accountApi>;
let consoleErrorSpy: jest.SpyInstance | undefined;
let consoleWarnSpy: jest.SpyInstance | undefined;

describe("account integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    useSuccessToastStore.getState().hide();
    useAuthStore.setState({
      user: {
        id: "user-1",
        firstName: "Remi",
        lastName: "Ntamack",
        email: "remi@example.com",
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
      email: "remi@example.com",
      phone: "237650123456",
      role: "PARENT",
      activeRole: "PARENT",
      platformRoles: [],
      memberships: [
        { schoolId: "school-1", role: "PARENT" },
        { schoolId: "school-1", role: "TEACHER" },
      ],
      schoolSlug: "college-vogt",
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
    api.setActiveRole.mockResolvedValue({ activeRole: "TEACHER" });
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    consoleWarnSpy?.mockRestore();
  });

  it("synchronise le store auth et affiche un toast après mise à jour du profil", async () => {
    api.updateProfile.mockResolvedValueOnce({
      firstName: "Robert",
      lastName: "Ntamack",
      gender: "M",
      email: "remi@example.com",
      phone: "237699000111",
      role: "PARENT",
      schoolSlug: "college-vogt",
    });

    render(
      <>
        <AccountScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-edit-personal"));
    fireEvent.changeText(
      screen.getByTestId("account-first-name-input"),
      "Robert",
    );
    fireEvent.changeText(
      screen.getByTestId("account-phone-input"),
      "699000111",
    );
    fireEvent.press(screen.getByTestId("account-save-personal"));

    await waitFor(() => {
      expect(api.updateProfile).toHaveBeenCalledWith({
        firstName: "Robert",
        lastName: "Ntamack",
        gender: "M",
        phone: "699000111",
      });
    });

    expect(screen.getByText("Profil mis à jour")).toBeTruthy();
    expect(screen.getByText("Robert")).toBeTruthy();
    expect(screen.getByText("699000111")).toBeTruthy();
  });

  it("affiche un toast d'erreur si le changement de PIN échoue", async () => {
    api.changePin.mockRejectedValueOnce({
      message: "PIN actuel invalide.",
      statusCode: 400,
    });

    render(
      <>
        <AccountScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-security"));
    fireEvent.press(screen.getByTestId("account-pin-section-toggle"));
    fireEvent.changeText(
      screen.getByTestId("account-current-pin-input"),
      "123456",
    );
    fireEvent.changeText(screen.getByTestId("account-new-pin-input"), "654321");
    fireEvent.changeText(
      screen.getByTestId("account-confirm-pin-input"),
      "654321",
    );
    fireEvent.press(screen.getByTestId("account-save-pin"));

    await waitFor(() => {
      expect(screen.getByTestId("success-toast-card")).toBeTruthy();
    });

    expect(screen.getByText("Modification impossible")).toBeTruthy();
    expect(screen.getAllByText("PIN actuel invalide.").length).toBeGreaterThan(
      0,
    );
  });

  it("met à jour le profil actif et affiche un toast de confirmation", async () => {
    render(
      <>
        <AccountScreen />
        <SuccessToastHost />
      </>,
    );

    await waitFor(() => {
      expect(api.getMe).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId("account-tab-settings"));
    fireEvent.press(screen.getByTestId("account-active-role-TEACHER"));
    fireEvent.press(screen.getByTestId("account-save-active-role"));

    await waitFor(() => {
      expect(api.setActiveRole).toHaveBeenCalledWith({ role: "TEACHER" });
    });

    expect(screen.getByText("Profil actif mis à jour")).toBeTruthy();
    expect(
      screen.getByText("Enseignant(e) est maintenant actif."),
    ).toBeTruthy();
  });
});
