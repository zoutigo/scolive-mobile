import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { roomsApi } from "../../api/rooms.api";
import { ConfirmDialog } from "../ConfirmDialog";
import { DatePickerField } from "../DatePickerField";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { FormHero } from "../forms/FormHero";
import { SelectDropdown } from "../SelectDropdown";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import {
  buildAdminSubtitle,
  getPortalLabel,
  getViewType,
} from "../navigation/nav-config";
import { colors } from "../../theme";
import { extractApiError } from "../../utils/api-error";
import {
  addDays,
  formatDateInput,
  minuteToTimeLabel,
  startOfWeek,
} from "../../utils/timetable";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  SectionCard,
} from "../timetable/TimetableCommon";
import type { RoomCalendarEntry, RoomRow } from "../../types/room.types";
import { moduleBack } from "../../utils/moduleBack";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabKey = "list" | "calendar" | "help" | "forms";
type ListTabKey = "list" | "calendar" | "help";

type FormContext = {
  type: "create-room" | "edit-room";
  originTab: ListTabKey;
  item: RoomRow | null;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const BASE_TAB_ITEMS: Array<{ key: ListTabKey; label: string }> = [
  { key: "list", label: "Salles" },
  { key: "calendar", label: "Calendrier" },
  { key: "help", label: "Aide" },
];

const STATUS_OPTIONS: Array<{ value: RoomRow["status"]; label: string }> = [
  { value: "AVAILABLE", label: "Disponible" },
  { value: "UNAVAILABLE", label: "Indisponible" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

const STATUS_LABELS: Record<RoomRow["status"], string> = {
  AVAILABLE: "Disponible",
  UNAVAILABLE: "Indisponible",
  MAINTENANCE: "Maintenance",
};

// ---------------------------------------------------------------------------
// Schema (exported for tests)
// ---------------------------------------------------------------------------

export const roomFormSchema = z.object({
  name: z.string().trim().min(1, "Le nom de la salle est obligatoire."),
  description: z.string().trim().optional(),
  capacity: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^[0-9]+$/.test(value),
      "La capacité doit être un nombre entier positif.",
    ),
  maxConcurrentSlots: z
    .string()
    .trim()
    .min(1, "Ce champ est obligatoire.")
    .refine(
      (value) => /^[0-9]+$/.test(value) && Number(value) >= 1,
      "Doit être un nombre entier supérieur ou égal à 1.",
    ),
  status: z.enum(["AVAILABLE", "UNAVAILABLE", "MAINTENANCE"]),
});

function buildRoomPayload(values: z.infer<typeof roomFormSchema>) {
  return {
    name: values.name.trim(),
    description: values.description?.trim() || undefined,
    capacity: values.capacity ? Number(values.capacity) : undefined,
    maxConcurrentSlots: Number(values.maxConcurrentSlots),
    status: values.status,
  };
}

function roomSearchText(entry: RoomRow) {
  return [entry.name, entry.description ?? "", STATUS_LABELS[entry.status]]
    .join(" ")
    .toLowerCase();
}

function roleAllowsAdmin(role: string | null | undefined) {
  return role === "SCHOOL_ADMIN" || role === "ADMIN" || role === "SUPER_ADMIN";
}

function defaultDateRange() {
  const monday = startOfWeek(new Date());
  const sunday = addDays(monday, 6);
  return {
    fromDate: formatDateInput(monday),
    toDate: formatDateInput(sunday),
  };
}

// ---------------------------------------------------------------------------
// TextFormField
// ---------------------------------------------------------------------------

type TextFormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  error?: string;
  testID: string;
  keyboardType?: "default" | "numeric";
};

const TextFormField = React.forwardRef<TextInput, TextFormFieldProps>(
  function TextFormField(props, ref) {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.formField}>
        <Text style={styles.formLabel}>{props.label}</Text>
        <TextInput
          ref={ref}
          value={props.value}
          onChangeText={props.onChangeText}
          onBlur={() => {
            setFocused(false);
            props.onBlur();
          }}
          onFocus={() => setFocused(true)}
          placeholder={props.placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={props.keyboardType}
          style={[
            styles.formInput,
            focused && styles.formInputFocused,
            props.error ? styles.formInputError : null,
          ]}
          testID={props.testID}
        />
        {props.error ? (
          <Text style={styles.formError} testID={`${props.testID}-error`}>
            {props.error}
          </Text>
        ) : null}
      </View>
    );
  },
);

