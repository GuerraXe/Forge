import type { DesignResult, Verdict } from "../domain/physics";
import { MATERIAL_LIST, type MaterialId } from "../domain/materials";
import { FORCE_PRESETS } from "../domain/forcePresets";
import InfoTip from "./InfoTip";

interface ResultsPanelProps {
  current: DesignResult;
  alternative: DesignResult;
  altMaterialId: MaterialId;
  altForceId: string;
  onAltMaterialChange: (id: MaterialId) => void;
  onAltForceChange: (id: string) => void;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  pass: "PASS",
  warning: "WARNING",
  fail: "FAIL",
};

function formatMass(kg: number): string {
  return `${kg.toFixed(kg < 1 ? 3 : 2)} kg`;
}
function formatCost(usd: number): string {
  return `$${usd.toFixed(2)}`;
}
function formatStress(pa: number): string {
  return `${(pa / 1e6).toFixed(1)} MPa`;
}
function formatDeflection(m: number): string {
  return `${(m * 1000).toFixed(2)} mm`;
}
function formatSF(sf: number): string {
  return Number.isFinite(sf) ? `${sf.toFixed(2)}x` : "∞";
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <span className={`verdict-badge verdict-${verdict}`}>{VERDICT_LABEL[verdict]}</span>;
}

function MetricRow({
  label,
  value,
  sub,
  tip,
}: {
  label: string;
  value: string;
  sub?: string;
  tip?: string;
}) {
  return (
    <div className="metric-row">
      <span className="metric-label">
        {label}
        {tip && <InfoTip text={tip} />}
      </span>
      <span className="metric-value">
        {value}
        {sub && <span className="metric-sub"> {sub}</span>}
      </span>
    </div>
  );
}

export default function ResultsPanel({
  current,
  alternative,
  altMaterialId,
  altForceId,
  onAltMaterialChange,
  onAltForceChange,
}: ResultsPanelProps) {
  const massDelta = alternative.massKg - current.massKg;
  const costDelta = alternative.costUsd - current.costUsd;
  const sfDelta = alternative.safetyFactor - current.safetyFactor;

  return (
    <div className="panel results-panel">
      <section className="control-section">
        <div className="results-header">
          <h2>
            Current design
            <InfoTip text="Live results for the shape, dimensions, material, and force you've set in the left panel." />
          </h2>
          <VerdictBadge verdict={current.verdict} />
        </div>
        <MetricRow
          label="Estimated mass"
          value={formatMass(current.massKg)}
          tip="Part volume × material density. Volume comes from the dimensions you set on the left."
        />
        <MetricRow
          label="Estimated material cost"
          value={formatCost(current.costUsd)}
          tip="Estimated mass × the material's approximate raw cost per kg. Excludes labor, machining, or finishing."
        />
        <MetricRow
          label="Peak bending stress"
          value={formatStress(current.stressPa)}
          tip="The highest bending stress in the part under the applied force, from standard beam theory (M·c/I)."
        />
        <MetricRow
          label="Estimated deflection"
          value={formatDeflection(current.deflectionM)}
          sub={`(span/${Math.round(1 / current.deflectionRatio)})`}
          tip="How far the loaded point moves under the applied force. The (span/N) figure compares it to the part's length — smaller N means more flexible."
        />
        <MetricRow
          label="Safety factor"
          value={formatSF(current.safetyFactor)}
          tip="Material yield strength ÷ peak stress. Below 1 means the part is expected to permanently bend or break; below 2 is generally considered too tight a margin."
        />
        <ul className="reasons-list">
          {current.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="control-section compare-section">
        <h2>
          Compare with an alternative
          <InfoTip text="This box is independent from your main design. Changing 'Alternative material' or 'Alternative force' only updates the Alternative column below — it never changes your Current design or the 3D model." />
        </h2>
        <p className="hint hint-muted">
          Shape and dimensions stay the same as your current design (left panel). Pick a different
          material and/or force below to see the trade-off — this only affects the "Alternative" column,
          not your current design.
        </p>
        <div className="compare-controls">
          <label className="compare-select-label">
            <span className="compare-label-text">
              Alternative material
              <InfoTip text="Only changes the 'Alternative' column in the table below. Your current design's material is chosen in the left panel." />
            </span>
            <select value={altMaterialId} onChange={(e) => onAltMaterialChange(e.target.value as MaterialId)}>
              {MATERIAL_LIST.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.shortName}
                </option>
              ))}
            </select>
          </label>
          <label className="compare-select-label">
            <span className="compare-label-text">
              Alternative force
              <InfoTip text="Only changes the 'Alternative' column in the table below. Your current design's force is chosen in the left panel." />
            </span>
            <select value={altForceId} onChange={(e) => onAltForceChange(e.target.value)}>
              {FORCE_PRESETS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label} ({f.newtons} N)
                </option>
              ))}
            </select>
          </label>
        </div>

        <table className="compare-table">
          <thead>
            <tr>
              <th></th>
              <th>Current</th>
              <th>Alternative</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Material</td>
              <td>{current.material.shortName}</td>
              <td>{alternative.material.shortName}</td>
            </tr>
            <tr>
              <td>Force</td>
              <td>{current.forceNewtons} N</td>
              <td>{alternative.forceNewtons} N</td>
            </tr>
            <tr>
              <td>Mass</td>
              <td>{formatMass(current.massKg)}</td>
              <td>
                {formatMass(alternative.massKg)}{" "}
                <span className={massDelta <= 0 ? "delta-good" : "delta-bad"}>
                  ({massDelta >= 0 ? "+" : ""}
                  {massDelta.toFixed(2)} kg)
                </span>
              </td>
            </tr>
            <tr>
              <td>Cost</td>
              <td>{formatCost(current.costUsd)}</td>
              <td>
                {formatCost(alternative.costUsd)}{" "}
                <span className={costDelta <= 0 ? "delta-good" : "delta-bad"}>
                  ({costDelta >= 0 ? "+" : ""}${costDelta.toFixed(2)})
                </span>
              </td>
            </tr>
            <tr>
              <td>Safety factor</td>
              <td>{formatSF(current.safetyFactor)}</td>
              <td>
                {formatSF(alternative.safetyFactor)}{" "}
                <span className={sfDelta >= 0 ? "delta-good" : "delta-bad"}>
                  ({sfDelta >= 0 ? "+" : ""}
                  {Number.isFinite(sfDelta) ? sfDelta.toFixed(2) : "—"})
                </span>
              </td>
            </tr>
            <tr>
              <td>Result</td>
              <td>
                <VerdictBadge verdict={current.verdict} />
              </td>
              <td>
                <VerdictBadge verdict={alternative.verdict} />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <p className="disclaimer">
        <strong>Preliminary estimate only.</strong> These results use documented reference material
        properties and standard closed-form beam-bending formulas. They are not a finite element
        analysis, not a certified engineering calculation, and not a manufacturing quote. Always validate
        real designs with qualified engineering analysis and testing before production.
      </p>
    </div>
  );
}
