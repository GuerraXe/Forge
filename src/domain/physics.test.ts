import { describe, expect, it } from "vitest";
import { classifyDesign, computeSection, evaluateDesign } from "./physics";
import { MATERIALS } from "./materials";
import { SHAPES } from "./shapes";

describe("computeSection", () => {
  it("computes cylinder volume against the closed-form solid-rod formula", () => {
    const dims = { length: 100, diameter: 20 }; // mm
    const section = computeSection("cylinder", dims);
    const radiusM = 0.01;
    const lengthM = 0.1;
    const expectedVolume = Math.PI * radiusM ** 2 * lengthM;
    expect(section.volume).toBeCloseTo(expectedVolume, 9);
    expect(section.span).toBeCloseTo(lengthM, 9);
  });

  it("computes bracket volume as a flat developed L-shaped plate", () => {
    const dims = { armLength: 100, armWidth: 20, thickness: 5, flangeHeight: 50 };
    const section = computeSection("bracket", dims);
    const expectedVolume = 0.005 * 0.02 * (0.1 + 0.05);
    expect(section.volume).toBeCloseTo(expectedVolume, 9);
  });

  it("computes box shell volume as outer minus inner cavity", () => {
    const dims = { length: 100, width: 80, height: 40, wallThickness: 5 };
    const section = computeSection("box", dims);
    const outer = 0.1 * 0.08 * 0.04;
    const inner = (0.1 - 0.01) * (0.08 - 0.01) * (0.04 - 0.01);
    expect(section.volume).toBeCloseTo(outer - inner, 9);
  });

  it("clamps box cavity volume at zero when walls are thicker than the box", () => {
    const dims = { length: 20, width: 20, height: 20, wallThickness: 15 };
    const section = computeSection("box", dims);
    expect(section.volume).toBeCloseTo(0.02 * 0.02 * 0.02, 9);
  });
});

describe("evaluateDesign — mass and cost", () => {
  it("matches mass = volume * density and cost = mass * cost/kg for a solid aluminum cylinder", () => {
    const dims = { length: 150, diameter: 16 };
    const result = evaluateDesign("cylinder", dims, "aluminum", 150);
    const radiusM = 0.008;
    const lengthM = 0.15;
    const expectedVolume = Math.PI * radiusM ** 2 * lengthM;
    const expectedMass = expectedVolume * MATERIALS.aluminum.density;
    expect(result.massKg).toBeCloseTo(expectedMass, 9);
    expect(result.costUsd).toBeCloseTo(expectedMass * MATERIALS.aluminum.costPerKg, 6);
  });

  it("scales mass roughly with density when swapping material at fixed geometry", () => {
    const dims = SHAPES.box.defaultValues;
    const aluminumResult = evaluateDesign("box", dims, "aluminum", 150);
    const steelResult = evaluateDesign("box", dims, "steel", 150);
    const ratio = steelResult.massKg / aluminumResult.massKg;
    expect(ratio).toBeCloseTo(MATERIALS.steel.density / MATERIALS.aluminum.density, 6);
  });
});

describe("evaluateDesign — cantilever bracket stress/deflection", () => {
  it("matches the closed-form cantilever bending stress and tip deflection formulas", () => {
    const dims = { armLength: 100, armWidth: 20, thickness: 5, flangeHeight: 50 };
    const forceN = 100;
    const result = evaluateDesign("bracket", dims, "aluminum", forceN);

    const L = 0.1;
    const w = 0.02;
    const t = 0.005;
    const I = (w * t ** 3) / 12;
    const c = t / 2;
    const M = forceN * L;
    const expectedStress = (M * c) / I;
    const expectedDeflection = (forceN * L ** 3) / (3 * MATERIALS.aluminum.elasticModulus * I);

    expect(result.stressPa).toBeCloseTo(expectedStress, 3);
    expect(result.deflectionM).toBeCloseTo(expectedDeflection, 9);
    expect(result.safetyFactor).toBeCloseTo(MATERIALS.aluminum.yieldStrength / expectedStress, 6);
  });

  it("doubling the force doubles stress and deflection (linear elastic beam theory)", () => {
    const dims = { armLength: 120, armWidth: 30, thickness: 6, flangeHeight: 60 };
    const base = evaluateDesign("bracket", dims, "steel", 100);
    const doubled = evaluateDesign("bracket", dims, "steel", 200);
    expect(doubled.stressPa).toBeCloseTo(base.stressPa * 2, 3);
    expect(doubled.deflectionM).toBeCloseTo(base.deflectionM * 2, 9);
  });

  it("increasing thickness reduces stress and deflection for the same load", () => {
    const thin = evaluateDesign(
      "bracket",
      { armLength: 120, armWidth: 30, thickness: 4, flangeHeight: 60 },
      "aluminum",
      200,
    );
    const thick = evaluateDesign(
      "bracket",
      { armLength: 120, armWidth: 30, thickness: 10, flangeHeight: 60 },
      "aluminum",
      200,
    );
    expect(thick.stressPa).toBeLessThan(thin.stressPa);
    expect(thick.deflectionM).toBeLessThan(thin.deflectionM);
    expect(thick.safetyFactor).toBeGreaterThan(thin.safetyFactor);
  });
});

