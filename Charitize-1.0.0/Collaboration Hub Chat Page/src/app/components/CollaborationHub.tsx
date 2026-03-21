import { useState } from 'react';
import { ProjectCard, Project } from './ProjectCard';
import { ChatMessage, Message } from './ChatMessage';
import { FeedbackCard, Feedback } from './FeedbackCard';
import { ReportCard, Report } from './ReportCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Send, Paperclip, Pin, MessageSquare, FileText, TrendingUp, Menu } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Mock data
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'AI-Powered Learning Platform',
    innovatorName: 'Sarah Chen',
    status: 'Active',
    lastActivity: '5 min ago',
  },
  {
    id: '2',
    name: 'Sustainable Energy Dashboard',
    innovatorName: 'James Rodriguez',
    status: 'Feedback Pending',
    lastActivity: '2 hours ago',
  },
  {
    id: '3',
    name: 'Healthcare Analytics Tool',
    innovatorName: 'Maya Patel',
    status: 'Revision Submitted',
    lastActivity: '1 day ago',
  },
  {
    id: '4',
    name: 'Smart Inventory System',
    innovatorName: 'Alex Kim',
    status: 'Completed',
    lastActivity: '3 days ago',
  },
];

const mockMessages: Message[] = [
  {
    id: '1',
    sender: 'mentor',
    senderName: 'Dr. Michael Johnson',
    content: 'Hi Sarah! I\'ve reviewed your latest prototype. The user interface is looking great!',
    timestamp: '10:30 AM',
  },
  {
    id: '2',
    sender: 'innovator',
    senderName: 'Sarah Chen',
    content: 'Thank you! I implemented the changes you suggested regarding the navigation flow.',
    timestamp: '10:32 AM',
  },
  {
    id: '3',
    sender: 'mentor',
    senderName: 'Dr. Michael Johnson',
    content: 'Excellent work. I have some feedback on the technical implementation. Please check the feedback section.',
    timestamp: '10:35 AM',
  },
  {
    id: '4',
    sender: 'innovator',
    senderName: 'Sarah Chen',
    content: 'I\'ve uploaded the revised architecture documentation based on your recommendations.',
    timestamp: '11:15 AM',
    attachments: [
      { name: 'architecture-v2.pdf', type: 'PDF' },
      { name: 'api-specs.json', type: 'JSON' },
    ],
  },
  {
    id: '5',
    sender: 'mentor',
    senderName: 'Dr. Michael Johnson',
    content: 'Perfect! This addresses all my concerns. Let\'s schedule a call to discuss market strategy.',
    timestamp: '11:45 AM',
  },
];

const mockFeedback: Feedback[] = [
  {
    id: '1',
    category: 'Project Concept',
    content: 'The core idea of personalized AI-driven learning paths is strong and addresses a real market need. Consider expanding on how you differentiate from existing platforms.',
    rating: 'positive',
    timestamp: 'March 16, 2026 at 9:30 AM',
  },
  {
    id: '2',
    category: 'Technical Implementation',
    content: 'The current architecture is solid, but I recommend implementing a microservices approach for better scalability. Also, consider adding caching layers for the recommendation engine.',
    rating: 'needs-work',
    timestamp: 'March 16, 2026 at 9:45 AM',
  },
  {
    id: '3',
    category: 'Market Viability',
    content: 'Your target market analysis is comprehensive. I suggest focusing on the K-12 segment initially before expanding to enterprise training.',
    rating: 'suggestion',
    timestamp: 'March 16, 2026 at 10:00 AM',
  },
];

const mockReports: Report[] = [
  {
    id: '1',
    title: 'Week 3 Progress Report',
    content: 'Completed user authentication module and integrated the AI recommendation system. Currently working on the dashboard analytics.',
    attachments: [{ name: 'progress-report-week3.pdf' }],
    timestamp: 'March 15, 2026 at 4:30 PM',
    status: 'reviewed',
  },
  {
    id: '2',
    title: 'Architecture Revision',
    content: 'Updated the system architecture based on your feedback. Implemented microservices for the core modules and added Redis caching.',
    attachments: [
      { name: 'architecture-v2.pdf' },
      { name: 'api-documentation.pdf' },
    ],
    timestamp: 'March 16, 2026 at 11:15 AM',
    status: 'submitted',
  },
];

export function CollaborationHub() {
  const [selectedProject, setSelectedProject] = useState<Project>(mockProjects[0]);
  const [newMessage, setNewMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const pinnedMessage = "Remember to include unit tests for all new features and update the API documentation accordingly.";

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Projects */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 bg-white`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Mentorship Projects</h2>
          <p className="text-sm text-gray-600 mt-1">Active collaborations</p>
        </div>
        <ScrollArea className="h-[calc(100vh-88px)]">
          <div className="p-4 space-y-3">
            {mockProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={selectedProject.id === project.id}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Center Panel - Chat */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">{selectedProject.name}</h2>
              <p className="text-sm text-gray-600">with {selectedProject.innovatorName}</p>
            </div>
            <Badge className="bg-green-500/10 text-green-700 border-green-200">
              {selectedProject.status}
            </Badge>
          </div>
        </div>

        {/* Pinned Message */}
        {pinnedMessage && (
          <div className="bg-amber-50 border-b border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <Pin className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900">Pinned Message</p>
                <p className="text-sm text-amber-800">{pinnedMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {mockMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Button variant="outline" size="icon">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setNewMessage('');
                }
              }}
            />
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Feedback & Reports */}
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col">
        <Tabs defaultValue="feedback" className="flex-1 flex flex-col">
          <div className="border-b border-gray-200">
            <TabsList className="w-full grid grid-cols-2 bg-transparent p-0 h-auto">
              <TabsTrigger
                value="feedback"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Feedback
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-transparent"
              >
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="feedback" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Mentor Feedback</h3>
                  <p className="text-sm text-gray-600">Structured guidance from your mentor</p>
                </div>
                <div className="space-y-3">
                  {mockFeedback.map((feedback) => (
                    <FeedbackCard key={feedback.id} feedback={feedback} />
                  ))}
                </div>
                <div className="mt-4">
                  <Card className="p-4 border-teal-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Add Feedback</h4>
                    <div className="space-y-3">
                      <select className="w-full p-2 border border-gray-200 rounded-lg text-sm">
                        <option>Project Concept</option>
                        <option>Technical Implementation</option>
                        <option>Market Viability</option>
                        <option>Recommendations</option>
                      </select>
                      <Textarea placeholder="Enter your feedback..." className="min-h-[100px]" />
                      <Button className="w-full bg-teal-600 hover:bg-teal-700">
                        Submit Feedback
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="reports" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Progress Reports</h3>
                  <p className="text-sm text-gray-600">Updates from the innovator</p>
                </div>
                <div className="space-y-3">
                  {mockReports.map((report) => (
                    <ReportCard key={report.id} report={report} />
                  ))}
                </div>
                <div className="mt-4">
                  <Card className="p-4 border-orange-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Submit Report</h4>
                    <div className="space-y-3">
                      <Input placeholder="Report title..." />
                      <Textarea placeholder="Describe your progress..." className="min-h-[100px]" />
                      <Button variant="outline" className="w-full">
                        <Paperclip className="w-4 h-4 mr-2" />
                        Attach Files
                      </Button>
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">
                        Submit Report
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
