// Préfixe "mock" requis pour être accessible dans les factories jest.mock hoistées
let mockAppOwnership: string | null = null;

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    get appOwnership() {
      return mockAppOwnership;
    },
    expoConfig: {
      version: "1.0.0",
      extra: { eas: { projectId: "proj-123" } },
    },
    easConfig: null,
  },
}));

jest.mock("expo-device", () => ({
  isDevice: true,
  osName: "Android",
  osInternalBuildId: "build-123",
  deviceName: "Pixel 6",
}));

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  AndroidImportance: { MAX: 5 },
}));

jest.mock("../../src/api/auth.api", () => ({
  authApi: {
    registerPushToken: jest.fn(),
    unregisterPushToken: jest.fn(),
  },
  mobilePushPlatform: jest.fn(() => "android"),
}));

import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { authApi } from "../../src/api/auth.api";
import {
  syncPushRegistration,
  unregisterPushRegistration,
} from "../../src/notifications/push-registration";

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;
const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;
const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

beforeEach(() => {
  jest.clearAllMocks();
  mockAppOwnership = null;
});

// --- configurePushNotifications ---
// Ces tests utilisent jest.isolateModules pour obtenir un état module frais
// (notificationsConfigured = false) à chaque fois.

describe("configurePushNotifications — Expo Go", () => {
  it("ne configure pas le handler dans Expo Go", () => {
    jest.isolateModules(() => {
      mockAppOwnership = "expo";
      const n = require("expo-notifications");
      const {
        configurePushNotifications,
      } = require("../../src/notifications/push-registration");
      configurePushNotifications();
      expect(n.setNotificationHandler).not.toHaveBeenCalled();
    });
  });
});

describe("configurePushNotifications — build natif", () => {
  it("configure le handler dans un build natif", () => {
    jest.isolateModules(() => {
      mockAppOwnership = null;
      const n = require("expo-notifications");
      const {
        configurePushNotifications,
      } = require("../../src/notifications/push-registration");
      configurePushNotifications();
      expect(n.setNotificationHandler).toHaveBeenCalledTimes(1);
    });
  });

  it("ne configure qu'une seule fois même si appelé plusieurs fois", () => {
    jest.isolateModules(() => {
      mockAppOwnership = null;
      const n = require("expo-notifications");
      const {
        configurePushNotifications,
      } = require("../../src/notifications/push-registration");
      configurePushNotifications();
      configurePushNotifications();
      expect(n.setNotificationHandler).toHaveBeenCalledTimes(1);
    });
  });
});

// --- syncPushRegistration ---
// Les tests ci-dessous utilisent les imports statiques.
// configurePushNotifications() est appelé en interne mais notificationsConfigured
// peut être true ; cela ne change pas le comportement de syncPushRegistration.

describe("syncPushRegistration — Expo Go", () => {
  it("ne tente pas de récupérer un token dans Expo Go", async () => {
    mockAppOwnership = "expo";
    await syncPushRegistration("ecole-test");
    expect(mockNotifications.getPermissionsAsync).not.toHaveBeenCalled();
    expect(mockNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(mockAuthApi.registerPushToken).not.toHaveBeenCalled();
  });
});

describe("syncPushRegistration — build natif", () => {
  it("enregistre le token si les permissions sont accordées", async () => {
    mockAppOwnership = null;
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: "granted",
    } as never);
    mockNotifications.setNotificationChannelAsync.mockResolvedValue(
      null as never,
    );
    mockNotifications.getExpoPushTokenAsync.mockResolvedValue({
      data: "ExponentPushToken[test-token]",
      type: "expo",
    });
    mockSecureStore.getItemAsync.mockResolvedValue(null);
    mockAuthApi.registerPushToken.mockResolvedValue(undefined as never);

    await syncPushRegistration("ecole-test");

    expect(mockAuthApi.registerPushToken).toHaveBeenCalledWith(
      "ecole-test",
      expect.objectContaining({
        token: "ExponentPushToken[test-token]",
        platform: "android",
      }),
    );
  });

  it("ne fait rien si les permissions sont refusées", async () => {
    mockAppOwnership = null;
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      status: "denied",
    } as never);
    mockNotifications.requestPermissionsAsync.mockResolvedValue({
      status: "denied",
    } as never);

    await syncPushRegistration("ecole-test");

    expect(mockAuthApi.registerPushToken).not.toHaveBeenCalled();
  });
});

describe("unregisterPushRegistration", () => {
  it("supprime le token stocké et notifie l'API", async () => {
    mockSecureStore.getItemAsync.mockResolvedValue("ExponentPushToken[stored]");
    mockAuthApi.unregisterPushToken.mockResolvedValue(undefined as never);

    await unregisterPushRegistration("ecole-test");

    expect(mockAuthApi.unregisterPushToken).toHaveBeenCalledWith(
      "ecole-test",
      "ExponentPushToken[stored]",
    );
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it("efface le store local si schoolSlug est null", async () => {
    mockSecureStore.getItemAsync.mockResolvedValue("ExponentPushToken[stored]");

    await unregisterPushRegistration(null);

    expect(mockAuthApi.unregisterPushToken).not.toHaveBeenCalled();
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalled();
  });
});
