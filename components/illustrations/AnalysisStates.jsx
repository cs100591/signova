// Signova Illustrations — Analysis States
// Extracted from signova-illustrations-complete.html

export const AnalysisInProgress = ({ width = 200, height = 200, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 200 200" fill="none" className={className}>
    <path d="M52 62 Q52 48 76 48 Q100 48 100 62" stroke="#1a1714" strokeWidth="2.5" fill="white" strokeLinejoin="round"/>
    <path d="M44 62 L108 62" stroke="#1a1714" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="76" cy="78" r="18" stroke="#1a1714" strokeWidth="2.2" fill="white"/>
    <ellipse cx="70" cy="78" rx="3" ry="3.5" fill="#1a1714"/>
    <ellipse cx="82" cy="78" rx="3" ry="3.5" fill="#1a1714"/>
    <path d="M70 88 Q76 92 82 88" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M76 96 L76 140" stroke="#1a1714" strokeWidth="2.8" strokeLinecap="round"/>
    <path d="M60 96 L76 96 L92 96" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M60 96 L52 120 L68 115 L76 130" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M92 96 L100 120 L84 115 L76 130" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M76 110 L52 98" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="42" cy="94" r="12" stroke="#1a1714" strokeWidth="2" fill="white"/>
    <path d="M52 104 L58 110" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M36 90 L48 90" stroke="#1a1714" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M36 94 L48 94" stroke="#1a1714" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M36 98 L44 98" stroke="#1a1714" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M76 110 L100 102" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M100 92 L118 92 L118 112 L100 112Z" stroke="#1a1714" strokeWidth="1.8" fill="white" strokeLinejoin="round"/>
    <path d="M104 98 L114 98" stroke="#1a1714" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M104 103 L114 103" stroke="#1a1714" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M76 140 L65 165" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M76 140 L87 165" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round"/>
    <path d="M84 86 Q90 84 92 80 Q94 76 90 74 Q86 72 84 76" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <path d="M92 74 Q94 68 90 64 Q96 60 94 54" stroke="#1a1714" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4"/>
    <path d="M20 168 Q100 163 180 168" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" opacity="0.2"/>
  </svg>
);

export const AnalysisComplete = ({ width = 180, height = 180, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 180 180" fill="none" className={className}>
    <circle cx="78" cy="78" r="36" stroke="#1a1714" strokeWidth="2.5" fill="white"/>
    <path d="M105 105 L135 135" stroke="#1a1714" strokeWidth="4" strokeLinecap="round"/>
    <path d="M132 132 L138 138" stroke="#1a1714" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
    <path d="M62 78 L73 89 L96 66" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M30 48 L35 44" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <path d="M26 56 L22 56" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <path d="M32 64 L27 67" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    <path d="M140 48 L141.5 44 L143 48 L147 49.5 L143 51 L141.5 55 L140 51 L136 49.5Z" stroke="#1a1714" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    <path d="M148 70 L149 68 L150 70 L152 71 L150 72 L149 74 L148 72 L146 71Z" stroke="#1a1714" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
    <path d="M48 148 Q70 142 90 148 Q110 154 132 148" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.2"/>
  </svg>
);

export default {
  AnalysisInProgress,
  AnalysisComplete
};
