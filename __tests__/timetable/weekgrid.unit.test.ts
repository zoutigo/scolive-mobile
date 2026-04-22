import { computeWeekDayColumnWidth } from "../../src/components/timetable/ChildTimetableScreen";

// availableWidth = screenWidth - 68 (outer padding)
// dayColWidth    = floor((availableWidth - 36 - nDays*2) / nDays), min 56

describe("computeWeekDayColumnWidth — logique de calcul responsive", () => {
  describe("téléphone (écran étroit)", () => {
    it("retourne 56 (minimum) sur un téléphone 360px avec 5 jours", () => {
      // available = 360-68=292, raw=(292-36-10)/5=49.2 → floor→49 → min→56
      expect(computeWeekDayColumnWidth(360, 5)).toBe(56);
    });

    it("retourne 56 (minimum) sur un téléphone 375px avec 5 jours", () => {
      // available = 375-68=307, raw=(307-36-10)/5=52.2 → floor→52 → min→56
      expect(computeWeekDayColumnWidth(375, 5)).toBe(56);
    });

    it("retourne 56 (minimum) sur un téléphone 390px avec 5 jours", () => {
      // available = 390-68=322, raw=(322-36-10)/5=55.2 → floor→55 → min→56
      expect(computeWeekDayColumnWidth(390, 5)).toBe(56);
    });

    it("retourne 56 (minimum) sur un téléphone 360px avec 6 jours", () => {
      // available = 292, raw=(292-36-12)/6=40.67 → floor→40 → min→56
      expect(computeWeekDayColumnWidth(360, 6)).toBe(56);
    });

    it("retourne 56 (minimum) sur un téléphone 360px avec 7 jours", () => {
      // available = 292, raw=(292-36-14)/7=34.57 → floor→34 → min→56
      expect(computeWeekDayColumnWidth(360, 7)).toBe(56);
    });
  });

  describe("tablette (écran large)", () => {
    it("retourne une largeur supérieure à 56 sur une tablette 768px avec 5 jours", () => {
      // available = 768-68=700, raw=(700-36-10)/5=130.8 → floor→130
      expect(computeWeekDayColumnWidth(768, 5)).toBe(130);
    });

    it("retourne une largeur supérieure à 56 sur une tablette 768px avec 6 jours", () => {
      // available = 700, raw=(700-36-12)/6=108.67 → floor→108
      expect(computeWeekDayColumnWidth(768, 6)).toBe(108);
    });

    it("retourne une largeur supérieure à 56 sur une tablette 768px avec 7 jours", () => {
      // available = 700, raw=(700-36-14)/7=92.86 → floor→92
      expect(computeWeekDayColumnWidth(768, 7)).toBe(92);
    });

    it("retourne une largeur supérieure à 56 sur une tablette 1024px avec 5 jours", () => {
      // available = 1024-68=956, raw=(956-36-10)/5=182 → 182
      expect(computeWeekDayColumnWidth(1024, 5)).toBe(182);
    });

    it("retourne une largeur supérieure à 56 sur une tablette 600px avec 5 jours", () => {
      // available = 600-68=532, raw=(532-36-10)/5=97.2 → floor→97
      expect(computeWeekDayColumnWidth(600, 5)).toBe(97);
    });
  });

  describe("cas limites", () => {
    it("retourne exactement 56 pour un écran dont le calcul donne exactement 56", () => {
      // raw = 56 → floor(56) = 56 → max(56,56) = 56
      // 36 + nDays*2 + nDays*56 = screenWidth - 68
      // pour nDays=5: 36+10+280 = 326 → screenWidth = 326+68 = 394
      expect(computeWeekDayColumnWidth(394, 5)).toBe(56);
    });

    it("retourne 57 dès que le calcul dépasse 56", () => {
      // Pour nDays=5: 36+10+5*57 = 36+10+285=331 → screenWidth = 331+68=399
      // raw=(399-68-36-10)/5=285/5=57 → floor(57)=57 > 56
      expect(computeWeekDayColumnWidth(399, 5)).toBe(57);
    });

    it("le résultat est toujours un entier (pas de fraction de pixel)", () => {
      const result = computeWeekDayColumnWidth(767, 5);
      expect(Number.isInteger(result)).toBe(true);
    });

    it("ne retourne jamais une valeur inférieure à 56 quelle que soit la largeur", () => {
      const verySmall = computeWeekDayColumnWidth(100, 7);
      expect(verySmall).toBeGreaterThanOrEqual(56);
    });
  });

  describe("cohérence timelineWidth", () => {
    it("sur tablette 768px / 5 jours, la grille tient dans l'espace disponible", () => {
      const nDays = 5;
      const dayColWidth = computeWeekDayColumnWidth(768, nDays);
      const timelineWidth = 36 + nDays * (dayColWidth + 2);
      const availableWidth = 768 - 68;
      expect(timelineWidth).toBeLessThanOrEqual(availableWidth);
    });

    it("sur tablette 768px / 7 jours, la grille tient dans l'espace disponible", () => {
      const nDays = 7;
      const dayColWidth = computeWeekDayColumnWidth(768, nDays);
      const timelineWidth = 36 + nDays * (dayColWidth + 2);
      const availableWidth = 768 - 68;
      expect(timelineWidth).toBeLessThanOrEqual(availableWidth);
    });

    it("sur téléphone 360px / 5 jours, timelineWidth correspond à la largeur minimale", () => {
      const nDays = 5;
      const dayColWidth = computeWeekDayColumnWidth(360, nDays); // → 56
      const timelineWidth = 36 + nDays * (dayColWidth + 2);
      expect(timelineWidth).toBe(326); // 36 + 5*58 = 326
    });
  });
});
