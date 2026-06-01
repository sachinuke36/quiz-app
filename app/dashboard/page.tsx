import Link from "next/link";
import { BookOpen, Trophy, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser, getUserWithSubscription } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDuration } from "@/lib/utils";

async function getDashboardData(userId: string) {
  const [quizStats, recentAttempts, availableQuizzes] = await Promise.all([
    db.quizAttempt.aggregate({
      where: { userId },
      _count: true,
      _avg: { percentage: true },
    }),
    db.quizAttempt.findMany({
      where: { userId },
      include: { quiz: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.quiz.findMany({
      where: { isPublished: true },
      include: {
        category: true,
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  return { quizStats, recentAttempts, availableQuizzes };
}

export default async function DashboardPage() {
  const user = await getUserWithSubscription();
  if (!user) return null;

  const { quizStats, recentAttempts, availableQuizzes } = await getDashboardData(user.id);
  const hasActiveSubscription = user.subscriptions.length > 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground mt-1">
            {hasActiveSubscription
              ? "Continue your learning journey"
              : "Subscribe to access all quizzes"}
          </p>
        </div>
        {hasActiveSubscription ? (
          <Link href="/dashboard/quizzes">
            <Button>
              Browse Quizzes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/dashboard/subscription">
            <Button>
              Subscribe Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Subscription Status */}
      {hasActiveSubscription && user.subscriptions[0] && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-medium">Active Plan: {user.subscriptions[0].plan.name}</p>
              <p className="text-sm text-muted-foreground">
                Expires on {formatDate(user.subscriptions[0].endDate)}
              </p>
            </div>
            <Link href="/dashboard/subscription">
              <Button variant="outline" size="sm">
                Manage Subscription
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes Taken</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizStats._count}</div>
            <p className="text-xs text-muted-foreground">Total attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quizStats._avg.percentage?.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Across all quizzes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Quizzes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableQuizzes.length}</div>
            <p className="text-xs text-muted-foreground">Ready to attempt</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Available Quizzes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Attempts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentAttempts.length > 0 ? (
              <div className="space-y-4">
                {recentAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-sm">{attempt.quiz.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(attempt.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          attempt.passed ? "success" : "destructive"
                        }
                      >
                        {attempt.percentage?.toFixed(0) || 0}%
                      </Badge>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/results">
                  <Button variant="ghost" className="w-full mt-2">
                    View All Results
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No quiz attempts yet. Start your first quiz!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Available Quizzes */}
        <Card>
          <CardHeader>
            <CardTitle>Available Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            {availableQuizzes.length > 0 ? (
              <div className="space-y-4">
                {availableQuizzes.slice(0, 4).map((quiz) => (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-sm">{quiz.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {quiz._count.questions} questions &bull;{" "}
                        {formatDuration(quiz.durationMinutes)}
                      </p>
                    </div>
                    {hasActiveSubscription ? (
                      <Link href={`/dashboard/quizzes/${quiz.id}`}>
                        <Button size="sm">Start</Button>
                      </Link>
                    ) : (
                      <Badge variant="secondary">Locked</Badge>
                    )}
                  </div>
                ))}
                <Link href="/dashboard/quizzes">
                  <Button variant="ghost" className="w-full mt-2">
                    View All Quizzes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No quizzes available yet. Check back soon!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
