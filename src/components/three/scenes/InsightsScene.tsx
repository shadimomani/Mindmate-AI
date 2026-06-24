import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SceneWrapper } from "../SceneWrapper";

function NeuralNet({ color = "#E5B964" }: { color?: string }) {
  const points = useRef<THREE.Points>(null!);
  const lines = useRef<THREE.LineSegments>(null!);
  const N = 28;

  const { pos, linePos, lineCount } = useMemo(() => {
    const p = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      p[i * 3] = (Math.random() - 0.5) * 6;
      p[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
      p[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    const pairs: number[] = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = p[i * 3] - p[j * 3];
        const dy = p[i * 3 + 1] - p[j * 3 + 1];
        const dz = p[i * 3 + 2] - p[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < 3.5) pairs.push(i, j);
      }
    }
    const lp = new Float32Array(pairs.length * 3);
    for (let k = 0; k < pairs.length; k++) {
      const idx = pairs[k];
      lp[k * 3] = p[idx * 3];
      lp[k * 3 + 1] = p[idx * 3 + 1];
      lp[k * 3 + 2] = p[idx * 3 + 2];
    }
    return { pos: p, linePos: lp, lineCount: pairs.length };
  }, []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (points.current) points.current.rotation.y = t * 0.05;
    if (lines.current) lines.current.rotation.y = t * 0.05;
  });

  return (
    <group position={[0, 0.5, 0]}>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={pos.length / 3} array={pos} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.08} sizeAttenuation transparent opacity={0.9} />
      </points>
      <lineSegments ref={lines}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={lineCount} array={linePos} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
}

function Terrain({ data, color = "#E5B964", onHover }: { data: number[]; color?: string; onHover?: (i: number | null) => void }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const W = Math.max(data.length, 8);
  const H = 8;
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(8, 3, W - 1, H - 1);
    return g;
  }, [W]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const pos = geom.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const col = Math.round(((x + 4) / 8) * (W - 1));
      const base = data[col] ?? 0;
      const z = base * 0.8 + Math.sin(x * 0.8 + t) * 0.08 + Math.cos(y * 0.6 + t * 0.7) * 0.06;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
  });

  return (
    <mesh
      ref={mesh}
      geometry={geom}
      position={[0, -2, -1]}
      rotation={[-Math.PI / 2.6, 0, 0]}
      onPointerMove={(e) => {
        const x = e.point.x;
        const col = Math.round(((x + 4) / 8) * (W - 1));
        onHover?.(col);
      }}
      onPointerOut={() => onHover?.(null)}
    >
      <meshStandardMaterial color={color} wireframe transparent opacity={0.45} />
    </mesh>
  );
}

interface InsightsSceneProps {
  /** Productivity series (0..1) */
  data?: number[];
  className?: string;
  onHoverPoint?: (i: number | null) => void;
}

export const InsightsScene = ({ data = [0.3, 0.5, 0.4, 0.7, 0.6, 0.8, 0.5], className = "", onHoverPoint }: InsightsSceneProps) => {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <SceneWrapper
        cameraZ={6}
        scene={
          <>
            <NeuralNet />
            <Terrain
              data={data}
              onHover={(i) => {
                setHover(i);
                onHoverPoint?.(i);
              }}
            />
          </>
        }
        className="absolute inset-0"
      />
      {hover != null && data[hover] != null && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto rounded-md bg-card/70 backdrop-blur px-3 py-1.5 text-xs text-foreground border border-border">
          Point {hover + 1}: {Math.round((data[hover] ?? 0) * 100)}%
        </div>
      )}
    </div>
  );
};

export default InsightsScene;
