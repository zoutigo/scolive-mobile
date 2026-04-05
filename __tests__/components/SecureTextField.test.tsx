import React, { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SecureTextField } from "../../src/components/SecureTextField";

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");

  return {
    Ionicons: ({ name }: { name: string }) => (
      <Text testID="secure-field-icon">{name}</Text>
    ),
  };
});

function ControlledSecureField(props: Partial<React.ComponentProps<typeof SecureTextField>>) {
  const [value, setValue] = useState(props.value?.toString() ?? "");

  return (
    <SecureTextField
      testID="secure-input"
      value={value}
      onChangeText={setValue}
      placeholder="Votre secret"
      {...props}
    />
  );
}

describe("SecureTextField", () => {
  it("masque la saisie par défaut", () => {
    render(<ControlledSecureField />);

    expect(screen.getByTestId("secure-input").props.secureTextEntry).toBe(true);
    expect(screen.getByTestId("secure-field-icon")).toHaveTextContent(
      "eye-off-outline",
    );
  });

  it("affiche puis remasque la saisie au clic sur l'icône", () => {
    render(<ControlledSecureField />);

    fireEvent.press(screen.getByTestId("secure-input-toggle-visibility"));
    expect(screen.getByTestId("secure-input").props.secureTextEntry).toBe(
      false,
    );
    expect(screen.getByTestId("secure-field-icon")).toHaveTextContent(
      "eye-outline",
    );

    fireEvent.press(screen.getByTestId("secure-input-toggle-visibility"));
    expect(screen.getByTestId("secure-input").props.secureTextEntry).toBe(true);
  });

  it("met à jour la valeur comme un champ contrôlé", () => {
    render(<ControlledSecureField />);

    fireEvent.changeText(screen.getByTestId("secure-input"), "Secret123");

    expect(screen.getByDisplayValue("Secret123")).toBeOnTheScreen();
  });

  it("expose des libellés d'accessibilité adaptés pour un PIN", () => {
    render(<ControlledSecureField variant="pin" />);

    expect(
      screen.getByTestId("secure-input-toggle-visibility").props
        .accessibilityLabel,
    ).toBe("Afficher le code PIN");

    fireEvent.press(screen.getByTestId("secure-input-toggle-visibility"));

    expect(
      screen.getByTestId("secure-input-toggle-visibility").props
        .accessibilityLabel,
    ).toBe("Masquer le code PIN");
  });

  it("accepte un testID de toggle personnalisé", () => {
    render(
      <ControlledSecureField visibilityToggleTestID="custom-visibility-toggle" />,
    );

    expect(screen.getByTestId("custom-visibility-toggle")).toBeOnTheScreen();
    expect(
      screen.queryByTestId("secure-input-toggle-visibility"),
    ).not.toBeOnTheScreen();
  });
});
