import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
import { TimePickerField } from "../TimePickerField";
import { InfiniteScrollList } from "../lists/InfiniteScrollList";
import { ModuleHeader } from "../navigation/ModuleHeader";
import { NavBadge } from "../navigation/NavBadge";
import { FormHero } from "../forms/FormHero";
import { InlineSelectDropDown } from "../InlineSelectDropDown";
import { BOTTOM_TAB_BAR_HEIGHT } from "../navigation/BottomTabBar";
import { UnderlineTabs } from "../navigation/UnderlineTabs";
import { useAuthStore } from "../../store/auth.store";
import { useSuccessToastStore } from "../../store/success-toast.store";
import { useTranslation } from "../../i18n/useTranslation";
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
  timeLabelToMinute,
} from "../../utils/timetable";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
  SectionCard,
} from "../timetable/TimetableCommon";
import type {
  RoomCalendarEntry,
  RoomRow,
  RoomsListFilters,
  RoomsListMeta,
  RoomSimultaneity,
  RoomStatus,
} from "../../types/room.types";
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

const STATUS_FILTER_KEYS: RoomStatus[] = [
  "AVAILABLE",
  "UNAVAILABLE",
  "MAINTENANCE",
];

const SIMULTANEITY_FILTER_KEYS: RoomSimultaneity[] = ["SINGLE", "MULTIPLE"];

const NO_ROOM_FILTERS: RoomsListFilters = {
  status: null,
  simultaneity: null,
  availabilityFromDate: null,
  availabilityToDate: null,
  availabilityStartMinute: null,
  availabilityEndMinute: null,
};

const SEARCH_DEBOUNCE_MS = 300;

