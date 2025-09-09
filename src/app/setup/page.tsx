
"use client";

import { useEffect, useState } from "react";
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
import { Loader2, GraduationCap, ShieldCheck } from "lucide-react";
import { getStaffMembers, addStaffMember } from "@/services/staffService";

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Check if any staff members already exist.
    // If they do, this page should not be accessible.
    const checkInitialSetup = async () => {
        try {
            const staff = await getStaffMembers();
            if (staff.length > 0) {
                // An admin exists, so redirect to login.
                router.push('/login');
            } else {
                // No admin exists, show the setup form.
                setIsReady(true);
            }
        } catch (error) {
             toast({
                title: "Error",
                description: "Could not verify application setup status. Proceeding to setup.",
                variant: "destructive",
            });
            // If the check fails, it's safer to assume no admin exists.
            setIsReady(true);
        }
    };
    checkInitialSetup();
  }, [router, toast]);


  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
        toast({ title: "Missing fields", description: "Please fill out all fields.", variant: "destructive"});
        return;
    }
    setIsLoading(true);
    try {
      // This uses the same service as adding a new staff member.
      // We are creating an 'admin' role user.
      await addStaffMember({
        name,
        email,
        password,
        phone: '000-000-0000',
        address: 'N/A',
        dateOfBirth: new Date().toISOString(),
        qualifications: 'Initial Administrator',
        role: 'admin',
        department: 'Administration',
        salary: 0,
        gender: "other"
      });

      toast({
        title: "Administrator Created",
        description: "Your admin account is ready. Please log in.",
      });

      router.push("/login");
      
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Setup Failed",
        description: error.message || "Could not create the administrator account.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isReady) {
      return (
           <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
      )
  }

  return (
    <main className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="mb-4 flex justify-center">
                <div className="bg-primary rounded-md p-3">
                    <ShieldCheck className="h-8 w-8 text-primary-foreground" />
                </div>
            </div>
            <CardTitle className="text-2xl">Initial Administrator Setup</CardTitle>
            <CardDescription>Create the first admin account for CampusConnect.</CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                id="name"
                type="text"
                placeholder="e.g., Admin User"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
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
                {isLoading ? "Creating Account..." : "Create Admin Account"}
            </Button>
            </form>
        </CardContent>
        </Card>
    </main>
  );
}
