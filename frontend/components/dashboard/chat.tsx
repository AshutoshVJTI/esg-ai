"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Plus, Trash, Keyboard } from "lucide-react";
import { useChat } from "./chat-context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Logo } from "@/components/ui/logo";

interface Message {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function Chat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use the chat context for persistent messages
  const { messages, addMessage, clearMessages } = useChat();

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Add keyboard shortcut to open chat (Ctrl+/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+/ or Cmd+/ (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      // Check for Escape key to close chat
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      content: message,
      isUser: true,
      timestamp: new Date(),
    };
    
    addMessage(userMessage);
    setMessage("");
    setIsLoading(true);
    
    try {
      // Send message to API
      const response = await fetch("http://159.223.199.91/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      const data = await response.json();
      
      // Add AI response to chat
      const aiMessage: Message = {
        content: data.message,
        isUser: false,
        timestamp: new Date(),
      };
      
      addMessage(aiMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      const errorMessage: Message = {
        content: "Sorry, there was an error processing your request. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleNewChat = () => {
    clearMessages();
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Chat toggle button */}
      {!isOpen && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="fixed bottom-4 right-4 rounded-full h-12 w-12 shadow-md z-50"
                onClick={() => setIsOpen(true)}
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <div className="flex items-center gap-2">
                <span>Open chat</span>
                <kbd className="px-2 py-0.5 text-xs bg-muted rounded border">Ctrl+/</kbd>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Chat panel */}
      <div
        className={`fixed inset-y-0 right-0 w-80 md:w-96 bg-background border-l shadow-lg z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Chat header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <Logo variant="icon" width={24} height={24} />
              <h3 className="font-medium">Standards & Guidelines Help</h3>
            </div>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleNewChat}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <span>New chat</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Chat messages */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                <h3 className="font-medium mb-2">Standards & Guidelines Assistant</h3>
                <p className="text-sm">
                  Ask Reggie about ESG standards, compliance guidelines, or any questions about your reports.
                </p>
                <div className="flex items-center gap-2 mt-4 text-xs bg-muted p-2 rounded">
                  <Keyboard className="h-4 w-4" />
                  <span>Press <kbd className="px-2 py-0.5 bg-background rounded border">Ctrl+/</kbd> to open/close chat</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                      <div className={`text-xs mt-1 ${msg.isUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Chat input */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                size="icon" 
                onClick={handleSendMessage} 
                disabled={!message.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* New chat button at the bottom */}
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full flex items-center justify-center gap-2"
                onClick={handleNewChat}
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 