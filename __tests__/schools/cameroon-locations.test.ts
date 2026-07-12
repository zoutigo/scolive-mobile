import {
  CAMEROON_CITIES_BY_REGION,
  CAMEROON_COUNTRY,
  CAMEROON_REGIONS,
} from "../../src/data/cameroon-locations";

describe("cameroon-locations", () => {
  it("exposes a single locked country option", () => {
    expect(CAMEROON_COUNTRY).toEqual({
      value: "Cameroun",
      label: "Cameroun",
    });
  });

  it("exposes exactly the 10 regions of Cameroon", () => {
    expect(CAMEROON_REGIONS).toHaveLength(10);
    const values = CAMEROON_REGIONS.map((r) => r.value);
    expect(new Set(values).size).toBe(10);
    expect(values).toEqual(
      expect.arrayContaining([
        "Adamaoua",
        "Centre",
        "Est",
        "Extrême-Nord",
        "Littoral",
        "Nord",
        "Nord-Ouest",
        "Ouest",
        "Sud",
        "Sud-Ouest",
      ]),
    );
  });

  it("provides a non-empty city list for every region", () => {
    for (const region of CAMEROON_REGIONS) {
      const cities = CAMEROON_CITIES_BY_REGION[region.value];
      expect(cities).toBeDefined();
      expect(cities.length).toBeGreaterThan(0);
    }
  });

  it("has no city list for a region key that doesn't exist", () => {
    expect(CAMEROON_CITIES_BY_REGION["Nonexistent"]).toBeUndefined();
  });

  it("has no duplicate cities within a single region", () => {
    for (const region of CAMEROON_REGIONS) {
      const cities = CAMEROON_CITIES_BY_REGION[region.value].map(
        (c) => c.value,
      );
      expect(new Set(cities).size).toBe(cities.length);
    }
  });

  it("keeps value === label for every option (display-safe)", () => {
    for (const region of CAMEROON_REGIONS) {
      expect(region.value).toBe(region.label);
      for (const city of CAMEROON_CITIES_BY_REGION[region.value]) {
        expect(city.value).toBe(city.label);
      }
    }
  });
});
