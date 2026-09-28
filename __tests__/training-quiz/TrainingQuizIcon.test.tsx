import React from "react";
import { render } from "@testing-library/react-native";
import { TrainingQuizIcon } from "../../src/components/training-quiz/TrainingQuizIcon";

describe("TrainingQuizIcon", () => {
  it.each([
    "Users",
    "Settings",
    "Building2",
    "DoorOpen",
    "UserPlus",
    "TrendingUp",
    "CalendarClock",
  ])("renders the %s icon added for SCHOOL_ADMIN chapters", (name) => {
    const { toJSON } = render(<TrainingQuizIcon name={name} />);
    expect(toJSON()).toBeTruthy();
  });

  it("falls back to sparkles-outline for an unknown icon name", () => {
    const { toJSON } = render(<TrainingQuizIcon name="NotAnIcon" />);
    expect(toJSON()).toBeTruthy();
  });
});
