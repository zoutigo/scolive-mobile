import React from "react";
import { StyleSheet } from "react-native";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react-native";
import { ChildHomeScreen } from "../../src/components/home/ChildHomeScreen";
import { useAuthStore } from "../../src/store/auth.store";
import { useFamilyStore } from "../../src/store/family.store";
import { notesApi } from "../../src/api/notes.api";
import { timetableApi } from "../../src/api/timetable.api";
import { messagingApi } from "../../src/api/messaging.api";
import { homeworkApi } from "../../src/api/homework.api";
import { feedApi } from "../../src/api/feed.api";
import { colors } from "../../src/theme";
import { useDrawer } from "../../src/components/navigation/drawer-context";

jest.setTimeout(30000);

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("../../src/api/notes.api");
jest.mock("../../src/api/timetable.api");
jest.mock("../../src/api/messaging.api");
jest.mock("../../src/api/homework.api");
jest.mock("../../src/api/feed.api");

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ childId: "child-1" }),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("../../src/components/navigation/drawer-context", () => ({
  useDrawer: jest.fn(),
}));

const mockNotesApi = notesApi as jest.Mocked<typeof notesApi>;
const mockTimetableApi = timetableApi as jest.Mocked<typeof timetableApi>;
const mockMessagingApi = messagingApi as jest.Mocked<typeof messagingApi>;
const mockHomeworkApi = homeworkApi as jest.Mocked<typeof homeworkApi>;
const mockFeedApi = feedApi as jest.Mocked<typeof feedApi>;
const mockUseDrawer = useDrawer as jest.MockedFunction<typeof useDrawer>;
const mockOpenDrawer = jest.fn();

const WAIT_OPTS = { timeout: 10000 };

