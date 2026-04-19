import { accountApi } from "../../src/api/account.api";
import { apiFetch } from "../../src/api/client";

jest.mock("../../src/api/client", () => ({
  apiFetch: jest.fn(),
}));

const mockApiFetch = apiFetch as jest.MockedFunction<typeof apiFetch>;

describe("accountApi", () => {
  beforeEach(() => {
    mockApiFetch.mockReset();
  });

  it("charge /me avec authentification", async () => {
    const response = {
      firstName: "Remi",
      lastName: "Ntamack",
      gender: "M",
      email: "remi@example.com",
      phone: "237650123456",
      role: "PARENT",
      schoolSlug: "college-vogt",
    };
    mockApiFetch.mockResolvedValueOnce(response);

    const result = await accountApi.getMe();

    expect(mockApiFetch).toHaveBeenCalledWith("/me", {}, true);
    expect(result).toEqual(response);
  });

  it("met à jour le profil via PUT /me/profile", async () => {
    const payload = {
      firstName: "Remi",
      lastName: "Ntamack",
      gender: "M" as const,
      phone: "650123456",
    };
    mockApiFetch.mockResolvedValueOnce({
      ...payload,
      email: "remi@example.com",
      role: "PARENT",
      schoolSlug: "college-vogt",
    });

    await accountApi.updateProfile(payload);

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/me/profile",
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      true,
    );
  });

  it("enregistre la récupération via POST /auth/recovery/update", async () => {
    const payload = {
      birthDate: "2026-04-05",
      answers: [
        { questionKey: "BIRTH_CITY", answer: "Yaoundé" },
        { questionKey: "FAVORITE_SPORT", answer: "Football" },
        { questionKey: "FAVORITE_BOOK", answer: "L'Étranger" },
      ],
      parentClassId: "class-1",
      parentStudentId: "student-1",
    };
    mockApiFetch.mockResolvedValueOnce(undefined);

    await accountApi.updateRecovery(payload);

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/auth/recovery/update",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true,
    );
  });
});
