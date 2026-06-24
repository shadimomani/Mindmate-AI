import { SceneWrapper } from "../SceneWrapper";
import { FloatingOrb } from "../FloatingOrb";
import { GeometricRings } from "../GeometricRings";
import { ParticleField } from "../ParticleField";
import { ReactNode } from "react";

/** Full-bleed login background: orb + rings + particles, with UI children on top. */
export const LoginScene = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`relative min-h-screen ${className}`}>
    <ParticleField count={60} color="#E5B964" linkDistance={1.4} className="opacity-60" />
    <SceneWrapper
      cameraZ={5}
      fov={50}
      scene={
        <>
          <FloatingOrb radius={1.2} pulseSpeed={0.7} glowIntensity={0.22} />
          <GeometricRings baseRadius={1.9} count={3} />
        </>
      }
      className="min-h-screen"
    >
      {children}
    </SceneWrapper>
  </div>
);

export default LoginScene;
