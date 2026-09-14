import React from "react";
import { Image, StyleSheet, View } from "react-native";

const DEFAULT_DEV_WEB_URL = "http://10.0.2.2:3000";
const DEFAULT_PROD_WEB_URL = "https://scolive.cm";

// Question illustrations are served as static files from the web app's
// public folder (same relative path web renders via a plain <img>), so a
// bare API base URL won't resolve them — they need the web app's origin.
function resolveImageUri(imageUrl: string): string {
  if (/^https?:\/\//.test(imageUrl)) return imageUrl;
  const configured = process.env.EXPO_PUBLIC_WEB_URL?.trim();
  const base =
    configured || (__DEV__ ? DEFAULT_DEV_WEB_URL : DEFAULT_PROD_WEB_URL);
  return `${base.replace(/\/$/, "")}${imageUrl}`;
}

export function QuestionImage({
  imageUrl,
  height = 140,
}: {
  imageUrl: string;
  height?: number;
}) {
  // React Native's Image has no built-in SVG decoder — rendering one leaves
  // a blank placeholder the size of the reserved box, which reads as a UI
  // bug. Every current training-quiz illustration is an .svg, so until a
  // native SVG renderer is safely wired in, skip it rather than show a
  // broken box; the question text/options carry the content regardless.
  if (imageUrl.toLowerCase().endsWith(".svg")) {
    return null;
  }

  const uri = resolveImageUri(imageUrl);

  return (
    <View style={[styles.container, { height }]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 10,
    borderRadius: 6,
    overflow: "hidden",
  },
});
