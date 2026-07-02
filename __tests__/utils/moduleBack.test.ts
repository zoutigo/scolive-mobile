import { moduleBack } from "../../src/utils/moduleBack";

// ── Utilitaire moduleBack ─────────────────────────────────────────────────────
//
// moduleBack(router) appelle router.back() quand l'historique le permet,
// et router.navigate('/') sinon (cas deep link sans historique).

function makeRouter(canGoBack: boolean) {
  return {
    canGoBack: jest.fn().mockReturnValue(canGoBack),
    back: jest.fn(),
    navigate: jest.fn(),
  };
}

describe("moduleBack — quand canGoBack() retourne true", () => {
  it("appelle back()", () => {
    const router = makeRouter(true);
    moduleBack(router);
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas navigate()", () => {
    const router = makeRouter(true);
    moduleBack(router);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("appelle canGoBack() exactement une fois", () => {
    const router = makeRouter(true);
    moduleBack(router);
    expect(router.canGoBack).toHaveBeenCalledTimes(1);
  });
});

describe("moduleBack — quand canGoBack() retourne false", () => {
  it("n'appelle pas back()", () => {
    const router = makeRouter(false);
    moduleBack(router);
    expect(router.back).not.toHaveBeenCalled();
  });

  it("appelle navigate() avec la route home '/'", () => {
    const router = makeRouter(false);
    moduleBack(router);
    expect(router.navigate).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledWith("/");
  });

  it("appelle canGoBack() exactement une fois", () => {
    const router = makeRouter(false);
    moduleBack(router);
    expect(router.canGoBack).toHaveBeenCalledTimes(1);
  });
});

describe("moduleBack — appels multiples", () => {
  it("chaque appel est indépendant", () => {
    const router = makeRouter(true);
    moduleBack(router);
    moduleBack(router);
    expect(router.back).toHaveBeenCalledTimes(2);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it("bascule correctement si canGoBack change entre les appels", () => {
    const router = {
      canGoBack: jest
        .fn()
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false),
      back: jest.fn(),
      navigate: jest.fn(),
    };
    moduleBack(router);
    moduleBack(router);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.navigate).toHaveBeenCalledTimes(1);
  });
});
