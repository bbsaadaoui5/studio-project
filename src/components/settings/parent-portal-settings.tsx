import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Link2, Users, UserPlus, UserMinus } from "lucide-react";
import { getStudents } from "@/services/studentService";
import { generateParentAccessToken, getParentAccessLink } from "@/services/parentService";
import { getParents, linkStudentToParent, unlinkStudentFromParent, createOrUpdateParent } from "@/services/parentAccountService";
import { createAuthUser } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export default function ParentPortalSettings() {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [parentLink, setParentLink] = useState<string | null>(null);
  
  // Parent creation form state
  const [showCreateParent, setShowCreateParent] = useState(false);
  const [newParent, setNewParent] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    linkedStudentIds: [] as string[]
  });
  const [isCreatingParent, setIsCreatingParent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [studentsData, parentsData] = await Promise.all([
          getStudents(),
          getParents()
        ]);
        setStudents(studentsData);
        setParents(parentsData);
      } catch (error) {
        toast({ title: "Error", description: "Could not fetch data.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const handleGenerateLink = async () => {
    if (!selectedStudentId) return;
    setIsGenerating(true);
    try {
      await generateParentAccessToken(selectedStudentId);
      const link = await getParentAccessLink(selectedStudentId);
      setParentLink(link);
      toast({ title: "Success", description: "Parent portal link generated." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate link.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (parentLink) {
      navigator.clipboard.writeText(parentLink);
      toast({ title: "Copied", description: "Link copied to clipboard." });
    }
  };

  const handleLinkStudent = async () => {
    if (!selectedParentId || !selectedStudentId) return;
    try {
      await linkStudentToParent(selectedParentId, selectedStudentId);
      toast({ title: "Success", description: "Student linked to parent." });
      // Refresh parents data to show updated linked students
      const parentsData = await getParents();
      setParents(parentsData);
    } catch (error) {
      toast({ title: "Error", description: "Failed to link student.", variant: "destructive" });
    }
  };

  const handleUnlinkStudent = async (parentId: string, studentId: string) => {
    try {
      await unlinkStudentFromParent(parentId, studentId);
      toast({ title: "Success", description: "Student unlinked from parent." });
      // Refresh parents data
      const parentsData = await getParents();
      setParents(parentsData);
    } catch (error) {
      toast({ title: "Error", description: "Failed to unlink student.", variant: "destructive" });
    }
  };

  const handleCreateParent = async () => {
    if (!newParent.name || !newParent.email || !newParent.password) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsCreatingParent(true);
    try {
      // Create Firebase Auth user
      const authUid = await createAuthUser(newParent.email, newParent.password);
      
      // Create parent profile
      const parentData = {
        id: authUid,
        name: newParent.name,
        email: newParent.email,
        phone: newParent.phone || "",
        linkedStudentIds: newParent.linkedStudentIds,
        status: "active" as const
      };
      
      await createOrUpdateParent(parentData);
      
      toast({ title: "Success", description: "Parent account created successfully." });
      
      // Reset form and refresh data
      setNewParent({ name: "", email: "", password: "", phone: "", linkedStudentIds: [] });
      setShowCreateParent(false);
      const parentsData = await getParents();
      setParents(parentsData);
      
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create parent account.", 
        variant: "destructive" 
      });
    } finally {
      setIsCreatingParent(false);
    }
  };

  const toggleStudentLink = (studentId: string) => {
    const isLinked = newParent.linkedStudentIds.includes(studentId);
    if (isLinked) {
      setNewParent(prev => ({
        ...prev,
        linkedStudentIds: prev.linkedStudentIds.filter(id => id !== studentId)
      }));
    } else {
      setNewParent(prev => ({
        ...prev,
        linkedStudentIds: [...prev.linkedStudentIds, studentId]
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Token Link Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Parent Portal Link Generator</CardTitle>
          <CardDescription>Generate and copy parent portal links for any student.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="student-select">Select Student</Label>
                <select
                  id="student-select"
                  className="w-full border rounded px-3 py-2"
                  value={selectedStudentId}
                  onChange={e => {
                    setSelectedStudentId(e.target.value);
                    setParentLink(null);
                  }}
                >
                  <option value="">-- Select a student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.grade} - {s.className})</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleGenerateLink} disabled={!selectedStudentId || isGenerating}>
                {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Link2 className="mr-2" />}
                {isGenerating ? "Generating..." : "Generate/Refresh Link"}
              </Button>
              {parentLink && (
                <div className="flex items-center gap-2 mt-4">
                  <Input value={parentLink} readOnly className="flex-1" />
                  <Button variant="outline" onClick={handleCopy}><Copy className="mr-1 h-4 w-4" />Copy</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create New Parent Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Parent Account
          </CardTitle>
          <CardDescription>Create a new parent account with login credentials.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!showCreateParent ? (
            <Button onClick={() => setShowCreateParent(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create New Parent Account
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent-name">Parent Name *</Label>
                  <Input
                    id="parent-name"
                    value={newParent.name}
                    onChange={(e) => setNewParent(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter parent's full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent-email">Email *</Label>
                  <Input
                    id="parent-email"
                    type="email"
                    value={newParent.email}
                    onChange={(e) => setNewParent(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent-password">Password *</Label>
                  <Input
                    id="parent-password"
                    type="password"
                    value={newParent.password}
                    onChange={(e) => setNewParent(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent-phone">Phone (Optional)</Label>
                  <Input
                    id="parent-phone"
                    value={newParent.phone}
                    onChange={(e) => setNewParent(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Link Students (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-3">
                  {students.map((student) => (
                    <label key={student.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newParent.linkedStudentIds.includes(student.id)}
                        onChange={() => toggleStudentLink(student.id)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {student.name} (Grade {student.grade} - {student.className})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateParent} 
                  disabled={isCreatingParent}
                >
                  {isCreatingParent ? <Loader2 className="animate-spin mr-2" /> : null}
                  {isCreatingParent ? "Creating..." : "Create Parent Account"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateParent(false);
                    setNewParent({ name: "", email: "", password: "", phone: "", linkedStudentIds: [] });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parent-Student Linking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Link Students to Existing Parents
          </CardTitle>
          <CardDescription>Associate students with existing parent accounts for dashboard access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Select Parent</Label>
              <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a parent" />
                </SelectTrigger>
                <SelectContent>
                  {parents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name} ({parent.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} (Grade {student.grade} - {student.className})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={handleLinkStudent} 
            disabled={!selectedParentId || !selectedStudentId}
            className="w-full"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Link Student to Parent
          </Button>

          {/* Show existing parent-student relationships */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Parent-Student Links</h3>
            {parents.map((parent) => (
              <div key={parent.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{parent.name}</h4>
                    <p className="text-sm text-muted-foreground">{parent.email}</p>
                  </div>
                  <Badge variant="outline">
                    {parent.linkedStudentIds?.length || 0} student(s)
                  </Badge>
                </div>
                <div className="space-y-2">
                  {parent.linkedStudentIds?.map((studentId: string) => {
                    const student = students.find(s => s.id === studentId);
                    return student ? (
                      <div key={studentId} className="flex items-center justify-between bg-gray-50 rounded p-2">
                        <span className="text-sm">
                          {student.name} (Grade {student.grade} - {student.className})
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnlinkStudent(parent.id, studentId)}
                        >
                          <UserMinus className="h-3 w-3 mr-1" />
                          Unlink
                        </Button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
