import React from "react";
import { Ionicons } from "@expo/vector-icons";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  ShieldCheck: "shield-checkmark-outline",
  Sparkles: "sparkles-outline",
  BookOpen: "book-outline",
  MessageSquare: "chatbubble-outline",
  CalendarDays: "calendar-outline",
  Wallet: "wallet-outline",
};

export function TrainingQuizIcon({
  name,
  size = 22,
  color = "#FFFFFF",
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const iconName = ICONS[name] ?? "sparkles-outline";
  return <Ionicons name={iconName} size={size} color={color} />;
}
