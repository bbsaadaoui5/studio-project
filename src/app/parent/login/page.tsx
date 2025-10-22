"use client";

import { useState } from "react";

export const dynamic = 'force-dynamic';
import { useRouter } from "next/navigation";
// Firebase auth imports
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, UserRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";

export default function ParentLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/parent/dashboard");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: t('auth.loginFailed'), description: message || t('auth.invalidCredentials'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserRound /> {t('auth.parentLogin')}</CardTitle>
          <CardDescription>{t('auth.parentLoginDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="email" placeholder={t('auth.email')} value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder={t('auth.password')} value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
              {isLoading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


