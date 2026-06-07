import React from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme";

interface CredentialDisplaySheetProps {
  visible: boolean;
  onClose: () => void;
  username: string;
  temporaryPassword: string;
  title?: string;
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    try {
      const clipboard = require("expo-clipboard") as {
        setStringAsync: (nextValue: string) => Promise<void>;
      };
      await clipboard.setStringAsync(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert(
        "Copie indisponible",
        "La copie n'est pas disponible sur cette build de l'application.",
      );
    }
  }

  return (
    <View style={styles.copyRow}>
      <View style={styles.copyRowText}>
        <Text style={styles.copyRowLabel}>{label}</Text>
        <Text style={styles.copyRowValue} numberOfLines={1} selectable>
          {value}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => void handleCopy()}
        style={[styles.copyBtn, copied && styles.copyBtnDone]}
        activeOpacity={0.7}
        testID={`copy-${label.toLowerCase()}`}
      >
        <Ionicons
          name={copied ? "checkmark-outline" : "copy-outline"}
          size={16}
          color={copied ? colors.accentTeal : colors.primary}
        />
        <Text style={[styles.copyBtnText, copied && styles.copyBtnTextDone]}>
          {copied ? "Copié" : "Copier"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export function CredentialDisplaySheet({
  visible,
  onClose,
  username,
  temporaryPassword,
  title = "Accès créé",
}: CredentialDisplaySheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheet} testID="credential-display-sheet">
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark-circle"
                size={28}
                color={colors.accentTeal}
              />
            </View>
            <Text style={styles.title}>{title}</Text>
          </View>

          <View style={styles.credentials}>
            <CopyRow label="Identifiant" value={username} />
            <CopyRow label="Mot de passe" value={temporaryPassword} />
          </View>

          <View style={styles.warningBox}>
            <Ionicons name="warning-outline" size={16} color="#C06A1A" />
            <Text style={styles.warningText}>
              Ce mot de passe ne sera affiché qu'une fois. Remettez-le en mains
              propres à l'élève.
            </Text>
          </View>

          <View style={styles.noteBox}>
            <Ionicons
              name="mail-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.noteText}>
              Les parents ont été notifiés par messagerie.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
            testID="credential-close"
          >
            <Text style={styles.closeBtnText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    gap: 14,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#D0C8C0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  successIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E6F7F4",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },
  credentials: {
    gap: 10,
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warmBorder,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  copyRowText: {
    flex: 1,
    gap: 2,
  },
  copyRowLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  copyRowValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#EBF1F8",
  },
  copyBtnDone: {
    borderColor: colors.accentTeal,
    backgroundColor: "#E6F7F4",
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  copyBtnTextDone: {
    color: colors.accentTeal,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FDF3E7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F0C070",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#7A4A0A",
    lineHeight: 18,
    fontWeight: "600",
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noteText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  closeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
