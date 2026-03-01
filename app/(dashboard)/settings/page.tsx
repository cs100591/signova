"use client";

import { useState } from "react";
import { 
  User, 
  Bell, 
  CreditCard, 
  Shield, 
  Users,
  ChevronRight
} from "lucide-react";
import UsageStatsPanel from "@/components/usage-stats";

const settingsTabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing & Usage', icon: CreditCard },
  { id: 'team', label: 'Team Members', icon: Users },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('billing');

  return (
    <div className="min-h-screen bg-[#F8F7F4] p-8">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[32px] font-semibold text-[#1A1A1A] mb-1">Settings</h1>
          <p className="text-[15px] text-[#6B7280]">Manage your account, workspace, and billing.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-[#FEF3C7] text-[#B45309]' 
                        : 'hover:bg-[#F9FAFB] text-[#374151]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${activeTab === tab.id ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-2">
            {activeTab === 'billing' && (
              <UsageStatsPanel />
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-6">Profile Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[#6B7280] mb-1">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue="John Doe"
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-[#6B7280] mb-1">Email</label>
                    <input 
                      type="email" 
                      defaultValue="john@example.com"
                      className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F59E0B]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-[#6B7280] mb-1">Primary Jurisdiction</label>
                    <select className="w-full px-4 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:border-[#F59E0B]">
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Canada</option>
                      <option>Australia</option>
                    </select>
                  </div>
                  
                  <button className="mt-4 px-6 py-2.5 bg-[#1A1A1A] text-white rounded-lg font-medium hover:bg-[#333] transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-6">Email Notifications</h3>
                
                <div className="space-y-4">
                  {[
                    { label: 'Contract expiry reminders', desc: '90, 30, 7 days before expiry', checked: true },
                    { label: 'New team member invitations', desc: 'When someone invites you to a workspace', checked: true },
                    { label: 'Weekly digest', desc: 'Summary of your contracts and usage', checked: false },
                    { label: 'Product updates', desc: 'New features and improvements', checked: true },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-[#374151]">{item.label}</p>
                        <p className="text-sm text-[#6B7280]">{item.desc}</p>
                      </div>
                      <input 
                        type="checkbox" 
                        defaultChecked={item.checked}
                        className="w-5 h-5 accent-[#F59E0B]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-[#1A1A1A]">Team Members</h3>
                  <button className="px-4 py-2 bg-[#F59E0B] text-white rounded-lg text-sm font-medium hover:bg-[#D97706]">
                    Invite Member
                  </button>
                </div>
                
                <div className="space-y-3">
                  {[
                    { name: 'John Doe', email: 'john@example.com', role: 'Owner', avatar: 'J' },
                    { name: 'Jane Smith', email: 'jane@example.com', role: 'Admin', avatar: 'J' },
                  ].map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-[#F9FAFB] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white font-medium">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{member.name}</p>
                          <p className="text-sm text-[#6B7280]">{member.email}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-white rounded-full text-sm text-[#374151] border border-[#E5E7EB]">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-6">Security Settings</h3>
                
                <div className="space-y-6">
                  <div>
                    <p className="font-medium text-[#374151] mb-2">Change Password</p>
                    <button className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#374151] hover:bg-[#F9FAFB]">
                      Update Password
                    </button>
                  </div>
                  
                  <hr className="border-[#E5E7EB]" />
                  
                  <div>
                    <p className="font-medium text-[#374151] mb-2">Two-Factor Authentication</p>
                    <p className="text-sm text-[#6B7280] mb-3">Add an extra layer of security to your account.</p>
                    <button className="px-4 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#374151] hover:bg-[#F9FAFB]">
                      Enable 2FA
                    </button>
                  </div>
                  
                  <hr className="border-[#E5E7EB]" />
                  
                  <div>
                    <p className="font-medium text-red-600 mb-2">Danger Zone</p>
                    <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
