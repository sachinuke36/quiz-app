"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Clock, ChevronLeft, ChevronRight, Flag, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  question: string;
  marks: number;
  type: "SINGLE_CORRECT" | "MULTIPLE_CORRECT";
  options: Option[];
}

interface QuizData {
  id: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  questions: Question[];
}

interface AttemptData {
  id: string;
  startedAt: string;
  answers: Record<string, string[]>;
}

interface AttemptPageProps {
  params: Promise<{ id: string }>;
}

export default function AttemptPage({ params }: AttemptPageProps) {
  const router = useRouter();
  const { id: quizId } = use(params);

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Initialize quiz and attempt
  useEffect(() => {
    async function initQuiz() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}/attempt`, {
          method: "POST",
        });
        const data = await res.json();

        if (data.success) {
          setQuiz(data.data.quiz);
          setAttempt(data.data.attempt);
          setAnswers(data.data.attempt.answers || {});

          // Calculate time left
          const startTime = new Date(data.data.attempt.startedAt).getTime();
          const endTime = startTime + data.data.quiz.durationMinutes * 60 * 1000;
          const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
          setTimeLeft(remaining);
        } else {
          toast.error(data.error || "Failed to load quiz");
          router.push(`/dashboard/quizzes/${quizId}`);
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong");
        router.push(`/dashboard/quizzes/${quizId}`);
      } finally {
        setLoading(false);
      }
    }
    initQuiz();
  }, [quizId, router]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Save answer to server
  const saveAnswer = useCallback(
    async (questionId: string, selectedOptions: string[]) => {
      if (!attempt) return;

      try {
        await fetch(`/api/quizzes/${quizId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attemptId: attempt.id,
            questionId,
            selectedOptionIds: selectedOptions,
          }),
        });
      } catch (error) {
        console.error("Failed to save answer:", error);
      }
    },
    [attempt, quizId]
  );

  // Handle option selection
  const handleOptionSelect = (questionId: string, optionId: string) => {
    if (!quiz) return;

    const question = quiz.questions.find((q) => q.id === questionId);
    if (!question) return;

    let newSelected: string[];

    if (question.type === "SINGLE_CORRECT") {
      newSelected = [optionId];
    } else {
      const current = answers[questionId] || [];
      if (current.includes(optionId)) {
        newSelected = current.filter((id) => id !== optionId);
      } else {
        newSelected = [...current, optionId];
      }
    }

    setAnswers((prev) => ({ ...prev, [questionId]: newSelected }));
    saveAnswer(questionId, newSelected);
  };

  // Toggle flag
  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Submit quiz
  const handleSubmit = async (autoSubmit = false) => {
    if (!attempt) return;

    setSubmitting(true);
    setShowSubmitDialog(false);

    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.id }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(autoSubmit ? "Time up! Quiz submitted." : "Quiz submitted!");
        router.push(`/dashboard/results/${attempt.id}`);
      } else {
        toast.error(data.error || "Failed to submit quiz");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading || !quiz || !attempt) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const answeredCount = Object.keys(answers).filter(
    (k) => answers[k]?.length > 0
  ).length;
  const isLowTime = timeLeft < 60;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-background z-10 py-4">
        <div>
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg",
              isLowTime ? "bg-destructive/10 text-destructive" : "bg-muted"
            )}
          >
            <Clock className={cn("h-4 w-4", isLowTime && "animate-pulse")} />
            <span className="font-mono text-lg font-bold">
              {formatTime(timeLeft)}
            </span>
          </div>

          <Button
            variant="destructive"
            onClick={() => setShowSubmitDialog(true)}
            disabled={submitting}
          >
            Submit Quiz
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{answeredCount} answered</span>
          <span>{quiz.questions.length - answeredCount} remaining</span>
        </div>
        <Progress value={(answeredCount / quiz.questions.length) * 100} />
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="outline" className="mb-2">
                {currentQ.marks} mark{currentQ.marks > 1 ? "s" : ""}
              </Badge>
              <CardTitle className="text-lg">{currentQ.question}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentQ.type === "SINGLE_CORRECT"
                  ? "Select one option"
                  : "Select all correct options"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFlag(currentQ.id)}
              className={cn(flagged.has(currentQ.id) && "text-orange-500")}
            >
              <Flag className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQ.options.map((option) => {
              const isSelected = answers[currentQ.id]?.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(currentQ.id, option.id)}
                  className={cn(
                    "w-full p-4 text-left rounded-lg border transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        currentQ.type === "MULTIPLE_CORRECT" && "rounded",
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-muted-foreground"
                      )}
                    >
                      {isSelected && (
                        <div
                          className={cn(
                            "w-2 h-2 bg-white",
                            currentQ.type === "SINGLE_CORRECT"
                              ? "rounded-full"
                              : "rounded-sm"
                          )}
                        />
                      )}
                    </div>
                    <span>{option.text}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={() =>
            setCurrentQuestion((prev) =>
              Math.min(quiz.questions.length - 1, prev + 1)
            )
          }
          disabled={currentQuestion === quiz.questions.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Question Navigator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Question Navigator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((q, index) => {
              const isAnswered = answers[q.id]?.length > 0;
              const isFlagged = flagged.has(q.id);
              const isCurrent = index === currentQuestion;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(index)}
                  className={cn(
                    "w-10 h-10 rounded-lg text-sm font-medium transition-colors relative",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isAnswered
                      ? "bg-green-500/20 text-green-700 border border-green-500/50"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  {index + 1}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500/20 border border-green-500/50 rounded" />
              Answered
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-muted rounded" />
              Unanswered
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              Flagged
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Quiz?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your quiz?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span>
                {quiz.questions.length - answeredCount} question(s) unanswered
              </span>
            </div>

            {flagged.size > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Flag className="h-4 w-4 text-orange-500" />
                <span>{flagged.size} question(s) flagged for review</span>
              </div>
            )}

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                <strong>Time remaining:</strong> {formatTime(timeLeft)}
              </p>
              <p className="text-sm">
                <strong>Questions answered:</strong> {answeredCount}/
                {quiz.questions.length}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Review Answers
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
