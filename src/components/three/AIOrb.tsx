import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Float } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AIOrbProps {
  size?: number;
  className?: string;
  /** Brand colors. Defaults match Mindmate gold + rich black. */
  primaryColor?: string;
  accentColor?: string;
}

function NeuralCore({ accentColor }: { accentColor: string }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const linesRef = useRef<THREE.LineSegments>(null!);

  const { positions, linePositions, lineCount } = useMemo(() => {
    const N = 36;
    const pos = new Float32Array(N * 3);
    // distribute on inner sphere
    for (let i = 0; i < N; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = 0.75;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    // connect close pairs
    const pairs: number[] = [];
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < 0.55) {
          pairs.push(i, j);
        }
      }
    }
    const lp = new Float32Array(pairs.length * 3);
    for (let k = 0; k < pairs.length; k++) {
      const idx = pairs[k];
      lp[k * 3] = pos[idx * 3];
      lp[k * 3 + 1] = pos[idx * 3 + 1];
      lp[k * 3 + 2] = pos[idx * 3 + 2];
    }
    return { positions: pos, linePositions: lp, lineCount: pairs.length };
  }, []);

  useFrame((_, dt) => {
    if (pointsRef.current) pointsRef.current.rotation.y += dt * 0.15;
    if (linesRef.current) linesRef.current.rotation.y += dt * 0.15;
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={positions.length / 3}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial color={accentColor} size={0.045} sizeAttenuation transparent opacity={0.95} />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={lineCount}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={accentColor} transparent opacity={0.35} />
      </lineSegments>
    </group>
  );
}

function Orb({ primaryColor, accentColor }: { primaryColor: string; accentColor: string }) {
  const shellRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breathe = 1 + Math.sin(t * 0.9) * 0.04;
    if (shellRef.current) {
      shellRef.current.rotation.y = t * 0.18;
      shellRef.current.rotation.x = Math.sin(t * 0.3) * 0.15;
      shellRef.current.scale.setScalar(breathe);
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(breathe * 1.18);
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.5}>
      {/* Outer glow */}
      <Sphere ref={glowRef} args={[1.15, 32, 32]}>
        <meshBasicMaterial color={accentColor} transparent opacity={0.08} />
      </Sphere>
      {/* Glass shell */}
      <Sphere ref={shellRef} args={[1, 64, 64]}>
        <meshPhysicalMaterial
          color={primaryColor}
          transmission={0.65}
          thickness={0.6}
          roughness={0.15}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.55}
          emissive={accentColor}
          emissiveIntensity={0.15}
        />
      </Sphere>
      <NeuralCore accentColor={accentColor} />
    </Float>
  );
}

export const AIOrb = ({
  size = 320,
  className = "",
  primaryColor = "#1a1a1a",
  accentColor = "#E5B964",
}: AIOrbProps) => {
  const reduced = useReducedMotion();
  return (
    <div
      className={`pointer-events-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        frameloop={reduced ? "never" : "always"}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 3]} intensity={1.2} color={accentColor} />
        <pointLight position={[-3, -2, -2]} intensity={0.6} color="#ffffff" />
        <Suspense fallback={null}>
          <Orb primaryColor={primaryColor} accentColor={accentColor} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default AIOrb;
