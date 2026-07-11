"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Receipt,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  utrNumber: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  plan: {
    id: string;
    name: string;
    durationDays: number;
  };
}

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      const res = await fetch("/api/payments");
      const data = await res.json();
      if (data.success) {
        setPayments(data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  }

  const statusConfig = {
    PENDING: {
      label: "Pending",
      variant: "warning" as const,
      icon: Clock,
    },
    APPROVED: {
      label: "Approved",
      variant: "success" as const,
      icon: CheckCircle,
    },
    REJECTED: {
      label: "Rejected",
      variant: "destructive" as const,
      icon: XCircle,
    },
  };

  const totalApproved = payments
    .filter((p) => p.status === "APPROVED")
    .reduce((acc, p) => acc + p.amount, 0);

  const pendingCount = payments.filter((p) => p.status === "PENDING").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/subscription"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Subscription
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Payment History</h1>
        <p className="text-muted-foreground mt-1">
          View all your transactions and payment status
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{payments.length}</p>
                <p className="text-xs text-muted-foreground">Total Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalApproved)}</p>
                <p className="text-xs text-muted-foreground">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending Verification</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Your complete payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>UTR Number</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const status = statusConfig[payment.status];
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{formatDate(payment.createdAt)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payment.plan.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.plan.durationDays} days
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {payment.utrNumber || "N/A"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Transactions Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven&apos;t made any payments yet.
              </p>
              <Link
                href="/dashboard/subscription"
                className="text-primary hover:underline"
              >
                View subscription plans
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Status Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <Badge variant="warning" className="gap-1 mt-0.5">
                <Clock className="h-3 w-3" />
                Pending
              </Badge>
              <p className="text-sm text-muted-foreground">
                Your payment is being verified. This usually takes 1-2 hours.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="success" className="gap-1 mt-0.5">
                <CheckCircle className="h-3 w-3" />
                Approved
              </Badge>
              <p className="text-sm text-muted-foreground">
                Payment verified! Your subscription is now active.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="destructive" className="gap-1 mt-0.5">
                <XCircle className="h-3 w-3" />
                Rejected
              </Badge>
              <p className="text-sm text-muted-foreground">
                Payment could not be verified. Please contact support.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
