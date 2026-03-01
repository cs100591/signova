"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  SlidersHorizontal, 
  Search, 
  MoreVertical,
  AlertCircle,
  Check,
  X
} from "lucide-react";
import { 
  EmptyContracts, 
  EmptySearch,
  DashboardTotalContracts,
  DashboardExpiring,
  DashboardHighRisk,
  DashboardAnalyzed,
  IconNDA,
  IconMSA,
  IconRenewal,
  IconInternal,
  IconContractor,
  IconEmployment,
  IconLease,
  IconService,
  IconPartnership,
  IconSaaS,
  IconGeneral,
  IconExpired
} from "@/components/illustrations";

interface Contract {
  id: number;
  name: string;
  type: string;
  description: string;
  value: string;
  expiryDate: string | null;
  owner: string;
  ownerInitial: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'indefinite';
}

// Helper function: Calculate expiry status
const getExpiryStatus = (expiryDate: string | null): { status: Contract['status'], daysLeft: number | null, label: string } => {
  if (!expiryDate) {
    return { status: 'indefinite', daysLeft: null, label: 'Indefinite' };
  }
  
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: 'expired', daysLeft: diffDays, label: 'Expired' };
  } else if (diffDays <= 7) {
    return { status: 'expiring_soon', daysLeft: diffDays, label: `Exp: ${diffDays} days` };
  } else if (diffDays <= 30) {
    return { status: 'expiring_soon', daysLeft: diffDays, label: `Exp: ${diffDays} days` };
  } else {
    return { status: 'active', daysLeft: diffDays, label: `Exp: ${expiry.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` };
  }
};

const mockContracts: Contract[] = [
  {
    id: 1,
    name: "Acme Corp MSA",
    type: "MSA",
    description: "Master Service Agreement for Q3 enterprise software deliverables covering all...",
    value: "$120,000",
    expiryDate: "2024-12-15",
    owner: "Sarah",
    ownerInitial: "S",
    status: "active",
  },
  {
    id: 2,
    name: "Dunder Mifflin Renewal",
    type: "Renewal",
    description: "Annual paper supply contract renewal with updated pricing terms and volume discounts.",
    value: "$45,000",
    expiryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
    owner: "Mike",
    ownerInitial: "M",
    status: "expiring_soon",
  },
  {
    id: 3,
    name: "Stark Industries NDA",
    type: "NDA",
    description: "Non-disclosure agreement for project \"Iron Legion\". Strict confidentiality clauses applied.",
    value: "N/A",
    expiryDate: null,
    owner: "Tony",
    ownerInitial: "T",
    status: "indefinite",
  },
  {
    id: 4,
    name: "Freelance Contractor (J. Doe)",
    type: "Contractor",
    description: "Independent contractor agreement for frontend development services.",
    value: "$85/hr",
    expiryDate: "2024-10-30",
    owner: "Jane",
    ownerInitial: "J",
    status: "expired",
  },
  {
    id: 5,
    name: "Health Benefit Plan 2024",
    type: "Internal",
    description: "Internal HR document regarding employee health benefits package 2024 updates.",
    value: "Internal",
    expiryDate: "2024-12-31",
    owner: "HR",
    ownerInitial: "H",
    status: "active",
  },
];

const contractTypes = ["All", "MSA", "NDA", "Employment", "Contractor", "Renewal", "Lease", "Service", "Other"];
const contractStatuses = ["All", "Active", "Expiring Soon", "Expired", "Indefinite"];

// Helper function to get icon component based on contract type
const getContractTypeIcon = (type: string, isExpired: boolean = false) => {
  const iconProps = { width: 28, height: 28, className: isExpired ? "text-red-600" : "text-[#6B7280]" };
  
  if (isExpired) {
    return <IconExpired {...iconProps} />;
  }
  
  switch (type) {
    case "NDA":
      return <IconNDA {...iconProps} />;
    case "MSA":
      return <IconMSA {...iconProps} className="text-blue-600" />;
    case "Employment":
      return <IconEmployment {...iconProps} className="text-green-600" />;
    case "Contractor":
      return <IconContractor {...iconProps} />;
    case "Lease":
      return <IconLease {...iconProps} className="text-amber-600" />;
    case "Renewal":
      return <IconRenewal {...iconProps} className="text-amber-600" />;
    case "Internal":
      return <IconInternal {...iconProps} className="text-purple-600" />;
    case "Service":
      return <IconService {...iconProps} className="text-blue-600" />;
    case "Partnership":
      return <IconPartnership {...iconProps} className="text-purple-600" />;
    case "SaaS":
    case "License":
      return <IconSaaS {...iconProps} className="text-green-600" />;
    default:
      return <IconGeneral {...iconProps} />;
  }
};

