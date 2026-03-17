import { motion } from "framer-motion";
import { MapPin, Calendar, Edit2, Award, CheckCircle2, Save, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  full_name: string;
  headline: string;
  bio: string;
  location: string;
  avatar_url: string;
  created_at: string;
}

interface VerifiedSkill {
  level: number;
  skills: { name: string };
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [verifiedSkills, setVerifiedSkills] = useState<VerifiedSkill[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: "", headline: "", bio: "", location: "" });

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [profileRes, skillsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user!.id).single(),
        supabase.from("user_skills").select("level, skills(name)").eq("user_id", user!.id).eq("verified", true).order("level", { ascending: false }),
      ]);
      if (profileRes.data) {
        setProfile(profileRes.data as any);
        setForm({
          full_name: profileRes.data.full_name || "",
          headline: profileRes.data.headline || "",
          bio: profileRes.data.bio || "",
          location: profileRes.data.location || "",
        });
      }
      if (skillsRes.data) setVerifiedSkills(skillsRes.data as any);
      setLoading(false);
    }
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      headline: form.headline.trim(),
      bio: form.bio.trim(),
      location: form.location.trim(),
    }).eq("user_id", user.id);
    
    setProfile((prev) => prev ? { ...prev, ...form } : prev);
    setEditing(false);
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-card shadow-card border border-border overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="h-24 w-24 rounded-full bg-card border-4 border-card flex items-center justify-center shadow-card shrink-0">
              <span className="text-3xl font-heading font-bold text-primary">{initials}</span>
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Full Name"
                    className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={100}
                  />
                  <input
                    value={form.headline}
                    onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
                    placeholder="Headline (e.g. Full Stack Developer)"
                    className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={200}
                  />
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Location"
                    className="w-full h-10 px-3 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={100}
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-heading font-bold text-foreground">{profile?.full_name || "Add Your Name"}</h1>
                  <p className="text-muted-foreground">{profile?.headline || "Add a headline"}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                    {profile?.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.location}</span>
                    )}
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {new Date(profile?.created_at || "").toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                  </div>
                </>
              )}
            </div>
            {editing ? (
              <div className="flex gap-2 self-start">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors self-start">
                <Edit2 className="h-4 w-4" /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* About */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-xl bg-card p-6 shadow-card border border-border">
        <h2 className="font-heading font-bold text-lg text-foreground mb-2">About</h2>
        {editing ? (
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Tell us about yourself..."
            rows={4}
            className="w-full p-3 rounded-lg bg-secondary border border-border text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            maxLength={1000}
          />
        ) : (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {profile?.bio || "Add a bio to tell others about yourself, your experience, and your goals."}
          </p>
        )}
      </motion.div>

      {/* Verified Skills */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-xl bg-card p-6 shadow-card border border-border">
        <h2 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" /> Verified Skills
        </h2>
        {verifiedSkills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {verifiedSkills.map((vs, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{(vs.skills as any)?.name}</p>
                  <div className="h-1.5 rounded-full bg-secondary mt-1.5">
                    <div className="h-full rounded-full bg-success" style={{ width: `${vs.level}%` }} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground font-medium">{vs.level}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No verified skills yet.{" "}
            <a href="/skills" className="text-primary hover:underline">Take an assessment</a> to verify your skills.
          </p>
        )}
      </motion.div>
    </div>
  );
}
