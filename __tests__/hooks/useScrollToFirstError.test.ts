import React from "react";
import { renderHook } from "@testing-library/react-native";
import { useScrollToFirstError } from "../../src/hooks/useScrollToFirstError";

type Fields = "title" | "school" | "level";

describe("useScrollToFirstError", () => {
  it("ne fait rien si aucune erreur", () => {
    const { result } = renderHook(() => useScrollToFirstError<Fields>());
    const scrollTo = jest.fn();
    (result.current.scrollViewRef as React.MutableRefObject<unknown>).current =
      { scrollTo };

    result.current.focusFirstInvalidField(["title", "school", "level"], {});

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("scrolle vers le premier champ en erreur dans l'ordre du formulaire, pas dans l'ordre de l'objet errors", () => {
    const { result } = renderHook(() => useScrollToFirstError<Fields>());
    const scrollTo = jest.fn();
    (result.current.scrollViewRef as React.MutableRefObject<unknown>).current =
      { scrollTo };

    result.current.registerFieldOffset("title")({
      nativeEvent: { layout: { y: 40 } },
    } as never);
    result.current.registerFieldOffset("school")({
      nativeEvent: { layout: { y: 220 } },
    } as never);
    result.current.registerFieldOffset("level")({
      nativeEvent: { layout: { y: 400 } },
    } as never);

    // "school" est listé en premier dans l'objet errors, mais "title" doit
    // gagner car il précède dans fieldOrder (l'ordre visuel du formulaire).
    result.current.focusFirstInvalidField(["title", "school", "level"], {
      school: "required",
      title: "required",
    });

    expect(scrollTo).toHaveBeenCalledWith({ y: 28, animated: true });
  });

  it("ne descend jamais sous y=0 même si l'offset enregistré est petit", () => {
    const { result } = renderHook(() => useScrollToFirstError<Fields>());
    const scrollTo = jest.fn();
    (result.current.scrollViewRef as React.MutableRefObject<unknown>).current =
      { scrollTo };

    result.current.registerFieldOffset("title")({
      nativeEvent: { layout: { y: 4 } },
    } as never);

    result.current.focusFirstInvalidField(["title"], { title: "required" });

    expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: true });
  });

  it("appelle focus() sur le TextInput enregistré pour le premier champ en erreur", () => {
    const { result } = renderHook(() => useScrollToFirstError<Fields>());
    const focus = jest.fn();
    const titleRef = { current: { focus } } as never;

    result.current.registerFieldInputRef("title", titleRef);
    result.current.focusFirstInvalidField(["title", "school"], {
      title: "required",
    });

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("ne plante pas si le champ en erreur n'a ni offset ni ref enregistrés (champ custom non mesuré)", () => {
    const { result } = renderHook(() => useScrollToFirstError<Fields>());

    expect(() =>
      result.current.focusFirstInvalidField(["title", "school"], {
        school: "required",
      }),
    ).not.toThrow();
  });
});
