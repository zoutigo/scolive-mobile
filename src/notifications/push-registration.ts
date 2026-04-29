import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { authApi, mobilePushPlatform } from "../api/auth.api";

const PUSH_TOKEN_KEY = "scolive_push_token";
let notificationsConfigured = false;

export function configurePushNotifications() {
  if (notificationsConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  notificationsConfigured = true;
}

async function getStoredPushToken() {
  return SecureStore.getItemAsync(PUSH_TOKEN_KEY);
}

async function setStoredPushToken(token: string) {
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}

async function clearStoredPushToken() {
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}

function resolveProjectId() {
  return (
    process.env.EXPO_PUBLIC_EXPO_PROJECT_ID ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  );
}

async function ensureExpoPushToken() {
  configurePushNotifications();

  if (!Device.isDevice) {
    return null;
  }

  const permissions = await Notifications.getPermissionsAsync();
  let status = permissions.status;

  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== "granted") {
    return null;
  }

  if (Device.osName === "Android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const projectId = resolveProjectId();
  if (!projectId) {
    return null;
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId,
    })
  ).data;

  return { token, projectId };
}

export async function syncPushRegistration(schoolSlug: string) {
  const registration = await ensureExpoPushToken();
  if (!registration) {
    return;
  }

  const currentStoredToken = await getStoredPushToken();
  if (currentStoredToken === registration.token) {
    await authApi.registerPushToken(schoolSlug, {
      token: registration.token,
      platform: mobilePushPlatform(),
      deviceName: Device.deviceName ?? undefined,
      appVersion: Constants.expoConfig?.version ?? undefined,
      projectId: registration.projectId,
    });
    return;
  }

  await authApi.registerPushToken(schoolSlug, {
    token: registration.token,
    platform: mobilePushPlatform(),
    deviceId: Device.osInternalBuildId ?? undefined,
    deviceName: Device.deviceName ?? undefined,
    appVersion: Constants.expoConfig?.version ?? undefined,
    projectId: registration.projectId,
  });
  await setStoredPushToken(registration.token);
}

export async function unregisterPushRegistration(schoolSlug: string | null) {
  const token = await getStoredPushToken();
  if (!schoolSlug || !token) {
    await clearStoredPushToken();
    return;
  }

  await authApi.unregisterPushToken(schoolSlug, token).catch(() => {});
  await clearStoredPushToken();
}
