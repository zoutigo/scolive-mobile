/**
 * Tests du composant TicketStatusBadge.
 * Unitaires : rendu, libellés, couleurs par statut
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { TicketStatusBadge } from "../../src/components/tickets/TicketStatusBadge";
import type { TicketStatus } from "../../src/types/tickets.types";

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: "Ouvert",
  IN_PROGRESS: "En cours",
  ANSWERED: "Répondu",
  RESOLVED: "Résolu",
  CLOSED: "Fermé",
};

describe("TicketStatusBadge", () => {
  describe("Rendu des libellés", () => {
    it.each(Object.entries(STATUS_LABELS))(
      "affiche le libellé '%s' pour le statut %s",
      (status, label) => {
        render(
          <TicketStatusBadge status={status as TicketStatus} testID="badge" />,
        );
        expect(screen.getByTestId("badge")).toBeTruthy();
        expect(screen.getByText(label)).toBeTruthy();
      },
    );
  });

  describe("testID personnalisé", () => {
    it("utilise le testID par défaut", () => {
      render(<TicketStatusBadge status="OPEN" />);
      expect(screen.getByTestId("ticket-status-badge")).toBeTruthy();
    });

    it("utilise le testID fourni", () => {
      render(<TicketStatusBadge status="RESOLVED" testID="custom-badge" />);
      expect(screen.getByTestId("custom-badge")).toBeTruthy();
    });
  });
});
