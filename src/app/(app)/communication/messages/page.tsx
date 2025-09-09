
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Search, Send, Loader2, MessageSquare, PlusCircle } from "lucide-react";
import { getConversations, getMessages, sendMessage, startConversation, Conversation, Message } from '@/services/messageService';
import { useToast } from '@/hooks/use-toast';
import { getStaffMembers } from '@/services/staffService';
import { getStudents } from '@/services/studentService';
import { Staff, Student } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// In a real app, this would come from an authentication context
const CURRENT_USER_ID = "admin_user_01"; 
const CURRENT_USER_NAME = "Admin"; 

type Contact = (Student | Staff) & { type: 'student' | 'staff' };

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const { toast } = useToast();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);

    const fetchConversations = async () => {
        setIsLoadingConversations(true);
        try {
            const convos = await getConversations(CURRENT_USER_ID);
            setConversations(convos);
            if (convos.length > 0 && !selectedConversation) {
                setSelectedConversation(convos[0]);
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not fetch conversations.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingConversations(false);
        }
    };
    
    useEffect(() => {
        fetchConversations();
    }, [toast]);

    useEffect(() => {
        if (!selectedConversation) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const msgs = await getMessages(selectedConversation.id);
                setMessages(msgs);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Could not fetch messages for this conversation.",
                    variant: "destructive",
                });
            } finally {
                setIsLoadingMessages(false);
            }
        };
        fetchMessages();
    }, [selectedConversation, toast]);
    
    useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages]);

    const handleNewMessageOpen = async (isOpen: boolean) => {
        setIsNewMessageOpen(isOpen);
        if(isOpen && contacts.length === 0) {
            setIsLoadingContacts(true);
            try {
                const [students, staff] = await Promise.all([getStudents(), getStaffMembers()]);
                const allContacts: Contact[] = [
                    ...students.map(s => ({ ...s, type: 'student' as const })),
                    ...staff.map(s => ({ ...s, type: 'staff' as const }))
                ];
                setContacts(allContacts);
            } catch (error) {
                toast({ title: "Error", description: "Could not load contacts.", variant: "destructive" });
            } finally {
                setIsLoadingContacts(false);
            }
        }
    }

    const handleSelectContact = async (contact: Contact) => {
        try {
            const newConversation = await startConversation(CURRENT_USER_ID, contact.id, contact.name);
            await fetchConversations();
            setSelectedConversation(newConversation);
            setIsNewMessageOpen(false);
        } catch (error) {
            toast({ title: "Error", description: "Could not start new conversation.", variant: "destructive" });
        }
    }


    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('') || '';
    }
    
    const getParticipantDetails = (convo: Conversation) => {
        return convo.participantDetails.find(p => p.id !== CURRENT_USER_ID) || convo.participantDetails[0];
    }

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedConversation) return;

        const text = messageInput;
        setMessageInput('');

        try {
            const newMessage = await sendMessage(selectedConversation.id, CURRENT_USER_ID, text);
            setMessages(prev => [...prev, newMessage]);
            setConversations(prev => prev.map(conv => 
                conv.id === selectedConversation.id 
                    ? { ...conv, lastMessage: { text, senderId: CURRENT_USER_ID, timestamp: new Date().toISOString() } }
                    : conv
            ).sort((a,b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()));
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send message.",
                variant: "destructive",
            });
            setMessageInput(text);
        }
    }

  return (
    <div className="flex h-[calc(100vh_-_8rem)]">
        <Card className="w-1/3 flex flex-col">
            <CardHeader className="p-4 border-b">
                 <div className="flex justify-between items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search conversations..." className="w-full rounded-lg bg-background pl-8" />
                    </div>
                     <Dialog open={isNewMessageOpen} onOpenChange={handleNewMessageOpen}>
                        <DialogTrigger asChild>
                             <Button variant="ghost" size="icon" className="ml-2">
                                <PlusCircle />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Message</DialogTitle>
                                <DialogDescription>Select a person to start a conversation.</DialogDescription>
                            </DialogHeader>
                            <Command>
                                <CommandInput placeholder="Search students or staff..." />
                                <CommandList>
                                    <CommandEmpty>{isLoadingContacts ? 'Loading contacts...' : 'No results found.'}</CommandEmpty>
                                    <ScrollArea className="h-64">
                                        <CommandGroup heading="Staff">
                                            {contacts.filter(c => c.type === 'staff').map(contact => (
                                                <CommandItem key={contact.id} onSelect={() => handleSelectContact(contact)}>
                                                    {contact.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandGroup heading="Students">
                                             {contacts.filter(c => c.type === 'student').map(contact => (
                                                <CommandItem key={contact.id} onSelect={() => handleSelectContact(contact)}>
                                                    {contact.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </ScrollArea>
                                </CommandList>
                            </Command>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <ScrollArea className="flex-1">
                <div className="p-2">
                    {isLoadingConversations ? (
                        <div className="flex justify-center items-center h-full p-8">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">No conversations started yet.</div>
                    ) : (
                        conversations.map(conv => {
                            const participant = getParticipantDetails(conv);
                            return (
                            <div 
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                    selectedConversation?.id === conv.id ? "bg-muted" : "hover:bg-muted/50"
                                )}
                            >
                                <Avatar className="relative h-12 w-12">
                                    <AvatarImage src={participant?.avatar} data-ai-hint="person photo" />
                                    <AvatarFallback>{getInitials(participant?.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 truncate">
                                    <p className="font-semibold">{participant?.name}</p>
                                    <p className="text-sm text-muted-foreground truncate">
                                        {conv.lastMessage.senderId === CURRENT_USER_ID && "You: "}
                                        {conv.lastMessage.text}
                                    </p>
                                </div>
                            </div>
                        )})
                    )}
                </div>
            </ScrollArea>
        </Card>
        
        {selectedConversation ? (
             <div className="w-2/3 flex flex-col bg-background border-t border-b border-r rounded-r-lg">
                <header className="flex items-center gap-4 p-4 border-b">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={getParticipantDetails(selectedConversation)?.avatar} data-ai-hint="person photo" />
                        <AvatarFallback>{getInitials(getParticipantDetails(selectedConversation)?.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-lg font-semibold">{getParticipantDetails(selectedConversation)?.name}</h2>
                    </div>
                </header>
                <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
                    <div className="flex flex-col gap-4">
                        {isLoadingMessages ? (
                             <div className="flex justify-center items-center h-full p-8">
                                <Loader2 className="animate-spin" />
                            </div>
                        ) : messages.map((msg, index) => {
                            const senderDetails = selectedConversation.participantDetails.find(p => p.id === msg.senderId);
                            const senderName = msg.senderId === CURRENT_USER_ID ? CURRENT_USER_NAME : senderDetails?.name || 'Unknown';
                            const senderAvatar = msg.senderId === CURRENT_USER_ID ? `https://picsum.photos/seed/${CURRENT_USER_ID}/100/100` : senderDetails?.avatar || '';

                            return (
                            <div key={index} className={cn(
                                "flex items-end gap-2",
                                msg.senderId === CURRENT_USER_ID ? 'justify-end' : 'justify-start'
                            )}>
                                {msg.senderId !== CURRENT_USER_ID && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={senderAvatar} data-ai-hint="person photo" />
                                        <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "max-w-xs rounded-xl p-3",
                                    msg.senderId === CURRENT_USER_ID ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                )}>
                                    <p className="text-sm">{msg.text}</p>
                                    <p className="text-xs text-right mt-1 opacity-70">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                            );
                        })}
                    </div>
                </ScrollArea>
                <footer className="p-4 border-t">
                    <div className="relative">
                        <Input 
                            placeholder="Type your message..." 
                            className="pr-12"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                            disabled={!messageInput}
                            onClick={handleSendMessage}
                        >
                            <Send className="h-5 w-5" />
                        </Button>
                    </div>
                </footer>
            </div>
        ) : (
            <div className="w-2/3 flex flex-col items-center justify-center bg-background border-t border-b border-r rounded-r-lg text-muted-foreground">
                <MessageSquare className="h-16 w-16" />
                <h3 className="mt-4 text-lg font-medium">Select a conversation</h3>
                <p className="mt-1 text-sm">Start messaging by selecting a conversation from the left panel.</p>
            </div>
        )}
    </div>
  );
}