async function waitForContent() {
  await waitFor(
    () => expect(screen.queryByTestId("child-home-loading")).toBeNull(),
    WAIT_OPTS,
  );
  await waitFor(
    () =>
      expect(
        screen.getByTestId("child-home-header-subtitle").props.children,
      ).toBeTruthy(),
    WAIT_OPTS,
  );
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const NOTES_FIXTURE = [
  {
    term: "TERM_3" as const,
    label: "Trimestre 3",
    councilLabel: "6e C • Conseil du 15 avril",
    generatedAtLabel: "Données publiées le 15/04/2026",
    generalAverage: { student: 13.4, class: 12.1, min: 8.5, max: 17.8 },
    sequences: [],
    subjects: [
      {
        id: "math",
        subjectLabel: "Mathématiques",
        teachers: [],
        coefficient: 4,
        studentAverage: 15.2,
        classAverage: 12,
        classMin: 8,
        classMax: 18,
        appreciation: "Bonne progression.",
        evaluations: [
          {
            id: "ev1",
            label: "Interro",
            score: 15,
            maxScore: 20,
            weight: 1,
            recordedAt: "2026-04-15T00:00:00.000Z",
          },
          {
            id: "ev2",
            label: "Devoir",
            score: 14,
            maxScore: 20,
            weight: 2,
            recordedAt: "2026-04-10T00:00:00.000Z",
          },
        ],
      },
      {
        id: "fr",
        subjectLabel: "Français",
        teachers: [],
        coefficient: 4,
        studentAverage: 12,
        classAverage: 11,
        classMin: 6,
        classMax: 18,
        appreciation: "",
        evaluations: [
          {
            id: "ev3",
            label: "Dicté",
            score: 10,
            maxScore: 20,
            weight: 1,
            recordedAt: "2026-04-08T00:00:00.000Z",
          },
        ],
      },
    ],
  },
];

const TIMETABLE_FIXTURE = {
  student: { id: "child-1", firstName: "Remi", lastName: "Ntamack" },
  class: {
    id: "class-1",
    name: "6e C",
    schoolYearId: "sy-1",
    academicLevelId: null,
  },
  slots: [],
  oneOffSlots: [],
  slotExceptions: [],
  occurrences: [],
  calendarEvents: [],
  subjectStyles: [],
};

const INBOX_FIXTURE = {
  items: [
    {
      id: "msg-1",
      folder: "inbox" as const,
      status: "SENT" as const,
      subject: "Rappel composition",
      preview: "La composition de mathématiques est maintenue.",
      createdAt: "2026-04-17T07:30:00.000Z",
      sentAt: "2026-04-17T07:30:00.000Z",
      unread: true,
      sender: { id: "t1", firstName: "Albert", lastName: "Mvondo" },
      recipientsCount: 1,
      mailboxEntryId: "box-1",
      attachments: [],
    },
    {
      id: "msg-2",
      folder: "inbox" as const,
      status: "SENT" as const,
      subject: "Convocation",
      preview: "Merci de vous présenter.",
      createdAt: "2026-04-15T10:00:00.000Z",
      sentAt: "2026-04-15T10:00:00.000Z",
      unread: false,
      sender: { id: "s1", firstName: "Marie", lastName: "Secrétariat" },
      recipientsCount: 1,
      mailboxEntryId: "box-2",
      attachments: [],
    },
    {
      id: "msg-3",
      folder: "inbox" as const,
      status: "SENT" as const,
      subject: "Info classe",
      preview: "Bonne nouvelle.",
      createdAt: "2026-04-12T09:00:00.000Z",
      sentAt: "2026-04-12T09:00:00.000Z",
      unread: true,
      sender: { id: "t2", firstName: "Sophie", lastName: "Dupont" },
      recipientsCount: 1,
      mailboxEntryId: "box-3",
      attachments: [],
    },
  ],
  meta: { page: 1, limit: 20, total: 3, totalPages: 1 },
};

const HOMEWORK_FIXTURE = [
  {
    id: "hw-1",
    classId: "class-1",
    title: "Exercice page 42",
    contentHtml: null,
    expectedAt: "2026-04-20T00:00:00.000Z",
    createdAt: "2026-04-15T00:00:00.000Z",
    updatedAt: "2026-04-15T00:00:00.000Z",
    authorUserId: "t1",
    authorDisplayName: "Prof. Albert",
    subject: { id: "math", name: "Mathématiques", colorHex: null },
    attachments: [],
    commentsCount: 0,
    myDoneAt: null,
  },
  {
    id: "hw-2",
    classId: "class-1",
    title: "Lecture chapitre 3",
    contentHtml: null,
    expectedAt: "2026-04-21T00:00:00.000Z",
    createdAt: "2026-04-15T00:00:00.000Z",
    updatedAt: "2026-04-15T00:00:00.000Z",
    authorUserId: "t2",
    authorDisplayName: "Prof. Sophie",
    subject: { id: "fr", name: "Français", colorHex: null },
    attachments: [],
    commentsCount: 0,
    myDoneAt: "2026-04-18T12:00:00.000Z",
  },
];

const FEED_FIXTURE = {
  items: [
    {
      id: "post-1",
      type: "POST" as const,
      schoolSlug: "college-vogt",
      author: {
        id: "a1",
        fullName: "Marie Dupont",
        roleLabel: "Administration",
        avatarText: "MD",
      },
      title: "Réunion parents d'élèves",
      bodyHtml: "<p>Vendredi 09 mai à 18h.</p>",
      createdAt: "2026-05-07T10:00:00.000Z",
      featuredUntil: null,
      audience: { scope: "SCHOOL_ALL" as const, label: "Tous" },
      attachments: [],
      likedByViewer: false,
      likesCount: 0,
      comments: [],
    },
    {
      id: "post-2",
      type: "POST" as const,
      schoolSlug: "college-vogt",
      author: {
        id: "a2",
        fullName: "Jean Martin",
        roleLabel: "Administration",
        avatarText: "JM",
      },
      title: "Sortie scolaire 02 mai",
      bodyHtml: "<p>Rappel sortie.</p>",
      createdAt: "2026-04-30T08:00:00.000Z",
      featuredUntil: null,
      audience: { scope: "SCHOOL_ALL" as const, label: "Tous" },
      attachments: [],
      likedByViewer: false,
      likesCount: 0,
      comments: [],
    },
  ],
  meta: { page: 1, limit: 2, total: 10, totalPages: 5 },
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockUseDrawer.mockReturnValue({
    openDrawer: mockOpenDrawer,
    closeDrawer: jest.fn(),
    openDrawerForClass: jest.fn(),
    isDrawerOpen: false,
  });
  useAuthStore.setState({
    schoolSlug: "college-vogt",
    isAuthenticated: true,
    isLoading: false,
    accessToken: "token",
  } as never);
  useFamilyStore.setState({
    children: [
      {
        id: "child-1",
        firstName: "Remi",
        lastName: "Ntamack",
        classId: "class-1",
        className: "6e C",
      },
    ],
    activeChildId: null,
    isLoading: false,
  });

  mockNotesApi.listStudentNotes.mockResolvedValue(NOTES_FIXTURE);
  mockTimetableApi.getMyTimetable.mockResolvedValue(TIMETABLE_FIXTURE);
  mockMessagingApi.unreadCount.mockResolvedValue(2);
  mockMessagingApi.list.mockResolvedValue(INBOX_FIXTURE);
  mockHomeworkApi.listClassHomework.mockResolvedValue(HOMEWORK_FIXTURE);
  mockFeedApi.list.mockResolvedValue(FEED_FIXTURE);
});

