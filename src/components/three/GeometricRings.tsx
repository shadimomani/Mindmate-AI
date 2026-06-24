import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Torus } from "@react-three/drei";
import * as THREE from "three";

interface GeometricRingsProps {
  position?: [number, number, number];
  color?: string;
  count?: number;
  baseRadius?: number;
}

/** 3 slow rotating transparent rings on different axes. */
export const GeometricRings = ({
  position = [0, 0, 0],
  color = "#E5B964",
  count = 3,
  baseRadius = 1.6,
}: GeometricRingsProps) => {
  const group = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      child.rotation.x = t * (0.1 + i * 0.05);
      child.rotation.y = t * (0.15 - i * 0.03);
    });
  });

  return (
    <group ref={group} position={position}>
      {Array.from({ length: count }).map((_, i) => (
        <Torus
          key={i}
          args={[baseRadius + i * 0.35, 0.012, 16, 128]}
          rotation={[i * 0.7, i * 1.2, 0]}
        >
          <meshBasicMaterial color={color} transparent opacity={0.35 - i * 0.07} />
        </Torus>
      ))}
    </group>
  );
};

export default GeometricRings;
