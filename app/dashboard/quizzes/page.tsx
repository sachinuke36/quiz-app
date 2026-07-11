import Link from "next/link";
import { BookOpen, Clock, HelpCircle, Lock, Unlock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getUserWithSubscription } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDuration } from "@/lib/utils";
import { redirect } from "next/navigation";

interface QuizzesPageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

async function getQuizzes(categoryId?: string) {
  const quizzes = await db.quiz.findMany({
    where: {
      isPublished: true,
      ...(categoryId && { categoryId }),
    },
    include: {
      category: true,
      plans: true,
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  return { quizzes, categories };
}

function checkQuizAccess(
  quiz: { isFree: boolean; plans: { id: string }[] },
  userPlanIds: string[]
): { hasAccess: boolean; reason: string } {
  // Free quizzes are accessible to everyone
  if (quiz.isFree) {
    return { hasAccess: true, reason: "Free" };
  }

  // Quiz requires subscription
  if (quiz.plans.length === 0) {
    // No specific plans, any subscription works
    return userPlanIds.length > 0
      ? { hasAccess: true, reason: "Subscribed" }
      : { hasAccess: false, reason: "Subscription required" };
  }

  // Check if user has any of the required plans
  const quizPlanIds = quiz.plans.map((p) => p.id);
  const hasMatchingPlan = quizPlanIds.some((planId) => userPlanIds.includes(planId));

  return hasMatchingPlan
    ? { hasAccess: true, reason: "Subscribed" }
    : { hasAccess: false, reason: "Upgrade required" };
}

export default async function QuizzesPage({ searchParams }: QuizzesPageProps) {
  const user = await getUserWithSubscription();
  if (!user) redirect("/login");

  const params = await searchParams;
  const { quizzes, categories } = await getQuizzes(params.category);
  const userPlanIds = user.subscriptions.map((s) => s.planId);

  const filteredQuizzes = params.search
    ? quizzes.filter((quiz) =>
        quiz.title.toLowerCase().includes(params.search!.toLowerCase())
      )
    : quizzes;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground mt-1">
            Browse and attempt available quizzes
          </p>
        </div>

        {userPlanIds.length === 0 && (
          <Link href="/dashboard/subscription">
            <Button variant="outline">
              <Lock className="h-4 w-4 mr-2" />
              Subscribe for More
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <form className="flex-1">
          <Input
            name="search"
            placeholder="Search quizzes..."
            defaultValue={params.search}
            className="max-w-sm"
          />
        </form>

        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard/quizzes">
            <Badge
              variant={!params.category ? "default" : "outline"}
              className="cursor-pointer"
            >
              All
            </Badge>
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/dashboard/quizzes?category=${category.id}`}
            >
              <Badge
                variant={params.category === category.id ? "default" : "outline"}
                className="cursor-pointer"
              >
                {category.name}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Quiz Grid */}
      {filteredQuizzes.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => {
            const access = checkQuizAccess(quiz, userPlanIds);

            return (
              <Card key={quiz.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="line-clamp-1">{quiz.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {quiz.category && (
                          <Badge variant="secondary">
                            {quiz.category.name}
                          </Badge>
                        )}
                        {quiz.isFree ? (
                          <Badge variant="success" className="gap-1">
                            <Unlock className="h-3 w-3" />
                            Free
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  {quiz.description && (
                    <CardDescription className="line-clamp-2 mt-2">
                      {quiz.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1 flex flex-col justify-end">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <HelpCircle className="h-4 w-4" />
                      <span>{quiz._count.questions} questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(quiz.durationMinutes)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {quiz._count.attempts} attempts
                    </div>
                    {access.hasAccess ? (
                      <Link href={`/dashboard/quizzes/${quiz.id}`}>
                        <Button>Start Quiz</Button>
                      </Link>
                    ) : (
                      <Link href="/dashboard/subscription">
                        <Button variant="outline">
                          <Lock className="h-4 w-4 mr-2" />
                          {access.reason}
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Quizzes Found</h3>
            <p className="text-muted-foreground">
              {params.search || params.category
                ? "Try adjusting your filters"
                : "Check back later for new quizzes"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
