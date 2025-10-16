import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowLeft, Send, Mic, AlertTriangle, Calendar, Pill, Phone } from 'lucide-react';

interface AIChatProps {
  onNavigate: (screen: string) => void;
}

interface Message {
  id: number;
  type: 'user' | 'ai' | 'action';
  content: string;
  timestamp: Date;
  action?: {
    type: 'emergency' | 'consultation' | 'medication' | 'reminder';
    title: string;
    description: string;
    icon: any;
  };
}

export function AIChat({ onNavigate }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      content: "Hello Rajesh! I'm your Praana AI health assistant. I see your heart rate is elevated to 94 bpm. How are you feeling right now?",
      timestamp: new Date(Date.now() - 60000)
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);

    // Simulate AI processing
    setTimeout(() => {
      setIsThinking(false);
      
      // Generate AI response based on user input
      const responses = getAIResponse(inputValue.toLowerCase());
      
      responses.forEach((response, index) => {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + index,
            ...response,
            timestamp: new Date()
          }]);
        }, index * 1000);
      });
    }, 2000);
  };

  const getAIResponse = (userInput: string): Partial<Message>[] => {
    if (userInput.includes('headache') || userInput.includes('dizzy') || userInput.includes('tired')) {
      return [
        {
          type: 'ai',
          content: "I understand you're experiencing symptoms that could be related to dehydration or heat stress. Let me take immediate action to help you."
        },
        {
          type: 'action',
          content: '',
          action: {
            type: 'emergency',
            title: 'Supervisor Alert Sent',
            description: 'Your supervisor has been notified about your symptoms',
            icon: AlertTriangle
          }
        },
        {
          type: 'action',
          content: '',
          action: {
            type: 'consultation',
            title: 'Doctor Consultation Booked',
            description: 'Video call with Dr. Meena scheduled for today 3:30 PM',
            icon: Calendar
          }
        },
        {
          type: 'ai',
          content: "I've automatically alerted your supervisor and booked an urgent consultation. Please find a cool, shaded area and rest immediately. Drink water slowly."
        }
      ];
    }
    
    if (userInput.includes('pain') || userInput.includes('chest') || userInput.includes('difficulty')) {
      return [
        {
          type: 'ai',
          content: "This sounds serious. I'm taking immediate emergency action."
        },
        {
          type: 'action',
          content: '',
          action: {
            type: 'emergency',
            title: 'Emergency Alert Triggered',
            description: 'Medical emergency team and supervisor notified',
            icon: Phone
          }
        },
        {
          type: 'ai',
          content: "Emergency services have been contacted. Please stay calm and remain where you are. Help is on the way."
        }
      ];
    }

    // Default response
    return [
      {
        type: 'ai',
        content: "Thank you for sharing that with me. Based on your current vitals and symptoms, I'm analyzing the best course of action."
      },
      {
        type: 'action',
        content: '',
        action: {
          type: 'medication',
          title: 'Medication Reminder Set',
          description: 'Reminder for electrolyte supplement at 2:00 PM',
          icon: Pill
        }
      },
      {
        type: 'ai',
        content: "I've set up a health monitoring plan for you. Please continue to stay hydrated and take breaks in shaded areas."
      }
    ];
  };

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <div className="glass-card border-b border-primary/20 p-3 sm:p-4 pt-16 sm:pt-20">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onNavigate('patient')}
            className="text-primary hover:bg-primary/10 border border-primary/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-neon-blue rounded-full flex items-center justify-center neon-glow-cyan floating">
              <span className="text-background text-responsive-sm">🤖</span>
            </div>
            <div>
              <h1 className="text-responsive-lg text-foreground text-glow">Praana AI Assistant</h1>
              <div className="flex items-center space-x-2">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-neon-green rounded-full neon-glow-green"
                ></motion.div>
                <p className="text-responsive-sm text-muted-foreground">Online & Monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-5xl mx-auto p-3 sm:p-4 pb-20 sm:pb-24">
        <div className="space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'user' ? (
                <div className="glass-card bg-primary/15 text-foreground p-3 rounded-lg max-w-xs sm:max-w-sm border border-primary/30 shadow-lg">
                  <p className="text-responsive-sm font-medium">{message.content}</p>
                  <p className="text-responsive-xs text-muted-foreground mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ) : message.type === 'action' && message.action ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="max-w-sm sm:max-w-md"
                >
                  <Card className="glass-card border-l-4 border-l-orange-500 bg-orange-500/10 border border-orange-500/30 shadow-lg">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-orange-500/20 rounded-full border border-orange-500/30">
                          <message.action.icon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-700 dark:text-orange-300 text-responsive-sm">{message.action.title}</h4>
                          <p className="text-responsive-xs text-foreground/80 mt-1">{message.action.description}</p>
                          <Badge variant="secondary" className="mt-2 text-responsive-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600">
                            Auto-executed by AI
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="glass-card border border-primary/20 p-3 rounded-lg max-w-sm sm:max-w-md shadow-lg">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                      <span className="text-white text-responsive-xs font-semibold">AI</span>
                    </div>
                    <div>
                      <p className="text-responsive-sm text-foreground font-medium">{message.content}</p>
                      <p className="text-responsive-xs text-muted-foreground mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          
          {isThinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">AI</span>
                  </div>
                  <div className="flex space-x-1">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 bg-blue-400 rounded-full"
                    />
                  </div>
                  <span className="text-sm text-gray-600">Agent analyzing...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 glass-card border-t border-primary/20 p-3 sm:p-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe your symptoms or ask for help..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 glass-card border-primary/30 text-foreground placeholder:text-muted-foreground bg-input-background focus:border-primary focus:ring-1 focus:ring-primary text-responsive-sm"
            />
            <Button size="sm" variant="outline" className="sm:w-auto w-full border-primary/30 text-primary hover:bg-primary/10">
              <Mic className="w-4 h-4" />
              <span className="sm:hidden ml-2">Voice Input</span>
            </Button>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isThinking}
            className="bg-primary hover:bg-primary/90 transition-all duration-300 text-primary-foreground font-semibold shadow-lg hover:shadow-xl"
            size="lg"
          >
            <Send className="w-4 h-4 mr-2 sm:mr-0" />
            <span className="sm:hidden">Send Message</span>
          </Button>
        </div>
      </div>
    </div>
  );
}