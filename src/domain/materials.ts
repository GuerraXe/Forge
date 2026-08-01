// Reference material properties.
// Values are representative, commonly-published figures for these material
// classes (e.g. MatWeb / ASM handbook ranges for 6061-T6 aluminum and ASTM
// A36 structural steel; typical manufacturer datasheet values for PETG
// filament). Real supplier certificates vary by batch, temper, and process —
// treat these as reasonable defaults for a preliminary estimate, not a
// substitute for a material certification.

export type MaterialId = "aluminum" | "steel" | "petg";

export interface Material {
  id: MaterialId;
  name: string;
  shortName: string;
  /** kg / m^3 */
  density: number;
  /** Young's modulus, Pa */
  elasticModulus: number;
  /** Yield strength, Pa (tensile yield for metals, tensile strength for PETG) */
  yieldStrength: number;
  /** approximate raw material cost, $ / kg */
  costPerKg: number;
  description: string;
}

export const MATERIALS: Record<MaterialId, Material> = {
  aluminum: {
    id: "aluminum",
    name: "Aluminum 6061-T6",
    shortName: "Aluminum",
    density: 2700,
    elasticModulus: 68.9e9,
    yieldStrength: 276e6,
    costPerKg: 4.5,
    description: "Lightweight structural aluminum alloy, common in brackets and enclosures.",
  },
  steel: {
    id: "steel",
    name: "Steel A36 (mild)",
    shortName: "Steel",
    density: 7850,
    elasticModulus: 200e9,
    yieldStrength: 250e6,
    costPerKg: 1.8,
    description: "General-purpose structural steel, strong and stiff but heavier.",
  },
  petg: {
    id: "petg",
    name: "PETG (3D printed)",
    shortName: "PETG",
    density: 1270,
    elasticModulus: 2.1e9,
    yieldStrength: 50e6,
    costPerKg: 28,
    description: "Common FDM 3D-printing plastic. Easy to prototype with, but soft and flexible.",
  },
};

export const MATERIAL_LIST: Material[] = Object.values(MATERIALS);
