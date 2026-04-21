"use strict";

/**
 * Mock HTTP server pour les tests E2E — remplace l'API réelle sur le port 3001.
 *
 * Endpoints applicatifs (appelés depuis l'app Android via 10.0.2.2:3001) :
 *   POST /api/auth/login-phone                  → pilotée par currentScenario
 *   POST /api/auth/login                        → pilotée par currentEmailLoginScenario
 *   POST /api/auth/sso/login                    → login Google mocké pour flow auth-google
 *   POST /api/auth/logout                       → 204
 *   POST /api/auth/refresh                      → 401
 *   GET  /api/health                            → 200
 *   GET  /api/auth/onboarding/options           → pilotée par currentOnboardingScenario
 *   POST /api/auth/onboarding/complete          → pilotée par currentOnboardingScenario
 *   POST /api/auth/forgot-pin/options           → pilotée par currentPinScenario
 *   POST /api/auth/forgot-pin/verify            → pilotée par currentPinScenario
 *   POST /api/auth/forgot-pin/complete          → pilotée par currentPinScenario
 *   POST /api/auth/forgot-password/request      → pilotée par currentPwdScenario
 *   POST /api/auth/forgot-password/options      → pilotée par currentPwdScenario
 *   POST /api/auth/forgot-password/verify       → pilotée par currentPwdScenario
 *   POST /api/auth/forgot-password/complete     → pilotée par currentPwdScenario
 *
 * Endpoints de contrôle (appelés depuis les tests Jest sur localhost:3001) :
 *   POST /__scenario              → change le scénario de login téléphone
 *   POST /__scenario/email-login  → change le scénario de login email
 *   POST /__scenario/onboarding   → change le scénario d'onboarding
 *   POST /__scenario/pin          → change le scénario de récupération PIN
 *   POST /__scenario/password     → change le scénario de récupération mot de passe
 *   POST /__scenario/discipline   → change le scénario discipline
 *   POST /__scenario/account      → change le scénario compte (phone_only_user | email_only_user)
 *   GET  /__state/account         → état des mutations compte (emailAdded, passwordCreated, etc.)
 *   POST /__reset                 → réinitialise les fixtures en mémoire
 */

const http = require("http");
const net = require("net");

// ────────────────────────── Scénarios ──────────────────────────

const SCENARIOS = {
  happy_path: {
    status: 200,
    body: {
      accessToken: "e2e-access-token-valid",
      refreshToken: "e2e-refresh-token-valid",
      tokenType: "Bearer",
      expiresIn: 86400,
      refreshExpiresIn: 2592000,
      schoolSlug: null,
      csrfToken: "e2e-csrf",
    },
  },

  invalid_credentials: {
    status: 401,
    body: {
      message: "Invalid credentials",
      error: "Unauthorized",
      statusCode: 401,
    },
  },

  rate_limited: {
    status: 429,
    body: {
      code: "AUTH_RATE_LIMITED",
      message: "Too many attempts",
      statusCode: 429,
    },
  },

  account_suspended: {
    status: 403,
    body: {
      code: "ACCOUNT_SUSPENDED",
      message: "Account suspended",
      statusCode: 403,
    },
  },

  not_activated: {
    status: 403,
    body: {
      code: "ACCOUNT_VALIDATION_REQUIRED",
      message: "Account not activated",
      statusCode: 403,
    },
  },

  // Simule une erreur réseau : la socket est détruite avant l'envoi d'une réponse
  network_error: { closeImmediately: true },
  profile_setup_required: {
    status: 403,
    body: {
      code: "PROFILE_SETUP_REQUIRED",
      message: "Profile setup required",
      statusCode: 403,
      schoolSlug: "ecole-demo",
      setupToken: "setup-token-phone",
    },
  },
};

const EMAIL_LOGIN_SCENARIOS = {
  happy_path: {
    status: 200,
    body: {
      accessToken: "e2e-email-access-token-valid",
      refreshToken: "e2e-email-refresh-token-valid",
      tokenType: "Bearer",
      expiresIn: 86400,
      refreshExpiresIn: 2592000,
      schoolSlug: "ecole-demo",
      csrfToken: "e2e-csrf",
    },
  },
  discipline_admin: {
    status: 200,
    body: {
      accessToken: "e2e-discipline-admin-access-token-valid",
      refreshToken: "e2e-discipline-admin-refresh-token-valid",
      tokenType: "Bearer",
      expiresIn: 86400,
      refreshExpiresIn: 2592000,
      schoolSlug: "ecole-demo",
      csrfToken: "e2e-discipline-admin-csrf",
    },
  },
  password_change_required: {
    status: 403,
    body: {
      code: "PASSWORD_CHANGE_REQUIRED",
      message: "Password change required",
      statusCode: 403,
      email: "parent@ecole.cm",
      schoolSlug: "ecole-demo",
    },
  },
  invalid_credentials: {
    status: 401,
    body: {
      message: "Invalid credentials",
      error: "Unauthorized",
      statusCode: 401,
    },
  },
  rate_limited: {
    status: 429,
    body: {
      code: "AUTH_RATE_LIMITED",
      message: "Too many attempts",
      statusCode: 429,
    },
  },
  account_suspended: {
    status: 403,
    body: {
      code: "ACCOUNT_SUSPENDED",
      message: "Account suspended",
      statusCode: 403,
    },
  },
  not_activated: {
    status: 403,
    body: {
      code: "ACCOUNT_VALIDATION_REQUIRED",
      message: "Account not activated",
      statusCode: 403,
    },
  },
  profile_setup_required: {
    status: 403,
    body: {
      code: "PROFILE_SETUP_REQUIRED",
      message: "Profile setup required",
      statusCode: 403,
      email: "prof@ecole.cm",
      schoolSlug: "ecole-demo",
      setupToken: "setup-token-email",
    },
  },
  network_error: { closeImmediately: true },
};

const DISCIPLINE_SCENARIOS = {
  happy_path: "happy_path",
  list_error: "list_error",
  list_error_once: "list_error_once",
  create_error: "create_error",
  update_error: "update_error",
  delete_error: "delete_error",
};

const FEED_SCENARIOS = {
  happy_path: "happy_path",
  list_error: "list_error",
  list_error_once: "list_error_once",
  create_error: "create_error",
  like_error: "like_error",
  comment_error: "comment_error",
  vote_error: "vote_error",
  delete_error: "delete_error",
  action_errors: "action_errors",
};

// ────────────────────────── Scénarios récupération PIN ──────────────────────────

/**
 * Scénarios disponibles pour les endpoints forgot-pin :
 *   happy_path       → options ok, verify ok, complete ok
 *   not_found        → options → 404 NOT_FOUND
 *   invalid_recovery → verify → 400 RECOVERY_INVALID
 *   session_expired  → complete → 401 RECOVERY_SESSION_EXPIRED
 *   same_pin         → complete → 400 SAME_PIN
 */

const MOCK_PIN_QUESTIONS = [
  { key: "MOTHER_MAIDEN_NAME", label: "Nom de jeune fille de votre mère" },
  { key: "BIRTH_CITY", label: "Votre ville de naissance" },
  { key: "FAVORITE_SPORT", label: "Votre sport préféré" },
];

// ────────────────────────── Scénarios récupération mot de passe ──────────────

/**
 * Scénarios disponibles pour les endpoints forgot-password :
 *   happy_path       → request ok, options ok, verify ok, complete ok
 *   not_found        → request → 404 NOT_FOUND
 *   token_invalid    → options → 400 TOKEN_INVALID
 *   token_expired    → options → 401 TOKEN_EXPIRED
 *   invalid_recovery → verify → 400 RECOVERY_INVALID
 *   same_password    → complete → 400 SAME_PASSWORD
 */

// ────────────────────────── État courant ──────────────────────────

let currentScenario = "happy_path";
let currentEmailLoginScenario = "happy_path";
let currentOnboardingScenario = "email_parent_happy";
let currentPinScenario = "happy_path";
let currentPwdScenario = "happy_path";
let currentDisciplineScenario = "happy_path";
let currentFeedScenario = "happy_path";
let currentAccountScenario = "phone_only_user";
let mockAccountState = {
  emailAdded: false,
  passwordCreated: false,
  phoneCredentialAdded: false,
  addedEmail: null,
  addedPhone: null,
};
let server = null;

// ── Scénarios compte (GET /api/me) ──────────────────────────────

const ACCOUNT_SCENARIOS = {
  phone_only_user: {
    firstName: "Kofi",
    lastName: "Mensah",
    gender: "M",
    email: null,
    phone: "237670000001",
    role: "PARENT",
    activeRole: "PARENT",
    platformRoles: [],
    memberships: [{ schoolId: "school-1", role: "PARENT" }],
    schoolSlug: "ecole-demo",
    hasPassword: false,
    hasPhoneCredential: true,
  },
  email_only_user: {
    firstName: "Awa",
    lastName: "Diallo",
    gender: "F",
    email: "awa.diallo@ecole.cm",
    phone: null,
    role: "PARENT",
    activeRole: "PARENT",
    platformRoles: [],
    memberships: [{ schoolId: "school-1", role: "PARENT" }],
    schoolSlug: "ecole-demo",
    hasPassword: true,
    hasPhoneCredential: false,
  },
};

const INLINE_IMAGE_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAb0lEQVR4nO3PQQ0AIBDAMMC/5yFjRxMFfXpn5g5A7zWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgNaA1oDWgfY5GAOQO2vByAAAAAElFTkSuQmCC";
const INLINE_IMAGE_PNG = Buffer.from(INLINE_IMAGE_PNG_BASE64, "base64");
const ATTACHMENT_PDF = Buffer.from(
  [
    "%PDF-1.1",
    "1 0 obj",
    "<< /Type /Catalog /Pages 2 0 R >>",
    "endobj",
    "2 0 obj",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "endobj",
    "3 0 obj",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R >>",
    "endobj",
    "4 0 obj",
    "<< /Length 44 >>",
    "stream",
    "BT /F1 18 Tf 40 80 Td (E2E attachment) Tj ET",
    "endstream",
    "endobj",
    "xref",
    "0 5",
    "0000000000 65535 f ",
    "0000000010 00000 n ",
    "0000000061 00000 n ",
    "0000000118 00000 n ",
    "0000000207 00000 n ",
    "trailer",
    "<< /Size 5 /Root 1 0 R >>",
    "startxref",
    "300",
    "%%EOF",
  ].join("\n"),
  "utf8",
);

const MOCK_AUTH_USER = {
  id: "parent-1",
  firstName: "Robert",
  lastName: "Ntamack",
  email: "teacher@ecole.cm",
  phone: "+237600000000",
  avatarUrl: null,
  gender: "M",
  platformRoles: [],
  memberships: [{ schoolId: "school-1", role: "PARENT" }],
  profileCompleted: true,
  activationStatus: "ACTIVE",
  role: "PARENT",
  activeRole: "PARENT",
};

