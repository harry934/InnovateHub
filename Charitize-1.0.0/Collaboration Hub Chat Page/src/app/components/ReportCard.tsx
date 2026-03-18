import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { FileText, Paperclip } from 'lucide-react';

export interface Report {
  id: string;
  title: string;
  content: string;
  attachments?: { name: string }[];
  timestamp: string;
  status: 'submitted' | 'reviewed';
}

interface ReportCardProps {
  report: Report;
}

export function ReportCard({ report }: ReportCardProps) {
  return (
    <Card className="p-4 border-orange-100 bg-orange-50/30">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-500 rounded-lg">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900">{report.title}</h4>
          </div>
          <Badge className={report.status === 'reviewed' ? 'bg-green-500/10 text-green-700 border-green-200' : 'bg-blue-500/10 text-blue-700 border-blue-200'}>
            {report.status === 'reviewed' ? 'Reviewed' : 'Submitted'}
          </Badge>
        </div>
        <p className="text-gray-700">{report.content}</p>
        {report.attachments && report.attachments.length > 0 && (
          <div className="space-y-1">
            {report.attachments.map((attachment, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-200"
              >
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">{attachment.name}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500">{report.timestamp}</p>
      </div>
    </Card>
  );
}
