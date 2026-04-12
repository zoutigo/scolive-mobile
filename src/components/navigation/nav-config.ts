import type { AuthUser, AppRole, SchoolRole } from "../../types/auth.types";
import type { ParentChild } from "../../types/family.types";

export type NavItem = {
  key: string;
  label: string;
  icon: string;
  route: string;
  params?: Record<string, string>;
};

export type ParentChildSection = ParentChild & {
  navItems: NavItem[];
};

export type ViewType =
  | "platform"
  | "school"
  | "teacher"
  | "parent"
  | "student"
  | "unknown";

const SCHOOL_STAFF_ROLES: SchoolRole[] = [
  "SCHOOL_ADMIN",
  "SCHOOL_MANAGER",
  "SUPERVISOR",
  "SCHOOL_ACCOUNTANT",
  "SCHOOL_STAFF",
];

const SCHOOL_ROLES = new Set<AppRole>([
  "SCHOOL_ADMIN",
  "SCHOOL_MANAGER",
  "SUPERVISOR",
  "SCHOOL_ACCOUNTANT",
  "SCHOOL_STAFF",
  "TEACHER",
  "PARENT",
  "STUDENT",
]);

function getEffectiveRole(user: AuthUser): AppRole | null {
  const role = user.activeRole ?? user.role;
  if (role) return role;
  if (user.memberships.length > 0) return user.memberships[0].role;
  return null;
}

export function getViewType(user: AuthUser): ViewType {
  if (user.platformRoles.length > 0) return "platform";
  const role = getEffectiveRole(user);
  if (!role || !SCHOOL_ROLES.has(role)) return "unknown";
  if (SCHOOL_STAFF_ROLES.includes(role as SchoolRole)) return "school";
  if (role === "TEACHER") return "teacher";
  if (role === "PARENT") return "parent";
  if (role === "STUDENT") return "student";
  return "unknown";
}

export function getPortalLabel(view: ViewType): string {
  switch (view) {
    case "platform":
      return "Portail administration";
    case "school":
      return "Portail établissement";
    case "teacher":
      return "Portail enseignant";
    case "parent":
    case "student":
      return "Portail famille";
    default:
      return "Scolive";
  }
}

const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  ADMIN: "Administrateur",
  SALES: "Commercial",
  SUPPORT: "Support",
  SCHOOL_ADMIN: "Administrateur école",
  SCHOOL_MANAGER: "Directeur",
  SUPERVISOR: "Superviseur",
  SCHOOL_ACCOUNTANT: "Comptable",
  SCHOOL_STAFF: "Personnel",
  TEACHER: "Enseignant(e)",
  PARENT: "Parent",
  STUDENT: "Élève",
};

export function getRoleLabel(user: AuthUser): string {
  const role = getEffectiveRole(user);
  if (!role) return "";
  return ROLE_LABELS[role] ?? role;
}

function placeholder(label: string, icon: string, key: string): NavItem {
  return {
    key,
    label,
    icon,
    route: "/placeholder",
    params: { title: label },
  };
}

function feedItem(): NavItem {
  return {
    key: "feed",
    label: "Fil d'actualité",
    icon: "newspaper-outline",
    route: "/feed",
  };
}

const PLATFORM_NAV: NavItem[] = [
  { key: "home", label: "Accueil", icon: "home-outline", route: "/" },
  placeholder("Écoles", "business-outline", "schools"),
  placeholder("Classes", "book-outline", "classes"),
  placeholder("Matières", "library-outline", "subjects"),
  placeholder("Curriculums", "layers-outline", "curriculums"),
  placeholder("Inscriptions", "person-add-outline", "enrollments"),
  placeholder("Élèves", "people-outline", "students"),
  placeholder("Utilisateurs", "person-outline", "users"),
  placeholder("Indicateurs", "bar-chart-outline", "indicators"),
  placeholder("Mon compte", "settings-outline", "account"),
];

