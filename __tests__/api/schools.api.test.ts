import { schoolsApi } from "../../src/api/schools.api";
import { apiFetch } from "../../src/api/client";

jest.mock("../../src/api/client", () => ({ apiFetch: jest.fn() }));

const mockApiFetch = apiFetch as jest.Mock;

describe("schoolsApi — administrateur principal", () => {
  beforeEach(() => jest.clearAllMocks());

  it("listPlatformUsers appelle GET /system/platform-users sans recherche", async () => {
    mockApiFetch.mockResolvedValueOnce([]);
    await schoolsApi.listPlatformUsers();
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/system/platform-users",
      {},
      true,
    );
  });

  it("listPlatformUsers encode et trim la recherche", async () => {
    mockApiFetch.mockResolvedValueOnce([]);
    await schoolsApi.listPlatformUsers("  é &x ");
    expect(mockApiFetch).toHaveBeenCalledWith(
      `/system/platform-users?search=${encodeURIComponent("é &x")}`,
      {},
      true,
    );
  });

  it("listPlatformUsers ignore une recherche blanche", async () => {
    mockApiFetch.mockResolvedValueOnce([]);
    await schoolsApi.listPlatformUsers("   ");
    expect(mockApiFetch.mock.calls[0][0]).toBe("/system/platform-users");
  });

  it("replacePrimaryAdmin envoie PATCH { userId } avec auth", async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true });
    await schoolsApi.replacePrimaryAdmin("school-1", "platform-2");
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/system/schools/school-1/primary-admin",
      { method: "PATCH", body: JSON.stringify({ userId: "platform-2" }) },
      true,
    );
  });

  it("replacePrimaryAdmin propage les erreurs", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("Bad Request"));
    await expect(
      schoolsApi.replacePrimaryAdmin("school-1", "x"),
    ).rejects.toThrow("Bad Request");
  });

  it("createSchool envoie primaryAdminUserId", async () => {
    mockApiFetch.mockResolvedValueOnce({ school: { id: "s" } });
    await schoolsApi.createSchool({ name: "X", primaryAdminUserId: "p1" });
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/system/schools",
      {
        method: "POST",
        body: JSON.stringify({ name: "X", primaryAdminUserId: "p1" }),
      },
      true,
    );
  });
});
