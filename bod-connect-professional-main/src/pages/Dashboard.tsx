import { motion } from "framer-motion";
import { TrendingUp, Target, BookOpen, Briefcase, ArrowRight, Star, Users, Clock, CheckCircle2, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  full_name: string;
  headline: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skillCount, setSkillCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [testCount, setTestCount] = useState(0);
  const [topSkills, setTopSkills] = useState<{ name: string; level: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [profileRes, userSkillsRes, resultsRes] = await Promise.all([
        supabase.from("profiles").select("full_name, headline").eq("user_id", user!.id).single(),
        supabase.from("user_skills").select("skill_id, level, verified, skills(name)").eq("user_id", user!.id).order("level", { ascending: false }).limit(4),
        supabase.from("user_skill_results").select("id").eq("user_id", user!.id),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (userSkillsRes.data) {
        setSkillCount(userSkillsRes.data.length);
        setVerifiedCount(userSkillsRes.data.filter((s: any) => s.verified).length);
        setTopSkills(userSkillsRes.data.map((s: any) => ({
          name: (s.skills as any)?.name || "Unknown",
          level: s.level,
        })));
      }
      if (resultsRes.data) setTestCount(resultsRes.data.length);
    }
    load();
  }, [user]);

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const stats = [
    { label: "Skills Assessed", value: String(skillCount), icon: Target, color: "text-primary" },
    { label: "Verified Skills", value: String(verifiedCount), icon: CheckCircle2, color: "text-success" },
    { label: "Tests Taken", value: String(testCount), icon: BookOpen, color: "text-accent" },
  ];

  const feedItems = [
    {
      title: "Take a skill assessment",
      description: "Prove your expertise by taking a test. Verified skills stand out to employers.",
      action: "Browse Skills",
      link: "/skills",
      icon: Play,
    },
    {
      title: "Complete your profile",
      description: "Add your headline, bio, and experience to make your profile stand out.",
      action: "Edit Profile",
      link: "/profile",
      icon: Star,
    },
    {
      title: "Explore job matches",
      description: "See which positions match your verified skill set.",
      action: "View Jobs",
      link: "/jobs",
      icon: Briefcase,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card p-6 shadow-card border border-border">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Welcome back, {firstName}</h1>
              <p className="text-muted-foreground mt-1">Here's your skill journey overview</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <motion.div key={s.label} variants={item} className="rounded-xl bg-card p-4 shadow-card border border-border hover:shadow-card-hover transition-shadow">
              <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
              <p className="text-2xl font-bold font-heading text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

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

      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-card shadow-card border border-border overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-primary to-primary/70" />
          <div className="px-5 pb-5 -mt-8">
            <div className="h-16 w-16 rounded-full bg-card border-4 border-card flex items-center justify-center shadow-card">
              <span className="text-xl font-heading font-bold text-primary">{initials}</span>
            </div>
            <h3 className="font-heading font-bold text-foreground mt-2">{profile?.full_name || "Complete Profile"}</h3>
            <p className="text-sm text-muted-foreground">{profile?.headline || "Add your headline"}</p>
            <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3">
              View Profile <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </motion.div>

        {topSkills.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-xl bg-card p-5 shadow-card border border-border">
            <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-accent" /> Top Skills
            </h3>
            <div className="space-y-3">
              {topSkills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground font-medium">{skill.name}</span>
                    <span className="text-muted-foreground">{skill.level}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${skill.level}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <Link to="/skills" className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4">
              All Skills <ArrowRight className="h-3 w-3" />
            </Link>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-xl bg-card p-5 shadow-card border border-border">
          <h3 className="font-heading font-semibold text-foreground mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: "Take a Test", icon: Play, link: "/skills" },
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
