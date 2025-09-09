
import { db } from "@/lib/firebase-client";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { Staff, Student } from "@/lib/types";

export interface Conversation {
  id: string;
  participantIds: string[];
  participantDetails: {
      id: string;
      name: string;
      avatar: string;
  }[];
  lastMessage: {
    text: string;
    timestamp: any;
    senderId: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: any;
}

const CONVERSATIONS_COLLECTION = "conversations";
const MESSAGES_COLLECTION = "messages";


export const getConversations = async (userId: string): Promise<Conversation[]> => {
  try {
    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where("participantIds", "array-contains", userId),
      orderBy("lastMessage.timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    const conversations: Conversation[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lastMessage.timestamp && typeof data.lastMessage.timestamp.toDate === 'function') {
            data.lastMessage.timestamp = data.lastMessage.timestamp.toDate().toISOString();
        }
        conversations.push(data as Conversation);
    });
    return conversations;
  } catch (error) {
    console.error("Error getting conversations:", error);
    throw new Error("Failed to fetch conversations.");
  }
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
    try {
        const q = query(
            collection(db, MESSAGES_COLLECTION),
            where("conversationId", "==", conversationId),
            orderBy("timestamp", "asc")
        );
        const querySnapshot = await getDocs(q);
        const messages: Message[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.timestamp && typeof data.timestamp.toDate === 'function') {
                data.timestamp = data.timestamp.toDate().toISOString();
            }
            messages.push(data as Message);
        });
        return messages;
    } catch (error) {
        console.error("Error getting messages:", error);
        throw new Error("Failed to fetch messages.");
    }
};

export const sendMessage = async (conversationId: string, senderId: string, text: string): Promise<Message> => {
     try {
        // 1. Create the new message document
        const newMessageData = {
            conversationId,
            senderId,
            text,
            timestamp: serverTimestamp(),
        };
        const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), newMessageData);
        const newMessage = { id: docRef.id, ...newMessageData };
        await updateDoc(docRef, { id: docRef.id });

        // 2. Update the conversation's lastMessage field
        const convoRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
        await updateDoc(convoRef, {
            lastMessage: {
                text,
                timestamp: serverTimestamp(),
                senderId,
            }
        });
        
        return newMessage;
    } catch (error) {
         console.error("Error sending message:", error);
         throw new Error("Failed to send message.");
    }
}

export const startConversation = async (currentUserId: string, otherUserId: string, otherUserName: string): Promise<Conversation> => {
    // Check if a conversation already exists between these two users
    const compositeId = [currentUserId, otherUserId].sort().join('_');
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, compositeId);
    const conversationSnap = await getDoc(conversationRef);

    if (conversationSnap.exists()) {
        return conversationSnap.data() as Conversation;
    }

    // Create a new conversation
    const newConversation: Conversation = {
        id: compositeId,
        participantIds: [currentUserId, otherUserId],
        participantDetails: [
            { id: currentUserId, name: 'Admin', avatar: `https://picsum.photos/seed/${currentUserId}/100/100` },
            { id: otherUserId, name: otherUserName, avatar: `https://picsum.photos/seed/${otherUserId}/100/100` }
        ],
        lastMessage: {
            text: 'Conversation started.',
            timestamp: serverTimestamp(),
            senderId: currentUserId
        }
    };

    await setDoc(conversationRef, newConversation);
    return newConversation;
}
