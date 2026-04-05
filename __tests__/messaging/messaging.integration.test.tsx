import React from "react";
import { Alert, TouchableOpacity } from "react-native";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import ComposeScreen from "../../app/(home)/messages/compose";
import MessagesScreen from "../../app/(home)/messages/index";
import { messagingApi } from "../../src/api/messaging.api";
import { SuccessToastHost } from "../../src/components/feedback/SuccessToastHost";
import { useMessagingStore } from "../../src/store/messaging.store";
import { useAuthStore } from "../../src/store/auth.store";
import { useSuccessToastStore } from "../../src/store/success-toast.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-pell-rich-editor");
jest.mock("../../src/api/messaging.api");
jest.mock("../../src/store/auth.store");

const mockRequestGallery = jest.fn().mockResolvedValue({ status: "granted" });
const mockLaunchLibrary = jest
  .fn()
  .mockResolvedValue({ canceled: true, assets: [] });
jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: () => mockRequestGallery(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: () => mockLaunchLibrary(),
  launchCameraAsync: jest.fn(),
}));

const mockBack = jest.fn();
const mockPush = jest.fn();
let mockRouteParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: mockPush }),
  useLocalSearchParams: () => mockRouteParams,
}));

jest.mock("../../src/components/messaging/RecipientPickerModal", () => ({
  RecipientPickerModal: (props: {
    visible: boolean;
    onConfirm: (recipients: Array<{ value: string; label: string }>) => void;
  }) => {
    const React = require("react");
    const { Text, TouchableOpacity } = require("react-native");
    if (!props.visible) return null;
    return React.createElement(
      TouchableOpacity,
      {
        testID: "recipient-modal-confirm",
        onPress: () => props.onConfirm([{ value: "u-teacher", label: "Alice Martin" }]),
      },
      React.createElement(Text, null, "Confirmer"),
    );
  },
}));

const api = messagingApi as jest.Mocked<typeof messagingApi>;
const { __mockEditorMethods: mockEditorMethods } = jest.requireMock(
  "react-native-pell-rich-editor",
);
const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
const consoleErrorSpy = jest
  .spyOn(console, "error")
  .mockImplementation(jest.fn());

const draftMessage = {
  id: "draft-1",
  folder: "drafts" as const,
  status: "DRAFT" as const,
  subject: "Réunion reportée",
  preview: "Préparation du message",
  createdAt: "2024-01-15T10:00:00Z",
  sentAt: null,
  unread: false,
  sender: null,
  recipientsCount: 1,
  mailboxEntryId: "mb1",
  attachments: [],
};

const listedMessage = {
  id: "m1",
  folder: "inbox" as const,
  status: "SENT" as const,
  subject: "Convocation parents",
  preview: "Texte",
  createdAt: "2024-01-15T10:00:00Z",
  sentAt: "2024-01-15T10:00:00Z",
  unread: false,
  sender: { id: "u1", firstName: "Alice", lastName: "Martin" },
  recipientsCount: 1,
  mailboxEntryId: "mb2",
  attachments: [],
};

const listedMessagePage2 = {
  id: "m2",
  folder: "inbox" as const,
  status: "SENT" as const,
  subject: "Réunion pédagogique",
  preview: "Ordre du jour",
  createdAt: "2024-01-16T10:00:00Z",
  sentAt: "2024-01-16T10:00:00Z",
  unread: true,
  sender: { id: "u2", firstName: "Claire", lastName: "Nkeng" },
  recipientsCount: 1,
  mailboxEntryId: "mb3",
  attachments: [],
};

