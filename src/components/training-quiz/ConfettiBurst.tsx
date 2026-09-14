import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const COLORS = ["#0C5FA8", "#D89B5B", "#2FA88A", "#E4574C", "#F2C94C"];

// Deterministic piece layout (no Math.random) so the burst is reproducible
// and cheap to compute on every mount.
const PIECES = Array.from({ length: 18 }, (_, index) => ({
  left: `${(index * 37) % 100}%`,
  delay: (index % 8) * 120,
  duration: 1400 + (index % 5) * 220,
  color: COLORS[index % COLORS.length],
  rotate: (index * 53) % 360,
}));

function ConfettiPiece({
  left,
  delay,
  duration,
  color,
  rotate,
}: (typeof PIECES)[number]) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay, duration]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 160],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View
      style={[styles.pieceSlot, { left: left as `${number}%` }]}
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.piece,
          {
            backgroundColor: color,
            opacity,
            transform: [{ translateY }, { rotate: `${rotate}deg` }],
          },
        ]}
      />
    </View>
  );
}

export function ConfettiBurst() {
  return (
    <View style={styles.container} pointerEvents="none">
      {PIECES.map((piece, index) => (
        <ConfettiPiece key={index} {...piece} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  pieceSlot: {
    position: "absolute",
    top: 0,
  },
  piece: {
    width: 8,
    height: 14,
    borderRadius: 2,
  },
});
