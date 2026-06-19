import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Application from "expo-application";
import { mobileBuildsApi } from "../api/mobile-builds.api";

const CHECK_TIMEOUT_MS = 8000;

export type AppVersionCheckStatus = "checking" | "ready" | "error";

export interface AppVersionCheckResult {
  status: AppVersionCheckStatus;
  updateAvailable: boolean;
  mandatory: boolean;
  latestVersionName: string | null;
  latestVersionCode: number | null;
  currentVersionName: string | null;
  currentVersionCode: number | null;
  downloadUrl: string;
  dismiss: () => void;
  retry: () => void;
}

function timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("APP_VERSION_CHECK_TIMEOUT")), ms);
  });
}

export function useAppVersionCheck(): AppVersionCheckResult {
  // Sur les plateformes non gérées (iOS), aucune vérification n'existe encore :
  // on ne bloque jamais l'app dans ce cas, faute de mécanisme côté backend.
  const [status, setStatus] = useState<AppVersionCheckStatus>(
    Platform.OS === "android" ? "checking" : "ready",
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [mandatory, setMandatory] = useState(false);
  const [latestVersionName, setLatestVersionName] = useState<string | null>(
    null,
  );
  const [latestVersionCode, setLatestVersionCode] = useState<number | null>(
    null,
  );
  const [downloadUrl, setDownloadUrl] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const currentVersionName = Application.nativeApplicationVersion ?? null;
  const currentVersionCode = Application.nativeBuildVersion
    ? parseInt(Application.nativeBuildVersion, 10)
    : null;

  useEffect(() => {
    if (Platform.OS !== "android") return;

    let cancelled = false;
    setStatus("checking");

    async function check() {
      try {
        const meta = await Promise.race([
          mobileBuildsApi.getLatestAndroidBuildMeta(),
          timeout(CHECK_TIMEOUT_MS),
        ]);

        if (cancelled) return;

        const latestCode = Number(meta.versionCode);

        if (Number.isFinite(latestCode) && currentVersionCode !== null) {
          if (latestCode > currentVersionCode) {
            const isMandatory =
              meta.minimumVersionCode !== undefined &&
              meta.minimumVersionCode > currentVersionCode;

            setLatestVersionName(meta.versionName);
            setLatestVersionCode(latestCode);
            setDownloadUrl(
              meta.downloadUrl ?? mobileBuildsApi.getLatestAndroidDownloadUrl(),
            );
            setMandatory(isMandatory);
            setUpdateAvailable(true);
          }
        }

        setStatus("ready");
      } catch {
        // Contrairement à avant, on ne fait plus disparaître silencieusement
        // l'échec : sans confirmation que la version est à jour, on bloque.
        if (!cancelled) setStatus("error");
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, [currentVersionCode, attempt]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  return {
    status,
    updateAvailable: updateAvailable && (!dismissed || mandatory),
    mandatory,
    latestVersionName,
    latestVersionCode,
    currentVersionName,
    currentVersionCode,
    downloadUrl,
    dismiss,
    retry,
  };
}
