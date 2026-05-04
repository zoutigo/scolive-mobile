import { renderHook, waitFor, act } from "@testing-library/react-native";
import { Platform } from "react-native";
import { useAppVersionCheck } from "../../src/hooks/useAppVersionCheck";
import { mobileBuildsApi } from "../../src/api/mobile-builds.api";

jest.mock("../../src/api/mobile-builds.api", () => ({
  mobileBuildsApi: {
    getLatestAndroidBuildMeta: jest.fn(),
    getLatestAndroidDownloadUrl: jest.fn(
      () => "http://api/mobile-builds/android/latest",
    ),
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

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(Platform, "OS", { value: "android", writable: true });
});

// ── Aucune mise à jour ────────────────────────────────────────────────────────

describe("Pas de mise à jour", () => {
  it("retourne updateAvailable=false si le serveur a le même versionCode", async () => {
    mockGetMeta.mockResolvedValueOnce({
      versionName: "1.0.0",
      versionCode: 10,
      uploadedAt: "2026-01-01T00:00:00Z",
      fileSize: 1000,
      mimeType: "application/vnd.android.package-archive",
    });

    const { result } = renderHook(() => useAppVersionCheck());

    await waitFor(() => {
      expect(mockGetMeta).toHaveBeenCalledTimes(1);
    });

    expect(result.current.updateAvailable).toBe(false);
  });

  it("retourne updateAvailable=false si le serveur a un versionCode inférieur", async () => {
    mockGetMeta.mockResolvedValueOnce({
      versionName: "0.9.0",
      versionCode: 5,
      uploadedAt: "2026-01-01T00:00:00Z",
      fileSize: 1000,
      mimeType: "application/vnd.android.package-archive",
    });

    const { result } = renderHook(() => useAppVersionCheck());

    await waitFor(() => {
      expect(mockGetMeta).toHaveBeenCalledTimes(1);
    });

    expect(result.current.updateAvailable).toBe(false);
  });

  it("ne fait pas d'appel API sur iOS", async () => {
    Object.defineProperty(Platform, "OS", { value: "ios", writable: true });

    const { result } = renderHook(() => useAppVersionCheck());

    await act(async () => {});

    expect(mockGetMeta).not.toHaveBeenCalled();
    expect(result.current.updateAvailable).toBe(false);
  });
});

// ── Mise à jour disponible ────────────────────────────────────────────────────

describe("Mise à jour disponible", () => {
  it("retourne updateAvailable=true si le serveur a un versionCode supérieur", async () => {
    mockGetMeta.mockResolvedValueOnce({
      versionName: "1.1.0",
      versionCode: 11,
      uploadedAt: "2026-01-01T00:00:00Z",
      fileSize: 2000,
      mimeType: "application/vnd.android.package-archive",
    });

    const { result } = renderHook(() => useAppVersionCheck());

    await waitFor(() => {
      expect(result.current.updateAvailable).toBe(true);
    });

    expect(result.current.latestVersionName).toBe("1.1.0");
    expect(result.current.latestVersionCode).toBe(11);
  });

  it("expose l'URL de téléchargement depuis downloadUrl du meta", async () => {
    mockGetMeta.mockResolvedValueOnce({
      versionName: "2.0.0",
      versionCode: 20,
      uploadedAt: "2026-01-01T00:00:00Z",
      fileSize: 3000,
      mimeType: "application/vnd.android.package-archive",
      downloadUrl: "https://cdn.example.com/scolive-2.0.0.apk",
    });

    const { result } = renderHook(() => useAppVersionCheck());

    await waitFor(() => {
      expect(result.current.updateAvailable).toBe(true);
    });

    expect(result.current.downloadUrl).toBe(
      "https://cdn.example.com/scolive-2.0.0.apk",
    );
  });

  it("utilise l'URL par défaut si downloadUrl est absent du meta", async () => {
    mockGetMeta.mockResolvedValueOnce({
      versionName: "1.1.0",
      versionCode: 11,
      uploadedAt: "2026-01-01T00:00:00Z",
      fileSize: 2000,
      mimeType: "application/vnd.android.package-archive",
    });

    const { result } = renderHook(() => useAppVersionCheck());

    await waitFor(() => {
      expect(result.current.updateAvailable).toBe(true);
    });

    expect(result.current.downloadUrl).toBe(
      "http://api/mobile-builds/android/latest",
    );
  });
});

// ── Versions actuelles ────────────────────────────────────────────────────────

describe("Versions actuelles", () => {
  it("expose la version installée depuis expo-application", async () => {
    mockGetMeta.mockResolvedValueOnce({
      versionName: "1.0.0",
      versionCode: 10,
      uploadedAt: "2026-01-01T00:00:00Z",
      fileSize: 1000,
      mimeType: "application/vnd.android.package-archive",
    });

    const { result } = renderHook(() => useAppVersionCheck());

    await waitFor(() => {
      expect(mockGetMeta).toHaveBeenCalledTimes(1);
    });

    expect(result.current.currentVersionName).toBe("1.0.0");
    expect(result.current.currentVersionCode).toBe(10);
  });
});

// ── Dismiss ───────────────────────────────────────────────────────────────────

describe("Dismiss", () => {
  it("updateAvailable passe à false après dismiss()", async () => {
    mockGetMeta.mockResolvedValueOnce({
      versionName: "1.1.0",
      versionCode: 11,
      uploadedAt: "2026-01-01T00:00:00Z",
      fileSize: 2000,
      mimeType: "application/vnd.android.package-archive",
    });

    const { result } = renderHook(() => useAppVersionCheck());

    await waitFor(() => {
      expect(result.current.updateAvailable).toBe(true);
    });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.updateAvailable).toBe(false);
  });
});

// ── Résilience aux erreurs ────────────────────────────────────────────────────

describe("Résilience aux erreurs", () => {
  it("ne propage pas l'erreur si l'API échoue", async () => {
    mockGetMeta.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useAppVersionCheck());

    await act(async () => {});

    expect(result.current.updateAvailable).toBe(false);
    expect(result.current.latestVersionName).toBeNull();
  });
});
