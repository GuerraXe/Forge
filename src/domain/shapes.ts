// Parametric definitions for the three demo object types: which dimensions
// each one exposes, their editable ranges, and a few preset size profiles so
// a user can get a reasonable geometry without typing raw numbers first.

export type ShapeId = "bracket" | "box" | "cylinder";

export interface DimensionField {
  id: string;
  label: string;
  /** millimeters */
  min: number;
  max: number;
  step: number;
  /** unit suffix shown in the UI */
  unit: "mm";
}

export interface SizePreset {
  id: string;
  label: string;
  /** dimension id -> value in mm */
  values: Record<string, number>;
}

export interface ShapeDefinition {
  id: ShapeId;
  name: string;
  description: string;
  loadDescription: string;
  fields: DimensionField[];
  presets: SizePreset[];
  defaultValues: Record<string, number>;
}

export const SHAPES: Record<ShapeId, ShapeDefinition> = {
  bracket: {
    id: "bracket",
    name: "Mounting Bracket",
    description: "An L-shaped bracket bolted to a wall at one end, carrying a load at the free end of its arm.",
    loadDescription: "Force applied downward at the tip of the arm (cantilever bending).",
    fields: [
      { id: "armLength", label: "Arm length", min: 40, max: 300, step: 5, unit: "mm" },
      { id: "armWidth", label: "Arm width", min: 10, max: 100, step: 5, unit: "mm" },
      { id: "thickness", label: "Thickness", min: 2, max: 20, step: 1, unit: "mm" },
      { id: "flangeHeight", label: "Mounting flange height", min: 20, max: 120, step: 5, unit: "mm" },
    ],
    presets: [
      { id: "small", label: "Small", values: { armLength: 60, armWidth: 20, thickness: 4, flangeHeight: 40 } },
      { id: "medium", label: "Medium", values: { armLength: 120, armWidth: 30, thickness: 6, flangeHeight: 60 } },
      { id: "large", label: "Large", values: { armLength: 200, armWidth: 50, thickness: 8, flangeHeight: 80 } },
    ],
    defaultValues: { armLength: 120, armWidth: 30, thickness: 6, flangeHeight: 60 },
  },
  box: {
    id: "box",
    name: "Box Enclosure",
    description: "A hollow rectangular enclosure, like a housing for electronics.",
    loadDescription: "Force applied as a point load at the center of the top panel.",
    fields: [
      { id: "length", label: "Length", min: 60, max: 400, step: 10, unit: "mm" },
      { id: "width", label: "Width", min: 40, max: 300, step: 10, unit: "mm" },
      { id: "height", label: "Height", min: 20, max: 200, step: 5, unit: "mm" },
      { id: "wallThickness", label: "Wall thickness", min: 1, max: 15, step: 1, unit: "mm" },
    ],
    presets: [
      { id: "small", label: "Small", values: { length: 100, width: 70, height: 40, wallThickness: 2 } },
      { id: "medium", label: "Medium", values: { length: 200, width: 140, height: 80, wallThickness: 3 } },
      { id: "large", label: "Large", values: { length: 320, width: 220, height: 120, wallThickness: 5 } },
    ],
    defaultValues: { length: 200, width: 140, height: 80, wallThickness: 3 },
  },
  cylinder: {
    id: "cylinder",
    name: "Cylinder / Shaft",
    description: "A solid round rod or shaft, fixed at one end like a shelf pin or standoff.",
    loadDescription: "Force applied downward at the free end (cantilever bending).",
    fields: [
      { id: "length", label: "Length", min: 40, max: 400, step: 10, unit: "mm" },
      { id: "diameter", label: "Diameter", min: 5, max: 60, step: 1, unit: "mm" },
    ],
    presets: [
      { id: "small", label: "Small", values: { length: 80, diameter: 10 } },
      { id: "medium", label: "Medium", values: { length: 150, diameter: 16 } },
      { id: "large", label: "Large", values: { length: 250, diameter: 25 } },
    ],
    defaultValues: { length: 150, diameter: 16 },
  },
};

export const SHAPE_LIST: ShapeDefinition[] = Object.values(SHAPES);
