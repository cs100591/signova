/**
 * Signova Logo — C2 Bold Quill
 * Shield + quill SVG with optional wordmark text.
 */

interface SignovaLogoIconProps {
  size?: number;
  className?: string;
}

export function SignovaLogoIcon({ size = 32, className }: SignovaLogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="96" height="96" rx="22" fill="#1a1714" />
      {/* shield */}
      <path
        d="M48 13 L70 22 L70 47 Q70 67 48 79 Q26 67 26 47 L26 22 Z"
        fill="none"
        stroke="#f5f0e8"
        strokeWidth="2.2"
      />
      <path
        d="M48 13 L70 22 L70 47 Q70 67 48 79 Q26 67 26 47 L26 22 Z"
        fill="#c8873a"
        fillOpacity="0.07"
      />
      {/* quill feather */}
      <path
        d="M65 22 Q78 36 56 56 L44 70 L39 57 Q61 48 65 22Z"
        fill="#f5f0e8"
        fillOpacity="0.2"
        stroke="#f5f0e8"
        strokeWidth="2.2"
      />
      {/* quill spine */}
      <path
        d="M65 22 Q54 42 44 70"
        stroke="#f5f0e8"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* amber nib */}
      <path d="M44 70 L37 77 L39 57 Z" fill="#c8873a" />
      {/* signature line */}
      <path
        d="M32 80 Q40 76 48 79 Q56 82 65 78"
        stroke="#c8873a"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

interface SignovaLogoProps {
  size?: number;
  textClassName?: string;
  className?: string;
}

export function SignovaLogo({ size = 30, textClassName, className }: SignovaLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className || ''}`}>
      <SignovaLogoIcon size={size} />
      <span className={`font-serif tracking-tight ${textClassName || 'text-[15px] text-[#1a1714]'}`}>
        Signova
      </span>
    </span>
  );
}
