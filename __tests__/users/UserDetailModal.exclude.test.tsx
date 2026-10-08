/**
 * Exclusion d'un membre de l'école / retrait de classe depuis la fiche utilisateur.
 * Couvre : visibilité du bouton (admin principal, soi-même, élève avec/sans
 * classe), confirmation, appel API, toasts, rafraîchissement de la liste,
 * fermeture, gestion d'erreur serveur.
 */
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { UserDetailModal } from "../../src/components/users/UserDetailModal";
import { usersApi } from "../../src/api/users.api";
import {
  TEACHER_USER,
  STUDENT_USER,
  makeSchoolUserDetail,
} from "../../test-utils/users.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/users.api");
jest.mock("../../src/api/teachers.api", () => ({
  teachersApi: {
    listSchoolYears: jest.fn().mockResolvedValue([]),
    listClassrooms: jest.fn().mockResolvedValue([]),
    listSubjects: jest.fn().mockResolvedValue([]),
    listTeachers: jest.fn().mockResolvedValue([]),
    createAssignment: jest.fn().mockResolvedValue({}),
  },
}));
jest.mock("../../src/api/family.api", () => ({
  familyApi: {
    listAdminStudents: jest
      .fn()
      .mockResolvedValue({ students: [], total: 0, page: 1, hasMore: false }),
    linkExistingParent: jest.fn().mockResolvedValue(undefined),
    createParent: jest.fn().mockResolvedValue({}),
  },
}));
jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({ schoolSlug: "college-vogt", user: null }),
}));
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: (
    selector?: (state: {
      showSuccess: jest.Mock;
      showError: jest.Mock;
    }) => unknown,
  ) => {
    const state = { showSuccess: mockShowSuccess, showError: mockShowError };
    return typeof selector === "function" ? selector(state) : state;
  },
}));
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockUsersApi = usersApi as jest.Mocked<typeof usersApi>;
const SLUG = "college-vogt";

function detailOf(
  user: typeof TEACHER_USER,
  extra: Record<string, unknown> = {},
) {
  return {
    ...makeSchoolUserDetail({ ...user }),
    ...extra,
  } as ReturnType<typeof makeSchoolUserDetail>;
}

async function renderLoaded(
  user: typeof TEACHER_USER,
  extra: Record<string, unknown> = {},
  props: { onClose?: jest.Mock; onMemberChanged?: jest.Mock } = {},
) {
  mockUsersApi.get.mockResolvedValue(detailOf(user, extra));
  render(
    <UserDetailModal
      user={user}
      schoolSlug={SLUG}
      onClose={props.onClose ?? jest.fn()}
      onMemberChanged={props.onMemberChanged}
    />,
  );
  await waitFor(() =>
    expect(screen.getByTestId("action-edit-roles")).toBeOnTheScreen(),
  );
}

describe("UserDetailModal — exclusion de l'école", () => {
  beforeEach(() => jest.clearAllMocks());

  it("exclut un enseignant après confirmation, notifie la liste et ferme la fiche", async () => {
    mockUsersApi.removeMember.mockResolvedValue({
      action: "EXCLUDED",
      remainingRoles: [],
    });
    const onClose = jest.fn();
    const onMemberChanged = jest.fn();
    await renderLoaded(TEACHER_USER, {}, { onClose, onMemberChanged });

    fireEvent.press(screen.getByTestId("action-exclude"));
    // Rien n'est supprimé avant la confirmation.
    expect(mockUsersApi.removeMember).not.toHaveBeenCalled();
    expect(await screen.findByTestId("confirm-dialog-card")).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));

    await waitFor(() =>
      expect(mockUsersApi.removeMember).toHaveBeenCalledWith(
        SLUG,
        TEACHER_USER.id,
      ),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onMemberChanged).toHaveBeenCalledTimes(1);
    expect(mockShowSuccess).toHaveBeenCalledTimes(1);
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("annuler la confirmation n'exclut personne", async () => {
    await renderLoaded(TEACHER_USER);
    fireEvent.press(screen.getByTestId("action-exclude"));
    fireEvent.press(await screen.findByTestId("confirm-dialog-cancel"));
    expect(mockUsersApi.removeMember).not.toHaveBeenCalled();
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  it("masque l'exclusion pour l'administrateur principal", async () => {
    await renderLoaded(TEACHER_USER, { isPrimaryAdmin: true });
    expect(screen.queryByTestId("action-exclude")).toBeNull();
  });

  it("masque l'exclusion pour soi-même", async () => {
    await renderLoaded(TEACHER_USER, { isSelf: true });
    expect(screen.queryByTestId("action-exclude")).toBeNull();
  });

  it("affiche l'erreur serveur (409) sans fermer la fiche ni rafraîchir la liste", async () => {
    mockUsersApi.removeMember.mockRejectedValue(
      new Error("Impossible d'exclure le dernier administrateur"),
    );
    const onClose = jest.fn();
    const onMemberChanged = jest.fn();
    await renderLoaded(TEACHER_USER, {}, { onClose, onMemberChanged });

    fireEvent.press(screen.getByTestId("action-exclude"));
    fireEvent.press(await screen.findByTestId("confirm-dialog-confirm"));

    await waitFor(() => expect(mockShowError).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
    expect(onMemberChanged).not.toHaveBeenCalled();
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  it("élève avec classe : libellé 'Retirer de sa classe', la fiche reste ouverte et se recharge", async () => {
    mockUsersApi.removeMember.mockResolvedValue({
      action: "UNASSIGNED_FROM_CLASS",
      remainingRoles: ["STUDENT"],
    });
    const onClose = jest.fn();
    const onMemberChanged = jest.fn();
    await renderLoaded(
      STUDENT_USER,
      { hasActiveClass: true },
      { onClose, onMemberChanged },
    );

    expect(screen.getByText("Retirer de sa classe")).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId("action-exclude"));
    fireEvent.press(await screen.findByTestId("confirm-dialog-confirm"));

    await waitFor(() =>
      expect(mockUsersApi.removeMember).toHaveBeenCalledWith(
        SLUG,
        STUDENT_USER.id,
      ),
    );
    await waitFor(() => expect(onMemberChanged).toHaveBeenCalledTimes(1));
    expect(onClose).not.toHaveBeenCalled();
    expect(mockShowSuccess).toHaveBeenCalledTimes(1);
    // Rechargement du détail pour refléter l'absence de classe.
    await waitFor(() =>
      expect(mockUsersApi.get.mock.calls.length).toBeGreaterThan(1),
    );
  });

  it("élève sans classe pour l'année active : aucune action de retrait", async () => {
    await renderLoaded(STUDENT_USER, { hasActiveClass: false });
    expect(screen.queryByTestId("action-exclude")).toBeNull();
  });
});
