import { apiFetch } from "./client";
import type { PlatformIndicators } from "../types/platform-indicators.types";

export const platformIndicatorsApi = {
  getIndicators(): Promise<PlatformIndicators> {
    return apiFetch("/system/indicators", {}, true);
  },
};
