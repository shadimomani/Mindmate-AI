import { ReactNode, useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ParallaxProps {
  children: ReactNode;
  /** Max pixel offset. Keep small (5–10) for subtlety. */
  strength?: number;
  className?: string;
}

/** Subtle mouse-based parallax wrapper. */
export const Parallax = ({ children, strength = 8, className = "" }: ParallaxProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      tx = -nx * strength;
      ty = -ny * strength;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
          raf = 0;
        });
      }
    };
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength, reduced]);

  return (
    <div ref={ref} className={className} style={{ transition: "transform 0.2s ease-out" }}>
      {children}
    </div>
  );
};

export default Parallax;
