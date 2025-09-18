
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateLessonPlan, GenerateLessonPlanOutput } from '@/ai/flows/generate-lesson-plan-flow';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, BookCopy, CheckSquare, ToyBrick, ListChecks } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function LessonPlannerPage() {
  const [topic, setTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<GenerateLessonPlanOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic || !gradeLevel) {
      toast({
        title: 'Error',
        description: 'Please provide a topic and select a grade level.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setGeneratedPlan(null);
    try {
      const result = { plan: "Mock lesson plan" };
      setGeneratedPlan(result);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error Generating Lesson Plan',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>AI Lesson Planner</CardTitle>
            <CardDescription>
              Enter a topic and grade level to generate a complete lesson plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., The Water Cycle"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="grade-level">Grade Level</Label>
               <Select onValueChange={setGradeLevel} value={gradeLevel}>
                <SelectTrigger id="grade-level">
                    <SelectValue placeholder="Select a grade..." />
                </SelectTrigger>
                <SelectContent>
                    {[...Array(12)].map((_, i) => (
                        <SelectItem key={i + 1} value={`Grade ${i + 1}`}>Grade {i + 1}</SelectItem>
                    ))}
                </SelectContent>
               </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
              {isLoading ? 'Generating...' : 'Generate Lesson Plan'}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="lg:col-span-2">
        <Card className="min-h-[600px]">
            {isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Creating your lesson plan...</p>
            </div>
            )}
            {!isLoading && !generatedPlan && (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <BookCopy className="mx-auto h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Your generated lesson plan will appear here.</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Enter a topic and grade level to begin.
                </p>
            </div>
            )}
            {generatedPlan && (
            <>
                <CardHeader>
                    <CardTitle className="text-2xl">{generatedPlan.title}</CardTitle>
                    <CardDescription>A lesson plan for {gradeLevel} on the topic of "{topic}".</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold"><CheckSquare /> Learning Objectives</h3>
                        <Separator className="my-2" />
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {generatedPlan.objectives.map((obj, i) => <li key={i}>{obj}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold"><ToyBrick /> Materials</h3>
                        <Separator className="my-2" />
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            {generatedPlan.materials.map((mat, i) => <li key={i}>{mat}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h3 className="flex items-center gap-2 text-lg font-semibold"><ListChecks /> Activities</h3>
                        <Separator className="my-2" />
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                             {generatedPlan.activities.map((act, i) => <li key={i}>{act}</li>)}
                        </ol>
                    </div>
                </CardContent>
            </>
            )}
        </Card>
      </div>
    </div>
  );
}
