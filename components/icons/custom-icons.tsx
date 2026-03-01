// Custom SVG Icons - No background, clean stroke style
// Extracted from signova-icons-clean.html

export const FileIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <path d="M6 27 L6 7 Q6 5 8 5 L20 5 L26 11 L26 27 Q26 29 24 29 L8 29 Q6 29 6 27Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M20 5 L20 11 L26 11" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 16 L22 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 20 L22 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 24 L16 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const UploadIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <path d="M6 27 L6 7 Q6 5 8 5 L20 5 L26 11 L26 27 Q26 29 24 29 L8 29 Q6 29 6 27Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M20 5 L20 11 L26 11" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 16 L16 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 19 L16 15 L20 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DownloadIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <path d="M6 27 L6 7 Q6 5 8 5 L20 5 L26 11 L26 27 Q26 29 24 29 L8 29 Q6 29 6 27Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M20 5 L20 11 L26 11" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M16 24 L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 21 L16 25 L20 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DeleteIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <path d="M6 27 L6 7 Q6 5 8 5 L20 5 L26 11 L26 27 Q26 29 24 29 L8 29 Q6 29 6 27Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M20 5 L20 11 L26 11" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M11 15 L21 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M21 15 L11 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const EditIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <path d="M6 27 L6 7 Q6 5 8 5 L20 5 L26 11 L26 27 Q26 29 24 29 L8 29 Q6 29 6 27Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeDasharray="4 2"/>
    <path d="M20 5 L20 11 L26 11" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M13 23 L19 17 L22 20 L16 26 Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M19 17 L21 15 L23 17 L22 20" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
    <path d="M13 23 L11 26 L14 25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <path d="M6 27 L6 7 Q6 5 8 5 L20 5 L26 11 L26 27 Q26 29 24 29 L8 29 Q6 29 6 27Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
    <path d="M20 5 L20 11 L26 11" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M10 18 L14 22 L22 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ContractTypeIcons: Record<string, React.FC<{ className?: string }>> = {
  employment: ({ className = "w-8 h-8" }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 14 L16 18 L20 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 17 L14.5 22 L16 24 L17.5 22 Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M8 30 Q8 23 16 23 Q24 23 24 30" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  freelance: ({ className = "w-8 h-8" }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <path d="M4 13 L4 26 Q4 28 6 28 L26 28 Q28 28 28 26 L28 13 Q28 11 26 11 L6 11 Q4 11 4 13Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M11 11 L11 8 Q11 5 16 5 Q21 5 21 8 L21 11" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M4 18 L28 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 22 L12 25" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="12" cy="21" r="2" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M17 21 L17 25" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M15 21 L19 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="23" cy="23" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
      <circle cx="23" cy="23" r="1" fill="currentColor"/>
      <path d="M23 20 L23 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M23 27 L23 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M20 23 L19 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M26 23 L27 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  business: ({ className = "w-8 h-8" }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <path d="M3 17 Q3 14 6 13 L12 11 L14 14 L16 12 L18 14 L20 11 L26 13 Q29 14 29 17 L26 23 Q23 27 20 25 L16 23 L12 25 Q9 27 6 23 Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M14 14 L18 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M3 17 L1 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M29 17 L31 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  nda: ({ className = "w-8 h-8" }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <path d="M16 3 L27 7 L27 17 Q27 25 16 30 Q5 25 5 17 L5 7 Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M12 16 L12 21 L20 21 L20 16 Q20 12 16 12 Q12 12 12 16 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M13.5 16 L13.5 14 Q13.5 11 16 11 Q18.5 11 18.5 14 L18.5 16" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="16" cy="18.5" r="1.3" fill="currentColor"/>
    </svg>
  ),
  lease: ({ className = "w-8 h-8" }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <path d="M4 28 L4 14 L16 4 L28 14 L28 28 Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M2 15 L16 3 L30 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 28 L12 20 Q12 18 14.5 18 L17.5 18 Q20 18 20 20 L20 28" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <circle cx="18.5" cy="24" r="1.2" fill="currentColor"/>
      <rect x="7" y="17" width="5.5" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
    </svg>
  ),
  other: ({ className = "w-8 h-8" }) => (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <path d="M5 26 L5 8 Q5 6 7 6 L21 6 L27 12 L27 26 Q27 28 25 28 L7 28 Q5 28 5 26Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M21 6 L21 12 L27 12" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 14 L23 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="11" cy="20" r="1.5" fill="currentColor"/>
      <circle cx="16" cy="20" r="1.5" fill="currentColor"/>
      <circle cx="21" cy="20" r="1.5" fill="currentColor"/>
    </svg>
  ),
};
