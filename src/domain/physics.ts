// Preliminary structural + cost estimation engine.
//
// Every part is reduced to a closed-form cantilever or simply-supported beam
// bending problem so the math stays transparent and auditable:
//   - Mounting bracket: cantilever beam (rectangular section), point load at the tip.
//   - Box enclosure: top panel modeled as a simply-supported beam strip, point load at center span.
//   - Cylinder: cantilever beam (solid round section), point load at the tip.
//
// These are standard Euler-Bernoulli beam formulas (bending stress = M*c/I,
// deflection from standard cantilever / simply-supported-beam cases). They
// are NOT finite element analysis and ignore stress concentrations, buckling,
// shear, fatigue, and 3D effects — appropriate for early "is this direction
// even reasonable" screening only.

import { MATERIALS, type Material, type MaterialId } from "./materials";
import type { ShapeId } from "./shapes";

export type Verdict = "pass" | "warning" | "fail";

export interface SectionProperties {
  /** material volume, m^3 */
  volume: number;
  /** second moment of area of the critical section, m^4 */
  momentOfInertia: number;
  /** distance from neutral axis to extreme fiber, m */
  extremeFiberDistance: number;
  /** bending span used for the moment/deflection formulas, m */
  span: number;
  /** bending moment at the critical section, N*m */
  bendingMoment: number;
}

export interface DesignResult {
  shapeId: ShapeId;
  materialId: MaterialId;
  material: Material;
  forceNewtons: number;
  dimensionsMm: Record<string, number>;

  volumeM3: number;
  massKg: number;
  costUsd: number;

  stressPa: number;
  deflectionM: number;
  deflectionRatio: number;
  safetyFactor: number;

  verdict: Verdict;
  reasons: string[];
}

const mmToM = (mm: number) => mm / 1000;

// Serviceability (stiffness) rule of thumb: span/250 is a commonly used
// "acceptable" deflection limit for structural members in general service;
// span/100 is used here as the "clearly too flexible" boundary. These are
// simplified thresholds for demo purposes, not a code-mandated limit.
const DEFLECTION_RATIO_PASS_LIMIT = 1 / 250;
const DEFLECTION_RATIO_FAIL_LIMIT = 1 / 100;

const SAFETY_FACTOR_PASS_LIMIT = 2;
const SAFETY_FACTOR_FAIL_LIMIT = 1;

function bracketSection(dims: Record<string, number>): SectionProperties {
  const armLength = mmToM(dims.armLength);
  const armWidth = mmToM(dims.armWidth);
  const thickness = mmToM(dims.thickness);
  const flangeHeight = mmToM(dims.flangeHeight);

  const volume = thickness * armWidth * (armLength + flangeHeight);
  const momentOfInertia = (armWidth * thickness ** 3) / 12;
  const extremeFiberDistance = thickness / 2;
  const span = armLength;

  return { volume, momentOfInertia, extremeFiberDistance, span, bendingMoment: 0 };
}

function boxSection(dims: Record<string, number>): SectionProperties {
  const length = mmToM(dims.length);
  const width = mmToM(dims.width);
  const height = mmToM(dims.height);
  const wall = mmToM(dims.wallThickness);

  const outerVolume = length * width * height;
  const innerLength = Math.max(length - 2 * wall, 0);
  const innerWidth = Math.max(width - 2 * wall, 0);
  const innerHeight = Math.max(height - 2 * wall, 0);
  const innerVolume = innerLength * innerWidth * innerHeight;
  const volume = Math.max(outerVolume - innerVolume, 0);

  // Top panel treated as a simply-supported beam strip spanning `length`.
  const momentOfInertia = (width * wall ** 3) / 12;
  const extremeFiberDistance = wall / 2;
  const span = length;

  return { volume, momentOfInertia, extremeFiberDistance, span, bendingMoment: 0 };
}

function cylinderSection(dims: Record<string, number>): SectionProperties {
  const length = mmToM(dims.length);
  const diameter = mmToM(dims.diameter);
  const radius = diameter / 2;

  const volume = Math.PI * radius ** 2 * length;
  const momentOfInertia = (Math.PI * diameter ** 4) / 64;
  const extremeFiberDistance = radius;
  const span = length;

  return { volume, momentOfInertia, extremeFiberDistance, span, bendingMoment: 0 };
}

