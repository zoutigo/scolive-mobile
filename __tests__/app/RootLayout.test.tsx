import React from "react";
import { Linking } from "react-native";
import {
  render,
  fireEvent,
  screen,
  waitFor,
} from "@testing-library/react-native";
import RootLayout from "../../app/_layout";
import { useAuthStore } from "../../src/store/auth.store";
import { useAppVersionCheck } from "../../src/hooks/useAppVersionCheck";
import { configurePushNotifications } from "../../src/notifications/push-registration";

jest.mock("expo-router", () => {
  const { Text } = require("react-native");
  const Stack = Object.assign(
    ({ children }: { children: React.ReactNode }) => <>{children}</>,
    {
      Screen: ({ name }: { name: string }) => <Text>{name}</Text>,
    },
  );

  return { Stack };
});

jest.mock("../../src/store/auth.store", () => {
  const mockUseAuthStore = Object.assign(jest.fn(), {
    getState: jest.fn(),
  });

  return {
    useAuthStore: mockUseAuthStore,
  };
});

jest.mock("../../src/hooks/useAppVersionCheck", () => ({
  useAppVersionCheck: jest.fn(),
}));

jest.mock("../../src/notifications/push-registration", () => ({
  configurePushNotifications: jest.fn(),
}));

jest.mock("../../src/components/feedback/SuccessToastHost", () => ({
  SuccessToastHost: () => null,
}));

jest.mock("../../src/components/AppUpdateModal", () => ({
  AppUpdateModal: ({
    visible,
    onDismiss,
    onDownload,
  }: {
    visible: boolean;
    onDismiss: () => void;
    onDownload: () => void;
  }) => {
    const { Pressable, Text } = require("react-native");

    return visible ? (
      <>
        <Pressable testID="root-update-download" onPress={onDownload}>
          <Text>download</Text>
        </Pressable>
        <Pressable testID="root-update-dismiss" onPress={onDismiss}>
          <Text>dismiss</Text>
        </Pressable>
      </>
    ) : null;
  },
}));

