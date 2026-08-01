import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { SiteContentAdminScreen } from "../../src/components/site-content/SiteContentAdminScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { siteContentApi } from "../../src/api/site-content.api";
import { useOnboardingTourStore } from "../../src/store/onboarding-tour.store";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    canGoBack: () => false,
    navigate: jest.fn(),
  }),
  useFocusEffect: (callback: () => void) => {
    const { useEffect } = require("react");
    useEffect(() => {
      callback();
    }, [callback]);
  },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: () => ({ openDrawer: jest.fn() }),
}));
jest.mock("../../src/store/auth.store");
jest.mock("../../src/api/site-content.api", () => ({
  siteContentApi: {
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

const mockApi = siteContentApi as jest.Mocked<typeof siteContentApi>;

const SUPER_ADMIN_USER = {
  id: "admin-1",
  firstName: "Admin",
  lastName: "Scolive",
  platformRoles: ["SUPER_ADMIN"],
  memberships: [],
  profileCompleted: true,
  role: "SUPER_ADMIN",
  activeRole: "SUPER_ADMIN",
  onboardingHelpEnabled: false,
};

const SCHOOL_ADMIN_USER = {
  ...SUPER_ADMIN_USER,
  platformRoles: [],
  role: "SCHOOL_ADMIN",
  activeRole: "SCHOOL_ADMIN",
};

function mockUser(user: typeof SUPER_ADMIN_USER) {
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector?: (state: { user: typeof user }) => unknown) =>
      selector ? selector({ user }) : { user },
  );
}

const CONTACT = {
  email: "contact@scolive.cm",
  phone: "+237 690000000",
  address: "Yaoundé, Cameroun",
  legalRepresentativeFirstName: "",
  legalRepresentativeLastName: "",
};

const LEGAL_ITEM = {
  id: "doc-1",
  slug: "cgu" as const,
  locale: "fr" as const,
  version: 1,
  title: "CGU",
  contentHtml: "<p>Contenu</p>",
  status: "DRAFT" as const,
  publishedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const SUBMISSION = {
  id: "sub-1",
  name: "Awa Ngono",
  email: "awa@example.cm",
  phone: "690000000",
  subject: "Demande de devis",
  message: "Bonjour, je souhaite en savoir plus sur Scolive.",
  readAt: null as string | null,
  readById: null as string | null,
  createdAt: "2026-08-01T10:00:00.000Z",
};

describe("SiteContentAdminScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingTourStore.setState({
      completedTours: {},
      activeTourId: null,
      activeRole: null,
      steps: [],
      stepIndex: 0,
      targetLayout: null,
    });
    mockApi.getAdminContactInfo.mockResolvedValue(CONTACT);
    mockApi.listLegalDocuments.mockResolvedValue([LEGAL_ITEM]);
    mockApi.listContactSubmissions.mockResolvedValue({
      items: [SUBMISSION],
      total: 1,
      page: 1,
      limit: 20,
    });
    mockApi.getContactSubmission.mockResolvedValue({
      ...SUBMISSION,
      readAt: "2026-08-01T12:00:00.000Z",
      readById: "admin-1",
    });
  });

  it("affiche un message restreint pour un rôle non plateforme", async () => {
    mockUser(SCHOOL_ADMIN_USER);
    render(<SiteContentAdminScreen />);

    expect(
      await screen.findByText("Réservé aux administrateurs de la plateforme."),
    ).toBeTruthy();
    expect(mockApi.getAdminContactInfo).not.toHaveBeenCalled();
  });

  it("charge et affiche le formulaire de contact pour un SUPER_ADMIN", async () => {
    mockUser(SUPER_ADMIN_USER);
    render(<SiteContentAdminScreen />);

    await waitFor(() => expect(mockApi.getAdminContactInfo).toHaveBeenCalled());
    expect(await screen.findByTestId("site-content-contact-email")).toHaveProp(
      "value",
      CONTACT.email,
    );
  });

  it("charge et affiche le formulaire de contact pour un ADMIN", async () => {
    mockUser({ ...SUPER_ADMIN_USER, activeRole: "ADMIN", role: "ADMIN" });
    render(<SiteContentAdminScreen />);

    await waitFor(() => expect(mockApi.getAdminContactInfo).toHaveBeenCalled());
    expect(
      await screen.findByTestId("site-content-contact-email"),
    ).toBeTruthy();
  });

  it("enregistre les nouvelles coordonnées de contact", async () => {
    mockUser(SUPER_ADMIN_USER);
    mockApi.updateContactInfo.mockResolvedValue({
      ...CONTACT,
      phone: "+237 699999999",
    });
    render(<SiteContentAdminScreen />);

    const phoneInput = await screen.findByTestId("site-content-contact-phone");
    fireEvent.changeText(phoneInput, "+237 699999999");

    await act(async () => {
      fireEvent.press(screen.getByTestId("site-content-contact-submit"));
    });

    await waitFor(() =>
      expect(mockApi.updateContactInfo).toHaveBeenCalledWith({
        ...CONTACT,
        phone: "+237 699999999",
      }),
    );
  });

  it("bascule vers l'onglet Documents légaux et liste les versions", async () => {
    mockUser(SUPER_ADMIN_USER);
    render(<SiteContentAdminScreen />);

    await screen.findByTestId("site-content-contact-email");
    fireEvent.press(screen.getByTestId("site-content-admin-tab-legal"));

    await waitFor(() => expect(mockApi.listLegalDocuments).toHaveBeenCalled());
    expect(screen.getByTestId("site-content-legal-publish-doc-1")).toBeTruthy();
    expect(screen.getByText(/Version 1/)).toBeTruthy();
  });

  it("bloque la création tant que le contenu est vide", async () => {
    mockUser(SUPER_ADMIN_USER);
    render(<SiteContentAdminScreen />);

    await screen.findByTestId("site-content-contact-email");
    fireEvent.press(screen.getByTestId("site-content-admin-tab-legal"));
    await screen.findByTestId("site-content-legal-publish-doc-1");

    fireEvent.press(screen.getByTestId("site-content-legal-new-draft"));
    fireEvent.changeText(
      screen.getByTestId("site-content-legal-draft-title"),
      "Nouvelle version",
    );

    await act(async () => {
      fireEvent.press(screen.getByTestId("site-content-legal-draft-submit"));
    });

    expect(mockApi.createLegalDocument).not.toHaveBeenCalled();
  });

  it("crée un nouveau brouillon de document légal une fois le contenu saisi", async () => {
    mockUser(SUPER_ADMIN_USER);
    mockApi.createLegalDocument.mockResolvedValue({
      ...LEGAL_ITEM,
      id: "doc-2",
      version: 2,
    });
    render(<SiteContentAdminScreen />);

    await screen.findByTestId("site-content-contact-email");
    fireEvent.press(screen.getByTestId("site-content-admin-tab-legal"));
    await screen.findByTestId("site-content-legal-publish-doc-1");

    fireEvent.press(screen.getByTestId("site-content-legal-new-draft"));
    fireEvent.changeText(
      screen.getByTestId("site-content-legal-draft-title"),
      "Nouvelle version",
    );
    fireEvent.press(screen.getAllByTestId("rich-editor-set-content")[0]);

    await act(async () => {
      fireEvent.press(screen.getByTestId("site-content-legal-draft-submit"));
    });

    await waitFor(() =>
      expect(mockApi.createLegalDocument).toHaveBeenCalledWith({
        slug: "cgu",
        locale: "fr",
        title: "Nouvelle version",
        contentHtml: "<p>Bonjour</p>",
      }),
    );
  });

  it("ouvre et ferme la modale d'aide via le bouton d'en-tête", async () => {
    mockUser(SUPER_ADMIN_USER);
    render(<SiteContentAdminScreen />);

    await screen.findByTestId("site-content-contact-email");
    expect(screen.queryByTestId("site-content-admin-help-title")).toBeNull();

    fireEvent.press(screen.getByTestId("site-content-admin-help-toggle"));
    expect(
      await screen.findByTestId("site-content-admin-help-title"),
    ).toHaveTextContent("Contenu du site");

    fireEvent.press(screen.getByTestId("site-content-admin-help-close"));
    await waitFor(() =>
      expect(screen.queryByTestId("site-content-admin-help-title")).toBeNull(),
    );
  });

  it("avance le tour guidé quand on touche l'onglet mis en surbrillance", async () => {
    mockUser(SUPER_ADMIN_USER);
    render(<SiteContentAdminScreen />);

    await screen.findByTestId("site-content-contact-email");

    act(() => {
      useOnboardingTourStore.getState().startTour("site-content", "platform", [
        {
          targetKey: "site-content-tour-tabs",
          titleKey: "onboardingTour.siteContent.step1Title",
          bodyKey: "onboardingTour.siteContent.step1Body",
          advanceOnTargetPress: true,
        },
        {
          targetKey: "site-content-tour-selectors",
          titleKey: "onboardingTour.siteContent.step2Title",
          bodyKey: "onboardingTour.siteContent.step2Body",
        },
      ]);
    });
    expect(useOnboardingTourStore.getState().stepIndex).toBe(0);

    fireEvent.press(screen.getByTestId("site-content-admin-tab-legal"));

    expect(useOnboardingTourStore.getState().stepIndex).toBe(1);
  });

  it("demande une confirmation avant de publier un document", async () => {
    mockUser(SUPER_ADMIN_USER);
    mockApi.publishLegalDocument.mockResolvedValue({
      ...LEGAL_ITEM,
      status: "PUBLISHED",
    });
    render(<SiteContentAdminScreen />);

    await screen.findByTestId("site-content-contact-email");
    fireEvent.press(screen.getByTestId("site-content-admin-tab-legal"));
    await screen.findByTestId("site-content-legal-publish-doc-1");

    fireEvent.press(screen.getByTestId("site-content-legal-publish-doc-1"));
    expect(await screen.findByText("Publier ce document ?")).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByTestId("confirm-dialog-confirm"));
    });

    await waitFor(() =>
      expect(mockApi.publishLegalDocument).toHaveBeenCalledWith("doc-1"),
    );
  });

  it("liste les prises de contact et marque la sélection comme lue", async () => {
    mockUser(SUPER_ADMIN_USER);
    render(<SiteContentAdminScreen />);

    await screen.findByTestId("site-content-contact-email");
    fireEvent.press(screen.getByTestId("site-content-admin-tab-messages"));

    await waitFor(() =>
      expect(mockApi.listContactSubmissions).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
      }),
    );
    expect(
      await screen.findByTestId("site-content-message-sub-1"),
    ).toBeTruthy();
    expect(screen.getByText("Awa Ngono")).toBeTruthy();
    expect(screen.getByText("Demande de devis")).toBeTruthy();

    fireEvent.press(screen.getByTestId("site-content-message-sub-1"));

    await screen.findByTestId("site-content-message-detail");
    expect(screen.getByText("awa@example.cm")).toBeTruthy();
    await waitFor(() =>
      expect(mockApi.getContactSubmission).toHaveBeenCalledWith("sub-1"),
    );
    expect(await screen.findByText("Message lu")).toBeTruthy();
  });

  it("affiche un état vide quand il n'y a aucune prise de contact", async () => {
    mockUser(SUPER_ADMIN_USER);
    mockApi.listContactSubmissions.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
    });
    render(<SiteContentAdminScreen />);

    await screen.findByTestId("site-content-contact-email");
    fireEvent.press(screen.getByTestId("site-content-admin-tab-messages"));

    expect(await screen.findByText("Aucune prise de contact.")).toBeTruthy();
  });
});