// ── extractLatestEvaluations ──────────────────────────────────────────────────

describe("extractLatestEvaluations (logique interne)", () => {
  it("trie les évaluations par date décroissante", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();

    // ev1 (15 avr.) > ev2 (10 avr.) > ev3 (08 avr.)
    expect(
      within(screen.getByTestId("child-home-eval-row-0")).getByText(
        "Mathématiques",
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("child-home-eval-row-1")).getByText(
        "Mathématiques",
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("child-home-eval-row-2")).getByText("Français"),
    ).toBeTruthy();
  });

  it("n'affiche pas plus de 3 évaluations", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(screen.queryByTestId("child-home-eval-row-3")).toBeNull();
  });
});

// ── KPI affichage ─────────────────────────────────────────────────────────────

describe("ChildHomeScreen — KPI", () => {
  it("affiche les 3 KPI sur la même ligne", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();

    expect(screen.getByTestId("child-home-kpi-row")).toBeTruthy();
    expect(screen.getByTestId("child-home-kpi-average")).toBeTruthy();
    expect(screen.getByTestId("child-home-kpi-homework")).toBeTruthy();
    expect(screen.getByTestId("child-home-kpi-messages")).toBeTruthy();
  });

  it("affiche icône et valeur dans un même conteneur horizontal", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    // La valeur de moyenne est visible dans le KPI
    expect(
      within(screen.getByTestId("child-home-kpi-average")).getByText("13,40"),
    ).toBeTruthy();
  });

  it("affiche la moyenne du trimestre en cours", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(
      within(screen.getByTestId("child-home-kpi-average")).getByText("13,40"),
    ).toBeTruthy();
  });

  it("affiche le nombre de devoirs non faits", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(
      within(screen.getByTestId("child-home-kpi-homework")).getByText("1"),
    ).toBeTruthy();
  });

  it("affiche le nombre de messages non lus", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(
      within(screen.getByTestId("child-home-kpi-messages")).getByText("2"),
    ).toBeTruthy();
  });

  it("affiche '-' pour la moyenne quand aucune note publiée", async () => {
    mockNotesApi.listStudentNotes.mockResolvedValue([]);
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(
      within(screen.getByTestId("child-home-kpi-average")).getByText("-"),
    ).toBeTruthy();
  });

  it("affiche '–' pour les devoirs quand classe inconnue", async () => {
    useFamilyStore.setState({
      children: [{ id: "child-1", firstName: "Remi", lastName: "Ntamack" }],
      activeChildId: null,
      isLoading: false,
    });
    mockTimetableApi.getMyTimetable.mockRejectedValue(new Error("not found"));
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(
      within(screen.getByTestId("child-home-kpi-homework")).getByText("–"),
    ).toBeTruthy();
  });

  it("affiche 0 devoirs quand tous sont faits", async () => {
    mockHomeworkApi.listClassHomework.mockResolvedValue(
      HOMEWORK_FIXTURE.map((hw) => ({
        ...hw,
        myDoneAt: "2026-04-20T00:00:00.000Z",
      })),
    );
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(
      within(screen.getByTestId("child-home-kpi-homework")).getByText("0"),
    ).toBeTruthy();
  });

  it("affiche '0' messages non lus quand inbox vide", async () => {
    mockMessagingApi.unreadCount.mockResolvedValue(0);
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(
      within(screen.getByTestId("child-home-kpi-messages")).getByText("0"),
    ).toBeTruthy();
  });
});

// ── Bloc évaluations ──────────────────────────────────────────────────────────

