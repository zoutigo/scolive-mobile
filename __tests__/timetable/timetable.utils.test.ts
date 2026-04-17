import {
  buildCompactMonthCalendarCells,
  buildTimetableClassOptions,
  buildTimetableRangeForView,
  getCompactWeekendVisibility,
  groupOccurrencesByDate,
  minuteToTimeLabel,
  subjectVisualTone,
  timeLabelToMinute,
  toWeekdayMondayFirst,
} from "../../src/utils/timetable";

describe("timetable utils", () => {
  it("convertit correctement les minutes en heure texte", () => {
    expect(minuteToTimeLabel(450)).toBe("07:30");
    expect(minuteToTimeLabel(600)).toBe("10:00");
  });

  it("parse correctement une heure HH:MM", () => {
    expect(timeLabelToMinute("07:30")).toBe(450);
    expect(timeLabelToMinute("24:00")).toBeNull();
    expect(timeLabelToMinute("abc")).toBeNull();
  });

  it("groupe les occurrences par date et trie les créneaux", () => {
    const grouped = groupOccurrencesByDate([
      {
        id: "b",
        source: "RECURRING",
        status: "PLANNED",
        occurrenceDate: "2026-04-15",
        weekday: 3,
        startMinute: 600,
        endMinute: 660,
        room: "B2",
        reason: null,
        subject: { id: "math", name: "Maths" },
        teacherUser: { id: "t1", firstName: "Paul", lastName: "Manga" },
      },
      {
        id: "a",
        source: "RECURRING",
        status: "PLANNED",
        occurrenceDate: "2026-04-15",
        weekday: 3,
        startMinute: 450,
        endMinute: 510,
        room: "A1",
        reason: null,
        subject: { id: "fr", name: "Français" },
        teacherUser: { id: "t2", firstName: "Anne", lastName: "Biloa" },
      },
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.items.map((entry) => entry.id)).toEqual(["a", "b"]);
  });

  it("construit les options de classes à partir du contexte notes", () => {
    const classes = buildTimetableClassOptions({
      schoolYears: [{ id: "sy1", label: "2025-2026", isActive: true }],
      selectedSchoolYearId: "sy1",
      assignments: [
        {
          classId: "c1",
          className: "6e A",
          schoolYearId: "sy1",
          subjectId: "math",
          subjectName: "Maths",
        },
        {
          classId: "c1",
          className: "6e A",
          schoolYearId: "sy1",
          subjectId: "fr",
          subjectName: "Français",
        },
      ],
      students: [
        {
          classId: "c1",
          className: "6e A",
          studentId: "s1",
          studentFirstName: "Lisa",
          studentLastName: "Ntamack",
        },
        {
          classId: "c1",
          className: "6e A",
          studentId: "s2",
          studentFirstName: "Paul",
          studentLastName: "Ntamack",
        },
      ],
    });

    expect(classes).toEqual([
      expect.objectContaining({
        classId: "c1",
        className: "6e A",
        studentCount: 2,
      }),
    ]);
    expect(classes[0]?.subjects).toHaveLength(2);
  });

  it("construit la plage de requête correcte selon la vue active", () => {
    const cursorDate = new Date("2026-04-14T09:00:00Z");

    expect(buildTimetableRangeForView("day", cursorDate)).toEqual({
      fromDate: "2026-04-14",
      toDate: "2026-04-14",
    });
    expect(buildTimetableRangeForView("week", cursorDate)).toEqual({
      fromDate: "2026-04-13",
      toDate: "2026-04-19",
    });
    expect(buildTimetableRangeForView("month", cursorDate)).toEqual({
      fromDate: "2026-04-01",
      toDate: "2026-04-30",
    });
  });

  it("calcule une tonalité lisible à partir d'une couleur matière", () => {
    expect(subjectVisualTone("#11C5C6")).toEqual({
      chip: "#11C5C6",
      background: "#E7F9F9",
      border: "#B3ECED",
      text: "#109197",
    });
  });

  it("ne montre ni samedi ni dimanche si aucun cours le week-end", () => {
    const occurrences = [
      {
        id: "occ-1",
        source: "RECURRING" as const,
        status: "PLANNED" as const,
        occurrenceDate: "2026-04-14",
        weekday: 2,
        startMinute: 525,
        endMinute: 600,
        room: "B45",
        reason: null,
        subject: { id: "ang", name: "Anglais" },
        teacherUser: { id: "t1", firstName: "Albert", lastName: "Mvondo" },
      },
    ];

    expect(
      getCompactWeekendVisibility(occurrences, {
        from: new Date("2026-04-13T00:00:00Z"),
        to: new Date("2026-04-19T00:00:00Z"),
      }),
    ).toEqual({ showSaturday: false, showSunday: false });
  });

  it("affiche uniquement la colonne samedi s'il y a des cours le samedi", () => {
    const occurrences = [
      {
        id: "occ-sat",
        source: "RECURRING" as const,
        status: "PLANNED" as const,
        occurrenceDate: "2026-04-18",
        weekday: 6,
        startMinute: 480,
        endMinute: 540,
        room: "A01",
        reason: null,
        subject: { id: "sport", name: "Sport" },
        teacherUser: { id: "t5", firstName: "Paul", lastName: "Biya" },
      },
    ];

    expect(
      getCompactWeekendVisibility(occurrences, {
        from: new Date("2026-04-13T00:00:00Z"),
        to: new Date("2026-04-19T00:00:00Z"),
      }),
    ).toEqual({ showSaturday: true, showSunday: false });
  });

  it("affiche samedi et dimanche si des cours ont lieu les deux jours", () => {
    const occurrences = [
      {
        id: "occ-sat",
        source: "RECURRING" as const,
        status: "PLANNED" as const,
        occurrenceDate: "2026-04-18",
        weekday: 6,
        startMinute: 480,
        endMinute: 540,
        room: "A01",
        reason: null,
        subject: { id: "sport", name: "Sport" },
        teacherUser: { id: "t5", firstName: "Paul", lastName: "Biya" },
      },
      {
        id: "occ-sun",
        source: "RECURRING" as const,
        status: "PLANNED" as const,
        occurrenceDate: "2026-04-19",
        weekday: 7,
        startMinute: 480,
        endMinute: 540,
        room: "A02",
        reason: null,
        subject: { id: "sport", name: "Sport" },
        teacherUser: { id: "t5", firstName: "Paul", lastName: "Biya" },
      },
    ];

    expect(
      getCompactWeekendVisibility(occurrences, {
        from: new Date("2026-04-13T00:00:00Z"),
        to: new Date("2026-04-19T00:00:00Z"),
      }),
    ).toEqual({ showSaturday: true, showSunday: true });
  });

  it("construit une grille mensuelle compacte sur 5 colonnes (aucun cours weekend)", () => {
    const cells = buildCompactMonthCalendarCells(
      new Date("2026-04-14T09:00:00Z"),
      [
        {
          id: "occ-1",
          source: "RECURRING",
          status: "PLANNED",
          occurrenceDate: "2026-04-14",
          weekday: 2,
          startMinute: 525,
          endMinute: 600,
          room: "B45",
          reason: null,
          subject: { id: "ang", name: "Anglais" },
          teacherUser: { id: "t1", firstName: "Albert", lastName: "Mvondo" },
        },
      ],
      false,
      false,
    );

    expect(cells).toHaveLength(25); // 5 lignes × 5 colonnes
    expect(cells[0]).toEqual({ date: null, slotsCount: 0 });
    expect(
      cells.find(
        (entry) =>
          entry.date?.getFullYear() === 2026 &&
          entry.date?.getMonth() === 3 &&
          entry.date?.getDate() === 14,
      ),
    ).toEqual(expect.objectContaining({ slotsCount: 1 }));
  });

  it("construit une grille mensuelle sur 6 colonnes (cours le samedi, pas le dimanche)", () => {
    // Avril 2026 : 1er avril = mercredi
    // Avec samedi visible : colonnes L M M J V S
    // Première ligne : vide(L) vide(M) 1(M) 2(J) 3(V) 4(S)
    // → 6 colonnes, leading empty = 2, 30 jours + 4 sam d'avril (4,11,18,25) = 30 jours + samedis inclus
    const cells = buildCompactMonthCalendarCells(
      new Date("2026-04-01T00:00:00Z"),
      [],
      true,
      false,
    );

    // Nombre de colonnes = 6
    expect(cells.length % 6).toBe(0);
    // Le 4 avril (samedi) doit être présent
    expect(
      cells.find(
        (entry) => entry.date?.getMonth() === 3 && entry.date?.getDate() === 4,
      ),
    ).toBeTruthy();
    // Aucun dimanche ne doit être présent
    const sundays = cells.filter(
      (entry) => entry.date && toWeekdayMondayFirst(entry.date) === 7,
    );
    expect(sundays).toHaveLength(0);
  });

  it("construit une grille mensuelle sur 7 colonnes (cours samedi et dimanche)", () => {
    const cells = buildCompactMonthCalendarCells(
      new Date("2026-04-01T00:00:00Z"),
      [],
      true,
      true,
    );

    expect(cells.length % 7).toBe(0);
    // Le 5 avril (dimanche) doit être présent
    expect(
      cells.find(
        (entry) => entry.date?.getMonth() === 3 && entry.date?.getDate() === 5,
      ),
    ).toBeTruthy();
  });
});
