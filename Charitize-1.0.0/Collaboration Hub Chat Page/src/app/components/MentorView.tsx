import { useState } from 'react';
import { ProjectCard, Project } from './ProjectCard';
import { ChatMessage, Message } from './ChatMessage';
import { FeedbackCard, Feedback } from './FeedbackCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Send, Paperclip, Pin, Award, Target, TrendingUp, Menu, X, List } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
    content: 'The core idea of personalized AI-driven learning paths is strong and addresses a real market need.',
    rating: 'positive',
    timestamp: 'March 16, 2026 at 9:30 AM',
  },
  {
    id: '2',
    category: 'Technical Implementation',
    content: 'Consider implementing a microservices approach for better scalability. Also, add caching layers for the recommendation engine.',
    rating: 'needs-work',
    timestamp: 'March 16, 2026 at 9:45 AM',
  },
];

export function MentorView() {
  const [selectedProject, setSelectedProject] = useState<Project>(mockProjects[0]);
  const [newMessage, setNewMessage] = useState('');
  const [pinnedMessage, setPinnedMessage] = useState('Remember to include unit tests for all new features and update the API documentation accordingly.');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gradient-to-br from-teal-50 to-cyan-50">
      {/* Left Sidebar - Desktop */}
      <div className="hidden lg:flex w-80 border-r border-teal-200 bg-white shadow-lg flex-col">
        <div className="p-4 border-b border-teal-200 bg-gradient-to-r from-teal-600 to-cyan-600">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">My Mentees</h2>
          </div>
          <p className="text-sm text-teal-100">Active mentorship projects</p>
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
              <Award className="w-5 h-5 text-teal-600" />
              My Mentees
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
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-3 md:p-4 shadow-md">
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
                <Target className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <h2 className="font-semibold text-sm md:text-base truncate">{selectedProject.name}</h2>
              </div>
              <p className="text-xs md:text-sm text-teal-100 truncate">Mentoring: {selectedProject.innovatorName}</p>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 hidden md:inline-flex">
              Mentor View
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

        {/* Pinned Message */}
        {pinnedMessage && (
          <div className="bg-teal-100 border-b border-teal-300 p-3 shadow-sm">
            <div className="flex items-start gap-2">
              <Pin className="w-4 h-4 text-teal-700 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-teal-900">Pinned Guidance</p>
                <p className="text-xs md:text-sm text-teal-800">{pinnedMessage}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-teal-700 hover:bg-teal-200 h-6 hidden md:inline-flex">
                Edit
              </Button>
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
        <div className="bg-white border-t border-teal-200 p-3 md:p-4 shadow-lg">
          <div className="flex gap-2 max-w-4xl mx-auto">
            <Button variant="outline" size="icon" className="border-teal-300 text-teal-600 hover:bg-teal-50 hidden md:inline-flex">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Input
              placeholder="Send message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border-teal-300 focus:ring-teal-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  setNewMessage('');
                }
              }}
            />
            <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
              <Send className="w-4 h-4" />
              <span className="ml-2 hidden md:inline">Send</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Feedback Tools - Desktop */}
      <div className="hidden lg:flex w-96 border-l border-teal-200 bg-white shadow-lg flex-col">
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-semibold">Mentorship Tools</h3>
          </div>
        </div>

        <Tabs defaultValue="give-feedback" className="flex-1 flex flex-col">
          <div className="border-b border-teal-200 bg-teal-50">
            <TabsList className="w-full grid grid-cols-2 bg-transparent p-0 h-auto">
              <TabsTrigger
                value="give-feedback"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-white"
              >
                Give Feedback
              </TabsTrigger>
              <TabsTrigger
                value="view-reports"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-white"
              >
                View Reports
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="give-feedback" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="p-4 space-y-4">
                <Card className="p-4 border-teal-300 bg-gradient-to-br from-teal-50 to-cyan-50">
                  <h4 className="font-semibold text-teal-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Provide Structured Feedback
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                      <select className="w-full p-2 border border-teal-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500">
                        <option>Project Concept</option>
                        <option>Technical Implementation</option>
                        <option>Market Viability</option>
                        <option>Recommendations</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Rating</label>
                      <select className="w-full p-2 border border-teal-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500">
                        <option value="positive">Strong</option>
                        <option value="needs-work">Needs Work</option>
                        <option value="suggestion">Suggestion</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Feedback</label>
                      <Textarea placeholder="Share your expert insights..." className="min-h-[120px] border-teal-300 focus:ring-teal-500" />
                    </div>
                    <Button className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                      Submit Feedback
                    </Button>
                  </div>
                </Card>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Previous Feedback</h4>
                  <div className="space-y-3">
                    {mockFeedback.map((feedback) => (
                      <FeedbackCard key={feedback.id} feedback={feedback} />
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="view-reports" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="p-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-8 h-8 text-teal-600" />
                  </div>
                  <p className="text-gray-600">Reports from {selectedProject.innovatorName} will appear here</p>
                  <p className="text-sm text-gray-500 mt-2">2 reports submitted this month</p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Panel - Mobile Sheet */}
      <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
        <SheetContent side="right" className="w-full sm:w-96 p-0">
          <SheetHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-4">
            <SheetTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5" />
              Mentorship Tools
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="give-feedback" className="flex-1 flex flex-col h-[calc(100%-64px)]">
            <div className="border-b border-teal-200 bg-teal-50">
              <TabsList className="w-full grid grid-cols-2 bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="give-feedback"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-white text-xs md:text-sm"
                >
                  Give Feedback
                </TabsTrigger>
                <TabsTrigger
                  value="view-reports"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-teal-600 data-[state=active]:bg-white text-xs md:text-sm"
                >
                  View Reports
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="give-feedback" className="flex-1 mt-0 overflow-y-auto">
              <div className="p-4 space-y-4">
                <Card className="p-4 border-teal-300 bg-gradient-to-br from-teal-50 to-cyan-50">
                  <h4 className="font-semibold text-teal-900 mb-3 flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4" />
                    Provide Structured Feedback
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Category</label>
                      <select className="w-full p-2 border border-teal-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500">
                        <option>Project Concept</option>
                        <option>Technical Implementation</option>
                        <option>Market Viability</option>
                        <option>Recommendations</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Rating</label>
                      <select className="w-full p-2 border border-teal-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500">
                        <option value="positive">Strong</option>
                        <option value="needs-work">Needs Work</option>
                        <option value="suggestion">Suggestion</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Feedback</label>
                      <Textarea placeholder="Share your expert insights..." className="min-h-[100px] text-sm border-teal-300 focus:ring-teal-500" />
                    </div>
                    <Button className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                      Submit Feedback
                    </Button>
                  </div>
                </Card>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Previous Feedback</h4>
                  <div className="space-y-3">
                    {mockFeedback.map((feedback) => (
                      <FeedbackCard key={feedback.id} feedback={feedback} />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="view-reports" className="flex-1 mt-0 overflow-y-auto">
              <div className="p-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-8 h-8 text-teal-600" />
                  </div>
                  <p className="text-sm text-gray-600">Reports from {selectedProject.innovatorName} will appear here</p>
                  <p className="text-xs text-gray-500 mt-2">2 reports submitted this month</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  );
}