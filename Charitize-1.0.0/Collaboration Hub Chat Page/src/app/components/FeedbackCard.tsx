import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';

export interface Feedback {
  id: string;
  category: 'Project Concept' | 'Technical Implementation' | 'Market Viability' | 'Recommendations';
  content: string;
  rating?: 'positive' | 'needs-work' | 'suggestion';
  timestamp: string;
}

interface FeedbackCardProps {
  feedback: Feedback;
}

const categoryIcons = {
  'Project Concept': Lightbulb,
  'Technical Implementation': CheckCircle2,
  'Market Viability': AlertCircle,
  'Recommendations': Lightbulb,
};

const ratingStyles = {
  'positive': 'bg-green-500/10 text-green-700 border-green-200',
  'needs-work': 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  'suggestion': 'bg-blue-500/10 text-blue-700 border-blue-200',
};

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  const Icon = categoryIcons[feedback.category];

  return (
    <Card className="p-4 border-teal-100 bg-teal-50/30">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-600 rounded-lg">
              <Icon className="w-4 h-4 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900">{feedback.category}</h4>
          </div>
          {feedback.rating && (
            <Badge className={ratingStyles[feedback.rating]}>
              {feedback.rating === 'positive' ? 'Strong' : feedback.rating === 'needs-work' ? 'Needs Work' : 'Suggestion'}
            </Badge>
          )}
        </div>
        <p className="text-gray-700">{feedback.content}</p>
        <p className="text-xs text-gray-500">{feedback.timestamp}</p>
      </div>
    </Card>
  );
}
