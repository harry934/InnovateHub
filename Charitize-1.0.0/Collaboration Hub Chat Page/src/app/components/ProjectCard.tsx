import { Clock } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

export interface Project {
  id: string;
  name: string;
  innovatorName: string;
  status: 'Active' | 'Feedback Pending' | 'Revision Submitted' | 'Completed';
  lastActivity: string;
}

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  onClick: () => void;
}

const statusColors = {
  'Active': 'bg-green-500/10 text-green-700 border-green-200',
  'Feedback Pending': 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  'Revision Submitted': 'bg-blue-500/10 text-blue-700 border-blue-200',
  'Completed': 'bg-gray-500/10 text-gray-700 border-gray-200',
};

export function ProjectCard({ project, isActive, onClick }: ProjectCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'border-teal-600 bg-teal-50/50' : 'border-gray-200'
      }`}
      onClick={onClick}
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-900">{project.name}</h3>
        <p className="text-sm text-gray-600">Innovator: {project.innovatorName}</p>
        <div className="flex items-center justify-between">
          <Badge className={statusColors[project.status]}>
            {project.status}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{project.lastActivity}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
