import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { LegalDocumentScreen } from "../../src/components/about/LegalDocumentScreen";
import { siteContentApi } from "../../src/api/site-content.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/site-content.api");

let mockSlug = "cgu";
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ slug: mockSlug }),
}));

jest.mock("../../src/components/navigation/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("../../src/components/navigation/ModuleHeader", () => ({
  ModuleHeader: ({ title, testID }: { title: string; testID?: string }) => {
    const { Text } = require("react-native");
    return <Text testID={testID}>{title}</Text>;
  },
}));

const api = siteContentApi as jest.Mocked<typeof siteContentApi>;

beforeEach(() => {
  jest.clearAllMocks();
  mockSlug = "cgu";
});

describe("LegalDocumentScreen", () => {
  it("charge et affiche le document légal", async () => {
    api.getLegalDocument.mockResolvedValue({
      slug: "cgu",
      locale: "fr",
      title: "Conditions générales d'utilisation",
      contentHtml: "<p>Contenu des CGU</p>",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    render(<LegalDocumentScreen />);

    await waitFor(() =>
      expect(
        screen.getByText("Conditions générales d'utilisation"),
      ).toBeTruthy(),
    );
    expect(api.getLegalDocument).toHaveBeenCalledWith("cgu", "fr");
    expect(screen.getByText("<p>Contenu des CGU</p>")).toBeTruthy();
    expect(api.getContactInfo).not.toHaveBeenCalled();
    expect(screen.queryByTestId("legal-document-publisher-name")).toBeNull();
  });

  it("affiche une erreur si le chargement échoue", async () => {
    api.getLegalDocument.mockRejectedValue(new Error("boom"));

    render(<LegalDocumentScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("legal-document-error")).toBeTruthy(),
    );
  });

  it("affiche le responsable de publication sur les mentions légales", async () => {
    mockSlug = "mentions-legales";
    api.getLegalDocument.mockResolvedValue({
      slug: "mentions-legales",
      locale: "fr",
      title: "Mentions légales",
      contentHtml: "<p>Contenu</p>",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    api.getContactInfo.mockResolvedValue({
      email: "contact@scolive.cm",
      phone: "+237 690000000",
      address: "Yaoundé, Cameroun",
      legalRepresentativeFirstName: "Jean",
      legalRepresentativeLastName: "Dupont",
    });

    render(<LegalDocumentScreen />);

    expect(
      await screen.findByTestId("legal-document-publisher-name"),
    ).toHaveTextContent(/Jean Dupont/);
  });

  it("n'affiche pas le bloc responsable si le nom n'est pas renseigné", async () => {
    mockSlug = "mentions-legales";
    api.getLegalDocument.mockResolvedValue({
      slug: "mentions-legales",
      locale: "fr",
      title: "Mentions légales",
      contentHtml: "<p>Contenu</p>",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    api.getContactInfo.mockResolvedValue({
      email: "contact@scolive.cm",
      phone: "+237 690000000",
      address: "Yaoundé, Cameroun",
      legalRepresentativeFirstName: "",
      legalRepresentativeLastName: "",
    });

    render(<LegalDocumentScreen />);

    await screen.findByText("Mentions légales");
    expect(screen.queryByTestId("legal-document-publisher-name")).toBeNull();
  });
});
