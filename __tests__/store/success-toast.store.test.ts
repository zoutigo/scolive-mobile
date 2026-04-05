import { useSuccessToastStore } from "../../src/store/success-toast.store";

describe("success-toast.store", () => {
  beforeEach(() => {
    useSuccessToastStore.getState().hide();
  });

  it("show affiche le toast avec son contenu", () => {
    useSuccessToastStore.getState().show({
      title: "Message envoyé",
      message: "Votre message a bien été envoyé.",
    });

    const state = useSuccessToastStore.getState();
    expect(state.visible).toBe(true);
    expect(state.variant).toBe("success");
    expect(state.title).toBe("Message envoyé");
    expect(state.message).toBe("Votre message a bien été envoyé.");
  });

  it("show accepte la variante error", () => {
    useSuccessToastStore.getState().show({
      variant: "error",
      title: "Envoi impossible",
      message: "Impossible d'envoyer le message. Réessayez.",
    });

    const state = useSuccessToastStore.getState();
    expect(state.visible).toBe(true);
    expect(state.variant).toBe("error");
  });

  it("hide réinitialise le toast", () => {
    useSuccessToastStore.getState().show({
      title: "Brouillon enregistré",
      message: "Votre brouillon a bien été sauvegardé.",
    });

    useSuccessToastStore.getState().hide();

    const state = useSuccessToastStore.getState();
    expect(state.visible).toBe(false);
    expect(state.variant).toBe("success");
    expect(state.title).toBe("");
    expect(state.message).toBe("");
  });
});
