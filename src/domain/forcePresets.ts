export interface ForcePreset {
  id: string;
  label: string;
  /** Newtons */
  newtons: number;
  description: string;
}

export const FORCE_PRESETS: ForcePreset[] = [
  { id: "light", label: "Light", newtons: 50, description: "~5 kg — a light handheld device or small shelf load" },
  { id: "moderate", label: "Moderate", newtons: 150, description: "~15 kg — typical mounted equipment" },
  { id: "heavy", label: "Heavy", newtons: 400, description: "~40 kg — heavy equipment, or a person leaning on it" },
  { id: "extreme", label: "Extreme", newtons: 800, description: "~80 kg — a worst-case shock or impact load" },
];

export const DEFAULT_FORCE_ID = "moderate";
