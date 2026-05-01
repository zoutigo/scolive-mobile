import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  StudentSelectField,
  type StudentSelectOption,
} from "../../src/components/discipline/StudentSelectField";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const OPTIONS: StudentSelectOption[] = [
  { value: "s1", label: "MBELE Lisa" },
  { value: "s2", label: "NTAMACK Remi" },
];

describe("StudentSelectField", () => {
  it("ouvre la liste et sélectionne un élève", () => {
    const onChange = jest.fn();
    render(
      <StudentSelectField
        label="Élève"
        value=""
        options={OPTIONS}
        onChange={onChange}
        testIDPrefix="student-select"
      />,
    );

    fireEvent.press(screen.getByTestId("student-select-trigger"));
    fireEvent.press(screen.getByTestId("student-select-option-s2"));

    expect(onChange).toHaveBeenCalledWith("s2");
  });

  it("filtre la liste via la recherche", () => {
    render(
      <StudentSelectField
        label="Élève"
        value=""
        options={OPTIONS}
        onChange={jest.fn()}
        testIDPrefix="student-select"
      />,
    );

    fireEvent.press(screen.getByTestId("student-select-trigger"));
    fireEvent.changeText(screen.getByTestId("student-select-search"), "lisa");

    expect(screen.getByTestId("student-select-option-s1")).toBeTruthy();
    expect(screen.queryByTestId("student-select-option-s2")).toBeNull();
  });
});
