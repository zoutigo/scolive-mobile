import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SchoolDetailScreen } from "../../src/components/schools/SchoolDetailScreen";
import { schoolsApi } from "../../src/api/schools.api";
import type { SchoolDetails } from "../../src/types/schools.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/schools.api");

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    canGoBack: jest.fn(() => true),
    navigate: jest.fn(),
  }),
  useLocalSearchParams: () => ({ schoolId: "school-1" }),
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("../../src/store/auth.store", () => ({
  useAuthStore: () => ({
    schoolSlug: null,
    user: {
      id: "super-admin-1",
      firstName: "Alice",
      lastName: "Ngassa",
      role: "SUPER_ADMIN",
      activeRole: "SUPER_ADMIN",
      schoolName: null,
    },
    logout: jest.fn(),
  }),
}));

jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));

const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
jest.mock("../../src/store/success-toast.store", () => ({
  useSuccessToastStore: (selector: (state: unknown) => unknown) =>
    selector({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
    }),
}));

const mockSchoolsApi = schoolsApi as jest.Mocked<typeof schoolsApi>;

function makeDetails(overrides?: Partial<SchoolDetails>): SchoolDetails {
  return {
    id: "school-1",
    slug: "college-vogt",
    name: "Collège Vogt",
    country: "Cameroun",
    region: "Centre",
    city: "Yaoundé",
    cycle: "SECONDARY",
    languageSystem: "FRANCOPHONE",
    logoUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    academicYear: {
      id: "year-1",
      label: "2025-2026",
      startsAt: "2025-09-01T00:00:00.000Z",
      endsAt: "2026-06-30T00:00:00.000Z",
    },
    stats: {
      usersCount: 42,
      classesCount: 6,
      studentsCount: 200,
      teachersCount: 12,
      gradesCount: 980,
    },
    roleBreakdown: {
      staff: 3,
      teachers: 12,
      parents: 150,
      students: 190,
    },
    schoolAdmins: [
      {
        id: "admin-1",
        firstName: "Sarah",
        lastName: "Moukouri",
        email: "sarah@vogt.cm",
        mustChangePassword: false,
        profileCompleted: true,
        canResendInvite: false,
      },
      {
        id: "admin-2",
        firstName: "Paul",
        lastName: "Etoa",
        email: "paul@vogt.cm",
        mustChangePassword: true,
        profileCompleted: false,
        canResendInvite: true,
      },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SchoolDetailScreen", () => {
  it("affiche un loader puis les sections détaillées de l'école", async () => {
    mockSchoolsApi.getSchoolDetails.mockResolvedValue(makeDetails());

    render(<SchoolDetailScreen />);

    expect(await screen.findByTestId("school-detail-identity")).toBeTruthy();
    expect(mockSchoolsApi.getSchoolDetails).toHaveBeenCalledWith("school-1");

    expect(screen.getByTestId("school-detail-academic")).toHaveTextContent(
      /2025-2026/,
    );
    expect(screen.getByTestId("school-detail-stat-staff")).toHaveTextContent(
      /3/,
    );
    expect(screen.getByTestId("school-detail-stat-teachers")).toHaveTextContent(
      /12/,
    );
    expect(screen.getByTestId("school-detail-stat-parents")).toHaveTextContent(
      /150/,
    );
    expect(screen.getByTestId("school-detail-stat-students")).toHaveTextContent(
      /190/,
    );
    expect(
      screen.getByTestId("school-detail-stat-students-total"),
    ).toHaveTextContent(/200/);
  });

  it("affiche le badge actif et le badge en attente pour les school admins", async () => {
    mockSchoolsApi.getSchoolDetails.mockResolvedValue(makeDetails());

    render(<SchoolDetailScreen />);

    const activeAdmin = await screen.findByTestId(
      "school-detail-admin-admin-1",
    );
    expect(activeAdmin).toHaveTextContent(/Actif/);
    expect(screen.queryByTestId("school-detail-resend-admin-1")).toBeNull();

    const pendingAdmin = screen.getByTestId("school-detail-admin-admin-2");
    expect(pendingAdmin).toHaveTextContent(/En attente/);
    expect(screen.getByTestId("school-detail-resend-admin-2")).toBeTruthy();
  });

  it("renvoie une invitation à un school admin en attente", async () => {
    mockSchoolsApi.getSchoolDetails.mockResolvedValue(makeDetails());
    mockSchoolsApi.resendSchoolAdminInvite.mockResolvedValue({ success: true });

    render(<SchoolDetailScreen />);

    fireEvent.press(await screen.findByTestId("school-detail-resend-admin-2"));

    await waitFor(() => {
      expect(mockSchoolsApi.resendSchoolAdminInvite).toHaveBeenCalledWith(
        "school-1",
        "admin-2",
      );
    });
    expect(mockShowSuccess).toHaveBeenCalled();
  });

  it("affiche une erreur si le renvoi d'invitation échoue", async () => {
    mockSchoolsApi.getSchoolDetails.mockResolvedValue(makeDetails());
    mockSchoolsApi.resendSchoolAdminInvite.mockRejectedValue(new Error("boom"));

    render(<SchoolDetailScreen />);

    fireEvent.press(await screen.findByTestId("school-detail-resend-admin-2"));

    await waitFor(() => expect(mockShowError).toHaveBeenCalled());
  });

  it("ajoute un school admin avec un email valide", async () => {
    mockSchoolsApi.getSchoolDetails.mockResolvedValue(makeDetails());
    mockSchoolsApi.addSchoolAdmin.mockResolvedValue({
      schoolAdmin: { id: "admin-3", email: "new@vogt.cm", firstName: "New" },
      userExisted: false,
      setupCompleted: false,
    });

    render(<SchoolDetailScreen />);

    await screen.findByTestId("school-detail-add-admin-form");
    fireEvent.changeText(
      screen.getByTestId("school-detail-add-admin-email"),
      "new@vogt.cm",
    );
    fireEvent.press(screen.getByTestId("school-detail-add-admin-submit"));

    await waitFor(() => {
      expect(mockSchoolsApi.addSchoolAdmin).toHaveBeenCalledWith("school-1", {
        email: "new@vogt.cm",
      });
    });
    expect(mockShowSuccess).toHaveBeenCalled();
  });

  it("affiche une erreur de validation sans appeler l'API pour un email invalide", async () => {
    mockSchoolsApi.getSchoolDetails.mockResolvedValue(makeDetails());

    render(<SchoolDetailScreen />);

    await screen.findByTestId("school-detail-add-admin-form");
    fireEvent.changeText(
      screen.getByTestId("school-detail-add-admin-email"),
      "not-an-email",
    );
    fireEvent.press(screen.getByTestId("school-detail-add-admin-submit"));

    expect(
      await screen.findByTestId("school-detail-add-admin-email-error"),
    ).toBeTruthy();
    expect(mockSchoolsApi.addSchoolAdmin).not.toHaveBeenCalled();
  });

  it("affiche un message adapté quand aucune année scolaire n'est active", async () => {
    mockSchoolsApi.getSchoolDetails.mockResolvedValue(
      makeDetails({ academicYear: null }),
    );

    render(<SchoolDetailScreen />);

    expect(
      await screen.findByTestId("school-detail-academic"),
    ).toHaveTextContent(/Aucune année scolaire active/);
  });

  it("affiche un état d'erreur si le chargement échoue", async () => {
    mockSchoolsApi.getSchoolDetails.mockRejectedValue(
      new Error("network down"),
    );

    render(<SchoolDetailScreen />);

    expect(
      await screen.findByTestId("school-detail-error-banner"),
    ).toBeTruthy();
  });
});
