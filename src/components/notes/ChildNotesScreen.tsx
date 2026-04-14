import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { useAuthStore } from "../../store/auth.store";
import { useFamilyStore } from "../../store/family.store";
import { useNotesStore } from "../../store/notes.store";
import type {
  StudentEvaluation,
  StudentNotesTerm,
  StudentNotesTermSnapshot,
  StudentNotesView,
  StudentSubjectNotes,
} from "../../types/notes.types";
import {
  buildRadarChart,
  buildRadarData,
  formatDelta,
  formatPlainEvaluationScore,
  formatScore,
  getCurrentTerm,
  getBestSubject,
  getWatchSubject,
  termLabel,
} from "../../utils/notes";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  SectionCard,
} from "../timetable/TimetableCommon";

type DetailState =
  | {
      type: "evaluation";
      subject: StudentSubjectNotes;
      evaluation: StudentEvaluation;
    }
  | { type: "average"; subject: StudentSubjectNotes }
  | null;

const VIEW_OPTIONS: Array<{ value: StudentNotesView; label: string }> = [
  { value: "evaluations", label: "Eval" },
  { value: "averages", label: "Moy" },
  { value: "charts", label: "Graph" },
];

export function ChildNotesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ childId?: string }>();
  const childId = typeof params.childId === "string" ? params.childId : "";
  const { schoolSlug } = useAuthStore();
  const { children } = useFamilyStore();
  const {
    studentNotes,
    isLoadingStudentNotes,
    errorMessage,
    loadStudentNotes,
    clearError,
  } = useNotesStore();
  const [selectedTerm, setSelectedTerm] =
    useState<StudentNotesTerm>(getCurrentTerm());
  const [view, setView] = useState<StudentNotesView>("evaluations");
  const [detail, setDetail] = useState<DetailState>(null);

  const load = useCallback(async () => {
    if (!schoolSlug || !childId) return;
    await loadStudentNotes(schoolSlug, childId);
  }, [childId, loadStudentNotes, schoolSlug]);

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  const snapshots = studentNotes[childId] ?? [];
  const currentSnapshot =
    snapshots.find((entry) => entry.term === selectedTerm) ??
    snapshots[0] ??
    null;

  useEffect(() => {
    if (
      snapshots.length > 0 &&
      !snapshots.some((entry) => entry.term === selectedTerm)
    ) {
      setSelectedTerm(snapshots[0].term);
    }
  }, [selectedTerm, snapshots]);

  const child = children.find((entry) => entry.id === childId);
  const title = "Evaluations et moyennes";
  const subtitle = buildHeaderSubtitle(child, currentSnapshot);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: 0, paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingStudentNotes}
            onRefresh={() => {
              clearError();
              void load().catch(() => {});
            }}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard} testID="child-notes-header">
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            testID="child-notes-back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title} testID="child-notes-header-title">
              {title}
            </Text>
            <Text style={styles.subtitle} testID="child-notes-header-subtitle">
              {subtitle}
            </Text>
          </View>
        </View>

        {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

        <View style={styles.switcherCard}>
          <CompactSelector
            value={selectedTerm}
            options={(snapshots.length > 0
              ? snapshots
              : buildDefaultSnapshots()
            ).map((entry) => ({
              value: entry.term,
              label:
                entry.term === "TERM_1"
                  ? "1er Trimestre"
                  : entry.term === "TERM_2"
                    ? "2eme Trimestre"
                    : "3eme Trimestre",
            }))}
            onChange={(value) => setSelectedTerm(value as StudentNotesTerm)}
            testIDPrefix="child-notes-term"
          />
          <CompactSelector
            value={view}
            options={VIEW_OPTIONS}
            onChange={(value) => setView(value as StudentNotesView)}
            testIDPrefix="child-notes-view"
            compact
          />
        </View>

        {isLoadingStudentNotes && snapshots.length === 0 ? (
          <SectionCard title="Notes">
            <LoadingBlock label="Chargement des notes publiees..." />
          </SectionCard>
        ) : currentSnapshot ? (
          <>
            {view === "evaluations" ? (
              <EvaluationsView
                snapshot={currentSnapshot}
                onOpenDetail={setDetail}
              />
            ) : null}
            {view === "averages" ? (
              <AveragesView
                snapshot={currentSnapshot}
                onOpenDetail={setDetail}
              />
            ) : null}
            {view === "charts" ? (
              <ChartsView snapshot={currentSnapshot} />
            ) : null}
            <PeriodHero snapshot={currentSnapshot} />
          </>
        ) : (
          <SectionCard title="Notes">
            <EmptyState
              icon="ribbon-outline"
              title="Aucune note publiee"
              message="Les evaluations publiees pour cet enfant apparaitront ici."
            />
          </SectionCard>
        )}
      </ScrollView>

      <DetailModal detail={detail} onClose={() => setDetail(null)} />
    </KeyboardAvoidingView>
  );
}

