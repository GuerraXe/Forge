import { lazy, Suspense, useMemo, useState } from "react";
import "./App.css";
import ControlsPanel from "./components/ControlsPanel";
import ResultsPanel from "./components/ResultsPanel";
import Tutorial, { shouldShowTutorialOnLoad } from "./components/Tutorial";
import { SHAPES, type ShapeId } from "./domain/shapes";
import type { MaterialId } from "./domain/materials";
import { FORCE_PRESETS, DEFAULT_FORCE_ID } from "./domain/forcePresets";
import { evaluateDesign } from "./domain/physics";

const Scene3D = lazy(() => import("./components/Scene3D"));

function forceNewtonsFor(forceId: string): number {
  return FORCE_PRESETS.find((f) => f.id === forceId)?.newtons ?? FORCE_PRESETS[0].newtons;
}

export default function App() {
  const [shapeId, setShapeId] = useState<ShapeId>("bracket");
  const [dimensionsMm, setDimensionsMm] = useState<Record<string, number>>(SHAPES.bracket.defaultValues);
  const [materialId, setMaterialId] = useState<MaterialId>("aluminum");
  const [forceId, setForceId] = useState<string>(DEFAULT_FORCE_ID);

  const [altMaterialId, setAltMaterialId] = useState<MaterialId>("steel");
  const [altForceId, setAltForceId] = useState<string>(DEFAULT_FORCE_ID);

  const [showTutorial, setShowTutorial] = useState(shouldShowTutorialOnLoad);

  const handleShapeChange = (id: ShapeId) => {
    setShapeId(id);
    setDimensionsMm(SHAPES[id].defaultValues);
  };

  const handleDimensionChange = (fieldId: string, value: number) => {
    setDimensionsMm((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handlePresetSelect = (values: Record<string, number>) => {
    setDimensionsMm(values);
  };

  const forceNewtons = forceNewtonsFor(forceId);
  const altForceNewtons = forceNewtonsFor(altForceId);

  const current = useMemo(
    () => evaluateDesign(shapeId, dimensionsMm, materialId, forceNewtons),
    [shapeId, dimensionsMm, materialId, forceNewtons],
  );

  const alternative = useMemo(
    () => evaluateDesign(shapeId, dimensionsMm, altMaterialId, altForceNewtons),
    [shapeId, dimensionsMm, altMaterialId, altForceNewtons],
  );

  return (
    <div className="app-shell">
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      <header className="app-header">
        <div className="app-header-text">
          <h1>Forge</h1>
          <p>
            Configure a product concept, apply a real-world load, and catch expensive or unsafe design
            problems before you build a physical prototype.
          </p>
        </div>
        <button className="tour-button" onClick={() => setShowTutorial(true)} type="button">
          ? Tour
        </button>
      </header>
      <main className="app-main">
        <ControlsPanel
          shapeId={shapeId}
          dimensionsMm={dimensionsMm}
          materialId={materialId}
          forceId={forceId}
          onShapeChange={handleShapeChange}
          onDimensionChange={handleDimensionChange}
          onPresetSelect={handlePresetSelect}
          onMaterialChange={setMaterialId}
          onForceChange={setForceId}
        />
        <div className="panel viewport-panel">
          <Suspense fallback={<div className="viewport-loading">Loading 3D view…</div>}>
            <Scene3D
              shapeId={shapeId}
              dimensionsMm={dimensionsMm}
              forceNewtons={forceNewtons}
              verdict={current.verdict}
            />
          </Suspense>
          <p className="viewport-hint">Drag to rotate · scroll to zoom</p>
        </div>
        <ResultsPanel
          current={current}
          alternative={alternative}
          altMaterialId={altMaterialId}
          altForceId={altForceId}
          onAltMaterialChange={setAltMaterialId}
          onAltForceChange={setAltForceId}
        />
      </main>
    </div>
  );
}