const SCHOOL_NAV: NavItem[] = [
  { key: "home", label: "Accueil", icon: "home-outline", route: "/" },
  feedItem(),
  placeholder("Classes", "book-outline", "classes"),
  placeholder("Matières", "library-outline", "subjects"),
  placeholder("Curriculums", "layers-outline", "curriculums"),
  placeholder("Inscriptions", "person-add-outline", "enrollments"),
  placeholder("Élèves", "people-outline", "students"),
  placeholder("Enseignants", "school-outline", "teachers"),
  placeholder("Parents-Élèves", "people-circle-outline", "parents"),
  placeholder("Notes", "ribbon-outline", "grades"),
  {
    key: "discipline",
    label: "Discipline",
    icon: "shield-outline",
    route: "/placeholder",
    params: { title: "Discipline" },
  },
  {
    key: "messages",
    label: "Messagerie",
    icon: "chatbubble-outline",
    route: "/messages",
  },
  placeholder("Mon compte", "settings-outline", "account"),
];

const TEACHER_NAV: NavItem[] = [
  { key: "home", label: "Tableau de bord", icon: "home-outline", route: "/" },
  feedItem(),
  placeholder("Mes classes", "book-outline", "classes"),
  placeholder("Cahier de notes", "journal-outline", "gradebook"),
  {
    key: "discipline",
    label: "Discipline",
    icon: "shield-outline",
    route: "/placeholder",
    params: { title: "Discipline" },
  },
  {
    key: "messages",
    label: "Messagerie",
    icon: "chatbubble-outline",
    route: "/messages",
  },
  placeholder("Mon compte", "settings-outline", "account"),
];

const PARENT_NAV: NavItem[] = [
  { key: "home", label: "Accueil", icon: "home-outline", route: "/" },
  feedItem(),
  placeholder("Situation financière", "wallet-outline", "finance"),
  {
    key: "messages",
    label: "Messagerie",
    icon: "chatbubble-outline",
    route: "/messages",
  },
  placeholder("Documents", "document-outline", "documents"),
  placeholder("Mon compte", "settings-outline", "account"),
];

const STUDENT_NAV: NavItem[] = [
  { key: "home", label: "Accueil", icon: "home-outline", route: "/" },
  placeholder("Notes & devoirs", "ribbon-outline", "grades"),
  {
    key: "messages",
    label: "Messagerie",
    icon: "chatbubble-outline",
    route: "/messages",
  },
  placeholder("Documents", "document-outline", "documents"),
  placeholder("Mon compte", "settings-outline", "account"),
];

export function buildChildNavItems(childId: string): NavItem[] {
  return [
    {
      key: `child-${childId}-home`,
      label: "Accueil",
      icon: "home-outline",
      route: "/placeholder",
      params: { title: "Accueil enfant" },
    },
    {
      key: `child-${childId}-grades`,
      label: "Notes",
      icon: "ribbon-outline",
      route: "/placeholder",
      params: { title: "Notes" },
    },
    {
      key: `child-${childId}-schedule`,
      label: "Emploi du temps",
      icon: "calendar-outline",
      route: "/placeholder",
      params: { title: "Emploi du temps" },
    },
    {
      key: `child-${childId}-life`,
      label: "Vie scolaire",
      icon: "person-circle-outline",
      route: "/(home)/vie-scolaire/[childId]",
      params: { childId },
    },
    {
      key: `child-${childId}-messages`,
      label: "Messagerie",
      icon: "chatbubble-outline",
      route: "/messages",
    },
    {
      key: `child-${childId}-documents`,
      label: "Documents",
      icon: "document-outline",
      route: "/placeholder",
      params: { title: "Documents" },
    },
  ];
}

export function buildChildSections(
  children: ParentChild[],
): ParentChildSection[] {
  return children.map((child) => ({
    ...child,
    navItems: buildChildNavItems(child.id),
  }));
}

export function getNavItems(user: AuthUser): NavItem[] {
  const view = getViewType(user);
  switch (view) {
    case "platform":
      return PLATFORM_NAV;
    case "school":
      return SCHOOL_NAV;
    case "teacher":
      return TEACHER_NAV;
    case "parent":
      return PARENT_NAV;
    case "student":
      return STUDENT_NAV;
    default:
      return [];
  }
}
