"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, Loader2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
}

interface PurchasePageProps {
  params: Promise<{ planId: string }>;
}

export default function PurchasePage({ params }: PurchasePageProps) {
  const router = useRouter();
  const { planId } = use(params);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    utrNumber: "",
    screenshotUrl: "",
  });

  useEffect(() => {
    async function fetchPlan() {
      try {
        const res = await fetch(`/api/plans/${planId}`);
        const data = await res.json();
        if (data.success) {
          setPlan(data.data);
        } else {
          toast.error("Plan not found");
          router.push("/dashboard/subscription");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load plan");
      } finally {
        setLoading(false);
      }
    }
    fetchPlan();
  }, [planId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plan) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          amount: plan.price,
          utrNumber: formData.utrNumber,
          screenshotUrl: formData.screenshotUrl || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Payment submitted! Awaiting verification.");
        router.push("/dashboard/subscription");
      } else {
        toast.error(data.error || "Failed to submit payment");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard/subscription"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Subscription
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Complete Purchase</h1>
        <p className="text-muted-foreground mt-1">
          Pay via UPI and submit payment details
        </p>
      </div>

      {/* Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{plan.name}</p>
              <p className="text-sm text-muted-foreground">
                {plan.durationDays} days access
              </p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(plan.price)}</p>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardHeader>
          <CardTitle>Scan QR Code to Pay</CardTitle>
          <CardDescription>
            Use any UPI app to scan and pay
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="w-48 h-48 bg-muted rounded-lg mx-auto flex items-center justify-center mb-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                QR Code will be displayed here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (Configure in admin settings)
              </p>
            </div>
          </div>
          <p className="font-medium">Pay {formatCurrency(plan.price)}</p>
          <p className="text-sm text-muted-foreground">
            UPI ID: payments@quizmaster
          </p>
        </CardContent>
      </Card>

      {/* Payment Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            After payment, enter your transaction details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="utrNumber">UTR / Transaction ID *</Label>
              <Input
                id="utrNumber"
                value={formData.utrNumber}
                onChange={(e) =>
                  setFormData({ ...formData, utrNumber: e.target.value })
                }
                placeholder="Enter 12-digit UTR number"
                required
              />
              <p className="text-xs text-muted-foreground">
                You can find this in your UPI app&apos;s transaction history
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenshotUrl">Screenshot URL (Optional)</Label>
              <Input
                id="screenshotUrl"
                type="url"
                value={formData.screenshotUrl}
                onChange={(e) =>
                  setFormData({ ...formData, screenshotUrl: e.target.value })
                }
                placeholder="Paste image URL or upload link"
              />
              <p className="text-xs text-muted-foreground">
                Upload screenshot to any image hosting service and paste the link
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Before submitting:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  Ensure payment of {formatCurrency(plan.price)} is complete
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  Double-check your UTR number
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5" />
                  Verification typically takes 1-2 hours
                </li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Payment"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
