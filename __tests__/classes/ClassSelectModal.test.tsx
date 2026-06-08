import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ClassSelectModal } from "../../src/components/classes/ClassSelectModal";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const classes = [
  {
    classId: "class-1",
    className: "6e A",
    schoolYearId: "sy-1",
    schoolYearLabel: "2025-2026",
    subjects: [],
    studentCount: 28,
  },
  {
    classId: "class-2",
    className: "5e B",
    schoolYearId: "sy-1",
    schoolYearLabel: "2025-2026",
    subjects: [],
    studentCount: 30,
  },
  {
    classId: "class-3",
    className: "4e C",
    schoolYearId: "sy-1",
    schoolYearLabel: "2025-2026",
    subjects: [],
    studentCount: 0,
  },
];

const mockOnSelect = jest.fn();
const mockOnDismiss = jest.fn();

function renderModal(visible = true) {
  return render(
    <ClassSelectModal
      visible={visible}
      classes={classes}
      onSelect={mockOnSelect}
      onDismiss={mockOnDismiss}
    />,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ClassSelectModal", () => {
  it("affiche le titre et la liste des classes quand visible=true", () => {
    renderModal(true);
    expect(screen.getByTestId("class-select-title")).toBeTruthy();
    expect(screen.getByText("6e A")).toBeTruthy();
    expect(screen.getByText("5e B")).toBeTruthy();
    expect(screen.getByText("4e C")).toBeTruthy();
  });

  it("affiche le nombre d'élèves pour les classes non vides", () => {
    renderModal(true);
    expect(screen.getByText("28 élèves")).toBeTruthy();
    expect(screen.getByText("30 élèves")).toBeTruthy();
  });

  it("n'affiche pas le nombre d'élèves si studentCount = 0", () => {
    renderModal(true);
    expect(screen.queryByText("0 élèves")).toBeNull();
    expect(screen.queryByText("0 élève")).toBeNull();
  });

  it("affiche 'élève' au singulier pour 1 élève", () => {
    render(
      <ClassSelectModal
        visible
        classes={[
          {
            classId: "c-solo",
            className: "Terminale Solo",
            schoolYearId: "sy-1",
            schoolYearLabel: "2025-2026",
            subjects: [],
            studentCount: 1,
          },
        ]}
        onSelect={mockOnSelect}
        onDismiss={mockOnDismiss}
      />,
    );
    expect(screen.getByText("1 élève")).toBeTruthy();
  });

  it("appelle onSelect avec le bon classId au clic sur un item", () => {
    renderModal(true);
    fireEvent.press(screen.getByTestId("class-select-item-class-2"));
    expect(mockOnSelect).toHaveBeenCalledWith("class-2", "5e B");
  });

  it("appelle onDismiss au clic sur le bouton fermer", () => {
    renderModal(true);
    fireEvent.press(screen.getByTestId("class-select-close"));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it("filtre les classes selon la recherche", () => {
    renderModal(true);
    fireEvent.changeText(screen.getByTestId("class-select-search"), "5e");
    expect(screen.queryByText("6e A")).toBeNull();
    expect(screen.getByText("5e B")).toBeTruthy();
    expect(screen.queryByText("4e C")).toBeNull();
  });

  it("affiche 'Aucune classe trouvée' quand la recherche ne correspond à rien", () => {
    renderModal(true);
    fireEvent.changeText(screen.getByTestId("class-select-search"), "XXXXX");
    expect(screen.getByText("Aucune classe trouvée")).toBeTruthy();
  });

  it("réinitialise la recherche et appelle onDismiss au fermeture", () => {
    renderModal(true);
    fireEvent.changeText(screen.getByTestId("class-select-search"), "6e");
    fireEvent.press(screen.getByTestId("class-select-close"));
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it("restitue toutes les classes après effacement de la recherche", () => {
    renderModal(true);
    const search = screen.getByTestId("class-select-search");
    fireEvent.changeText(search, "6e");
    expect(screen.queryByText("5e B")).toBeNull();
    fireEvent.changeText(search, "");
    expect(screen.getByText("5e B")).toBeTruthy();
  });
});
