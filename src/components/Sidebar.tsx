import { Home, CheckSquare, Heart, MessageCircle, BarChart3, User, Brain, Image } from "lucide-react";
import { NavLink } from "react-router-dom";
import logo from "@/assets/logo-mindmate.png";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Daily Planner", href: "/planner", icon: CheckSquare },
  { name: "Habits", href: "/habits", icon: Heart },
  { name: "Reflections", href: "/reflections", icon: MessageCircle },
  { name: "Insights", href: "/insights", icon: BarChart3 },
  { name: "Photos", href: "/photos", icon: Image },
  { name: "Profile", href: "/profile", icon: User },
];

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col shadow-soft">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <img src={logo} alt="MindMate" className="w-10 h-10" />
          <h1 className="text-2xl font-serif font-bold text-foreground">MindMate</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Your AI Productivity Companion</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-base ${
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-sans">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted">
          <Brain className="w-5 h-5 text-accent" />
          <div className="flex-1">
            <p className="text-sm font-medium">AI Assistant</p>
            <p className="text-xs text-muted-foreground">Always here to help</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
