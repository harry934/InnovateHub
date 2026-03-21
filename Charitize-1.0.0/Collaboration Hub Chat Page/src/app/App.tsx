import { useState } from 'react';
import { Header } from './components/Header';
import { RoleSelector } from './components/RoleSelector';
import { MentorView } from './components/MentorView';
import { InnovatorView } from './components/InnovatorView';

export default function App() {
  const [selectedRole, setSelectedRole] = useState<'mentor' | 'innovator' | null>(null);

  const handleRoleSelect = (role: 'mentor' | 'innovator') => {
    setSelectedRole(role);
  };

  const handleRoleChange = () => {
    setSelectedRole(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header role={selectedRole} onRoleChange={handleRoleChange} />
      {!selectedRole ? (
        <RoleSelector onSelectRole={handleRoleSelect} />
      ) : selectedRole === 'mentor' ? (
        <MentorView />
      ) : (
        <InnovatorView />
      )}
    </div>
  );
}
