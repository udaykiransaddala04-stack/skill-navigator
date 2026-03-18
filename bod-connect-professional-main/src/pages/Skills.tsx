import { motion } from "framer-motion";
import { BarChart3, TrendingUp, CheckCircle2, Trophy } from "lucide-react";
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Skill {
  id: number;
  name: string;
  category: string;
  demand_score: number;
}

interface UserSkill {
  skill_id: number;
  skill_name: string;
  level: number; // 1=Beginner, 2=Intermediate, 3=Advanced
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

function getLevelColor(level: number) {
  if (level === 3) return "bg-success";
  if (level === 2) return "bg-primary";
  return "bg-accent";
}

function getLevelLabel(level: number) {
  if (level === 3) return "Advanced";
  if (level === 2) return "Intermediate";
  if (level === 1) return "Beginner";
  return null;
}

function getLevelPercent(level: number) {
  return level === 3 ? 100 : level === 2 ? 60 : level === 1 ? 30 : 0;
}

export default function Skills() {
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "mine">("overview");
  const [adding, setAdding] = useState<number | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    async function load() {
      try {
        const [allRes, myRes] = await Promise.all([
          fetch(`${API_URL}/api/skills/`),
          token
            ? fetch(`${API_URL}/api/skills/me`, { headers: { Authorization: `Bearer ${token}` } })
            : Promise.resolve(null),
        ]);

        if (!allRes.ok) throw new Error("Failed to fetch skills");
        const allData = await allRes.json();
        setAllSkills(allData);

        if (myRes && myRes.ok) {
          const myData = await myRes.json();
          setUserSkills(myData);
        }
      } catch (err) {
        setError("Could not load skills. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getUserSkill = (skillId: number) => userSkills.find((us) => us.skill_id === skillId);

  const addSkill = async (skillId: number, level: number) => {
    if (!token) return;
    setAdding(skillId);
    try {
      const res = await fetch(`${API_URL}/api/skills/me`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ skill_id: skillId, level }),
      });
      if (res.ok) {
        const myRes = await fetch(`${API_URL}/api/skills/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const myData = await myRes.json();
        setUserSkills(myData);
      }
    } finally {
      setAdding(null);
    }
  };

  const removeSkill = async (skillId: number) => {
    if (!token) return;
    setRemoving(skillId);
    try {
      const res = await fetch(`${API_URL}/api/skills/me/${skillId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUserSkills((prev) => prev.filter((us) => us.skill_id !== skillId));
      }
    } finally {
      setRemoving(null);
    }
  };

  // Group skills by category
  const grouped = allSkills.reduce((acc: Record<string, Skill[]>, skill) => {
    const cat = skill.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Skills</h1>
          <p className="text-muted-foreground text-sm">Add your skills and set your proficiency level</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4 text-success" /> {userSkills.length} added
          </span>
          <span className="flex items-center gap-1">
            <Trophy className="h-4 w-4 text-accent" /> {allSkills.length} available
          </span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary p-1 rounded-lg w-fit">
        {(["overview", "mine"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "overview" ? "All Skills" : "My Skills"}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          {Object.entries(grouped).map(([category, skills]) => (
            <motion.div key={category} variants={item} className="rounded-xl bg-card p-6 shadow-card border border-border">
              <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {skills.map((skill) => {
                  const us = getUserSkill(skill.id);
                  return (
                    <div key={skill.id} className="p-4 rounded-lg bg-background border border-border hover:shadow-card-hover transition-shadow">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-foreground text-sm flex items-center gap-2">
                          {skill.name}
                          {us && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                        </span>
                        {us && (
                          <span className="text-xs text-muted-foreground font-medium">
                            {getLevelLabel(us.level)}
                          </span>
                        )}
                      </div>

                      {us ? (
                        <>
                          <div className="h-2 rounded-full bg-secondary mb-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${getLevelPercent(us.level)}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full ${getLevelColor(us.level)}`}
                            />
                          </div>
                          <button
                            onClick={() => removeSkill(skill.id)}
                            disabled={removing === skill.id}
                            className="text-xs text-destructive hover:underline"
                          >
                            {removing === skill.id ? "Removing..." : "Remove"}
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground mb-3">Not added yet</p>
                          <div className="flex gap-2">
                            {[1, 2, 3].map((lvl) => (
                              <button
                                key={lvl}
                                onClick={() => addSkill(skill.id, lvl)}
                                disabled={adding === skill.id}
                                className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                {adding === skill.id ? "..." : getLevelLabel(lvl)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {userSkills.length === 0 ? (
            <div className="rounded-xl bg-card p-8 shadow-card border border-border text-center">
              <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground mt-3">No skills added yet. Go to All Skills to add some!</p>
            </div>
          ) : (
            userSkills.map((us, i) => (
              <motion.div key={i} variants={item} className="rounded-xl bg-card p-4 shadow-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{us.skill_name}</p>
                    <p className="text-xs text-muted-foreground">{getLevelLabel(us.level)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${getLevelColor(us.level)}`}
                      style={{ width: `${getLevelPercent(us.level)}%` }}
                    />
                  </div>
                  <button
                    onClick={() => removeSkill(us.skill_id)}
                    disabled={removing === us.skill_id}
                    className="text-xs text-destructive hover:underline"
                  >
                    {removing === us.skill_id ? "..." : "Remove"}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}