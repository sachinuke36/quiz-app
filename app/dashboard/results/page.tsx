import Link from "next/link";
import { Trophy, Calendar, ArrowRight, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/utils";
import { redirect } from "next/navigation";

async function getAttempts(userId: string) {
  const attempts = await db.quizAttempt.findMany({
    where: { userId, submittedAt: { not: null } },
    include: {
      quiz: {
        include: { category: true },
      },
      _count: { select: { answers: true } },
    },
    orderBy: { submittedAt: "desc" },
  });

  const stats = await db.quizAttempt.aggregate({
    where: { userId, submittedAt: { not: null } },
    _count: true,
    _avg: { percentage: true },
  });

  const passedCount = await db.quizAttempt.count({
    where: { userId, passed: true },
  });

  return { attempts, stats, passedCount };
}

export default async function ResultsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { attempts, stats, passedCount } = await getAttempts(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Results</h1>
        <p className="text-muted-foreground mt-1">View your quiz attempt history</p>
      </div>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Attempts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats._count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats._avg.percentage?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quizzes Passed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{passedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats._count > 0
                ? ((passedCount / stats._count) * 100).toFixed(0)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attempts List */}
      {attempts.length > 0 ? (
        <div className="space-y-4">
          {attempts.map((attempt) => (
            <Card key={attempt.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Trophy
                        className={`h-6 w-6 ${
                          attempt.passed ? "text-green-500" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{attempt.quiz.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {attempt.quiz.category && (
                          <Badge variant="secondary" className="text-xs">
                            {attempt.quiz.category.name}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateTime(attempt.submittedAt!)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {attempt.percentage?.toFixed(0) || 0}%
                        </span>
                        <Badge variant={attempt.passed ? "success" : "destructive"}>
                          {attempt.passed ? "Passed" : "Failed"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Score: {attempt.score?.toFixed(0) || 0}/{attempt.quiz.totalMarks}
                      </p>
                    </div>

                    <Link href={`/dashboard/results/${attempt.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Results Yet</h3>
            <p className="text-muted-foreground mb-4">
              Take your first quiz to see your results here
            </p>
            <Link href="/dashboard/quizzes">
              <Button>Browse Quizzes</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
