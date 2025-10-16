import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle, 
  ThermometerSun,
  Activity,
  Download,
  Calendar,
  Shield,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface EmployerDashboardProps {
  onNavigate: (screen: string) => void;
}

export function EmployerDashboard({ onNavigate }: EmployerDashboardProps) {
  const healthIndexData = [
    { name: 'Mon', index: 85, incidents: 2 },
    { name: 'Tue', index: 78, incidents: 4 },
    { name: 'Wed', index: 92, incidents: 1 },
    { name: 'Thu', index: 76, incidents: 5 },
    { name: 'Fri', index: 68, incidents: 8 },
    { name: 'Sat', index: 82, incidents: 3 },
    { name: 'Sun', index: 89, incidents: 1 }
  ];

  const riskFactors = [
    { name: 'Heat Stress', value: 45, color: '#ef4444' },
    { name: 'Fatigue', value: 25, color: '#f97316' },
    { name: 'Respiratory', value: 20, color: '#eab308' },
    { name: 'Injury', value: 10, color: '#22c55e' }
  ];

  const productivityData = [
    { dept: 'Construction', baseline: 100, current: 85, risk: 'high' },
    { dept: 'Manufacturing', baseline: 100, current: 92, risk: 'medium' },
    { dept: 'Warehouse', baseline: 100, current: 78, risk: 'high' },
    { dept: 'Maintenance', baseline: 100, current: 95, risk: 'low' }
  ];

  return (
    <div className="min-h-screen bg-background grid-pattern">
      {/* Header */}
      <div className="glass-card border-b border-primary/20 p-3 sm:p-4 pt-16 sm:pt-20">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-neon-purple to-purple-400 rounded-full flex items-center justify-center neon-glow-purple floating">
              <span className="text-background text-responsive-sm">🏭</span>
            </div>
            <div>
              <h1 className="text-responsive-lg sm:text-responsive-xl text-foreground text-glow">Workplace Health Analytics</h1>
              <p className="text-responsive-sm text-muted-foreground">Industrial Corp • 1,247 Active Workers</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export Report</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Schedule Review</span>
              <span className="sm:hidden">Schedule</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-96">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Health Risk Index</p>
                        <p className="text-3xl font-bold text-orange-600">Medium</p>
                        <p className="text-sm text-orange-600 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          +12% vs last week
                        </p>
                      </div>
                      <ThermometerSun className="w-8 h-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Workers</p>
                        <p className="text-3xl font-bold">1,247</p>
                        <p className="text-sm text-green-600 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          +3% vs last month
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Daily Incidents</p>
                        <p className="text-3xl font-bold text-red-600">8</p>
                        <p className="text-sm text-red-600 flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          +60% vs yesterday
                        </p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg. Productivity</p>
                        <p className="text-3xl font-bold text-yellow-600">87%</p>
                        <p className="text-sm text-red-600 flex items-center">
                          <TrendingDown className="w-4 h-4 mr-1" />
                          -5% vs target
                        </p>
                      </div>
                      <Activity className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Health Index Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={healthIndexData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="index" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Factor Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={riskFactors}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {riskFactors.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🤖 AI Recommendations</span>
                  <Badge className="bg-orange-100 text-orange-800">Live</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800">High Priority: Shift Outdoor Work Schedule</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Heat index will reach dangerous levels (40°C) between 2-4 PM. Recommend moving outdoor construction tasks to morning hours (6-10 AM).
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">Affects 89 workers</Badge>
                        <Badge variant="outline" className="text-xs">Productivity impact: -15%</Badge>
                      </div>
                    </div>
                    <Button size="sm">Implement</Button>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800">Increase Hydration Stations</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Analysis shows workers in Zone C are 40% more likely to experience dehydration. Add 3 additional hydration stations.
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">Cost: $2,400</Badge>
                        <Badge variant="outline" className="text-xs">ROI: 3 months</Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Review</Button>
                  </div>

                  <div className="flex items-start space-x-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-800">Optimize Break Schedules</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        AI suggests staggered 15-minute cooling breaks every 2 hours for manufacturing teams to reduce fatigue incidents by 25%.
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="text-xs">Estimated savings: $12K/month</Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Schedule</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Department Productivity Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dept" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="baseline" fill="#e5e7eb" name="Baseline" />
                        <Bar dataKey="current" fill="#3b82f6" name="Current" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Predicted Absenteeism</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Next 7 days</span>
                        <span className="text-2xl font-bold text-orange-600">12%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Next 30 days</span>
                        <span className="text-2xl font-bold text-red-600">18%</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        AI predicts increased absenteeism due to heat-related illness if current conditions persist.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>ROI Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Healthcare Cost Reduction</span>
                        <span className="text-lg font-bold text-green-600">$45K/month</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Productivity Improvement</span>
                        <span className="text-lg font-bold text-green-600">$128K/month</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total ROI</span>
                        <span className="text-2xl font-bold text-green-600">340%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Active Risk Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div className="flex-1">
                      <p className="font-medium text-red-800">Critical Heat Index - Construction Zone A</p>
                      <p className="text-sm text-red-600">Temperature: 41°C • Heat Index: Extreme Danger</p>
                      <p className="text-xs text-red-500 mt-1">89 workers affected • Immediate action required</p>
                    </div>
                    <Button size="sm" className="bg-red-600 hover:bg-red-700">Respond</Button>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-800">Elevated Incident Rate - Manufacturing</p>
                      <p className="text-sm text-yellow-600">3 heat stress cases in past 2 hours</p>
                      <p className="text-xs text-yellow-500 mt-1">234 workers affected • Monitoring required</p>
                    </div>
                    <Button size="sm" variant="outline">Monitor</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preventive Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm">Heat stress incidents</span>
                      <Badge className="bg-green-100 text-green-800">-23% this month</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm">Workplace injuries</span>
                      <Badge className="bg-green-100 text-green-800">-15% this month</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm">Respiratory complaints</span>
                      <Badge className="bg-red-100 text-red-800">+8% this month</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Risk Factors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { factor: 'High ambient temperature', score: 85 },
                      { factor: 'Inadequate hydration', score: 72 },
                      { factor: 'Extended work hours', score: 68 },
                      { factor: 'Poor air quality', score: 45 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <span className="text-sm flex-1">{item.factor}</span>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full" 
                            style={{ width: `${item.score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-8">{item.score}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}