import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ParticleNetworkProps {
  /** Number of particles. Kept modest for perf. */
  count?: number;
  /** Hex color for particles and connecting lines. */
  color?: string;
  /** Max distance for drawing connecting line between two particles. */
  linkDistance?: number;
  className?: string;
}

function Particles({
  count,
  color,
  linkDistance,
}: Required<Pick<ParticleNetworkProps, "count" | "color" | "linkDistance">>) {
  const pointsRef = useRef<THREE.Points>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const { viewport } = useThree();

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const w = viewport.width;
    const h = viewport.height;
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * w * 1.2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * h * 1.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
      vel[i * 3] = (Math.random() - 0.5) * 0.04;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.04;
      vel[i * 3 + 2] = 0;
    }
    return { positions: pos, velocities: vel };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Allocate line buffer big enough for worst case.
  const maxLines = count * 6;
  const linePositions = useMemo(() => new Float32Array(maxLines * 3), [maxLines]);

  // Track mouse in NDC-ish space
  useMemo(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * viewport.width;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * viewport.height;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [viewport.width, viewport.height]);

  useFrame(() => {
    const points = pointsRef.current;
    if (!points) return;
    const geom = points.geometry as THREE.BufferGeometry;
    const pos = geom.attributes.position.array as Float32Array;

    const w = viewport.width * 0.7;
    const h = viewport.height * 0.7;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      // gentle mouse attraction
      const dx = mx - pos[ix];
      const dy = my - pos[ix + 1];
      const dist2 = dx * dx + dy * dy;
      if (dist2 < 9) {
        const f = 0.0008;
        velocities[ix] += dx * f;
        velocities[ix + 1] += dy * f;
      }

      pos[ix] += velocities[ix];
      pos[ix + 1] += velocities[ix + 1];

      // damping
      velocities[ix] *= 0.985;
      velocities[ix + 1] *= 0.985;

      // wrap-around bounds
      if (pos[ix] > w) pos[ix] = -w;
      if (pos[ix] < -w) pos[ix] = w;
      if (pos[ix + 1] > h) pos[ix + 1] = -h;
      if (pos[ix + 1] < -h) pos[ix + 1] = h;
    }
    geom.attributes.position.needsUpdate = true;

    // Build connecting lines (O(n^2), but n is small)
    let li = 0;
    const maxD2 = linkDistance * linkDistance;
    for (let i = 0; i < count; i++) {
      const ax = pos[i * 3];
      const ay = pos[i * 3 + 1];
      const az = pos[i * 3 + 2];
      for (let j = i + 1; j < count; j++) {
        const bx = pos[j * 3];
        const by = pos[j * 3 + 1];
        const ddx = ax - bx;
        const ddy = ay - by;
        const d2 = ddx * ddx + ddy * ddy;
        if (d2 < maxD2 && li < maxLines - 2) {
          linePositions[li * 3] = ax;
          linePositions[li * 3 + 1] = ay;
          linePositions[li * 3 + 2] = az;
          linePositions[li * 3 + 3] = bx;
          linePositions[li * 3 + 4] = by;
          linePositions[li * 3 + 5] = pos[j * 3 + 2];
          li += 2;
        }
      }
    }
    // zero out the rest
    for (let k = li * 3; k < linePositions.length; k++) linePositions[k] = 0;
    const lineGeom = linesRef.current.geometry as THREE.BufferGeometry;
    (lineGeom.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    lineGeom.setDrawRange(0, li);
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={0.05}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={maxLines}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.18} depthWrite={false} />
      </lineSegments>
    </>
  );
}

export const ParticleNetwork = ({
  count = 70,
  color = "#E5B964",
  linkDistance = 1.4,
  className = "",
}: ParticleNetworkProps) => {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      >
        <Suspense fallback={null}>
          <Particles count={count} color={color} linkDistance={linkDistance} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ParticleNetwork;
