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
import { Send, Paperclip, Pin, Lightbulb, FileText, Rocket, Menu, CheckCircle, List } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';

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
    innovatorName: 'Sarah Chen',
    status: 'Feedback Pending',
    lastActivity: '2 hours ago',
  },
  {
    id: '3',
    name: 'Healthcare Analytics Tool',
    innovatorName: 'Sarah Chen',
    status: 'Revision Submitted',
    lastActivity: '1 day ago',
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
    ],
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

export function InnovatorView() {
  const [selectedProject, setSelectedProject] = useState<Project>(mockProjects[0]);
  const [newMessage, setNewMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  const pinnedMessage = "Remember to include unit tests for all new features and update the API documentation accordingly.";

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-amber-50">
      {/* Left Sidebar - Desktop */}
      <div className="hidden lg:flex w-80 border-r border-orange-200 bg-white shadow-lg flex-col">
        <div className="p-4 border-b border-orange-200 bg-gradient-to-r from-orange-500 to-amber-500">
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">My Projects</h2>
          </div>
          <p className="text-sm text-orange-100">Projects under mentorship</p>
        </div>
        <ScrollArea className="flex-1">
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

      {/* Left Sidebar - Mobile Drawer */}
      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-orange-600" />
              My Projects
            </DrawerTitle>
          </DrawerHeader>
          <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {mockProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                isActive={selectedProject.id === project.id}
                onClick={() => {
                  setSelectedProject(project);
                  setSidebarOpen(false);
                }}
              />
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Center Panel - Chat */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-3 md:p-4 shadow-md">
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-white/20 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <h2 className="font-semibold text-sm md:text-base truncate">{selectedProject.name}</h2>
              </div>
              <p className="text-xs md:text-sm text-orange-100 truncate">Mentor: Dr. Michael Johnson</p>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 hidden md:inline-flex">
              Innovator View
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelOpen(!rightPanelOpen)}
              className="text-white hover:bg-white/20 lg:hidden"
            >
              <List className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="bg-orange-100 border-b border-orange-200 p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm font-medium text-orange-900">Project Progress</span>
            <span className="text-xs md:text-sm text-orange-700">65% Complete</span>
          </div>
          <Progress value={65} className="h-2 bg-orange-200" />
          <div className="flex gap-3 md:gap-4 mt-2 md:mt-3 text-xs text-orange-700">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> 3 Feedbacks
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" /> 2 Reports
            </span>
          </div>
        </div>

        {/* Pinned Message */}
        {pinnedMessage && (
          <div className="bg-amber-100 border-b border-amber-200 p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <Pin className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-900">Mentor's Guidance</p>
                <p className="text-xs md:text-sm text-amber-800">{pinnedMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-3 md:p-4 bg-white">
          <div className="space-y-4 max-w-4xl mx-auto">
            {mockMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="bg-white border-t border-orange-200 p-3 md:p-4 shadow-lg">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Button variant="outline" size="icon" className="border-orange-300 text-orange-600 hover:bg-orange-50 hidden md:inline-flex">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Ask your mentor..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border-orange-300 focus:ring-orange-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setNewMessage('');
                }
              }}
            />
            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
              <Send className="w-4 h-4" />
              <span className="ml-2 hidden md:inline">Send</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Feedback & Reports - Desktop */}
      <div className="hidden lg:flex w-96 border-l border-orange-200 bg-white shadow-lg flex-col">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            <h3 className="font-semibold">Growth & Progress</h3>
          </div>
        </div>

        <Tabs defaultValue="feedback" className="flex-1 flex flex-col">
          <div className="border-b border-orange-200 bg-orange-50">
            <TabsList className="w-full grid grid-cols-2 bg-transparent p-0 h-auto">
              <TabsTrigger
                value="feedback"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-white"
              >
                Mentor Feedback
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-white"
              >
                My Reports
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="feedback" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(100vh-304px)]">
              <div className="p-4">
                <Card className="p-4 mb-4 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-500 rounded-full">
                      <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-900 mb-1">Mentorship Insights</h4>
                      <p className="text-sm text-orange-700">Review your mentor's feedback to improve your project</p>
                    </div>
                  </div>
                </Card>
                
                <div className="space-y-3">
                  {mockFeedback.map((feedback) => (
                    <FeedbackCard key={feedback.id} feedback={feedback} />
                  ))}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="reports" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(100vh-304px)]">
              <div className="p-4 space-y-4">
                <Card className="p-4 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50">
                  <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Submit Progress Report
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Report Title</label>
                      <Input placeholder="e.g., Week 4 Progress Update" className="border-orange-300 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Details</label>
                      <Textarea placeholder="Describe your progress, challenges, and next steps..." className="min-h-[100px] border-orange-300 focus:ring-orange-500" />
                    </div>
                    <Button variant="outline" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50">
                      <Paperclip className="w-4 h-4 mr-2" />
                      Attach Files
                    </Button>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                      Submit Report
                    </Button>
                  </div>
                </Card>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Previous Reports</h4>
                  <div className="space-y-3">
                    {mockReports.map((report) => (
                      <ReportCard key={report.id} report={report} />
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Mobile Sheet */}
      <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
        <SheetContent side="right" className="w-full sm:w-96 p-0">
          <SheetHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-4">
            <SheetTitle className="flex items-center gap-2 text-white">
              <Rocket className="w-5 h-5" />
              Growth & Progress
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="feedback" className="flex-1 flex flex-col h-[calc(100%-64px)]">
            <div className="border-b border-orange-200 bg-orange-50">
              <TabsList className="w-full grid grid-cols-2 bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="feedback"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-white text-xs md:text-sm"
                >
                  Feedback
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:bg-white text-xs md:text-sm"
                >
                  Reports
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="feedback" className="flex-1 mt-0 overflow-y-auto">
              <div className="p-4 space-y-3">
                <div className="space-y-3">
                  {mockFeedback.map((feedback) => (
                    <FeedbackCard key={feedback.id} feedback={feedback} />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reports" className="flex-1 mt-0 overflow-y-auto">
              <div className="p-4 space-y-4">
                <Card className="p-4 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50">
                  <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4" />
                    Submit Progress Report
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Report Title</label>
                      <Input placeholder="e.g., Week 4 Progress Update" className="border-orange-300 focus:ring-orange-500 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Details</label>
                      <Textarea placeholder="Describe your progress..." className="min-h-[100px] text-sm border-orange-300 focus:ring-orange-500" />
                    </div>
                    <Button variant="outline" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 text-sm">
                      <Paperclip className="w-4 h-4 mr-2" />
                      Attach Files
                    </Button>
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                      Submit Report
                    </Button>
                  </div>
                </Card>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Previous Reports</h4>
                  <div className="space-y-3">
                    {mockReports.map((report) => (
                      <ReportCard key={report.id} report={report} />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}