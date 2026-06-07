import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Application from "expo-application";
import { mobileBuildsApi } from "../api/mobile-builds.api";

export interface AppVersionCheckResult {
  updateAvailable: boolean;
  mandatory: boolean;
  latestVersionName: string | null;
  latestVersionCode: number | null;
  currentVersionName: string | null;
  currentVersionCode: number | null;
  downloadUrl: string;
  dismiss: () => void;
}

export function useAppVersionCheck(): AppVersionCheckResult {
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

  const currentVersionName = Application.nativeApplicationVersion ?? null;
  const currentVersionCode = Application.nativeBuildVersion
    ? parseInt(Application.nativeBuildVersion, 10)
    : null;

  useEffect(() => {
    if (Platform.OS !== "android") return;

    let cancelled = false;

    async function check() {
      try {
        const meta = await mobileBuildsApi.getLatestAndroidBuildMeta();
        const latestCode = Number(meta.versionCode);

        if (
          !Number.isFinite(latestCode) ||
          currentVersionCode === null ||
          latestCode <= currentVersionCode
        ) {
          return;
        }

        if (!cancelled) {
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
      } catch {
        // La vérification de version ne doit jamais interrompre le flux de l'app.
      }
    }

    void check();

    return () => {
      cancelled = true;
    };
  }, [currentVersionCode]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    updateAvailable: updateAvailable && (!dismissed || mandatory),
    mandatory,
    latestVersionName,
    latestVersionCode,
    currentVersionName,
    currentVersionCode,
    downloadUrl,
    dismiss,
  };
}
