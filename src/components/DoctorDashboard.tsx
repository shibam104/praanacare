import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Users, 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Heart,
  Thermometer,
  Eye,
  FileText,
  Phone,
  Video
} from 'lucide-react';

interface DoctorDashboardProps {
  onNavigate: (screen: string) => void;
}

export function DoctorDashboard({ onNavigate }: DoctorDashboardProps) {
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  
  const patients = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      age: 34,
      condition: 'Heat Stress Symptoms',
      urgency: 'high',
      lastSeen: '2 hours ago',
      vitals: { hr: 94, bp: '128/82', temp: '99.2°F' },
      aiSummary: 'Patient reports headache, dizziness, and fatigue. Elevated heart rate and slight fever detected. Working in high-temperature environment (38°C). AI recommends immediate hydration and rest.',
      symptoms: ['Headache', 'Dizziness', 'Fatigue', 'Elevated HR'],
      workEnvironment: 'Construction Site - High Heat Index',
      aiRecommendation: 'Immediate rest in cool environment, electrolyte replacement, monitor for heat exhaustion progression'
    },
    {
      id: 2,
      name: 'Priya Sharma',
      age: 28,
      condition: 'Routine Check-up',
      urgency: 'low',
      lastSeen: '1 day ago',
      vitals: { hr: 78, bp: '118/75', temp: '98.6°F' },
      aiSummary: 'Routine health assessment. All vitals within normal ranges. No immediate concerns detected.',
      symptoms: ['None reported'],
      workEnvironment: 'Office Environment',
      aiRecommendation: 'Continue current health maintenance routine'
    },
    {
      id: 3,
      name: 'Arjun Patel',
      age: 42,
      condition: 'Respiratory Concern',
      urgency: 'medium',
      lastSeen: '30 minutes ago',
      vitals: { hr: 88, bp: '135/85', temp: '98.8°F' },
      aiSummary: 'Reports shortness of breath and mild chest tightness. Working in dusty environment. Oxygen saturation slightly below normal at 94%.',
      symptoms: ['Shortness of breath', 'Chest tightness', 'Dry cough'],
      workEnvironment: 'Manufacturing - Dust Exposure',
      aiRecommendation: 'Chest X-ray, pulmonary function test, immediate respiratory protection review'
    }
  ];

  const urgencyColors = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  const selectedPatientData = patients.find(p => p.id === selectedPatient);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <div className="glass-card border-b border-primary/20 p-3 sm:p-4 pt-16 sm:pt-20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-neon-blue rounded-full flex items-center justify-center neon-glow-cyan">
              <span className="text-background text-responsive-sm font-semibold">Dr</span>
            </div>
            <div>
              <h1 className="text-responsive-lg sm:text-responsive-xl text-foreground text-glow">Dr. Meena Gupta</h1>
              <p className="text-responsive-sm text-muted-foreground">Occupational Health Specialist</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Badge className="glass-card bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600 shadow-md">
              <Users className="w-3 h-3 mr-1" />
              {patients.length} Active Patients
            </Badge>
            <Badge className="glass-card bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-600 shadow-md">
              <AlertTriangle className="w-3 h-3 mr-1" />
              2 Urgent Cases
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <Tabs defaultValue="patients" className="space-y-4 sm:space-y-6">
          <TabsList className="glass-card grid w-full grid-cols-3 lg:w-96 border border-primary/20">
            <TabsTrigger value="patients" className="text-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Patients</TabsTrigger>
            <TabsTrigger value="alerts" className="text-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Alerts</TabsTrigger>
            <TabsTrigger value="schedule" className="text-foreground data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Patient List */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Patients by Urgency</h2>
                {patients
                  .sort((a, b) => {
                    const urgencyOrder = { high: 3, medium: 2, low: 1 };
                    return urgencyOrder[b.urgency as keyof typeof urgencyOrder] - urgencyOrder[a.urgency as keyof typeof urgencyOrder];
                  })
                  .map((patient) => (
                    <motion.div key={patient.id} layout>
                      <Card 
                        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedPatient === patient.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedPatient(patient.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <Avatar>
                                <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-medium">{patient.name}</h3>
                                <p className="text-sm text-gray-600">Age {patient.age} • {patient.condition}</p>
                                <p className="text-xs text-gray-500 mt-1">Last seen: {patient.lastSeen}</p>
                              </div>
                            </div>
                            <Badge className={urgencyColors[patient.urgency as keyof typeof urgencyColors]}>
                              {patient.urgency}
                            </Badge>
                          </div>
                          
                          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <Heart className="w-3 h-3 mx-auto mb-1 text-red-500" />
                              <div className="font-medium">{patient.vitals.hr}</div>
                              <div className="text-gray-500">bpm</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="w-3 h-3 mx-auto mb-1 bg-blue-500 rounded-full"></div>
                              <div className="font-medium">{patient.vitals.bp}</div>
                              <div className="text-gray-500">BP</div>
                            </div>
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <Thermometer className="w-3 h-3 mx-auto mb-1 text-orange-500" />
                              <div className="font-medium">{patient.vitals.temp}</div>
                              <div className="text-gray-500">temp</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>

              {/* Patient Details */}
              {selectedPatientData ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Case Summary - {selectedPatientData.name}</span>
                        <Badge className={urgencyColors[selectedPatientData.urgency as keyof typeof urgencyColors]}>
                          {selectedPatientData.urgency} priority
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* AI Summary */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">AI</span>
                          </div>
                          <span className="font-medium text-blue-800">AI Analysis</span>
                        </div>
                        <p className="text-sm text-blue-700">{selectedPatientData.aiSummary}</p>
                      </div>

                      {/* Symptoms */}
                      <div>
                        <h4 className="font-medium mb-2">Reported Symptoms</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedPatientData.symptoms.map((symptom, index) => (
                            <Badge key={index} variant="outline">{symptom}</Badge>
                          ))}
                        </div>
                      </div>

                      {/* Work Environment */}
                      <div>
                        <h4 className="font-medium mb-2">Work Environment</h4>
                        <p className="text-sm text-gray-600">{selectedPatientData.workEnvironment}</p>
                      </div>

                      {/* AI Recommendation */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-800 mb-2">AI Recommendation</h4>
                        <p className="text-sm text-green-700">{selectedPatientData.aiRecommendation}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-3">
                        <Button className="flex-1">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Treatment
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <FileText className="w-4 h-4 mr-2" />
                          Edit Diagnosis
                        </Button>
                      </div>

                      <div className="flex space-x-3">
                        <Button variant="outline" size="sm">
                          <Video className="w-4 h-4 mr-2" />
                          Video Call
                        </Button>
                        <Button variant="outline" size="sm">
                          <Phone className="w-4 h-4 mr-2" />
                          Audio Call
                        </Button>
                        <Button variant="outline" size="sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Follow-up
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a patient to view case summary</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Heat Stress Alert - Rajesh Kumar</p>
                      <p className="text-sm text-red-600">Immediate attention required</p>
                    </div>
                    <Button size="sm" className="ml-auto">Review</Button>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-yellow-800">Respiratory Screening - Arjun Patel</p>
                      <p className="text-sm text-yellow-600">Follow-up required</p>
                    </div>
                    <Button size="sm" variant="outline" className="ml-auto">Review</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="text-center min-w-16">
                      <div className="font-medium">3:30</div>
                      <div className="text-sm text-gray-500">PM</div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Emergency Consultation - Rajesh Kumar</p>
                      <p className="text-sm text-gray-600">Heat stress symptoms</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="text-center min-w-16">
                      <div className="font-medium">4:00</div>
                      <div className="text-sm text-gray-500">PM</div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Follow-up - Arjun Patel</p>
                      <p className="text-sm text-gray-600">Respiratory assessment</p>
                    </div>
                    <Badge variant="outline">Scheduled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}