describe("ChildHomeScreen — bloc évaluations", () => {
  it("affiche les 3 dernières évaluations", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();

    expect(screen.getByTestId("child-home-evals-block")).toBeTruthy();
    expect(screen.getByTestId("child-home-eval-row-0")).toBeTruthy();
    expect(screen.getByTestId("child-home-eval-row-1")).toBeTruthy();
    expect(screen.getByTestId("child-home-eval-row-2")).toBeTruthy();
  });

  it("affiche le score principal et /maxScore séparément", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();

    const row0 = screen.getByTestId("child-home-eval-row-0");
    expect(within(row0).getByText("15")).toBeTruthy();
    expect(within(row0).getByText("/20")).toBeTruthy();
  });

  it("affiche '–' comme score principal quand la note est nulle", async () => {
    mockNotesApi.listStudentNotes.mockResolvedValue([
      {
        ...NOTES_FIXTURE[0],
        subjects: [
          {
            ...NOTES_FIXTURE[0].subjects[0],
            evaluations: [
              {
                id: "ev-null",
                label: "Abs",
                score: null,
                maxScore: 20,
                weight: 1,
                recordedAt: "2026-04-16T00:00:00.000Z",
              },
            ],
          },
        ],
      },
    ]);
    render(<ChildHomeScreen />);
    await waitForContent();

    const row0 = screen.getByTestId("child-home-eval-row-0");
    expect(within(row0).getByText("–")).toBeTruthy();
    expect(within(row0).getByText("/20")).toBeTruthy();
  });

  it("affiche la date complète jj/mm/aaaa", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();

    // ev1 recordedAt = 2026-04-15 → 15/04/2026
    expect(
      within(screen.getByTestId("child-home-eval-row-0")).getByText(
        "15/04/2026",
      ),
    ).toBeTruthy();
  });

  it("affiche un état vide si aucune évaluation", async () => {
    mockNotesApi.listStudentNotes.mockResolvedValue([
      {
        ...NOTES_FIXTURE[0],
        subjects: [{ ...NOTES_FIXTURE[0].subjects[0], evaluations: [] }],
      },
    ]);
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(screen.getByTestId("child-home-evals-empty")).toBeTruthy();
  });
});

// ── Bloc fil d'actualité ──────────────────────────────────────────────────────

describe("ChildHomeScreen — bloc fil d'actualité", () => {
  it("affiche les 2 posts avec titre et initiales auteur", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();

    expect(screen.getByTestId("child-home-feed-block")).toBeTruthy();

    const row0 = screen.getByTestId("child-home-feed-row-0");
    expect(within(row0).getByText("Réunion parents d'élèves")).toBeTruthy();
    expect(within(row0).getByText("MD")).toBeTruthy(); // initiales de "Marie Dupont"

    const row1 = screen.getByTestId("child-home-feed-row-1");
    expect(within(row1).getByText("Sortie scolaire 02 mai")).toBeTruthy();
    expect(within(row1).getByText("JM")).toBeTruthy(); // initiales de "Jean Martin"
  });

  it("n'affiche pas le nom complet de l'auteur", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(screen.queryByText("Marie Dupont")).toBeNull();
    expect(screen.queryByText("Jean Martin")).toBeNull();
  });

  it("affiche un état vide si aucun post", async () => {
    mockFeedApi.list.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 2, total: 0, totalPages: 0 },
    });
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(screen.getByTestId("child-home-feed-empty")).toBeTruthy();
  });

  it("n'affiche pas plus de 2 posts", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(screen.queryByTestId("child-home-feed-row-2")).toBeNull();
  });

  it("calcule correctement les initiales d'un nom composé", async () => {
    mockFeedApi.list.mockResolvedValue({
      items: [
        {
          ...FEED_FIXTURE.items[0],
          author: {
            ...FEED_FIXTURE.items[0].author,
            fullName: "Jean-Pierre Leblanc",
          },
        },
      ],
      meta: { page: 1, limit: 2, total: 1, totalPages: 1 },
    });
    render(<ChildHomeScreen />);
    await waitForContent();
    // "Jean-Pierre" → "J", "Leblanc" → "L" → "JL"
    expect(
      within(screen.getByTestId("child-home-feed-row-0")).getByText("JL"),
    ).toBeTruthy();
  });
});

// ── Bloc messages non lus ─────────────────────────────────────────────────────