function hasActiveRoomFilters(filters: RoomsListFilters) {
  return (
    filters.status != null ||
    filters.simultaneity != null ||
    filters.availabilityFromDate != null
  );
}

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
              <InlineSelectDropDown
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

  const { t } = useTranslation();

  const [tab, setTab] = useState<TabKey>("list");
  const [formContext, setFormContext] = useState<FormContext | null>(null);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [listMeta, setListMeta] = useState<RoomsListMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [allRoomOptions, setAllRoomOptions] = useState<RoomRow[]>([]);

  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<RoomsListFilters>(NO_ROOM_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<RoomsListFilters>(NO_ROOM_FILTERS);
  const [filterScrollOverflowing, setFilterScrollOverflowing] = useState(false);
  const [filterScrollNearBottom, setFilterScrollNearBottom] = useState(false);
  const filterScrollLayoutHeightRef = useRef(0);
  const filterScrollContentHeightRef = useRef(0);
  const showFilterScrollHint =
    filterScrollOverflowing && !filterScrollNearBottom;
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<RoomRow | null>(null);
  const [menuTarget, setMenuTarget] = useState<RoomRow | null>(null);
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

  const roomSelectOptions = useMemo(
    () =>
      allRoomOptions.map((entry) => ({ value: entry.id, label: entry.name })),
    [allRoomOptions],
  );

  useEffect(() => {
    if (!calendarRoomId && allRoomOptions.length > 0) {
      setCalendarRoomId(allRoomOptions[0].id);
    }
  }, [allRoomOptions, calendarRoomId]);

  const loadAllRoomOptions = useCallback(async () => {
    if (!schoolSlug) return;
    try {
      const result = await roomsApi.listRooms(schoolSlug, { limit: 200 });
      setAllRoomOptions(result.items);
    } catch {
      // Le sélecteur du tab calendrier reste vide, non bloquant.
    }
  }, [schoolSlug]);

  const loadList = useCallback(
    async (
      page: number,
      filters: RoomsListFilters,
      searchQuery: string,
      mode: "reset" | "append" | "refresh",
    ) => {
      if (!schoolSlug) {
        setErrorMessage("Aucun établissement actif.");
        setIsLoading(false);
        return;
      }
      if (mode === "append") setIsLoadingMore(true);
      else if (mode === "refresh") setIsRefreshing(true);
      else setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await roomsApi.listRooms(schoolSlug, {
          page,
          search: searchQuery || undefined,
          status: filters.status ?? undefined,
          simultaneity: filters.simultaneity ?? undefined,
          availabilityFromDate: filters.availabilityFromDate ?? undefined,
          availabilityToDate: filters.availabilityToDate ?? undefined,
          availabilityStartMinute: filters.availabilityStartMinute ?? undefined,
          availabilityEndMinute: filters.availabilityEndMinute ?? undefined,
        });
        setRooms((prev) =>
          mode === "append" ? [...prev, ...result.items] : result.items,
        );
        setListMeta({
          page: result.page,
          limit: result.limit,
          total: result.total,
        });
      } catch (error) {
        setErrorMessage(extractApiError(error));
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [schoolSlug],
  );

  useEffect(() => {
    if (!canAccessModule) {
      setIsLoading(false);
      return;
    }
    void loadList(1, appliedFilters, appliedSearch, "reset");
  }, [canAccessModule, appliedFilters, appliedSearch, loadList]);

  useEffect(() => {
    if (!canAccessModule) return;
    void loadAllRoomOptions();
  }, [canAccessModule, loadAllRoomOptions]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setAppliedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  const handleLoadMoreRooms = useCallback(() => {
    if (!listMeta) return;
    const totalPages = Math.max(1, Math.ceil(listMeta.total / listMeta.limit));
    if (listMeta.page >= totalPages) return;
    if (isLoadingMore) return;
    void loadList(listMeta.page + 1, appliedFilters, appliedSearch, "append");
  }, [listMeta, isLoadingMore, appliedFilters, appliedSearch, loadList]);

  const handleListRefresh = useCallback(async () => {
    await Promise.all([
      loadList(1, appliedFilters, appliedSearch, "refresh"),
      loadAllRoomOptions(),
    ]);
  }, [loadList, appliedFilters, appliedSearch, loadAllRoomOptions]);

  function openFilters() {
    setDraftFilters(appliedFilters);
    filterScrollLayoutHeightRef.current = 0;
    filterScrollContentHeightRef.current = 0;
    setFilterScrollOverflowing(false);
    setFilterScrollNearBottom(false);
    setFiltersOpen(true);
  }

  function closeFilters() {
    setDraftFilters(appliedFilters);
    setFiltersOpen(false);
  }

  function toggleFilters() {
    if (filtersOpen) closeFilters();
    else openFilters();
  }

  function applyFilters() {
    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
  }

  function resetFilters() {
    setDraftFilters(NO_ROOM_FILTERS);
    setAppliedFilters(NO_ROOM_FILTERS);
  }

  function recomputeFilterScrollOverflow() {
    setFilterScrollOverflowing(
      filterScrollContentHeightRef.current >
        filterScrollLayoutHeightRef.current + 4,
    );
  }
  function handleFilterScrollLayout(height: number) {
    filterScrollLayoutHeightRef.current = height;
    recomputeFilterScrollOverflow();
  }
  function handleFilterScrollContentSize(height: number) {
    filterScrollContentHeightRef.current = height;
    recomputeFilterScrollOverflow();
  }
  function handleFilterScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    setFilterScrollNearBottom(distanceFromBottom < 12);
  }

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
      await handleListRefresh();
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
      await handleListRefresh();
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
      {tab === "list" ? (
        <View style={styles.searchRow} testID="rooms-admin-search-row">
          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder={t("rooms.search.placeholder")}
              placeholderTextColor={colors.textSecondary}
              returnKeyType="search"
              autoCapitalize="none"
              accessibilityLabel={t("rooms.search.accessibilityLabel")}
              testID="rooms-admin-search"
            />
            {searchInput.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchInput("")}
                testID="rooms-admin-search-clear"
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={[
              styles.filterToggle,
              hasActiveRoomFilters(appliedFilters) && styles.filterToggleActive,
            ]}
            onPress={toggleFilters}
            testID="rooms-admin-filter-toggle"
            accessibilityLabel={t("rooms.filters.toggleAccessibilityLabel")}
          >
            <Ionicons
              name={
                hasActiveRoomFilters(appliedFilters)
                  ? "filter"
                  : "filter-outline"
              }
              size={18}
              color={
                hasActiveRoomFilters(appliedFilters)
                  ? colors.white
                  : colors.accentTeal
              }
            />
            <View style={styles.filterToggleBadgeAnchor}>
              <NavBadge
                count={listMeta?.total}
                testID="rooms-admin-filter-count-badge"
              />
            </View>
          </TouchableOpacity>
        </View>
      ) : null}

      {tab === "list" && filtersOpen ? (
        <View style={styles.filterPanel} testID="rooms-admin-filter-panel">
          <View style={styles.filterPanelHeader}>
            <View style={styles.filterPanelHeaderIcon}>
              <Ionicons
                name="options-outline"
                size={16}
                color={colors.accentTealDark}
              />
            </View>
            <Text style={styles.filterPanelHeaderTitle}>
              {t("rooms.filters.toggleAccessibilityLabel")}
            </Text>
          </View>

          <View style={styles.filterScrollWrapper}>
            <ScrollView
              style={styles.filterScrollArea}
              contentContainerStyle={styles.filterScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              onLayout={(e) =>
                handleFilterScrollLayout(e.nativeEvent.layout.height)
              }
              onContentSizeChange={(_w, h) => handleFilterScrollContentSize(h)}
              onScroll={handleFilterScroll}
              scrollEventThrottle={16}
              testID="rooms-admin-filter-scroll"
            >
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>
                  {t("rooms.filters.statusLabel")}
                </Text>
                <View style={styles.filterChipsRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      draftFilters.status == null && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setDraftFilters((current) => ({
                        ...current,
                        status: null,
                      }))
                    }
                    testID="rooms-admin-filter-status-all"
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        draftFilters.status == null &&
                          styles.filterChipLabelActive,
                      ]}
                    >
                      {t("rooms.filters.allOption")}
                    </Text>
                  </TouchableOpacity>
                  {STATUS_FILTER_KEYS.map((key) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.filterChip,
                        draftFilters.status === key && styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setDraftFilters((current) => ({
                          ...current,
                          status: key,
                        }))
                      }
                      testID={`rooms-admin-filter-status-${key}`}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          draftFilters.status === key &&
                            styles.filterChipLabelActive,
                        ]}
                      >
                        {t(`rooms.filters.status.${key}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupLabel}>
                  {t("rooms.filters.simultaneityLabel")}
                </Text>
                <View style={styles.filterChipsRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      draftFilters.simultaneity == null &&
                        styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setDraftFilters((current) => ({
                        ...current,
                        simultaneity: null,
                      }))
                    }
                    testID="rooms-admin-filter-simultaneity-all"
                  >
                    <Text
                      style={[
                        styles.filterChipLabel,
                        draftFilters.simultaneity == null &&
                          styles.filterChipLabelActive,
                      ]}
                    >
                      {t("rooms.filters.allOption")}
                    </Text>
                  </TouchableOpacity>
                  {SIMULTANEITY_FILTER_KEYS.map((key) => (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.filterChip,
                        draftFilters.simultaneity === key &&
                          styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setDraftFilters((current) => ({
                          ...current,
                          simultaneity: key,
                        }))
                      }
                      testID={`rooms-admin-filter-simultaneity-${key}`}
                    >
                      <Text
                        style={[
                          styles.filterChipLabel,
                          draftFilters.simultaneity === key &&
                            styles.filterChipLabelActive,
                        ]}
                      >
                        {t(`rooms.filters.simultaneity.${key}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterGroup}>
                <View style={styles.filterGroupHeaderRow}>
                  <Text style={styles.filterGroupLabel}>
                    {t("rooms.filters.availabilityLabel")}
                  </Text>
                  {draftFilters.availabilityFromDate != null ? (
                    <TouchableOpacity
                      onPress={() =>
                        setDraftFilters((current) => ({
                          ...current,
                          availabilityFromDate: null,
                          availabilityToDate: null,
                          availabilityStartMinute: null,
                          availabilityEndMinute: null,
                        }))
                      }
                      testID="rooms-admin-filter-availability-clear"
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.calendarDateRow}>
                  <View style={[styles.formField, styles.calendarDateField]}>
                    <Text style={styles.formLabel}>
                      {t("rooms.filters.availabilityFromDate")}
                    </Text>
                    <DatePickerField
                      value={draftFilters.availabilityFromDate ?? ""}
                      onChange={(value) =>
                        setDraftFilters((current) => ({
                          ...current,
                          availabilityFromDate: value,
                        }))
                      }
                      testID="rooms-admin-filter-availability-from-date"
                    />
                  </View>
                  <View style={[styles.formField, styles.calendarDateField]}>
                    <Text style={styles.formLabel}>
                      {t("rooms.filters.availabilityToDate")}
                    </Text>
                    <DatePickerField
                      value={
                        draftFilters.availabilityToDate ??
                        draftFilters.availabilityFromDate ??
                        ""
                      }
                      onChange={(value) =>
                        setDraftFilters((current) => ({
                          ...current,
                          availabilityToDate: value,
                        }))
                      }
                      testID="rooms-admin-filter-availability-to-date"
                    />
                  </View>
                </View>
                <View style={styles.calendarDateRow}>
                  <View style={[styles.formField, styles.calendarDateField]}>
                    <Text style={styles.formLabel}>
                      {t("rooms.filters.availabilityStartTime")}
                    </Text>
                    <TimePickerField
                      value={
                        draftFilters.availabilityStartMinute != null
                          ? minuteToTimeLabel(
                              draftFilters.availabilityStartMinute,
                            )
                          : ""
                      }
                      onChange={(value) =>
                        setDraftFilters((current) => ({
                          ...current,
                          availabilityStartMinute: timeLabelToMinute(value),
                        }))
                      }
                      placeholder="00:00"
                      testID="rooms-admin-filter-availability-start-time"
                    />
                  </View>
                  <View style={[styles.formField, styles.calendarDateField]}>
                    <Text style={styles.formLabel}>
                      {t("rooms.filters.availabilityEndTime")}
                    </Text>
                    <TimePickerField
                      value={
                        draftFilters.availabilityEndMinute != null
                          ? minuteToTimeLabel(
                              draftFilters.availabilityEndMinute,
                            )
                          : ""
                      }
                      onChange={(value) =>
                        setDraftFilters((current) => ({
                          ...current,
                          availabilityEndMinute: timeLabelToMinute(value),
                        }))
                      }
                      placeholder="23:59"
                      testID="rooms-admin-filter-availability-end-time"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
            {showFilterScrollHint ? (
              <View
                style={styles.filterScrollHint}
                pointerEvents="none"
                testID="rooms-admin-filter-scroll-hint"
              >
                <View style={styles.filterScrollHintFade} />
                <Ionicons
                  name="chevron-down"
                  size={16}
                  color={colors.accentTeal}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.filterActionsRow}>
            <TouchableOpacity
              style={styles.filterActionReset}
              onPress={resetFilters}
              testID="rooms-admin-filter-reset"
            >
              <Text style={styles.filterActionResetLabel}>
                {t("rooms.filters.reset")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionClose}
              onPress={closeFilters}
              testID="rooms-admin-filter-close"
            >
              <Text style={styles.filterActionCloseLabel}>
                {t("rooms.filters.close")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterActionApply}
              onPress={applyFilters}
              testID="rooms-admin-filter-apply"
            >
              <Ionicons name="checkmark" size={15} color={colors.white} />
              <Text style={styles.filterActionApplyLabel}>
                {t("rooms.filters.apply")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : tab === "list" ? (
        isLoading && rooms.length === 0 ? (
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
            <InfiniteScrollList
              data={rooms}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/(home)/salles/[roomId]",
                      params: { roomId: item.id },
                    })
                  }
                  testID={`rooms-admin-room-row-${item.id}`}
                >
                  <View
                    style={[
                      styles.entityRow,
                      {
                        backgroundColor:
                          index % 2 === 0 ? "#FFF9F3" : "#FFF2E4",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.entityAccent,
                        {
                          backgroundColor:
                            item.status === "AVAILABLE"
                              ? "#D89B5B"
                              : colors.notification,
                        },
                      ]}
                      testID={`rooms-admin-room-accent-${item.id}`}
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
                        onPress={() => setMenuTarget(item)}
                        testID={`rooms-admin-room-menu-${item.id}`}
                      >
                        <Ionicons
                          name="ellipsis-vertical"
                          size={18}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              onRefresh={handleListRefresh}
              refreshing={isRefreshing}
              onLoadMore={handleLoadMoreRooms}
              hasMore={
                listMeta
                  ? listMeta.page <
                    Math.max(1, Math.ceil(listMeta.total / listMeta.limit))
                  : false
              }
              isLoadingMore={isLoadingMore}
              testID="rooms-admin-list"
              contentContainerStyle={styles.listContent}
              emptyComponent={
                <View style={styles.emptyListWrap}>
                  <EmptyState
                    icon="business-outline"
                    title={t("rooms.empty.title")}
                    message={
                      appliedSearch || hasActiveRoomFilters(appliedFilters)
                        ? t("rooms.empty.messageSearch")
                        : t("rooms.empty.messageDefault")
                    }
                  />
                </View>
              }
            />
          </View>
        )
      ) : null}

      {/* ── Tabs calendrier / aide ──────────────────────────────────────────── */}
      {tab === "calendar" || tab === "help" ? (
        <View style={styles.content}>
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
                  <InlineSelectDropDown
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
                    void handleListRefresh();
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
                  Le nombre de créneaux simultanés permet de partager une salle
                  entre plusieurs classes (ex. gymnase).
                </Text>
              </SectionCard>
            </ScrollView>
          ) : null}
        </View>
      ) : null}

      {tab === "list" && !filtersOpen ? (
        <TouchableOpacity
          style={styles.fab}
          onPress={openFab}
          testID="rooms-admin-fab"
        >
          <Ionicons name="add" size={26} color={colors.white} />
        </TouchableOpacity>
      ) : null}

      <Modal
        transparent
        visible={menuTarget != null}
        animationType="fade"
        onRequestClose={() => setMenuTarget(null)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuTarget(null)}>
          <View style={styles.rowMenuBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.rowMenuPanel}>
                <Text style={styles.rowMenuTitle}>{menuTarget?.name}</Text>
                <TouchableOpacity
                  style={styles.rowMenuItem}
                  onPress={() => {
                    if (!menuTarget) return;
                    setFormContext({
                      type: "edit-room",
                      originTab: "list",
                      item: menuTarget,
                    });
                    setTab("forms");
                    setMenuTarget(null);
                  }}
                  testID={
                    menuTarget
                      ? `rooms-admin-room-menu-edit-${menuTarget.id}`
                      : undefined
                  }
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.rowMenuItemLabel}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rowMenuItem}
                  onPress={() => {
                    if (!menuTarget) return;
                    setDeleteTarget(menuTarget);
                    setMenuTarget(null);
                  }}
                  testID={
                    menuTarget
                      ? `rooms-admin-room-menu-delete-${menuTarget.id}`
                      : undefined
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={colors.notification}
                  />
                  <Text style={styles.rowMenuItemLabelDanger}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
  listContent: {
    paddingBottom: 108,
    gap: 8,
  },
  emptyListWrap: {
    paddingTop: 36,
  },
  // ── Recherche + filtres (pattern improve-mobile-search) ────────────────
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  filterToggle: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}55`,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterToggleActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterToggleBadgeAnchor: {
    position: "absolute",
    top: -6,
    right: -6,
  },
  filterPanel: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${colors.accentTeal}33`,
    backgroundColor: colors.surface,
    gap: 14,
  },
  filterScrollWrapper: {
    flex: 1,
    position: "relative",
  },
  filterScrollArea: {
    flex: 1,
  },
  filterScrollContent: {
    gap: 14,
    paddingBottom: 12,
  },
  filterScrollHint: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  filterScrollHintFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    opacity: 0.85,
  },
  filterPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterPanelHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${colors.accentTeal}1F`,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPanelHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.accentTealDark,
  },
  filterGroup: {
    gap: 8,
  },
  filterGroupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  filterGroupLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  filterChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterChipActive: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  filterChipLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  filterChipLabelActive: {
    color: colors.white,
  },
  filterActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  filterActionReset: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    backgroundColor: colors.warmSurface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  filterActionResetLabel: {
    color: colors.warmAccent,
    fontSize: 13,
    fontWeight: "700",
  },
  filterActionClose: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  filterActionCloseLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  filterActionApply: {
    flex: 1.3,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 11,
  },
  filterActionApplyLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
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
  rowMenuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  rowMenuPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },
  rowMenuTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 4,
  },
  rowMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowMenuItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  rowMenuItemLabelDanger: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.notification,
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