function buildDefaultSnapshots(): StudentNotesTermSnapshot[] {
  return (["TERM_1", "TERM_2", "TERM_3"] as StudentNotesTerm[]).map((term) => ({
    term,
    label: termLabel(term),
    councilLabel: "",
    generatedAtLabel: "",
    generalAverage: { student: null, class: null, min: null, max: null },
    subjects: [],
  }));
}

function buildHeaderSubtitle(
  child:
    | {
        firstName: string;
        lastName: string;
      }
    | undefined,
  snapshot: StudentNotesTermSnapshot | null,
) {
  if (!child) {
    return "Eleve";
  }

  const classLabel = extractClassLabel(snapshot?.councilLabel ?? "");
  const childLabel = `${child.firstName} ${child.lastName}`;

  if (classLabel) {
    return `${childLabel} • ${classLabel}`;
  }

  return childLabel;
}

function extractClassLabel(value: string) {
  const beforeBullet = value.split("•")[0]?.trim() ?? "";
  const match = beforeBullet.match(
    /\b(TPS|PS|MS|GS|SIL|CP|CE1|CE2|CM1|CM2|6e|5e|4e|3e|2nde|1ere|Terminale)\b(?:\s+[A-Z])?/i,
  );

  if (match) {
    return match[0].trim();
  }

  return "";
}

