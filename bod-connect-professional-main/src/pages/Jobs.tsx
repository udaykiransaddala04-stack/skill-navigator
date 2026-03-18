import { motion } from "framer-motion";
import { MapPin, Briefcase, Bookmark, ExternalLink, Filter } from "lucide-react";
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getIndustryColor(industry: string) {
  if (!industry) return "text-primary bg-primary/10";
  const i = industry.toLowerCase();
  if (i.includes("tech") || i.includes("software")) return "text-success bg-success/10";
  if (i.includes("data") || i.includes("ai")) return "text-primary bg-primary/10";
  return "text-accent bg-accent/10";
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch(`${API_URL}/api/jobs/`);
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const data = await res.json();
        setJobs(data);
      } catch (err) {
        setError("Could not load jobs. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const toggleSave = (i: number) => {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Job Matches</h1>
          <p className="text-muted-foreground text-sm">Positions matched to your skill profile</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors self-start">
          <Filter className="h-4 w-4" /> Filters
        </button>
      </motion.div>

      {jobs.length === 0 ? (
        <div className="rounded-xl bg-card p-8 border border-border text-center text-muted-foreground">
          No jobs found. Add some job roles in the backend.
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {jobs.map((job, i) => (
            <motion.div
              key={job.id ?? i}
              variants={item}
              className="rounded-xl bg-card p-6 shadow-card border border-border hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-foreground">{job.title}</h3>
                    {job.industry && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getIndustryColor(job.industry)}`}>
                        {job.industry}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{job.description}</p>

                  {job.required_skills?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {job.required_skills.map((r: any) => (
                        <span key={r.skill.id} className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground font-medium">
                          {r.skill.name}
                          {!r.is_mandatory && <span className="ml-1 opacity-50">(optional)</span>}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                    {job.industry && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" /> {job.industry}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => toggleSave(i)}
                    className={`p-2 rounded-lg border transition-colors ${
                      saved.has(i) ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 ${saved.has(i) ? "fill-current" : ""}`} />
                  </button>
                  <button className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}