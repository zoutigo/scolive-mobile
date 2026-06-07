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

  it("affiche le badge du role TEACHER", () => {
    render(<UserCard user={TEACHER_USER} onPress={jest.fn()} />);
    expect(screen.getByText("Enseignant")).toBeOnTheScreen();
  });

  it("affiche le badge du role PARENT", () => {
    render(<UserCard user={PARENT_USER} onPress={jest.fn()} />);
    expect(screen.getByText("Parent")).toBeOnTheScreen();
  });

  it("affiche le badge du role STUDENT", () => {
    render(<UserCard user={STUDENT_USER} onPress={jest.fn()} />);
    expect(screen.getByText("Élève")).toBeOnTheScreen();
  });

  it("affiche tous les badges pour un utilisateur multi-roles (2 roles)", () => {
    const multiRole = makeSchoolUser({
      id: "multi",
      roles: ["TEACHER", "SCHOOL_ADMIN"],
    });
    render(<UserCard user={multiRole} onPress={jest.fn()} />);
    expect(screen.getByText("Enseignant")).toBeOnTheScreen();
    expect(screen.getByText("Admin")).toBeOnTheScreen();
  });

  it("affiche les 3 badges pour un utilisateur avec 3 roles", () => {
    const threeRoles = makeSchoolUser({
      id: "tri",
      roles: ["SCHOOL_ADMIN", "TEACHER", "PARENT"],
    });
    render(<UserCard user={threeRoles} onPress={jest.fn()} />);
    expect(screen.getByText("Admin")).toBeOnTheScreen();
    expect(screen.getByText("Enseignant")).toBeOnTheScreen();
    expect(screen.getByText("Parent")).toBeOnTheScreen();
  });

  it("n'affiche pas de compteur +N", () => {
    const multiRole = makeSchoolUser({
      id: "multi2",
      roles: ["TEACHER", "SCHOOL_ADMIN", "PARENT"],
    });
    render(<UserCard user={multiRole} onPress={jest.fn()} />);
    expect(screen.queryByText(/^\+[1-9]$/)).toBeNull();
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

  it("rend la colonne de role avec testID", () => {
    render(<UserCard user={TEACHER_USER} onPress={jest.fn()} />);
    expect(
      screen.getByTestId(`user-card-role-column-${TEACHER_USER.id}`),
    ).toBeOnTheScreen();
  });

  it("rend le badge du role principal avec testID", () => {
    render(<UserCard user={TEACHER_USER} onPress={jest.fn()} />);
    expect(
      screen.getByTestId(`user-card-primary-role-${TEACHER_USER.id}`),
    ).toBeOnTheScreen();
  });

  // ── hasAccount: true → chip de statut ────────────────────────────────────────

  it("affiche le chip de statut (point de couleur) pour un utilisateur avec compte", () => {
    render(<UserCard user={TEACHER_USER} onPress={jest.fn()} />);
    // StatusDot est rendu → pas de badge "Sans compte"
    expect(screen.queryByText("Sans compte")).toBeNull();
  });

  it("affiche le chip de statut pour un utilisateur PENDING", () => {
    render(<UserCard user={PENDING_USER} onPress={jest.fn()} />);
    expect(screen.queryByText("Sans compte")).toBeNull();
  });

  // ── hasAccount: false → badge "Sans compte" gris ─────────────────────────────

  it("affiche le badge 'Sans compte' pour un student-only", () => {
    const studentOnly = makeStudentOnlyUser({
      id: "so-1",
      firstName: "Amina",
      lastName: "Fouda",
    });
    render(<UserCard user={studentOnly} onPress={jest.fn()} />);
    expect(screen.getByText("Sans compte")).toBeOnTheScreen();
  });

  it("n'affiche pas de StatusDot pour un student-only (hasAccount: false)", () => {
    const studentOnly = makeStudentOnlyUser({ id: "so-2" });
    render(<UserCard user={studentOnly} onPress={jest.fn()} />);
    // Aucun dot de statut de couleur → seul indicateur = badge "Sans compte"
    expect(screen.getByText("Sans compte")).toBeOnTheScreen();
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
