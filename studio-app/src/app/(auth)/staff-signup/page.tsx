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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { getStaffByEmail } from "@/services/authService";

export default function StaffSignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast({
        title: "⚠️ تنبيه",
        description: "يرجى ملء جميع الحقول.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "⚠️ تنبيه",
        description: "كلمتا المرور غير متطابقتين.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "⚠️ تنبيه",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if auth is properly initialized
      if (!auth) {
        throw new Error("مصادقة Firebase غير مهيأة. يرجى التحقق من إعدادات البيئة.");
      }

      // Check if staff member exists with this email
      const staffMember = await getStaffByEmail(email);
      
      if (!staffMember) {
        // Show warning and return (don't throw)
        toast({
          title: "⚠️ تنبيه",
          description: "البريد الإلكتروني غير موجود في قاعدة بيانات الموظفين. يرجى التحقق من البريد أو الاتصال بالإدارة.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if staff member has a role (is authorized)
      if (!staffMember.role) {
        // Show warning and return (don't throw)
        toast({
          title: "⚠️ تنبيه",
          description: "حسابك لم يتم تفعيله بعد. يرجى الاتصال بالإدارة.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Try to create Firebase auth account
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "يمكنك الآن تسجيل الدخول باستخدام بياناتك.",
        });

        // Redirect to login
        router.push("/login");
      } catch (authError: any) {
        if (authError?.code === 'auth/email-already-in-use') {
          throw new Error("هذا البريد الإلكتروني مستخدم بالفعل. يرجى تسجيل الدخول.");
        }
        throw authError;
      }
      
    } catch (error: unknown) {
      console.error(error);
      const err = error as any;
      
      let errorMessage = "فشل إنشاء الحساب";
      
      if (err?.code === 'auth/email-already-in-use') {
        errorMessage = "هذا البريد الإلكتروني مستخدم بالفعل. يرجى تسجيل الدخول.";
      } else if (err?.code === 'auth/invalid-email') {
        errorMessage = "بريد إلكتروني غير صالح.";
      } else if (err?.code === 'auth/weak-password') {
        errorMessage = "كلمة المرور ضعيفة جداً.";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      toast({
        title: "⚠️ تنبيه",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border border-slate-200/70 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center h-28 w-28 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 transition-all duration-300 animate-pulse">
              <Image src="/icon-192.png" alt="" aria-hidden className="h-16 w-16 drop-shadow-lg" width={64} height={64} />
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
          <CardTitle className="text-2xl font-bold text-slate-900">
            إنشاء حساب موظف
          </CardTitle>
          <CardDescription className="text-slate-600 text-sm">
            قم بإنشاء حساب تسجيل دخول لموظف موجود في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-5 text-right">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني (من السجلات)</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                dir="rtl"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-right"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500 text-right">
                يجب أن يطابق البريد الإلكتروني المسجل في قاعدة بيانات الموظفين
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور الجديدة</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                dir="rtl"
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-right"
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••••"
                dir="rtl"
                required 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="text-right"
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              {isLoading 
                ? "جاري إنشاء الحساب..." 
                : "إنشاء الحساب"
              }
            </Button>
            
            {/* Back to Login Link */}
            <div className="text-center text-sm text-slate-700">
              <span className="text-muted-foreground">
                لديك حساب بالفعل؟{" "}
              </span>
              <button
                type="button"
                className="font-medium text-primary underline-offset-4 hover:underline"
                onClick={() => router.push("/login")}
                disabled={isLoading}
              >
                تسجيل الدخول
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
