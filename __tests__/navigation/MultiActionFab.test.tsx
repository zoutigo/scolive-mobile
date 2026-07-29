import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { MultiActionFab } from "../../src/components/navigation/MultiActionFab";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("MultiActionFab — une seule action", () => {
  it("rend un FAB simple qui déclenche directement l'action, sans menu", () => {
    const onPress = jest.fn();
    render(
      <MultiActionFab
        bottom={20}
        actions={[
          {
            key: "add",
            icon: "add",
            label: "Ajouter",
            onPress,
            testID: "fab-add",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("fab-add")).toBeTruthy();
    expect(screen.queryByTestId("multi-action-fab")).toBeNull();

    fireEvent.press(screen.getByTestId("fab-add"));
    expect(onPress).toHaveBeenCalled();
  });
});

describe("MultiActionFab — aucune action", () => {
  it("ne rend rien", () => {
    render(<MultiActionFab bottom={20} actions={[]} />);
    expect(screen.queryByTestId("multi-action-fab")).toBeNull();
  });
});

describe("MultiActionFab — plusieurs actions", () => {
  const actions = [
    {
      key: "add-student",
      icon: "person-add-outline" as const,
      label: "Ajouter un élève",
      onPress: jest.fn(),
      testID: "fab-add-student",
    },
    {
      key: "set-referent",
      icon: "person-outline" as const,
      label: "Définir l'enseignant référent",
      onPress: jest.fn(),
      testID: "fab-set-referent",
    },
  ];

  beforeEach(() => {
    actions[0].onPress = jest.fn();
    actions[1].onPress = jest.fn();
  });

  it("rend un seul FAB '⋮' au lieu d'un FAB par action", () => {
    render(
      <MultiActionFab
        bottom={20}
        testID="class-students-fab"
        actions={actions}
      />,
    );
    expect(screen.getByTestId("class-students-fab")).toBeTruthy();
    expect(screen.queryByTestId("fab-add-student")).toBeNull();
    expect(screen.queryByTestId("fab-set-referent")).toBeNull();
  });

  it("déplie le menu avec les deux actions au tap sur le FAB", () => {
    render(
      <MultiActionFab
        bottom={20}
        testID="class-students-fab"
        actions={actions}
      />,
    );
    fireEvent.press(screen.getByTestId("class-students-fab"));
    expect(screen.getByTestId("fab-add-student")).toBeTruthy();
    expect(screen.getByTestId("fab-set-referent")).toBeTruthy();
    expect(screen.getByText("Ajouter un élève")).toBeTruthy();
    expect(screen.getByText("Définir l'enseignant référent")).toBeTruthy();
  });

  it("appelle l'action choisie et referme le menu", () => {
    render(
      <MultiActionFab
        bottom={20}
        testID="class-students-fab"
        actions={actions}
      />,
    );
    fireEvent.press(screen.getByTestId("class-students-fab"));
    fireEvent.press(screen.getByTestId("fab-add-student"));

    expect(actions[0].onPress).toHaveBeenCalled();
    expect(actions[1].onPress).not.toHaveBeenCalled();
  });

  it("referme le menu sans déclencher d'action quand on choisit une action", () => {
    render(
      <MultiActionFab
        bottom={20}
        testID="class-students-fab"
        actions={actions}
      />,
    );
    fireEvent.press(screen.getByTestId("class-students-fab"));
    expect(screen.getByTestId("class-students-fab-menu")).toBeTruthy();

    fireEvent.press(screen.getByTestId("fab-set-referent"));

    expect(actions[0].onPress).not.toHaveBeenCalled();
    expect(actions[1].onPress).toHaveBeenCalled();
    expect(screen.queryByTestId("class-students-fab-menu")).toBeNull();
  });
});
