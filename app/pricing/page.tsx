import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/utils";

async function getPlans() {
  const plans = await db.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
  return plans;
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

export default async function PricingPage() {
  const plans = await getPlans();

  // If no plans in database, show default pricing
  const displayPlans = plans.length > 0 ? plans : [
    { id: "1", name: "Basic", description: "For casual learners", price: 199, durationDays: 30 },
    { id: "2", name: "Pro", description: "For serious students", price: 499, durationDays: 30 },
    { id: "3", name: "Premium", description: "For professionals", price: 999, durationDays: 30 },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Header Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your learning goals. All plans include
              core features with no hidden fees.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {displayPlans.map((plan, index) => {
                const features = planFeatures[plan.name] || planFeatures.Basic;
                const isPopular = index === 1;

                return (
                  <Card
                    key={plan.id}
                    className={`relative ${
                      isPopular ? "border-primary shadow-lg scale-105" : ""
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary">Most Popular</Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>
                        {plan.description || `${plan.durationDays} days access`}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="text-center">
                      <div className="mb-6">
                        <span className="text-4xl font-bold">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-muted-foreground">
                          /{plan.durationDays} days
                        </span>
                      </div>

                      <ul className="space-y-3 text-left">
                        {features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter>
                      <Link href="/register" className="w-full">
                        <Button
                          className="w-full"
                          variant={isPopular ? "default" : "outline"}
                        >
                          Get Started
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div>
                <h3 className="font-semibold mb-2">How do I pay?</h3>
                <p className="text-muted-foreground text-sm">
                  We accept UPI payments. Simply scan the QR code, make the
                  payment, and submit your UTR number for verification.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  How long does verification take?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Payment verification usually takes 1-2 hours during business
                  hours. Once verified, your subscription is activated instantly.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Can I upgrade my plan?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes, you can upgrade anytime. The remaining days from your
                  current plan will be adjusted in the new subscription.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What if I need a refund?</h3>
                <p className="text-muted-foreground text-sm">
                  We offer a 7-day money-back guarantee if you&apos;re not
                  satisfied with the service. Contact support for assistance.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
