const insets = { top: 0, right: 0, bottom: 0, left: 0 };

module.exports = {
  useSafeAreaInsets: () => insets,
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  SafeAreaConsumer: ({ children }) => children(insets),
};
