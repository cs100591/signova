// Signova Illustrations — Upload States
// Extracted from signova-illustrations-complete.html

export const UploadIdle = ({ width = 200, height = 160, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 200 160" fill="none" className={className}>
    <path d="M55 105 Q45 105 45 93 Q45 82 56 82 Q56 68 70 67 Q78 58 90 62 Q100 55 112 62 Q124 60 126 72 Q136 73 136 85 Q136 97 124 97 L55 105Z" stroke="#1a1714" strokeWidth="2.5" fill="white" strokeLinejoin="round"/>
    <path d="M90 130 L90 98" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M78 110 L90 97 L102 110" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M38 118 L38 145 L52 145 L52 128 L46 120 L38 118Z" stroke="#1a1714" strokeWidth="1.8" fill="white" strokeLinejoin="round"/>
    <path d="M46 120 L46 128 L52 128" stroke="#1a1714" strokeWidth="1.5" fill="none"/>
    <path d="M42 133 L48 133" stroke="#1a1714" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    <path d="M42 139 L48 139" stroke="#1a1714" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    <path d="M128 118 L128 145 L142 145 L142 128 L136 120 L128 118Z" stroke="#1a1714" strokeWidth="1.8" fill="white" strokeLinejoin="round"/>
    <path d="M136 120 L136 128 L142 128" stroke="#1a1714" strokeWidth="1.5" fill="none"/>
    <path d="M132 133 L138 133" stroke="#1a1714" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    <path d="M132 139 L138 139" stroke="#1a1714" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    <circle cx="90" cy="80" r="62" stroke="#1a1714" strokeWidth="1.2" strokeDasharray="5 4" opacity="0.12"/>
    <circle cx="68" cy="52" r="2.5" fill="#1a1714" opacity="0.2"/>
    <circle cx="112" cy="46" r="1.8" fill="#1a1714" opacity="0.2"/>
  </svg>
);

export const UploadScanning = ({ width = 200, height = 160, className = "" }) => (
  <svg width={width} height={height} viewBox="0 0 200 160" fill="none" className={className}>
    <path d="M55 148 L55 28 Q55 22 62 22 L138 22 Q145 22 145 28 L145 148 Q145 154 138 154 L62 154 Q55 154 55 148Z" stroke="#1a1714" strokeWidth="2.5" fill="white" strokeLinejoin="round"/>
    <path d="M118 22 L118 42 L138 42" stroke="#1a1714" strokeWidth="1.8" fill="none"/>
    <path d="M70 60 Q100 57 130 60" stroke="#1a1714" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M70 72 Q100 69 130 72" stroke="#1a1714" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M70 84 Q100 81 130 84" stroke="#1a1714" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M70 96 Q100 93 130 96" stroke="#1a1714" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M70 108 Q95 106 120 108" stroke="#1a1714" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M55 88 L145 88" stroke="#1a1714" strokeWidth="3" strokeLinecap="round" opacity="0.5" strokeDasharray="6 3"/>
    <path d="M32 80 L55 80" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M32 88 L55 88" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M32 96 L55 96" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
    <path d="M25 76 L25 100 Q25 104 30 104 L38 104 L38 76 Q38 72 33 72 Q28 72 25 76Z" stroke="#1a1714" strokeWidth="1.8" fill="white" strokeLinejoin="round"/>
    <path d="M145 88 L165 80" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
    <path d="M145 88 L168 88" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
    <path d="M145 88 L165 96" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.35"/>
    <path d="M30 38 L30 32 L42 32 L42 38" stroke="#1a1714" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
    <path d="M36 32 L36 22" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export default {
  UploadIdle,
  UploadScanning
};
