import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Icosahedron, Octahedron, Float, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { SceneWrapper } from "../SceneWrapper";

function MorphingBlob({ color = "#E5B964" }: { color?: string }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1.1, 24), []);
  const base = useMemo(() => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const arr = new Float32Array(pos.array.length);
    arr.set(pos.array as Float32Array);
    return arr;
  }, [geo]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      const x = base[ix];
      const y = base[ix + 1];
      const z = base[ix + 2];
      const n = Math.sin(x * 2 + t) * 0.08 + Math.cos(y * 2 + t * 0.7) * 0.07 + Math.sin(z * 2 + t * 0.5) * 0.06;
      const len = Math.sqrt(x * x + y * y + z * z) || 1;
      const k = 1 + n;
      pos.setXYZ(i, (x / len) * 1.1 * k, (y / len) * 1.1 * k, (z / len) * 1.1 * k);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    if (mesh.current) mesh.current.rotation.y = t * 0.15;
  });

  return (
    <mesh ref={mesh} geometry={geo} position={[0, 0, 0]}>
      <meshPhysicalMaterial
        color={color}
        roughness={0.25}
        metalness={0.3}
        clearcoat={0.8}
        transmission={0.3}
        transparent
        opacity={0.7}
        emissive={color}
        emissiveIntensity={0.15}
      />
    </mesh>
  );
}

function DriftingShapes({ color = "#E5B964" }: { color?: string }) {
  const shapes = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        pos: [
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 3,
        ] as [number, number, number],
        kind: i % 2 === 0 ? "ico" : "oct",
        scale: 0.25 + Math.random() * 0.3,
      })),
    [],
  );
  return (
    <>
      {shapes.map((s) => (
        <Float key={s.id} speed={0.8 + Math.random()} rotationIntensity={0.6} floatIntensity={0.8}>
          {s.kind === "ico" ? (
            <Icosahedron args={[s.scale, 0]} position={s.pos}>
              <meshStandardMaterial color={color} wireframe transparent opacity={0.55} />
            </Icosahedron>
          ) : (
            <Octahedron args={[s.scale, 0]} position={s.pos}>
              <meshStandardMaterial color={color} wireframe transparent opacity={0.55} />
            </Octahedron>
          )}
        </Float>
      ))}
    </>
  );
}

interface AboutSceneProps {
  className?: string;
}

export const AboutScene = ({ className = "" }: AboutSceneProps) => (
  <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
    <SceneWrapper
      cameraZ={5.5}
      scene={
        <>
          <MorphingBlob />
          <DriftingShapes />
          <Sphere args={[0.05, 8, 8]} position={[0, 0, 0]}>
            <meshBasicMaterial color="#E5B964" />
          </Sphere>
        </>
      }
      className="absolute inset-0"
    />
  </div>
);

export default AboutScene;
