// Signova Illustrations — Dashboard Stats
// Small illustrations for dashboard stat cards

export const DashboardTotalContracts = ({ width = 40, height = 40, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 100 100" fill="none" className={className}>
    <rect x="20" y="25" width="55" height="70" rx="4" stroke="#1a1714" strokeWidth="2.5" fill="white" strokeLinejoin="round"/>
    <rect x="15" y="20" width="55" height="70" rx="4" stroke="#1a1714" strokeWidth="2.5" fill="white" strokeLinejoin="round"/>
    <rect x="10" y="15" width="55" height="70" rx="4" stroke="#1a1714" strokeWidth="2.5" fill="white" strokeLinejoin="round"/>
    <path d="M22 35 L52 35" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    <path d="M22 48 L52 48" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    <path d="M22 61 L42 61" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

export const DashboardExpiring = ({ width = 40, height = 40, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 100 100" fill="none" className={className}>
    <circle cx="50" cy="50" r="35" stroke="#1a1714" strokeWidth="2.5" fill="white"/>
    <circle cx="50" cy="50" r="3" fill="#1a1714"/>
    <path d="M50 50 L50 28" stroke="#1a1714" strokeWidth="3" strokeLinecap="round"/>
    <path d="M50 50 L64 60" stroke="#1a1714" strokeWidth="3" strokeLinecap="round"/>
    <path d="M75 20 L78 15 L81 20" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M85 28 L90 25 L90 30" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

export const DashboardHighRisk = ({ width = 40, height = 40, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 100 100" fill="none" className={className}>
    <path d="M50 15 L85 75 L15 75 Z" stroke="#1a1714" strokeWidth="2.5" fill="white" strokeLinejoin="round"/>
    <path d="M50 40 L50 55" stroke="#1a1714" strokeWidth="3.5" strokeLinecap="round"/>
    <circle cx="50" cy="65" r="3" fill="#1a1714"/>
    <path d="M20 20 L25 15" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
    <path d="M75 20 L80 15" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

export const DashboardAnalyzed = ({ width = 40, height = 40, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 100 100" fill="none" className={className}>
    <rect x="15" y="55" width="15" height="35" rx="2" stroke="#1a1714" strokeWidth="2.5" fill="white" strokeLinejoin="round"/>
    <rect x="38" y="35" width="15" height="55" rx="2" stroke="#1a1714" strokeWidth="2.5" fill="white" strokeLinejoin="round"/>
    <rect x="61" y="20" width="15" height="70" rx="2" stroke="#1a1714" strokeWidth="2.5" fill="white" strokeLinejoin="round"/>
    <path d="M18 25 L22 21" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
    <path d="M80 15 L84 11" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
  </svg>
);

export default {
  DashboardTotalContracts,
  DashboardExpiring,
  DashboardHighRisk,
  DashboardAnalyzed
};
