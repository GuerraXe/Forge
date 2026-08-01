import { SHAPE_LIST, SHAPES, type ShapeId } from "../domain/shapes";
import { MATERIAL_LIST, type MaterialId } from "../domain/materials";
import { FORCE_PRESETS } from "../domain/forcePresets";
import InfoTip from "./InfoTip";

interface ControlsPanelProps {
  shapeId: ShapeId;
  dimensionsMm: Record<string, number>;
  materialId: MaterialId;
  forceId: string;
  onShapeChange: (shapeId: ShapeId) => void;
  onDimensionChange: (fieldId: string, value: number) => void;
  onPresetSelect: (values: Record<string, number>) => void;
  onMaterialChange: (materialId: MaterialId) => void;
  onForceChange: (forceId: string) => void;
}

export default function ControlsPanel({
  shapeId,
  dimensionsMm,
  materialId,
  forceId,
  onShapeChange,
  onDimensionChange,
  onPresetSelect,
  onMaterialChange,
  onForceChange,
}: ControlsPanelProps) {
  const shape = SHAPES[shapeId];

  return (
    <div className="panel controls-panel">
      <section className="control-section">
        <h2>
          1. Object type
          <InfoTip text="Pick the basic part shape to screen. Each one uses a different, appropriate bending model under the hood." />
        </h2>
        <div className="button-grid">
          {SHAPE_LIST.map((s) => (
            <button
              key={s.id}
              className={`option-button ${s.id === shapeId ? "selected" : ""}`}
              onClick={() => onShapeChange(s.id)}
              type="button"
            >
              {s.name}
            </button>
          ))}
        </div>
        <p className="hint">{shape.description}</p>
        <p className="hint hint-muted">Load case: {shape.loadDescription}</p>
      </section>

      <section className="control-section">
        <h2>
          2. Dimensions
          <InfoTip text="Use a size preset for a quick start, or fine-tune with the sliders/number fields. These drive the 3D model, mass, and stress calculations." />
        </h2>
        <div className="button-grid">
          {shape.presets.map((preset) => (
            <button
              key={preset.id}
              className="option-button option-button-small"
              onClick={() => onPresetSelect(preset.values)}
              type="button"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="dimension-list">
          {shape.fields.map((field) => (
            <label key={field.id} className="dimension-row">
              <span className="dimension-label">
                {field.label} <span className="dimension-unit">({field.unit})</span>
              </span>
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={dimensionsMm[field.id] ?? field.min}
                onChange={(e) => onDimensionChange(field.id, Number(e.target.value))}
              />
              <input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step}
                value={dimensionsMm[field.id] ?? field.min}
                onChange={(e) => onDimensionChange(field.id, Number(e.target.value))}
                className="dimension-number"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="control-section">
        <h2>
          3. Material
          <InfoTip text="Sets the density, stiffness, and yield strength used for your current design's mass, cost, stress, and safety factor." />
        </h2>
        <div className="button-grid">
          {MATERIAL_LIST.map((m) => (
            <button
              key={m.id}
              className={`option-button ${m.id === materialId ? "selected" : ""}`}
              onClick={() => onMaterialChange(m.id)}
              type="button"
            >
              {m.shortName}
            </button>
          ))}
        </div>
        <p className="hint">{MATERIAL_LIST.find((m) => m.id === materialId)?.description}</p>
      </section>

      <section className="control-section">
        <h2>
          4. Applied force
          <InfoTip text="A representative point load applied at the loaded point (e.g. the tip of the bracket arm, or the center of the enclosure lid). Drives the stress and deflection estimates." />
        </h2>
        <div className="button-grid">
          {FORCE_PRESETS.map((f) => (
            <button
              key={f.id}
              className={`option-button ${f.id === forceId ? "selected" : ""}`}
              onClick={() => onForceChange(f.id)}
              type="button"
            >
              {f.label}
              <span className="force-value">{f.newtons} N</span>
            </button>
          ))}
        </div>
        <p className="hint">{FORCE_PRESETS.find((f) => f.id === forceId)?.description}</p>
      </section>
    </div>
  );
}