const MOCK_TEACHER_AUTH_USER = {
  id: "teacher-1",
  firstName: "Paul",
  lastName: "Manga",
  email: "teacher@ecole.cm",
  phone: "+237611111111",
  avatarUrl: null,
  gender: "M",
  platformRoles: [],
  memberships: [{ schoolId: "school-1", role: "TEACHER" }],
  profileCompleted: true,
  activationStatus: "ACTIVE",
  role: "TEACHER",
  activeRole: "TEACHER",
};

const MOCK_SCHOOL_AUTH_USER = {
  id: "school-admin-1",
  firstName: "Valery",
  lastName: "Mbele",
  email: "admin@ecole.cm",
  phone: "+237622222222",
  avatarUrl: null,
  gender: "M",
  platformRoles: [],
  memberships: [{ schoolId: "school-1", role: "SCHOOL_ADMIN" }],
  profileCompleted: true,
  activationStatus: "ACTIVE",
  role: "SCHOOL_ADMIN",
  activeRole: "SCHOOL_ADMIN",
};

const EMAIL_TOKENS = {
  parent: {
    accessToken: "e2e-parent-access-token-valid",
    refreshToken: "e2e-parent-refresh-token-valid",
  },
  teacher: {
    accessToken: "e2e-teacher-access-token-valid",
    refreshToken: "e2e-teacher-refresh-token-valid",
  },
  school: {
    accessToken: "e2e-school-access-token-valid",
    refreshToken: "e2e-school-refresh-token-valid",
  },
};

const MOCK_GOOGLE_SSO = {
  providerAccountId: "114665872120651017460",
  email: "plizaweb@gmail.com",
  firstName: "Valery",
  lastName: "MBELE",
  schoolSlug: "ecole-demo",
  accessToken: "e2e-google-access-token-valid",
  refreshToken: "e2e-google-refresh-token-valid",
};

const MOCK_GOOGLE_AUTH_USER = {
  id: "platform-admin-1",
  firstName: "Valery",
  lastName: "MBELE",
  email: "plizaweb@gmail.com",
  phone: "+237065059783",
  avatarUrl: null,
  gender: "M",
  platformRoles: ["ADMIN"],
  memberships: [],
  profileCompleted: true,
  activationStatus: "ACTIVE",
  role: "ADMIN",
  activeRole: "ADMIN",
};

const MOCK_DISCIPLINE_ADMIN_AUTH_USER = {
  id: "school-admin-1",
  firstName: "Valery",
  lastName: "MBELE",
  email: "teacher@ecole.cm",
  phone: "+237065059783",
  avatarUrl: null,
  gender: "M",
  platformRoles: [],
  memberships: [{ schoolId: "school-1", role: "SCHOOL_ADMIN" }],
  profileCompleted: true,
  activationStatus: "ACTIVE",
  role: "ADMIN",
  activeRole: "ADMIN",
};

const MOCK_PARENT_ME = {
  linkedStudents: [
    {
      id: "child-1",
      firstName: "Remi",
      lastName: "Ntamack",
      avatarUrl: null,
    },
  ],
};

const MOCK_TIMETABLE_CONTEXT = {
  schoolYears: [{ id: "sy-1", label: "2025-2026", isActive: true }],
  selectedSchoolYearId: "sy-1",
  assignments: [
    {
      classId: "class-6a",
      subjectId: "subject-math",
      className: "6e A",
      subjectName: "Maths",
      schoolYearId: "sy-1",
    },
    {
      classId: "class-6a",
      subjectId: "subject-fr",
      className: "6e A",
      subjectName: "Français",
      schoolYearId: "sy-1",
    },
  ],
  students: [
    {
      classId: "class-6a",
      className: "6e A",
      studentId: "child-1",
      studentFirstName: "Remi",
      studentLastName: "Ntamack",
    },
    {
      classId: "class-6a",
      className: "6e A",
      studentId: "child-2",
      studentFirstName: "Lina",
      studentLastName: "Ntamack",
    },
  ],
};

const MOCK_STUDENT_NOTES = {
  "child-1": [
    {
      term: "TERM_1",
      label: "Trimestre 1",
      councilLabel: "6e C • Conseil de classe de 6eC le 09/12/2025 17:30",
      generatedAtLabel: "Donnees publiees le 12/03/2026 16:58",
      generalAverage: {
        student: 13.22,
        class: 14.62,
        min: 9.5,
        max: 18.6,
      },
      subjects: [
        {
          id: "subject-anglais",
          subjectLabel: "Anglais",
          teachers: ["Mme Rousselot"],
          coefficient: 1,
          studentAverage: 13.31,
          classAverage: 14.74,
          classMin: 11.8,
          classMax: 17.7,
          appreciation:
            "Des bases presentes, mais il faut davantage s'entrainer a l'ecrit.",
          evaluations: [
            {
              id: "eval-ang-1",
              label: "Sequence 1",
              score: 14.6,
              maxScore: 20,
              weight: 1,
              recordedAt: "2026-03-12",
              status: "ENTERED",
            },
            {
              id: "eval-ang-2",
              label: "Composition",
              score: 26.4,
              maxScore: 40,
              weight: 2,
              recordedAt: "2026-03-12",
              status: "ENTERED",
            },
            {
              id: "eval-ang-3",
              label: "Interrogation",
              score: 11.8,
              maxScore: 20,
              weight: 1,
              recordedAt: "2026-03-12",
              status: "ENTERED",
            },
          ],
        },
        {
          id: "subject-geo",
          subjectLabel: "Geographie",
          teachers: ["M. Manga"],
          coefficient: 2,
          studentAverage: 11.01,
          classAverage: 12.13,
          classMin: 9.5,
          classMax: 15,
          appreciation:
            "Des connaissances a consolider sur les reperes essentiels.",
          evaluations: [
            {
              id: "eval-geo-1",
              label: "Carte",
              score: 12.3,
              maxScore: 20,
              weight: 1,
              recordedAt: "2026-03-14",
              status: "ENTERED",
            },
            {
              id: "eval-geo-2",
              label: "Devoir surveille",
              score: 9.5,
              maxScore: 20,
              weight: 1,
              recordedAt: "2026-03-14",
              status: "ENTERED",
            },
          ],
        },
      ],
    },
    {
      term: "TERM_3",
      label: "Trimestre 3",
      councilLabel: "6e C • Conseil de classe de 6eC le 13/04/2026 17:30",
      generatedAtLabel: "Donnees publiees le 13/04/2026 18:05",
      generalAverage: {
        student: 14.05,
        class: 13.1,
        min: 8.5,
        max: 18.9,
      },
      subjects: [
        {
          id: "subject-math",
          subjectLabel: "Mathematiques",
          teachers: ["M. Manga"],
          coefficient: 4,
          studentAverage: 14.2,
          classAverage: 12.8,
          classMin: 8.5,
          classMax: 18.9,
          appreciation: "Bonne regularite sur la periode.",
          evaluations: [
            {
              id: "eval-math-t3-1",
              label: "Interro fractions",
              score: 15,
              maxScore: 20,
              weight: 1,
              recordedAt: "2026-04-12",
              status: "ENTERED",
            },
            {
              id: "eval-math-t3-2",
              label: "Composition",
              score: 28,
              maxScore: 40,
              weight: 2,
              recordedAt: "2026-04-12",
              status: "ENTERED",
            },
          ],
        },
        {
          id: "subject-geo-t3",
          subjectLabel: "Geographie",
          teachers: ["Mme Rousselot"],
          coefficient: 2,
          studentAverage: 10.8,
          classAverage: 12.1,
          classMin: 9.2,
          classMax: 15.4,
          appreciation: "Repres geographiques a renforcer.",
          evaluations: [
            {
              id: "eval-geo-t3-1",
              label: "Croquis",
              score: 9.5,
              maxScore: 20,
              weight: 1,
              recordedAt: "2026-04-13",
              status: "ENTERED",
            },
          ],
        },
      ],
    },
  ],
};

const MOCK_NOTES_TEACHER_CONTEXT = {
  class: {
    id: "class-6a",
    name: "6e A",
    schoolYearId: "sy-1",
  },
  subjects: [
    {
      id: "subject-math",
      name: "Maths",
      branches: [{ id: "branch-math-general", name: "Tronc commun" }],
    },
    {
      id: "subject-fr",
      name: "Français",
      branches: [{ id: "branch-fr-general", name: "Expression écrite" }],
    },
  ],
  evaluationTypes: [
    {
      id: "evaltype-test",
      code: "TEST",
      label: "Interrogation",
      isDefault: true,
    },
    {
      id: "evaltype-exam",
      code: "EXAM",
      label: "Composition",
      isDefault: false,
    },
  ],
  students: [
    { id: "child-1", firstName: "Remi", lastName: "Ntamack" },
    { id: "child-2", firstName: "Lina", lastName: "Ntamack" },
  ],
};

function createInitialNotesState() {
  const baseEvaluation = {
    id: "eval-math-initial",
    title: "Composition math T1",
    description: "Evaluation initiale de reference",
    coefficient: 2,
    maxScore: 20,
    term: "TERM_1",
    status: "PUBLISHED",
    scheduledAt: "2026-01-15T08:00:00.000Z",
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
    subject: { id: "subject-math", name: "Maths" },
    subjectBranch: { id: "branch-math-general", name: "Tronc commun" },
    evaluationType: {
      id: "evaltype-exam",
      code: "EXAM",
      label: "Composition",
    },
    attachments: [],
    _count: { scores: 2 },
  };

  return {
    evaluations: [baseEvaluation],
    evaluationDetails: {
      "eval-math-initial": {
        ...baseEvaluation,
        students: [
          {
            id: "child-1",
            firstName: "Remi",
            lastName: "Ntamack",
            score: 14,
            scoreStatus: "ENTERED",
            comment: "Bonne maitrise",
          },
          {
            id: "child-2",
            firstName: "Lina",
            lastName: "Ntamack",
            score: 12,
            scoreStatus: "ENTERED",
            comment: "Encore quelques erreurs",
          },
        ],
      },
    },
    termReports: {
      TERM_1: {
        term: "TERM_1",
        status: "DRAFT",
        councilHeldAt: "2026-01-20T15:00:00.000Z",
        students: [
          {
            studentId: "child-1",
            firstName: "Remi",
            lastName: "Ntamack",
            generalAppreciation: "Bon trimestre de depart.",
            subjects: [
              {
                subjectId: "subject-math",
                appreciation: "Bases bien installees.",
              },
              {
                subjectId: "subject-fr",
                appreciation: "Expression a fluidifier.",
              },
            ],
          },
          {
            studentId: "child-2",
            firstName: "Lina",
            lastName: "Ntamack",
            generalAppreciation: "Participation reguliere.",
            subjects: [
              {
                subjectId: "subject-math",
                appreciation: "Peut aller plus loin sur les problemes.",
              },
              {
                subjectId: "subject-fr",
                appreciation: "Bonne lecture.",
              },
            ],
          },
        ],
      },
      TERM_2: {
        term: "TERM_2",
        status: "DRAFT",
        councilHeldAt: null,
        students: MOCK_NOTES_TEACHER_CONTEXT.students.map((student) => ({
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          generalAppreciation: "",
          subjects: MOCK_NOTES_TEACHER_CONTEXT.subjects.map((subject) => ({
            subjectId: subject.id,
            appreciation: "",
          })),
        })),
      },
      TERM_3: {
        term: "TERM_3",
        status: "DRAFT",
        councilHeldAt: null,
        students: MOCK_NOTES_TEACHER_CONTEXT.students.map((student) => ({
          studentId: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          generalAppreciation: "",
          subjects: MOCK_NOTES_TEACHER_CONTEXT.subjects.map((subject) => ({
            subjectId: subject.id,
            appreciation: "",
          })),
        })),
      },
    },
  };
}

function slugifyValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function createInitialTimetableState() {
  return {
    slots: [
      {
        id: "slot-1",
        weekday: 1,
        startMinute: 450,
        endMinute: 510,
        room: "Salle A1",
        activeFromDate: "2026-04-06",
        activeToDate: "2026-05-30",
        subject: { id: "subject-math", name: "Maths" },
        teacherUser: {
          id: "teacher-1",
          firstName: "Paul",
          lastName: "Manga",
          email: "teacher@ecole.cm",
        },
      },
    ],
    oneOffSlots: [
      {
        id: "oneoff-1",
        occurrenceDate: "2026-04-15",
        startMinute: 600,
        endMinute: 660,
        room: "Salle Poly",
        status: "PLANNED",
        sourceSlotId: null,
        subject: { id: "subject-fr", name: "Français" },
        teacherUser: {
          id: "teacher-1",
          firstName: "Paul",
          lastName: "Manga",
          email: "teacher@ecole.cm",
        },
      },
    ],
    slotExceptions: [],
    calendarEvents: [
      {
        id: "event-1",
        type: "HOLIDAY",
        scope: "SCHOOL",
        label: "Fête nationale",
        startDate: "2026-05-20",
        endDate: "2026-05-20",
        schoolYearId: "sy-1",
        academicLevelId: null,
        classId: null,
      },
    ],
    subjectStyles: [
      { subjectId: "subject-math", colorHex: "#0C5FA8" },
      { subjectId: "subject-fr", colorHex: "#D89B5B" },
    ],
  };
}

let timetableSlotCounter = 10;
let timetableOneOffCounter = 10;
let timetableEventCounter = 10;
let mockTimetableState = createInitialTimetableState();
let notesEvaluationCounter = 10;
let mockNotesState = createInitialNotesState();

const MOCK_RECIPIENTS = {
  teachers: [
    {
      value: "teacher-rousselot",
      label: "Rousselot Anne",
      email: "anne.rousselot@ecole.cm",
      classes: ["6e C"],
      subjects: ["Vie scolaire"],
    },
  ],
  staffFunctions: [],
  staffPeople: [],
};

let messageCounter = 10;
let attachmentCounter = 10;
let mailboxCounter = 10;
let mockMessages = createInitialMessages();
let feedCounter = 10;
let feedCommentCounter = 10;
let mockFeedPosts = createInitialFeedPosts();
let feedListErrorOnceConsumed = false;
let lifeEventCounter = 10;
let mockLifeEventsByStudent = createInitialLifeEventsByStudent();

function resetMockState() {
  messageCounter = 10;
  attachmentCounter = 10;
  mailboxCounter = 10;
  mockMessages = createInitialMessages();
  feedCounter = 10;
  feedCommentCounter = 10;
  mockFeedPosts = createInitialFeedPosts();
  feedListErrorOnceConsumed = false;
  timetableSlotCounter = 10;
  timetableOneOffCounter = 10;
  timetableEventCounter = 10;
  mockTimetableState = createInitialTimetableState();
  notesEvaluationCounter = 10;
  mockNotesState = createInitialNotesState();
  lifeEventCounter = 10;
  mockLifeEventsByStudent = createInitialLifeEventsByStudent();
  mockAccountState = {
    emailAdded: false,
    passwordCreated: false,
    phoneCredentialAdded: false,
    addedEmail: null,
    addedPhone: null,
  };
}

function parseJsonSafe(raw) {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

function parseAuthorizationToken(req) {
  return String(req.headers.authorization || "")
    .replace(/^Bearer\s+/i, "")
    .trim();
}

function resolveAuthUserFromToken(token) {
  if (token === MOCK_GOOGLE_SSO.accessToken) {
    return MOCK_GOOGLE_AUTH_USER;
  }
  if (token === EMAIL_TOKENS.teacher.accessToken) {
    return MOCK_TEACHER_AUTH_USER;
  }
  if (token === EMAIL_TOKENS.school.accessToken) {
    return MOCK_SCHOOL_AUTH_USER;
  }
  if (token === EMAIL_LOGIN_SCENARIOS.discipline_admin.body.accessToken) {
    return MOCK_DISCIPLINE_ADMIN_AUTH_USER;
  }
  return MOCK_AUTH_USER;
}

function buildOccurrencesFromState() {
  const recurring = mockTimetableState.slots.map((slot, index) => ({
    id: `occ-rec-${index + 1}`,
    source: "RECURRING",
    status: "PLANNED",
    occurrenceDate: "2026-04-13",
    weekday: slot.weekday,
    startMinute: slot.startMinute,
    endMinute: slot.endMinute,
    room: slot.room,
    reason: null,
    subject: slot.subject,
    teacherUser: slot.teacherUser,
    slotId: slot.id,
  }));

  const oneOff = mockTimetableState.oneOffSlots.map((slot, index) => ({
    id: `occ-oneoff-${index + 1}`,
    source: "ONE_OFF",
    status: slot.status,
    occurrenceDate: slot.occurrenceDate,
    weekday: 3,
    startMinute: slot.startMinute,
    endMinute: slot.endMinute,
    room: slot.room,
    reason: null,
    subject: slot.subject,
    teacherUser: slot.teacherUser,
    oneOffSlotId: slot.id,
  }));

  return [...recurring, ...oneOff];
}

function buildMyTimetablePayload() {
  return {
    student: { id: "child-1", firstName: "Remi", lastName: "Ntamack" },
    class: {
      id: "class-6a",
      name: "6e A",
      schoolYearId: "sy-1",
      academicLevelId: null,
    },
    slots: mockTimetableState.slots,
    oneOffSlots: mockTimetableState.oneOffSlots,
    slotExceptions: mockTimetableState.slotExceptions,
    occurrences: buildOccurrencesFromState(),
    calendarEvents: mockTimetableState.calendarEvents,
    subjectStyles: mockTimetableState.subjectStyles,
  };
}

function listNoteReports(term) {
  const reports = Object.values(mockNotesState.termReports);
  return term ? reports.filter((entry) => entry.term === term) : reports;
}

function resolveNotesSubject(subjectId) {
  return (
    MOCK_NOTES_TEACHER_CONTEXT.subjects.find(
      (subject) => subject.id === subjectId,
    ) ?? MOCK_NOTES_TEACHER_CONTEXT.subjects[0]
  );
}

function resolveNotesBranch(subject, subjectBranchId) {
  return (
    subject.branches.find((branch) => branch.id === subjectBranchId) ??
    subject.branches[0] ??
    null
  );
}

function resolveEvaluationType(evaluationTypeId) {
  return (
    MOCK_NOTES_TEACHER_CONTEXT.evaluationTypes.find(
      (entry) => entry.id === evaluationTypeId,
    ) ?? MOCK_NOTES_TEACHER_CONTEXT.evaluationTypes[0]
  );
}

function buildClassTimetablePayload() {
  return {
    class: {
      id: "class-6a",
      schoolYearId: "sy-1",
      academicLevelId: null,
    },
    slots: mockTimetableState.slots,
    oneOffSlots: mockTimetableState.oneOffSlots,
    slotExceptions: mockTimetableState.slotExceptions,
    occurrences: buildOccurrencesFromState(),
    calendarEvents: mockTimetableState.calendarEvents,
    subjectStyles: mockTimetableState.subjectStyles,
  };
}

function buildClassContextPayload() {
  return {
    class: {
      id: "class-6a",
      name: "6e A",
      schoolId: "school-1",
      schoolYearId: "sy-1",
      academicLevelId: null,
      curriculumId: null,
      referentTeacherUserId: "teacher-1",
    },
    allowedSubjects: [
      { id: "subject-math", name: "Maths" },
      { id: "subject-fr", name: "Français" },
    ],
    assignments: [
      {
        teacherUserId: "teacher-1",
        subjectId: "subject-math",
        subject: { id: "subject-math", name: "Maths" },
        teacherUser: {
          id: "teacher-1",
          firstName: "Paul",
          lastName: "Manga",
          email: "teacher@ecole.cm",
        },
      },
      {
        teacherUserId: "teacher-1",
        subjectId: "subject-fr",
        subject: { id: "subject-fr", name: "Français" },
        teacherUser: {
          id: "teacher-1",
          firstName: "Paul",
          lastName: "Manga",
          email: "teacher@ecole.cm",
        },
      },
    ],
    subjectStyles: mockTimetableState.subjectStyles,
    schoolYears: [{ id: "sy-1", label: "2025-2026", isActive: true }],
    selectedSchoolYearId: "sy-1",
  };
}

// ────────────────────────── Gestion des requêtes ──────────────────────────

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw));
  });
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function bytes(res, status, body, contentType) {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Content-Length": body.length,
  });
  res.end(body);
}

function createInitialMessages() {
  return [
    {
      id: "msg-inbox-1",
      folder: "inbox",
      status: "SENT",
      subject: "Bienvenue sur la messagerie",
      body: "<p>Bonjour, ceci est un message de démonstration.</p>",
      createdAt: "2026-04-04T08:00:00.000Z",
      sentAt: "2026-04-04T08:00:00.000Z",
      unread: true,
      sender: {
        id: "teacher-rousselot",
        firstName: "Anne",
        lastName: "Rousselot",
        email: "anne.rousselot@ecole.cm",
      },
      recipients: [
        {
          id: "recipient-parent-1",
          userId: "parent-1",
          firstName: "Robert",
          lastName: "Ntamack",
          email: "teacher@ecole.cm",
          readAt: null,
          archivedAt: null,
        },
      ],
      recipientState: {
        readAt: null,
        archivedAt: null,
        deletedAt: null,
      },
      isSender: false,
      mailboxEntryId: "mailbox-1",
      attachments: [],
    },
  ];
}

