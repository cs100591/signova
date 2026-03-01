// Signova Illustrations — Error States
// Extracted from signova-illustrations-complete.html

export const Error404 = ({ width = 340, height = 180, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 340 180" fill="none" className={className}>
    <path d="M35 60 L35 110 L65 110" stroke="#1a1714" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M65 60 L65 140" stroke="#1a1714" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <path d="M35 60 L55 60" stroke="#1a1714" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <ellipse cx="170" cy="100" rx="50" ry="44" stroke="#1a1714" strokeWidth="3" fill="white"/>
    <ellipse cx="170" cy="100" rx="30" ry="26" stroke="#1a1714" strokeWidth="2" fill="white" opacity="0.6"/>
    <path d="M225 60 L225 110 L255 110" stroke="#1a1714" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M255 60 L255 140" stroke="#1a1714" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <path d="M225 60 L245 60" stroke="#1a1714" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <circle cx="170" cy="86" r="7" stroke="#1a1714" strokeWidth="2" fill="white"/>
    <path d="M170 93 L170 110" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M170 100 L160 94" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M170 100 L180 94" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M170 110 L164 122" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M170 110 L176 122" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M170 70 Q170 64 175 62 Q180 60 180 55 Q180 50 175 49 Q170 48 168 52" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <circle cx="170" cy="74" r="1.5" fill="#1a1714"/>
    <path d="M98 42 L99.5 38 L101 42 L105 43.5 L101 45 L99.5 49 L98 45 L94 43.5Z" stroke="#1a1714" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    <path d="M280 55 L281.5 51 L283 55 L287 56.5 L283 58 L281.5 62 L280 58 L276 56.5Z" stroke="#1a1714" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    <path d="M20 158 Q170 152 320 158" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M80 158 Q82 150 84 158" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M85 158 Q87 153 89 158" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M250 158 Q252 151 254 158" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M255 158 Q257 154 259 158" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
  </svg>
);

export const ErrorGeneral = ({ width = 200, height = 180, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 200 180" fill="none" className={className}>
    <path d="M60 40 L60 130 Q60 136 66 136 L134 136 Q140 136 140 130 L140 56 L124 40Z" stroke="#1a1714" strokeWidth="2.5" fill="white" strokeLinejoin="round"/>
    <path d="M124 40 L124 56 L140 56" stroke="#1a1714" strokeWidth="2" fill="none"/>
    <path d="M80 70 L88 82 L78 90 L90 105 L84 118" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.6"/>
    <path d="M110 65 L106 76 L114 84 L108 96" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"/>
    <path d="M160 40 L157 80" stroke="#1a1714" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="158" cy="92" r="5" stroke="#1a1714" strokeWidth="2.5" fill="white"/>
    <circle cx="36" cy="80" r="12" stroke="#1a1714" strokeWidth="2" fill="white"/>
    <ellipse cx="32" cy="82" rx="2" ry="2.5" fill="#1a1714"/>
    <ellipse cx="40" cy="82" rx="2" ry="2.5" fill="#1a1714"/>
    <path d="M32 90 Q36 87 40 90" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <path d="M36 68 Q38 64 42 66" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <path d="M36 92 L36 115" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M36 100 L25 95" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M36 100 L47 95" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M36 115 L29 130" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M36 115 L43 130" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export default {
  Error404,
  ErrorGeneral
};
