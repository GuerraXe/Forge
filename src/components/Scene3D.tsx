import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import type { ShapeId } from "../domain/shapes";
import type { Verdict } from "../domain/physics";

// Scene units are mm/100 (so a 100mm dimension renders as 1 unit) — purely a
// display convenience, unrelated to the physics calculations which always
// work in SI units internally.
const UNIT = 1 / 100;

const VERDICT_COLOR: Record<Verdict, string> = {
  pass: "#22c55e",
  warning: "#f59e0b",
  fail: "#ef4444",
};

interface Scene3DProps {
  shapeId: ShapeId;
  dimensionsMm: Record<string, number>;
  forceNewtons: number;
  verdict: Verdict;
}

const FORCE_MIN = 50;
const FORCE_MAX = 800;
const ARROW_MIN = 0.35;
const ARROW_MAX = 1.1;

function arrowLength(forceNewtons: number): number {
  const t = (forceNewtons - FORCE_MIN) / (FORCE_MAX - FORCE_MIN);
  const clamped = Math.min(1, Math.max(0, t));
  return ARROW_MIN + clamped * (ARROW_MAX - ARROW_MIN);
}

function ForceArrow({ position, length }: { position: [number, number, number]; length: number }) {
  const shaftHeight = length * 0.75;
  const headHeight = length * 0.25;
  return (
    <group position={position}>
      <mesh position={[0, shaftHeight / 2 + headHeight, 0]}>
        <cylinderGeometry args={[0.02, 0.02, shaftHeight, 12]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <mesh position={[0, headHeight / 2, 0]}>
        <coneGeometry args={[0.06, headHeight, 16]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
    </group>
  );
}

function WallMount({ height, depth }: { height: number; depth: number }) {
  return (
    <mesh position={[-0.06, height / 2, 0]}>
      <boxGeometry args={[0.08, Math.max(height, 0.4), Math.max(depth * 1.6, 0.8)]} />
      <meshStandardMaterial color="#94a3b8" roughness={0.8} />
    </mesh>
  );
}

function BracketMesh({
  dims,
  color,
  forceNewtons,
}: {
  dims: Record<string, number>;
  color: string;
  forceNewtons: number;
}) {
  const armLength = dims.armLength * UNIT;
  const armWidth = dims.armWidth * UNIT;
  const thickness = dims.thickness * UNIT;
  const flangeHeight = dims.flangeHeight * UNIT;

  const armY = flangeHeight - thickness / 2;

  return (
    <group>
      <WallMount height={flangeHeight} depth={armWidth} />
      <mesh position={[-thickness / 2, flangeHeight / 2, 0]}>
        <boxGeometry args={[thickness, flangeHeight, armWidth]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.5} />
      </mesh>
      <mesh position={[armLength / 2, armY, 0]}>
        <boxGeometry args={[armLength, thickness, armWidth]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.5} />
      </mesh>
      <ForceArrow
        position={[armLength, armY + thickness / 2 + 0.05, 0]}
        length={arrowLength(forceNewtons)}
      />
    </group>
  );
}

function BoxMesh({
  dims,
  color,
  forceNewtons,
}: {
  dims: Record<string, number>;
  color: string;
  forceNewtons: number;
}) {
  const length = dims.length * UNIT;
  const width = dims.width * UNIT;
  const height = dims.height * UNIT;
  const wall = dims.wallThickness * UNIT;

  const innerLength = Math.max(length - 2 * wall, 0.001);
  const innerWidth = Math.max(width - 2 * wall, 0.001);
  const innerHeight = Math.max(height - 2 * wall, 0.001);

  return (
    <group position={[0, height / 2, 0]}>
      <mesh>
        <boxGeometry args={[length, height, width]} />
        <meshStandardMaterial color={color} metalness={0.15} roughness={0.6} transparent opacity={0.55} />
      </mesh>
      <mesh>
        <boxGeometry args={[innerLength, innerHeight, innerWidth]} />
        <meshStandardMaterial color="#1e293b" metalness={0.1} roughness={0.8} />
      </mesh>
      <ForceArrow position={[0, height / 2 + 0.05, 0]} length={arrowLength(forceNewtons)} />
    </group>
  );
}

function CylinderMesh({
  dims,
  color,
  forceNewtons,
}: {
  dims: Record<string, number>;
  color: string;
  forceNewtons: number;
}) {
  const length = dims.length * UNIT;
  const diameter = dims.diameter * UNIT;
  const radius = diameter / 2;

  return (
    <group>
      <WallMount height={diameter * 1.5} depth={diameter} />
      <mesh position={[length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius, radius, length, 32]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.5} />
      </mesh>
      <ForceArrow position={[length, radius + 0.05, 0]} length={arrowLength(forceNewtons)} />
    </group>
  );
}

function ShapeMesh({ shapeId, dimensionsMm, verdict, forceNewtons }: Scene3DProps) {
  const color = VERDICT_COLOR[verdict];
  switch (shapeId) {
    case "bracket":
      return <BracketMesh dims={dimensionsMm} color={color} forceNewtons={forceNewtons} />;
    case "box":
      return <BoxMesh dims={dimensionsMm} color={color} forceNewtons={forceNewtons} />;
    case "cylinder":
      return <CylinderMesh dims={dimensionsMm} color={color} forceNewtons={forceNewtons} />;
  }
}

export default function Scene3D({ shapeId, dimensionsMm, verdict, forceNewtons }: Scene3DProps) {
  return (
    <Canvas
      camera={{ position: [3.2, 2.4, 3.6], fov: 40 }}
      dpr={[1, 2]}
      style={{ width: "100%", height: "100%" }}
      frameloop="demand"
    >
      <color attach="background" args={["#0f172a"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.1} castShadow={false} />
      <directionalLight position={[-3, 2, -4]} intensity={0.35} />
      <Suspense fallback={null}>
        <ShapeMesh
          shapeId={shapeId}
          dimensionsMm={dimensionsMm}
          verdict={verdict}
          forceNewtons={forceNewtons}
        />
      </Suspense>
      <Grid
        position={[0, -0.001, 0]}
        args={[10, 10]}
        cellSize={0.25}
        cellThickness={0.5}
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#475569"
        cellColor="#334155"
        fadeDistance={12}
        infiniteGrid
      />
      <OrbitControls makeDefault minDistance={1} maxDistance={12} target={[0.5, 0.4, 0]} />
    </Canvas>
  );
}