describe("evaluateDesign — box simply-supported panel", () => {
  it("matches the closed-form center-point-load simply-supported beam formulas", () => {
    const dims = { length: 200, width: 140, height: 80, wallThickness: 3 };
    const forceN = 150;
    const result = evaluateDesign("box", dims, "petg", forceN);

    const L = 0.2;
    const w = 0.14;
    const t = 0.003;
    const I = (w * t ** 3) / 12;
    const c = t / 2;
    const M = (forceN * L) / 4;
    const expectedStress = (M * c) / I;
    const expectedDeflection = (forceN * L ** 3) / (48 * MATERIALS.petg.elasticModulus * I);

    expect(result.stressPa).toBeCloseTo(expectedStress, 3);
    expect(result.deflectionM).toBeCloseTo(expectedDeflection, 9);
  });
});

describe("evaluateDesign — verdicts", () => {
  it("passes a generously sized steel bracket under a light load", () => {
    const result = evaluateDesign(
      "bracket",
      { armLength: 80, armWidth: 40, thickness: 10, flangeHeight: 60 },
      "steel",
      50,
    );
    expect(result.verdict).toBe("pass");
    expect(result.safetyFactor).toBeGreaterThanOrEqual(2);
  });

  it("fails a thin, long PETG cantilever under a heavy load", () => {
    const result = evaluateDesign(
      "cylinder",
      { length: 250, diameter: 6 },
      "petg",
      400,
    );
    expect(result.verdict).toBe("fail");
  });

  it("never returns a pass verdict when safety factor is below 1", () => {
    const result = evaluateDesign("cylinder", { length: 300, diameter: 5 }, "petg", 800);
    expect(result.safetyFactor).toBeLessThan(1);
    expect(result.verdict).toBe("fail");
  });
});

describe("classifyDesign — verdict boundary logic", () => {
  it("passes when safety factor >= 2 and deflection ratio is within span/250", () => {
    expect(classifyDesign(2, 1 / 250, 0.001).verdict).toBe("pass");
    expect(classifyDesign(5, 1 / 1000, 0.0005).verdict).toBe("pass");
  });

  it("warns when safety factor is between 1 and 2, with deflection otherwise fine", () => {
    expect(classifyDesign(1.5, 1 / 1000, 0.0005).verdict).toBe("warning");
    expect(classifyDesign(1.0001, 1 / 1000, 0.0005).verdict).toBe("warning");
  });

  it("warns when deflection ratio is between span/250 and span/100, with stress otherwise fine", () => {
    expect(classifyDesign(10, 1 / 150, 0.002).verdict).toBe("warning");
  });

  it("fails when safety factor drops below 1, regardless of deflection", () => {
    expect(classifyDesign(0.99, 1 / 1000, 0.0005).verdict).toBe("fail");
  });

  it("fails when deflection ratio exceeds span/100, regardless of safety factor", () => {
    expect(classifyDesign(10, 1 / 50, 0.01).verdict).toBe("fail");
  });

  it("takes the worse of the two verdicts when they disagree", () => {
    // Stress fails, deflection passes -> overall fail.
    expect(classifyDesign(0.5, 1 / 1000, 0.0005).verdict).toBe("fail");
    // Stress passes, deflection fails -> overall fail.
    expect(classifyDesign(5, 1 / 50, 0.01).verdict).toBe("fail");
    // Stress warns, deflection warns -> overall warning.
    expect(classifyDesign(1.5, 1 / 150, 0.002).verdict).toBe("warning");
  });
});
