import React from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import {
  InfiniteScrollList,
  canTriggerInfiniteScroll,
} from "../../src/components/lists/InfiniteScrollList";

const items = [
  { id: "1", label: "Premier" },
  { id: "2", label: "Second" },
];

describe("canTriggerInfiniteScroll()", () => {
  it("retourne true quand la liste peut charger plus", () => {
    expect(
      canTriggerInfiniteScroll({
        itemCount: 2,
        hasMore: true,
        isLoadingMore: false,
        blockedByMomentum: false,
      }),
    ).toBe(true);
  });

  it("retourne false sans éléments", () => {
    expect(
      canTriggerInfiniteScroll({
        itemCount: 0,
        hasMore: true,
        isLoadingMore: false,
        blockedByMomentum: false,
      }),
    ).toBe(false);
  });

  it("retourne false si un chargement est déjà en cours", () => {
    expect(
      canTriggerInfiniteScroll({
        itemCount: 2,
        hasMore: true,
        isLoadingMore: true,
        blockedByMomentum: false,
      }),
    ).toBe(false);
  });
});

describe("InfiniteScrollList", () => {
  it("rend les éléments fournis", () => {
    render(
      <InfiniteScrollList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
      />,
    );

    expect(screen.getByText("Premier")).toBeTruthy();
    expect(screen.getByText("Second")).toBeTruthy();
  });

  it("déclenche onLoadMore au reach de fin de liste", () => {
    const onLoadMore = jest.fn();

    render(
      <InfiniteScrollList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        hasMore
        onLoadMore={onLoadMore}
        testID="test-infinite-list"
      />,
    );

    fireEvent(screen.getByTestId("test-infinite-list"), "onEndReached", {
      distanceFromEnd: 20,
    });

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("ne redéclenche pas onLoadMore tant que le momentum n'est pas réinitialisé", () => {
    const onLoadMore = jest.fn();

    render(
      <InfiniteScrollList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        hasMore
        onLoadMore={onLoadMore}
        testID="test-infinite-list"
      />,
    );

    fireEvent(screen.getByTestId("test-infinite-list"), "onEndReached", {
      distanceFromEnd: 20,
    });
    fireEvent(screen.getByTestId("test-infinite-list"), "onEndReached", {
      distanceFromEnd: 20,
    });

    expect(onLoadMore).toHaveBeenCalledTimes(1);

    fireEvent(screen.getByTestId("test-infinite-list"), "onMomentumScrollBegin");
    fireEvent(screen.getByTestId("test-infinite-list"), "onEndReached", {
      distanceFromEnd: 20,
    });

    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it("affiche un footer de chargement pendant le load more", () => {
    render(
      <InfiniteScrollList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        hasMore
        isLoadingMore
      />,
    );

    expect(screen.getByTestId("infinite-scroll-loading-footer")).toBeTruthy();
  });

  it("affiche un footer de fin de liste quand tout est chargé", () => {
    render(
      <InfiniteScrollList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.label}</Text>}
        hasMore={false}
        endOfListLabel="Fin des messages"
      />,
    );

    expect(screen.getByTestId("infinite-scroll-end-footer")).toBeTruthy();
    expect(screen.getByText("Fin des messages")).toBeTruthy();
  });
});
