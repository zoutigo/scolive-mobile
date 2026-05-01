import React from "react";
import { render, screen } from "@testing-library/react-native";
import TeacherClassDisciplineRoute from "../../app/(home)/classes/[classId]/discipline";

jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({
    children,
    showHeader,
  }: {
    children: React.ReactNode;
    showHeader?: boolean;
  }) => {
    const { Text } = require("react-native");
    return (
      <>
        <Text>
          {showHeader === false
            ? "shell-header-hidden"
            : "shell-header-visible"}
        </Text>
        {children}
      </>
    );
  },
}));

jest.mock(
  "../../src/components/discipline/TeacherClassDisciplineScreen",
  () => ({
    TeacherClassDisciplineScreen: () => {
      const { Text } = require("react-native");
      return <Text>teacher-class-discipline-screen</Text>;
    },
  }),
);

describe("TeacherClassDisciplineRoute", () => {
  it("branche la sous-route de classe sur l'écran discipline contextualisé", () => {
    render(<TeacherClassDisciplineRoute />);

    expect(screen.getByText("shell-header-hidden")).toBeTruthy();
    expect(screen.getByText("teacher-class-discipline-screen")).toBeTruthy();
  });
});
