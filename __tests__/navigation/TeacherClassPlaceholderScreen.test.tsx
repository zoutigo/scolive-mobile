import React from "react";
import { render, screen } from "@testing-library/react-native";
import { TeacherClassPlaceholderScreen } from "../../src/components/navigation/TeacherClassPlaceholderScreen";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn() }),
  useLocalSearchParams: () => ({ classId: "class-1" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../src/components/navigation/AppShell", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));

describe("TeacherClassPlaceholderScreen", () => {
  it("affiche un header contextualisé par classe", () => {
    render(
      <TeacherClassPlaceholderScreen
        moduleTitle="Fil de classe"
        moduleDescription="Description"
        testIDPrefix="teacher-class-feed"
      />,
    );

    expect(screen.getByTestId("teacher-class-feed-header")).toBeTruthy();
    expect(screen.getByTestId("teacher-class-feed-title")).toHaveTextContent(
      "Fil de classe",
    );
    expect(screen.getByTestId("teacher-class-feed-subtitle")).toHaveTextContent(
      "Classe class-1",
    );
  });
});
