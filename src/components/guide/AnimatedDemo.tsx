import { motion } from "framer-motion";
import { CheckSquare, Heart, MessageCircle, Plus, Check, Send } from "lucide-react";
import { useState, useEffect } from "react";

type DemoType = "tasks" | "habits" | "chat" | "mood";

interface AnimatedDemoProps {
  type: DemoType;
}

const TaskDemo = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: "Morning workout", done: false },
    { id: 2, text: "Review project plan", done: true },
    { id: 3, text: "Team meeting", done: false },
  ]);
  const [currentCheck, setCurrentCheck] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCheck((prev) => {
        const next = (prev + 1) % 4;
        if (next > 0 && next <= 3) {
          setTasks((t) =>
            t.map((task, i) =>
              i === next - 1 ? { ...task, done: !task.done } : task
            )
          );
        }
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card/80 rounded-lg p-3 space-y-2">
      {tasks.map((task, index) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-2 p-2 bg-background/50 rounded-md"
        >
          <motion.div
            animate={{
              scale: task.done ? [1, 1.2, 1] : 1,
              backgroundColor: task.done ? "hsl(var(--accent))" : "transparent",
            }}
            className="w-5 h-5 rounded border-2 border-accent flex items-center justify-center"
          >
            {task.done && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <Check className="w-3 h-3 text-accent-foreground" />
              </motion.div>
            )}
          </motion.div>
          <span
            className={`text-xs ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}
          >
            {task.text}
          </span>
        </motion.div>
      ))}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex items-center gap-2 p-2 border-2 border-dashed border-border rounded-md"
      >
        <Plus className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Add new task...</span>
      </motion.div>
    </div>
  );
};

const HabitDemo = () => {
  const [streaks, setStreaks] = useState([3, 7, 14]);
  const days = ["M", "T", "W", "T", "F", "S", "S"];

  useEffect(() => {
    const interval = setInterval(() => {
      setStreaks((s) => s.map((streak) => (streak % 30) + 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card/80 rounded-lg p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Heart className="w-4 h-4 text-accent" />
        <span className="text-xs font-medium text-foreground">Daily Meditation</span>
        <motion.span
          key={streaks[0]}
          initial={{ scale: 1.5, color: "hsl(var(--accent))" }}
          animate={{ scale: 1, color: "hsl(var(--muted-foreground))" }}
          className="text-xs ml-auto"
        >
          🔥 {streaks[0]} days
        </motion.span>
      </div>
      <div className="flex gap-1">
        {days.map((day, i) => (
          <motion.div
            key={i}
            animate={{
              backgroundColor: i < 5 ? "hsl(var(--accent))" : "hsl(var(--muted))",
              scale: i === 4 ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="flex-1 h-6 rounded flex items-center justify-center"
          >
            <span className={`text-[10px] ${i < 5 ? "text-accent-foreground" : "text-muted-foreground"}`}>
              {day}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ChatDemo = () => {
  const conversation = [
    { role: "user", text: "How can I stay motivated?" },
    { role: "ai", text: "Start small, celebrate wins! 🎉" },
  ];
  
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => {
        if (prevIndex < conversation.length) {
          setMessages((m) => [...m, conversation[prevIndex]]);
          return prevIndex + 1;
        } else {
          setMessages([]);
          return 0;
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card/80 rounded-lg p-3 space-y-2 min-h-[100px]">
      {messages.map((msg, i) => (
        msg && (
          <motion.div
            key={`${i}-${msg.text}`}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`px-3 py-1.5 rounded-lg max-w-[80%] ${
                msg.role === "user"
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <span className="text-xs">{msg.text}</span>
            </div>
          </motion.div>
        )
      ))}
      <motion.div
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
      >
        <span className="text-xs text-muted-foreground flex-1">Type a message...</span>
        <Send className="w-3 h-3 text-muted-foreground" />
      </motion.div>
    </div>
  );
};

const MoodDemo = () => {
  const moods = ["😊", "😌", "😐", "😔", "😊"];
  const [currentMood, setCurrentMood] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMood((m) => (m + 1) % moods.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card/80 rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-2 text-center">How are you feeling?</p>
      <div className="flex justify-center gap-2">
        {["😔", "😐", "😌", "😊", "🤩"].map((emoji, i) => (
          <motion.button
            key={i}
            animate={{
              scale: moods[currentMood] === emoji ? 1.3 : 1,
              opacity: moods[currentMood] === emoji ? 1 : 0.5,
            }}
            className="text-xl p-1 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export const AnimatedDemo = ({ type }: AnimatedDemoProps) => {
  switch (type) {
    case "tasks":
      return <TaskDemo />;
    case "habits":
      return <HabitDemo />;
    case "chat":
      return <ChatDemo />;
    case "mood":
      return <MoodDemo />;
    default:
      return null;
  }
};
