import React from "react";
import { render, screen } from "@testing-library/react-native";
import TeacherClassTimetableRoute from "../../app/(home)/classes/[classId]/timetable";

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ classId: "class-6eC" }),
}));

jest.mock("../../src/store/teacher-class-nav.store", () => ({
  useTeacherClassNavStore: (selector: (state: unknown) => unknown) =>
    selector({
      classOptions: {
        classes: [{ classId: "class-6eC", className: "6eC" }],
      },
    }),
}));

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

jest.mock("../../src/components/timetable/TeacherAgendaScreen", () => ({
  TeacherAgendaScreenInner: ({
    initialTab,
    lockedClassId,
    lockedClassName,
    hideClassPicker,
    headerTitle,
    lockedClassTabLabel,
  }: {
    initialTab?: string;
    lockedClassId?: string;
    lockedClassName?: string;
    hideClassPicker?: boolean;
    headerTitle?: string;
    lockedClassTabLabel?: string;
  }) => {
    const { Text } = require("react-native");
    return (
      <>
        <Text>{initialTab ?? "none"}</Text>
        <Text>{lockedClassId ?? "no-class"}</Text>
        <Text>{lockedClassName ?? "no-class-name"}</Text>
        <Text>{hideClassPicker ? "hide-picker" : "show-picker"}</Text>
        <Text>{headerTitle ?? "no-header-title"}</Text>
        <Text>{lockedClassTabLabel ?? "no-class-tab-label"}</Text>
      </>
    );
  },
}));

describe("TeacherClassTimetableRoute", () => {
  it("branche la sous-route de classe sur l'agenda enseignant contextualisé", () => {
    render(<TeacherClassTimetableRoute />);

    expect(screen.getByText("shell-header-hidden")).toBeTruthy();
    expect(screen.getByText("classes")).toBeTruthy();
    expect(screen.getByText("class-6eC")).toBeTruthy();
    expect(screen.getByText("6eC")).toBeTruthy();
    expect(screen.getByText("hide-picker")).toBeTruthy();
    expect(screen.getAllByText("Emploi du temps")).toHaveLength(2);
  });
});
