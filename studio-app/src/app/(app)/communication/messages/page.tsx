
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Search, Send, Loader2, MessageSquare, PlusCircle } from "lucide-react";
import { getConversations, getMessages, sendMessage, startConversation, Conversation, Message } from '@/services/messageService';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n/translation-provider';
import { getStaffMembers } from '@/services/staffService';
import { getStudents } from '@/services/studentService';
import { Staff, Student } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// In a real app, this would come from an authentication context.
// When opened from the parent portal we accept a `parentName` query param and
// use that as a synthetic current-user identity for the page (display-only).

type Contact = (Student | Staff) & { type: 'student' | 'staff' };

export default function MessagesPage() {
    const searchParams = useSearchParams();
    const parentNameFromQuery = searchParams?.get?.('parentName') || null;
    const currentUserId = parentNameFromQuery ? `parent:${parentNameFromQuery}` : "admin_user_01";
    const currentUserName = parentNameFromQuery || "Admin";
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const { toast } = useToast();
    const { t } = useTranslation();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [isLoadingContacts, setIsLoadingContacts] = useState(false);

    const fetchConversations = useCallback(async () => {
        setIsLoadingConversations(true);
        try {
            const convos = await getConversations(currentUserId);
            setConversations(convos);
            if (convos.length > 0 && !selectedConversation) {
                setSelectedConversation(convos[0]);
            }
        } catch (error) {
            toast({
                title: 'خطأ',
                description: 'تعذر جلب المحادثات.',
                variant: "destructive",
            });
        } finally {
            setIsLoadingConversations(false);
        }
    }, [toast, selectedConversation, currentUserId]);
    
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // If a query param `withStudentId` is provided, start or open a conversation with that student.
    useEffect(() => {
        const studentId = searchParams?.get?.('withStudentId');
        if (!studentId) return;

        (async () => {
            try {
                const starterId = currentUserId;
                const starterName = currentUserName;
                // Start or fetch the conversation using the derived starter identity
                const convo = await startConversation(starterId, studentId, `محادثة ${starterName}`);
                // Refresh and select
                await fetchConversations();
                setSelectedConversation(convo);
            } catch (err) {
                // ignore; user will see empty state
                console.error('Failed to open conversation for studentId:', studentId, err);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                toast({ title: t('common.error'), description: t('common.couldNotFetchData'), variant: "destructive" });
            } finally {
                setIsLoadingContacts(false);
            }
        }
    }

    const handleSelectContact = async (contact: Contact) => {
        try {
            const newConversation = await startConversation(currentUserId, contact.id, contact.name);
            await fetchConversations();
            setSelectedConversation(newConversation);
            setIsNewMessageOpen(false);
        } catch (error) {
            toast({ title: t('common.error'), description: t('common.failedToSubmit'), variant: "destructive" });
        }
    }


    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('') || '';
    }
    
    const getParticipantDetails = (convo: Conversation) => {
        return convo.participantDetails.find(p => p.id !== currentUserId) || convo.participantDetails[0];
    }

    type TimestampLike = { toDate: () => Date };
    const isTimestampLike = (v: unknown): v is TimestampLike => {
        return !!v && typeof v === 'object' && typeof (v as TimestampLike).toDate === 'function';
    };

    const parseTimestamp = (ts: Conversation['lastMessage']['timestamp'] | Message['timestamp']): number => {
        if (!ts) return 0;
        if (typeof ts === 'string') return new Date(ts).getTime();
        if (isTimestampLike(ts)) {
            try { return ts.toDate().getTime(); } catch { return 0; }
        }
        return 0;
    }

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedConversation) return;

        const text = messageInput;
        setMessageInput('');

        try {
            const newMessage = await sendMessage(selectedConversation.id, currentUserId, text);
            setMessages(prev => [...prev, newMessage]);
            setConversations(prev => prev.map(conv => 
                conv.id === selectedConversation.id 
                    ? { ...conv, lastMessage: { text, senderId: currentUserId, timestamp: new Date().toISOString() } }
                    : conv
            ).sort((a,b) => parseTimestamp(b.lastMessage.timestamp) - parseTimestamp(a.lastMessage.timestamp)));
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
        {/* Add a page-level h2 (screen-reader only) so internal CardTitle/h3 headings
            don't violate heading order. h1 is provided at the root layout. */}
        <h2 className="sr-only">{t('messages.title') || 'الرسائل'}</h2>
        <Card className="w-1/3 flex flex-col">
            <CardHeader className="p-4 border-b">
                 <div className="flex justify-between items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="بحث في المحادثات..." className="w-full rounded-lg bg-background pl-8" />
                    </div>
                     <Dialog open={isNewMessageOpen} onOpenChange={handleNewMessageOpen}>
                         <DialogTrigger asChild>
                                 <Button data-testid="messages-new" variant="ghost" size="icon" className="ml-2" aria-label={t('messages.new') || 'New message'}>
                                    <PlusCircle />
                                    <span className="sr-only">{t('messages.new') || 'New message'}</span>
                                </Button>
                            </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>رسالة جديدة</DialogTitle>
                                <DialogDescription>اختر شخصاً لبدء محادثة.</DialogDescription>
                            </DialogHeader>
                            <Command>
                                <CommandInput placeholder="ابحث عن طالب أو موظف..." />
                                <CommandList>
                                    <CommandEmpty>{isLoadingContacts ? 'جاري تحميل جهات الاتصال...' : 'لا توجد نتائج.'}</CommandEmpty>
                                    <ScrollArea className="h-64">
                                        <CommandGroup heading="الموظفون">
                                            {contacts.filter(c => c.type === 'staff').map(contact => (
                                                <CommandItem key={contact.id} onSelect={() => handleSelectContact(contact)}>
                                                    {contact.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandGroup heading="الطلاب">
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
                <div className="p-2" data-testid="messages-list">
                    {isLoadingConversations ? (
                        <div className="flex justify-center items-center h-full p-8">
                            <Loader2 className="animate-spin" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">لا توجد محادثات بعد.</div>
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
                                        {conv.lastMessage.senderId === currentUserId && "أنت: "}
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
                            const senderName = msg.senderId === currentUserId ? currentUserName : senderDetails?.name || 'غير معروف';
                            const senderAvatar = msg.senderId === currentUserId ? `https://picsum.photos/seed/${encodeURIComponent(currentUserId)}/100/100` : senderDetails?.avatar || '';

                            return (
                            <div key={index} className={cn(
                                "flex items-end gap-2",
                                msg.senderId === currentUserId ? 'justify-end' : 'justify-start'
                            )}>
                                {msg.senderId !== currentUserId && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={senderAvatar} data-ai-hint="person photo" />
                                        <AvatarFallback>{getInitials(senderName)}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "max-w-xs rounded-xl p-3",
                                    msg.senderId === currentUserId ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                )}>
                                    <p className="text-sm">{msg.text}</p>
                                    <p className="text-xs text-right mt-1 opacity-70">
                                                {new Date(parseTimestamp(msg.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                            placeholder="اكتب رسالتك..." 
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
                            aria-label={t('messages.send') || 'Send message'}
                        >
                            <Send className="h-5 w-5" />
                            <span className="sr-only">{t('messages.send') || 'Send message'}</span>
                        </Button>
                    </div>
                </footer>
            </div>
        ) : (
            <div className="w-2/3 flex flex-col items-center justify-center bg-background border-t border-b border-r rounded-r-lg text-muted-foreground">
                <MessageSquare className="h-16 w-16" />
                <h3 className="mt-4 text-lg font-medium">اختر محادثة</h3>
                <p className="mt-1 text-sm">ابدأ المراسلة باختيار محادثة من القائمة الجانبية.</p>
            </div>
        )}
    </div>
  );
}
