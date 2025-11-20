
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { getStaffMember } from "@/services/staffService";

export default function LoginPage() {
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
      
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: t('auth.loginFailed'),
        description: message || t('auth.invalidCredentials'),
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
        <form onSubmit={handleLogin} className="space-y-4">
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            {isLoading ? t('auth.loggingIn') : t('auth.login')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
