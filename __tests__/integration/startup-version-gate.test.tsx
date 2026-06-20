/**
 * Test fonctionnel : reproduit le bug initial (des utilisateurs avec une
 * version obsolète parvenaient à se connecter) et vérifie qu'il est corrigé.
 *
 * Contrairement à __tests__/app/RootLayout.test.tsx (qui mocke
 * useAppVersionCheck), ce fichier utilise le VRAI hook avec une fausse
 * réponse réseau, pour valider le comportement de bout en bout :
 * RootLayout + useAppVersionCheck + AppUpdateModal.
 */
import React from "react";
import { Platform } from "react-native";
import { render, screen, waitFor, act } from "@testing-library/react-native";
import RootLayout from "../../app/_layout";
import { useAuthStore } from "../../src/store/auth.store";
import { mobileBuildsApi } from "../../src/api/mobile-builds.api";
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

  return { useAuthStore: mockUseAuthStore };
});

jest.mock("../../src/notifications/push-registration", () => ({
  configurePushNotifications: jest.fn(),
}));

jest.mock("../../src/components/feedback/SuccessToastHost", () => ({
  SuccessToastHost: () => null,
}));

jest.mock("../../src/components/AppInstallGuideModal", () => ({
  AppInstallGuideModal: () => null,
}));

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("../../src/api/mobile-builds.api", () => ({
  mobileBuildsApi: {
    getLatestAndroidBuildMeta: jest.fn(),
    getLatestAndroidDownloadUrl: jest.fn(() => "http://api/download"),
  },
}));

jest.mock("expo-application", () => ({
  nativeApplicationVersion: "1.0.0",
  nativeBuildVersion: "10",
}));

const mockGetMeta =
  mobileBuildsApi.getLatestAndroidBuildMeta as jest.MockedFunction<
    typeof mobileBuildsApi.getLatestAndroidBuildMeta
  >;
const mockUseAuthStoreGetState = jest.mocked(useAuthStore.getState);
const originalDev = __DEV__;

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, "OS", { value: "android", writable: true });
  // Le check de version est désactivé en __DEV__ : ce fichier simule un build de production.
  (global as unknown as { __DEV__: boolean }).__DEV__ = false;
  mockUseAuthStoreGetState.mockReturnValue({
    initialize: jest.fn().mockResolvedValue(undefined),
  } as never);
});

afterEach(() => {
  (global as unknown as { __DEV__: boolean }).__DEV__ = originalDev;
});

describe("Gate de démarrage — scénario réel ayant causé le bug", () => {
  it("ne monte jamais l'écran de login tant que le check réseau est en attente", async () => {
    let resolveCheck!: (value: Awaited<ReturnType<typeof mockGetMeta>>) => void;
    mockGetMeta.mockReturnValue(
      new Promise((resolve) => {
        resolveCheck = resolve;
      }),
    );

    render(<RootLayout />);

    // Avant résolution réseau : aucun écran interactif, donc aucun login possible.
    expect(screen.getByTestId("startup-checking")).toBeTruthy();
    expect(screen.queryByText("login")).toBeNull();
    expect(screen.queryByText("index")).toBeNull();

    await act(async () => {
      resolveCheck({
        versionName: "1.0.0",
        versionCode: 10,
        uploadedAt: "2026-01-01T00:00:00Z",
        fileSize: 1000,
        mimeType: "application/vnd.android.package-archive",
      });
    });

    await waitFor(() => {
      expect(screen.queryByTestId("startup-checking")).toBeNull();
    });

    expect(screen.getByText("login")).toBeTruthy();
  });

  it("bloque avec la modale mandatory dès que le check révèle une version obsolète", async () => {
    mockGetMeta.mockResolvedValueOnce({
      versionName: "2.0.0",
      versionCode: 20,
      minimumVersionCode: 20,
      uploadedAt: "2026-01-01T00:00:00Z",
      fileSize: 1000,
      mimeType: "application/vnd.android.package-archive",
    });

    render(<RootLayout />);

    await waitFor(() => {
      expect(screen.getByTestId("app-update-card")).toBeTruthy();
    });

    expect(screen.getByTestId("app-update-badge")).toHaveTextContent(
      "Mise à jour obligatoire",
    );
    // Pas de bouton "Plus tard" en mode mandatory : aucune échappatoire.
    expect(screen.queryByTestId("app-update-dismiss")).toBeNull();
  });

  it("affiche un écran bloquant avec retry si le réseau échoue, au lieu de laisser entrer l'utilisateur", async () => {
    mockGetMeta.mockRejectedValueOnce(new Error("Network error"));

    render(<RootLayout />);

    await waitFor(() => {
      expect(screen.getByTestId("startup-error")).toBeTruthy();
    });

    expect(screen.queryByText("login")).toBeNull();
  });

  it("initialise quand même l'auth store et les notifications push dès le montage, même pendant le check", () => {
    mockGetMeta.mockReturnValue(new Promise(() => {}));
    const initialize = jest.fn().mockResolvedValue(undefined);
    mockUseAuthStoreGetState.mockReturnValue({ initialize } as never);

    render(<RootLayout />);

    expect(initialize).toHaveBeenCalledTimes(1);
    expect(configurePushNotifications).toHaveBeenCalledTimes(1);
  });
});