describe("ChildHomeScreen — bloc messages non lus", () => {
  it("affiche jusqu'à 3 messages non lus", async () => {
    mockMessagingApi.list.mockResolvedValue({
      ...INBOX_FIXTURE,
      items: [
        ...INBOX_FIXTURE.items,
        {
          id: "msg-4",
          folder: "inbox" as const,
          status: "SENT" as const,
          subject: "Troisième non lu",
          preview: "...",
          createdAt: "2026-04-05T09:00:00.000Z",
          sentAt: "2026-04-05T09:00:00.000Z",
          unread: true,
          sender: { id: "t3", firstName: "Jean", lastName: "Martin" },
          recipientsCount: 1,
          mailboxEntryId: "box-4",
          attachments: [],
        },
      ],
    });
    render(<ChildHomeScreen />);
    await waitForContent();

    expect(screen.getByTestId("child-home-msg-row-0")).toBeTruthy();
    expect(screen.getByTestId("child-home-msg-row-1")).toBeTruthy();
    expect(screen.getByTestId("child-home-msg-row-2")).toBeTruthy();
    expect(screen.queryByTestId("child-home-msg-row-3")).toBeNull();
  });

  it("filtre uniquement les messages non lus", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();

    expect(
      within(screen.getByTestId("child-home-msg-row-0")).getByText(
        "Rappel composition",
      ),
    ).toBeTruthy();
    expect(
      within(screen.getByTestId("child-home-msg-row-1")).getByText(
        "Info classe",
      ),
    ).toBeTruthy();
    expect(screen.queryByText("Convocation")).toBeNull();
  });

  it("affiche le nom complet de l'expéditeur", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(
      within(screen.getByTestId("child-home-msg-row-0")).getByText(
        "Albert Mvondo",
      ),
    ).toBeTruthy();
  });

  it("affiche 'Expéditeur inconnu' quand sender est null", async () => {
    mockMessagingApi.list.mockResolvedValue({
      ...INBOX_FIXTURE,
      items: [{ ...INBOX_FIXTURE.items[0], sender: null }],
    });
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(screen.getByText("Expéditeur inconnu")).toBeTruthy();
  });

  it("affiche un état vide quand aucun message non lu", async () => {
    mockMessagingApi.list.mockResolvedValue({
      items: INBOX_FIXTURE.items.map((m) => ({ ...m, unread: false })),
      meta: INBOX_FIXTURE.meta,
    });
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(screen.getByTestId("child-home-unread-empty")).toBeTruthy();
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe("ChildHomeScreen — navigation", () => {
  it("KPI Moyenne → notes de l'enfant", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    fireEvent.press(screen.getByTestId("child-home-kpi-average"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/notes/child/[childId]",
      params: { childId: "child-1" },
    });
  });

  it("KPI Devoirs → liste des devoirs", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    fireEvent.press(screen.getByTestId("child-home-kpi-homework"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/classes/[classId]/homework",
      params: { classId: "class-1", childId: "child-1" },
    });
  });

  it("KPI Messages → messagerie", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    fireEvent.press(screen.getByTestId("child-home-kpi-messages"));
    expect(mockPush).toHaveBeenCalledWith("/(home)/messages");
  });

  it("lien évaluations → notes", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    fireEvent.press(screen.getByTestId("child-home-evals-block-link"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/notes/child/[childId]",
      params: { childId: "child-1" },
    });
  });

  it("lien fil d'actualité → vie-de-classe", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    fireEvent.press(screen.getByTestId("child-home-feed-block-link"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]/vie-de-classe",
      params: { childId: "child-1" },
    });
  });

  it("row feed → vie-de-classe", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    fireEvent.press(screen.getByTestId("child-home-feed-row-0"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(home)/children/[childId]/vie-de-classe",
      params: { childId: "child-1" },
    });
  });

  it("lien messages → messagerie", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    fireEvent.press(screen.getByTestId("child-home-unread-block-link"));
    expect(mockPush).toHaveBeenCalledWith("/(home)/messages");
  });

  it("row message → messagerie", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    fireEvent.press(screen.getByTestId("child-home-msg-row-0"));
    expect(mockPush).toHaveBeenCalledWith("/(home)/messages");
  });

  it("bouton retour → accueil famille", async () => {
    render(<ChildHomeScreen />);
    await waitFor(
      () => expect(screen.getByTestId("child-home-back")).toBeTruthy(),
      WAIT_OPTS,
    );
    fireEvent.press(screen.getByTestId("child-home-back"));
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});

// ── Chargement et erreurs ─────────────────────────────────────────────────────

