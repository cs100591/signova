"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  SlidersHorizontal, 
  Search, 
  MoreVertical,
  Loader2,
  Check,
  ChevronRight
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
  IconBusiness,
  IconOther,
  IconExpired
} from "@/components/illustrations";

interface Contract {
  id: string;
  name: string;
  type: string;
  description: string;
  amount: string | null;
  currency: string | null;
  expiry_date: string | null;
  owner: string;
  owner_initial: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'indefinite';
  created_at: string;
  workspace_id?: string | null;
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

const contractTypes = ["All", "MSA", "NDA", "Employment", "Contractor", "Renewal", "Lease", "Service", "SaaS", "Partnership", "Other"];
const contractStatuses = ["All", "Active", "Expiring Soon", "Expired", "Indefinite"];

// Normalize contract type string to canonical key for icon matching
const normalizeContractType = (type: string): string => {
  const t = (type || "").toLowerCase();
  if (t.includes("nda") || t.includes("non-disclosure") || t.includes("confidentiality")) return "NDA";
  if (t.includes("msa") || t.includes("master service")) return "MSA";
  if (t.includes("employment") || t.includes("employee") || t.includes("offer letter")) return "Employment";
  if (t.includes("contractor") || t.includes("independent contractor") || t.includes("freelance")) return "Contractor";
  if (t.includes("lease") || t.includes("tenancy") || t.includes("rental") || t.includes("office")) return "Lease";
  if (t.includes("renewal")) return "Renewal";
  if (t.includes("internal")) return "Internal";
  if (t.includes("partnership") || t.includes("joint venture")) return "Partnership";
  if (t.includes("saas") || t.includes("software") || t.includes("license") || t.includes("subscription") || t.includes("platform")) return "SaaS";
  if (t.includes("service") || t.includes("sow") || t.includes("statement of work")) return "Service";
  if (t.includes("vendor") || t.includes("business") || t.includes("supply")) return "Business";
  if (t.includes("other") || t.includes("general") || t.includes("miscellaneous")) return "Other";
  return type;
};

// Helper function to get icon component based on contract type
const getContractTypeIcon = (type: string, isExpired: boolean = false) => {
  const iconProps = { width: 36, height: 36, className: isExpired ? "text-red-500" : "text-[#1a1714]" };

  if (isExpired) {
    return <IconExpired {...iconProps} />;
  }

  const normalized = normalizeContractType(type);

  switch (normalized) {
    case "NDA":        return <IconNDA {...iconProps} />;
    case "MSA":        return <IconMSA {...iconProps} />;
    case "Employment": return <IconEmployment {...iconProps} />;
    case "Contractor": return <IconContractor {...iconProps} />;
    case "Lease":      return <IconLease {...iconProps} />;
    case "Renewal":    return <IconRenewal {...iconProps} />;
    case "Internal":   return <IconInternal {...iconProps} />;
    case "Service":    return <IconService {...iconProps} />;
    case "Partnership":return <IconPartnership {...iconProps} />;
    case "SaaS":
    case "License":    return <IconSaaS {...iconProps} />;
    case "Business":   return <IconBusiness {...iconProps} />;
    case "Other":      return <IconOther {...iconProps} />;
    default:           return <IconGeneral {...iconProps} />;
  }
};

// Format currency with proper symbol and comma grouping
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', MYR: 'RM', SGD: 'S$', GBP: '£', EUR: '€',
  AUD: 'A$', INR: '₹', PHP: '₱', IDR: 'Rp', CAD: 'C$',
  JPY: '¥', CNY: '¥', HKD: 'HK$', THB: '฿', KRW: '₩',
};

