"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2, Check, GripVertical, Lock, Unlock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

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
  explanation: string;
  options: Option[];
}

export default function NewQuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Quiz form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [passingPercentage, setPassingPercentage] = useState(60);
  const [isPublished, setIsPublished] = useState(false);
  const [isFree, setIsFree] = useState(true);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [catRes, planRes] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/admin/plans"),
      ]);
      const catData = await catRes.json();
      const planData = await planRes.json();
      if (catData.success) {
        setCategories(catData.data);
      }
      if (planData.success) {
        setPlans(planData.data);
      }
    } catch (error) {
      console.error(error);
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
        { id: crypto.randomUUID(), text: "", isCorrect: false },
        { id: crypto.randomUUID(), text: "", isCorrect: false },
        { id: crypto.randomUUID(), text: "", isCorrect: false },
        { id: crypto.randomUUID(), text: "", isCorrect: false },
      ],
    };
    setQuestions([...questions, newQuestion]);
  }

  function removeQuestion(questionId: string) {
    setQuestions(questions.filter((q) => q.id !== questionId));
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
              { id: crypto.randomUUID(), text: "", isCorrect: false },
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
    return questions.reduce((acc, q) => acc + q.marks, 0);
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
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

    setLoading(true);

    try {
      const totalMarks = calculateTotalMarks();
      const passingMarks = Math.ceil((totalMarks * passingPercentage) / 100);

      // Create quiz
      const quizRes = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          categoryId: categoryId || null,
          durationMinutes,
          totalMarks,
          passingMarks,
          isPublished,
          isFree,
          planIds: isFree ? [] : selectedPlanIds,
        }),
      });

      const quizData = await quizRes.json();

      if (!quizData.success) {
        toast.error(quizData.error || "Failed to create quiz");
        return;
      }

      // Create questions
      for (const question of questions) {
        const validOptions = question.options.filter((o) => o.text.trim());

        await fetch(`/api/admin/quizzes/${quizData.data.id}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question.question,
            type: question.type,
            marks: question.marks,
            explanation: question.explanation,
            options: validOptions.map((o) => ({
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          }),
        });
      }

      toast.success("Quiz created successfully");
      router.push("/admin/quizzes");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
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

      <div>
        <h1 className="text-3xl font-bold">Create Quiz</h1>
        <p className="text-muted-foreground mt-1">Add a new quiz with questions</p>
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

          <Separator />

          {/* Access Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {isFree ? (
                  <Unlock className="h-5 w-5 text-green-500" />
                ) : (
                  <Lock className="h-5 w-5 text-orange-500" />
                )}
                <div>
                  <Label>Free Quiz</Label>
                  <p className="text-sm text-muted-foreground">
                    {isFree ? "Available to all users" : "Requires subscription"}
                  </p>
                </div>
              </div>
              <Switch
                checked={isFree}
                onCheckedChange={(checked) => {
                  setIsFree(checked);
                  if (checked) setSelectedPlanIds([]);
                }}
              />
            </div>

            {!isFree && plans.length > 0 && (
              <div className="space-y-2">
                <Label>Select Plans</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Users with any of these plans can access this quiz
                </p>
                <div className="grid gap-2">
                  {plans.map((plan) => (
                    <label
                      key={plan.id}
                      className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedPlanIds.includes(plan.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPlanIds([...selectedPlanIds, plan.id]);
                          } else {
                            setSelectedPlanIds(selectedPlanIds.filter((id) => id !== plan.id));
                          }
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{plan.name}</p>
                      </div>
                      <Badge variant="secondary">
                        {plan.price === 0 ? "Free" : `₹${plan.price}`}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {!isFree && plans.length === 0 && (
              <div className="text-center p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  No plans available. Create plans first to restrict quiz access.
                </p>
              </div>
            )}
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
                {questions.length} question(s) | {calculateTotalMarks()} total marks
              </CardDescription>
            </div>
            <Button onClick={addQuestion} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No questions added yet</p>
              <Button onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Question
              </Button>
            </div>
          ) : (
            questions.map((question, qIndex) => (
              <div key={question.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="secondary">Q{qIndex + 1}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => removeQuestion(question.id)}
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
        <Link href="/admin/quizzes">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating...
            </>
          ) : (
            "Create Quiz"
          )}
        </Button>
      </div>
    </div>
  );
}
