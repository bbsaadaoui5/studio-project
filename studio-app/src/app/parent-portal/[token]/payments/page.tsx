"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { validateParentAccessToken } from "@/services/parentService";
import { getStudent } from "@/services/studentService";
import { getFeeStructureForGrade, getPaymentsForStudent, recordPayment, getCombinedMonthlyDueForStudent } from "@/services/financeService";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { format } from "date-fns";

export default function ParentPaymentsPage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [student, setStudent] = useState<any | null>(null);
  const [feeStructure, setFeeStructure] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [gradeMonthly, setGradeMonthly] = useState<number>(0);
  const [supportMonthly, setSupportMonthly] = useState<number>(0);
  const [combinedMonthly, setCombinedMonthly] = useState<number>(0);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<'card'|'cash'>('card');
  const [isPaying, setIsPaying] = useState(false);

  // Load Stripe.js using the publishable key from NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const stripePromise = typeof window !== 'undefined' ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '') : null;

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const studentId = await validateParentAccessToken(token);
        if (!studentId) {
          toast({ title: t('unauthorized.title'), description: t('unauthorized.description'), variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        const s = await getStudent(studentId);
        if (!s) {
          toast({ title: t('common.error'), description: t('payments.noStudent') || 'Failed to find student data.', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
  setStudent(s);
  const fs = await getFeeStructureForGrade(s.grade, s.enrollmentDate?.split('-')?.[0] || new Date().getFullYear().toString());
  setFeeStructure(fs);
  const pays = await getPaymentsForStudent(studentId);
  setPayments(pays);
  const totals = await getCombinedMonthlyDueForStudent(studentId, s.enrollmentDate?.split('-')?.[0] || new Date().getFullYear().toString());
  setGradeMonthly(totals.gradeMonthly || 0);
  setSupportMonthly(totals.supportMonthly || 0);
  setCombinedMonthly(totals.combinedMonthly || 0);
      } catch (err) {
        console.error(err);
        toast({ title: t('common.error'), description: t('payments.fetchError') || 'Failed to load payments data.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [token, toast, t]);

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalDue = (combinedMonthly || feeStructure?.monthlyAmount || 0) * 12;
  const balance = totalDue - totalPaid;

  const doPayment = async () => {
    if (!student) return;
    if (amount <= 0) {
      toast({ title: t('payments.invalidAmountTitle') || 'Invalid amount', description: t('payments.invalidAmountDesc') || 'Enter a valid amount.', variant: 'destructive' });
      return;
    }
    setIsPaying(true);
    try {
      if (method === 'card') {
        // We handle card payments client-side using Stripe Elements.
        // The CardElement confirm flow is implemented in the CardCheckout component below.
        // Trigger a click on the card form submit button by delegating to the CardCheckout handler.
        // Here we simply keep the state; the actual confirm happens in the card form.
        // The card form will call the same backend endpoint to create a PaymentIntent.
        // If Stripe isn't available, fall back to creating the intent server-side only.
        if (!stripePromise) {
          // fallback: create intent server-side and rely on webhook
          const resp = await fetch('/api/payments/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, studentId: student.id, token }),
          });
          const data = await resp.json();
          if (!resp.ok) throw new Error(data?.error || 'Failed to create payment');
          toast({ title: t('payments.startedTitle') || 'Payment started', description: t('payments.startedDesc') || 'Payment intent created. Payment will be recorded after confirmation.' });
          setAmount(0);
        }
      } else {
        // Cash or manual payments still record immediately
        const paymentRecord = await recordPayment({
          studentId: student.id,
          amount,
          date: new Date().toISOString(),
          month: format(new Date(), 'MMMM'),
          academicYear: feeStructure?.academicYear || new Date().getFullYear().toString(),
          method,
        });
        setPayments(prev => [paymentRecord, ...prev]);
        const methodLabel = method === 'cash' ? (t('payments.method.cash') || 'Cash') : (t('payments.method.card') || 'Card');
        toast({ title: t('payments.recordedTitle') || 'Payment recorded', description: t('payments.recordedDesc', { amount, method: methodLabel }) || `Recorded payment ${amount} ${methodLabel}` });
        setAmount(0);
      }
    } catch (err) {
      console.error(err);
        toast({ title: t('payments.failedTitle') || 'Payment failed', description: t('payments.failedDesc') || 'An error occurred while processing the payment.', variant: 'destructive' });
    } finally {
      setIsPaying(false);
    }
  };

  // Card checkout component using Stripe Elements
  function CardCheckout() {
    const stripe = useStripe();
    const elements = useElements();

    const handleCardSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
        if (!stripe || !elements || !student) {
        toast({ title: t('common.error'), description: t('payments.stripeUnavailable') || 'Stripe is not available right now. Try later.', variant: 'destructive' });
        return;
      }
      setIsPaying(true);
      try {
        const resp = await fetch('/api/payments/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, studentId: student?.id, token }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data?.error || 'Failed to create payment');

        const clientSecret = data.clientSecret;
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement) as any,
          },
        });

        if (result.error) {
          toast({ title: t('payments.failedTitle') || 'Payment failed', description: result.error.message || (t('payments.failedDesc') || 'Payment error'), variant: 'destructive' });
        } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
          // Optimistically update UI; webhook will also record the payment server-side
          const paymentRecord = { id: result.paymentIntent.id, amount, date: new Date().toISOString(), method: 'card' } as any;
          setPayments(prev => [paymentRecord, ...prev]);
          toast({ title: t('payments.succeededTitle') || 'Paid', description: t('payments.succeededDesc') || 'Payment confirmed successfully.' });
          setAmount(0);
        }
      } catch (err) {
        console.error(err);
        toast({ title: t('payments.failedTitle') || 'Payment failed', description: t('payments.failedDesc') || 'An error occurred while processing the payment.', variant: 'destructive' });
      } finally {
        setIsPaying(false);
      }
    };

    return (
      <form onSubmit={handleCardSubmit} className="space-y-3">
        <div>
          <label className="block mb-1">{t('payments.cardDetails') || 'Card details'}</label>
          <div className="p-3 border rounded">
            <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
          </div>
        </div>
        <div>
          <Button type="submit" disabled={isPaying || amount <= 0}>{isPaying ? (t('payments.processing') || 'Processing...') : (t('payments.cardPayButton') || 'Pay with card')}</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="min-h-screen container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{t('payments.title')}</h1>
      </header>
      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('payments.summaryTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                    <p>{t('common.loading')}</p>
                  ) : (
                    <div className="space-y-3">
                      <div><strong>{t('student.fullName') || 'Student'}:</strong> {student?.name}</div>
                      <div><strong>{t('common.grade') || 'Grade'}:</strong> {student?.grade}</div>
                      <div><strong>{t('payments.feeStructure') || 'Annual fee structure'}:</strong> {feeStructure ? `${feeStructure.monthlyAmount} / ${t('common.month') || 'month'}` : t('common.noData')}</div>
                      <div><strong>{t('finance.feeManagement.gradeMonthlyLabel') || 'Grade monthly'}:</strong> {gradeMonthly}</div>
                      <div><strong>{t('finance.feeManagement.supportMonthlyLabel') || 'Support monthly'}:</strong> {supportMonthly}</div>
                      <div><strong>{t('finance.feeManagement.totalMonthlyLabel') || 'Total monthly due'}:</strong> {(combinedMonthly || feeStructure?.monthlyAmount || 0)}</div>
                      <div><strong>{t('payments.totalPaid') || 'Total paid'}:</strong> {totalPaid}</div>
                      <div><strong>{t('payments.balance') || 'Balance'}:</strong> {balance}</div>
                    </div>
                  )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('payments.makePayment')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <label className="block mb-1">{t('common.amount')}</label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block mb-1">{t('common.paymentMethod')}</label>
                  <div className="flex gap-2">
                    <Button variant={method === 'card' ? 'default' : 'outline'} size="sm" onClick={() => setMethod('card')}>{t('payments.method.card')}</Button>
                    <Button variant={method === 'cash' ? 'default' : 'outline'} size="sm" onClick={() => setMethod('cash')}>{t('payments.method.cash')}</Button>
                  </div>
                </div>
                <div className="pt-3">
                  <div className="space-y-2">
                    {method === 'card' && stripePromise ? (
                      <Elements stripe={stripePromise as any}>
                        {/* CardCheckout handles the card confirm flow */}
                        <CardCheckout />
                      </Elements>
                    ) : (
                      <Button onClick={doPayment} disabled={isPaying}>{isPaying ? t('payments.processing') : t('payments.demoPay')}</Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>{t('payments.historyTitle')}</CardTitle>
              </CardHeader>
            <CardContent>
                {payments.length === 0 ? (
                  <p className="text-muted-foreground">{t('payments.noPayments')}</p>
                ) : (
                <ul className="space-y-2">
                  {payments.map(p => (
                    <li key={p.id} className="p-3 border rounded flex justify-between">
                      <div>
                        <div className="font-medium">{p.amount} — {p.method}</div>
                        <div className="text-sm text-muted-foreground">{new Date(p.date).toLocaleString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
