import { motion } from "framer-motion";
import { TrendingUp, Target, BookOpen, Briefcase, ArrowRight, Star, Users, CheckCircle2, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface UserProfile {
  id: number;
  name: string;
  email: string;
}

interface UserSkill {
  skill_id: number;
  skill_name: string;
  level: number;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function getLevelPercent(level: number) {
  return level === 3 ? 100 : level === 2 ? 60 : 30;
}

function getLevelLabel(level: number) {
  if (level === 3) return "Advanced";
  if (level === 2) return "Intermediate";
  return "Beginner";
}

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    async function load() {
      try {
        const [profileRes, skillsRes] = await Promise.all([
          fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/skills/me`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        if (profileRes.ok) setProfile(await profileRes.json());
        if (skillsRes.ok) setUserSkills(await skillsRes.json());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const firstName = profile?.name?.split(" ")[0] || profile?.email?.split("@")[0] || "there";
  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const topSkills = [...userSkills].sort((a, b) => b.level - a.level).slice(0, 4);

  const stats = [
    { label: "Skills Added", value: String(userSkills.length), icon: Target, color: "text-primary" },
    { label: "Advanced Skills", value: String(userSkills.filter((s) => s.level === 3).length), icon: CheckCircle2, color: "text-success" },
    { label: "Job Roles", value: "4", icon: BookOpen, color: "text-accent" },
  ];

  const feedItems = [
    {
      title: "Add your skills",
      description: "Tell us what you know — add skills at beginner, intermediate, or advanced level.",
      action: "Browse Skills",
      link: "/skills",
      icon: Play,
    },
    {
      title: "Explore job matches",
      description: "See which positions match your skill set and find your gap.",
      action: "View Jobs",
      link: "/jobs",
      icon: Briefcase,
    },
    {
      title: "Analyze your skill gaps",
      description: "Pick a target job and get a personalized learning path to close your gaps.",
      action: "View Jobs",
      link: "/jobs",
      icon: TrendingUp,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card p-6 shadow-card border border-border">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Welcome back, {firstName} 👋</h1>
              <p className="text-muted-foreground mt-1">Here's your skill journey overview</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <motion.div key={s.label} variants={item} className="rounded-xl bg-card p-4 shadow-card border border-border hover:shadow-card-hover transition-shadow">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className="text-2xl font-bold font-heading text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Feed */}
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {feedItems.map((f, i) => (
            <motion.div key={i} variants={item} className="rounded-xl bg-card p-5 shadow-card border border-border hover:shadow-card-hover transition-shadow">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{f.description}</p>
                  <Link to={f.link} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mt-3">
                    {f.action} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-card shadow-card border border-border overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-primary to-primary/70" />
          <div className="px-5 pb-5 -mt-8">
            <div className="h-16 w-16 rounded-full bg-card border-4 border-card flex items-center justify-center shadow-card">
              <span className="text-xl font-heading font-bold text-primary">{initials}</span>
            </div>
            <h3 className="font-heading font-bold text-foreground mt-2">{profile?.name || "Your Name"}</h3>
            <p className="text-sm text-muted-foreground">{profile?.email || ""}</p>
          </div>
        </motion.div>

        {/* Top Skills */}
        {topSkills.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl bg-card p-5 shadow-card border border-border">
            <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" /> Top Skills
            </h3>
            <div className="space-y-3">
              {topSkills.map((skill) => (
                <div key={skill.skill_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground font-medium">{skill.skill_name}</span>
                    <span className="text-muted-foreground">{getLevelLabel(skill.level)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${getLevelPercent(skill.level)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <Link to="/skills" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4">
              All Skills <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl bg-card p-5 shadow-card border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "Add Skills", icon: Play, link: "/skills" },
              { label: "Browse Jobs", icon: Briefcase, link: "/jobs" },
              { label: "My Network", icon: Users, link: "/network" },
            ].map((a) => (
              <Link key={a.label} to={a.link} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary transition-colors text-sm text-foreground">
                <a.icon className="h-4 w-4 text-muted-foreground" />
                {a.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}