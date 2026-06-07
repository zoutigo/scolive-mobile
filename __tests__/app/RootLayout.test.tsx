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
      updateAvailable: false,
      mandatory: false,
      latestVersionName: null,
      latestVersionCode: null,
      currentVersionName: "1.0.0",
      currentVersionCode: 10,
      downloadUrl: "",
      dismiss: jest.fn(),
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
      updateAvailable: true,
      mandatory: false,
      latestVersionName: "1.1.0",
      latestVersionCode: 11,
      currentVersionName: "1.0.0",
      currentVersionCode: 10,
      downloadUrl: "https://downloads.example.com/scolive.apk",
      dismiss: jest.fn(),
    });

    render(<RootLayout />);
    fireEvent.press(screen.getByTestId("root-update-download"));

    expect(Linking.openURL).toHaveBeenCalledWith(
      "https://downloads.example.com/scolive.apk",
    );
    expect(screen.getByTestId("root-install-guide")).toBeTruthy();
  });

  it("relaye l'action dismiss du hook vers la modale de mise à jour", () => {
    const dismiss = jest.fn();

    mockUseAppVersionCheck.mockReturnValue({
      updateAvailable: true,
      mandatory: false,
      latestVersionName: "1.1.0",
      latestVersionCode: 11,
      currentVersionName: "1.0.0",
      currentVersionCode: 10,
      downloadUrl: "https://downloads.example.com/scolive.apk",
      dismiss,
    });

    render(<RootLayout />);
    fireEvent.press(screen.getByTestId("root-update-dismiss"));

    expect(dismiss).toHaveBeenCalledTimes(1);
  });
});
