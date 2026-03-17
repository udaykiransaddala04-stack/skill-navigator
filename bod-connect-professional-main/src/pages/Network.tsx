import { motion } from "framer-motion";
import { UserPlus, UserCheck, MessageSquare, Search } from "lucide-react";
import { useState } from "react";

const people = [
  { name: "Sarah Chen", role: "ML Engineer at Google", skills: ["Python", "TensorFlow", "MLOps"], connected: true, mutual: 12 },
  { name: "Alex Rivera", role: "Senior Developer at Meta", skills: ["React", "GraphQL", "TypeScript"], connected: false, mutual: 8 },
  { name: "Priya Sharma", role: "Cloud Architect at AWS", skills: ["AWS", "Kubernetes", "Terraform"], connected: true, mutual: 5 },
  { name: "Marcus Johnson", role: "Tech Lead at Stripe", skills: ["Node.js", "Go", "PostgreSQL"], connected: false, mutual: 15 },
  { name: "Emily Watson", role: "UX Engineer at Airbnb", skills: ["React", "CSS", "Design Systems"], connected: false, mutual: 3 },
  { name: "Raj Patel", role: "DevOps Lead at Netflix", skills: ["Docker", "CI/CD", "Monitoring"], connected: true, mutual: 7 },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("");
}

const colors = ["bg-primary/10 text-primary", "bg-accent/10 text-accent", "bg-success/10 text-success"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function Network() {
  const [connections, setConnections] = useState(
    () => new Set(people.filter((p) => p.connected).map((p) => p.name))
  );

  const toggleConnect = (name: string) => {
    setConnections((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Network</h1>
          <p className="text-muted-foreground text-sm">
            {connections.size} connections · Grow your professional network
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search professionals..."
            className="w-full h-9 pl-9 pr-4 rounded-lg bg-secondary border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {people.map((person, i) => {
          const isConnected = connections.has(person.name);
          return (
            <motion.div
              key={person.name}
              variants={item}
              className="rounded-xl bg-card p-5 shadow-card border border-border hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center font-heading font-bold text-sm shrink-0 ${colors[i % 3]}`}>
                  {getInitials(person.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{person.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{person.role}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{person.mutual} mutual connections</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {person.skills.map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">{s}</span>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => toggleConnect(person.name)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isConnected
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isConnected ? <><UserCheck className="h-4 w-4" /> Connected</> : <><UserPlus className="h-4 w-4" /> Connect</>}
                </button>
                <button className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors">
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
