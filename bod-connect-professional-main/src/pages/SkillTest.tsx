import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Clock, Trophy, Loader2 } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  difficulty: string;
}

interface SkillInfo {
  id: string;
  name: string;
  category_name: string;
}

export default function SkillTest() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [skill, setSkill] = useState<SkillInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    async function loadData() {
      if (!skillId) return;
      
      const [skillRes, questionsRes] = await Promise.all([
        supabase
          .from("skills")
          .select("id, name, skill_categories(name)")
          .eq("id", skillId)
          .single(),
        supabase
          .from("skill_questions")
          .select("*")
          .eq("skill_id", skillId)
          .order("difficulty"),
      ]);

      if (skillRes.data) {
        setSkill({
          id: skillRes.data.id,
          name: skillRes.data.name,
          category_name: (skillRes.data.skill_categories as any)?.name || "",
        });
      }

      if (questionsRes.data) {
        const parsed = questionsRes.data.map((q: any) => ({
          ...q,
          options: typeof q.options === "string" ? JSON.parse(q.options) : q.options,
        }));
        setQuestions(parsed);
        setTimeLeft(parsed.length * 60); // 1 min per question
      }
      
      setLoading(false);
    }
    loadData();
  }, [skillId]);

  // Timer
  useEffect(() => {
    if (loading || showResults || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, showResults]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const selectAnswer = (optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const correct = questions.reduce((acc, q, i) => (answers[i] === q.correct_answer ? acc + 1 : acc), 0);
    const score = Math.round((correct / questions.length) * 100);

    if (user && skillId) {
      // Save result
      await supabase.from("user_skill_results").insert({
        user_id: user.id,
        skill_id: skillId,
        score,
        total_questions: questions.length,
        correct_answers: correct,
      });

      // Upsert user skill level
      await supabase.from("user_skills").upsert(
        {
          user_id: user.id,
          skill_id: skillId,
          level: score,
          verified: score >= 70,
        },
        { onConflict: "user_id,skill_id" }
      );
    }

    setSubmitting(false);
    setShowResults(true);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!skill || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <h2 className="text-xl font-heading font-bold text-foreground">No test available</h2>
        <p className="text-muted-foreground mt-2">This skill doesn't have a test yet.</p>
        <Link to="/skills" className="text-primary hover:underline mt-4 inline-block">
          ← Back to Skills
        </Link>
      </div>
    );
  }

  if (showResults) {
    const correct = questions.reduce((acc, q, i) => (answers[i] === q.correct_answer ? acc + 1 : acc), 0);
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-card p-8 shadow-card border border-border text-center"
        >
          <div className={`h-20 w-20 rounded-full mx-auto flex items-center justify-center ${passed ? "bg-success/10" : "bg-destructive/10"}`}>
            {passed ? (
              <Trophy className="h-10 w-10 text-success" />
            ) : (
              <XCircle className="h-10 w-10 text-destructive" />
            )}
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground mt-4">
            {passed ? "Congratulations!" : "Keep Practicing!"}
          </h2>
          <p className="text-muted-foreground mt-2">
            You scored <span className="font-bold text-foreground">{score}%</span> on {skill.name}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {correct} out of {questions.length} questions correct
          </p>
          {passed && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 text-success text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" /> Skill Verified
            </div>
          )}
        </motion.div>

        {/* Review answers */}
        <div className="space-y-3">
          <h3 className="font-heading font-semibold text-foreground">Review Answers</h3>
          {questions.map((q, i) => {
            const userAnswer = answers[i];
            const isCorrect = userAnswer === q.correct_answer;
            return (
              <div key={q.id} className="rounded-xl bg-card p-4 shadow-card border border-border">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 shrink-0 ${isCorrect ? "text-success" : "text-destructive"}`}>
                    {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{q.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your answer: <span className={isCorrect ? "text-success" : "text-destructive"}>{q.options[userAnswer] ?? "Not answered"}</span>
                    </p>
                    {!isCorrect && (
                      <p className="text-xs text-success mt-0.5">
                        Correct: {q.options[q.correct_answer]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Link
            to="/skills"
            className="flex-1 h-11 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Skills
          </Link>
          <button
            onClick={() => {
              setShowResults(false);
              setAnswers({});
              setCurrentIndex(0);
              setTimeLeft(questions.length * 60);
            }}
            className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            Retake Test
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to="/skills" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <h1 className="text-xl font-heading font-bold text-foreground mt-1">{skill.name} Assessment</h1>
          <p className="text-sm text-muted-foreground">{skill.category_name}</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${timeLeft < 60 ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`}>
          <Clock className="h-4 w-4" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="rounded-xl bg-card p-6 shadow-card border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              currentQ.difficulty === "easy" ? "bg-success/10 text-success" :
              currentQ.difficulty === "medium" ? "bg-accent/10 text-accent" :
              "bg-destructive/10 text-destructive"
            }`}>
              {currentQ.difficulty}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">{currentQ.question}</h2>

          <div className="mt-5 space-y-3">
            {currentQ.options.map((option: string, oi: number) => (
              <button
                key={oi}
                onClick={() => selectAnswer(oi)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all text-sm ${
                  answers[currentIndex] === oi
                    ? "border-primary bg-primary/5 text-foreground font-medium"
                    : "border-border hover:border-primary/30 text-foreground hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    answers[currentIndex] === oi ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}>
                    {answers[currentIndex] === oi && (
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  {option}
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>

        {/* Question dots */}
        <div className="hidden sm:flex gap-1.5">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                i === currentIndex ? "bg-primary" :
                answers[i] !== undefined ? "bg-primary/40" :
                "bg-secondary"
              }`}
            />
          ))}
        </div>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length < questions.length}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Test"}
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