function createInitialFeedPosts() {
  return [
    {
      id: "feed-1",
      type: "POST",
      author: {
        id: "teacher-rousselot",
        fullName: "Anne Rousselot",
        civility: "Mme",
        roleLabel: "Vie scolaire",
        avatarText: "AR",
      },
      title: "Réunion parents-professeurs",
      bodyHtml:
        "<p>La réunion parents-professeurs aura lieu vendredi à 16h30 dans la salle polyvalente.</p>",
      createdAt: "2026-04-04T08:30:00.000Z",
      featuredUntil: "2030-04-10T08:30:00.000Z",
      audience: {
        scope: "PARENTS_ONLY",
        label: "Parents uniquement",
      },
      attachments: [
        {
          id: "feed-attachment-1",
          fileName: "programme-reunion.pdf",
          fileUrl: "http://10.0.2.2:3001/mock/files/e2e-message-attachment.pdf",
          sizeLabel: "1 Ko",
        },
      ],
      likedByViewer: false,
      likesCount: 2,
      authoredByViewer: false,
      canManage: false,
      comments: [
        {
          id: "feed-comment-1",
          authorName: "Robert Ntamack",
          text: "Merci pour l'information.",
          createdAt: "2026-04-04T09:00:00.000Z",
        },
      ],
    },
    {
      id: "feed-2",
      type: "POLL",
      author: {
        id: "school-admin-1",
        fullName: "Valery Mbele",
        civility: "M.",
        roleLabel: "Administration",
        avatarText: "VM",
      },
      title: "Horaire du forum orientation",
      bodyHtml:
        "<p>Merci de nous aider à choisir le meilleur créneau pour le forum orientation.</p>",
      createdAt: "2026-04-03T11:00:00.000Z",
      featuredUntil: null,
      audience: {
        scope: "SCHOOL_ALL",
        label: "Toute l'école",
      },
      attachments: [],
      likedByViewer: false,
      likesCount: 1,
      authoredByViewer: false,
      canManage: false,
      comments: [],
      poll: {
        question: "Quel créneau préférez-vous ?",
        votedOptionId: null,
        options: [
          { id: "poll-1", label: "Mercredi matin", votes: 4 },
          { id: "poll-2", label: "Vendredi après-midi", votes: 3 },
        ],
      },
    },
  ];
}

function createInitialLifeEventsByStudent() {
  const baseEvents = [
    {
      id: "life-1",
      schoolId: "school-1",
      studentId: "child-1",
      classId: "class-1",
      schoolYearId: "year-1",
      authorUserId: "staff-1",
      type: "ABSENCE",
      occurredAt: "2026-04-04T07:30:00.000Z",
      durationMinutes: 55,
      justified: false,
      reason: "Absence en premiere heure",
      comment: "Parents a contacter",
      createdAt: "2026-04-04T08:00:00.000Z",
      updatedAt: "2026-04-04T08:00:00.000Z",
      class: { id: "class-1", name: "6e A" },
      schoolYear: { id: "year-1", label: "2025-2026" },
      authorUser: {
        id: "staff-1",
        firstName: "Anne",
        lastName: "Rousselot",
        email: "anne.rousselot@ecole.cm",
      },
    },
    {
      id: "life-2",
      schoolId: "school-1",
      studentId: "child-1",
      classId: "class-1",
      schoolYearId: "year-1",
      authorUserId: "staff-1",
      type: "RETARD",
      occurredAt: "2026-04-03T08:10:00.000Z",
      durationMinutes: 10,
      justified: true,
      reason: "Retard a l'appel",
      comment: null,
      createdAt: "2026-04-03T08:15:00.000Z",
      updatedAt: "2026-04-03T08:15:00.000Z",
      class: { id: "class-1", name: "6e A" },
      schoolYear: { id: "year-1", label: "2025-2026" },
      authorUser: {
        id: "staff-1",
        firstName: "Anne",
        lastName: "Rousselot",
        email: "anne.rousselot@ecole.cm",
      },
    },
    {
      id: "life-3",
      schoolId: "school-1",
      studentId: "child-1",
      classId: "class-1",
      schoolYearId: "year-1",
      authorUserId: "staff-1",
      type: "SANCTION",
      occurredAt: "2026-04-02T10:30:00.000Z",
      durationMinutes: null,
      justified: null,
      reason: "Comportement irrespectueux en classe",
      comment: "Entretien prevu avec le parent.",
      createdAt: "2026-04-02T10:45:00.000Z",
      updatedAt: "2026-04-02T10:45:00.000Z",
      class: { id: "class-1", name: "6e A" },
      schoolYear: { id: "year-1", label: "2025-2026" },
      authorUser: {
        id: "staff-1",
        firstName: "Anne",
        lastName: "Rousselot",
        email: "anne.rousselot@ecole.cm",
      },
    },
  ];

  return {
    "child-1": baseEvents,
    "student-1": baseEvents.map((event) => ({
      ...event,
      studentId: "student-1",
    })),
  };
}

function stripHtml(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMultipartField(raw, fieldName) {
  const match = raw.match(
    new RegExp(`name="${fieldName}"\\r\\n\\r\\n([\\s\\S]*?)\\r\\n--`, "i"),
  );
  return match ? match[1].trim() : null;
}

function extractMultipartFields(raw, fieldName) {
  return [
    ...raw.matchAll(
      new RegExp(`name="${fieldName}"\\r\\n\\r\\n([\\s\\S]*?)\\r\\n`, "gi"),
    ),
  ]
    .map((match) => match[1].trim())
    .filter(Boolean);
}

function extractMultipartAttachments(raw) {
  return [...raw.matchAll(/name="attachments"; filename="([^"]+)"/gi)].map(
    (match) => {
      const fileName = match[1];
      const lower = fileName.toLowerCase();
      let mimeType = "application/octet-stream";

      if (lower.endsWith(".pdf")) mimeType = "application/pdf";
      else if (lower.endsWith(".png")) mimeType = "image/png";
      else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg"))
        mimeType = "image/jpeg";

      attachmentCounter += 1;

      return {
        id: `attachment-${attachmentCounter}`,
        fileName,
        url: `http://10.0.2.2:3001/mock/media/${encodeURIComponent(fileName)}`,
        mimeType,
        sizeBytes: lower.endsWith(".pdf")
          ? ATTACHMENT_PDF.length
          : INLINE_IMAGE_PNG.length,
      };
    },
  );
}

function mapListItem(message) {
  return {
    id: message.id,
    folder: message.folder,
    status: message.status,
    subject: message.subject,
    preview: stripHtml(message.body).slice(0, 180),
    createdAt: message.createdAt,
    sentAt: message.sentAt,
    unread: message.unread,
    sender: message.sender,
    recipientsCount: message.recipients.length,
    mailboxEntryId: message.mailboxEntryId,
    attachments: message.attachments,
  };
}

function mapDetail(message) {
  return {
    id: message.id,
    subject: message.subject,
    body: message.body,
    status: message.status,
    createdAt: message.createdAt,
    sentAt: message.sentAt,
    senderArchivedAt: null,
    isSender: message.isSender,
    recipientState: message.recipientState,
    sender: message.sender,
    recipients: message.recipients,
    attachments: message.attachments,
  };
}

function findMessageById(messageId) {
  return mockMessages.find((message) => message.id === messageId) ?? null;
}

function filterFeedPosts(searchParams) {
  const filter = searchParams.get("filter") || "all";
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const now = Date.now();

  return mockFeedPosts.filter((post) => {
    if (
      filter === "featured" &&
      (!post.featuredUntil || new Date(post.featuredUntil).getTime() <= now)
    ) {
      return false;
    }

    if (filter === "polls" && post.type !== "POLL") {
      return false;
    }

    if (!q) {
      return true;
    }

    return `${post.title} ${stripHtml(post.bodyHtml)}`
      .toLowerCase()
      .includes(q);
  });
}

