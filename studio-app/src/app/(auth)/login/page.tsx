
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { getStaffMember } from "@/services/staffService";
import { getStaffByEmail } from "@/services/authService";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [isLoading, setIsLoading] = useState(false);

  const resetInputs = (nextMode: typeof mode) => {
    setMode(nextMode);
    setIsLoading(false);
    if (nextMode !== "login") {
      setPassword("");
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
          title: t("auth.resetEmailSentTitle") || "تم إرسال رابط الاستعادة",
          description: t("auth.resetEmailSentDesc") || "يرجى التحقق من بريدك للحصول على الرابط.",
        });
      } else {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
        
          // Try to get staff by UID first, then fallback to email
          let staffMember = await getStaffMember(user.uid);
        
          if (!staffMember) {
            // Fallback: try to get staff by email
            staffMember = await getStaffByEmail(email);
          }

          if (!staffMember) {
            throw new Error(t("auth.staffProfileNotFound") || "لم يتم العثور على ملف تعريف الموظف. يرجى الاتصال بالمسؤول.");
          }

          toast({
            title: 'تم تسجيل الدخول بنجاح',
            description: 'مرحباً بعودتك!',
          });

          if (staffMember.role === 'teacher') {
            router.push("/teacher/dashboard");
          } else {
            router.push("/dashboard");
          }
        } catch (loginError: unknown) {
          const err = loginError as any;
          
          // Handle login errors gracefully with Arabic messages
          if (err?.code === 'auth/invalid-login-credentials') {
            toast({
              title: "⚠️ تحذير",
              description: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
              variant: "destructive",
            });
          } else if (err?.code === 'auth/user-not-found') {
            toast({
              title: "⚠️ تحذير",
              description: "المستخدم غير موجود.",
              variant: "destructive",
            });
          } else if (err instanceof Error) {
            toast({
              title: "⚠️ تحذير",
              description: err.message,
              variant: "destructive",
            });
          } else {
            toast({
              title: "⚠️ تحذير",
              description: "بيانات الدخول غير صحيحة",
              variant: "destructive",
            });
          }
        }
      }
      
    } catch (error: unknown) {
      console.error(error);
      const err = error as any;
      
      // Handle specific Firebase auth errors with Arabic messages
      let errorMessage = "بيانات الدخول غير صحيحة";
      let errorTitle = "فشل تسجيل الدخول";
      
      if (err?.code === 'auth/configuration-not-found') {
        errorMessage = 'مصادقة Firebase غير مهيأة. يرجى تفعيلها في وحدة التحكم.';
      } else if (err?.code === 'auth/invalid-login-credentials') {
        errorMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (err?.code === 'auth/user-not-found') {
        errorMessage = 'المستخدم غير موجود.';
      } else if (err?.code === 'auth/wrong-password') {
        errorMessage = 'كلمة المرور غير صحيحة.';
      } else if (err?.code === 'auth/invalid-email') {
        errorMessage = 'بريد إلكتروني غير صالح.';
      } else if (err?.code === 'auth/too-many-requests') {
        errorMessage = 'محاولات كثيرة. يرجى المحاولة لاحقاً.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      toast({
        title: mode === "reset" ? "تعذر إرسال الرابط" : "⚠️ تحذير",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-md shadow-xl border border-slate-200/70 bg-white/95 backdrop-blur-sm">
        <h1 className="sr-only">{t('auth.title') || 'تسجيل الدخول'}</h1>
        <h2 className="sr-only">{t('auth.title') || 'تسجيل الدخول'}</h2>
        <CardHeader className="text-center space-y-3 sm:space-y-4">
          <div className="mx-auto flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 animate-pulse">
              <Image src="/icon-192.png" alt="" aria-hidden className="h-12 sm:h-16 w-12 sm:w-16 drop-shadow-lg" width={64} height={64} />
              <p className="text-white font-black text-sm mt-2 leading-none px-1" style={{ 
                fontFamily: "'Arabic Typesetting', 'Simplified Arabic', 'Traditional Arabic', serif",
                fontWeight: 900,
                letterSpacing: '0.06em',
                textShadow: '0 3px 6px rgba(0,0,0,0.5), 0 0 12px rgba(255,255,255,0.25)',
                WebkitTextStroke: '0.7px rgba(255,255,255,0.4)',
                transform: 'scaleY(1.3) scaleX(0.85)',
                fontStyle: 'italic',
                whiteSpace: 'nowrap'
              }}>
                مؤسسة الموعد
              </p>
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-slate-900">
            تسجيل الدخول
          </CardTitle>
          <CardDescription className="text-slate-600 text-xs sm:text-sm">
            أدخل بياناتك للوصول إلى لوحة التحكم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 text-right">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                dir="rtl"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-right"
              />
            </div>
            {mode === "login" && (
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••"
                    dir="rtl"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-right"
                />
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="text-primary underline-offset-4 hover:underline"
                onClick={() => resetInputs(mode === "reset" ? "login" : "reset")}
              >
                {mode === "reset" ? 'العودة لتسجيل الدخول' : 'نسيت كلمة المرور؟'}
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              {mode === "login"
                ? (isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول')
                : (isLoading ? 'جاري إرسال الرابط...' : 'إرسال رابط الاستعادة')}
            </Button>
            
            {/* Sign Up Link */}
            <div className="text-center text-sm text-slate-700">
              <span className="text-muted-foreground">
                ليس لديك حساب؟{' '}
              </span>
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => router.push('/staff-signup')}
              >
                سجّل هنا
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
