"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2, Check, GripVertical, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface Category {
  id: string;
  name: string;
}

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  isNew?: boolean;
}

interface Question {
  id: string;
  question: string;
  type: "SINGLE_CORRECT" | "MULTIPLE_CORRECT";
  marks: number;
  explanation: string;
  options: Option[];
  isNew?: boolean;
  isDeleted?: boolean;
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
}

export default function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deleteQuestionDialog, setDeleteQuestionDialog] = useState<Question | null>(null);

  // Quiz form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passingPercentage, setPassingPercentage] = useState(60);
  const [isPublished, setIsPublished] = useState(false);

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const [quizRes, catRes] = await Promise.all([
        fetch(`/api/admin/quizzes/${id}`),
        fetch("/api/admin/categories"),
      ]);

      const quizData = await quizRes.json();
      const catData = await catRes.json();

      if (catData.success) {
        setCategories(catData.data);
      }

      if (quizData.success) {
        const quiz: Quiz = quizData.data;
        setTitle(quiz.title);
        setDescription(quiz.description || "");
        setCategoryId(quiz.category?.id || "");
        setDurationMinutes(quiz.durationMinutes);
        setIsPublished(quiz.isPublished);

        // Calculate passing percentage from marks
        if (quiz.totalMarks > 0) {
          setPassingPercentage(Math.round((quiz.passingMarks / quiz.totalMarks) * 100));
        }

        // Map questions
        const mappedQuestions = quiz.questions.map((q) => ({
          ...q,
          explanation: q.explanation || "",
          options: q.options.map((o) => ({ ...o })),
        }));
        setQuestions(mappedQuestions);
        setOriginalQuestions(JSON.parse(JSON.stringify(mappedQuestions)));
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

  function addQuestion() {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      question: "",
      type: "SINGLE_CORRECT",
      marks: 1,
      explanation: "",
      options: [
        { id: crypto.randomUUID(), text: "", isCorrect: false, isNew: true },
        { id: crypto.randomUUID(), text: "", isCorrect: false, isNew: true },
        { id: crypto.randomUUID(), text: "", isCorrect: false, isNew: true },
        { id: crypto.randomUUID(), text: "", isCorrect: false, isNew: true },
      ],
      isNew: true,
    };
    setQuestions([...questions, newQuestion]);
  }

  function removeQuestion(questionId: string) {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    if (question.isNew) {
      // New question, just remove from list
      setQuestions(questions.filter((q) => q.id !== questionId));
    } else {
      // Existing question, mark as deleted
      setQuestions(
        questions.map((q) =>
          q.id === questionId ? { ...q, isDeleted: true } : q
        )
      );
    }
    setDeleteQuestionDialog(null);
  }

  function updateQuestion(questionId: string, field: keyof Question, value: string | number) {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q))
    );
  }

  function addOption(questionId: string) {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          return {
            ...q,
            options: [
              ...q.options,
              { id: crypto.randomUUID(), text: "", isCorrect: false, isNew: true },
            ],
          };
        }
        return q;
      })
    );
  }

  function removeOption(questionId: string, optionId: string) {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId && q.options.length > 2) {
          return {
            ...q,
            options: q.options.filter((o) => o.id !== optionId),
          };
        }
        return q;
      })
    );
  }

  function updateOption(questionId: string, optionId: string, field: keyof Option, value: string | boolean) {
    setQuestions(
      questions.map((q) => {
        if (q.id === questionId) {
          let newOptions = q.options.map((o) =>
            o.id === optionId ? { ...o, [field]: value } : o
          );

          // For single correct, ensure only one option is correct
          if (field === "isCorrect" && value === true && q.type === "SINGLE_CORRECT") {
            newOptions = newOptions.map((o) => ({
              ...o,
              isCorrect: o.id === optionId,
            }));
          }

          return { ...q, options: newOptions };
        }
        return q;
      })
    );
  }

  function calculateTotalMarks() {
    return questions
      .filter((q) => !q.isDeleted)
      .reduce((acc, q) => acc + q.marks, 0);
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    const activeQuestions = questions.filter((q) => !q.isDeleted);

    if (activeQuestions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    // Validate questions
    for (let i = 0; i < activeQuestions.length; i++) {
      const q = activeQuestions[i];
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} is empty`);
        return;
      }

      const validOptions = q.options.filter((o) => o.text.trim());
      if (validOptions.length < 2) {
        toast.error(`Question ${i + 1} needs at least 2 options`);
        return;
      }

      const correctOptions = q.options.filter((o) => o.isCorrect && o.text.trim());
      if (correctOptions.length === 0) {
        toast.error(`Question ${i + 1} needs at least one correct answer`);
        return;
      }
    }

    setSaving(true);

    try {
      const totalMarks = calculateTotalMarks();
      const passingMarks = Math.ceil((totalMarks * passingPercentage) / 100);

      // Update quiz details
      const quizRes = await fetch(`/api/admin/quizzes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          categoryId: categoryId || null,
          durationMinutes,
          totalMarks,
          passingMarks,
          isPublished,
        }),
      });

      const quizData = await quizRes.json();

      if (!quizData.success) {
        toast.error(quizData.error || "Failed to update quiz");
        return;
      }

      // Handle questions
      for (const question of questions) {
        const validOptions = question.options.filter((o) => o.text.trim());

        if (question.isDeleted && !question.isNew) {
          // Delete existing question
          await fetch(`/api/admin/quizzes/${id}/questions/${question.id}`, {
            method: "DELETE",
          });
        } else if (question.isNew && !question.isDeleted) {
          // Create new question
          await fetch(`/api/admin/quizzes/${id}/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: question.question,
              type: question.type,
              marks: question.marks,
              explanation: question.explanation || null,
              options: validOptions.map((o) => ({
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            }),
          });
        } else if (!question.isDeleted) {
          // Update existing question
          await fetch(`/api/admin/quizzes/${id}/questions/${question.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: question.question,
              type: question.type,
              marks: question.marks,
              explanation: question.explanation || null,
              options: validOptions.map((o) => ({
                id: o.isNew ? undefined : o.id,
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            }),
          });
        }
      }

      toast.success("Quiz updated successfully");
      router.push(`/admin/quizzes/${id}`);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const activeQuestions = questions.filter((q) => !q.isDeleted);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href={`/admin/quizzes/${id}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Quiz
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Edit Quiz</h1>
        <p className="text-muted-foreground mt-1">Update quiz details and questions</p>
      </div>

      {/* Quiz Details */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
          <CardDescription>Basic information about the quiz</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quiz description"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="passing">Passing Percentage (%)</Label>
              <Input
                id="passing"
                type="number"
                min={1}
                max={100}
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 60)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Publish Quiz</Label>
                <p className="text-sm text-muted-foreground">
                  Make quiz available to users
                </p>
              </div>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                {activeQuestions.length} question(s) | {calculateTotalMarks()} total marks
              </CardDescription>
            </div>
            <Button onClick={addQuestion} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeQuestions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No questions added yet</p>
              <Button onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Question
              </Button>
            </div>
          ) : (
            activeQuestions.map((question, qIndex) => (
              <div key={question.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Badge variant={question.isNew ? "default" : "secondary"}>
                      Q{qIndex + 1}
                      {question.isNew && " (New)"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleteQuestionDialog(question)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Question *</Label>
                  <Textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, "question", e.target.value)}
                    placeholder="Enter your question"
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value) =>
                        updateQuestion(question.id, "type", value as "SINGLE_CORRECT" | "MULTIPLE_CORRECT")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE_CORRECT">Single Correct</SelectItem>
                        <SelectItem value="MULTIPLE_CORRECT">Multiple Correct</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Marks</Label>
                    <Input
                      type="number"
                      min={1}
                      value={question.marks}
                      onChange={(e) =>
                        updateQuestion(question.id, "marks", parseInt(e.target.value) || 1)
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addOption(question.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateOption(question.id, option.id, "isCorrect", !option.isCorrect)
                          }
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            option.isCorrect
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-muted-foreground"
                          }`}
                        >
                          {option.isCorrect && <Check className="h-3 w-3" />}
                        </button>
                        <Input
                          value={option.text}
                          onChange={(e) =>
                            updateOption(question.id, option.id, "text", e.target.value)
                          }
                          placeholder={`Option ${oIndex + 1}`}
                          className="flex-1"
                        />
                        {question.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeOption(question.id, option.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click the circle to mark correct answer(s)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    value={question.explanation}
                    onChange={(e) => updateQuestion(question.id, "explanation", e.target.value)}
                    placeholder="Explain the correct answer"
                    rows={2}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Link href={`/admin/quizzes/${id}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Delete Question Dialog */}
      <Dialog open={!!deleteQuestionDialog} onOpenChange={() => setDeleteQuestionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action will be saved when you click &quot;Save Changes&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteQuestionDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteQuestionDialog && removeQuestion(deleteQuestionDialog.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
