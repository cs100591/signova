// Signova Illustrations — Empty States
// Extracted from signova-illustrations-complete.html

export const EmptyContracts = ({ width = 180, height = 180, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 180 180" fill="none" className={className}>
    <path d="M30 140 Q90 136 150 140" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M45 140 L42 158" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M135 140 L138 158" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M55 115 L55 65 Q55 60 60 60 L80 60 L85 55 L120 55 Q125 55 125 60 L125 115 Q125 120 120 120 L60 120 Q55 120 55 115Z" stroke="#1a1714" strokeWidth="2.5" fill="white" strokeLinejoin="round"/>
    <path d="M65 75 Q90 72 115 75" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <path d="M65 85 Q90 82 115 85" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <path d="M65 95 Q85 93 100 95" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <path d="M83 100 Q83 91 90 88 Q97 85 97 78 Q97 70 90 70 Q83 70 83 77" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" fill="none"/>
    <circle cx="90" cy="105" r="2" fill="#1a1714"/>
    <path d="M35 55 L36.5 52 L38 55 L41 56.5 L38 58 L36.5 61 L35 58 L32 56.5Z" stroke="#1a1714" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    <path d="M148 40 L149 38 L150 40 L152 41 L150 42 L149 44 L148 42 L146 41Z" stroke="#1a1714" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
  </svg>
);

export const EmptySearch = ({ width = 180, height = 180, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 180 180" fill="none" className={className}>
    <circle cx="82" cy="82" r="44" stroke="#1a1714" strokeWidth="2.5" fill="white"/>
    <path d="M116 116 L148 148" stroke="#1a1714" strokeWidth="4" strokeLinecap="round"/>
    <path d="M145 145 L152 152" stroke="#1a1714" strokeWidth="3" strokeLinecap="round" opacity="0.35"/>
    <path d="M60 82 Q82 74 104 82" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
    <path d="M60 90 Q82 82 104 90" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.2"/>
    <path d="M74 82 Q74 72 82 70 Q90 68 90 60 Q90 52 82 52 Q74 52 74 60" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
    <circle cx="82" cy="92" r="3" fill="#1a1714"/>
    <path d="M28 50 L30 46 L32 50 L36 52 L32 54 L30 58 L28 54 L24 52Z" stroke="#1a1714" strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
    <path d="M148 55 L149.5 51 L151 55 L155 56.5 L151 58 L149.5 62 L148 58 L144 56.5Z" stroke="#1a1714" strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
  </svg>
);

export const EmptyArchive = ({ width = 180, height = 180, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 180 180" fill="none" className={className}>
    <path d="M30 75 L30 145 Q30 150 35 150 L145 150 Q150 150 150 145 L150 75 Q150 70 145 70 L35 70 Q30 70 30 75Z" stroke="#1a1714" strokeWidth="2.5" fill="white" strokeLinejoin="round"/>
    <path d="M25 65 L155 65 Q160 65 160 70 L160 80 Q160 85 155 85 L25 85 Q20 85 20 80 L20 70 Q20 65 25 65Z" stroke="#1a1714" strokeWidth="2.2" fill="white" strokeLinejoin="round"/>
    <path d="M70 75 Q70 65 90 65 Q110 65 110 75" stroke="#1a1714" strokeWidth="2" fill="none" strokeLinejoin="round"/>
    <path d="M55 105 Q90 101 125 105" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3"/>
    <path d="M55 118 Q90 114 125 118" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3"/>
    <path d="M55 131 Q80 128 105 131" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3"/>
    <path d="M38 38 L40 32 L42 38 L48 40 L42 42 L40 48 L38 42 L32 40Z" stroke="#1a1714" strokeWidth="1.3" fill="none" strokeLinejoin="round"/>
  </svg>
);

export default {
  EmptyContracts,
  EmptySearch,
  EmptyArchive
};
