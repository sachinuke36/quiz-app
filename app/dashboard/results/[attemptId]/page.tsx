import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, X, AlertCircle, Trophy, Clock, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

interface ResultDetailPageProps {
  params: Promise<{ attemptId: string }>;
}

async function getAttempt(attemptId: string, userId: string) {
  const attempt = await db.quizAttempt.findFirst({
    where: {
      id: attemptId,
      userId,
      submittedAt: { not: null },
    },
    include: {
      quiz: {
        include: {
          category: true,
          questions: true,
        },
      },
      answers: {
        include: {
          question: {
            include: { options: true },
          },
        },
      },
    },
  });

  return attempt;
}

export default async function ResultDetailPage({ params }: ResultDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { attemptId } = await params;
  const attempt = await getAttempt(attemptId, user.id);

  if (!attempt) {
    notFound();
  }

  const correctAnswers = attempt.answers.filter((a) => a.isCorrect).length;
  const incorrectAnswers = attempt.answers.filter((a) => !a.isCorrect && a.selectedOptionIds.length > 0).length;
  const unanswered = attempt.quiz.questions?.length
    ? attempt.answers.filter((a) => a.selectedOptionIds.length === 0).length +
      (attempt.quiz.questions.length - attempt.answers.length)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/dashboard/results"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Results
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          {attempt.quiz.category && (
            <Badge variant="secondary" className="mb-2">
              {attempt.quiz.category.name}
            </Badge>
          )}
          <h1 className="text-3xl font-bold">{attempt.quiz.title}</h1>
          <p className="text-muted-foreground mt-1">
            Submitted on {formatDateTime(attempt.submittedAt!)}
          </p>
        </div>
        <Badge
          variant={attempt.passed ? "success" : "destructive"}
          className="text-lg px-4 py-2"
        >
          {attempt.passed ? "PASSED" : "FAILED"}
        </Badge>
      </div>

      {/* Score Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                <Target className="h-4 w-4" />
                <span className="text-sm">Score</span>
              </div>
              <p className="text-4xl font-bold">
                {attempt.score?.toFixed(0) || 0}
                <span className="text-lg text-muted-foreground">
                  /{attempt.quiz.totalMarks}
                </span>
              </p>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                <Trophy className="h-4 w-4" />
                <span className="text-sm">Percentage</span>
              </div>
              <p className="text-4xl font-bold text-primary">
                {attempt.percentage?.toFixed(0) || 0}%
              </p>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Correct</span>
              </div>
              <p className="text-4xl font-bold text-green-500">{correctAnswers}</p>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                <X className="h-4 w-4 text-red-500" />
                <span className="text-sm">Incorrect</span>
              </div>
              <p className="text-4xl font-bold text-red-500">{incorrectAnswers}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Your Score</span>
              <span>Passing: {attempt.quiz.passingMarks}/{attempt.quiz.totalMarks}</span>
            </div>
            <Progress value={attempt.percentage || 0} />
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Correct Answers</p>
              <p className="text-xl font-bold">{correctAnswers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <X className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Incorrect Answers</p>
              <p className="text-xl font-bold">{incorrectAnswers}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unanswered</p>
              <p className="text-xl font-bold">{unanswered}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions Review */}
      <Card>
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
          <CardDescription>
            Review your answers with explanations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {attempt.answers.map((answer, index) => {
            const question = answer.question;
            const correctOptions = question.options.filter((o) => o.isCorrect);
            const selectedOptions = question.options.filter((o) =>
              answer.selectedOptionIds.includes(o.id)
            );

            return (
              <div key={answer.id} className="space-y-4">
                {index > 0 && <Separator />}

                <div className="flex items-start gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      answer.isCorrect
                        ? "bg-green-500/20 text-green-500"
                        : "bg-red-500/20 text-red-500"
                    }`}
                  >
                    {answer.isCorrect ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium">
                        Q{index + 1}. {question.question}
                      </h4>
                      <Badge variant="outline">{question.marks} mark(s)</Badge>
                    </div>

                    <div className="grid gap-2">
                      {question.options.map((option) => {
                        const isSelected = answer.selectedOptionIds.includes(option.id);
                        const isCorrectOption = option.isCorrect;

                        let bgClass = "bg-muted/50";
                        if (isCorrectOption) bgClass = "bg-green-500/10 border-green-500/50";
                        else if (isSelected && !isCorrectOption) bgClass = "bg-red-500/10 border-red-500/50";

                        return (
                          <div
                            key={option.id}
                            className={`p-3 rounded-lg border ${bgClass}`}
                          >
                            <div className="flex items-center gap-2">
                              {isCorrectOption && (
                                <Check className="h-4 w-4 text-green-500" />
                              )}
                              {isSelected && !isCorrectOption && (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                              <span>{option.text}</span>
                              {isSelected && (
                                <Badge variant="outline" className="ml-auto text-xs">
                                  Your answer
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation && (
                      <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-600 mb-1">
                          Explanation
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Link href={`/dashboard/quizzes/${attempt.quiz.id}`}>
          <Button variant="outline">Retake Quiz</Button>
        </Link>
        <Link href="/dashboard/quizzes">
          <Button>Browse More Quizzes</Button>
        </Link>
      </div>
    </div>
  );
}