export default function ContractsPage() {
  const [activeTab, setActiveTab] = useState("All Contracts");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [contracts] = useState<Contract[]>(mockContracts);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const tabs = ["All Contracts", "Drafts", "Archived"];

  // Filter contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      // Search filter
      const matchesSearch = 
        contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesType = selectedType === "All" || contract.type === selectedType;
      
      // Status filter
      const matchesStatus = selectedStatus === "All" || 
        (selectedStatus === "Expiring Soon" && contract.status === "expiring_soon") ||
        (selectedStatus === "Expired" && contract.status === "expired") ||
        (selectedStatus === "Active" && contract.status === "active") ||
        (selectedStatus === "Indefinite" && contract.status === "indefinite");
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [contracts, searchQuery, selectedType, selectedStatus]);

  const getExpiryBadgeStyle = (status: Contract['status']) => {
    switch (status) {
      case 'expired':
        return "bg-red-100 text-red-700 border-red-200";
      case 'expiring_soon':
        return "bg-orange-100 text-orange-700 border-orange-200";
      case 'indefinite':
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getStatusIndicator = (status: Contract['status']) => {
    switch (status) {
      case 'expired':
        return "bg-red-500";
      case 'expiring_soon':
        return "bg-orange-500";
      case 'indefinite':
        return "bg-blue-500";
      default:
        return "bg-green-500";
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const total = contracts.length;
    const expiringThisMonth = contracts.filter(c => {
      if (!c.expiryDate) return false;
      const expiry = new Date(c.expiryDate);
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      return expiry <= thirtyDaysFromNow && expiry >= today;
    }).length;
    
    const highRisk = contracts.filter(c => c.status === 'expired' || c.status === 'expiring_soon').length;
    // For now, assume all contracts are analyzed if they have a risk score
    const analyzed = contracts.filter(c => c.status !== 'expired').length;
    
    return {
      total,
      expiringThisMonth,
      highRisk,
      analyzed,
      totalContracts: total
    };
  }, [contracts]);

  return (
    <div className="min-h-screen bg-[#F8F7F4] p-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-[32px] font-semibold text-[#1A1A1A] mb-1">Contracts</h1>
            <p className="text-[15px] text-[#6B7280]">Manage and review your legal agreements.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                showFilters 
                  ? "bg-[#FEF3C7] border-[#F59E0B] text-[#B45309]" 
                  : "bg-white border-[#E5E7EB] text-[#374151] hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
            </button>
            <Link href="/upload">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#333] transition-colors">
                <Plus className="w-4 h-4" />
                New Contract
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Contracts */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                <DashboardTotalContracts width={44} height={44} />
              </div>
              <span className="text-xs text-[#6B7280]">All time</span>
            </div>
            <div className="text-[28px] font-semibold text-[#1A1A1A] mb-1">{stats.total}</div>
            <div className="text-sm text-[#6B7280]">Total contracts</div>
          </div>

          {/* Expiring This Month */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                <DashboardExpiring width={44} height={44} />
              </div>
              <span className="text-xs text-[#6B7280]">This month</span>
            </div>
            <div className="text-[28px] font-semibold text-[#1A1A1A] mb-1">{stats.expiringThisMonth}</div>
            <div className="text-sm text-[#6B7280]">Expiring soon</div>
          </div>

          {/* High Risk */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                <DashboardHighRisk width={44} height={44} />
              </div>
              <span className="text-xs text-[#6B7280]">Needs attention</span>
            </div>
            <div className="text-[28px] font-semibold text-[#1A1A1A] mb-1">{stats.highRisk}</div>
            <div className="text-sm text-[#6B7280]">High risk contracts</div>
          </div>

          {/* Analyzed Progress */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                <DashboardAnalyzed width={44} height={44} />
              </div>
              <span className="text-xs text-[#6B7280]">Progress</span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-[28px] font-semibold text-[#1A1A1A]">{stats.analyzed}</span>
              <span className="text-lg text-[#9CA3AF]">/ {stats.totalContracts}</span>
            </div>
            <div className="text-sm text-[#6B7280]">Analyzed contracts</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-[#E5E7EB] rounded-xl text-[15px] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B]"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-[#1A1A1A]">Filters</h3>
              <button 
                onClick={() => {
                  setSelectedType("All");
                  setSelectedStatus("All");
                }}
                className="text-sm text-[#F59E0B] hover:text-[#D97706]"
              >
                Clear all
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Type Filter */}
              <div>
                <label className="text-sm text-[#6B7280] mb-2 block">Contract Type</label>
                <div className="flex flex-wrap gap-2">
                  {contractTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedType === type
                          ? "bg-[#F59E0B] text-white"
                          : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Status Filter */}
              <div>
                <label className="text-sm text-[#6B7280] mb-2 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {contractStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        selectedStatus === status
                          ? "bg-[#F59E0B] text-white"
                          : "bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-[#E5E7EB]">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab
                  ? "text-[#1A1A1A]"
                  : "text-[#6B7280] hover:text-[#374151]"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A]" />
              )}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredContracts.length === 0 && (
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
            <div className="mb-6">
              {searchQuery || selectedType !== "All" || selectedStatus !== "All" ? (
                <EmptySearch width={180} height={180} className="mx-auto" />
              ) : (
                <EmptyContracts width={180} height={180} className="mx-auto" />
              )}
            </div>
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">
              {searchQuery || selectedType !== "All" || selectedStatus !== "All"
                ? "No contracts found"
                : "No contracts yet"}
            </h3>
            <p className="text-sm text-[#6B7280] mb-6">
              {searchQuery || selectedType !== "All" || selectedStatus !== "All"
                ? "Try adjusting your search or filters"
                : "Upload your first contract to get started"}
            </p>
            {!searchQuery && selectedType === "All" && selectedStatus === "All" && (
              <Link href="/upload">
                <button className="flex items-center gap-2 px-6 py-3 bg-[#F59E0B] text-white rounded-xl font-medium hover:bg-[#D97706] transition-colors mx-auto">
                  <Plus className="w-5 h-5" />
                  Upload Contract
                </button>
              </Link>
            )}
          </div>
        )}

        {/* Contract Grid */}
        {filteredContracts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContracts.map((contract) => {
              const expiryInfo = getExpiryStatus(contract.expiryDate);
              
              return (
                <div key={contract.id} className="relative group">
                  <Link href={`/contracts/${contract.id}`}>
                    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow h-full flex flex-col">
                      {/* Header with status indicator */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-lg bg-[#F3F4F6] flex items-center justify-center">
                          {getContractTypeIcon(contract.type, contract.status === 'expired')}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${getStatusIndicator(contract.status)}`} />
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-[#1A1A1A] text-[16px] mb-2">{contract.name}</h3>

                      {/* Description */}
                      <p className="text-[13px] text-[#6B7280] leading-relaxed mb-4 line-clamp-2 flex-1">
                        {contract.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-2 py-1 bg-[#F3F4F6] text-[#374151] text-xs font-medium rounded">
                          {contract.type}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getExpiryBadgeStyle(contract.status)}`}>
                          {expiryInfo.label}
                        </span>
                      </div>

                      {/* Footer - Value & Owner */}
                      <div className="flex items-center justify-between pt-4 border-t border-[#F3F4F6]">
                        <div>
                          <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-0.5">Value</p>
                          <p className="text-[13px] font-medium text-[#1A1A1A]">{contract.value}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide">Owner</p>
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white text-xs font-medium">
                            {contract.ownerInitial}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Quick Actions Menu */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === contract.id ? null : contract.id);
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-[#F3F4F6]"
                    >
                      <MoreVertical className="w-4 h-4 text-[#6B7280]" />
                    </button>
                    
                    {openMenuId === contract.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-[#E5E7EB] z-10">
                        <button className="w-full px-4 py-2 text-left text-sm text-[#374151] hover:bg-[#F3F4F6] first:rounded-t-lg">
                          View
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-[#374151] hover:bg-[#F3F4F6]">
                          Analyze
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-[#374151] hover:bg-[#F3F4F6]">
                          Archive
                        </button>
                        <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg">
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Create New Card */}
            <Link href="/upload">
              <div className="bg-white rounded-xl border border-dashed border-[#D1D5DB] p-5 hover:border-[#9CA3AF] hover:bg-[#FAFAFA] transition-all h-full flex flex-col items-center justify-center text-center min-h-[260px]">
                <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-3">
                  <Plus className="w-5 h-5 text-[#9CA3AF]" />
                </div>
                <h3 className="font-medium text-[#1A1A1A] text-[15px] mb-1">Create New Contract</h3>
                <p className="text-xs text-[#9CA3AF]">Start from template or upload PDF</p>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
