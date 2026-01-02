
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { Loader2, GraduationCap } from "lucide-react";
import { sendPasswordResetEmail, signInWithCustomToken, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { getStaffMember } from "@/services/staffService";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [mode, setMode] = useState<"login" | "reset" | "otp">("login");
  const [isLoading, setIsLoading] = useState(false);

  const resetInputs = (nextMode: typeof mode) => {
    setMode(nextMode);
    setIsLoading(false);
    if (nextMode !== "login") {
      setPassword("");
    }
    if (nextMode !== "otp") {
      setOtpCode("");
      setOtpSent(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      toast({
        title: t("auth.invalidEmail") || "Invalid email",
        description: t("auth.email") || "Email is required",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("auth.otpSendFailed") || "Failed to send code.");
      }

      setOtpSent(true);
      toast({
        title: t("auth.otpSentTitle") || "Code sent",
        description: t("auth.otpSentDesc") || "Check your inbox for the 6-digit code.",
      });
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : t("auth.otpSendFailed") || "Failed to send code.";
      toast({
        title: t("auth.otpSendFailedTitle") || t('auth.loginFailed'),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Check if auth is properly initialized
      if (!auth) {
        throw new Error("Firebase authentication is not configured. Please check your environment variables.");
      }

      if (mode === "reset") {
        if (!email) {
          throw new Error(t("auth.invalidEmail") || "Invalid email format.");
        }

        await sendPasswordResetEmail(auth, email);

        toast({
          title: t("auth.resetEmailSentTitle") || "Reset link sent",
          description: t("auth.resetEmailSentDesc") || "Check your inbox for the reset link.",
        });
      } else if (mode === "otp") {
        if (!otpCode) {
          throw new Error(t("auth.otpRequired") || "Enter the 6-digit code.");
        }

        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code: otpCode }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || t("auth.otpInvalid") || "Invalid code.");
        }

        const { token } = await res.json();
        const userCredential = await signInWithCustomToken(auth, token);
        const user = userCredential.user;

        const staffMember = await getStaffMember(user.uid);
        if (!staffMember) {
          throw new Error("No staff profile found for this user.");
        }

        toast({
          title: t("auth.loginSuccessful"),
          description: t("auth.otpLoginSuccess") || "Signed in with code.",
        });

        if (staffMember.role === 'teacher') {
          router.push("/teacher/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const staffMember = await getStaffMember(user.uid);

        if (!staffMember) {
          throw new Error("No staff profile found for this user.");
        }

        toast({
          title: t('auth.loginSuccessful'),
          description: "Welcome back!",
        });

        if (staffMember.role === 'teacher') {
          router.push("/teacher/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
      
    } catch (error: unknown) {
      console.error(error);
      const err = error as any;
      
      // Handle specific Firebase auth errors
      let errorMessage = mode === "reset"
        ? t("auth.resetFailed") || t('auth.invalidCredentials')
        : mode === "otp"
          ? t("auth.otpInvalid") || t('auth.invalidCredentials')
          : t('auth.invalidCredentials');
      
      if (err?.code === 'auth/configuration-not-found') {
        errorMessage = 'Firebase Authentication is not configured. Please enable it in your Firebase Console.';
      } else if (err?.code === 'auth/user-not-found') {
        errorMessage = mode === "reset" ? (t("auth.userNotFound") || 'User not found.') : (t('auth.userNotFound') || 'User not found.');
      } else if (err?.code === 'auth/wrong-password') {
        errorMessage = t('auth.wrongPassword') || 'Incorrect password.';
      } else if (err?.code === 'auth/invalid-email') {
        errorMessage = t('auth.invalidEmail') || 'Invalid email format.';
      } else if (err?.code === 'auth/too-many-requests') {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      toast({
        title: mode === "reset"
          ? (t("auth.resetFailedTitle") || t('auth.loginFailed'))
          : mode === "otp"
            ? (t("auth.otpSendFailedTitle") || t('auth.loginFailed'))
            : t('auth.loginFailed'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
  <h1 className="sr-only">{t('auth.title')}</h1>
  <h2 className="sr-only">{t('auth.title')}</h2>
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
            <div className="bg-primary rounded-md p-3">
                <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
        </div>
        <CardTitle className="text-2xl">{t('auth.title')}</CardTitle>
        <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {mode === "login" && (
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
          {mode === "otp" && (
            <div className="space-y-2">
              <Label htmlFor="otp">{t("auth.otpCodeLabel")}</Label>
              <div className="flex gap-2">
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                />
                <Button type="button" variant="secondary" disabled={isLoading} onClick={handleSendOtp}>
                  {isLoading ? t("auth.sendingCode") : otpSent ? t("auth.resendCode") : t("auth.sendCode")}
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => resetInputs(mode === "reset" ? "login" : "reset")}
            >
              {mode === "reset" ? t("auth.backToLogin") : t("auth.forgotPassword")}
            </button>
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              onClick={() => resetInputs(mode === "otp" ? "login" : "otp")}
            >
              {mode === "otp" ? t("auth.backToLogin") : t("auth.useOtp")}
            </button>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            {mode === "login"
              ? (isLoading ? t('auth.loggingIn') : t('auth.login'))
              : mode === "reset"
                ? (isLoading ? t("auth.sendingReset") : t("auth.sendReset"))
                : (isLoading ? t("auth.verifyingCode") : t("auth.verifyAndLogin"))}
          </Button>
          
          {/* Sign Up Link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {t('auth.noAccount') || 'Don\'t have an account?'}{' '}
            </span>
            <button
              type="button"
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => router.push('/setup')}
            >
              {t('auth.signup') || 'Sign up here'}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
