import { useState, useEffect, useRef } from "react";
import { X, Send, Bot, MessageCircle, RotateCw, Brain, Sparkles, ChevronDown, ChevronUp, Image, Smile } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  content: string;
  fromUser: boolean;
  timestamp?: Date;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      fromUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    const currentMessage = message;
    setMessage("");

    // Show typing indicator
    setIsTyping(true);

    try {
      // Call the AI Search API through our backend
      const response = await fetch('https://employee-insights-api.adityalasika.workers.dev/api/chat/ai-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: currentMessage }),
      });

      const data = await response.json();

      let botResponseContent = '';

      if (data.success && data.response) {
        // Ensure the response is a string and not an object
        if (typeof data.response === 'string') {
          botResponseContent = data.response;
        } else if (typeof data.response === 'object') {
          // If it's an object, try to extract text or use fallback
          console.warn('Received object instead of string for response:', data.response);
          botResponseContent = 'Maaf, terjadi kesalahan dalam memproses respons AI.';
        } else {
          botResponseContent = String(data.response);
        }
      } else {
        // Fallback to contextual responses if API fails
        const fallbackResponses = [
          "Berdasarkan analisis data employee insights, saya dapat membantu Anda menganalisis sentimen karyawan dan tren insight terbaru.",
          "Sistem AI sedang memproses data sentiment analysis. Silakan coba pertanyaan yang lebih spesifik tentang insight karyawan.",
          "Maaf, terjadi kendala dalam mengakses data. Namun saya dapat membantu dengan analisis umum berdasarkan data yang tersedia."
        ];
        botResponseContent = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      }

      // Final safety check to ensure we have a valid string
      if (!botResponseContent || typeof botResponseContent !== 'string') {
        botResponseContent = 'Maaf, terjadi kesalahan dalam memproses respons.';
      }

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponseContent,
        fromUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);

    } catch (error) {
      console.error('Error calling AI API:', error);

      // Error fallback response
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Maaf, terjadi gangguan koneksi. Silakan coba lagi dalam beberapa saat.",
        fromUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  // Format timestamp
  const formatTime = (date?: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        // Chat Window
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 drop-shadow-2xl">
          <Card className="rounded-2xl overflow-hidden w-[350px] bg-white border-0 shadow-[0_10px_40px_rgba(0,0,0,0.16)]">
            <div
              className="bg-gradient-to-r from-[#0984E3] to-[#00B894] p-4 flex items-center justify-between text-white cursor-pointer"
              onClick={toggleMinimize}
            >
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-semibold">NLP Assistant</div>
                  <div className="text-xs text-teal-100 flex items-center">
                    <span className="inline-block h-2 w-2 rounded-full bg-teal-300 mr-2 animate-pulse"></span>
                    Cloudflare AI
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isMinimized ? (
                  <ChevronUp className="h-5 w-5 text-white/70 hover:text-white transition-colors" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-white/70 hover:text-white transition-colors" />
                )}
                <button
                  className="text-white/70 hover:text-white transition-colors ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleChat();
                  }}
                  aria-label="Close chat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <CardContent className="p-0">
                <div className="h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent p-4 bg-[#f8fafc]">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="bg-teal-50 rounded-2xl p-5 mb-4">
                        <Sparkles className="h-12 w-12 text-teal-500 mx-auto mb-3" />
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-1">NLP Sentiment Analysis</h3>
                      <p className="text-sm text-gray-500 max-w-[80%]">
                        Tanyakan tentang analisis sentimen, tren insight, atau rekomendasi berdasarkan data
                      </p>

                      <div className="mt-6 grid grid-cols-2 gap-2 w-full px-3">
                        <button
                          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs py-2 px-3 rounded-lg transition-colors"
                          onClick={async () => {
                            setMessage("Apa insight terbaru?");
                            await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                          }}
                        >
                          Insights terbaru
                        </button>
                        <button
                          className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs py-2 px-3 rounded-lg transition-colors"
                          onClick={async () => {
                            setMessage("Analisis sentimen regional");
                            await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                          }}
                        >
                          Analisis regional
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.fromUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!msg.fromUser && (
                            <div className="flex-shrink-0 mr-3">
                              <div className="h-9 w-9 rounded-full bg-teal-100 flex items-center justify-center border border-teal-200">
                                <Brain className="h-5 w-5 text-teal-600" />
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col max-w-[75%]">
                            <div
                              className={`relative px-4 py-3 rounded-2xl shadow-sm ${
                                msg.fromUser
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none"
                                  : "bg-white border border-gray-100 text-gray-700 rounded-bl-none"
                              }`}
                            >
                              <p className="text-sm leading-relaxed">{typeof msg.content === 'string' ? msg.content : 'Invalid message content'}</p>
                              <div className={`text-[10px] mt-1 opacity-70 ${msg.fromUser ? "text-blue-100 text-right" : "text-gray-500"}`}>
                                {formatTime(msg.timestamp)}
                              </div>
                            </div>
                          </div>
                          {msg.fromUser && (
                            <div className="flex-shrink-0 ml-3">
                              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                                <span className="text-xs font-semibold text-blue-600">You</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="h-9 w-9 rounded-full bg-teal-100 flex items-center justify-center mr-3 border border-teal-200">
                            <Brain className="h-5 w-5 text-teal-600" />
                          </div>
                          <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                            <div className="flex space-x-1 items-center h-5">
                              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: "0ms", animationDuration: "1.2s" }}></div>
                              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: "300ms", animationDuration: "1.2s" }}></div>
                              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" style={{ animationDelay: "600ms", animationDuration: "1.2s" }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-gray-100">
                  <form
                    className="flex items-center space-x-2"
                    onSubmit={handleSubmit}
                  >
                    <div className="flex-1 relative">
                      <Input
                        className="bg-[#f8fafc] border-[#e5e9ef] text-gray-700 pl-4 pr-9 py-[10px] rounded-full text-sm focus-visible:ring-1 focus-visible:ring-teal-500"
                        placeholder="Ketik pesan..."
                        value={message}
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500"
                      >
                        <Smile className="h-5 w-5" />
                      </button>
                    </div>
                    <Button
                      type="submit"
                      size="icon"
                      className="bg-[#0984E3] hover:bg-[#0875c9] rounded-full h-10 w-10 shadow-sm transition-all duration-200"
                    >
                      <Send className="h-[18px] w-[18px]" />
                    </Button>
                  </form>

                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Powered by Cloudflare AI • v2.0.0</span>
                    <div className="flex items-center space-x-3">
                      <button className="hover:text-gray-700 transition-colors">
                        <Image className="h-3.5 w-3.5" />
                      </button>
                      <button className="hover:text-gray-700 transition-colors">
                        <RotateCw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      ) : (
        // Floating Button
        <button
          onClick={toggleChat}
          className="relative group"
          aria-label="Open chat"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0984E3] to-[#00B894] rounded-full blur opacity-70 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative bg-gradient-to-r from-[#0984E3] to-[#00B894] hover:from-[#0875c9] hover:to-[#00a584] text-white rounded-full p-4 shadow-lg flex items-center justify-center transition-all duration-200 animate-bounce-slow">
            <MessageCircle className="h-6 w-6" />
          </div>
        </button>
      )}
    </div>
  );
}
