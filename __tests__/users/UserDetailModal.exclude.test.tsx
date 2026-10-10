/**
 * Exclusion d'un membre de l'école / retrait de classe depuis la fiche utilisateur.
 * Couvre : visibilité des boutons (admin principal, soi-même, élève avec/sans
 * classe, élève sans compte), confirmation, motif, appel API (POST exclude vs
 * DELETE retrait de classe), toasts, rafraîchissement de la liste, fermeture,
 * gestion d'erreur serveur.
 */
import React from "react";
import { StyleSheet } from "react-native";
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
  makeStudentOnlyUser,
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

  it("exclut un enseignant après confirmation (POST exclude), notifie la liste et ferme la fiche", async () => {
    mockUsersApi.excludeMember.mockResolvedValue({
      action: "EXCLUDED",
      roles: ["TEACHER"],
      excludedAt: "2026-10-10T08:00:00.000Z",
    });
    const onClose = jest.fn();
    const onMemberChanged = jest.fn();
    await renderLoaded(TEACHER_USER, {}, { onClose, onMemberChanged });

    fireEvent.press(screen.getByTestId("action-exclude"));
    // Rien n'est exclu avant la confirmation.
    expect(mockUsersApi.excludeMember).not.toHaveBeenCalled();
    expect(await screen.findByTestId("confirm-dialog-card")).toBeOnTheScreen();
    fireEvent.changeText(
      screen.getByTestId("exclude-reason-input"),
      "Fin de contrat",
    );
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));

    await waitFor(() =>
      expect(mockUsersApi.excludeMember).toHaveBeenCalledWith(
        SLUG,
        TEACHER_USER.id,
        "Fin de contrat",
      ),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockUsersApi.removeMember).not.toHaveBeenCalled();
    expect(onMemberChanged).toHaveBeenCalledTimes(1);
    expect(mockShowSuccess).toHaveBeenCalledTimes(1);
    expect(mockShowError).not.toHaveBeenCalled();
  });

  it("le champ motif occupe toute la largeur du dialogue (ne se contracte pas autour du texte)", async () => {
    await renderLoaded(TEACHER_USER);
    fireEvent.press(screen.getByTestId("action-exclude"));
    const input = await screen.findByTestId("exclude-reason-input");
    fireEvent.changeText(input, "Fin");

    const inputStyle = StyleSheet.flatten(
      screen.getByTestId("exclude-reason-input").props.style,
    );
    expect(inputStyle.alignSelf).toBe("stretch");

    // Le conteneur (libellé + champ) s'étire aussi dans la carte centrée.
    let node = screen.getByTestId("exclude-reason-input").parent;
    let wrapStyle: Record<string, unknown> | undefined;
    while (node && !wrapStyle) {
      const style = StyleSheet.flatten(node.props?.style) as
        | Record<string, unknown>
        | undefined;
      if (style?.marginTop === 12 && style?.gap === 4) wrapStyle = style;
      node = node.parent;
    }
    expect(wrapStyle?.alignSelf).toBe("stretch");
  });

  it("annuler la confirmation n'exclut personne", async () => {
    await renderLoaded(TEACHER_USER);
    fireEvent.press(screen.getByTestId("action-exclude"));
    fireEvent.press(await screen.findByTestId("confirm-dialog-cancel"));
    expect(mockUsersApi.excludeMember).not.toHaveBeenCalled();
    expect(mockUsersApi.removeMember).not.toHaveBeenCalled();
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  it("refuse un motif de plus de 500 caractères : erreur inline, aucun appel API", async () => {
    await renderLoaded(TEACHER_USER);
    fireEvent.press(screen.getByTestId("action-exclude"));
    fireEvent.changeText(
      await screen.findByTestId("exclude-reason-input"),
      "x".repeat(501),
    );
    expect(await screen.findByTestId("exclude-reason-error")).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
    expect(mockUsersApi.excludeMember).not.toHaveBeenCalled();
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
    mockUsersApi.excludeMember.mockRejectedValue(
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

  it("élève avec classe : 'Retirer de sa classe' (DELETE, fiche ouverte) distinct de 'Exclure de l'école'", async () => {
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
    expect(screen.getByTestId("action-exclude")).toBeOnTheScreen();
    fireEvent.press(screen.getByTestId("action-unassign-class"));
    // Retrait de classe : pas de champ motif.
    expect(screen.queryByTestId("exclude-reason-input")).toBeNull();
    fireEvent.press(await screen.findByTestId("confirm-dialog-confirm"));

    await waitFor(() =>
      expect(mockUsersApi.removeMember).toHaveBeenCalledWith(
        SLUG,
        STUDENT_USER.id,
      ),
    );
    await waitFor(() => expect(onMemberChanged).toHaveBeenCalledTimes(1));
    expect(mockUsersApi.excludeMember).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(mockShowSuccess).toHaveBeenCalledTimes(1);
    // Rechargement du détail pour refléter l'absence de classe.
    await waitFor(() =>
      expect(mockUsersApi.get.mock.calls.length).toBeGreaterThan(1),
    );
  });

  it("élève : 'Exclure de l'école' utilise POST exclude avec le message élève", async () => {
    mockUsersApi.excludeMember.mockResolvedValue({
      action: "EXCLUDED",
      roles: ["STUDENT"],
      excludedAt: "2026-10-10T08:00:00.000Z",
    });
    await renderLoaded(STUDENT_USER, { hasActiveClass: true });
    fireEvent.press(screen.getByTestId("action-exclude"));
    expect(
      await screen.findByTestId("confirm-dialog-message"),
    ).toHaveTextContent(/lecture seule/);
    fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
    await waitFor(() =>
      expect(mockUsersApi.excludeMember).toHaveBeenCalledWith(
        SLUG,
        STUDENT_USER.id,
        "",
      ),
    );
    expect(mockUsersApi.removeMember).not.toHaveBeenCalled();
  });

  it("élève sans classe pour l'année active : plus de retrait de classe mais l'exclusion reste possible", async () => {
    await renderLoaded(STUDENT_USER, { hasActiveClass: false });
    expect(screen.queryByTestId("action-unassign-class")).toBeNull();
    expect(screen.getByTestId("action-exclude")).toBeOnTheScreen();
  });

  it("élève sans compte : exclusion par studentId (route students/:id/exclude)", async () => {
    mockUsersApi.getStudentProfile.mockResolvedValue({
      type: "student-only",
      studentId: "student-only-1",
      firstName: "Amina",
      lastName: "Fouda",
      enrollments: [],
      studentParents: [],
    });
    mockUsersApi.excludeStudent.mockResolvedValue({
      action: "EXCLUDED",
      roles: ["STUDENT"],
      excludedAt: "2026-10-10T08:00:00.000Z",
    });
    const onClose = jest.fn();
    const onMemberChanged = jest.fn();
    render(
      <UserDetailModal
        user={makeStudentOnlyUser()}
        schoolSlug={SLUG}
        onClose={onClose}
        onMemberChanged={onMemberChanged}
      />,
    );

    fireEvent.press(await screen.findByTestId("action-exclude"));
    // Seule l'exclusion est proposée sans compte (ni message, ni rôles, ni PIN).
    expect(screen.queryByTestId("action-send-message")).toBeNull();
    expect(screen.queryByTestId("action-edit-roles")).toBeNull();
    fireEvent.press(await screen.findByTestId("confirm-dialog-confirm"));

    await waitFor(() =>
      expect(mockUsersApi.excludeStudent).toHaveBeenCalledWith(
        SLUG,
        "student-only-1",
        "",
      ),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onMemberChanged).toHaveBeenCalledTimes(1);
    expect(mockUsersApi.excludeMember).not.toHaveBeenCalled();
  });
});
