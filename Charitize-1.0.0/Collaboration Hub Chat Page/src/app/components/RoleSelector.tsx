import { Card } from './ui/card';
import { Button } from './ui/button';
import { Award, Rocket } from 'lucide-react';

interface RoleSelectorProps {
  onSelectRole: (role: 'mentor' | 'innovator') => void;
}

export function RoleSelector({ onSelectRole }: RoleSelectorProps) {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Collaboration Hub</h1>
          <p className="text-lg text-gray-600">Select your role to continue</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Mentor Card */}
          <Card className="p-8 border-2 border-teal-200 hover:border-teal-400 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => onSelectRole('mentor')}>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Mentor</h2>
              <p className="text-gray-600 mb-6">Guide innovators, provide feedback, and share your expertise</p>
              
              <div className="space-y-2 mb-6 text-sm text-left">
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <span>Review project submissions</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <span>Provide structured feedback</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <span>Track mentee progress</span>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700">
                Continue as Mentor
              </Button>
            </div>
          </Card>

          {/* Innovator Card */}
          <Card className="p-8 border-2 border-orange-200 hover:border-orange-400 hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => onSelectRole('innovator')}>
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Innovator</h2>
              <p className="text-gray-600 mb-6">Develop your project with expert guidance and mentorship</p>
              
              <div className="space-y-2 mb-6 text-sm text-left">
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Receive expert feedback</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Submit progress reports</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Collaborate with mentors</span>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                Continue as Innovator
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
