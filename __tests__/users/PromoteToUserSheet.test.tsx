/**
 * Tests unitaires : PromoteToUserFormContent
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { PromoteToUserFormContent } from "../../src/components/users/PromoteToUserSheet";
import { usersApi } from "../../src/api/users.api";
import { useSuccessToastStore } from "../../src/store/success-toast.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/api/users.api");
jest.mock("../../src/store/success-toast.store");

const mockUsersApi = usersApi as jest.Mocked<typeof usersApi>;
const mockUseSuccessToastStore = useSuccessToastStore as jest.MockedFunction<
  typeof useSuccessToastStore
>;

const mockShowError = jest.fn();

const DEFAULT_PROPS = {
  schoolSlug: "college-vogt",
  studentId: "student-42",
  studentName: "Amina Fouda",
  onCancel: jest.fn(),
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

describe("PromoteToUserFormContent — au mount", () => {
  it("appelle suggestUsername au mount avec schoolSlug et studentId", async () => {
    render(<PromoteToUserFormContent {...DEFAULT_PROPS} />);

    await waitFor(() =>
      expect(mockUsersApi.suggestUsername).toHaveBeenCalledWith(
        "college-vogt",
        "student-42",
      ),
    );
  });

  it("pré-remplit le champ username avec la suggestion retournée par l'API", async () => {
    render(<PromoteToUserFormContent {...DEFAULT_PROPS} />);

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

    render(<PromoteToUserFormContent {...DEFAULT_PROPS} />);

    expect(screen.getByDisplayValue("AminaFouda")).toBeOnTheScreen();
    await waitFor(() =>
      expect(screen.getByDisplayValue("aminafouda")).toBeOnTheScreen(),
    );
  });

  it("garde une proposition visible et affiche un hint si la suggestion backend échoue", async () => {
    mockUsersApi.suggestUsername.mockRejectedValueOnce(
      new Error("Network error"),
    );
    render(<PromoteToUserFormContent {...DEFAULT_PROPS} />);

    expect(screen.getByDisplayValue("AminaFouda")).toBeOnTheScreen();
    await waitFor(() =>
      expect(screen.getByTestId("hint-username-promote")).toBeOnTheScreen(),
    );
  });
});

describe("PromoteToUserFormContent — champ username", () => {
  it("permet de modifier le champ username", async () => {
    render(<PromoteToUserFormContent {...DEFAULT_PROPS} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina42",
    );

    expect(screen.getByDisplayValue("amina42")).toBeOnTheScreen();
  });
});

describe("PromoteToUserFormContent — validation Zod", () => {
  it("affiche une erreur si le username fait moins de 3 caractères", async () => {
    render(<PromoteToUserFormContent {...DEFAULT_PROPS} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(screen.getByTestId("input-username-promote"), "ab");
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() =>
      expect(
        screen.getByTestId("input-username-promote-error"),
      ).toBeOnTheScreen(),
    );
    expect(
      screen.getByText("L'identifiant doit faire au moins 3 caractères."),
    ).toBeOnTheScreen();
    expect(mockUsersApi.promoteStudent).not.toHaveBeenCalled();
  });

  it("affiche une erreur si le username contient des caractères non alphanumériques (espace)", async () => {
    render(<PromoteToUserFormContent {...DEFAULT_PROPS} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina fouda",
    );
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() =>
      expect(
        screen.getByTestId("input-username-promote-error"),
      ).toBeOnTheScreen(),
    );
    expect(
      screen.getByText("Lettres et chiffres uniquement."),
    ).toBeOnTheScreen();
    expect(mockUsersApi.promoteStudent).not.toHaveBeenCalled();
  });

  it("affiche une erreur si le username contient un point (non alphanumérique)", async () => {
    render(<PromoteToUserFormContent {...DEFAULT_PROPS} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina.fouda",
    );
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() =>
      expect(
        screen.getByTestId("input-username-promote-error"),
      ).toBeOnTheScreen(),
    );
    expect(mockUsersApi.promoteStudent).not.toHaveBeenCalled();
  });
});

describe("PromoteToUserFormContent — submit success", () => {
  it("appelle promoteStudent avec le bon username", async () => {
    mockUsersApi.promoteStudent.mockResolvedValueOnce({
      username: "amina42",
      temporaryPassword: "TmpPwd123",
    });

    render(<PromoteToUserFormContent {...DEFAULT_PROPS} />);

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

  it("appelle onSuccess avec les identifiants après un submit réussi", async () => {
    const onSuccess = jest.fn();
    mockUsersApi.promoteStudent.mockResolvedValueOnce({
      username: "amina42",
      temporaryPassword: "TmpPwd123",
    });

    render(
      <PromoteToUserFormContent {...DEFAULT_PROPS} onSuccess={onSuccess} />,
    );

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina42",
    );
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() =>
      expect(onSuccess).toHaveBeenCalledWith({
        username: "amina42",
        temporaryPassword: "TmpPwd123",
      }),
    );
  });

  it("n'appelle pas onCancel après un submit réussi (redirection gérée par le parent)", async () => {
    const onCancel = jest.fn();
    mockUsersApi.promoteStudent.mockResolvedValueOnce({
      username: "amina42",
      temporaryPassword: "TmpPwd123",
    });

    render(<PromoteToUserFormContent {...DEFAULT_PROPS} onCancel={onCancel} />);

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina42",
    );
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() => expect(mockUsersApi.promoteStudent).toHaveBeenCalled());
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe("PromoteToUserFormContent — erreur API", () => {
  it("affiche une erreur inline sur le champ si le username est déjà pris", async () => {
    mockUsersApi.promoteStudent.mockRejectedValueOnce(
      Object.assign(new Error('Username "amina42" is already taken'), {
        statusCode: 409,
      }),
    );

    const onCancel = jest.fn();
    const onSuccess = jest.fn();
    render(
      <PromoteToUserFormContent
        {...DEFAULT_PROPS}
        onCancel={onCancel}
        onSuccess={onSuccess}
      />,
    );

    await waitFor(() => screen.getByTestId("input-username-promote"));

    fireEvent.changeText(
      screen.getByTestId("input-username-promote"),
      "amina42",
    );
    fireEvent.press(screen.getByTestId("promote-student-submit"));

    await waitFor(() =>
      expect(
        screen.getByTestId("input-username-promote-error"),
      ).toBeOnTheScreen(),
    );
    expect(
      screen.getByText(
        "Cet identifiant est déjà utilisé. Choisis-en un autre.",
      ),
    ).toBeOnTheScreen();
    expect(mockShowError).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("affiche le message d'erreur via showError si l'API échoue pour une autre raison", async () => {
    mockUsersApi.promoteStudent.mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<PromoteToUserFormContent {...DEFAULT_PROPS} />);

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

describe("PromoteToUserFormContent — bouton annuler", () => {
  it("appelle onCancel si on clique Annuler", async () => {
    const onCancel = jest.fn();
    render(<PromoteToUserFormContent {...DEFAULT_PROPS} onCancel={onCancel} />);

    await waitFor(() => screen.getByTestId("promote-student-cancel"));

    fireEvent.press(screen.getByTestId("promote-student-cancel"));
    expect(onCancel).toHaveBeenCalled();
  });
});
