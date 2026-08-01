import {
  FEED_FILTERS_TOUR_ID,
  FEED_FILTERS_TOUR_STEPS,
  FEED_FILTERS_TOUR_TARGETS,
} from "../../src/components/feed/feed-filters-tour.config";

describe("feed-filters-tour.config", () => {
  it("a un id de tour stable", () => {
    expect(FEED_FILTERS_TOUR_ID).toBe("feed-filters");
  });

  it("expose au plus 5 étapes (contrainte du store d'onboarding)", () => {
    expect(FEED_FILTERS_TOUR_STEPS.length).toBeLessThanOrEqual(5);
    expect(FEED_FILTERS_TOUR_STEPS).toHaveLength(4);
  });

  it("cible dans l'ordre : bouton filtre, chips de type, apply, aide", () => {
    expect(FEED_FILTERS_TOUR_STEPS.map((step) => step.targetKey)).toEqual([
      FEED_FILTERS_TOUR_TARGETS.filterToggle,
      FEED_FILTERS_TOUR_TARGETS.typeChips,
      FEED_FILTERS_TOUR_TARGETS.apply,
      FEED_FILTERS_TOUR_TARGETS.helpToggle,
    ]);
  });

  it("avance au tap sur le bouton filtre et sur apply, pas sur les chips", () => {
    const [filterToggleStep, typeChipsStep, applyStep] =
      FEED_FILTERS_TOUR_STEPS;
    expect(filterToggleStep.advanceOnTargetPress).toBe(true);
    expect(typeChipsStep.advanceOnTargetPress).toBeUndefined();
    expect(applyStep.advanceOnTargetPress).toBe(true);
  });

  it("termine sur l'étape aide avec un libellé de fin dédié", () => {
    const lastStep =
      FEED_FILTERS_TOUR_STEPS[FEED_FILTERS_TOUR_STEPS.length - 1];
    expect(lastStep.targetKey).toBe(FEED_FILTERS_TOUR_TARGETS.helpToggle);
    expect(lastStep.finishLabelKey).toBe("onboardingTour.common.gotIt");
  });
});