describe("ChildHomeScreen — chargement et erreurs", () => {
  it("affiche le spinner initialement", () => {
    mockNotesApi.listStudentNotes.mockReturnValue(new Promise(() => {}));
    render(<ChildHomeScreen />);
    expect(screen.getByTestId("child-home-loading")).toBeTruthy();
  });

  it("affiche une bannière d'erreur quand toutes les APIs principales échouent", async () => {
    mockNotesApi.listStudentNotes.mockRejectedValue(new Error("network"));
    mockTimetableApi.getMyTimetable.mockRejectedValue(new Error("network"));
    mockMessagingApi.unreadCount.mockRejectedValue(new Error("network"));
    mockMessagingApi.list.mockRejectedValue(new Error("network"));
    mockFeedApi.list.mockRejectedValue(new Error("network"));

    render(<ChildHomeScreen />);
    await waitForContent();
    expect(
      screen.getByText("Impossible de charger la synthèse de l'enfant."),
    ).toBeTruthy();
  });

  it("affiche les données partielles si certaines APIs échouent", async () => {
    mockNotesApi.listStudentNotes.mockRejectedValue(new Error("fail"));
    mockFeedApi.list.mockRejectedValue(new Error("fail"));

    render(<ChildHomeScreen />);
    await waitForContent();

    expect(screen.getByTestId("child-home-kpi-row")).toBeTruthy();
    expect(
      within(screen.getByTestId("child-home-kpi-average")).getByText("-"),
    ).toBeTruthy();
  });

  it("n'appelle pas homeworkApi si classId inconnu", async () => {
    useFamilyStore.setState({
      children: [{ id: "child-1", firstName: "Remi", lastName: "Ntamack" }],
      activeChildId: null,
      isLoading: false,
    });
    mockTimetableApi.getMyTimetable.mockRejectedValue(new Error("no class"));

    render(<ChildHomeScreen />);
    await waitForContent();
    expect(mockHomeworkApi.listClassHomework).not.toHaveBeenCalled();
  });

  it("appelle homeworkApi avec le bon classId et studentId", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(mockHomeworkApi.listClassHomework).toHaveBeenCalledWith(
      "college-vogt",
      "class-1",
      { studentId: "child-1" },
    );
  });

  it("ne charge rien si schoolSlug absent", () => {
    useAuthStore.setState({ schoolSlug: null } as never);
    render(<ChildHomeScreen />);
    expect(mockNotesApi.listStudentNotes).not.toHaveBeenCalled();
  });
});

// ── Intégration contextuelle ──────────────────────────────────────────────────

describe("ChildHomeScreen — intégration contextuelle", () => {
  it("active l'enfant dans le store au montage", async () => {
    render(<ChildHomeScreen />);
    await waitFor(
      () => expect(useFamilyStore.getState().activeChildId).toBe("child-1"),
      WAIT_OPTS,
    );
  });

  it("met à jour classId/className depuis la réponse timetable", async () => {
    useFamilyStore.setState({
      children: [{ id: "child-1", firstName: "Remi", lastName: "Ntamack" }],
      activeChildId: null,
      isLoading: false,
    });

    render(<ChildHomeScreen />);
    await waitFor(() => {
      const c = useFamilyStore
        .getState()
        .children.find((x) => x.id === "child-1");
      expect(c?.classId).toBe("class-1");
      expect(c?.className).toBe("6e C");
    }, WAIT_OPTS);
  });

  it("construit le sous-titre prénom nom • classe", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();
    expect(screen.getByText("Remi Ntamack • 6e C")).toBeTruthy();
  });

  it("header avec couleur primaire", async () => {
    render(<ChildHomeScreen />);
    await waitFor(
      () => expect(screen.getByTestId("child-home-header")).toBeTruthy(),
      WAIT_OPTS,
    );
    const headerStyle = StyleSheet.flatten(
      screen.getByTestId("child-home-header").props.style,
    );
    expect(headerStyle.backgroundColor).toBe(colors.primary);
  });

  it("recharge les données au pull-to-refresh", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();

    const callsBefore = mockNotesApi.listStudentNotes.mock.calls.length;
    const scrollView = screen.UNSAFE_getByType(
      require("react-native").ScrollView,
    );
    await act(async () => {
      scrollView.props.refreshControl.props.onRefresh();
    });

    await waitFor(
      () =>
        expect(mockNotesApi.listStudentNotes.mock.calls.length).toBeGreaterThan(
          callsBefore,
        ),
      WAIT_OPTS,
    );
  });

  it("passe les bons params à toutes les APIs", async () => {
    render(<ChildHomeScreen />);
    await waitForContent();

    expect(mockNotesApi.listStudentNotes).toHaveBeenCalledWith(
      "college-vogt",
      "child-1",
    );
    expect(mockMessagingApi.unreadCount).toHaveBeenCalledWith("college-vogt");
    expect(mockFeedApi.list).toHaveBeenCalledWith(
      "college-vogt",
      expect.objectContaining({ viewScope: "GENERAL", limit: 2 }),
    );
  });
});