// ---------------------------------------------------------------------------
// FormActions
// ---------------------------------------------------------------------------

function FormActions(props: {
  submitLabel: string;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  testIDPrefix: string;
}) {
  return (
    <View style={styles.formActions}>
      <TouchableOpacity
        style={styles.secondaryAction}
        onPress={props.onCancel}
        testID={`${props.testIDPrefix}-cancel`}
      >
        <Text style={styles.secondaryActionLabel}>Annuler</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.primaryAction,
          (props.isSubmitting || props.submitDisabled) &&
            styles.primaryActionDisabled,
        ]}
        disabled={props.isSubmitting || props.submitDisabled}
        onPress={props.onSubmit}
        testID={`${props.testIDPrefix}-submit`}
      >
        <Text style={styles.primaryActionLabel}>
          {props.isSubmitting ? "Enregistrement..." : props.submitLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// RoomFormContent — formulaire inline de création/édition (sans Modal)
// ---------------------------------------------------------------------------

function RoomFormContent(props: {
  mode: "create" | "edit";
  item: RoomRow | null;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: z.infer<typeof roomFormSchema>) => Promise<void> | void;
}) {
  const {
    control,
    handleSubmit,
    setFocus: focusField,
    formState: { errors },
  } = useForm<z.infer<typeof roomFormSchema>>({
    resolver: zodResolver(roomFormSchema),
    mode: "onChange",
    defaultValues: {
      name: props.item?.name ?? "",
      description: props.item?.description ?? "",
      capacity: props.item?.capacity ? String(props.item.capacity) : "",
      maxConcurrentSlots: props.item
        ? String(props.item.maxConcurrentSlots)
        : "1",
      status: props.item?.status ?? "AVAILABLE",
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.formsKeyboardArea}
      testID="rooms-admin-form-content"
    >
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Controller
          control={control}
          name="name"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Nom de la salle"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: Salle 12"
              error={errors.name?.message}
              testID="rooms-admin-form-name"
            />
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Description"
              value={value ?? ""}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: Bâtiment A, rez-de-chaussée"
              error={errors.description?.message}
              testID="rooms-admin-form-description"
            />
          )}
        />
        <Controller
          control={control}
          name="capacity"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Capacité"
              value={value ?? ""}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: 30"
              keyboardType="numeric"
              error={errors.capacity?.message}
              testID="rooms-admin-form-capacity"
            />
          )}
        />
        <Controller
          control={control}
          name="maxConcurrentSlots"
          render={({ field: { value, onChange, onBlur, ref } }) => (
            <TextFormField
              ref={ref}
              label="Créneaux simultanés max."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Ex: 1"
              keyboardType="numeric"
              error={errors.maxConcurrentSlots?.message}
              testID="rooms-admin-form-max-concurrent-slots"
            />
          )}
        />
        <Controller
          control={control}
          name="status"
          render={({ field: { value, onChange } }) => (
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Statut</Text>
              <SelectDropdown
                options={STATUS_OPTIONS}
                value={value}
                onChange={(next) => onChange(next as RoomRow["status"])}
                placeholder="Choisir un statut"
                hasError={!!errors.status}
                testID="rooms-admin-form-status"
              />
              {errors.status ? (
                <Text
                  style={styles.formError}
                  testID="rooms-admin-form-status-error"
                >
                  {errors.status.message}
                </Text>
              ) : null}
            </View>
          )}
        />
      </ScrollView>

      <View style={styles.formActionsBar}>
        <FormActions
          submitLabel={
            props.mode === "create" ? "Créer la salle" : "Enregistrer"
          }
          isSubmitting={props.isSubmitting}
          onCancel={props.onCancel}
          onSubmit={handleSubmit(props.onSubmit, (errs) => {
            const first = Object.keys(errs)[0];
            if (first) focusField(first as Parameters<typeof focusField>[0]);
          })}
          testIDPrefix="rooms-admin-form"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// RoomsAdminScreen
// ---------------------------------------------------------------------------

