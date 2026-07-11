"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Loader2,
  Clock,
  Target,
  BookOpen,
  Users,
  Check,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  question: string;
  type: "SINGLE_CORRECT" | "MULTIPLE_CORRECT";
  marks: number;
  explanation: string | null;
  options: Option[];
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  isPublished: boolean;
  category: { id: string; name: string } | null;
  questions: Question[];
  _count: { attempts: number };
  createdAt: string;
  updatedAt: string;
}

export default function ViewQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  async function fetchQuiz() {
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`);
      const data = await res.json();
      if (data.success) {
        setQuiz(data.data);
      } else {
        toast.error("Quiz not found");
        router.push("/admin/quizzes");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish() {
    if (!quiz) return;

    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !quiz.isPublished }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(quiz.isPublished ? "Quiz unpublished" : "Quiz published");
        setQuiz({ ...quiz, isPublished: !quiz.isPublished });
      } else {
        toast.error(data.error || "Failed to update quiz");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Quiz deleted successfully");
        router.push("/admin/quizzes");
      } else {
        toast.error(data.error || "Failed to delete quiz");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
      setDeleteDialog(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/admin/quizzes"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Quizzes
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
            <Badge variant={quiz.isPublished ? "success" : "secondary"}>
              {quiz.isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
          {quiz.description && (
            <p className="text-muted-foreground mt-2">{quiz.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={togglePublish}>
            {quiz.isPublished ? "Unpublish" : "Publish"}
          </Button>
          <Link href={`/admin/quizzes/${id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Quiz
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quiz.questions.length}</p>
                <p className="text-xs text-muted-foreground">Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quiz.durationMinutes}</p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {quiz.passingMarks}/{quiz.totalMarks}
                </p>
                <p className="text-xs text-muted-foreground">Passing Marks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quiz._count.attempts}</p>
                <p className="text-xs text-muted-foreground">Attempts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Info */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium">
                {quiz.category ? quiz.category.name : "No category"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Passing Percentage</p>
              <p className="font-medium">
                {Math.round((quiz.passingMarks / quiz.totalMarks) * 100)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(quiz.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {new Date(quiz.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Questions ({quiz.questions.length})</CardTitle>
          <CardDescription>
            All questions with their options and correct answers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {quiz.questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No questions added yet</p>
              <Link href={`/admin/quizzes/${id}/edit`}>
                <Button>Add Questions</Button>
              </Link>
            </div>
          ) : (
            quiz.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Badge variant="secondary" className="shrink-0">
                      Q{index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{question.question}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {question.type === "SINGLE_CORRECT"
                            ? "Single Answer"
                            : "Multiple Answers"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {question.marks} mark{question.marks > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={option.id}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        option.isCorrect
                          ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900"
                          : "bg-muted/30"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          option.isCorrect
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {option.isCorrect ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <span className="text-xs">{String.fromCharCode(65 + optIndex)}</span>
                        )}
                      </div>
                      <span className={option.isCorrect ? "font-medium" : ""}>
                        {option.text}
                      </span>
                    </div>
                  ))}
                </div>

                {question.explanation && (
                  <>
                    <Separator />
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                        Explanation
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {question.explanation}
                      </p>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for this quiz
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete this quiz</p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete the quiz and all its questions and attempts.
              </p>
            </div>
            <Button variant="destructive" onClick={() => setDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Quiz
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{quiz.title}&quot;? This will
              also delete all questions and attempt records. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
