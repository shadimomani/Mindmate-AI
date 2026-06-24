import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";
import { SceneWrapper } from "../SceneWrapper";
import { FloatingOrb } from "../FloatingOrb";
import { ParticleField } from "../ParticleField";

export type NodeStatus = "done" | "upcoming" | "overdue";

export interface OrbitNode {
  id: string;
  status: NodeStatus;
}

const STATUS_COLOR: Record<NodeStatus, string> = {
  done: "#10b981",
  upcoming: "#facc15",
  overdue: "#ef4444",
};

function OrbitingNodes({ nodes }: { nodes: OrbitNode[] }) {
  const group = useRef<THREE.Group>(null!);
  const angles = useMemo(
    () => nodes.map((_, i) => (i / Math.max(nodes.length, 1)) * Math.PI * 2),
    [nodes.length],
  );

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = t * 0.18;
  });

  if (nodes.length === 0) return null;

  return (
    <group ref={group}>
      {nodes.map((n, i) => {
        const r = 2.2;
        const a = angles[i];
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const y = Math.sin(a * 2) * 0.3;
        const c = STATUS_COLOR[n.status];
        return (
          <Sphere key={n.id} args={[0.12, 24, 24]} position={[x, y, z]}>
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.6} />
          </Sphere>
        );
      })}
    </group>
  );
}

interface DashboardSceneProps {
  /** 0..1 activity level → orb pulse intensity */
  activity?: number;
  nodes?: OrbitNode[];
  className?: string;
}

/** Background-only scene (no children) — drop behind dashboard UI. */
export const DashboardScene = ({ activity = 0.5, nodes = [], className = "" }: DashboardSceneProps) => {
  const pulse = 0.5 + activity * 1.2;
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden>
      <ParticleField count={45} color="#E5B964" linkDistance={1.3} className="opacity-40" />
      <SceneWrapper
        cameraZ={6}
        scene={
          <>
            <FloatingOrb radius={0.9} pulseSpeed={pulse} glowIntensity={0.15 + activity * 0.2} />
            <OrbitingNodes nodes={nodes} />
          </>
        }
        className="absolute inset-0"
      />
    </div>
  );
};

export default DashboardScene;
