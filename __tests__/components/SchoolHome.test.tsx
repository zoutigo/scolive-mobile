import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SchoolHome } from "../../src/components/home/SchoolHome";
import type { AuthUser } from "../../src/types/auth.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const schoolUser: AuthUser = {
  id: "u1",
  firstName: "Valery",
  lastName: "Mbele",
  platformRoles: [],
  memberships: [{ schoolId: "s1", role: "SCHOOL_ADMIN" }],
  profileCompleted: true,
  role: "SCHOOL_ADMIN",
  activeRole: "SCHOOL_ADMIN",
};

describe("SchoolHome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("navigue vers le fil depuis la navigation rapide", () => {
    render(<SchoolHome user={schoolUser} schoolSlug="college-vogt" />);

    fireEvent.press(screen.getByText("Fil d'actualité"));

    expect(mockPush).toHaveBeenCalledWith("/(home)/feed");
  });

  it("navigue vers la messagerie depuis la navigation rapide", () => {
    render(<SchoolHome user={schoolUser} schoolSlug="college-vogt" />);

    fireEvent.press(screen.getByText("Messagerie"));

    expect(mockPush).toHaveBeenCalledWith("/(home)/messages");
  });

  it("navigue vers les notes depuis la navigation rapide", () => {
    render(<SchoolHome user={schoolUser} schoolSlug="college-vogt" />);

    fireEvent.press(screen.getByText("Notes"));

    expect(mockPush).toHaveBeenCalledWith("/(home)/notes");
  });
});
