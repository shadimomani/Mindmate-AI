import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Octahedron } from "@react-three/drei";
import * as THREE from "three";
import { SceneWrapper } from "../SceneWrapper";
import { FloatingOrb } from "../FloatingOrb";

function DNAHelix({ color = "#E5B964" }: { color?: string }) {
  const group = useRef<THREE.Group>(null!);
  const N = 40;
  const positions = useMemo(() => {
    const arr: { x: number; y: number; z: number; side: 0 | 1 }[] = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 4;
      const y = (i / N - 0.5) * 6;
      arr.push({ x: Math.cos(t) * 1.1, y, z: Math.sin(t) * 1.1, side: 0 });
      arr.push({ x: Math.cos(t + Math.PI) * 1.1, y, z: Math.sin(t + Math.PI) * 1.1, side: 1 });
    }
    return arr;
  }, []);

  useFrame((s) => {
    if (group.current) group.current.rotation.y = s.clock.elapsedTime * 0.12;
  });

  return (
    <group ref={group} position={[3.5, 0, -2]}>
      {positions.map((p, i) => (
        <Sphere key={i} args={[0.06, 12, 12]} position={[p.x, p.y, p.z]}>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} opacity={0.7} transparent />
        </Sphere>
      ))}
    </group>
  );
}

function AchievementBadges({ count = 5, color = "#E5B964" }: { count?: number; color?: string }) {
  const group = useRef<THREE.Group>(null!);
  useFrame((s) => {
    if (group.current) group.current.rotation.y = -s.clock.elapsedTime * 0.25;
  });
  return (
    <group ref={group}>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2;
        const r = 1.8;
        return (
          <Octahedron key={i} args={[0.14, 0]} position={[Math.cos(a) * r, Math.sin(a * 1.5) * 0.4, Math.sin(a) * r]}>
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} metalness={0.7} roughness={0.2} />
          </Octahedron>
        );
      })}
    </group>
  );
}

interface ProfileSceneProps {
  /** Hex color for personal orb */
  orbColor?: string;
  /** 0..1 progress; affects orb glow & badge count */
  progress?: number;
  className?: string;
}

export const ProfileScene = ({ orbColor = "#E5B964", progress = 0.5, className = "" }: ProfileSceneProps) => {
  const badgeCount = Math.max(3, Math.round(3 + progress * 6));
  const radius = 0.8 + progress * 0.4;
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <SceneWrapper
        cameraZ={6}
        scene={
          <>
            <FloatingOrb radius={radius} color="#1a1a1a" glowColor={orbColor} glowIntensity={0.15 + progress * 0.25} pulseSpeed={0.8} />
            <AchievementBadges count={badgeCount} color={orbColor} />
            <DNAHelix color={orbColor} />
          </>
        }
        className="absolute inset-0"
      />
    </div>
  );
};

export default ProfileScene;