function MessageActionsIntegrationHarness() {
  const { schoolSlug } = useAuthStore();
  const { removeLocal, markLocalUnread } = useMessagingStore();
  const effectiveSchoolSlug = schoolSlug ?? "college-vogt";

  return (
    <>
      <TouchableOpacity
        testID="archive-btn"
        onPress={async () => {
          await messagingApi.archive(effectiveSchoolSlug, "m1", true);
          removeLocal("m1");
        }}
      />
      <TouchableOpacity
        testID="mark-unread-btn"
        onPress={async () => {
          await messagingApi.markRead(effectiveSchoolSlug, "m1", false);
          markLocalUnread("m1");
        }}
      />
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy.mockClear();
  consoleErrorSpy.mockClear();
  mockEditorMethods.insertImage.mockClear();
  mockEditorMethods.setForeColor.mockClear();
  mockEditorMethods.command.mockClear();
  mockRequestGallery.mockClear();
  mockLaunchLibrary.mockClear();
  mockRouteParams = {};
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    schoolSlug: "college-vogt",
  });
  useMessagingStore.setState({
    folder: "inbox",
    messages: [],
    meta: null,
    isLoading: false,
    isRefreshing: false,
    search: "",
    unreadCount: 0,
  });
  api.getRecipients.mockImplementation(() => new Promise(() => {}));
  api.send.mockResolvedValue(undefined);
  api.list.mockResolvedValue({
    items: [draftMessage],
    meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
  });
  api.markRead.mockResolvedValue(undefined);
  api.archive.mockResolvedValue(undefined);
  api.remove.mockResolvedValue(undefined);
  useSuccessToastStore.getState().hide();
});

