import { motion } from "framer-motion";
import { LucideIcon, Play } from "lucide-react";
import { useState } from "react";
import { AnimatedDemo } from "./AnimatedDemo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FeatureShowcaseProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tips: string[];
  demoType?: "tasks" | "habits" | "chat" | "mood";
  index: number;
}

export const FeatureShowcase = ({
  icon: Icon,
  title,
  description,
  tips,
  demoType,
  index,
}: FeatureShowcaseProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="bg-card border-border hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
            <motion.div
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotate: isHovered ? 5 : 0,
              }}
              transition={{ type: "spring", stiffness: 400 }}
              className="p-2 bg-accent/20 rounded-lg"
            >
              <Icon className="w-5 h-5 text-accent" />
            </motion.div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Animated Demo Section */}
          {demoType && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-lg overflow-hidden border border-border/50 bg-muted/30"
            >
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Play className="w-3 h-3 text-accent" />
                  </motion.div>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    Live Demo
                  </span>
                </div>
                <AnimatedDemo type={demoType} />
              </div>
            </motion.div>
          )}

          <p className="text-sm text-muted-foreground">{description}</p>
          
          <ul className="space-y-2">
            {tips.map((tip, tipIndex) => (
              <motion.li
                key={tipIndex}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + tipIndex * 0.1 }}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <motion.span
                  animate={{ scale: isHovered ? [1, 1.3, 1] : 1 }}
                  transition={{ delay: tipIndex * 0.1 }}
                  className="text-accent mt-0.5"
                >
                  ✓
                </motion.span>
                {tip}
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};