function handleRequest(req, res) {
  const { url, method } = req;
  const requestUrl = new URL(url, "http://mock.local");
  const path = requestUrl.pathname;

  // ── Endpoints de contrôle (tests → mock server) ─────────────
  if (
    url === "/__scenario" ||
    url === "/__scenario/email-login" ||
    url === "/__scenario/onboarding" ||
    url === "/__scenario/feed" ||
    url === "/__scenario/pin" ||
    url === "/__scenario/discipline" ||
    url === "/__scenario/password" ||
    url === "/__scenario/account" ||
    url === "/__reset"
  ) {
    if (method === "POST") {
      readBody(req).then((raw) => {
        try {
          if (url === "/__reset") {
            resetMockState();
            console.log("[mock] /__reset");
            return json(res, 200, { ok: true });
          }
          const { scenario } = JSON.parse(raw);
          if (url === "/__scenario") {
            if (!SCENARIOS[scenario]) {
              return json(res, 400, {
                error: `Scénario login inconnu : "${scenario}"`,
              });
            }
            currentScenario = scenario;
          } else if (url === "/__scenario/email-login") {
            if (!EMAIL_LOGIN_SCENARIOS[scenario]) {
              return json(res, 400, {
                error: `Scénario login email inconnu : "${scenario}"`,
              });
            }
            currentEmailLoginScenario = scenario;
          } else if (url === "/__scenario/onboarding") {
            currentOnboardingScenario = scenario;
          } else if (url === "/__scenario/feed") {
            if (!FEED_SCENARIOS[scenario]) {
              return json(res, 400, {
                error: `Scénario feed inconnu : "${scenario}"`,
              });
            }
            currentFeedScenario = scenario;
            feedListErrorOnceConsumed = false;
          } else if (url === "/__scenario/discipline") {
            if (!DISCIPLINE_SCENARIOS[scenario]) {
              return json(res, 400, {
                error: `Scénario discipline inconnu : "${scenario}"`,
              });
            }
            currentDisciplineScenario = scenario;
          } else if (url === "/__scenario/pin") {
            currentPinScenario = scenario;
          } else if (url === "/__scenario/account") {
            if (!ACCOUNT_SCENARIOS[scenario]) {
              return json(res, 400, {
                error: `Scénario account inconnu : "${scenario}"`,
              });
            }
            currentAccountScenario = scenario;
          } else {
            currentPwdScenario = scenario;
          }
          console.log(`[mock] ${url} → ${scenario}`);
          json(res, 200, { ok: true, scenario });
        } catch {
          json(res, 400, { error: "JSON invalide" });
        }
      });
      return;
    }
    if (method === "GET") {
      return json(res, 200, {
        login: currentScenario,
        emailLogin: currentEmailLoginScenario,
        onboarding: currentOnboardingScenario,
        feed: currentFeedScenario,
        discipline: currentDisciplineScenario,
        pin: currentPinScenario,
        password: currentPwdScenario,
      });
    }
  }

  // ── Health check ─────────────────────────────────────────────
  if (method === "GET" && path === "/api/health") {
    return json(res, 200, { status: "mock-ok" });
  }

  // ── État compte (GET /__state/account) ────────────────────────
  if (method === "GET" && path === "/__state/account") {
    return json(res, 200, mockAccountState);
  }

  // ── Profil global GET /api/me ─────────────────────────────────
  if (method === "GET" && path === "/api/me") {
    const base =
      ACCOUNT_SCENARIOS[currentAccountScenario] ||
      ACCOUNT_SCENARIOS.phone_only_user;
    // Refléter dynamiquement les mutations appliquées pendant le flow
    const profile = Object.assign({}, base);
    if (mockAccountState.emailAdded && mockAccountState.addedEmail) {
      profile.email = mockAccountState.addedEmail;
    }
    if (mockAccountState.passwordCreated) {
      profile.hasPassword = true;
    }
    if (mockAccountState.phoneCredentialAdded && mockAccountState.addedPhone) {
      profile.hasPhoneCredential = true;
      profile.phone = mockAccountState.addedPhone;
    }
    return json(res, 200, profile);
  }

  // ── Mise à jour profil PUT /api/me/profile ────────────────────
  if (method === "PUT" && path === "/api/me/profile") {
    readBody(req).then((raw) => {
      const payload = parseJsonSafe(raw);
      const base =
        ACCOUNT_SCENARIOS[currentAccountScenario] ||
        ACCOUNT_SCENARIOS.phone_only_user;
      return json(res, 200, Object.assign({}, base, payload));
    });
    return;
  }

  // ── Ajout email POST /api/auth/add-email ──────────────────────
  if (method === "POST" && path === "/api/auth/add-email") {
    readBody(req).then((raw) => {
      const payload = parseJsonSafe(raw);
      mockAccountState.emailAdded = true;
      mockAccountState.addedEmail = payload.email || "nouveau@example.cm";
      console.log(`[mock] add-email → ${mockAccountState.addedEmail}`);
      return json(res, 201, {
        success: true,
        message: "Un email de vérification a été envoyé.",
      });
    });
    return;
  }

  // ── Création mot de passe POST /api/auth/create-password ──────
  if (method === "POST" && path === "/api/auth/create-password") {
    mockAccountState.passwordCreated = true;
    console.log("[mock] create-password → ok");
    return json(res, 201, { success: true });
  }

  // ── Ajout téléphone+PIN POST /api/auth/add-phone-credential ───
  if (method === "POST" && path === "/api/auth/add-phone-credential") {
    readBody(req).then((raw) => {
      const payload = parseJsonSafe(raw);
      mockAccountState.phoneCredentialAdded = true;
      mockAccountState.addedPhone = payload.phone || "670000099";
      console.log(
        `[mock] add-phone-credential → ${mockAccountState.addedPhone}`,
      );
      return json(res, 201, { success: true });
    });
    return;
  }

  // ── Options récupération GET /api/auth/recovery/options ──────
  if (method === "GET" && path === "/api/auth/recovery/options") {
    return json(res, 200, {
      schoolRoles: [],
      questions: [],
      classes: [],
      students: [],
      selectedQuestions: [],
      birthDate: "",
      parentClassId: null,
      parentStudentId: null,
    });
  }

  // ── Mise à jour récupération PUT /api/auth/recovery ───────────
  if (method === "PUT" && path === "/api/auth/recovery") {
    return json(res, 200, { success: true });
  }

  // ── SSO Google : point d'entrée web (remplace /auth/mobile-sso-start du web) ─
  // L'app ouvre ce endpoint dans un Chrome Custom Tab.
  // Le mock redirige immédiatement vers le deep link scolive:// avec les
  // paramètres du compte Google mocké, ce qui ferme le Tab et déclenche
  // le callback dans l'app sans passer par la vraie page Google.
  if (method === "GET" && path === "/auth/mobile-sso-start") {
    const redirectUri =
      requestUrl.searchParams.get("redirectUri") || "scolive://auth/callback";

    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set(
      "providerAccountId",
      MOCK_GOOGLE_SSO.providerAccountId,
    );
    callbackUrl.searchParams.set("email", MOCK_GOOGLE_SSO.email);
    callbackUrl.searchParams.set("firstName", MOCK_GOOGLE_SSO.firstName);
    callbackUrl.searchParams.set("lastName", MOCK_GOOGLE_SSO.lastName);

    res.writeHead(302, { Location: callbackUrl.toString() });
    res.end();
    return;
  }

  if (method === "GET" && path === "/__state/feed") {
    return json(res, 200, { items: mockFeedPosts });
  }

  if (method === "GET" && path === "/__state/timetable") {
    return json(res, 200, mockTimetableState);
  }

  if (method === "GET" && path === "/__state/discipline") {
    return json(res, 200, { items: mockLifeEventsByStudent });
  }

  if (method === "GET" && path === "/__state/notes") {
    return json(res, 200, mockNotesState);
  }

  if (method === "GET" && path === "/mock/media/inline-image.png") {
    return bytes(res, 200, INLINE_IMAGE_PNG, "image/png");
  }

  if (method === "GET" && path.startsWith("/mock/media/")) {
    if (path.endsWith(".pdf")) {
      return bytes(res, 200, ATTACHMENT_PDF, "application/pdf");
    }
    return bytes(res, 200, INLINE_IMAGE_PNG, "image/png");
  }

  // ── Logout : toujours OK (l'app nettoie le stockage local) ───
  if (method === "POST" && path === "/api/auth/logout") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── Refresh : forcé à échouer (pas de session persistante en E2E) ─
  if (method === "POST" && path === "/api/auth/refresh") {
    return json(res, 401, {
      message: "Refresh token invalide",
      statusCode: 401,
    });
  }

  // ── Login par téléphone : piloté par le scénario ─────────────
  if (method === "POST" && path === "/api/auth/login-phone") {
    const scenario = SCENARIOS[currentScenario];
    if (scenario.closeImmediately) {
      req.socket.destroy();
      return;
    }
    return json(res, scenario.status, scenario.body);
  }

  if (method === "POST" && path === "/api/auth/login") {
    readBody(req).then((raw) => {
      const payload = parseJsonSafe(raw);
      const email = String(payload.email || "")
        .toLowerCase()
        .trim();
      const scenario = EMAIL_LOGIN_SCENARIOS[currentEmailLoginScenario];
      if (scenario.closeImmediately) {
        req.socket.destroy();
        return;
      }

      if (scenario.status === 200) {
        const tokenSet =
          email === "teacher@ecole.cm"
            ? EMAIL_TOKENS.teacher
            : email === "admin@ecole.cm"
              ? EMAIL_TOKENS.school
              : EMAIL_TOKENS.parent;
        return json(res, 200, {
          ...scenario.body,
          accessToken: tokenSet.accessToken,
          refreshToken: tokenSet.refreshToken,
        });
      }

      return json(res, scenario.status, scenario.body);
    });
    return;
  }

  if (method === "POST" && path === "/api/auth/sso/login") {
    readBody(req).then((raw) => {
      let payload;
      try {
        payload = JSON.parse(raw || "{}");
      } catch {
        return json(res, 400, {
          message: "JSON invalide",
          statusCode: 400,
        });
      }

      const provider = String(payload.provider || "").toUpperCase();
      const providerAccountId = String(payload.providerAccountId || "").trim();
      const email = String(payload.email || "")
        .toLowerCase()
        .trim();

      if (
        provider !== "GOOGLE" ||
        providerAccountId !== MOCK_GOOGLE_SSO.providerAccountId ||
        email !== MOCK_GOOGLE_SSO.email
      ) {
        return json(res, 401, {
          code: "ACCOUNT_NOT_PROVISIONED",
          message: "Account not provisioned by school",
          statusCode: 401,
        });
      }

      return json(res, 201, {
        accessToken: MOCK_GOOGLE_SSO.accessToken,
        refreshToken: MOCK_GOOGLE_SSO.refreshToken,
        tokenType: "Bearer",
        expiresIn: 86400,
        refreshExpiresIn: 2592000,
        schoolSlug: MOCK_GOOGLE_SSO.schoolSlug,
        csrfToken: "e2e-google-csrf",
      });
    });
    return;
  }

  if (method === "GET" && path.startsWith("/api/auth/onboarding/options")) {
    if (currentOnboardingScenario === "options_error") {
      return json(res, 400, {
        message: "Impossible de charger les options d'activation.",
        statusCode: 400,
      });
    }

    if (currentOnboardingScenario === "phone_happy") {
      return json(res, 200, {
        schoolSlug: "ecole-demo",
        schoolRoles: ["TEACHER"],
        questions: MOCK_PIN_QUESTIONS,
        classes: [],
        students: [],
      });
    }

    return json(res, 200, {
      schoolSlug: "ecole-demo",
      schoolRoles: ["PARENT"],
      questions: [
        ...MOCK_PIN_QUESTIONS,
        { key: "FAVORITE_BOOK", label: "Votre livre préféré" },
      ],
      classes: [{ id: "class-1", name: "6e A", year: "2025-2026" }],
      students: [{ id: "student-1", firstName: "Paul", lastName: "MBELE" }],
    });
  }

  if (method === "POST" && path === "/api/auth/onboarding/complete") {
    if (currentOnboardingScenario === "complete_email_in_use") {
      return json(res, 403, {
        message: "Cette adresse email est deja utilisee.",
        statusCode: 403,
      });
    }
    if (currentOnboardingScenario === "invalid_activation") {
      return json(res, 401, {
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
        statusCode: 401,
      });
    }
    return json(res, 200, { success: true, schoolSlug: "ecole-demo" });
  }

  // ── Récupération PIN ─────────────────────────────────────────

  if (method === "POST" && path === "/api/auth/forgot-pin/options") {
    if (currentPinScenario === "not_found") {
      return json(res, 404, {
        code: "NOT_FOUND",
        message: "User not found",
        statusCode: 404,
      });
    }
    return json(res, 200, {
      success: true,
      principalHint: "6***3",
      schoolSlug: null,
      questions: MOCK_PIN_QUESTIONS,
    });
  }

  if (method === "POST" && path === "/api/auth/forgot-pin/verify") {
    if (currentPinScenario === "invalid_recovery") {
      return json(res, 400, {
        code: "RECOVERY_INVALID",
        message: "Invalid recovery info",
        statusCode: 400,
      });
    }
    return json(res, 200, {
      success: true,
      recoveryToken: "e2e-pin-recovery-token",
      schoolSlug: null,
    });
  }

  if (method === "POST" && path === "/api/auth/forgot-pin/complete") {
    if (currentPinScenario === "session_expired") {
      return json(res, 401, {
        code: "RECOVERY_SESSION_EXPIRED",
        message: "Session expired",
        statusCode: 401,
      });
    }
    if (currentPinScenario === "same_pin") {
      return json(res, 400, {
        code: "SAME_PIN",
        message: "Same PIN not allowed",
        statusCode: 400,
      });
    }
    return json(res, 200, { success: true, schoolSlug: null });
  }

  // ── Récupération mot de passe ─────────────────────────────────

  if (method === "POST" && path === "/api/auth/forgot-password/request") {
    if (currentPwdScenario === "not_found") {
      return json(res, 404, {
        code: "NOT_FOUND",
        message: "User not found",
        statusCode: 404,
      });
    }
    return json(res, 200, {
      success: true,
      message: "Si ce compte existe, un lien a été envoyé.",
    });
  }

  if (method === "POST" && path === "/api/auth/forgot-password/options") {
    if (currentPwdScenario === "token_invalid") {
      return json(res, 400, {
        code: "TOKEN_INVALID",
        message: "Invalid token",
        statusCode: 400,
      });
    }
    if (currentPwdScenario === "token_expired") {
      return json(res, 401, {
        code: "TOKEN_EXPIRED",
        message: "Token expired",
        statusCode: 401,
      });
    }
    return json(res, 200, {
      success: true,
      emailHint: "t***t@example.com",
      schoolSlug: null,
      questions: MOCK_PIN_QUESTIONS,
    });
  }

  if (method === "POST" && path === "/api/auth/forgot-password/verify") {
    if (currentPwdScenario === "invalid_recovery") {
      return json(res, 400, {
        code: "RECOVERY_INVALID",
        message: "Invalid recovery info",
        statusCode: 400,
      });
    }
    return json(res, 200, { success: true, verified: true });
  }

  if (method === "POST" && path === "/api/auth/forgot-password/complete") {
    if (currentPwdScenario === "same_password") {
      return json(res, 400, {
        code: "SAME_PASSWORD",
        message: "Same password not allowed",
        statusCode: 400,
      });
    }
    return json(res, 200, { success: true });
  }

  if (method === "GET" && path === "/api/schools/ecole-demo/auth/me") {
    const token = parseAuthorizationToken(req);
    return json(res, 200, resolveAuthUserFromToken(token));
  }

  if (method === "GET" && path === "/api/schools/ecole-demo/me") {
    return json(res, 200, MOCK_PARENT_ME);
  }

  if (
    method === "GET" &&
    path === "/api/schools/ecole-demo/student-grades/context"
  ) {
    return json(res, 200, MOCK_TIMETABLE_CONTEXT);
  }

  const studentNotesMatch = path.match(
    /^\/api\/schools\/ecole-demo\/students\/([^/]+)\/notes$/,
  );
  if (method === "GET" && studentNotesMatch) {
    const studentId = decodeURIComponent(studentNotesMatch[1]);
    const term = requestUrl.searchParams.get("term");
    const snapshots = MOCK_STUDENT_NOTES[studentId] ?? [];

    return json(
      res,
      200,
      term ? snapshots.filter((entry) => entry.term === term) : snapshots,
    );
  }

  if (
    method === "GET" &&
    path === "/api/schools/ecole-demo/classes/class-6a/evaluations/context"
  ) {
    return json(res, 200, MOCK_NOTES_TEACHER_CONTEXT);
  }

  if (
    method === "GET" &&
    path === "/api/schools/ecole-demo/classes/class-6a/evaluations"
  ) {
    return json(res, 200, mockNotesState.evaluations);
  }

  if (
    method === "POST" &&
    path === "/api/schools/ecole-demo/classes/class-6a/evaluations"
  ) {
    readBody(req).then((raw) => {
      const payload = parseJsonSafe(raw);
      const subject = resolveNotesSubject(payload.subjectId);
      const branch = resolveNotesBranch(subject, payload.subjectBranchId);
      const evaluationType = resolveEvaluationType(payload.evaluationTypeId);
      const titleSlug = slugifyValue(
        payload.title || `evaluation-${notesEvaluationCounter + 1}`,
      );

      notesEvaluationCounter += 1;
      const now = "2026-04-13T11:45:00.000Z";
      const created = {
        id: `eval-${titleSlug}`,
        title: payload.title || "Evaluation sans titre",
        description: payload.description || "",
        coefficient: Number(payload.coefficient ?? 1),
        maxScore: Number(payload.maxScore ?? 20),
        term: payload.term || "TERM_1",
        status: payload.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        scheduledAt: payload.scheduledAt || now,
        createdAt: now,
        updatedAt: now,
        subject: { id: subject.id, name: subject.name },
        subjectBranch: branch ? { id: branch.id, name: branch.name } : null,
        evaluationType: {
          id: evaluationType.id,
          code: evaluationType.code,
          label: evaluationType.label,
        },
        attachments: Array.isArray(payload.attachments)
          ? payload.attachments
          : [],
        _count: { scores: 0 },
      };

      mockNotesState.evaluations = [created, ...mockNotesState.evaluations];
      mockNotesState.evaluationDetails[created.id] = {
        ...created,
        students: MOCK_NOTES_TEACHER_CONTEXT.students.map((student) => ({
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          score: null,
          scoreStatus: "NOT_GRADED",
          comment: "",
        })),
      };

      return json(res, 201, created);
    });
    return;
  }

  const classEvaluationMatch = path.match(
    /^\/api\/schools\/ecole-demo\/classes\/class-6a\/evaluations\/([^/]+)$/,
  );
  if (method === "GET" && classEvaluationMatch) {
    const evaluationId = decodeURIComponent(classEvaluationMatch[1]);
    const detail = mockNotesState.evaluationDetails[evaluationId];
    if (!detail) {
      return json(res, 404, {
        message: "Evaluation introuvable.",
        statusCode: 404,
      });
    }
    return json(res, 200, detail);
  }

  if (method === "PATCH" && classEvaluationMatch) {
    readBody(req).then((raw) => {
      const evaluationId = decodeURIComponent(classEvaluationMatch[1]);
      const payload = parseJsonSafe(raw);
      const current = mockNotesState.evaluationDetails[evaluationId];

      if (!current) {
        return json(res, 404, {
          message: "Evaluation introuvable.",
          statusCode: 404,
        });
      }

      const subject = resolveNotesSubject(
        payload.subjectId || current.subject.id,
      );
      const branch = resolveNotesBranch(
        subject,
        payload.subjectBranchId || current.subjectBranch?.id,
      );
      const evaluationType = resolveEvaluationType(
        payload.evaluationTypeId || current.evaluationType.id,
      );
      const updated = {
        ...current,
        title: payload.title ?? current.title,
        description: payload.description ?? current.description,
        coefficient: Number(payload.coefficient ?? current.coefficient),
        maxScore: Number(payload.maxScore ?? current.maxScore),
        term: payload.term ?? current.term,
        status: payload.status ?? current.status,
        scheduledAt: payload.scheduledAt ?? current.scheduledAt,
        updatedAt: "2026-04-13T12:00:00.000Z",
        subject: { id: subject.id, name: subject.name },
        subjectBranch: branch ? { id: branch.id, name: branch.name } : null,
        evaluationType: {
          id: evaluationType.id,
          code: evaluationType.code,
          label: evaluationType.label,
        },
        attachments: Array.isArray(payload.attachments)
          ? payload.attachments
          : current.attachments,
      };

      mockNotesState.evaluationDetails[evaluationId] = updated;
      mockNotesState.evaluations = mockNotesState.evaluations.map((entry) =>
        entry.id === evaluationId ? { ...updated, students: undefined } : entry,
      );
      return json(
        res,
        200,
        mockNotesState.evaluations.find((entry) => entry.id === evaluationId),
      );
    });
    return;
  }

  const classEvaluationScoresMatch = path.match(
    /^\/api\/schools\/ecole-demo\/classes\/class-6a\/evaluations\/([^/]+)\/scores$/,
  );
  if (method === "PATCH" && classEvaluationScoresMatch) {
    readBody(req).then((raw) => {
      const evaluationId = decodeURIComponent(classEvaluationScoresMatch[1]);
      const payload = parseJsonSafe(raw);
      const current = mockNotesState.evaluationDetails[evaluationId];

      if (!current) {
        return json(res, 404, {
          message: "Evaluation introuvable.",
          statusCode: 404,
        });
      }

      const scores = Array.isArray(payload.scores) ? payload.scores : [];
      const updatedStudents = current.students.map((student) => {
        const draft = scores.find((entry) => entry.studentId === student.id);
        if (!draft) return student;
        return {
          ...student,
          score: draft.status === "ENTERED" ? Number(draft.score ?? 0) : null,
          scoreStatus: draft.status || "NOT_GRADED",
          comment: draft.comment || "",
        };
      });

      const enteredCount = updatedStudents.filter(
        (student) => student.scoreStatus === "ENTERED",
      ).length;
      const updated = {
        ...current,
        updatedAt: "2026-04-13T12:10:00.000Z",
        students: updatedStudents,
        _count: { scores: enteredCount },
      };

      mockNotesState.evaluationDetails[evaluationId] = updated;
      mockNotesState.evaluations = mockNotesState.evaluations.map((entry) =>
        entry.id === evaluationId
          ? { ...entry, _count: { scores: enteredCount } }
          : entry,
      );
      return json(res, 200, updated);
    });
    return;
  }

  if (
    method === "GET" &&
    path === "/api/schools/ecole-demo/classes/class-6a/term-reports"
  ) {
    const term = requestUrl.searchParams.get("term");
    return json(res, 200, listNoteReports(term));
  }

  const termReportsMatch = path.match(
    /^\/api\/schools\/ecole-demo\/classes\/class-6a\/term-reports\/([^/]+)$/,
  );
  if (method === "PATCH" && termReportsMatch) {
    readBody(req).then((raw) => {
      const term = decodeURIComponent(termReportsMatch[1]);
      const payload = parseJsonSafe(raw);
      const current = mockNotesState.termReports[term] ?? {
        term,
        status: "DRAFT",
        councilHeldAt: null,
        students: [],
      };

      const updated = {
        ...current,
        status: payload.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        councilHeldAt: payload.councilHeldAt || null,
        students: Array.isArray(payload.students)
          ? payload.students.map((entry) => ({
              studentId: entry.studentId,
              firstName:
                MOCK_NOTES_TEACHER_CONTEXT.students.find(
                  (student) => student.id === entry.studentId,
                )?.firstName ?? "",
              lastName:
                MOCK_NOTES_TEACHER_CONTEXT.students.find(
                  (student) => student.id === entry.studentId,
                )?.lastName ?? "",
              generalAppreciation: entry.generalAppreciation || "",
              subjects: Array.isArray(entry.subjects) ? entry.subjects : [],
            }))
          : current.students,
      };

      mockNotesState.termReports[term] = updated;
      return json(res, 200, listNoteReports());
    });
    return;
  }

  if (method === "GET" && path === "/api/schools/ecole-demo/timetable/me") {
    return json(res, 200, buildMyTimetablePayload());
  }

  if (
    method === "GET" &&
    path === "/api/schools/ecole-demo/timetable/classes/class-6a/context"
  ) {
    return json(res, 200, buildClassContextPayload());
  }

  if (
    method === "GET" &&
    path === "/api/schools/ecole-demo/timetable/classes/class-6a"
  ) {
    return json(res, 200, buildClassTimetablePayload());
  }

  if (
    method === "POST" &&
    path === "/api/schools/ecole-demo/timetable/classes/class-6a/slots"
  ) {
    readBody(req).then((raw) => {
      const payload = parseJsonSafe(raw);
      if (payload.startMinute === 999) {
        return json(res, 400, {
          message: "Créneau invalide pour cette classe",
          statusCode: 400,
        });
      }
      timetableSlotCounter += 1;
      const created = {
        id: `slot-${timetableSlotCounter}`,
        weekday: Number(payload.weekday ?? 1),
        startMinute: Number(payload.startMinute ?? 450),
        endMinute: Number(payload.endMinute ?? 510),
        room: payload.room ?? null,
        activeFromDate: payload.activeFromDate ?? "2026-04-06",
        activeToDate: payload.activeToDate ?? "2026-05-30",
        subject:
          payload.subjectId === "subject-fr"
            ? { id: "subject-fr", name: "Français" }
            : { id: "subject-math", name: "Maths" },
        teacherUser: {
          id: payload.teacherUserId ?? "teacher-1",
          firstName: "Paul",
          lastName: "Manga",
          email: "teacher@ecole.cm",
        },
      };
      mockTimetableState.slots.push(created);
      return json(res, 201, created);
    });
    return;
  }

  const lifeEventsMatch = path.match(
    /^\/api\/schools\/ecole-demo\/students\/([^/]+)\/life-events(?:\/([^/]+))?$/,
  );

  if (lifeEventsMatch && method === "GET") {
    if (currentDisciplineScenario === "list_error") {
      return json(res, 500, {
        message: "Impossible de charger la vie scolaire.",
        statusCode: 500,
      });
    }

    if (currentDisciplineScenario === "list_error_once") {
      currentDisciplineScenario = "happy_path";
      return json(res, 500, {
        message: "Impossible de charger la vie scolaire.",
        statusCode: 500,
      });
    }

    const studentId = lifeEventsMatch[1];
    const filterType = requestUrl.searchParams.get("type");
    const items = [...(mockLifeEventsByStudent[studentId] || [])].filter(
      (event) => !filterType || event.type === filterType,
    );
    return json(res, 200, items);
  }

  if (lifeEventsMatch && method === "POST") {
    if (currentDisciplineScenario === "create_error") {
      return json(res, 400, {
        message: "Creation discipline refusee.",
        statusCode: 400,
      });
    }

    readBody(req).then((raw) => {
      const payload = JSON.parse(raw || "{}");
      const studentId = lifeEventsMatch[1];
      lifeEventCounter += 1;
      const created = {
        id: `life-${lifeEventCounter}`,
        schoolId: "school-1",
        studentId,
        classId: payload.classId || "class-1",
        schoolYearId: "year-1",
        authorUserId: "staff-1",
        type: payload.type || "ABSENCE",
        occurredAt: payload.occurredAt || "2026-04-05T08:00:00.000Z",
        durationMinutes:
          typeof payload.durationMinutes === "number"
            ? payload.durationMinutes
            : null,
        justified:
          typeof payload.justified === "boolean" ? payload.justified : null,
        reason: payload.reason || "Evenement discipline",
        comment: payload.comment || null,
        createdAt: "2026-04-05T08:05:00.000Z",
        updatedAt: "2026-04-05T08:05:00.000Z",
        class: { id: "class-1", name: "6e A" },
        schoolYear: { id: "year-1", label: "2025-2026" },
        authorUser: {
          id: "staff-1",
          firstName: "Anne",
          lastName: "Rousselot",
          email: "anne.rousselot@ecole.cm",
        },
      };

      mockLifeEventsByStudent[studentId] = [
        created,
        ...(mockLifeEventsByStudent[studentId] || []),
      ];
      return json(res, 201, created);
    });
    return;
  }

  if (lifeEventsMatch && method === "PATCH") {
    if (currentDisciplineScenario === "update_error") {
      return json(res, 400, {
        message: "Modification discipline refusee.",
        statusCode: 400,
      });
    }

    readBody(req).then((raw) => {
      const payload = JSON.parse(raw || "{}");
      const studentId = lifeEventsMatch[1];
      const eventId = lifeEventsMatch[2];
      const events = mockLifeEventsByStudent[studentId] || [];
      const index = events.findIndex((event) => event.id === eventId);

      if (index === -1) {
        return json(res, 404, {
          message: "Evenement discipline introuvable.",
          statusCode: 404,
        });
      }

      events[index] = {
        ...events[index],
        ...payload,
        updatedAt: "2026-04-05T09:00:00.000Z",
      };
      return json(res, 200, events[index]);
    });
    return;
  }

  if (
    method === "PATCH" &&
    path.match(/^\/api\/schools\/ecole-demo\/timetable\/slots\/[^/]+$/)
  ) {
    const slotId = path.split("/").pop();
    readBody(req).then((raw) => {
      const payload = parseJsonSafe(raw);
      mockTimetableState.slots = mockTimetableState.slots.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              weekday: payload.weekday ?? slot.weekday,
              startMinute: payload.startMinute ?? slot.startMinute,
              endMinute: payload.endMinute ?? slot.endMinute,
              room: payload.room ?? slot.room,
            }
          : slot,
      );
      const updated = mockTimetableState.slots.find(
        (slot) => slot.id === slotId,
      );
      return json(res, 200, updated);
    });
    return;
  }

  if (
    method === "DELETE" &&
    path.match(/^\/api\/schools\/ecole-demo\/timetable\/slots\/[^/]+$/)
  ) {
    const slotId = path.split("/").pop();
    mockTimetableState.slots = mockTimetableState.slots.filter(
      (slot) => slot.id !== slotId,
    );
    res.writeHead(204);
    res.end();
    return;
  }

  if (
    method === "POST" &&
    path === "/api/schools/ecole-demo/timetable/classes/class-6a/one-off-slots"
  ) {
    readBody(req).then((raw) => {
      const payload = parseJsonSafe(raw);
      timetableOneOffCounter += 1;
      const created = {
        id: `oneoff-${timetableOneOffCounter}`,
        occurrenceDate: payload.occurrenceDate ?? "2026-04-18",
        startMinute: Number(payload.startMinute ?? 600),
        endMinute: Number(payload.endMinute ?? 660),
        room: payload.room ?? null,
        status: payload.status ?? "PLANNED",
        sourceSlotId: payload.sourceSlotId ?? null,
        subject:
          payload.subjectId === "subject-fr"
            ? { id: "subject-fr", name: "Français" }
            : { id: "subject-math", name: "Maths" },
        teacherUser: {
          id: payload.teacherUserId ?? "teacher-1",
          firstName: "Paul",
          lastName: "Manga",
          email: "teacher@ecole.cm",
        },
      };
      mockTimetableState.oneOffSlots.push(created);
      return json(res, 201, created);
    });
    return;
  }

  if (
    method === "PATCH" &&
    path.match(/^\/api\/schools\/ecole-demo\/timetable\/one-off-slots\/[^/]+$/)
  ) {
    const oneOffId = path.split("/").pop();
    readBody(req).then((raw) => {
      const payload = parseJsonSafe(raw);
      mockTimetableState.oneOffSlots = mockTimetableState.oneOffSlots.map(
        (slot) =>
          slot.id === oneOffId
            ? {
                ...slot,
                occurrenceDate: payload.occurrenceDate ?? slot.occurrenceDate,
                startMinute: payload.startMinute ?? slot.startMinute,
                endMinute: payload.endMinute ?? slot.endMinute,
                room: payload.room ?? slot.room,
                status: payload.status ?? slot.status,
              }
            : slot,
      );
      const updated = mockTimetableState.oneOffSlots.find(
        (slot) => slot.id === oneOffId,
      );
      return json(res, 200, updated);
    });
    return;
  }

  if (
    method === "DELETE" &&
    path.match(/^\/api\/schools\/ecole-demo\/timetable\/one-off-slots\/[^/]+$/)
  ) {
    const oneOffId = path.split("/").pop();
    mockTimetableState.oneOffSlots = mockTimetableState.oneOffSlots.filter(
      (slot) => slot.id !== oneOffId,
    );
    res.writeHead(204);
    res.end();
    return;
  }

  if (
    method === "POST" &&
    path === "/api/schools/ecole-demo/timetable/calendar-events"
  ) {
    readBody(req).then((raw) => {
      const payload = parseJsonSafe(raw);
      timetableEventCounter += 1;
      const created = {
        id: `event-${timetableEventCounter}`,
        type: payload.type ?? "HOLIDAY",
        scope: payload.scope ?? "SCHOOL",
        label: payload.label ?? "Congé",
        startDate: payload.startDate ?? "2026-05-21",
        endDate: payload.endDate ?? "2026-05-21",
        schoolYearId: payload.schoolYearId ?? "sy-1",
        academicLevelId: payload.academicLevelId ?? null,
        classId: payload.classId ?? null,
      };
      mockTimetableState.calendarEvents.push(created);
      return json(res, 201, created);
    });
    return;
  }

  if (
    method === "PATCH" &&
    path.match(
      /^\/api\/schools\/ecole-demo\/timetable\/calendar-events\/[^/]+$/,
    )
  ) {
    const eventId = path.split("/").pop();
    readBody(req).then((raw) => {
      const payload = parseJsonSafe(raw);
      mockTimetableState.calendarEvents = mockTimetableState.calendarEvents.map(
        (event) =>
          event.id === eventId
            ? {
                ...event,
                label: payload.label ?? event.label,
                startDate: payload.startDate ?? event.startDate,
                endDate: payload.endDate ?? event.endDate,
              }
            : event,
      );
      const updated = mockTimetableState.calendarEvents.find(
        (event) => event.id === eventId,
      );
      return json(res, 200, updated);
    });
    return;
  }

  if (
    method === "DELETE" &&
    path.match(
      /^\/api\/schools\/ecole-demo\/timetable\/calendar-events\/[^/]+$/,
    )
  ) {
    const eventId = path.split("/").pop();
    mockTimetableState.calendarEvents =
      mockTimetableState.calendarEvents.filter((event) => event.id !== eventId);
    res.writeHead(204);
    res.end();
    return;
  }

  if (method === "GET" && path === "/api/schools/ecole-demo/feed") {
    if (currentFeedScenario === "list_error") {
      return json(res, 500, {
        message: "Chargement du fil impossible",
        statusCode: 500,
      });
    }
    if (
      currentFeedScenario === "list_error_once" &&
      !feedListErrorOnceConsumed
    ) {
      feedListErrorOnceConsumed = true;
      return json(res, 500, {
        message: "Chargement du fil impossible",
        statusCode: 500,
      });
    }
    const items = filterFeedPosts(requestUrl.searchParams);
    return json(res, 200, {
      items,
      meta: {
        page: 1,
        limit: 12,
        total: items.length,
        totalPages: 1,
      },
    });
  }

  if (
    method === "POST" &&
    path === "/api/schools/ecole-demo/feed/uploads/inline-image"
  ) {
    return json(res, 201, {
      url: "http://10.0.2.2:3001/mock/media/inline-image.png",
    });
  }

  if (method === "POST" && path === "/api/schools/ecole-demo/feed") {
    if (
      currentFeedScenario === "create_error" ||
      currentFeedScenario === "action_errors"
    ) {
      return json(res, 403, {
        message: "Publication verrouillée",
        statusCode: 403,
      });
    }
    readBody(req).then((raw) => {
      const payload = JSON.parse(raw || "{}");
      feedCounter += 1;

      const created = {
        id: `feed-${feedCounter}`,
        type: payload.type || "POST",
        author: {
          id: "parent-1",
          fullName: "Robert Ntamack",
          civility: "M.",
          roleLabel: "Parent",
          avatarText: "RN",
        },
        title: payload.title || "Nouvelle actualité",
        bodyHtml: payload.bodyHtml || "<p>Publication vide.</p>",
        createdAt: "2026-04-05T10:00:00.000Z",
        featuredUntil:
          typeof payload.featuredDays === "number" && payload.featuredDays > 0
            ? "2026-04-12T10:00:00.000Z"
            : null,
        audience: {
          scope: payload.audienceScope || "PARENTS_ONLY",
          label: payload.audienceLabel || "Parents uniquement",
        },
        attachments: (payload.attachments || []).map((attachment, index) => ({
          id: `feed-attachment-${feedCounter}-${index + 1}`,
          fileName: attachment.fileName,
          fileUrl: attachment.fileUrl || null,
          sizeLabel: attachment.sizeLabel || "",
        })),
        likedByViewer: false,
        likesCount: 0,
        authoredByViewer: true,
        canManage: true,
        comments: [],
        poll:
          payload.type === "POLL"
            ? {
                question: payload.pollQuestion || "Question",
                votedOptionId: null,
                options: (payload.pollOptions || []).map((label, index) => ({
                  id: `feed-poll-${feedCounter}-${index + 1}`,
                  label,
                  votes: 0,
                })),
              }
            : undefined,
      };

      mockFeedPosts = [created, ...mockFeedPosts];
      return json(res, 201, created);
    });
    return;
  }

  if (
    method === "POST" &&
    path.match(/^\/api\/schools\/ecole-demo\/feed\/[^/]+\/likes\/toggle$/)
  ) {
    if (
      currentFeedScenario === "like_error" ||
      currentFeedScenario === "action_errors"
    ) {
      return json(res, 503, {
        message: "Like indisponible",
        statusCode: 503,
      });
    }
    const postId = path.split("/")[5];
    const post = mockFeedPosts.find((entry) => entry.id === postId);
    if (!post) {
      return json(res, 404, {
        message: "Feed post not found",
        statusCode: 404,
      });
    }
    post.likedByViewer = !post.likedByViewer;
    post.likesCount = Math.max(
      0,
      post.likesCount + (post.likedByViewer ? 1 : -1),
    );
    return json(res, 200, {
      liked: post.likedByViewer,
      likesCount: post.likesCount,
    });
  }

  if (
    method === "POST" &&
    path.match(/^\/api\/schools\/ecole-demo\/feed\/[^/]+\/comments$/)
  ) {
    if (
      currentFeedScenario === "comment_error" ||
      currentFeedScenario === "action_errors"
    ) {
      return json(res, 403, {
        message: "Commentaire fermé",
        statusCode: 403,
      });
    }
    const postId = path.split("/")[5];
    const post = mockFeedPosts.find((entry) => entry.id === postId);
    if (!post) {
      return json(res, 404, {
        message: "Feed post not found",
        statusCode: 404,
      });
    }
    readBody(req).then((raw) => {
      const payload = JSON.parse(raw || "{}");
      feedCommentCounter += 1;
      const comment = {
        id: `feed-comment-${feedCommentCounter}`,
        authorName: "Robert Ntamack",
        text: payload.text || "Merci",
        createdAt: "2026-04-05T10:30:00.000Z",
      };
      post.comments.push(comment);
      return json(res, 201, {
        comment,
        commentsCount: post.comments.length,
      });
    });
    return;
  }

  if (
    method === "POST" &&
    path.match(/^\/api\/schools\/ecole-demo\/feed\/[^/]+\/polls\/[^/]+\/vote$/)
  ) {
    if (
      currentFeedScenario === "vote_error" ||
      currentFeedScenario === "action_errors"
    ) {
      return json(res, 400, {
        message: "Vote déjà enregistré",
        statusCode: 400,
      });
    }
    const segments = path.split("/");
    const postId = segments[5];
    const optionId = segments[7];
    const post = mockFeedPosts.find((entry) => entry.id === postId);
    if (!post) {
      return json(res, 404, {
        message: "Feed post not found",
        statusCode: 404,
      });
    }
    if (post.type !== "POLL" || !post.poll) {
      return json(res, 400, {
        message: "Not a poll post",
        statusCode: 400,
      });
    }
    if (post.poll.votedOptionId) {
      return json(res, 400, {
        message: "Vote deja enregistre",
        statusCode: 400,
      });
    }
    const selected = post.poll.options.find((entry) => entry.id === optionId);
    if (!selected) {
      return json(res, 400, {
        message: "Option de vote introuvable",
        statusCode: 400,
      });
    }

    post.poll.votedOptionId = optionId;
    post.poll.options = post.poll.options.map((entry) =>
      entry.id === optionId ? { ...entry, votes: entry.votes + 1 } : entry,
    );

    return json(res, 201, {
      votedOptionId: optionId,
      options: post.poll.options,
    });
  }

  if (
    method === "DELETE" &&
    path.match(/^\/api\/schools\/ecole-demo\/feed\/[^/]+$/)
  ) {
    if (
      currentFeedScenario === "delete_error" ||
      currentFeedScenario === "action_errors"
    ) {
      return json(res, 403, {
        message: "Suppression refusée",
        statusCode: 403,
      });
    }
    const postId = path.split("/")[5];
    mockFeedPosts = mockFeedPosts.filter((entry) => entry.id !== postId);
    return json(res, 200, { success: true, postId });
  }

  if (
    method === "GET" &&
    path === "/api/schools/ecole-demo/messaging/recipients"
  ) {
    return json(res, 200, MOCK_RECIPIENTS);
  }

  if (
    method === "GET" &&
    path === "/api/schools/ecole-demo/messages/unread-count"
  ) {
    const unread = mockMessages.filter(
      (message) => message.folder === "inbox" && message.unread,
    ).length;
    return json(res, 200, { unread });
  }

  if (method === "GET" && path === "/api/schools/ecole-demo/messages") {
    const folder = requestUrl.searchParams.get("folder") || "inbox";
    const items = mockMessages
      .filter((message) => message.folder === folder)
      .map(mapListItem);
    return json(res, 200, {
      items,
      meta: {
        page: 1,
        limit: 25,
        total: items.length,
        totalPages: 1,
      },
    });
  }

  if (
    method === "GET" &&
    path.startsWith("/api/schools/ecole-demo/messages/")
  ) {
    const messageId = path.split("/").pop();
    const message = findMessageById(messageId);
    if (!message) {
      return json(res, 404, { message: "Message not found", statusCode: 404 });
    }
    return json(res, 200, mapDetail(message));
  }

  if (
    method === "POST" &&
    path === "/api/schools/ecole-demo/messages/uploads/inline-image"
  ) {
    return json(res, 201, {
      url: "http://10.0.2.2:3001/mock/media/inline-image.png",
    });
  }

  if (method === "POST" && path === "/api/schools/ecole-demo/messages") {
    readBody(req).then((raw) => {
      const subject = extractMultipartField(raw, "subject") || "Message E2E";
      const body =
        extractMultipartField(raw, "body") || "<p>Bonjour Maestro</p>";
      const recipientIds = extractMultipartFields(raw, "recipientUserIds");
      const attachments = extractMultipartAttachments(raw);

      messageCounter += 1;
      mailboxCounter += 1;

      const recipients =
        recipientIds.length > 0
          ? recipientIds.map((userId, index) => ({
              id: `recipient-${messageCounter}-${index + 1}`,
              userId,
              firstName: "Anne",
              lastName: "Rousselot",
              email: "anne.rousselot@ecole.cm",
              readAt: null,
              archivedAt: null,
            }))
          : [];

      const message = {
        id: `msg-sent-${messageCounter}`,
        folder: "sent",
        status: "SENT",
        subject,
        body,
        createdAt: "2026-04-04T10:30:00.000Z",
        sentAt: "2026-04-04T10:30:00.000Z",
        unread: false,
        sender: {
          id: "parent-1",
          firstName: "Robert",
          lastName: "Ntamack",
          email: "teacher@ecole.cm",
        },
        recipients,
        recipientState: null,
        isSender: true,
        mailboxEntryId: `mailbox-${mailboxCounter}`,
        attachments,
      };

      mockMessages = [message, ...mockMessages];
      return json(res, 201, mapDetail(message));
    });
    return;
  }

  if (
    method === "PATCH" &&
    path.match(/^\/api\/schools\/ecole-demo\/messages\/[^/]+\/read$/)
  ) {
    const messageId = path.split("/")[5];
    const message = findMessageById(messageId);
    if (!message) {
      return json(res, 404, { message: "Message not found", statusCode: 404 });
    }
    message.unread = false;
    if (message.recipientState) {
      message.recipientState.readAt = "2026-04-04T10:31:00.000Z";
    }
    res.writeHead(204);
    res.end();
    return;
  }

  // ── Route inconnue ────────────────────────────────────────────
  json(res, 404, { message: "Not found", statusCode: 404 });
}

// ────────────────────────── Cycle de vie ──────────────────────────

function checkPortFree(port) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", (err) => {
      if (err.code === "EADDRINUSE") {
        reject(
          new Error(
            `[E2E] Le port ${port} est déjà utilisé.\n` +
              "Arrêtez l'API réelle avant de lancer les tests E2E :\n" +
              '  pkill -f "nest" || true',
          ),
        );
      } else {
        reject(err);
      }
    });
    probe.once("listening", () => probe.close(() => resolve()));
    probe.listen(port);
  });
}

async function startMockServer(port = 3001) {
  await checkPortFree(port);
  return new Promise((resolve, reject) => {
    server = http.createServer(handleRequest);
    server.listen(port, "0.0.0.0", () => {
      console.log(`[mock] serveur E2E démarré sur le port ${port}`);
      resolve();
    });
    server.on("error", reject);
  });
}

function stopMockServer() {
  return new Promise((resolve) => {
    if (!server) return resolve();
    server.close(() => {
      console.log("[mock] serveur E2E arrêté");
      server = null;
      resolve();
    });
  });
}

module.exports = { startMockServer, stopMockServer, SCENARIOS };
