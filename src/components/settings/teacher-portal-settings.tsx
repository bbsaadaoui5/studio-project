import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Link2, Users, UserPlus } from "lucide-react";
import { getStaffMembers } from "@/services/staffService";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Teacher portal link generator removed as requested.
