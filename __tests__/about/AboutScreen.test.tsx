import React from "react";
import { Linking } from "react-native";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { AboutScreen } from "../../src/components/about/AboutScreen";
import { siteContentApi } from "../../src/api/site-content.api";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/site-content.api", () => ({
  ...jest.requireActual("../../src/api/site-content.api"),
  siteContentApi: {
    getContactInfo: jest.fn(),
    getLegalDocument: jest.fn(),
    getAdminContactInfo: jest.fn(),
    updateContactInfo: jest.fn(),
    listLegalDocuments: jest.fn(),
    createLegalDocument: jest.fn(),
    updateLegalDocument: jest.fn(),
    publishLegalDocument: jest.fn(),
    deleteLegalDocument: jest.fn(),
    listContactSubmissions: jest.fn(),
    getContactSubmission: jest.fn(),
  },
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), canGoBack: () => true }),
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
  jest.spyOn(Linking, "openURL").mockResolvedValue(true as never);
});

describe("AboutScreen", () => {
  it("charge et affiche les coordonnées de contact", async () => {
    api.getContactInfo.mockResolvedValue({
      email: "contact@scolive.cm",
      phone: "+237 690000000",
      addressStreet: "Rue des Manguiers",
      addressDistrict: "Bastos",
      addressCity: "Yaoundé",
      addressCountry: "Cameroun",
      legalRepresentativeFirstName: "",
      legalRepresentativeLastName: "",
    });

    render(<AboutScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("about-screen-email")).toBeTruthy(),
    );
    expect(screen.getByText("contact@scolive.cm")).toBeTruthy();
    expect(screen.getByText("+237 690000000")).toBeTruthy();
    expect(
      screen.getByText("Rue des Manguiers, Bastos, Yaoundé, Cameroun"),
    ).toBeTruthy();
  });

  it("ouvre le client mail au tap sur l'email", async () => {
    api.getContactInfo.mockResolvedValue({
      email: "contact@scolive.cm",
      phone: "+237 690000000",
      addressStreet: "Rue des Manguiers",
      addressDistrict: "Bastos",
      addressCity: "Yaoundé",
      addressCountry: "Cameroun",
      legalRepresentativeFirstName: "",
      legalRepresentativeLastName: "",
    });

    render(<AboutScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("about-screen-email")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("about-screen-email"));

    expect(Linking.openURL).toHaveBeenCalledWith("mailto:contact@scolive.cm");
  });

  it("navigue vers le document légal correspondant", async () => {
    api.getContactInfo.mockResolvedValue({
      email: "contact@scolive.cm",
      phone: "+237 690000000",
      addressStreet: "Rue des Manguiers",
      addressDistrict: "Bastos",
      addressCity: "Yaoundé",
      addressCountry: "Cameroun",
      legalRepresentativeFirstName: "",
      legalRepresentativeLastName: "",
    });

    render(<AboutScreen />);
    await waitFor(() =>
      expect(screen.getByTestId("about-screen-legal-cgu")).toBeTruthy(),
    );

    fireEvent.press(screen.getByTestId("about-screen-legal-cgu"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/legal/[slug]",
      params: { slug: "cgu" },
    });
  });

  it("affiche une erreur si le chargement du contact échoue", async () => {
    api.getContactInfo.mockRejectedValue(new Error("boom"));

    render(<AboutScreen />);

    await waitFor(() =>
      expect(screen.getByTestId("about-screen-contact-error")).toBeTruthy(),
    );
  });
});
