/**
 * Tests unitaires — SwipePager (composant générique de pagination swipe)
 */
import React from "react";
import { Text } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { SwipePager } from "../../src/components/SwipePager";

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  default: jest
    .fn()
    .mockReturnValue({ width: 360, height: 800, scale: 2, fontScale: 1 }),
}));

function momentumEnd(testID: string, x: number) {
  fireEvent(screen.getByTestId(testID), "momentumScrollEnd", {
    nativeEvent: { contentOffset: { x } },
  });
}

describe("SwipePager", () => {
  it("rend toutes les pages et marque la première comme active par défaut", () => {
    const renderPage = jest.fn((id: string, isActive: boolean) => (
      <Text testID={`page-${id}`}>{`${id}-${isActive}`}</Text>
    ));

    render(
      <SwipePager
        ids={["a", "b", "c"]}
        initialIndex={0}
        renderPage={renderPage}
        testID="pager"
      />,
    );

    expect(screen.getByTestId("page-a")).toHaveTextContent("a-true");
    expect(screen.getByTestId("page-b")).toHaveTextContent("b-false");
    expect(screen.getByTestId("page-c")).toHaveTextContent("c-false");
  });

  it("change la page active après un swipe (momentumScrollEnd)", () => {
    render(
      <SwipePager
        ids={["a", "b", "c"]}
        initialIndex={0}
        renderPage={(id, isActive) => (
          <Text testID={`page-${id}`}>{isActive ? "active" : "inactive"}</Text>
        )}
        testID="pager"
      />,
    );
    expect(screen.getByTestId("page-a")).toHaveTextContent("active");

    momentumEnd("pager", 360); // swipe vers l'index 1 (largeur = 360)

    expect(screen.getByTestId("page-b")).toHaveTextContent("active");
    expect(screen.getByTestId("page-a")).toHaveTextContent("inactive");
  });

  it("notifie onIndexChange avec l'index et l'id courants", () => {
    const onIndexChange = jest.fn();
    render(
      <SwipePager
        ids={["a", "b", "c"]}
        initialIndex={0}
        onIndexChange={onIndexChange}
        renderPage={(id, isActive) => (
          <Text testID={`page-${id}`}>{String(isActive)}</Text>
        )}
        testID="pager"
      />,
    );

    expect(onIndexChange).toHaveBeenCalledWith(0, "a");

    momentumEnd("pager", 720); // index 2

    expect(onIndexChange).toHaveBeenCalledWith(2, "c");
  });

  it("ne monte que les pages dans la fenêtre de rendu (renderWindow)", () => {
    const renderPage = jest.fn((id: string, isActive: boolean) => (
      <Text testID={`page-${id}`}>{String(isActive)}</Text>
    ));

    render(
      <SwipePager
        ids={["a", "b", "c", "d", "e"]}
        initialIndex={2}
        renderWindow={1}
        renderPage={renderPage}
        testID="pager"
      />,
    );

    expect(screen.queryByTestId("page-a")).toBeNull();
    expect(screen.getByTestId("page-b")).toBeTruthy();
    expect(screen.getByTestId("page-c")).toBeTruthy();
    expect(screen.getByTestId("page-d")).toBeTruthy();
    expect(screen.queryByTestId("page-e")).toBeNull();
  });

  it("monte toutes les pages par défaut (renderWindow=Infinity)", () => {
    render(
      <SwipePager
        ids={["a", "b", "c", "d", "e"]}
        initialIndex={0}
        renderPage={(id) => <Text testID={`page-${id}`}>{id}</Text>}
        testID="pager"
      />,
    );

    for (const id of ["a", "b", "c", "d", "e"]) {
      expect(screen.getByTestId(`page-${id}`)).toBeTruthy();
    }
  });
});
