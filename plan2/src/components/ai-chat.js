"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { GoogleGenerativeAI } from "@google/generative-ai"


// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export function AiChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi there! I'm your AI learning assistant. How can I help you with your course today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    // Add user message
    const userMessage = { role: "user", content: input }
    setMessages([...messages, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Get chat history for context, excluding the initial welcome message
      const chatHistory = messages.slice(1).map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      // Start a chat
      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      // Send message and get response
      const result = await chat.sendMessage(input);
      const response = await result.response;
      const aiMessage= { 
        role: "assistant", 
        content: response.text() 
      }
      
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage = {
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again.",
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating chat button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 rounded-full p-4 shadow-lg z-50",
          isOpen ? "bg-red-500 hover:bg-red-600" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90",
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat window */}
      {isOpen && (
        <Card className="fixed bottom-20 right-6 w-80 md:w-96 shadow-xl z-50 max-h-[500px] flex flex-col">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg py-3">
            <CardTitle className="text-lg flex items-center">
              <Bot className="mr-2 h-5 w-5" />
              AI Learning Assistant
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-grow overflow-y-auto p-4 max-h-[350px]">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg p-3",
                      message.role === "user"
                        ? "bg-purple-600 text-white rounded-tr-none"
                        : "bg-slate-200 dark:bg-slate-700 rounded-tl-none",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>

          <CardFooter className="p-3 border-t">
            <div className="flex w-full items-center space-x-2">
              <Input
                placeholder={isLoading ? "AI is thinking..." : "Ask a question..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-grow"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                disabled={isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  )
}