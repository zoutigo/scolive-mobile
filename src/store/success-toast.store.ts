import { create } from "zustand";

export const SUCCESS_TOAST_DURATION_MS = 7000;

export type FeedbackToastVariant = "success" | "error";

export type SuccessToastPayload = {
  variant?: FeedbackToastVariant;
  title: string;
  message: string;
};

interface SuccessToastState {
  visible: boolean;
  variant: FeedbackToastVariant;
  title: string;
  message: string;
  show: (payload: SuccessToastPayload) => void;
  showSuccess: (payload: Omit<SuccessToastPayload, "variant">) => void;
  showError: (payload: Omit<SuccessToastPayload, "variant">) => void;
  hide: () => void;
}

export const useSuccessToastStore = create<SuccessToastState>((set) => ({
  visible: false,
  variant: "success",
  title: "",
  message: "",
  show: ({ variant = "success", title, message }) =>
    set({
      visible: true,
      variant,
      title,
      message,
    }),
  showSuccess: ({ title, message }) =>
    set({
      visible: true,
      variant: "success",
      title,
      message,
    }),
  showError: ({ title, message }) =>
    set({
      visible: true,
      variant: "error",
      title,
      message,
    }),
  hide: () =>
    set({
      visible: false,
      variant: "success",
      title: "",
      message: "",
    }),
}));
