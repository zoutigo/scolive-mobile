import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ChildReenrollmentCard } from "../../src/components/enrollments/ChildReenrollmentCard";
import type { ChildFinanceStatus } from "../../src/types/finance.types";

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

const BASE_CHILD: ChildFinanceStatus = {
  student: {
    id: "student-1",
    firstName: "Remi",
    lastName: "Ntamack",
    dateOfBirth: "2015-04-12",
  },
  status: "READY_TO_REINSCRIBE",
  targetSchoolYearId: "sy-2026",
  targetSchoolYearLabel: "2026-2027",
  requiredAmount: 30000,
  previousClassLabel: "CE1-B",
  previousLevelLabel: "CE1",
  nextAcademicLevelLabel: "CE2",
  reinscriptionDeadline: "2099-07-15",
};

describe("ChildReenrollmentCard", () => {
  it("affiche la date de naissance et la transition de niveau", () => {
    render(
      <ChildReenrollmentCard
        item={BASE_CHILD}
        walletBalance={50000}
        submitting={false}
        onPayAndReinscribe={jest.fn()}
      />,
    );
    expect(screen.getByText(/12 avr\. 2015/)).toBeTruthy();
    expect(screen.getByText(/CE1(.|\n)*CE2/)).toBeTruthy();
  });

  it("active le CTA et n'affiche pas de message de solde insuffisant quand le wallet couvre le montant requis", () => {
    render(
      <ChildReenrollmentCard
        item={BASE_CHILD}
        walletBalance={50000}
        submitting={false}
        onPayAndReinscribe={jest.fn()}
      />,
    );
    expect(screen.queryByTestId("insufficient-balance-student-1")).toBeNull();
    expect(
      screen.getByTestId("pay-and-reinscribe-student-1"),
    ).not.toBeDisabled();
  });

  it("affiche un message de solde insuffisant en permanence, avant tout clic, quand le wallet ne couvre pas le montant requis", () => {
    const onPayAndReinscribe = jest.fn();
    render(
      <ChildReenrollmentCard
        item={BASE_CHILD}
        walletBalance={1000}
        submitting={false}
        onPayAndReinscribe={onPayAndReinscribe}
      />,
    );
    expect(screen.getByTestId("insufficient-balance-student-1")).toBeTruthy();
    const button = screen.getByTestId("pay-and-reinscribe-student-1");
    fireEvent.press(button);
    expect(onPayAndReinscribe).not.toHaveBeenCalled();
  });

  it("affiche le compte a rebours quand une deadline est definie", () => {
    render(
      <ChildReenrollmentCard
        item={BASE_CHILD}
        walletBalance={50000}
        submitting={false}
        onPayAndReinscribe={jest.fn()}
      />,
    );
    expect(screen.getByText(/jour\(s\) restant\(s\)/)).toBeTruthy();
  });

  it("indique que la deadline est depassee sans bloquer la reinscription", () => {
    const onPayAndReinscribe = jest.fn();
    render(
      <ChildReenrollmentCard
        item={{ ...BASE_CHILD, reinscriptionDeadline: "2000-01-01" }}
        walletBalance={50000}
        submitting={false}
        onPayAndReinscribe={onPayAndReinscribe}
      />,
    );
    expect(screen.getByText(/Date limite depassee/)).toBeTruthy();
    fireEvent.press(screen.getByTestId("pay-and-reinscribe-student-1"));
    expect(onPayAndReinscribe).toHaveBeenCalledWith(
      expect.objectContaining({ status: "READY_TO_REINSCRIBE" }),
    );
  });

  it("ne montre ni deadline ni CTA une fois l'enfant reinscrit, et recolore la card avec un message fournitures", () => {
    const onViewSupplies = jest.fn();
    render(
      <ChildReenrollmentCard
        item={{
          ...BASE_CHILD,
          status: "ALREADY_REINSCRIBED",
          requiredAmount: 0,
          reinscriptionDeadline: null,
        }}
        walletBalance={0}
        submitting={false}
        onPayAndReinscribe={jest.fn()}
        onViewSupplies={onViewSupplies}
      />,
    );
    expect(screen.queryByTestId("pay-and-reinscribe-student-1")).toBeNull();
    expect(screen.queryByText(/jour\(s\) restant\(s\)/)).toBeNull();
    expect(screen.getByText("Inscription confirmee !")).toBeTruthy();

    fireEvent.press(screen.getByTestId("view-supplies-student-1"));
    expect(onViewSupplies).toHaveBeenCalledTimes(1);
  });

  it("affiche un badge de confirmation et la date de rentree une fois l'enfant reinscrit", () => {
    render(
      <ChildReenrollmentCard
        item={{
          ...BASE_CHILD,
          status: "ALREADY_REINSCRIBED",
          requiredAmount: 0,
          reinscriptionDeadline: null,
          targetSchoolYearStartsAt: "2026-09-02",
        }}
        walletBalance={0}
        submitting={false}
        onPayAndReinscribe={jest.fn()}
      />,
    );
    expect(screen.getAllByText("Deja reinscrit(e)").length).toBeGreaterThan(0);
    expect(screen.getByText(/02 sept\. 2026/)).toBeTruthy();
  });

  it("affiche la date de rentree scolaire quand l'enfant est pret a etre reinscrit", () => {
    render(
      <ChildReenrollmentCard
        item={{ ...BASE_CHILD, targetSchoolYearStartsAt: "2026-09-02" }}
        walletBalance={50000}
        submitting={false}
        onPayAndReinscribe={jest.fn()}
      />,
    );
    expect(screen.getByText(/Rentree scolaire/)).toBeTruthy();
    expect(screen.getByText(/02 sept\. 2026/)).toBeTruthy();
  });

  it("ne casse pas l'affichage si aucune donnee enrichie n'est disponible (retro-compatibilite)", () => {
    render(
      <ChildReenrollmentCard
        item={{
          student: { id: "student-2", firstName: "Awa", lastName: "Sow" },
          status: "DECISION_PENDING",
        }}
        walletBalance={0}
        submitting={false}
        onPayAndReinscribe={jest.fn()}
      />,
    );
    expect(screen.getByText("Awa Sow")).toBeTruthy();
  });
});
