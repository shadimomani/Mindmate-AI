import { Canvas } from "@react-three/fiber";
import { ReactNode, Suspense } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface SceneWrapperProps {
  /** R3F scene contents */
  scene: ReactNode;
  /** UI rendered on top of the canvas */
  children?: ReactNode;
  className?: string;
  /** Camera z position */
  cameraZ?: number;
  /** Field of view */
  fov?: number;
  /** Background tint (CSS). Canvas itself is transparent. */
  bgClassName?: string;
}

/**
 * Wraps a fullscreen R3F Canvas behind UI children.
 * Canvas is pointer-events-none and aria-hidden.
 */
export const SceneWrapper = ({
  scene,
  children,
  className = "",
  cameraZ = 6,
  fov = 55,
  bgClassName = "",
}: SceneWrapperProps) => {
  const reduced = useReducedMotion();
  return (
    <div className={`relative ${className}`}>
      <div className={`pointer-events-none absolute inset-0 -z-0 ${bgClassName}`} aria-hidden>
        <Canvas
          camera={{ position: [0, 0, cameraZ], fov }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
          frameloop={reduced ? "never" : "always"}
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[5, 5, 5]} intensity={1} color="#E5B964" />
          <pointLight position={[-5, -3, -2]} intensity={0.4} color="#ffffff" />
          <Suspense fallback={null}>{scene}</Suspense>
        </Canvas>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default SceneWrapper;
