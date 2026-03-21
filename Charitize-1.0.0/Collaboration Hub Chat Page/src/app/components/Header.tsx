import { Bell, LogOut, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import logoImage from 'figma:asset/671d0ecfcc698818242c2fbeab9139af709f1042.png';

interface HeaderProps {
  role?: 'mentor' | 'innovator' | null;
  onRoleChange?: () => void;
}

export function Header({ role, onRoleChange }: HeaderProps) {
  return (
    <header className="bg-[#3d6666] text-white border-b border-[#2d5050]">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <img src={logoImage} alt="Innovate Hub Logo" className="h-12" />
          {role && (
            <Badge className={role === 'mentor' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-orange-500 hover:bg-orange-600'}>
              {role === 'mentor' ? 'Mentor' : 'Innovator'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          {role && onRoleChange && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRoleChange}
              className="text-white hover:bg-white/10"
            >
              Switch Role
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Bell className="w-5 h-5" />
          </Button>
          <Avatar className="bg-orange-500 w-10 h-10">
            <AvatarFallback className="bg-orange-500 text-white">
              {role === 'mentor' ? 'MJ' : 'SC'}
            </AvatarFallback>
          </Avatar>
          <Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}