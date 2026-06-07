/**
 * Tests unitaires : RoleFilterBar
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { RoleFilterBar } from "../../src/components/users/RoleFilterBar";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("RoleFilterBar", () => {
  it("affiche tous les chips de filtre", () => {
    render(<RoleFilterBar selected="ALL" onSelect={jest.fn()} />);
    expect(screen.getByText("Tous")).toBeOnTheScreen();
    expect(screen.getByText("Profs")).toBeOnTheScreen();
    expect(screen.getByText("Parents")).toBeOnTheScreen();
    expect(screen.getByText("Élèves")).toBeOnTheScreen();
    expect(screen.getByText("Admins")).toBeOnTheScreen();
    expect(screen.getByText("Staff")).toBeOnTheScreen();
  });

  it("appelle onSelect avec la bonne valeur quand on clique sur un chip", () => {
    const onSelect = jest.fn();
    render(<RoleFilterBar selected="ALL" onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId("role-filter-teacher"));
    expect(onSelect).toHaveBeenCalledWith("TEACHER");
  });

  it("appelle onSelect avec PARENT", () => {
    const onSelect = jest.fn();
    render(<RoleFilterBar selected="ALL" onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId("role-filter-parent"));
    expect(onSelect).toHaveBeenCalledWith("PARENT");
  });

  it("appelle onSelect avec STUDENT", () => {
    const onSelect = jest.fn();
    render(<RoleFilterBar selected="ALL" onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId("role-filter-student"));
    expect(onSelect).toHaveBeenCalledWith("STUDENT");
  });

  it("appelle onSelect avec ALL quand on clique sur Tous", () => {
    const onSelect = jest.fn();
    render(<RoleFilterBar selected="TEACHER" onSelect={onSelect} />);
    fireEvent.press(screen.getByTestId("role-filter-all"));
    expect(onSelect).toHaveBeenCalledWith("ALL");
  });

  it("utilise le testID fourni", () => {
    render(
      <RoleFilterBar
        selected="ALL"
        onSelect={jest.fn()}
        testID="my-filter-bar"
      />,
    );
    expect(screen.getByTestId("my-filter-bar")).toBeOnTheScreen();
  });

  it("utilise le testID par defaut", () => {
    render(<RoleFilterBar selected="ALL" onSelect={jest.fn()} />);
    expect(screen.getByTestId("role-filter-bar")).toBeOnTheScreen();
  });
});
