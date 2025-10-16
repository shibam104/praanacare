import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { MessageCircle, Activity, Heart, Droplets, Phone, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PatientDashboardProps {
  onNavigate: (screen: string) => void;
}

export function PatientDashboard({ onNavigate }: PatientDashboardProps) {
  const [aiActions] = useState([
    {
      id: 1,
      type: 'hydration',
      title: 'AI recommends hydration break',
      description: 'Your heart rate is elevated. Take a 5-minute break and drink water.',
      icon: Droplets,
      timestamp: '2 minutes ago',
      status: 'active'
    },
    {
      id: 2,
      type: 'checkup',
      title: 'AI scheduled checkup with Dr. Meena',
      description: 'Tomorrow 10:00 AM - Video consultation booked automatically',
      icon: Calendar,
      timestamp: '5 minutes ago',
      status: 'completed'
    }
  ]);

  const vitals = {
    bloodPressure: { value: '128/82', status: 'warning', unit: 'mmHg' },
    heartRate: { value: '94', status: 'normal', unit: 'bpm' },
    oxygenSat: { value: '97', status: 'normal', unit: '%' }
  };

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <div className="glass-card border-b border-primary/20 p-3 sm:p-4 pt-16 sm:pt-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-neon-blue rounded-full flex items-center justify-center neon-glow-cyan">
              <span className="text-background text-sm sm:text-base font-semibold">R</span>
            </div>
            <div>
              <h1 className="text-responsive-lg sm:text-responsive-xl text-foreground">Hello, Rajesh 👋</h1>
              <p className="text-responsive-sm text-muted-foreground">Industrial Worker • Shift: Day</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-start sm:justify-end">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center space-x-2 glass-card text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-full text-responsive-sm border border-emerald-500/30 shadow-lg"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              🧠 Agent Monitoring Active
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Quick Question */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass-card bg-gradient-to-r from-primary/10 to-blue-500/10 text-foreground border border-primary/30 shadow-xl">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-responsive-lg sm:text-responsive-xl mb-4 font-semibold">How are you feeling today?</h2>
              <Button 
                onClick={() => onNavigate('chat')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-lg hover:shadow-xl"
                size="lg"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Praana AI
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Live Vitals */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card border border-primary/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-responsive-base">
                  <Activity className="w-5 h-5 text-primary" />
                  <span>Live Vitals</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(vitals).map(([key, vital]) => (
                  <div key={key} className="flex items-center justify-between p-3 glass-card rounded-lg border border-border/50">
                    <div>
                      <p className="text-responsive-sm text-muted-foreground capitalize font-medium">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-responsive-lg text-foreground font-semibold">
                        {vital.value} <span className="text-responsive-sm text-muted-foreground">{vital.unit}</span>
                      </p>
                    </div>
                    <Badge 
                      variant={vital.status === 'normal' ? 'default' : 'destructive'}
                      className={vital.status === 'normal' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600'}
                    >
                      {vital.status}
                    </Badge>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-4 border-primary/30 text-primary hover:bg-primary/10">
                  View History
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => onNavigate('chat')}
                  className="w-full justify-start bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                >
                  <MessageCircle className="w-4 h-4 mr-3" />
                  Chat with AI Assistant
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Phone className="w-4 h-4 mr-3" />
                  Emergency Call
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <Calendar className="w-4 h-4 mr-3" />
                  Book Consultation
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🤖 AI Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-orange-700">You may be dehydrated</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">Based on heart rate and ambient temperature</p>
                </div>
                <p className="text-sm text-gray-600">
                  AI is monitoring your vitals and environment. You'll receive proactive health recommendations.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Agentic Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent AI Actions</CardTitle>
              <p className="text-sm text-gray-600">Actions taken automatically by your AI agent</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiActions.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className={`p-2 rounded-full ${action.status === 'completed' ? 'bg-green-100' : 'bg-blue-100'}`}>
                        <IconComponent className={`w-4 h-4 ${action.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{action.title}</h4>
                          {action.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{action.timestamp}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}