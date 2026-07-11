import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, HelpCircle, Trophy, AlertCircle, Play, Lock, Unlock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getUserWithSubscription } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDuration } from "@/lib/utils";

interface QuizDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getQuiz(id: string) {
  const quiz = await db.quiz.findUnique({
    where: { id, isPublished: true },
    include: {
      category: true,
      plans: true,
      _count: { select: { questions: true, attempts: true } },
    },
  });

  return quiz;
}

function checkQuizAccess(
  quiz: { isFree: boolean; plans: { id: string; name: string }[] },
  userPlanIds: string[]
): { hasAccess: boolean; reason: string } {
  if (quiz.isFree) {
    return { hasAccess: true, reason: "Free" };
  }

  if (quiz.plans.length === 0) {
    return userPlanIds.length > 0
      ? { hasAccess: true, reason: "Subscribed" }
      : { hasAccess: false, reason: "Subscription required" };
  }

  const quizPlanIds = quiz.plans.map((p) => p.id);
  const hasMatchingPlan = quizPlanIds.some((planId) => userPlanIds.includes(planId));

  return hasMatchingPlan
    ? { hasAccess: true, reason: "Subscribed" }
    : { hasAccess: false, reason: "Upgrade required" };
}

async function getUserAttempts(userId: string, quizId: string) {
  const attempts = await db.quizAttempt.findMany({
    where: { userId, quizId, submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    take: 5,
  });

  return attempts;
}

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const user = await getUserWithSubscription();
  if (!user) redirect("/login");

  const { id } = await params;
  const quiz = await getQuiz(id);

  if (!quiz) {
    notFound();
  }

  const userPlanIds = user.subscriptions.map((s) => s.planId);
  const access = checkQuizAccess(quiz, userPlanIds);
  const attempts = await getUserAttempts(user.id, quiz.id);
  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map(a => a.percentage || 0))
    : null;

  // Check for in-progress attempt
  const inProgressAttempt = await db.quizAttempt.findFirst({
    where: {
      userId: user.id,
      quizId: quiz.id,
      submittedAt: null,
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/dashboard/quizzes"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Quizzes
      </Link>

      {/* Quiz Header */}
      <div>
        {quiz.category && (
          <Badge variant="secondary" className="mb-2">
            {quiz.category.name}
          </Badge>
        )}
        <h1 className="text-3xl font-bold">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-muted-foreground mt-2">{quiz.description}</p>
        )}
      </div>

      {/* Quiz Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Questions</span>
            </div>
            <p className="text-2xl font-bold mt-1">{quiz._count.questions}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Duration</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {formatDuration(quiz.durationMinutes)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Passing</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {quiz.passingMarks}/{quiz.totalMarks}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Your Best</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {bestScore !== null ? `${bestScore.toFixed(0)}%` : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Access Badge */}
      <div className="flex items-center gap-2">
        {quiz.isFree ? (
          <Badge variant="success" className="gap-1">
            <Unlock className="h-3 w-3" />
            Free Quiz
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Premium Quiz
          </Badge>
        )}
      </div>

      {/* Warnings/Info */}
      {!access.hasAccess ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{access.reason}</AlertTitle>
          <AlertDescription>
            {quiz.plans.length > 0 ? (
              <div className="space-y-2">
                <p>You need one of the following plans to access this quiz:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {quiz.plans.map((plan) => (
                    <Badge key={plan.id} variant="secondary">
                      {plan.name}
                    </Badge>
                  ))}
                </div>
                <Link href="/dashboard/subscription" className="text-primary underline block mt-2">
                  View subscription plans
                </Link>
              </div>
            ) : (
              <>
                You need an active subscription to take this quiz.
                <Link href="/dashboard/subscription" className="ml-1 underline">
                  Subscribe now
                </Link>
              </>
            )}
          </AlertDescription>
        </Alert>
      ) : inProgressAttempt ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Quiz In Progress</AlertTitle>
          <AlertDescription>
            You have an ongoing attempt. Continue where you left off.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              You have <strong>{formatDuration(quiz.durationMinutes)}</strong> to complete this quiz
            </li>
            <li>
              There are <strong>{quiz._count.questions} questions</strong> worth{" "}
              <strong>{quiz.totalMarks} marks</strong>
            </li>
            <li>
              You need <strong>{quiz.passingMarks} marks</strong> to pass (
              {((quiz.passingMarks / quiz.totalMarks) * 100).toFixed(0)}%)
            </li>
            <li>You can navigate between questions using the navigation panel</li>
            <li>Your progress is saved automatically</li>
            <li>
              Once the timer runs out, your quiz will be automatically submitted
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Start Button */}
      <div className="flex justify-center">
        {access.hasAccess ? (
          <Link href={`/dashboard/quizzes/${quiz.id}/attempt`}>
            <Button size="lg" className="gap-2">
              <Play className="h-4 w-4" />
              {inProgressAttempt ? "Continue Quiz" : "Start Quiz"}
            </Button>
          </Link>
        ) : (
          <Link href="/dashboard/subscription">
            <Button size="lg" className="gap-2">
              <Lock className="h-4 w-4" />
              {quiz.plans.length > 0 ? "Upgrade to Start" : "Subscribe to Start"}
            </Button>
          </Link>
        )}
      </div>

      {/* Previous Attempts */}
      {attempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Attempts</CardTitle>
            <CardDescription>Previous attempts for this quiz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attempts.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">Attempt #{attempts.length - index}</p>
                    <p className="text-sm text-muted-foreground">
                      {attempt.submittedAt
                        ? new Date(attempt.submittedAt).toLocaleDateString()
                        : "In progress"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={attempt.passed ? "success" : "destructive"}>
                      {attempt.percentage?.toFixed(0) || 0}%
                    </Badge>
                    <Link href={`/dashboard/results/${attempt.id}`}>
                      <Button variant="link" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
