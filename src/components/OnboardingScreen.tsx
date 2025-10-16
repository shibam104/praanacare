import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Heart, Stethoscope, Building2, Brain } from 'lucide-react';

interface OnboardingScreenProps {
  onRoleSelect: (role: 'patient' | 'doctor' | 'employer') => void;
}

export function OnboardingScreen({ onRoleSelect }: OnboardingScreenProps) {
  return (
    <div className="min-h-screen bg-background grid-pattern flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full text-center space-y-6 sm:space-y-8"
      >
        {/* Logo and Header */}
        <div className="space-y-4 sm:space-y-6">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center space-x-3 sm:space-x-4"
          >
            <div className="relative floating">
              <Brain className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-primary" />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-primary rounded-full opacity-30 neon-glow-cyan"
              />
            </div>
            <h1 className="text-responsive-3xl sm:text-responsive-4xl font-bold bg-gradient-to-r from-primary via-neon-blue to-neon-purple bg-clip-text text-transparent">
              PraanaCare
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-responsive-lg sm:text-responsive-xl text-foreground font-medium mb-2"
          >
            AI that acts, not just advises.
          </motion.p>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-responsive-sm text-muted-foreground font-medium"
          >
            Powered by Agentic AI • Industrial Health Monitoring
          </motion.p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
          {[
            {
              role: 'patient' as const,
              title: 'Worker',
              description: 'Monitor health, get AI insights, consult doctors',
              icon: Heart,
              color: 'from-emerald-500 to-emerald-600'
            },
            {
              role: 'doctor' as const,
              title: 'Doctor',
              description: 'Review AI-prepared cases, approve treatments',
              icon: Stethoscope,
              color: 'from-blue-500 to-blue-600'
            },
            {
              role: 'employer' as const,
              title: 'Employer',
              description: 'Monitor workforce health analytics & insights',
              icon: Building2,
              color: 'from-purple-500 to-purple-600'
            }
          ].map((option, index) => {
            const IconComponent = option.icon;
            return (
              <motion.div
                key={option.role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="w-full"
              >
                <Card 
                  className="glass-card p-4 sm:p-6 cursor-pointer transition-all duration-500 border border-primary/20 hover:border-primary/60 group hover:shadow-lg"
                  onClick={() => onRoleSelect(option.role)}
                >
                  <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                    <div className={`p-3 sm:p-4 rounded-full bg-gradient-to-br ${option.color} text-white group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                      <IconComponent className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-responsive-lg font-semibold text-foreground">{option.title}</h3>
                      <p className="text-responsive-sm text-muted-foreground mt-1 px-2">{option.description}</p>
                    </div>
                    <Button 
                      className={`w-full bg-gradient-to-r ${option.color} hover:opacity-90 transition-all duration-300 text-white font-semibold border-0 shadow-lg hover:shadow-xl`}
                      size="sm"
                    >
                      Continue as {option.title}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-responsive-xs text-muted-foreground/60 mt-6 sm:mt-8"
        >
          Secure • HIPAA Compliant • AI-Powered Healthcare
        </motion.div>
      </motion.div>
    </div>
  );
}