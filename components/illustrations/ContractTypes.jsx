// Signova Illustrations — Contract Types
// Extracted from signova-illustrations-complete.html

export const ContractNDA = ({ width = 100, height = 100, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 100 100" fill="none" className={className}>
    <circle cx="50" cy="50" r="35" stroke="#1a1714" strokeWidth="2.2" fill="white"/>
    <path d="M32 58 Q50 65 68 58 Q50 51 32 58Z" stroke="#1a1714" strokeWidth="2" fill="white" strokeLinejoin="round"/>
    <path d="M32 58 L68 58" stroke="#1a1714" strokeWidth="3.5" strokeLinecap="round"/>
    <path d="M36 54 L64 54" stroke="#1a1714" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
    <ellipse cx="40" cy="44" rx="3" ry="3.5" fill="#1a1714"/>
    <ellipse cx="60" cy="44" rx="3" ry="3.5" fill="#1a1714"/>
  </svg>
);

export const ContractEmployment = ({ width = 100, height = 100, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 100 100" fill="none" className={className}>
    <path d="M20 55 Q18 50 22 47 L38 40 L42 45 L50 42 L58 45 L62 40 L78 47 Q82 50 80 55 L72 65 Q68 70 62 68 L50 65 L38 68 Q32 70 28 65Z" stroke="#1a1714" strokeWidth="2.2" fill="white" strokeLinejoin="round"/>
    <path d="M42 45 L58 45" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M20 55 L12 62" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M80 55 L88 62" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

export const ContractLease = ({ width = 100, height = 100, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 100 100" fill="none" className={className}>
    <path d="M20 85 L20 45 L50 20 L80 45 L80 85Z" stroke="#1a1714" strokeWidth="2.2" fill="white" strokeLinejoin="round"/>
    <path d="M12 48 L50 18 L88 48" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M40 85 L40 65 Q40 62 44 62 L56 62 Q60 62 60 65 L60 85Z" stroke="#1a1714" strokeWidth="1.8" fill="white" strokeLinejoin="round"/>
    <circle cx="57" cy="74" r="2" fill="#1a1714"/>
    <rect x="26" y="52" width="16" height="14" rx="2" stroke="#1a1714" strokeWidth="1.5" fill="none"/>
    <path d="M34 52 L34 66" stroke="#1a1714" strokeWidth="1" opacity="0.4"/>
    <path d="M26 59 L42 59" stroke="#1a1714" strokeWidth="1" opacity="0.4"/>
    <rect x="58" y="52" width="16" height="14" rx="2" stroke="#1a1714" strokeWidth="1.5" fill="none"/>
    <path d="M66 52 L66 66" stroke="#1a1714" strokeWidth="1" opacity="0.4"/>
    <path d="M58 59 L74 59" stroke="#1a1714" strokeWidth="1" opacity="0.4"/>
  </svg>
);

export const ContractContractor = ({ width = 100, height = 100, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 100 100" fill="none" className={className}>
    <path d="M18 48 L18 82 Q18 86 22 86 L78 86 Q82 86 82 82 L82 48 Q82 44 78 44 L22 44 Q18 44 18 48Z" stroke="#1a1714" strokeWidth="2.2" fill="white" strokeLinejoin="round"/>
    <path d="M38 44 L38 36 Q38 30 50 30 Q62 30 62 36 L62 44" stroke="#1a1714" strokeWidth="2" fill="none" strokeLinejoin="round"/>
    <path d="M18 60 L82 60" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M36 68 L36 78" stroke="#1a1714" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="36" cy="66" r="4" stroke="#1a1714" strokeWidth="1.8" fill="white"/>
    <path d="M50 64 L50 80" stroke="#1a1714" strokeWidth="3" strokeLinecap="round"/>
    <path d="M46 64 L54 64" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="66" cy="72" r="6" stroke="#1a1714" strokeWidth="1.8" fill="white"/>
    <circle cx="66" cy="72" r="2.5" fill="#1a1714"/>
    <path d="M66 64 L66 62" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M66 80 L66 82" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M58 72 L56 72" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M74 72 L76 72" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export default {
  ContractNDA,
  ContractEmployment,
  ContractLease,
  ContractContractor
};
