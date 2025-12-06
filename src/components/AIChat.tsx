import { useState, useRef } from "react";
import { MessageCircle, X, Send, Brain, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { chatMessageSchema } from "@/lib/validation";
import { useToast } from "@/hooks/use-toast";
import { convertToBase64 } from "@/lib/toBase64";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  image?: string;
}

export const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your MindMate AI assistant. I can help you plan your day, reflect on your progress, and provide personalized insights. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isLoading) return;

    setIsLoading(true);

    try {
      const base64 = await convertToBase64(file);
      
      const userMessage: Message = {
        id: Date.now(),
        text: "حلل هذه الصورة",
        sender: "user",
        timestamp: new Date(),
        image: base64,
      };
      setMessages((prev) => [...prev, userMessage]);

      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: { message: "حلل هذه الصورة", image: base64 }
      });

      if (error) throw error;

      const aiResponse: Message = {
        id: Date.now() + 1,
        text: data.reply?.content || "Sorry, I couldn't analyze the image.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      toast({
        variant: "destructive",
        description: "Failed to analyze the image. Please try again.",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Validate input
    const validation = chatMessageSchema.safeParse({ message: inputValue });
    if (!validation.success) {
      toast({
        variant: "destructive",
        description: validation.error.errors[0].message,
      });
      return;
    }

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: { message: messageText, image: null }
      });

      if (error) {
        throw error;
      }

      const aiResponse: Message = {
        id: Date.now() + 1,
        text: data.reply?.content || "Sorry, I couldn't process your request.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
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
        description: errorMessage,
      });
      
      const errorResponse: Message = {
        id: Date.now() + 1,
        text: errorMessage,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 w-14 h-14 sm:w-16 sm:h-16 rounded-full gold-gradient shadow-strong flex items-center justify-center transition-smooth hover:scale-110 hover:shadow-strong z-50"
        aria-label="Open AI Chat"
      >
        {isOpen ? (
          <X className="w-6 h-6 sm:w-7 sm:h-7 text-accent-foreground" />
        ) : (
          <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-accent-foreground" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-20 sm:bottom-24 sm:right-8 sm:left-auto sm:w-96 h-[70vh] sm:h-[600px] max-h-[600px] bg-card rounded-2xl shadow-strong border border-border flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-border beige-gradient rounded-t-2xl">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-serif font-semibold text-foreground">
                  AI Assistant
                </h3>
                <p className="text-xs text-muted-foreground">Always here to help</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3 sm:p-6">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3 sm:p-4 ${
                      message.sender === "user"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {message.image && (
                      <img 
                        src={message.image} 
                        alt="Uploaded" 
                        className="max-w-full rounded-lg mb-2"
                      />
                    )}
                    <p className="text-xs sm:text-sm font-sans break-words">{message.text}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-border">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="icon"
                variant="outline"
                className="shrink-0"
                disabled={isLoading}
              >
                <Image className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 text-sm"
                disabled={isLoading}
                maxLength={1000}
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="bg-accent hover:bg-accent/90 text-accent-foreground shrink-0"
                disabled={isLoading}
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