describe("Messaging integration", () => {
  it("enregistre un brouillon et recharge le dossier drafts dans le vrai store", async () => {
    useMessagingStore.setState({ folder: "drafts" });

    render(
      <>
        <ComposeScreen />
        <SuccessToastHost />
      </>,
    );
    fireEvent.changeText(screen.getByTestId("subject-input"), "Réunion reportée");

    await act(async () => {
      fireEvent.press(screen.getByTestId("save-draft-btn"));
    });

    await waitFor(() => {
      expect(api.send).toHaveBeenCalledWith(
        "college-vogt",
        expect.objectContaining({
          subject: "Réunion reportée",
          isDraft: true,
        }),
      );
    });

    await waitFor(() => {
      expect(useMessagingStore.getState().messages[0]?.id).toBe("draft-1");
    });
    expect(screen.getByTestId("success-toast-card")).toBeOnTheScreen();
    expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
      "Brouillon enregistré",
    );
    expect(mockBack).toHaveBeenCalled();
  });

  it("affiche un toast global après l'envoi réussi d'un message", async () => {
    render(
      <>
        <ComposeScreen />
        <SuccessToastHost />
      </>,
    );

    fireEvent.press(screen.getByTestId("recipients-field"));
    fireEvent.press(screen.getByTestId("recipient-modal-confirm"));
    fireEvent.changeText(screen.getByTestId("subject-input"), "Suivi de classe");
    fireEvent.press(screen.getByTestId("rich-editor-set-content"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("send-btn"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("success-toast-card")).toBeOnTheScreen();
    });
    expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
      "Message envoyé",
    );
    expect(screen.getByTestId("success-toast-message")).toHaveTextContent(
      "Votre message a bien été envoyé.",
    );
    expect(mockBack).toHaveBeenCalled();
  });

  it("affiche un toast global d'erreur après un échec d'envoi", async () => {
    api.send.mockRejectedValueOnce(new Error("SEND_MESSAGE_FAILED"));

    render(
      <>
        <ComposeScreen />
        <SuccessToastHost />
      </>,
    );

    fireEvent.press(screen.getByTestId("recipients-field"));
    fireEvent.press(screen.getByTestId("recipient-modal-confirm"));
    fireEvent.changeText(screen.getByTestId("subject-input"), "Suivi de classe");
    fireEvent.press(screen.getByTestId("rich-editor-set-content"));

    await act(async () => {
      fireEvent.press(screen.getByTestId("send-btn"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("success-toast-card")).toBeOnTheScreen();
    });
    expect(screen.getByTestId("success-toast-variant")).toHaveTextContent(
      "Échec",
    );
    expect(screen.getByTestId("success-toast-title")).toHaveTextContent(
      "Envoi impossible",
    );
    expect(screen.getByTestId("success-toast-message")).toHaveTextContent(
      "Impossible d'envoyer le message. Réessayez.",
    );
  });

  it("applique les outils rapides de l'éditeur sur l'écran réel de composition", () => {
    render(<ComposeScreen />);

    expect(screen.getByTestId("compose-action-bar")).toHaveStyle({
      flexDirection: "row",
    });

    fireEvent.press(screen.getByTestId("editor-heading-btn"));
    fireEvent.press(screen.getByTestId("editor-quote-btn"));

    expect(mockEditorMethods.command).toHaveBeenNthCalledWith(
      1,
      "document.execCommand('formatBlock', false, '<h2>'); true;",
    );
    expect(mockEditorMethods.command).toHaveBeenNthCalledWith(
      2,
      "document.execCommand('formatBlock', false, '<blockquote>'); true;",
    );
  });

  it("ajoute une image comme pièce jointe via 'Joindre' sans insertion inline", async () => {
    mockLaunchLibrary.mockResolvedValueOnce({
      canceled: false,
      assets: [
        {
          uri: "file:///tmp/integration-piece-jointe.jpg",
          mimeType: "image/jpeg",
          fileName: "integration-piece-jointe.jpg",
          fileSize: 2048,
        },
      ],
    });

    render(<ComposeScreen />);

    fireEvent.press(screen.getByTestId("attachment-actions-btn"));
    const actions = alertSpy.mock.calls.at(-1)?.[2] as
      | Array<{ text?: string; onPress?: () => void }>
      | undefined;
    const galleryAction = actions?.find((action) => action.text === "Ouvrir la galerie");

    await act(async () => {
      galleryAction?.onPress?.();
    });

    await waitFor(() => {
      expect(screen.getByText("integration-piece-jointe.jpg")).toBeOnTheScreen();
    });
    expect(api.uploadInlineImage).not.toHaveBeenCalled();
    expect(mockEditorMethods.insertImage).not.toHaveBeenCalled();
  });

  it("archive un message et le retire du vrai store", async () => {
    useMessagingStore.setState({
      folder: "inbox",
      messages: [listedMessage],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
      unreadCount: 0,
    });

    render(<MessageActionsIntegrationHarness />);

    await act(async () => {
      fireEvent.press(screen.getByTestId("archive-btn"));
    });

    await waitFor(() => {
      expect(useMessagingStore.getState().messages).toHaveLength(0);
    });
    expect(api.archive).toHaveBeenCalledWith("college-vogt", "m1", true);
  });

  it("marque un message comme non lu et met à jour le vrai store", async () => {
    useMessagingStore.setState({
      folder: "inbox",
      messages: [listedMessage],
      meta: { page: 1, limit: 25, total: 1, totalPages: 1 },
      unreadCount: 0,
    });

    render(<MessageActionsIntegrationHarness />);

    await act(async () => {
      fireEvent.press(screen.getByTestId("mark-unread-btn"));
    });

    await waitFor(() => {
      expect(useMessagingStore.getState().messages[0]?.unread).toBe(true);
    });
    expect(useMessagingStore.getState().unreadCount).toBe(1);
    expect(api.markRead).toHaveBeenCalledWith("college-vogt", "m1", false);
  });

  it("append la page suivante quand on atteint la fin de liste", async () => {
    api.list
      .mockResolvedValueOnce({
        items: [listedMessage],
        meta: { page: 1, limit: 25, total: 30, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        items: [listedMessagePage2],
        meta: { page: 2, limit: 25, total: 30, totalPages: 2 },
      });

    render(<MessagesScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("message-row-m1")).toBeOnTheScreen();
    });

    fireEvent(screen.getByTestId("messages-list"), "onEndReached", {
      distanceFromEnd: 24,
    });

    await waitFor(() => {
      expect(screen.getByTestId("message-row-m2")).toBeOnTheScreen();
    });

    expect(useMessagingStore.getState().messages.map((message) => message.id)).toEqual([
      "m1",
      "m2",
    ]);
  });
});