export function RoomsAdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { schoolSlug, user } = useAuthStore();
  const showSuccess = useSuccessToastStore((state) => state.showSuccess);
  const showError = useSuccessToastStore((state) => state.showError);

  const [tab, setTab] = useState<TabKey>("list");
  const [formContext, setFormContext] = useState<FormContext | null>(null);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [deleteTarget, setDeleteTarget] = useState<RoomRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialRange = useMemo(() => defaultDateRange(), []);
  const [calendarRoomId, setCalendarRoomId] = useState("");
  const [calendarFromDate, setCalendarFromDate] = useState(
    initialRange.fromDate,
  );
  const [calendarToDate, setCalendarToDate] = useState(initialRange.toDate);
  const [calendarEntries, setCalendarEntries] = useState<RoomCalendarEntry[]>(
    [],
  );
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const effectiveRole = user?.activeRole ?? user?.role ?? null;
  const subtitle = user ? buildAdminSubtitle(user) : null;
  const canAccessModule = roleAllowsAdmin(effectiveRole);

  const roomCountLabel = `${rooms.length} salle${rooms.length > 1 ? "s" : ""}`;

  const filteredRooms = useMemo(() => {
    const search = query.trim().toLowerCase();
    const sorted = [...rooms].sort((a, b) => a.name.localeCompare(b.name));
    if (!search) return sorted;
    return sorted.filter((entry) => roomSearchText(entry).includes(search));
  }, [query, rooms]);

  const visibleRooms = useMemo(
    () => filteredRooms.slice(0, visibleCount),
    [filteredRooms, visibleCount],
  );

  const roomSelectOptions = useMemo(
    () => rooms.map((entry) => ({ value: entry.id, label: entry.name })),
    [rooms],
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, rooms.length]);

  useEffect(() => {
    if (!calendarRoomId && rooms.length > 0) {
      setCalendarRoomId(rooms[0].id);
    }
  }, [rooms, calendarRoomId]);

  const loadRooms = useCallback(
    async (refresh = false) => {
      if (!schoolSlug) {
        setErrorMessage("Aucun établissement actif.");
        setIsLoading(false);
        return;
      }
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);
      try {
        const rows = await roomsApi.listRooms(schoolSlug);
        setRooms(rows);
      } catch (error) {
        setErrorMessage(extractApiError(error));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [schoolSlug],
  );

  useEffect(() => {
    if (!canAccessModule) return;
    void loadRooms(false);
  }, [canAccessModule, loadRooms]);

  const loadCalendar = useCallback(async () => {
    if (!schoolSlug || !calendarRoomId) return;
    setIsCalendarLoading(true);
    setCalendarError(null);
    try {
      const entries = await roomsApi.getRoomCalendar(
        schoolSlug,
        calendarRoomId,
        calendarFromDate,
        calendarToDate,
      );
      setCalendarEntries(entries);
    } catch (error) {
      setCalendarError(extractApiError(error));
    } finally {
      setIsCalendarLoading(false);
    }
  }, [schoolSlug, calendarRoomId, calendarFromDate, calendarToDate]);

  useEffect(() => {
    if (tab !== "calendar" || !calendarRoomId) return;
    void loadCalendar();
  }, [tab, calendarRoomId, calendarFromDate, calendarToDate, loadCalendar]);

  const handleRefresh = useCallback(async () => {
    await loadRooms(true);
  }, [loadRooms]);

  function exitForms() {
    const origin = formContext?.originTab ?? "list";
    setFormContext(null);
    setTab(origin);
  }

  function openFab() {
    if (tab === "list") {
      setFormContext({ type: "create-room", originTab: "list", item: null });
      setTab("forms");
    }
  }

  async function handleSubmitRoom(values: z.infer<typeof roomFormSchema>) {
    if (!schoolSlug || !formContext) return;
    const isEdit = formContext.type === "edit-room";
    const payload = buildRoomPayload(values);
    setIsSubmitting(true);
    try {
      if (isEdit && formContext.item?.id) {
        await roomsApi.updateRoom(schoolSlug, formContext.item.id, payload);
      } else {
        await roomsApi.createRoom(schoolSlug, payload);
      }
      await loadRooms(true);
      const originTab = formContext.originTab;
      showSuccess({
        title: isEdit ? "Salle modifiée" : "Salle créée",
        message: isEdit
          ? "Les changements sur la salle ont été enregistrés."
          : "La nouvelle salle est disponible pour l'organisation pédagogique.",
      });
      setTimeout(() => {
        setTab(originTab);
        setFormContext(null);
      }, 2000);
    } catch (error) {
      showError({
        title: "Opération impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteRoom() {
    if (!schoolSlug || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await roomsApi.deleteRoom(schoolSlug, deleteTarget.id);
      setDeleteTarget(null);
      await loadRooms(true);
      showSuccess({
        title: "Salle supprimée",
        message: "La salle a été retirée de l'établissement.",
      });
    } catch (error) {
      showError({
        title: "Suppression impossible",
        message: extractApiError(error),
      });
    } finally {
      setIsDeleting(false);
    }
  }

  if (!user) {
    return (
      <View style={styles.screen}>
        <LoadingBlock label="Chargement du profil..." />
      </View>
    );
  }

  if (!canAccessModule) {
    return (
      <View style={styles.screen}>
        <ModuleHeader
          title="Salles"
          subtitle={getPortalLabel(getViewType(user))}
          onBack={() => moduleBack(router)}
          topInset={insets.top}
          testID="rooms-admin-header"
          backTestID="rooms-admin-back-btn"
        />
        <View style={styles.lockedWrap}>
          <EmptyState
            icon="business-outline"
            title="Module réservé aux comptes admin"
            message="Ce module mobile est disponible pour les comptes school admin."
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ModuleHeader
        title="Salles"
        subtitle={subtitle}
        onBack={() => (tab === "forms" ? exitForms() : moduleBack(router))}
        topInset={insets.top}
        testID="rooms-admin-header"
        backTestID="rooms-admin-back-btn"
      />

      {tab !== "forms" ? (
        <UnderlineTabs<ListTabKey>
          items={BASE_TAB_ITEMS}
          activeKey={tab as ListTabKey}
          onSelect={(key) => setTab(key)}
          testIDPrefix="rooms-admin-tab"
        />
      ) : null}

      {/* ── Tab forms : hero + formulaire inline ──────────────────────────── */}
      {tab === "forms" && formContext ? (
        <View style={styles.formsTabContent} testID="rooms-admin-forms-tab">
          <View style={styles.heroWrapper}>
            <FormHero
              icon={
                formContext.type === "create-room"
                  ? "add-circle-outline"
                  : "create-outline"
              }
              title={
                formContext.type === "create-room"
                  ? "Créer une salle"
                  : "Modifier la salle"
              }
              subtitle="Renseignez le nom, la capacité et la disponibilité de la salle."
              palette={formContext.type === "create-room" ? "teal" : "warm"}
              testID="rooms-admin-form-hero"
            />
          </View>
          <RoomFormContent
            mode={formContext.type === "edit-room" ? "edit" : "create"}
            item={formContext.item}
            isSubmitting={isSubmitting}
            onCancel={exitForms}
            onSubmit={handleSubmitRoom}
          />
        </View>
      ) : null}

      {/* ── Tabs liste (list / calendar / help) ────────────────────────────── */}
      {tab !== "forms" ? (
        isLoading ? (
          <View style={styles.loadingWrap}>
            <LoadingBlock label="Chargement du module salles..." />
          </View>
        ) : (
          <View style={styles.content}>
            {errorMessage ? (
              <ErrorBanner
                message={errorMessage}
                onDismiss={() => setErrorMessage(null)}
                testID="rooms-admin-error-banner"
              />
            ) : null}

            {tab === "list" ? (
              <>
                <View style={styles.summaryStrip} testID="rooms-admin-summary">
                  <View style={styles.summaryStatChip}>
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color={colors.accentTeal}
                    />
                    <Text style={styles.summaryStatText}>{roomCountLabel}</Text>
                  </View>
                </View>
                <InfiniteScrollList
                  data={visibleRooms}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item, index }) => (
                    <View
                      style={[
                        styles.entityRow,
                        {
                          backgroundColor:
                            index % 2 === 0 ? "#FFF9F3" : "#FFF2E4",
                        },
                      ]}
                      testID={`rooms-admin-room-row-${item.id}`}
                    >
                      <View
                        style={[
                          styles.entityAccent,
                          { backgroundColor: "#D89B5B" },
                        ]}
                      />
                      <View style={styles.entityMain}>
                        <View style={styles.entityTextWrap}>
                          <Text style={styles.entityTitle}>{item.name}</Text>
                          <Text style={styles.entityMeta}>
                            {item.description ?? "Aucune description"}
                          </Text>
                          <Text style={styles.entityMeta}>
                            Capacité {item.capacity ?? "-"} · Créneaux simult.{" "}
                            {item.maxConcurrentSlots} ·{" "}
                            {STATUS_LABELS[item.status]}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.iconActions}>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => {
                            setFormContext({
                              type: "edit-room",
                              originTab: "list",
                              item,
                            });
                            setTab("forms");
                          }}
                          testID={`rooms-admin-room-edit-${item.id}`}
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => setDeleteTarget(item)}
                          testID={`rooms-admin-room-delete-${item.id}`}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={colors.notification}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  onRefresh={handleRefresh}
                  refreshing={isRefreshing}
                  onLoadMore={() =>
                    setVisibleCount((current) => current + PAGE_SIZE)
                  }
                  hasMore={visibleRooms.length < filteredRooms.length}
                  isLoadingMore={false}
                  testID="rooms-admin-list"
                  contentContainerStyle={styles.listContent}
                  ListHeaderComponent={
                    <View style={styles.listHeader}>
                      <TextInput
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Rechercher une salle"
                        placeholderTextColor={colors.textSecondary}
                        style={styles.searchInput}
                        testID="rooms-admin-search"
                      />
                    </View>
                  }
                  emptyComponent={
                    <View style={styles.emptyListWrap}>
                      <EmptyState
                        icon="business-outline"
                        title={
                          query.trim() ? "Aucune salle trouvée" : "Aucune salle"
                        }
                        message={
                          query.trim()
                            ? "Ajustez votre recherche pour retrouver une salle."
                            : "Ajoutez une première salle depuis le bouton flottant."
                        }
                      />
                    </View>
                  }
                />
              </>
            ) : null}

            {tab === "calendar" ? (
              <ScrollView
                style={styles.calendarScroll}
                contentContainerStyle={styles.calendarContent}
                refreshControl={
                  <RefreshControl
                    refreshing={isCalendarLoading}
                    onRefresh={() => {
                      void loadCalendar();
                    }}
                    tintColor={colors.primary}
                  />
                }
                showsVerticalScrollIndicator={false}
                testID="rooms-admin-calendar-scroll"
              >
                {calendarError ? (
                  <ErrorBanner
                    message={calendarError}
                    onDismiss={() => setCalendarError(null)}
                    testID="rooms-admin-calendar-error"
                  />
                ) : null}

                <SectionCard
                  title="Filtres"
                  testID="rooms-admin-calendar-filters-card"
                >
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Salle</Text>
                    <SelectDropdown
                      options={roomSelectOptions}
                      value={calendarRoomId}
                      onChange={setCalendarRoomId}
                      placeholder="Choisir une salle"
                      testID="rooms-admin-calendar-room"
                    />
                  </View>
                  <View style={styles.calendarDateRow}>
                    <View style={[styles.formField, styles.calendarDateField]}>
                      <Text style={styles.formLabel}>Du</Text>
                      <DatePickerField
                        value={calendarFromDate}
                        onChange={setCalendarFromDate}
                        testID="rooms-admin-calendar-from"
                      />
                    </View>
                    <View style={[styles.formField, styles.calendarDateField]}>
                      <Text style={styles.formLabel}>Au</Text>
                      <DatePickerField
                        value={calendarToDate}
                        onChange={setCalendarToDate}
                        testID="rooms-admin-calendar-to"
                      />
                    </View>
                  </View>
                </SectionCard>

                <SectionCard
                  title="Occupations"
                  subtitle={`${calendarEntries.length} créneau(x)`}
                  testID="rooms-admin-calendar-card"
                >
                  {isCalendarLoading ? (
                    <LoadingBlock label="Chargement du calendrier..." />
                  ) : calendarEntries.length === 0 ? (
                    <EmptyState
                      icon="calendar-outline"
                      title="Aucune occupation"
                      message="Aucun créneau n'est planifié pour cette salle sur la période choisie."
                    />
                  ) : (
                    <View style={styles.listStack}>
                      {calendarEntries.map((entry) => (
                        <View
                          key={entry.id}
                          style={styles.calendarEntryRow}
                          testID={`rooms-admin-calendar-entry-${entry.id}`}
                        >
                          <Text style={styles.calendarEntryDate}>
                            {entry.occurrenceDate}
                          </Text>
                          <Text style={styles.calendarEntryTime}>
                            {minuteToTimeLabel(entry.startMinute)} -{" "}
                            {minuteToTimeLabel(entry.endMinute)}
                          </Text>
                          <Text style={styles.calendarEntryMeta}>
                            {entry.className} · {entry.subjectName} ·{" "}
                            {entry.teacherName}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </SectionCard>
              </ScrollView>
            ) : null}

            {tab === "help" ? (
              <ScrollView
                style={styles.helpScroll}
                contentContainerStyle={styles.helpContent}
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => {
                      void handleRefresh();
                    }}
                  />
                }
                showsVerticalScrollIndicator={false}
                testID="rooms-admin-help-scroll"
              >
                <SectionCard
                  title="Parcours recommandé"
                  testID="rooms-admin-help-card"
                >
                  <Text style={styles.helpLine}>
                    1. Créez les salles disponibles dans l'établissement.
                  </Text>
                  <Text style={styles.helpLine}>
                    2. Définissez leur capacité et le nombre de créneaux
                    simultanés autorisés.
                  </Text>
                  <Text style={styles.helpLine}>
                    3. Consultez le calendrier pour vérifier l'occupation d'une
                    salle sur une période donnée.
                  </Text>
                </SectionCard>
                <SectionCard title="Rappels métier">
                  <Text style={styles.helpLine}>
                    Une salle en statut "Indisponible" ou "Maintenance" reste
                    visible mais ne doit plus être proposée pour de nouveaux
                    créneaux.
                  </Text>
                  <Text style={styles.helpLine}>
                    Le nombre de créneaux simultanés permet de partager une
                    salle entre plusieurs classes (ex. gymnase).
                  </Text>
                </SectionCard>
              </ScrollView>
            ) : null}
          </View>
        )
      ) : null}

      {tab === "list" ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={openFab}
          testID="rooms-admin-fab"
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <ConfirmDialog
        visible={deleteTarget != null}
        title="Supprimer la salle"
        message={
          deleteTarget
            ? `Supprimer définitivement la salle "${deleteTarget.name}" ?`
            : ""
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={() => {
          void handleDeleteRoom();
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  lockedWrap: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  loadingWrap: {
    flex: 1,
    padding: 16,
  },
  content: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  summaryStrip: {
    flexDirection: "row",
    gap: 10,
  },
  summaryStatChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EAF7F4",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  summaryStatText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accentTeal,
  },
  listContent: {
    paddingBottom: 108,
    gap: 8,
  },
  listHeader: {
    paddingTop: 2,
    paddingBottom: 4,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontSize: 14,
  },
  emptyListWrap: {
    paddingTop: 36,
  },
  entityRow: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 14,
    padding: 14,
    paddingLeft: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    shadowColor: "#08467D",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  entityAccent: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 4,
    borderRadius: 999,
  },
  entityMain: {
    flex: 1,
    gap: 6,
  },
  entityTextWrap: {
    gap: 2,
  },
  entityTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  entityMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  iconActions: {
    flexDirection: "row",
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFFFFFE0",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarScroll: {
    flex: 1,
  },
  calendarContent: {
    paddingBottom: 108,
    gap: 12,
  },
  calendarDateRow: {
    flexDirection: "row",
    gap: 10,
  },
  calendarDateField: {
    flex: 1,
  },
  listStack: {
    gap: 8,
  },
  calendarEntryRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  calendarEntryDate: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  calendarEntryTime: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  calendarEntryMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  helpScroll: {
    flex: 1,
  },
  helpContent: {
    paddingBottom: 108,
    gap: 12,
  },
  helpLine: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24 + BOTTOM_TAB_BAR_HEIGHT,
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  // ── Inline form layout ──────────────────────────────────────────────────
  formsTabContent: {
    flex: 1,
  },
  heroWrapper: {
    padding: 16,
  },
  formsKeyboardArea: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 16,
  },
  formActionsBar: {
    backgroundColor: colors.warmSurface,
    borderTopWidth: 1,
    borderTopColor: colors.warmBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 10,
  },
  // ── Form fields ─────────────────────────────────────────────────────────
  formField: {
    gap: 8,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
  },
  formInputFocused: {
    borderColor: colors.primary,
  },
  formInputError: {
    borderColor: "#B84A3B",
  },
  formError: {
    color: "#B84A3B",
    fontSize: 12,
    lineHeight: 16,
  },
  formActions: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  secondaryAction: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  secondaryActionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  primaryAction: {
    flex: 1.2,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  primaryActionDisabled: {
    opacity: 0.5,
  },
  primaryActionLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
