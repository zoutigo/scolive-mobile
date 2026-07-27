import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { colors } from "../../theme";

export type FabAction = {
  key: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  testID: string;
};

/**
 * FAB unique pour un écran : si une seule action est fournie, se comporte
 * comme un FAB classique (icône de l'action, tap direct). Dès que plusieurs
 * actions se combinent sur le même écran, elles ne s'empilent jamais en
 * plusieurs FAB superposés : un seul FAB "⋮" les regroupe et déplie un
 * petit menu d'actions au tap.
 */
export function MultiActionFab({
  actions,
  bottom,
  testID = "multi-action-fab",
}: {
  actions: FabAction[];
  bottom: number;
  testID?: string;
}) {
  const [open, setOpen] = useState(false);

  if (actions.length === 0) return null;

  if (actions.length === 1) {
    const action = actions[0];
    return (
      <TouchableOpacity
        style={[styles.fab, { bottom }]}
        onPress={action.onPress}
        testID={action.testID}
        accessibilityLabel={action.label}
        activeOpacity={0.85}
      >
        <Ionicons name={action.icon} size={26} color={colors.white} />
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.fab, { bottom }]}
        onPress={() => setOpen(true)}
        testID={testID}
        accessibilityLabel="Plus d'actions"
        activeOpacity={0.85}
      >
        <Ionicons name="ellipsis-vertical" size={22} color={colors.white} />
      </TouchableOpacity>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setOpen(false)}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <View
                style={[styles.menu, { bottom: bottom + 64 }]}
                testID={`${testID}-menu`}
              >
                {actions.map((action) => (
                  <TouchableOpacity
                    key={action.key}
                    style={styles.menuItem}
                    onPress={() => {
                      setOpen(false);
                      action.onPress();
                    }}
                    testID={action.testID}
                  >
                    <Ionicons
                      name={action.icon}
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.menuItemLabel}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  backdrop: {
    flex: 1,
  },
  menu: {
    position: "absolute",
    right: 20,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    minWidth: 220,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
