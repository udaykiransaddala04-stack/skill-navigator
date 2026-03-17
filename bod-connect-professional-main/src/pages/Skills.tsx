import { motion } from "framer-motion";
import { BarChart3, TrendingUp, CheckCircle2, Play, Loader2, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Skill {
  id: string;
  name: string;
  description: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  skills: Skill[];
}

interface UserSkill {
  skill_id: string;
  level: number;
  verified: boolean;
}

interface TestResult {
  skill_id: string;
  score: number;
  completed_at: string;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

function getLevelColor(level: number) {
  if (level >= 80) return "bg-success";
  if (level >= 60) return "bg-primary";
  if (level >= 40) return "bg-accent";
  return "bg-muted-foreground";
}

export default function Skills() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "results">("overview");

  useEffect(() => {
    async function load() {
      const [catRes, skillRes, userSkillRes, resultsRes] = await Promise.all([
        supabase.from("skill_categories").select("*").order("name"),
        supabase.from("skills").select("*").order("name"),
        user ? supabase.from("user_skills").select("*").eq("user_id", user.id) : Promise.resolve({ data: [] }),
        user ? supabase.from("user_skill_results").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }) : Promise.resolve({ data: [] }),
      ]);

      const cats: Category[] = (catRes.data || []).map((c: any) => ({
        ...c,
        skills: (skillRes.data || []).filter((s: any) => s.category_id === c.id),
      }));

      setCategories(cats);
      setUserSkills((userSkillRes.data as UserSkill[]) || []);
      setResults((resultsRes.data as TestResult[]) || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const getUserSkill = (skillId: string) => userSkills.find((us) => us.skill_id === skillId);
  const getLatestResult = (skillId: string) => results.find((r) => r.skill_id === skillId);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Skills & Assessments</h1>
          <p className="text-muted-foreground text-sm">Take tests to verify your skills and build your profile</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-success" /> {userSkills.filter((s) => s.verified).length} verified</span>
          <span className="flex items-center gap-1"><Trophy className="h-4 w-4 text-accent" /> {results.length} tests taken</span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary p-1 rounded-lg w-fit">
        {(["overview", "results"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "overview" ? "All Skills" : "My Results"}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {categories.map((cat) => (
            <motion.div key={cat.id} variants={item} className="rounded-xl bg-card p-6 shadow-card border border-border">
              <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> {cat.name}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cat.skills.map((skill) => {
                  const us = getUserSkill(skill.id);
                  return (
                    <div key={skill.id} className="p-4 rounded-lg bg-background border border-border hover:shadow-card-hover transition-shadow">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-foreground text-sm flex items-center gap-2">
                          {skill.name}
                          {us?.verified && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                        </span>
                        {us && <span className="text-xs text-muted-foreground font-medium">{us.level}%</span>}
                      </div>
                      {us ? (
                        <div className="h-2 rounded-full bg-secondary mb-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${us.level}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full rounded-full ${getLevelColor(us.level)}`}
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mb-3">Not assessed yet</p>
                      )}
                      <Link
                        to={`/skills/test/${skill.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                      >
                        <Play className="h-3 w-3" />
                        {us ? "Retake Test" : "Take Assessment"}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {results.length === 0 ? (
            <div className="rounded-xl bg-card p-8 shadow-card border border-border text-center">
              <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground mt-3">No test results yet. Take an assessment to get started!</p>
            </div>
          ) : (
            results.map((result, i) => {
              const skillName = categories.flatMap((c) => c.skills).find((s) => s.id === result.skill_id)?.name || "Unknown";
              const passed = result.score >= 70;
              return (
                <motion.div key={i} variants={item} className="rounded-xl bg-card p-4 shadow-card border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${passed ? "bg-success/10" : "bg-destructive/10"}`}>
                      {passed ? <CheckCircle2 className="h-5 w-5 text-success" /> : <TrendingUp className="h-5 w-5 text-destructive" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{skillName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(result.completed_at).toLocaleDateString()} · Score: {result.score}%
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${passed ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {passed ? "Passed" : "Needs Practice"}
                  </span>
                </motion.div>
              );
            })
          )}
        </motion.div>
      )}
    </div>
  );
}