function EvaluationsView(props: {
  snapshot: StudentNotesTermSnapshot;
  onOpenDetail: (value: DetailState) => void;
}) {
  return (
    <>
      <View style={styles.notesBoard}>
        {props.snapshot.subjects.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="Aucune evaluation"
            message="Les notes publiees pour cette periode apparaitront ici."
          />
        ) : (
          <View style={styles.subjectList}>
            {props.snapshot.subjects.map((subject, index) => (
              <View
                key={subject.id}
                style={[
                  styles.subjectRow,
                  index % 2 === 1 && styles.subjectRowAlt,
                  index < props.snapshot.subjects.length - 1 &&
                    styles.subjectRowDivider,
                ]}
                testID={`child-notes-subject-row-${subject.id}`}
              >
                <View style={styles.subjectHeader}>
                  <View style={styles.subjectHeaderLeft}>
                    <Text style={styles.subjectTitle}>
                      {subject.subjectLabel.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.subjectHeaderCenter}>
                    <Text style={styles.subjectAverage}>
                      {formatScore(subject.studentAverage)}
                    </Text>
                  </View>
                  <View style={styles.subjectHeaderRight}>
                    <Text style={styles.subjectCoeff}>
                      COEF. {subject.coefficient}
                    </Text>
                  </View>
                </View>

                <View style={styles.evaluationGrid}>
                  {subject.evaluations.length === 0 ? (
                    <Text style={styles.inlineEmptyText}>
                      Aucune note publiee dans cette matiere.
                    </Text>
                  ) : (
                    subject.evaluations.map((evaluation) => (
                      <TouchableOpacity
                        key={evaluation.id}
                        style={styles.evaluationCell}
                        onPress={() =>
                          props.onOpenDetail({
                            type: "evaluation",
                            subject,
                            evaluation,
                          })
                        }
                        testID={`child-notes-evaluation-${evaluation.id}`}
                      >
                        <ScoreMark evaluation={evaluation} />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
            ))}

            <View style={styles.generalAverageCard}>
              <Text style={styles.generalAverageTitle}>MOYENNE GENERALE</Text>
              <Text style={styles.generalAverageDash}>-</Text>
              <Text style={styles.generalAverageValue}>
                {formatScore(props.snapshot.generalAverage.student)}
              </Text>
              <Text style={styles.generalAverageHint}>
                Synthese des evaluations publiees sur la periode.
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.legendRow}>
        <Text style={styles.legendAbs}>Abs</Text>
        <Text style={styles.legendText}>Absent</Text>
        <Text style={styles.legendExcused}>Disp</Text>
        <Text style={styles.legendText}>Dispense</Text>
        <Text style={styles.legendNeutral}>NE</Text>
        <Text style={styles.legendText}>Non evalue</Text>
      </View>
    </>
  );
}

function PeriodHero({ snapshot }: { snapshot: StudentNotesTermSnapshot }) {
  const bestSubject = getBestSubject(snapshot.subjects);
  const watchSubject = getWatchSubject(snapshot.subjects);
  const stats = [
    {
      label: "Moyenne eleve",
      value: formatScore(snapshot.generalAverage.student),
      hint: formatDelta(
        snapshot.generalAverage.student,
        snapshot.generalAverage.class,
      ),
      icon: "medal-outline" as const,
    },
    {
      label: "Moyenne classe",
      value: formatScore(snapshot.generalAverage.class),
      hint: `Amplitude ${formatScore(snapshot.generalAverage.min)} - ${formatScore(snapshot.generalAverage.max)}`,
      icon: "analytics-outline" as const,
    },
    {
      label: "Matiere forte",
      value: bestSubject?.subjectLabel ?? "-",
      hint:
        bestSubject?.studentAverage != null
          ? `${formatScore(bestSubject.studentAverage)}/20`
          : "Aucune donnee",
      icon: "sparkles-outline" as const,
    },
    {
      label: "Point de vigilance",
      value: watchSubject?.subjectLabel ?? "-",
      hint:
        watchSubject?.studentAverage != null
          ? `${formatScore(watchSubject.studentAverage)}/20`
          : "Aucune donnee",
      icon: "bar-chart-outline" as const,
    },
  ];

  return (
    <View style={styles.hero} testID="notes-period-hero">
      <View style={styles.heroTintPrimary} />
      <View style={styles.heroTintAccent} />
      <View style={styles.heroHeader}>
        <View style={styles.heroBadge}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={styles.heroBadgeText}>BULLETIN DE PERIODE</Text>
        </View>
        <Text style={styles.heroTitle}>{snapshot.label}</Text>
        <Text style={styles.heroSubtitle}>{snapshot.councilLabel}</Text>
      </View>

      <View style={styles.publishedCard}>
        <Text style={styles.publishedLabel}>DONNEES PUBLIEES</Text>
        <Text style={styles.publishedValue}>{snapshot.generatedAtLabel}</Text>
      </View>

      <View style={styles.heroStatsGrid}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={styles.heroStatCard}
            testID={`notes-period-stat-${stat.label
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          >
            <View style={styles.heroStatHeader}>
              <Text style={styles.heroStatLabel}>{stat.label}</Text>
              <View style={styles.heroStatIcon}>
                <Ionicons name={stat.icon} size={16} color={colors.primary} />
              </View>
            </View>
            <Text style={styles.heroStatValue}>{stat.value}</Text>
            <Text style={styles.heroStatHint}>{stat.hint ?? "-"}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AveragesView(props: {
  snapshot: StudentNotesTermSnapshot;
  onOpenDetail: (value: DetailState) => void;
}) {
  if (props.snapshot.subjects.length === 0) {
    return (
      <SectionCard title="Moyennes">
        <EmptyState
          icon="bar-chart-outline"
          title="Aucune moyenne calculable"
          message="Les moyennes apparaitront des qu'une matiere aura des notes publiees."
        />
      </SectionCard>
    );
  }

  return (
    <View style={styles.tableBoard} testID="child-notes-averages-board">
      <View style={styles.averageList}>
        {props.snapshot.subjects.map((subject) => (
          <TouchableOpacity
            key={subject.id}
            style={styles.averageRow}
            onPress={() => props.onOpenDetail({ type: "average", subject })}
            testID={`child-notes-average-${subject.id}`}
          >
            <View style={styles.averageRowHeader}>
              <View style={styles.averageRowHeaderMain}>
                <Text style={styles.averageSubject}>
                  {subject.subjectLabel.toUpperCase()}
                </Text>
                <View style={styles.averageHeaderRight}>
                  <Text style={styles.averageValueCompact}>
                    {formatScore(subject.studentAverage)}
                  </Text>
                  <Text style={styles.averageCoeffCompact}>
                    Coef. {subject.coefficient}
                  </Text>
                </View>
              </View>
              {subject.teachers.length > 0 ? (
                <Text style={styles.averageTeachers}>
                  {subject.teachers.join(" - ")}
                </Text>
              ) : null}
            </View>

            <View style={styles.averageMetricsTextRow}>
              <Text style={styles.averageMetricText}>
                Classe :{" "}
                <Text style={styles.averageMetricValue}>
                  {formatScore(subject.classAverage)}
                </Text>
              </Text>
              <Text style={styles.averageMetricText}>
                Min :{" "}
                <Text style={styles.averageMetricValue}>
                  {formatScore(subject.classMin)}
                </Text>
              </Text>
              <Text style={styles.averageMetricText}>
                Max :{" "}
                <Text style={styles.averageMetricValue}>
                  {formatScore(subject.classMax)}
                </Text>
              </Text>
            </View>

            <View
              style={styles.averageProgressTrack}
              testID={`child-notes-average-progress-${subject.id}`}
            >
              <View
                style={[
                  styles.averageProgressFill,
                  {
                    width: `${Math.max(
                      6,
                      Math.min(100, ((subject.studentAverage ?? 0) / 20) * 100),
                    )}%`,
                  },
                ]}
              >
                <View style={styles.averageProgressBlue} />
                <View style={styles.averageProgressBlend} />
                <View style={styles.averageProgressGreen} />
              </View>
            </View>

            <Text style={styles.averageAppreciation}>
              {subject.appreciation ?? "-"}
            </Text>
          </TouchableOpacity>
        ))}

        <View style={styles.generalAverageRow}>
          <View style={styles.averageRowHeaderMain}>
            <Text style={styles.generalAverageTitle}>MOYENNE GENERALE</Text>
            <View style={styles.averageHeaderRight}>
              <Text style={styles.averageValueCompact}>
                {formatScore(props.snapshot.generalAverage.student)}
              </Text>
            </View>
          </View>
          <View style={styles.averageMetricsTextRow}>
            <Text style={styles.averageMetricText}>
              Classe :{" "}
              <Text style={styles.averageMetricValue}>
                {formatScore(props.snapshot.generalAverage.class)}
              </Text>
            </Text>
            <Text style={styles.averageMetricText}>
              Min :{" "}
              <Text style={styles.averageMetricValue}>
                {formatScore(props.snapshot.generalAverage.min)}
              </Text>
            </Text>
            <Text style={styles.averageMetricText}>
              Max :{" "}
              <Text style={styles.averageMetricValue}>
                {formatScore(props.snapshot.generalAverage.max)}
              </Text>
            </Text>
          </View>
          <Text style={styles.averageAppreciation}>
            Positionnement global de l'eleve sur la periode.
          </Text>
        </View>
      </View>
    </View>
  );
}

function ChartsView({ snapshot }: { snapshot: StudentNotesTermSnapshot }) {
  const radarData = buildRadarData(snapshot);
  const radarChart = buildRadarChart(snapshot);

  if (radarData.length === 0) {
    return (
      <SectionCard title="Graphiques">
        <EmptyState
          icon="pie-chart-outline"
          title="Graphiques indisponibles"
          message="Il faut des moyennes eleve et classe pour afficher cette vue."
        />
      </SectionCard>
    );
  }

  return (
    <View style={styles.chartPanels}>
      <View style={styles.chartPanelCard}>
        <Text style={styles.chartPanelTitle}>Comparaison par matiere</Text>
        <Text style={styles.chartPanelSubtitle}>
          Chaque bande represente l'amplitude min-max de la classe, avec la
          position de l'eleve et de la moyenne de classe.
        </Text>

        <View style={styles.chartList}>
          {snapshot.subjects.map((subject) => (
            <ComparisonBand key={subject.id} subject={subject} />
          ))}
        </View>

        <View style={styles.chartLegend}>
          <LegendItem color={colors.primary} label="Moyenne eleve" />
          <LegendItem color="#4b5563" label="Moyenne classe" />
          <LegendItem color="#b9d4ef" label="Min - max classe" wide />
        </View>
      </View>

      <View style={styles.chartPanelCardAlt}>
        <Text style={styles.chartPanelTitle}>Radar des moyennes</Text>
        <Text style={styles.chartPanelSubtitle}>
          Vue globale des matieres les plus fortes et des ecarts avec la classe.
        </Text>

        <RadarPanel radar={radarChart} />

        <View style={styles.radarInfoGrid}>
          <View style={styles.radarInfoCard}>
            <Text style={styles.radarInfoTitle}>Lecture du radar</Text>
            <Text style={styles.radarInfoText}>
              Plus le trace se rapproche du bord, plus la moyenne est elevee.
            </Text>
          </View>
          <View style={styles.radarInfoCard}>
            <Text style={styles.radarInfoTitle}>Comparaison</Text>
            <Text style={styles.radarInfoText}>
              Le trace bleu represente l'eleve. Le gris correspond a la classe.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function ComparisonBand({ subject }: { subject: StudentSubjectNotes }) {
  const min = subject.classMin ?? 0;
  const max = subject.classMax ?? 0;
  const bandStart = (min / 20) * 100;
  const bandWidth = Math.max(8, ((max - min) / 20) * 100);
  const studentLeft = ((subject.studentAverage ?? 0) / 20) * 100;
  const classLeft = ((subject.classAverage ?? 0) / 20) * 100;

  return (
    <View style={styles.comparisonRow}>
      <View style={styles.comparisonHeader}>
        <View>
          <Text style={styles.chartTitle}>{subject.subjectLabel}</Text>
          <Text style={styles.chartValues}>
            Eleve {formatScore(subject.studentAverage)} / Classe{" "}
            {formatScore(subject.classAverage)}
          </Text>
        </View>
        <View style={styles.comparisonRangeBadge}>
          <Text style={styles.comparisonRangeText}>
            {formatScore(subject.classMin)} - {formatScore(subject.classMax)}
          </Text>
        </View>
      </View>

      <View style={styles.comparisonTrack}>
        <View
          style={[
            styles.comparisonBand,
            {
              left: `${bandStart}%`,
              width: `${Math.min(100 - bandStart, bandWidth)}%`,
            },
          ]}
        />
        <View
          style={[styles.comparisonDotStudent, { left: `${studentLeft}%` }]}
        />
        <View style={[styles.comparisonDotClass, { left: `${classLeft}%` }]} />
      </View>
    </View>
  );
}

function LegendItem(props: { color: string; label: string; wide?: boolean }) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendSwatch,
          props.wide && styles.legendSwatchWide,
          { backgroundColor: props.color },
        ]}
      />
      <Text style={styles.legendItemText}>{props.label}</Text>
    </View>
  );
}

function RadarPanel(props: { radar: ReturnType<typeof buildRadarChart> }) {
  if (props.radar.data.length === 0) {
    return null;
  }

  return (
    <View style={styles.radarWrap} testID="child-notes-radar-panel">
      <View style={styles.radarStage}>
        {props.radar.rings.map((ratio) => {
          const size = props.radar.radius * 2 * ratio;
          return (
            <View
              key={ratio}
              style={[
                styles.radarRing,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                },
              ]}
            />
          );
        })}

        {props.radar.axes.map((axis) => (
          <React.Fragment key={axis.label}>
            <View
              style={[
                styles.radarAxis,
                {
                  left: axis.left,
                  top: axis.top,
                  width: axis.width,
                  transform: [{ rotate: `${(axis.angle * 180) / Math.PI}deg` }],
                },
              ]}
            />
            <Text
              style={[
                styles.radarAxisLabel,
                {
                  left: axis.labelX - 26,
                  top: axis.labelY - 8,
                },
              ]}
              numberOfLines={1}
            >
              {axis.label.slice(0, 10)}
            </Text>
          </React.Fragment>
        ))}

        {props.radar.classSegments.map((segment, index) => (
          <View
            key={`class-${index}`}
            style={[
              styles.radarSegmentClass,
              {
                left: segment.left,
                top: segment.top,
                width: segment.width,
                transform: [{ rotate: segment.angle }],
              },
            ]}
          />
        ))}
        {props.radar.studentSegments.map((segment, index) => (
          <View
            key={`student-${index}`}
            style={[
              styles.radarSegmentStudent,
              {
                left: segment.left,
                top: segment.top,
                width: segment.width,
                transform: [{ rotate: segment.angle }],
              },
            ]}
          />
        ))}

        {props.radar.classPoints.map((point, index) => (
          <View
            key={`class-point-${index}`}
            style={[
              styles.radarPointClass,
              { left: point.x - 3, top: point.y - 3 },
            ]}
          />
        ))}
        {props.radar.studentPoints.map((point, index) => (
          <View
            key={`student-point-${index}`}
            style={[
              styles.radarPointStudent,
              { left: point.x - 4, top: point.y - 4 },
            ]}
          />
        ))}
        <View
          style={[
            styles.radarCenterPoint,
            { left: props.radar.center - 4, top: props.radar.center - 4 },
          ]}
        />
      </View>
    </View>
  );
}

function CompactSelector(props: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  testIDPrefix?: string;
  compact?: boolean;
}) {
  return (
    <View
      style={[
        styles.selectorRow,
        props.compact && styles.selectorRowCompact,
        props.compact ? styles.selectorRowSecondary : styles.selectorRowPrimary,
      ]}
    >
      {props.options.map((option) => {
        const active = option.value === props.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectorPill,
              props.compact && styles.selectorPillCompact,
              props.compact
                ? styles.selectorPillSecondary
                : styles.selectorPillPrimary,
              active && styles.selectorPillActive,
              active &&
                (props.compact
                  ? styles.selectorPillActiveSecondary
                  : styles.selectorPillActivePrimary),
            ]}
            onPress={() => props.onChange(option.value)}
            testID={
              props.testIDPrefix
                ? `${props.testIDPrefix}-${option.value}`
                : undefined
            }
          >
            <Text
              style={[
                styles.selectorPillLabel,
                props.compact && styles.selectorPillLabelCompact,
                props.compact
                  ? styles.selectorPillLabelSecondary
                  : styles.selectorPillLabelPrimary,
                active &&
                  (props.compact
                    ? styles.selectorPillLabelActiveSecondary
                    : styles.selectorPillLabelActivePrimary),
              ]}
            >
              {option.label}
            </Text>
            <View
              style={[styles.selectorDot, active && styles.selectorDotActive]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ScoreMark({ evaluation }: { evaluation: StudentEvaluation }) {
  const display = formatPlainEvaluationScore(evaluation);
  const special =
    evaluation.status === "ABSENT" ||
    evaluation.status === "EXCUSED" ||
    evaluation.status === "NOT_GRADED";
  const ratio =
    evaluation.score !== null && evaluation.maxScore > 0
      ? evaluation.score / evaluation.maxScore
      : 0;
  const scoreTone =
    ratio >= 0.75
      ? styles.scoreValueStrong
      : ratio >= 0.5
        ? styles.scoreValueMid
        : styles.scoreValueWeak;

  if (special) {
    return (
      <View
        style={[
          styles.specialChip,
          evaluation.status === "ABSENT"
            ? styles.specialChipAbsent
            : evaluation.status === "EXCUSED"
              ? styles.specialChipExcused
              : styles.specialChipNeutral,
        ]}
      >
        <Text
          style={[
            styles.specialChipText,
            evaluation.status === "ABSENT"
              ? styles.specialChipTextAbsent
              : evaluation.status === "EXCUSED"
                ? styles.specialChipTextExcused
                : styles.specialChipTextNeutral,
          ]}
        >
          {display.score}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.scoreInline}>
      <Text
        style={[styles.scoreValue, scoreTone]}
        testID={`score-value-${evaluation.id}`}
      >
        {display.score}
      </Text>
      <Text style={styles.scoreMax}>/{display.maxScore}</Text>
    </View>
  );
}

function DetailModal(props: { detail: DetailState; onClose: () => void }) {
  if (!props.detail) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={props.onClose}
    >
      <View style={styles.modalRoot}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={props.onClose}
        />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleBlock}>
              <Text style={styles.modalEyebrow}>
                {props.detail.type === "evaluation"
                  ? "Detail de l'evaluation"
                  : "Detail de la moyenne"}
              </Text>
              <Text style={styles.modalTitle}>
                {props.detail.subject.subjectLabel}
              </Text>
            </View>
            <TouchableOpacity
              onPress={props.onClose}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {props.detail.type === "evaluation" ? (
            <>
              <Text style={styles.modalLead}>
                {props.detail.evaluation.label}
              </Text>
              <View style={styles.modalStatGrid}>
                <ModalStat
                  label="Note"
                  value={
                    formatPlainEvaluationScore(props.detail.evaluation).score
                  }
                  suffix={
                    formatPlainEvaluationScore(props.detail.evaluation).maxScore
                      ? `/${formatPlainEvaluationScore(props.detail.evaluation).maxScore}`
                      : undefined
                  }
                />
                <ModalStat
                  label="Statut"
                  value={
                    props.detail.evaluation.status === "ABSENT"
                      ? "Absent"
                      : props.detail.evaluation.status === "EXCUSED"
                        ? "Dispense"
                        : props.detail.evaluation.status === "NOT_GRADED"
                          ? "Non evalue"
                          : "Note saisie"
                  }
                />
                <ModalStat
                  label="Date"
                  value={props.detail.evaluation.recordedAt}
                />
                <ModalStat
                  label="Coefficient"
                  value={formatScore(props.detail.evaluation.weight ?? 1)}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.modalLead}>
                Comparez l'eleve a la classe et identifiez l'amplitude observee.
              </Text>
              <View style={styles.modalStatGrid}>
                <ModalStat
                  label="Eleve"
                  value={formatScore(props.detail.subject.studentAverage)}
                />
                <ModalStat
                  label="Classe"
                  value={formatScore(props.detail.subject.classAverage)}
                />
                <ModalStat
                  label="Min"
                  value={formatScore(props.detail.subject.classMin)}
                />
                <ModalStat
                  label="Max"
                  value={formatScore(props.detail.subject.classMax)}
                />
              </View>
            </>
          )}

          <View style={styles.modalContextCard}>
            <Text style={styles.modalContextLabel}>Contexte</Text>
            <Text style={styles.modalContextText}>
              {formatDelta(
                props.detail.subject.studentAverage,
                props.detail.subject.classAverage,
              ) ?? "Aucune comparaison disponible"}
            </Text>
            {props.detail.subject.appreciation ? (
              <Text style={styles.modalAppreciation}>
                {props.detail.subject.appreciation}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ModalStat(props: { label: string; value: string; suffix?: string }) {
  return (
    <View style={styles.modalStatCard}>
      <Text style={styles.modalStatLabel}>{props.label}</Text>
      <Text style={styles.modalStatValue}>
        {props.value}
        {props.suffix ? (
          <Text style={styles.modalStatSuffix}>{props.suffix}</Text>
        ) : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, gap: 14 },
  headerCard: {
    backgroundColor: colors.primary,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, gap: 1, paddingTop: 0 },
  title: { color: colors.white, fontSize: 19, fontWeight: "600" },
  subtitle: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    lineHeight: 15,
  },
  switcherCard: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    gap: 8,
  },
  selectorRow: { flexDirection: "row", gap: 8 },
  selectorRowCompact: { gap: 6 },
  selectorRowPrimary: { paddingBottom: 2 },
  selectorRowSecondary: {},
  selectorPill: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorPillPrimary: {
    shadowColor: "#0C5FA8",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  selectorPillSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  selectorPillCompact: { minHeight: 36, borderRadius: 8 },
  selectorPillActive: {
    backgroundColor: "#eef5fd",
  },
  selectorPillActivePrimary: {
    backgroundColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  selectorPillActiveSecondary: {
    backgroundColor: "#f4f8fd",
    borderColor: colors.primary,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  selectorPillLabel: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  selectorPillLabelCompact: { fontSize: 12 },
  selectorPillLabelPrimary: { color: colors.textPrimary },
  selectorPillLabelSecondary: { color: colors.textPrimary },
  selectorPillLabelActivePrimary: { color: colors.white },
  selectorPillLabelActiveSecondary: { color: colors.primary },
  selectorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e8dccd",
  },
  selectorDotActive: { backgroundColor: colors.accentTeal },
  notesBoard: {
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  subjectList: {},
  subjectRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  subjectRowAlt: {
    backgroundColor: "#fffaf4",
  },
  subjectRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subjectHeader: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 24,
  },
  subjectHeaderLeft: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  subjectHeaderCenter: {
    minWidth: 68,
    alignItems: "center",
    justifyContent: "center",
  },
  subjectHeaderRight: {
    minWidth: 62,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  subjectTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
  },
  subjectAverage: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  subjectCoeff: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },
  evaluationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 8,
  },
  evaluationCell: {
    minWidth: "18%",
    alignItems: "flex-start",
  },
  scoreInline: { flexDirection: "row", alignItems: "flex-start" },
  scoreValue: {
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 13,
  },
  scoreValueStrong: { color: colors.accentTeal },
  scoreValueMid: { color: colors.primaryDark },
  scoreValueWeak: { color: colors.notification },
  scoreMax: {
    color: colors.textSecondary,
    fontSize: 7,
    fontWeight: "700",
    lineHeight: 8,
    marginTop: 1,
    marginLeft: 1,
    opacity: 0.5,
  },
  specialChip: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderWidth: 1,
  },
  specialChipAbsent: {
    backgroundColor: "#eef7ff",
    borderColor: "#8fc8f6",
  },
  specialChipExcused: {
    backgroundColor: "#eef8f1",
    borderColor: "#9ad6ab",
  },
  specialChipNeutral: {
    backgroundColor: "#f1f4f8",
    borderColor: "#c7d1dc",
  },
  specialChipText: { fontSize: 10, fontWeight: "800" },
  specialChipTextAbsent: { color: "#1f9cf0" },
  specialChipTextExcused: { color: "#1e9a4a" },
  specialChipTextNeutral: { color: "#6c7a89" },
  inlineEmptyText: { color: colors.textSecondary, fontSize: 13 },
  generalAverageCard: {
    backgroundColor: "#eef6fb",
    borderTopWidth: 1,
    borderTopColor: "#d8e8f2",
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 4,
  },
  generalAverageTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  generalAverageDash: { color: colors.textSecondary, fontSize: 18 },
  generalAverageValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  generalAverageHint: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  legendAbs: { color: "#1f9cf0", fontSize: 12, fontWeight: "800" },
  legendExcused: { color: "#1e9a4a", fontSize: 12, fontWeight: "800" },
  legendNeutral: { color: "#6c7a89", fontSize: 12, fontWeight: "800" },
  legendText: { color: colors.textSecondary, fontSize: 11 },
  hero: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#cfdfee",
    backgroundColor: "#f8fbff",
    padding: 14,
    gap: 12,
    shadowColor: "#0C5FA8",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    overflow: "hidden",
    position: "relative",
  },
  heroTintPrimary: {
    position: "absolute",
    top: -18,
    right: -8,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(12,95,168,0.07)",
  },
  heroTintAccent: {
    position: "absolute",
    bottom: -30,
    left: -16,
    width: 170,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(36,124,114,0.06)",
  },
  heroHeader: { gap: 5 },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1,
    borderColor: "#bed5ea",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  heroBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  heroTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  heroSubtitle: { color: colors.textSecondary, fontSize: 11, lineHeight: 15 },
  publishedCard: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "#d7e4ee",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 3,
  },
  publishedLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  publishedValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
  },
  heroStatsGrid: { gap: 10 },
  heroStatCard: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.76)",
    borderWidth: 1,
    borderColor: "#d9e5ef",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 5,
    minHeight: 92,
  },
  heroStatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroStatLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  heroStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#edf5fb",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStatValue: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  heroStatHint: { color: colors.textSecondary, fontSize: 11, lineHeight: 15 },
  tableBoard: {
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  averageList: { gap: 10 },
  averageRow: {
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  averageRowHeader: {
    gap: 3,
  },
  averageRowHeaderMain: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  averageHeaderRight: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  averageTeachers: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  averageSubject: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
  averageValueCompact: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: "800",
  },
  averageCoeffCompact: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  averageMetricsTextRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  averageMetricText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  averageMetricValue: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
  averageProgressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#dfe8ef",
    overflow: "hidden",
  },
  averageProgressFill: {
    height: "100%",
    borderRadius: 999,
    flexDirection: "row",
    overflow: "hidden",
  },
  averageProgressBlue: {
    flex: 0.56,
    backgroundColor: "#1767b7",
  },
  averageProgressBlend: {
    flex: 0.14,
    backgroundColor: "#2187b1",
  },
  averageProgressGreen: {
    flex: 0.3,
    backgroundColor: colors.accentTeal,
  },
  averageAppreciation: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  generalAverageRow: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
    backgroundColor: "rgba(10,98,191,0.06)",
  },
  metricPill: {
    borderRadius: 999,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    gap: 6,
  },
  metricLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "600" },
  metricValue: { color: colors.textPrimary, fontSize: 11, fontWeight: "800" },
  chartPanels: { gap: 14 },
  chartPanelCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d7e5ef",
    backgroundColor: "#f8fbff",
    padding: 14,
    gap: 14,
  },
  chartPanelCardAlt: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#d5e6df",
    backgroundColor: "#f6fbfa",
    padding: 14,
    gap: 14,
  },
  chartPanelTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  chartPanelSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  comparisonRow: { gap: 9 },
  comparisonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  comparisonRangeBadge: {
    borderRadius: 999,
    backgroundColor: "#edf4fb",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  comparisonRangeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  chartList: { gap: 14 },
  chartTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  chartValues: { color: colors.textSecondary, fontSize: 12 },
  comparisonTrack: {
    height: 16,
    borderRadius: 999,
    backgroundColor: "#edf2f7",
    position: "relative",
    overflow: "hidden",
    justifyContent: "center",
  },
  comparisonBand: {
    position: "absolute",
    height: 16,
    borderRadius: 999,
    backgroundColor: "#cfe0f2",
  },
  comparisonDotStudent: {
    position: "absolute",
    marginLeft: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    top: -1,
  },
  comparisonDotClass: {
    position: "absolute",
    marginLeft: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4b5563",
    top: 1,
  },
  chartLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  legendSwatchWide: {
    width: 28,
    borderRadius: 999,
  },
  legendItemText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  radarWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  radarStage: {
    width: 220,
    height: 220,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  radarRing: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "#d7e0ea",
    backgroundColor: "transparent",
  },
  radarAxis: {
    position: "absolute",
    height: 1,
    backgroundColor: "#d4dde7",
  },
  radarAxisLabel: {
    position: "absolute",
    width: 52,
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "700",
  },
  radarSegmentClass: {
    position: "absolute",
    height: 2,
    backgroundColor: "#64748b",
  },
  radarSegmentStudent: {
    position: "absolute",
    height: 3,
    backgroundColor: colors.primary,
  },
  radarPointClass: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#64748b",
  },
  radarPointStudent: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  radarCenterPoint: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  radarInfoGrid: {
    gap: 10,
  },
  radarInfoCard: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "#d9e6e1",
    padding: 12,
    gap: 4,
  },
  radarInfoTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  radarInfoText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31,41,51,0.45)",
  },
  modalCard: {
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  modalTitleBlock: { flex: 1, gap: 4 },
  modalEyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modalTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "800" },
  modalCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  modalLead: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  modalStatGrid: { gap: 10 },
  modalStatCard: {
    borderRadius: 16,
    backgroundColor: colors.warmSurface,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    padding: 12,
    gap: 4,
  },
  modalStatLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modalStatValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  modalStatSuffix: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  modalContextCard: {
    borderRadius: 16,
    backgroundColor: "#f8fbfd",
    borderWidth: 1,
    borderColor: "#dbe8ef",
    padding: 14,
    gap: 6,
  },
  modalContextLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modalContextText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  modalAppreciation: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
