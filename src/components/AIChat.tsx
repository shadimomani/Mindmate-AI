import { useState, useRef, useEffect } from "react";
import { X, Send, Brain, Image, Loader2, Plus, History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { chatMessageSchema } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { convertToBase64 } from "@/lib/toBase64";
import { useAuth } from "@/contexts/AuthContext";
interface Message {
  id: string;
  text: string;
  sender: "user" | "assistant";
  timestamp: Date;
  image?: string;
}
interface Conversation {
  id: string;
  title: string;
  created_at: string;
}
type LoadingState = "idle" | "typing" | "analyzing";
export const AIChat = () => {
  const {
    user
  } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();
  const isLoading = loadingState !== "idle";

  // Load conversations on mount
  useEffect(() => {
    if (user && isOpen) {
      loadConversations();
    }
  }, [user, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loadingState]);
  const loadConversations = async () => {
    if (!user) return;
    const {
      data,
      error
    } = await supabase.from('conversations').select('id, title, created_at').eq('user_id', user.id).order('updated_at', {
      ascending: false
    }).limit(20);
    if (!error && data) {
      setConversations(data);
    }
  };
  const loadConversation = async (conversationId: string) => {
    const {
      data,
      error
    } = await supabase.from('chat_messages').select('*').eq('conversation_id', conversationId).order('created_at', {
      ascending: true
    });
    if (!error && data) {
      setMessages(data.map(msg => ({
        id: msg.id,
        text: msg.content,
        sender: msg.role as "user" | "assistant",
        timestamp: new Date(msg.created_at),
        image: msg.image_url || undefined
      })));
      setCurrentConversationId(conversationId);
      setShowHistory(false);
    }
  };
  const createNewConversation = async (): Promise<string | null> => {
    if (!user) return null;
    const {
      data,
      error
    } = await supabase.from('conversations').insert({
      user_id: user.id,
      title: 'New Chat'
    }).select('id').single();
    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
    await loadConversations();
    return data.id;
  };
  const saveMessage = async (conversationId: string, role: 'user' | 'assistant', content: string, imageUrl?: string) => {
    if (!user) return;
    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role,
      content,
      image_url: imageUrl || null
    });
  };
  const updateConversationTitle = async (conversationId: string, firstMessage: string) => {
    const title = firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
    await supabase.from('conversations').update({
      title
    }).eq('id', conversationId);
    await loadConversations();
  };
  const deleteConversation = async (conversationId: string) => {
    await supabase.from('conversations').delete().eq('id', conversationId);
    if (currentConversationId === conversationId) {
      startNewChat();
    }
    await loadConversations();
  };
  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
  };
  const getMessageHistory = () => {
    return messages.map(msg => ({
      role: msg.sender,
      content: msg.text,
      image: msg.image
    }));
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isLoading || !user) return;
    setLoadingState("analyzing");
    try {
      const base64 = await convertToBase64(file);
      let convId = currentConversationId;
      if (!convId) {
        convId = await createNewConversation();
        if (!convId) throw new Error('Failed to create conversation');
        setCurrentConversationId(convId);
      }
      const userMessage: Message = {
        id: crypto.randomUUID(),
        text: "Analyze this image",
        sender: "user",
        timestamp: new Date(),
        image: base64
      };
      setMessages(prev => [...prev, userMessage]);
      await saveMessage(convId, 'user', userMessage.text, base64);
      if (messages.length === 0) {
        await updateConversationTitle(convId, "Image analysis");
      }
      const {
        data,
        error
      } = await supabase.functions.invoke('openai-chat', {
        body: {
          message: "Analyze this image",
          image: base64,
          history: getMessageHistory()
        }
      });
      if (error) throw error;
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        text: data.reply?.content || "Sorry, I couldn't analyze the image.",
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      await saveMessage(convId, 'assistant', aiResponse.text);
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      toast({
        variant: "destructive",
        description: "Failed to analyze the image. Please try again."
      });
    } finally {
      setLoadingState("idle");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !user) return;
    const validation = chatMessageSchema.safeParse({
      message: inputValue
    });
    if (!validation.success) {
      toast({
        variant: "destructive",
        description: validation.error.errors[0].message
      });
      return;
    }
    let convId = currentConversationId;
    if (!convId) {
      convId = await createNewConversation();
      if (!convId) {
        toast({
          variant: "destructive",
          description: "Failed to start conversation"
        });
        return;
      }
      setCurrentConversationId(convId);
    }
    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputValue,
      sender: "user",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue("");
    setLoadingState("typing");
    await saveMessage(convId, 'user', messageText);
    if (messages.length === 0) {
      await updateConversationTitle(convId, messageText);
    }
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('openai-chat', {
        body: {
          message: messageText,
          image: null,
          history: getMessageHistory()
        }
      });
      if (error) throw error;
      const aiResponse: Message = {
        id: crypto.randomUUID(),
        text: data.reply?.content || "Sorry, I couldn't process your request.",
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      await saveMessage(convId, 'assistant', aiResponse.text);
    } catch (error: any) {
      console.error("Error communicating with AI:", error);
      let errorMessage = "Sorry, I'm having trouble connecting right now. Please try again.";
      if (error.message?.includes('429')) {
        errorMessage = "Too many requests. Please wait a moment before sending another message.";
      } else if (error.message?.includes('401')) {
        errorMessage = "Please sign in to use the AI assistant.";
      }
      toast({
        variant: "destructive",
        description: errorMessage
      });
      const errorResponse: Message = {
        id: crypto.randomUUID(),
        text: errorMessage,
        sender: "assistant",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoadingState("idle");
    }
  };
  return <>
      {/* Floating Chat Button */}
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 rounded-full gold-gradient shadow-strong flex items-center justify-center transition-smooth hover:scale-110 hover:shadow-strong z-50" aria-label="Open AI Chat">
        {isOpen ? <X className="w-6 h-6 sm:w-7 sm:h-7 text-accent-foreground" /> : <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-accent-foreground" />}
      </button>

      {/* Chat Window */}
      {isOpen && <div className="fixed inset-x-4 bottom-20 sm:bottom-24 sm:right-8 sm:left-auto sm:w-96 h-[70vh] sm:h-[600px] max-h-[600px] bg-card rounded-2xl shadow-strong border border-border flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-border rounded-t-2xl bg-muted text-muted-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 bg-accent/20 rounded-lg">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-serif font-semibold text-foreground">
                    AI Assistant
                  </h3>
                  <p className="text-xs text-muted-foreground">Remembers your conversations</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={startNewChat} className="h-8 w-8" title="New chat">
                  <Plus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)} className="h-8 w-8" title="Chat history">
                  <History className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* History Panel */}
          {showHistory ? <ScrollArea className="flex-1 p-3 sm:p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground mb-3">Recent Conversations</p>
                {conversations.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p> : conversations.map(conv => <div key={conv.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${currentConversationId === conv.id ? 'bg-accent/20 border border-accent/30' : 'bg-muted/50 hover:bg-muted'}`} onClick={() => loadConversation(conv.id)}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conv.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 ml-2" onClick={e => {
              e.stopPropagation();
              deleteConversation(conv.id);
            }}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>)}
              </div>
            </ScrollArea> : <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-3 sm:p-6" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 && <div className="flex justify-start">
                      <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 bg-muted text-foreground">
                        <p className="text-xs sm:text-sm font-sans">
                          Hello! I'm your MindMate AI assistant. I remember our conversations and can help you with daily planning, habits, and personal growth. How can I help you today?
                        </p>
                      </div>
                    </div>}
                  {messages.map(message => <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 ${message.sender === "user" ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"}`}>
                        {message.image && <img src={message.image} alt="Uploaded" className="max-w-full rounded-lg mb-2" />}
                        <p className="text-xs sm:text-sm font-sans break-words whitespace-pre-wrap">{message.text}</p>
                        <p className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                        </p>
                      </div>
                    </div>)}
                  
                  {/* Loading indicator */}
                  {loadingState !== "idle" && <div className="flex justify-start">
                      <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 bg-muted text-foreground">
                        <div className="flex items-center gap-2">
                          {loadingState === "analyzing" ? <>
                              <Brain className="w-4 h-4 animate-pulse text-accent" />
                              <span className="text-xs sm:text-sm text-muted-foreground">Analyzing image...</span>
                            </> : <>
                              <Loader2 className="w-4 h-4 animate-spin text-accent" />
                              <span className="text-xs sm:text-sm text-muted-foreground">Typing...</span>
                            </>}
                        </div>
                      </div>
                    </div>}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-3 sm:p-4 border-t border-border">
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                <div className="flex gap-2">
                  <Button onClick={() => fileInputRef.current?.click()} size="icon" variant="outline" className="shrink-0" disabled={isLoading || !user}>
                    <Image className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                  <Input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={e => e.key === "Enter" && !isLoading && handleSend()} placeholder={user ? "Ask me anything..." : "Sign in to chat"} className="flex-1 text-sm" disabled={isLoading || !user} maxLength={1000} />
                  <Button onClick={handleSend} size="icon" className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0" disabled={isLoading || !user}>
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>
            </>}
        </div>}
    </>;
};