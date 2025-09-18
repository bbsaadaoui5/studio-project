
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateAnnouncement, GenerateAnnouncementOutput } from '@/ai/flows/generate-announcement-flow';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Save, ClipboardCopy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { addAnnouncement } from '@/services/announcementService';

export default function AnnouncementsPage() {
  const [topic, setTopic] = useState('');
  const [generatedAnnouncement, setGeneratedAnnouncement] = useState<GenerateAnnouncementOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic) {
      toast({
        title: 'Error',
        description: 'Please enter a topic for the announcement.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    setGeneratedAnnouncement(null);
    try {
      const result = { announcement: "Mock announcement" };
      setGeneratedAnnouncement(result);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error Generating Announcement',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedAnnouncement) return;

    setIsSaving(true);
    try {
        await addAnnouncement(generatedAnnouncement);
        toast({
            title: "Announcement Saved",
            description: "The announcement has been successfully saved and published."
        });
    } catch (error) {
         toast({
            title: 'Error Saving Announcement',
            description: 'Could not save the announcement. Please try again.',
            variant: 'destructive',
      });
    } finally {
        setIsSaving(false);
    }
  }

  const handleCopy = () => {
    if (!generatedAnnouncement) return;
    const textToCopy = `Title: ${generatedAnnouncement.title}\n\nContent: ${generatedAnnouncement.content}`;
    navigator.clipboard.writeText(textToCopy);
    toast({
        title: "Copied!",
        description: "The announcement has been copied to your clipboard.",
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Generate Announcement</CardTitle>
          <CardDescription>
            Enter a topic, and the AI will generate a professional announcement for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="topic">Topic</Label>
              <Textarea
                id="topic"
                placeholder="e.g., Upcoming parent-teacher conference"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
            {isLoading ? 'Generating...' : 'Generate'}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className={!generatedAnnouncement && !isLoading ? "flex items-center justify-center" : ""}>
        {isLoading && (
           <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Generating your announcement...</p>
          </div>
        )}
        {!isLoading && !generatedAnnouncement && (
          <div className="text-center p-6">
             <Wand2 className="mx-auto h-12 w-12 text-muted-foreground" />
             <h3 className="mt-4 text-lg font-medium">Your generated announcement will appear here.</h3>
             <p className="mt-1 text-sm text-muted-foreground">
                Enter a topic on the left and click "Generate".
             </p>
          </div>
        )}
        {generatedAnnouncement && (
          <>
            <CardHeader>
              <CardTitle>Generated Announcement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="generated-title">Title</Label>
                    <Input id="generated-title" value={generatedAnnouncement.title} readOnly />
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="generated-content">Content</Label>
                    <Textarea id="generated-content" value={generatedAnnouncement.content} readOnly rows={8} />
                </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={handleCopy}>
                    <ClipboardCopy />
                    Copy to Clipboard
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                    {isSaving ? "Saving..." : "Save & Publish"}
                </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