export function computeSection(shapeId: ShapeId, dimensionsMm: Record<string, number>): SectionProperties {
  switch (shapeId) {
    case "bracket":
      return bracketSection(dimensionsMm);
    case "box":
      return boxSection(dimensionsMm);
    case "cylinder":
      return cylinderSection(dimensionsMm);
  }
}

export function evaluateDesign(
  shapeId: ShapeId,
  dimensionsMm: Record<string, number>,
  materialId: MaterialId,
  forceNewtons: number,
): DesignResult {
  const material = MATERIALS[materialId];
  const section = computeSection(shapeId, dimensionsMm);

  const massKg = section.volume * material.density;
  const costUsd = massKg * material.costPerKg;

  let stressPa: number;
  let deflectionM: number;

  if (shapeId === "box") {
    // Simply-supported beam strip, center point load.
    const bendingMoment = (forceNewtons * section.span) / 4;
    stressPa = (bendingMoment * section.extremeFiberDistance) / section.momentOfInertia;
    deflectionM =
      (forceNewtons * section.span ** 3) / (48 * material.elasticModulus * section.momentOfInertia);
  } else {
    // Cantilever, tip point load.
    const bendingMoment = forceNewtons * section.span;
    stressPa = (bendingMoment * section.extremeFiberDistance) / section.momentOfInertia;
    deflectionM =
      (forceNewtons * section.span ** 3) / (3 * material.elasticModulus * section.momentOfInertia);
  }

  const safetyFactor = stressPa > 0 ? material.yieldStrength / stressPa : Infinity;
  const deflectionRatio = deflectionM / section.span;

  const { verdict, reasons } = classifyDesign(safetyFactor, deflectionRatio, deflectionM);

  return {
    shapeId,
    materialId,
    material,
    forceNewtons,
    dimensionsMm,
    volumeM3: section.volume,
    massKg,
    costUsd,
    stressPa,
    deflectionM,
    deflectionRatio,
    safetyFactor,
    verdict,
    reasons,
  };
}

/** Pure boundary logic for the pass/warning/fail verdict, isolated so it can be unit tested directly. */
export function classifyDesign(
  safetyFactor: number,
  deflectionRatio: number,
  deflectionM: number,
): { verdict: Verdict; reasons: string[] } {
  const reasons: string[] = [];

  let stressVerdict: Verdict;
  if (safetyFactor < SAFETY_FACTOR_FAIL_LIMIT) {
    stressVerdict = "fail";
    reasons.push(
      `Bending stress exceeds the material's yield strength (safety factor ${safetyFactor.toFixed(2)}).`,
    );
  } else if (safetyFactor < SAFETY_FACTOR_PASS_LIMIT) {
    stressVerdict = "warning";
    reasons.push(`Safety factor is ${safetyFactor.toFixed(2)}, below the recommended minimum of 2.0.`);
  } else {
    stressVerdict = "pass";
  }

  let deflectionVerdict: Verdict;
  if (deflectionRatio > DEFLECTION_RATIO_FAIL_LIMIT) {
    deflectionVerdict = "fail";
    reasons.push(
      `Deflection (${(deflectionM * 1000).toFixed(2)} mm) is more than span/100 — the part will feel very flexible or may not function.`,
    );
  } else if (deflectionRatio > DEFLECTION_RATIO_PASS_LIMIT) {
    deflectionVerdict = "warning";
    reasons.push(
      `Deflection (${(deflectionM * 1000).toFixed(2)} mm) exceeds the span/250 stiffness guideline.`,
    );
  } else {
    deflectionVerdict = "pass";
  }

  const verdict = worstVerdict(stressVerdict, deflectionVerdict);
  if (verdict === "pass") {
    reasons.push("Stress and deflection are both within comfortable margins for this preliminary estimate.");
  }

  return { verdict, reasons };
}

function verdictRank(v: Verdict): number {
  return v === "fail" ? 2 : v === "warning" ? 1 : 0;
}

function worstVerdict(a: Verdict, b: Verdict): Verdict {
  return verdictRank(a) >= verdictRank(b) ? a : b;
}
