"use client";

import { useState } from "react";
import { 
  Building2, 
  Users, 
  ChevronDown, 
  Plus,
  Settings,
  Check
} from "lucide-react";

interface Workspace {
  id: number;
  name: string;
  plan: 'free' | 'solo' | 'pro' | 'business';
  memberCount: number;
  contractCount: number;
  isActive: boolean;
}

const mockWorkspaces: Workspace[] = [
  { id: 1, name: "Personal", plan: "pro", memberCount: 1, contractCount: 12, isActive: true },
  { id: 2, name: "Acme Corp", plan: "business", memberCount: 5, contractCount: 34, isActive: false },
];

const getPlanBadge = (plan: Workspace['plan']) => {
  const styles = {
    free: "bg-gray-100 text-gray-600",
    solo: "bg-blue-100 text-blue-700",
    pro: "bg-purple-100 text-purple-700",
    business: "bg-amber-100 text-amber-700"
  };
  return styles[plan];
};

export default function WorkspaceSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState(mockWorkspaces);
  const activeWorkspace = workspaces.find(w => w.isActive) || workspaces[0];

  const handleSwitch = (workspaceId: number) => {
    setWorkspaces(prev => prev.map(w => ({
      ...w,
      isActive: w.id === workspaceId
    })));
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F3F4F6] transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white font-semibold">
          {activeWorkspace.name.charAt(0)}
        </div>
        
        <div className="flex-1 text-left">
          <p className="font-medium text-[#1A1A1A] text-sm">{activeWorkspace.name}</p>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${getPlanBadge(activeWorkspace.plan)}`}>
              {activeWorkspace.plan}
            </span>
            <span className="text-xs text-[#9CA3AF]">{activeWorkspace.contractCount} contracts</span>
          </div>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-[#6B7280] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-[#E5E7EB] shadow-lg z-50 overflow-hidden">
            <div className="p-2">
              <p className="text-xs font-medium text-[#6B7280] px-3 py-2 uppercase tracking-wide">Your Workspaces</p>
              
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSwitch(workspace.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    workspace.isActive ? 'bg-[#FEF3C7]' : 'hover:bg-[#F3F4F6]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold ${
                    workspace.isActive 
                      ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706]' 
                      : 'bg-gradient-to-br from-[#6B7280] to-[#4B5563]'
                  }`}>
                    {workspace.name.charAt(0)}
                  </div>
                  
                  <div className="flex-1 text-left">
                    <p className="font-medium text-[#1A1A1A] text-sm">{workspace.name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1 py-0.5 rounded font-medium uppercase ${getPlanBadge(workspace.plan)}`}>
                        {workspace.plan}
                      </span>
                      <span className="text-[10px] text-[#9CA3AF]">{workspace.memberCount} members</span>
                    </div>
                  </div>
                  
                  {workspace.isActive && (
                    <Check className="w-4 h-4 text-[#F59E0B]" />
                  )}
                </button>
              ))}
            </div>
            
            <hr className="border-[#E5E7EB]" />
            
            <div className="p-2">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F3F4F6] transition-colors">
                <div className="w-8 h-8 rounded-lg border-2 border-dashed border-[#D1D5DB] flex items-center justify-center">
                  <Plus className="w-4 h-4 text-[#9CA3AF]" />
                </div>
                <span className="text-sm text-[#374151]">Create New Workspace</span>
              </button>
              
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F3F4F6] transition-colors">
                <Settings className="w-4 h-4 text-[#6B7280]" />
                <span className="text-sm text-[#374151]">Workspace Settings</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
