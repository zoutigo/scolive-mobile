import { BASE_URL, apiFetch } from "./client";

export type AndroidBuildMeta = {
  versionName: string;
  versionCode: number;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
  gitSha?: string;
  buildId?: string;
  downloadUrl?: string;
};

export const mobileBuildsApi = {
  getLatestAndroidBuildMeta(): Promise<AndroidBuildMeta> {
    return apiFetch("/mobile-builds/android/latest/meta");
  },

  getLatestAndroidDownloadUrl() {
    return `${BASE_URL}/mobile-builds/android/latest`;
  },
};
