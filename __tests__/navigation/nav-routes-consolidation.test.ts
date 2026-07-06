import fs from "fs";
import path from "path";
import { getNavItems } from "../../src/components/navigation/nav-config";
import type { AuthUser, AppRole } from "../../src/types/auth.types";

// Ce test consolide le lien entre le menu (nav-config) et les écrans réels.
//
// Contexte : à plusieurs reprises, un module a été développé (écran + API)
// sans jamais être ajouté au tableau de navigation du rôle concerné (ex.
// Classes pour l'admin école, Messagerie pour le super admin). Ce test
// vérifie dans les deux sens :
//  - toute route non-placeholder du menu pointe vers un fichier d'écran qui
//    existe réellement (détecte un lien mort ou un item mal orthographié) ;
//  - tout dossier d'écran "métier" sous app/(home) est référencé par au
//    moins un rôle (détecte un écran construit mais jamais branché au menu).

const APP_HOME_DIR = path.join(__dirname, "../../app/(home)");

function makeUser(overrides: Partial<AuthUser>): AuthUser {
  return {
    id: "u1",
    firstName: "Test",
    lastName: "User",
    platformRoles: [],
    memberships: [],
    profileCompleted: true,
    role: null,
    activeRole: null,
    ...overrides,
  };
}

const ROLE_USERS: Record<string, AuthUser> = {
  platform: makeUser({ platformRoles: ["SUPER_ADMIN"], role: "SUPER_ADMIN" }),
  school: makeUser({ role: "SCHOOL_ADMIN" as AppRole }),
  teacher: makeUser({
    role: "TEACHER" as AppRole,
    memberships: [{ schoolId: "s1", role: "TEACHER" }],
  }),
  parent: makeUser({
    role: "PARENT" as AppRole,
    memberships: [{ schoolId: "s1", role: "PARENT" }],
  }),
  student: makeUser({
    role: "STUDENT" as AppRole,
    memberships: [{ schoolId: "s1", role: "STUDENT" }],
  }),
};

function screenExistsForRoute(route: string): boolean {
  const normalized = route
    .replace(/^\/\(home\)/, "")
    .replace(/^\//, "")
    .replace(/\/$/, "");

  if (normalized === "") {
    return fs.existsSync(path.join(APP_HOME_DIR, "index.tsx"));
  }

  const directFile = path.join(APP_HOME_DIR, `${normalized}.tsx`);
  const indexFile = path.join(APP_HOME_DIR, normalized, "index.tsx");
  return fs.existsSync(directFile) || fs.existsSync(indexFile);
}

// Dossiers/fichiers qui ne sont pas des modules métier référencés depuis le
// menu (routes internes, écrans de détail atteints par navigation profonde,
// ou routes volontairement génériques).
const NON_MENU_SCREENS = new Set([
  "index.tsx",
  "_layout.tsx",
  "placeholder.tsx",
  "children", // atteint via les sections "enfant" du parent, pas le menu plat
  "discipline-student", // atteint via un item Discipline, pas un module de menu dédié
  "vie-scolaire", // idem, atteint via les sections enfant
  "classes", // sous-modules enseignant par classe, pas un item de menu plat
  "notes", // "grades"/"Notes" pointe vers /notes -> couvert, mais dossier contient aussi child/class dynamiques
  "tickets", // branché via la bottom tab bar ("Support"), pas le drawer
  "tests", // branché via la bottom tab bar ("Tests"), distinct de "admin-tests"
]);

describe("Consolidation menu ↔ écrans (nav-config ↔ app/(home))", () => {
  const allItemsByRole = Object.entries(ROLE_USERS).map(([role, user]) => ({
    role,
    items: getNavItems(user),
  }));

  for (const { role, items } of allItemsByRole) {
    for (const item of items) {
      if (item.route === "/placeholder") continue;

      it(`[${role}] l'item "${item.key}" (${item.route}) pointe vers un écran existant`, () => {
        expect(screenExistsForRoute(item.route)).toBe(true);
      });
    }
  }

  it("chaque module de menu déclaré référence un dossier/fichier distinct sous app/(home)", () => {
    const declaredFolders = new Set<string>();
    for (const { items } of allItemsByRole) {
      for (const item of items) {
        if (item.route === "/placeholder") continue;
        const normalized = item.route
          .replace(/^\/\(home\)/, "")
          .replace(/^\//, "");
        if (normalized) declaredFolders.add(normalized.split("/")[0]);
      }
    }

    const actualEntries = fs
      .readdirSync(APP_HOME_DIR)
      .filter((entry) => !NON_MENU_SCREENS.has(entry));

    const missingFromMenu = actualEntries.filter(
      (entry) => !declaredFolders.has(entry.replace(/\.tsx$/, "")),
    );

    expect(missingFromMenu).toEqual([]);
  });
});
