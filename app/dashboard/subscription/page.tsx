import Link from "next/link";
import { Check, CreditCard, AlertCircle, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getUserWithSubscription } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";

async function getPlansAndPayments(userId: string) {
  const [plans, pendingPayments] = await Promise.all([
    db.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    }),
    db.payment.findMany({
      where: { userId, status: "PENDING" },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { plans, pendingPayments };
}

const planFeatures: Record<string, string[]> = {
  Basic: [
    "Access to basic quizzes",
    "Progress tracking",
    "Basic analytics",
    "Email support",
  ],
  Pro: [
    "Access to all quizzes",
    "Advanced analytics",
    "Detailed explanations",
    "Priority support",
    "No ads",
  ],
  Premium: [
    "Everything in Pro",
    "Exclusive premium quizzes",
    "Certificate generation",
    "Team features",
    "API access",
    "24/7 phone support",
  ],
};

export default async function SubscriptionPage() {
  const user = await getUserWithSubscription();
  if (!user) redirect("/login");

  const { plans, pendingPayments } = await getPlansAndPayments(user.id);
  const activeSubscription = user.subscriptions[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your subscription and billing</p>
      </div>

      {/* Pending Payment Alert */}
      {pendingPayments.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pending Payment</AlertTitle>
          <AlertDescription>
            You have {pendingPayments.length} pending payment(s) awaiting verification.
            Your subscription will be activated once the payment is approved.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Subscription */}
      {activeSubscription ? (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="font-medium">{activeSubscription.plan.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Started On</p>
                <p className="font-medium">{formatDate(activeSubscription.startDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expires On</p>
                <p className="font-medium">{formatDate(activeSubscription.endDate)}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            Your subscription will automatically expire on {formatDate(activeSubscription.endDate)}.
            Renew before expiry to continue access.
          </CardFooter>
        </Card>
      ) : plans.length > 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Active Subscription</h3>
            <p className="text-muted-foreground mb-4">
              Subscribe to a plan to access all quizzes and features.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Free Access Notice when no plans exist */}
      {plans.length === 0 && !activeSubscription && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="p-6 text-center">
            <Gift className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Free Access</h3>
            <p className="text-muted-foreground mb-4">
              All quizzes are currently free! No subscription required.
            </p>
            <Link href="/dashboard/quizzes">
              <Button>Browse Quizzes</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      {plans.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {activeSubscription ? "Upgrade or Renew" : "Choose a Plan"}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => {
              const features = planFeatures[plan.name] || planFeatures.Basic;
              const isPopular = index === 1;
              const isCurrentPlan = activeSubscription?.plan.id === plan.id;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${isPopular ? "border-primary shadow-lg" : ""}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.description || `${plan.durationDays} days access`}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                      <span className="text-muted-foreground">/{plan.durationDays} days</span>
                    </div>

                    <ul className="space-y-2 text-left mb-6">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href={`/dashboard/subscription/purchase/${plan.id}`}>
                      <Button
                        className="w-full"
                        variant={isCurrentPlan ? "outline" : isPopular ? "default" : "outline"}
                      >
                        {isCurrentPlan ? "Renew Plan" : "Select Plan"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment History Link */}
      {plans.length > 0 && (
        <div className="text-center pt-4">
          <Link href="/dashboard/subscription/history">
            <Button variant="ghost">View Payment History</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
