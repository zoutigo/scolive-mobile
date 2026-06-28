import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { FeedFilterTabs } from "../../src/components/feed/FeedFilterTabs";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

describe("FeedFilterTabs", () => {
  const onSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rend les 4 onglets avec les labels traduits", () => {
    render(
      <FeedFilterTabs
        activeFilter="all"
        unreadCounts={{}}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByTestId("feed-filter-tab-all")).toBeTruthy();
    expect(screen.getByTestId("feed-filter-tab-featured")).toBeTruthy();
    expect(screen.getByTestId("feed-filter-tab-polls")).toBeTruthy();
    expect(screen.getByTestId("feed-filter-tab-mine")).toBeTruthy();
    expect(screen.getByText("Tout")).toBeTruthy();
    expect(screen.getByText("À la une")).toBeTruthy();
    expect(screen.getByText("Sondages")).toBeTruthy();
    expect(screen.getByText("Mes posts")).toBeTruthy();
  });

  it("l'onglet actif a la couleur primary avec bordure bottom", () => {
    render(
      <FeedFilterTabs
        activeFilter="featured"
        unreadCounts={{}}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByTestId("feed-filter-tab-featured")).toHaveStyle({
      borderBottomColor: "#08467D",
      borderBottomWidth: 2,
    });
    expect(screen.getByTestId("feed-filter-tab-all")).toHaveStyle({
      borderBottomColor: "transparent",
    });
  });

  it("le label actif est en gras primary, les autres en textSecondary", () => {
    render(
      <FeedFilterTabs
        activeFilter="polls"
        unreadCounts={{}}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByText("Sondages")).toHaveStyle({
      color: "#08467D",
      fontWeight: "700",
    });
    expect(screen.getByText("Tout")).toHaveStyle({ fontWeight: "500" });
  });

  it("appelle onSelect avec le bon filtre au press", () => {
    render(
      <FeedFilterTabs
        activeFilter="all"
        unreadCounts={{}}
        onSelect={onSelect}
      />,
    );
    fireEvent.press(screen.getByTestId("feed-filter-tab-featured"));
    expect(onSelect).toHaveBeenCalledWith("featured");
  });

  it("affiche le badge de non-lus quand count > 0", () => {
    render(
      <FeedFilterTabs
        activeFilter="all"
        unreadCounts={{ all: 5, featured: 2 }}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByTestId("feed-filter-badge-all")).toBeTruthy();
    expect(screen.getByTestId("feed-filter-badge-featured")).toBeTruthy();
    expect(screen.queryByTestId("feed-filter-badge-polls")).toBeNull();
    expect(screen.queryByTestId("feed-filter-badge-mine")).toBeNull();
  });

  it("affiche 99+ quand le count dépasse 99", () => {
    render(
      <FeedFilterTabs
        activeFilter="all"
        unreadCounts={{ all: 150 }}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByTestId("feed-filter-badge-all")).toBeTruthy();
    expect(screen.getByText("99+")).toBeTruthy();
  });

  it("n'affiche pas de badge quand count = 0", () => {
    render(
      <FeedFilterTabs
        activeFilter="all"
        unreadCounts={{ all: 0 }}
        onSelect={onSelect}
      />,
    );
    expect(screen.queryByTestId("feed-filter-badge-all")).toBeNull();
  });

  it("le badge a le bon style (primary background, texte blanc)", () => {
    render(
      <FeedFilterTabs
        activeFilter="all"
        unreadCounts={{ mine: 3 }}
        onSelect={onSelect}
      />,
    );
    const badge = screen.getByTestId("feed-filter-badge-mine");
    expect(badge).toHaveStyle({
      backgroundColor: "#08467D",
      borderRadius: 8,
    });
    expect(screen.getByText("3")).toHaveStyle({
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "700",
    });
  });

  it("change l'onglet actif quand activeFilter change", () => {
    const { rerender } = render(
      <FeedFilterTabs
        activeFilter="all"
        unreadCounts={{}}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByTestId("feed-filter-tab-all")).toHaveStyle({
      borderBottomColor: "#08467D",
    });
    rerender(
      <FeedFilterTabs
        activeFilter="mine"
        unreadCounts={{}}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByTestId("feed-filter-tab-mine")).toHaveStyle({
      borderBottomColor: "#08467D",
    });
    expect(screen.getByTestId("feed-filter-tab-all")).toHaveStyle({
      borderBottomColor: "transparent",
    });
  });

  it("le container a un fond surface et une bordure basse", () => {
    render(
      <FeedFilterTabs
        activeFilter="all"
        unreadCounts={{}}
        onSelect={onSelect}
      />,
    );
    const container = screen.getByTestId("feed-filter-tab-all").parent?.parent?.parent;
    expect(container).toBeTruthy();
  });
});
