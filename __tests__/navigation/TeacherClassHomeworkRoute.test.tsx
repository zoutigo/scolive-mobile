import React from "react";
import { render, screen } from "@testing-library/react-native";
import TeacherClassHomeworkRoute from "../../app/(home)/classes/[classId]/homework";

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
  useDrawer: () => ({ openDrawer: jest.fn(), closeDrawer: jest.fn() }),
}));

jest.mock("../../src/components/homework/ClassHomeworkScreen", () => ({
  ClassHomeworkScreen: () => {
    const { Text } = require("react-native");
    return <Text>class-homework-screen</Text>;
  },
}));

describe("TeacherClassHomeworkRoute", () => {
  it("branche la sous-route de classe sur l'écran homework contextualisé", () => {
    render(<TeacherClassHomeworkRoute />);

    expect(screen.getByText("shell-header-hidden")).toBeTruthy();
    expect(screen.getByText("class-homework-screen")).toBeTruthy();
  });
});
