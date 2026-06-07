/**
 * Tests unitaires : PromoteToUserSheet
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { PromoteToUserSheet } from "../../src/components/users/PromoteToUserSheet";
import { usersApi } from "../../src/api/users.api";
import { useSuccessToastStore } from "../../src/store/success-toast.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/api/users.api");
jest.mock("../../src/store/success-toast.store");
// expo-clipboard est utilisé par CredentialDisplaySheet (rendu imbriqué)
jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

const mockUsersApi = usersApi as jest.Mocked<typeof usersApi>;
const mockUseSuccessToastStore = useSuccessToastStore as jest.MockedFunction<
  typeof useSuccessToastStore
>;

const mockShowError = jest.fn();

const DEFAULT_PROPS = {
  visible: true,
  onClose: jest.fn(),
  schoolSlug: "college-vogt",
  studentId: "student-42",
  studentName: "Amina Fouda",
  onSuccess: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseSuccessToastStore.mockImplementation((selector: unknown) => {
    if (typeof selector === "function") {
      return selector({ showError: mockShowError, showSuccess: jest.fn() });
    }
    return { showError: mockShowError } as ReturnType<
      typeof useSuccessToastStore
    >;
  });
  // Suggestion par défaut
  mockUsersApi.suggestUsername.mockResolvedValue({ username: "amina.fouda" });
});

describe("PromoteToUserSheet — au mount", () => {
  it("appelle suggestUsername au mount avec schoolSlug et studentId", async () => {
    render(<PromoteToUserSheet {...DEFAULT_PROPS} />);

    await waitFor(() =>
      expect(mockUsersApi.suggestUsername).toHaveBeenCalledWith(
        "college-vogt",
        "student-42",
      ),
    );
  });

  it("pré-remplit le champ username avec la suggestion retournée par l'API", async () => {
    render(<PromoteToUserSheet {...DEFAULT_PROPS} />);

    await waitFor(() =>
      expect(screen.getByDisplayValue("amina.fouda")).toBeOnTheScreen(),
    );
  });

  it("affiche immédiatement une valeur de secours avant la réponse backend", async () => {
    mockUsersApi.suggestUsername.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ username: "aminafouda" }), 50);
        }),
    );

    render(<PromoteToUserSheet {...DEFAULT_PROPS} />);

    expect(screen.getByDisplayValue("AminaFouda")).toBeOnTheScreen();
    await waitFor(() =>
      expect(screen.getByDisplayValue("aminafouda")).toBeOnTheScreen(),
    );
  });

  it("garde une proposition visible et affiche un hint si la suggestion backend échoue", async () => {
    mockUsersApi.suggestUsername.mockRejectedValueOnce(
      new Error("Network error"),
    );
    render(<PromoteToUserSheet {...DEFAULT_PROPS} />);

    expect(screen.getByDisplayValue("AminaFouda")).toBeOnTheScreen();
    await waitFor(() =>
      expect(screen.getByTestId("hint-username-promote")).toBeOnTheScreen(),
    );
  });
});

describe("PromoteToUserSheet — champ username", () => {
  it("permet de modifier le champ username", async () => {
    render(<PromoteToUserSheet {...DEFAULT_PROPS} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina42",
    );

    expect(screen.getByDisplayValue("amina42")).toBeOnTheScreen();
  });
});

describe("PromoteToUserSheet — validation Zod", () => {
  it("affiche une erreur si le username fait moins de 3 caractères", async () => {
    render(<PromoteToUserSheet {...DEFAULT_PROPS} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(screen.getByTestId("input-username-promote"), "ab");
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("error-username-promote")).toBeOnTheScreen(),
    );
    expect(
      screen.getByText("L'identifiant doit faire au moins 3 caractères."),
    ).toBeOnTheScreen();
    expect(mockUsersApi.promoteStudent).not.toHaveBeenCalled();
  });

  it("affiche une erreur si le username contient des caractères non alphanumériques (espace)", async () => {
    render(<PromoteToUserSheet {...DEFAULT_PROPS} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina fouda",
    );
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("error-username-promote")).toBeOnTheScreen(),
    );
    expect(
      screen.getByText("Lettres et chiffres uniquement."),
    ).toBeOnTheScreen();
    expect(mockUsersApi.promoteStudent).not.toHaveBeenCalled();
  });

  it("affiche une erreur si le username contient un point (non alphanumérique)", async () => {
    render(<PromoteToUserSheet {...DEFAULT_PROPS} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina.fouda",
    );
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("error-username-promote")).toBeOnTheScreen(),
    );
    expect(mockUsersApi.promoteStudent).not.toHaveBeenCalled();
  });
});

describe("PromoteToUserSheet — submit success", () => {
  it("appelle promoteStudent avec le bon username", async () => {
    mockUsersApi.promoteStudent.mockResolvedValueOnce({
      username: "amina42",
      temporaryPassword: "TmpPwd123",
    });

    render(<PromoteToUserSheet {...DEFAULT_PROPS} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina42",
    );
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() =>
      expect(mockUsersApi.promoteStudent).toHaveBeenCalledWith(
        "college-vogt",
        "student-42",
        "amina42",
      ),
    );
  });

  it("appelle onSuccess après un submit réussi", async () => {
    const onSuccess = jest.fn();
    mockUsersApi.promoteStudent.mockResolvedValueOnce({
      username: "amina42",
      temporaryPassword: "TmpPwd123",
    });

    render(<PromoteToUserSheet {...DEFAULT_PROPS} onSuccess={onSuccess} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina42",
    );
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it("appelle onClose après un submit réussi", async () => {
    const onClose = jest.fn();
    mockUsersApi.promoteStudent.mockResolvedValueOnce({
      username: "amina42",
      temporaryPassword: "TmpPwd123",
    });

    render(<PromoteToUserSheet {...DEFAULT_PROPS} onClose={onClose} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina42",
    );
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});

describe("PromoteToUserSheet — erreur API", () => {
  it("affiche une erreur inline sur le champ si le username est déjà pris", async () => {
    mockUsersApi.promoteStudent.mockRejectedValueOnce(
      Object.assign(new Error('Username "amina42" is already taken'), {
        statusCode: 409,
      }),
    );

    const onClose = jest.fn();
    render(<PromoteToUserSheet {...DEFAULT_PROPS} onClose={onClose} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina42",
    );
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() =>
      expect(screen.getByTestId("error-username-promote")).toBeOnTheScreen(),
    );
    expect(
      screen.getByText(
        "Cet identifiant est déjà utilisé. Choisis-en un autre.",
      ),
    ).toBeOnTheScreen();
    expect(mockShowError).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("affiche le message d'erreur via showError si l'API échoue pour une autre raison", async () => {
    mockUsersApi.promoteStudent.mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<PromoteToUserSheet {...DEFAULT_PROPS} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina42",
    );
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() =>
      expect(mockShowError).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Erreur",
          message: "Network error",
        }),
      ),
    );
  });
});

describe("PromoteToUserSheet — bouton annuler", () => {
  it("appelle onClose si on clique Annuler", async () => {
    const onClose = jest.fn();
    render(<PromoteToUserSheet {...DEFAULT_PROPS} onClose={onClose} />);

    await waitFor(() => screen.getByTestId("promote-student-cancel"));

    fireEvent.press(screen.getByTestId("promote-student-cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});