const formatCurrency = (amount: string | number | null, currency: string | null): string => {
  if (amount === null || amount === undefined) return 'N/A';
  const str = String(amount);
  const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return str;
  const symbol = CURRENCY_SYMBOLS[currency || 'USD'] || (currency ? `${currency} ` : '$');
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export default function ContractsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All Contracts");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [moveMenuOpenId, setMoveMenuOpenId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const tabs = ["All Contracts", "Drafts", "Archived"];

  // Fetch workspaces
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await fetch("/api/workspaces");
        if (res.ok) {
          const data = await res.json();
          setWorkspaces(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Failed to fetch workspaces:", e);
      }
    };
    fetchWorkspaces();
  }, []);

  // Fetch contracts from API
  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const workspaceId = localStorage.getItem('activeWorkspaceId');
      const url = workspaceId ? `/api/contracts?workspaceId=${workspaceId}` : '/api/contracts';

      const response = await fetch(url, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch contracts: ${response.status}`);
      }
      
      const data = await response.json();
      
      const transformedContracts: Contract[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name || item.title || 'Untitled Contract',
        type: item.type || 'Other',
        description: item.summary || item.description || 'No description available',
        amount: item.amount || null,
        currency: item.currency || null,
        expiry_date: item.expiry_date,
        owner: item.owner || 'You',
        owner_initial: item.owner?.charAt(0).toUpperCase() || 'Y',
        status: item.status || 'active',
        created_at: item.created_at,
        workspace_id: item.workspace_id
      }));
      
      setContracts(transformedContracts);
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError(err.message || 'Failed to load contracts');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();

    const handleWorkspaceChange = () => {
      fetchContracts();
    };

    window.addEventListener('workspaceChange', handleWorkspaceChange);
    return () => {
      window.removeEventListener('workspaceChange', handleWorkspaceChange);
    };
  }, [router]);

  const handleDelete = async (contractId: string) => {
    if (!confirm("Delete this contract? This cannot be undone.")) return;
    try {
      setIsDeleting(contractId);
      const res = await fetch(`/api/contracts/${contractId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete contract");
      setContracts(contracts.filter(c => c.id !== contractId));
      setOpenMenuId(null);
      window.dispatchEvent(new Event('workspaceUpdate'));
    } catch (e) {
      console.error("Delete error:", e);
      alert("Failed to delete contract");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleMoveToWorkspace = async (contractId: string, workspaceId: string | null) => {
    try {
      setIsMoving(contractId);
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspace_id: workspaceId === 'personal' ? null : workspaceId }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to move contract");
      }
      
      // Tell workspace switcher to refetch counts
      window.dispatchEvent(new Event('workspaceUpdate'));
      
      // Update local state or refetch based on active view
      const activeWorkspaceId = localStorage.getItem('activeWorkspaceId');
      
      if ((activeWorkspaceId === 'personal' && workspaceId !== 'personal') || 
          (activeWorkspaceId !== 'personal' && workspaceId !== activeWorkspaceId)) {
        // If contract was moved out of current view, remove it from list
        setContracts(contracts.filter(c => c.id !== contractId));
      } else {
        fetchContracts();
      }
      
      setMoveMenuOpenId(null);
      setOpenMenuId(null);
    } catch (e) {
      console.error("Move error:", e);
      alert("Failed to move contract");
    } finally {
      setIsMoving(null);
    }
  };

  // Filter contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      // Search filter
      const matchesSearch = 
        contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter — normalize both sides so "SaaS Subscription & Service Agreement" matches "SaaS"
      const matchesType = selectedType === "All" || normalizeContractType(contract.type) === selectedType;
      
      // Status filter - calculate real status from expiry_date
      const expiryInfo = getExpiryStatus(contract.expiry_date);
      const matchesStatus = selectedStatus === "All" || 
        (selectedStatus === "Expiring Soon" && expiryInfo.status === "expiring_soon") ||
        (selectedStatus === "Expired" && expiryInfo.status === "expired") ||
        (selectedStatus === "Active" && expiryInfo.status === "active") ||
        (selectedStatus === "Indefinite" && expiryInfo.status === "indefinite");
      
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

  const getStatusIndicator = (expiryDate: string | null) => {
    const expiryInfo = getExpiryStatus(expiryDate);
    switch (expiryInfo.status) {
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
      if (!c.expiry_date) return false;
      const expiry = new Date(c.expiry_date);
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      return expiry <= thirtyDaysFromNow && expiry >= today;
    }).length;
    
    const highRisk = contracts.filter(c => {
      const expiryInfo = getExpiryStatus(c.expiry_date);
      return expiryInfo.status === 'expired' || expiryInfo.status === 'expiring_soon';
    }).length;
    
    const analyzed = contracts.length; // All uploaded contracts are considered analyzed
    
    return {
      total,
      expiringThisMonth,
      highRisk,
      analyzed,
      totalContracts: total
    };
  }, [contracts]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#F59E0B]" />
          <p className="text-[#6B7280]">Loading contracts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4 text-lg">⚠️ Error loading contracts</div>
          <p className="text-[#6B7280] mb-4">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706]"
            >
              Retry
            </button>
            <Link href="/login">
              <button className="px-4 py-2 border border-[#E5E7EB] text-[#6B7280] rounded-lg hover:bg-[#F3F4F6]">
                Go to Login
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              const expiryInfo = getExpiryStatus(contract.expiry_date);
              
              return (
                <div key={contract.id} className="relative group">
                  <Link href={`/contracts/${contract.id}`}>
                    <div className="bg-white rounded-xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow h-full flex flex-col">
                      {/* Header with status indicator */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 flex items-center justify-center">
                          {getContractTypeIcon(contract.type, expiryInfo.status === 'expired')}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${getStatusIndicator(contract.expiry_date)}`} />
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
                        <motion.span 
                          animate={expiryInfo.status === 'expiring_soon' || expiryInfo.status === 'expired' ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                          className={`px-2 py-1 text-xs font-medium rounded border ${getExpiryBadgeStyle(expiryInfo.status)}`}
                        >
                          {expiryInfo.label}
                        </motion.span>
                      </div>

                      {/* Footer - Value & Owner */}
                      <div className="flex items-center justify-between pt-4 border-t border-[#F3F4F6]">
                        <div>
                          <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide mb-0.5">Value</p>
                          <p className="text-[13px] font-medium text-[#1A1A1A]">{formatCurrency(contract.amount, contract.currency)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide">Owner</p>
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center text-white text-xs font-medium">
                            {contract.owner_initial}
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
                        setMoveMenuOpenId(null);
                      }}
                      className="p-2 bg-white rounded-lg shadow-md hover:bg-[#F3F4F6]"
                    >
                      <MoreVertical className="w-4 h-4 text-[#6B7280]" />
                    </button>
                    
                    {openMenuId === contract.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#E5E7EB] z-20">
                        <Link href={`/contracts/${contract.id}`}>
                          <button className="w-full px-4 py-2 text-left text-sm text-[#374151] hover:bg-[#F3F4F6] first:rounded-t-lg">
                            View
                          </button>
                        </Link>
                        <Link href={`/contracts/${contract.id}?tab=analysis`}>
                          <button className="w-full px-4 py-2 text-left text-sm text-[#374151] hover:bg-[#F3F4F6]">
                            Analyze
                          </button>
                        </Link>
                        
                        {/* Move to Workspace — inline expand */}
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-[#374151] hover:bg-[#F3F4F6] flex items-center justify-between"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMoveMenuOpenId(moveMenuOpenId === contract.id ? null : contract.id);
                          }}
                        >
                          <span>Move to Workspace</span>
                          <ChevronRight className={`w-3.5 h-3.5 text-[#9CA3AF] transition-transform ${moveMenuOpenId === contract.id ? "rotate-90" : ""}`} />
                        </button>

                        {moveMenuOpenId === contract.id && (
                          <div className="border-t border-b border-[#F3F4F6] bg-[#FAFAFA]">
                            <button
                              disabled={isMoving === contract.id || contract.workspace_id === null}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMoveToWorkspace(contract.id, 'personal');
                              }}
                              className={`w-full pl-7 pr-4 py-2 text-left text-sm flex items-center gap-2 ${contract.workspace_id === null ? 'text-[#9CA3AF]' : 'text-[#374151] hover:bg-[#F3F4F6]'}`}
                            >
                              {contract.workspace_id === null
                                ? <Check className="w-3 h-3 text-[#F59E0B] flex-shrink-0" />
                                : <span className="w-3 flex-shrink-0" />}
                              <span className="truncate">Personal Space</span>
                              {isMoving === contract.id && contract.workspace_id !== null && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
                            </button>

                            {workspaces.filter(ws => ws.id !== 'personal').map(ws => (
                              <button
                                key={ws.id}
                                disabled={isMoving === contract.id || contract.workspace_id === ws.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleMoveToWorkspace(contract.id, ws.id);
                                }}
                                className={`w-full pl-7 pr-4 py-2 text-left text-sm flex items-center gap-2 ${contract.workspace_id === ws.id ? 'text-[#9CA3AF]' : 'text-[#374151] hover:bg-[#F3F4F6]'}`}
                              >
                                {contract.workspace_id === ws.id
                                  ? <Check className="w-3 h-3 text-[#F59E0B] flex-shrink-0" />
                                  : <span className="w-3 flex-shrink-0" />}
                                <span className="truncate">{ws.name}</span>
                                {isMoving === contract.id && contract.workspace_id !== ws.id && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
                              </button>
                            ))}
                          </div>
                        )}

                        <button className="w-full px-4 py-2 text-left text-sm text-[#374151] hover:bg-[#F3F4F6]">
                          Archive
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg flex items-center gap-2"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(contract.id); }}
                          disabled={isDeleting === contract.id}
                        >
                          {isDeleting === contract.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
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
