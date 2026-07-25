/**
 * Tests unitaires : UserCard
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { UserCard } from "../../src/components/users/UserCard";
import {
  TEACHER_USER,
  PARENT_USER,
  STUDENT_USER,
  PENDING_USER,
  makeSchoolUser,
  makeStudentOnlyUser,
} from "../../test-utils/users.fixtures";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("UserCard", () => {
  it("affiche le nom complet de l'utilisateur", () => {
    render(<UserCard user={TEACHER_USER} onPress={jest.fn()} />);
    expect(screen.getByText("Ebelle Marie")).toBeOnTheScreen();
  });

  it("affiche l'email quand disponible", () => {
    render(<UserCard user={TEACHER_USER} onPress={jest.fn()} />);
    expect(screen.getByText("m.ebelle@college-vogt.cm")).toBeOnTheScreen();
  });

  it("affiche le telephone quand disponible", () => {
    render(<UserCard user={TEACHER_USER} onPress={jest.fn()} />);
    expect(screen.getByText("+237 691 234 567")).toBeOnTheScreen();
  });

  it("n'affiche pas l'email quand null", () => {
    render(<UserCard user={STUDENT_USER} onPress={jest.fn()} />);
    expect(screen.queryByText(/@/)).toBeNull();
  });

  // ── Pastilles de rôle (remplacent les badges texte) ──────────────────────────

  it("affiche une pastille de rôle avec le bon accessibilityLabel pour TEACHER", () => {
    render(<UserCard user={TEACHER_USER} onPress={jest.fn()} />);
    expect(
      screen.getByTestId(`user-card-primary-role-${TEACHER_USER.id}`),
    ).toHaveProp("accessibilityLabel", "Enseignant");
  });

  it("affiche une pastille de rôle avec le bon accessibilityLabel pour PARENT", () => {
    render(<UserCard user={PARENT_USER} onPress={jest.fn()} />);
    expect(
      screen.getByTestId(`user-card-primary-role-${PARENT_USER.id}`),
    ).toHaveProp("accessibilityLabel", "Parent");
  });

  it("affiche une pastille de rôle avec le bon accessibilityLabel pour STUDENT", () => {
    render(<UserCard user={STUDENT_USER} onPress={jest.fn()} />);
    expect(
      screen.getByTestId(`user-card-primary-role-${STUDENT_USER.id}`),
    ).toHaveProp("accessibilityLabel", "Élève");
  });

  it("affiche une pastille par rôle pour un utilisateur multi-roles (2 roles)", () => {
    const multiRole = makeSchoolUser({
      id: "multi",
      roles: ["TEACHER", "SCHOOL_ADMIN"],
    });
    render(<UserCard user={multiRole} onPress={jest.fn()} />);
    expect(screen.getByTestId("user-card-primary-role-multi")).toHaveProp(
      "accessibilityLabel",
      "Enseignant",
    );
    expect(
      screen.getByTestId("user-card-role-dot-SCHOOL_ADMIN-multi"),
    ).toHaveProp("accessibilityLabel", "Admin");
  });

  it("affiche 3 pastilles pour un utilisateur avec 3 rôles", () => {
    const threeRoles = makeSchoolUser({
      id: "tri",
      roles: ["SCHOOL_ADMIN", "TEACHER", "PARENT"],
    });
    render(<UserCard user={threeRoles} onPress={jest.fn()} />);
    const row = screen.getByTestId("user-card-role-dots-tri");
    expect(row.children).toHaveLength(3);
  });

  it("dédoublonne les pastilles quand un rôle apparaît deux fois", () => {
    const dupRoles = makeSchoolUser({
      id: "dup",
      roles: ["TEACHER", "TEACHER"],
    });
    render(<UserCard user={dupRoles} onPress={jest.fn()} />);
    const row = screen.getByTestId("user-card-role-dots-dup");
    expect(row.children).toHaveLength(1);
  });

  it("appelle onPress avec l'utilisateur quand on clique", () => {
    const onPress = jest.fn();
    render(
      <UserCard user={TEACHER_USER} onPress={onPress} testID="card-test" />,
    );
    fireEvent.press(screen.getByTestId("card-test"));
    expect(onPress).toHaveBeenCalledWith(TEACHER_USER);
  });

  it("utilise testID par defaut base sur l'id", () => {
    render(<UserCard user={TEACHER_USER} onPress={jest.fn()} />);
    expect(
      screen.getByTestId(`user-card-${TEACHER_USER.id}`),
    ).toBeOnTheScreen();
  });

  it("rend correctement un utilisateur en attente", () => {
    render(<UserCard user={PENDING_USER} onPress={jest.fn()} />);
    expect(screen.getByText("Biya Sophie")).toBeOnTheScreen();
  });

  it("applique le fond surface pour index pair (0)", () => {
    render(<UserCard user={TEACHER_USER} onPress={jest.fn()} index={0} />);
    const card = screen.getByTestId(`user-card-${TEACHER_USER.id}`);
    expect(card.props.style).toEqual(
      expect.objectContaining({ backgroundColor: "#FFFDFC" }),
    );
  });

  it("applique le fond warmSurface pour index impair (1)", () => {
    render(<UserCard user={TEACHER_USER} onPress={jest.fn()} index={1} />);
    const card = screen.getByTestId(`user-card-${TEACHER_USER.id}`);
    expect(card.props.style).toEqual(
      expect.objectContaining({ backgroundColor: "#FFF8F0" }),
    );
  });

  it("applique le fond surface par defaut quand index est absent", () => {
    render(<UserCard user={TEACHER_USER} onPress={jest.fn()} />);
    const card = screen.getByTestId(`user-card-${TEACHER_USER.id}`);
    expect(card.props.style).toEqual(
      expect.objectContaining({ backgroundColor: "#FFFDFC" }),
    );
  });

  // ── Bordure d'accent = statut de compte/activation ───────────────────────────

  it("n'applique pas de bordure d'accent pour un utilisateur actif avec compte", () => {
    render(<UserCard user={TEACHER_USER} onPress={jest.fn()} />);
    const card = screen.getByTestId(`user-card-${TEACHER_USER.id}`);
    expect(card.props.style.borderLeftWidth).toBeUndefined();
  });

  it("applique une bordure ambre pour un utilisateur PENDING", () => {
    render(<UserCard user={PENDING_USER} onPress={jest.fn()} />);
    const card = screen.getByTestId(`user-card-${PENDING_USER.id}`);
    expect(card.props.style).toEqual(
      expect.objectContaining({ borderLeftWidth: 3 }),
    );
  });

  it("applique une bordure rouge pour un utilisateur SUSPENDED", () => {
    const suspended = makeSchoolUser({
      id: "susp-1",
      activationStatus: "SUSPENDED",
    });
    render(<UserCard user={suspended} onPress={jest.fn()} />);
    const card = screen.getByTestId("user-card-susp-1");
    expect(card.props.style).toEqual(
      expect.objectContaining({ borderLeftWidth: 3 }),
    );
  });

  it("applique une bordure rouge distinctive pour un utilisateur sans compte", () => {
    const studentOnly = makeStudentOnlyUser({ id: "so-border" });
    render(<UserCard user={studentOnly} onPress={jest.fn()} />);
    const card = screen.getByTestId("user-card-so-border");
    expect(card.props.style).toEqual(
      expect.objectContaining({
        borderLeftWidth: 3,
        borderLeftColor: "#C0392B",
      }),
    );
  });

  it("n'affiche plus de badge texte 'Sans compte' (remplacé par la bordure)", () => {
    const studentOnly = makeStudentOnlyUser({ id: "so-1" });
    render(<UserCard user={studentOnly} onPress={jest.fn()} />);
    expect(screen.queryByText("Sans compte")).toBeNull();
  });

  it("affiche quand même la pastille de rôle STUDENT pour un student-only", () => {
    const studentOnly = makeStudentOnlyUser({ id: "so-2" });
    render(<UserCard user={studentOnly} onPress={jest.fn()} />);
    expect(screen.getByTestId("user-card-primary-role-so-2")).toHaveProp(
      "accessibilityLabel",
      "Élève",
    );
  });

  // ── firstName + lastName affichés correctement ────────────────────────────────

  it("affiche correctement le prénom et le nom (format 'Nom Prénom')", () => {
    const user = makeSchoolUser({
      id: "u-name-1",
      firstName: "Jean",
      lastName: "Dupont",
    });
    render(<UserCard user={user} onPress={jest.fn()} />);
    expect(screen.getByText("Dupont Jean")).toBeOnTheScreen();
  });

  it("affiche correctement firstName + lastName pour un student-only", () => {
    const studentOnly = makeStudentOnlyUser({
      id: "so-3",
      firstName: "Cédric",
      lastName: "Mballa",
    });
    render(<UserCard user={studentOnly} onPress={jest.fn()} />);
    expect(screen.getByText("Mballa Cédric")).toBeOnTheScreen();
  });
});
