import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";
import {
  DISCIPLINE_TYPE_CONFIG,
  type StudentLifeEvent,
} from "../../types/discipline.types";

interface Props {
  event: StudentLifeEvent | null;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DisciplineDeleteDialog({
  event,
  isDeleting = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!event) return null;

  const cfg = DISCIPLINE_TYPE_CONFIG[event.type];
  const label = `${cfg.label} — ${event.reason.length > 50 ? event.reason.slice(0, 47) + "…" : event.reason}`;

  return (
    <Modal
      visible={Boolean(event)}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID="delete-dialog"
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Icône */}
          <View style={styles.iconWrap}>
            <Ionicons
              name="trash-outline"
              size={28}
              color={colors.notification}
            />
          </View>

          {/* Titre */}
          <Text style={styles.title}>Supprimer cet événement ?</Text>

          {/* Description */}
          <Text style={styles.body}>
            Cette action est irréversible.{"\n"}
            <Text style={styles.eventLabel}>{label}</Text>
            {"\n"}sera supprimé définitivement.
          </Text>

          {/* Boutons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={isDeleting}
              testID="delete-dialog-cancel"
            >
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, isDeleting && styles.confirmDisabled]}
              onPress={onConfirm}
              disabled={isDeleting}
              testID="delete-dialog-confirm"
              accessibilityLabel="Confirmer la suppression"
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons
                    name="trash-outline"
                    size={16}
                    color={colors.white}
                  />
                  <Text style={styles.confirmText}>Supprimer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
  },
  eventLabel: {
    fontWeight: "600",
    color: colors.textPrimary,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    backgroundColor: colors.notification,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDisabled: { opacity: 0.6 },
  confirmText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
});
