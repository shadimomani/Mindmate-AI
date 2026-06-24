import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Float } from "@react-three/drei";
import * as THREE from "three";

interface FloatingOrbProps {
  position?: [number, number, number];
  radius?: number;
  color?: string;
  glowColor?: string;
  glowIntensity?: number;
  pulseSpeed?: number;
}

/**
 * Reusable glowing sphere with breath pulse + drei Float drift.
 * Lives inside an existing R3F Canvas.
 */
export const FloatingOrb = ({
  position = [0, 0, 0],
  radius = 1,
  color = "#1a1a1a",
  glowColor = "#E5B964",
  glowIntensity = 0.18,
  pulseSpeed = 0.9,
}: FloatingOrbProps) => {
  const shell = useRef<THREE.Mesh>(null!);
  const glow = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breathe = 1 + Math.sin(t * pulseSpeed) * 0.05;
    if (shell.current) {
      shell.current.scale.setScalar(breathe);
      shell.current.rotation.y = t * 0.15;
    }
    if (glow.current) glow.current.scale.setScalar(breathe * 1.2);
  });

  return (
    <Float position={position} speed={1} rotationIntensity={0.15} floatIntensity={0.4}>
      <Sphere ref={glow} args={[radius * 1.18, 32, 32]}>
        <meshBasicMaterial color={glowColor} transparent opacity={glowIntensity} />
      </Sphere>
      <Sphere ref={shell} args={[radius, 64, 64]}>
        <meshPhysicalMaterial
          color={color}
          transmission={0.6}
          thickness={0.6}
          roughness={0.18}
          metalness={0.1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.6}
          emissive={glowColor}
          emissiveIntensity={0.18}
        />
      </Sphere>
    </Float>
  );
};

export default FloatingOrb;