jest.mock("../../src/components/AppInstallGuideModal", () => ({
  AppInstallGuideModal: ({
    visible,
    onClose,
  }: {
    visible: boolean;
    onClose: () => void;
  }) => {
    const { Pressable, Text } = require("react-native");

    return visible ? (
      <Pressable testID="root-install-guide" onPress={onClose}>
        <Text>install-guide</Text>
      </Pressable>
    ) : null;
  },
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockUseAuthStoreGetState = jest.mocked(useAuthStore.getState);
const mockUseAppVersionCheck = useAppVersionCheck as jest.MockedFunction<
  typeof useAppVersionCheck
>;
const mockConfigurePushNotifications =
  configurePushNotifications as jest.MockedFunction<
    typeof configurePushNotifications
  >;

describe("RootLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStoreGetState.mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
    } as never);
    mockUseAppVersionCheck.mockReturnValue({
      status: "ready",
      updateAvailable: false,
      mandatory: false,
      latestVersionName: null,
      latestVersionCode: null,
      currentVersionName: "1.0.0",
      currentVersionCode: 10,
      downloadUrl: "",
      dismiss: jest.fn(),
      retry: jest.fn(),
    });
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("initialise l'application une seule fois même si RootLayout rerender", async () => {
    const firstInitialize = jest.fn().mockResolvedValue(undefined);
    mockUseAuthStoreGetState.mockReturnValue({
      initialize: firstInitialize,
    } as never);

    const { rerender } = render(<RootLayout />);
    rerender(<RootLayout />);

    await waitFor(() => {
      expect(firstInitialize).toHaveBeenCalledTimes(1);
    });

    expect(mockUseAuthStore).not.toHaveBeenCalled();
    expect(mockUseAuthStoreGetState).toHaveBeenCalledTimes(1);
    expect(mockConfigurePushNotifications).toHaveBeenCalledTimes(1);
  });

  it("ouvre l'URL de téléchargement et affiche le guide d'installation", () => {
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

    mockUseAppVersionCheck.mockReturnValue({
      status: "ready",
      updateAvailable: true,
      mandatory: false,
      latestVersionName: "1.1.0",
      latestVersionCode: 11,
      currentVersionName: "1.0.0",
      currentVersionCode: 10,
      downloadUrl: "https://downloads.example.com/scolive.apk",
      dismiss: jest.fn(),
      retry: jest.fn(),
    });

    render(<RootLayout />);
    fireEvent.press(screen.getByTestId("root-update-download"));

    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://downloads.example.com/scolive.apk",
    );
    expect(screen.getByTestId("root-install-guide")).toBeTruthy();
  });

  it("en mode mandatory, télécharge l'APK directement et affiche le guide d'installation (pas de redirection web)", () => {
    (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

    mockUseAppVersionCheck.mockReturnValue({
      status: "ready",
      updateAvailable: true,
      mandatory: true,
      latestVersionName: "2.0.0",
      latestVersionCode: 20,
      currentVersionName: "1.0.0",
      currentVersionCode: 10,
      downloadUrl: "https://downloads.example.com/scolive.apk",
      dismiss: jest.fn(),
      retry: jest.fn(),
    });

    render(<RootLayout />);
    fireEvent.press(screen.getByTestId("root-update-download"));

    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://downloads.example.com/scolive.apk",
    );
    expect(Linking.openURL).not.toHaveBeenCalledWith(
      "https://scolive.lisaweb.fr",
    );
    expect(screen.getByTestId("root-install-guide")).toBeTruthy();
  });

  it("relaye l'action dismiss du hook vers la modale de mise à jour", () => {
    const dismiss = jest.fn();

    mockUseAppVersionCheck.mockReturnValue({
      status: "ready",
      updateAvailable: true,
      mandatory: false,
      latestVersionName: "1.1.0",
      latestVersionCode: 11,
      currentVersionName: "1.0.0",
      currentVersionCode: 10,
      downloadUrl: "https://downloads.example.com/scolive.apk",
      dismiss,
      retry: jest.fn(),
    });

    render(<RootLayout />);
    fireEvent.press(screen.getByTestId("root-update-dismiss"));

    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});

// ── Gate de démarrage — élimine la course check-de-version / login ───────────

describe("RootLayout — gate de démarrage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStoreGetState.mockReturnValue({
      initialize: jest.fn().mockResolvedValue(undefined),
    } as never);
  });

  it("n'affiche ni le Stack (login inclus) ni les modales tant que status='checking'", () => {
    mockUseAppVersionCheck.mockReturnValue({
      status: "checking",
      updateAvailable: false,
      mandatory: false,
      latestVersionName: null,
      latestVersionCode: null,
      currentVersionName: null,
      currentVersionCode: null,
      downloadUrl: "",
      dismiss: jest.fn(),
      retry: jest.fn(),
    });

    render(<RootLayout />);

    expect(screen.getByTestId("startup-checking")).toBeTruthy();
    expect(screen.queryByText("login")).toBeNull();
    expect(screen.queryByText("index")).toBeNull();
  });

  it("affiche un écran de blocage avec retry si status='error', sans monter le Stack", () => {
    const retry = jest.fn();
    mockUseAppVersionCheck.mockReturnValue({
      status: "error",
      updateAvailable: false,
      mandatory: false,
      latestVersionName: null,
      latestVersionCode: null,
      currentVersionName: null,
      currentVersionCode: null,
      downloadUrl: "",
      dismiss: jest.fn(),
      retry,
    });

    render(<RootLayout />);

    expect(screen.getByTestId("startup-error")).toBeTruthy();
    expect(screen.queryByText("login")).toBeNull();

    fireEvent.press(screen.getByTestId("startup-error-retry"));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("affiche le Stack normalement une fois status='ready'", () => {
    mockUseAppVersionCheck.mockReturnValue({
      status: "ready",
      updateAvailable: false,
      mandatory: false,
      latestVersionName: null,
      latestVersionCode: null,
      currentVersionName: "1.0.0",
      currentVersionCode: 10,
      downloadUrl: "",
      dismiss: jest.fn(),
      retry: jest.fn(),
    });

    render(<RootLayout />);

    expect(screen.queryByTestId("startup-checking")).toBeNull();
    expect(screen.queryByTestId("startup-error")).toBeNull();
    expect(screen.getByText("login")).toBeTruthy();
  });

  it("bloque même si une mise à jour mandatory est détectée pendant 'checking' (pas de fenêtre de login possible)", () => {
    // Le scénario qui causait le bug initial : un check encore en cours ne doit
    // jamais laisser un écran interactif apparaître, y compris transitoirement.
    mockUseAppVersionCheck.mockReturnValue({
      status: "checking",
      updateAvailable: false,
      mandatory: false,
      latestVersionName: null,
      latestVersionCode: null,
      currentVersionName: null,
      currentVersionCode: null,
      downloadUrl: "",
      dismiss: jest.fn(),
      retry: jest.fn(),
    });

    render(<RootLayout />);

    expect(screen.queryByTestId("root-update-download")).toBeNull();
    expect(screen.queryByTestId("root-update-dismiss")).toBeNull();
    expect(screen.getByTestId("startup-checking")).toBeTruthy();
  });
});
