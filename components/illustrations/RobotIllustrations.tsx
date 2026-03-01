'use client';

import { motion } from 'framer-motion';

interface RobotProps {
  className?: string;
  size?: number;
}

// ① Idle 状态 - 等待上传
export function WaitingRobot({ className = '', size = 160 }: RobotProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 光晕背景圈 */}
      <circle cx="80" cy="88" r="55" fill="#f5f0e8"/>
      <circle cx="80" cy="88" r="42" fill="#eee8dc" opacity="0.6"/>
      
      {/* 机器人身体 */}
      <rect x="48" y="75" width="64" height="50" rx="12" stroke="#1a1714" strokeWidth="2.5" fill="white"/>
      {/* 身体细节线 */}
      <rect x="60" y="87" width="16" height="12" rx="3" stroke="#1a1714" strokeWidth="1.8" fill="white"/>
      <rect x="84" y="87" width="16" height="12" rx="3" stroke="#1a1714" strokeWidth="1.8" fill="white"/>
      {/* 嘴巴（微笑锯齿）*/}
      <path d="M62 108 L66 104 L70 108 L74 104 L78 108 L82 104 L86 108 L90 104 L94 108 L98 104" 
            stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* 天线 */}
      <path d="M80 75 L80 62" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="80" cy="58" r="5" stroke="#1a1714" strokeWidth="2" fill="white"/>
      {/* 天线信号圈 */}
      <path d="M73 54 Q73 47 80 47 Q87 47 87 54" stroke="#1a1714" strokeWidth="1.5" fill="none" opacity="0.3" strokeDasharray="3 2"/>
      <path d="M68 52 Q68 42 80 42 Q92 42 92 52" stroke="#1a1714" strokeWidth="1.2" fill="none" opacity="0.15" strokeDasharray="3 2"/>

      {/* 机器人头 */}
      <rect x="52" y="46" width="56" height="30" rx="10" stroke="#1a1714" strokeWidth="2.5" fill="white"/>
      {/* 眼睛（大圆眼） */}
      <circle cx="68" cy="60" r="7" stroke="#1a1714" strokeWidth="2" fill="white"/>
      <circle cx="92" cy="60" r="7" stroke="#1a1714" strokeWidth="2" fill="white"/>
      {/* 眼睛高光 */}
      <circle cx="68" cy="60" r="4" fill="#1a1714"/>
      <circle cx="92" cy="60" r="4" fill="#1a1714"/>
      <circle cx="70" cy="58" r="1.5" fill="white"/>
      <circle cx="94" cy="58" r="1.5" fill="white"/>

      {/* 手臂 */}
      <path d="M48 88 L32 98" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="28" cy="100" r="5" stroke="#1a1714" strokeWidth="2" fill="white"/>
      <path d="M112 88 L128 98" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="132" cy="100" r="5" stroke="#1a1714" strokeWidth="2" fill="white"/>

      {/* 腿 */}
      <path d="M64 125 L60 140" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M96 125 L100 140" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      {/* 脚 */}
      <path d="M55 140 L65 140" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M95 140 L105 140" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>

      {/* 文件（手里拿着）*/}
      <path d="M18 112 L18 138 L32 138 L32 120 L26 114 L18 112Z" stroke="#1a1714" strokeWidth="1.8" fill="white" strokeLinejoin="round"/>
      <path d="M26 114 L26 120 L32 120" stroke="#1a1714" strokeWidth="1.5" fill="none"/>
      <path d="M21 126 L29 126" stroke="#1a1714" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <path d="M21 131 L29 131" stroke="#1a1714" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>

      {/* 放大镜（另一手）*/}
      <circle cx="138" cy="116" r="10" stroke="#1a1714" strokeWidth="2" fill="white"/>
      <path d="M145 123 L152 130" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      {/* 放大镜里的问号 */}
      <path d="M134 113 Q134 108 138 108 Q142 108 142 112 Q142 115 138 116" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="138" cy="120" r="1.2" fill="#1a1714"/>

      {/* 装饰小星星 */}
      <path d="M22 55 L23.5 51 L25 55 L29 56.5 L25 58 L23.5 62 L22 58 L18 56.5Z" stroke="#1a1714" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
      <path d="M136 52 L137 49 L138 52 L141 53 L138 54 L137 57 L136 54 L133 53Z" stroke="#1a1714" strokeWidth="1" fill="none" strokeLinejoin="round"/>

      {/* 地面阴影 */}
      <ellipse cx="80" cy="144" rx="36" ry="5" fill="#1a1714" opacity="0.06"/>
    </motion.svg>
  );
}

// ② Scanning 状态 - 深度思考
export function ThinkingRobot({ className = '', size = 180 }: RobotProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* 背景圈 */}
      <circle cx="90" cy="95" r="62" fill="#f5f0e8" opacity="0.7"/>

      {/* 机器人头（侧倾，思考状）*/}
      <rect x="52" y="44" width="64" height="36" rx="12" stroke="#1a1714" strokeWidth="2.5" fill="white" transform="rotate(-5 84 62)"/>
      {/* 思考眼睛（一眯一睁）*/}
      <ellipse cx="70" cy="59" rx="6" ry="7" stroke="#1a1714" strokeWidth="2" fill="white"/>
      <circle cx="70" cy="59" r="4" fill="#1a1714"/>
      <circle cx="72" cy="57" r="1.5" fill="white"/>
      <path d="M88 56 Q94 52 100 56" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* 嘴巴 */}
      <path d="M70 70 Q84 66 92 70" stroke="#1a1714" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      {/* 天线 */}
      <path d="M90 44 L88 30" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round" transform="rotate(-5 89 37)"/>
      <circle cx="86" cy="26" r="5" stroke="#1a1714" strokeWidth="2" fill="white"/>

      {/* 思考泡泡 */}
      <circle cx="110" cy="32" r="3" stroke="#1a1714" strokeWidth="1.5" fill="white"/>
      <circle cx="122" cy="24" r="5" stroke="#1a1714" strokeWidth="1.5" fill="white"/>
      <circle cx="136" cy="14" r="8" stroke="#1a1714" strokeWidth="1.5" fill="white"/>
      {/* 泡泡里的问号 */}
      <path d="M132 11 Q132 7 136 7 Q140 7 140 10 Q140 13 136 14" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <circle cx="136" cy="17" r="1.2" fill="#1a1714"/>

      {/* 身体 */}
      <rect x="50" y="79" width="64" height="52" rx="14" stroke="#1a1714" strokeWidth="2.5" fill="white"/>
      {/* 胸口齿轮 */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '82px 104px' }}
      >
        <circle cx="82" cy="104" r="14" stroke="#1a1714" strokeWidth="2" fill="white"/>
        <circle cx="82" cy="104" r="7" stroke="#1a1714" strokeWidth="1.8" fill="white"/>
        <circle cx="82" cy="104" r="3" fill="#1a1714"/>
        {/* 齿轮齿 */}
        <path d="M82 88 L82 85" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M82 120 L82 123" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M68 104 L65 104" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M96 104 L99 104" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M72 94 L70 92" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
        <path d="M92 114 L94 116" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
        <path d="M72 114 L70 116" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
        <path d="M92 94 L94 92" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
      </motion.g>

      {/* 手臂（托着下巴思考）*/}
      <path d="M50 90 L32 102" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M114 90 L132 90" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="136" cy="90" r="5" stroke="#1a1714" strokeWidth="2" fill="white"/>

      {/* 腿 */}
      <path d="M68 131 L62 150" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M96 131 L102 150" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M56 150 L68 150" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M96 150 L108 150" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>

      <ellipse cx="82" cy="155" rx="36" ry="5" fill="#1a1714" opacity="0.06"/>
    </motion.svg>
  );
}

// ③ Complete 低风险 - All Clear
export function ClearRobot({ className = '', size = 120 }: RobotProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 260, damping: 20 }}
    >
      <circle cx="90" cy="95" r="62" fill="#f5f0e8" opacity="0.7"/>

      {/* 机器人头（超开心）*/}
      <rect x="54" y="38" width="64" height="38" rx="12" stroke="#1a1714" strokeWidth="2.5" fill="white"/>
      {/* 超开心眼睛（大星星）*/}
      <path d="M68 50 L70 44 L72 50 L78 52 L72 54 L70 60 L68 54 L62 52Z" stroke="#1a1714" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <path d="M100 50 L102 44 L104 50 L110 52 L104 54 L102 60 L100 54 L94 52Z" stroke="#1a1714" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      {/* 大笑嘴 */}
      <path d="M70 68 Q90 80 110 68" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      {/* 腮红 */}
      <ellipse cx="66" cy="68" rx="6" ry="4" fill="#1a1714" opacity="0.08"/>
      <ellipse cx="114" cy="68" rx="6" ry="4" fill="#1a1714" opacity="0.08"/>
      {/* 天线 */}
      <path d="M90 38 L90 24" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M90 18 L92 12 L94 18 L100 20 L94 22 L92 26 L90 22 L84 20Z" stroke="#1a1714" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>

      {/* 身体 */}
      <rect x="52" y="75" width="64" height="52" rx="14" stroke="#1a1714" strokeWidth="2.5" fill="white"/>
      {/* 胸口大拇指 */}
      <path d="M74 98 Q72 92 76 90 L82 89 L82 81 Q82 78 86 78 Q90 78 90 81 L90 89 L96 89 Q100 89 100 93 L100 103 Q100 107 96 107 L78 107 Q74 107 74 103Z" stroke="#1a1714" strokeWidth="1.8" fill="white" strokeLinejoin="round"/>

      {/* 手臂（双手比心）*/}
      <path d="M52 86 L32 76" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M116 86 L136 76" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      {/* 左手心形 */}
      <path d="M24 68 Q24 62 28 64 Q32 62 32 68 Q32 74 28 78 Q24 74 24 68Z" stroke="#1a1714" strokeWidth="1.8" fill="none"/>
      {/* 右手心形 */}
      <path d="M128 68 Q128 62 132 64 Q136 62 136 68 Q136 74 132 78 Q128 74 128 68Z" stroke="#1a1714" strokeWidth="1.8" fill="none"/>

      {/* 腿 */}
      <path d="M68 127 L62 148" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M100 127 L106 148" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M56 148 L68 148" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M100 148 L112 148" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>

      <ellipse cx="84" cy="153" rx="36" ry="5" fill="#1a1714" opacity="0.06"/>
    </motion.svg>
  );
}

// ④ Complete 高风险 - Found Risk
export function RiskRobot({ className = '', size = 120 }: RobotProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      className={className}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: [0, -3, 3, -3, 3, 0]
      }}
      transition={{ 
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
        x: { duration: 0.5, delay: 1.8 }
      }}
    >
      <circle cx="90" cy="95" r="62" fill="#f5f0e8" opacity="0.7"/>

      {/* 机器人头（惊讶）*/}
      <rect x="54" y="38" width="64" height="36" rx="12" stroke="#1a1714" strokeWidth="2.5" fill="white"/>
      {/* 惊讶大眼 */}
      <circle cx="74" cy="54" r="9" stroke="#1a1714" strokeWidth="2" fill="white"/>
      <circle cx="74" cy="54" r="5" fill="#1a1714"/>
      <circle cx="76" cy="52" r="2" fill="white"/>
      <circle cx="106" cy="54" r="9" stroke="#1a1714" strokeWidth="2" fill="white"/>
      <circle cx="106" cy="54" r="5" fill="#1a1714"/>
      <circle cx="108" cy="52" r="2" fill="white"/>
      {/* O 形嘴 */}
      <ellipse cx="90" cy="66" rx="6" ry="5" stroke="#1a1714" strokeWidth="1.8" fill="white"/>
      {/* 天线（震动）*/}
      <path d="M90 38 L88 24" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="87" cy="20" r="5" stroke="#1a1714" strokeWidth="2" fill="white"/>
      {/* 震动线 */}
      <path d="M80 22 L76 18" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M78 26 L73 25" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
      <path d="M94 22 L98 18" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
      <path d="M96 26 L101 25" stroke="#1a1714" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>

      {/* 身体 */}
      <rect x="52" y="73" width="64" height="52" rx="14" stroke="#1a1714" strokeWidth="2.5" fill="white"/>
      {/* 胸口警告屏 */}
      <rect x="66" y="84" width="36" height="26" rx="6" stroke="#1a1714" strokeWidth="1.8" fill="#f5f0e8"/>
      {/* 感叹号 */}
      <path d="M84 89 L84 101" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="84" cy="106" r="2.5" fill="#1a1714"/>

      {/* 手臂（举起警告）*/}
      <path d="M52 84 L30 72" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      {/* 手上警告牌 */}
      <path d="M14 58 L30 85 L46 58Z" stroke="#1a1714" strokeWidth="2" fill="white" strokeLinejoin="round"/>
      <path d="M30 65 L30 74" stroke="#1a1714" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="30" cy="78" r="1.8" fill="#1a1714"/>

      <path d="M116 84 L138 84" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="142" cy="84" r="6" stroke="#1a1714" strokeWidth="2" fill="white"/>

      {/* 腿 */}
      <path d="M68 125 L62 148" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M100 125 L106 148" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M56 148 L68 148" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M100 148 L112 148" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>

      <ellipse cx="84" cy="153" rx="36" ry="5" fill="#1a1714" opacity="0.06"/>
    </motion.svg>
  );
}

// 分析完成庆祝机器人
export function CompleteRobot({ className = '', size = 160 }: RobotProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* 背景圈 */}
      <circle cx="80" cy="85" r="55" fill="#f5f0e8"/>

      {/* 纸屑 */}
      <path d="M30 30 L32 24 L34 30 L30 27Z" stroke="#1a1714" strokeWidth="1.3" fill="none" strokeLinejoin="round" opacity="0.5"/>
      <path d="M125 25 L127 19 L129 25 L125 22Z" stroke="#1a1714" strokeWidth="1.3" fill="none" strokeLinejoin="round" opacity="0.4"/>
      <circle cx="45" cy="22" r="3" stroke="#1a1714" strokeWidth="1.2" fill="none" opacity="0.3"/>
      <circle cx="118" cy="32" r="2.5" stroke="#1a1714" strokeWidth="1" fill="none" opacity="0.25"/>
      <path d="M62 15 L63.5 11 L65 15 L68 16 L65 17 L63.5 20 L62 17 L59 16Z" stroke="#1a1714" strokeWidth="1.2" fill="none" strokeLinejoin="round" opacity="0.4"/>
      <path d="M100 12 L101.5 8 L103 12 L106 13 L103 14 L101.5 17 L100 14 L97 13Z" stroke="#1a1714" strokeWidth="1.2" fill="none" strokeLinejoin="round" opacity="0.35"/>

      {/* 机器人跳起来 */}
      {/* 头 */}
      <rect x="52" y="38" width="56" height="30" rx="10" stroke="#1a1714" strokeWidth="2.5" fill="white"/>
      {/* 开心眼睛（弯弯） */}
      <path d="M61 55 Q68 50 75 55" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <path d="M85 55 Q92 50 99 55" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      {/* 嘴巴大笑 */}
      <path d="M67 62 Q80 70 93 62" stroke="#1a1714" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* 脸颊腮红 */}
      <ellipse cx="62" cy="62" rx="5" ry="3" fill="#1a1714" opacity="0.08"/>
      <ellipse cx="98" cy="62" rx="5" ry="3" fill="#1a1714" opacity="0.08"/>
      {/* 天线 */}
      <path d="M80 38 L80 26" stroke="#1a1714" strokeWidth="2.2" strokeLinecap="round"/>
      <circle cx="80" cy="22" r="5" stroke="#1a1714" strokeWidth="2" fill="white"/>
      {/* 天线爱心 */}
      <path d="M77 21 Q77 18 80 20 Q83 18 83 21 Q83 24 80 26 Q77 24 77 21Z" stroke="#1a1714" strokeWidth="1.3" fill="none"/>

      {/* 身体 */}
      <rect x="50" y="67" width="60" height="44" rx="12" stroke="#1a1714" strokeWidth="2.5" fill="white"/>
      {/* 胸口大勾 */}
      <path d="M64 88 L74 98 L96 76" stroke="#1a1714" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

      {/* 手臂举起庆祝 */}
      <path d="M50 78 L30 60" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="26" cy="57" r="6" stroke="#1a1714" strokeWidth="2" fill="white"/>
      {/* 左手星星 */}
      <path d="M18 48 L19.5 44 L21 48 L25 49.5 L21 51 L19.5 55 L18 51 L14 49.5Z" stroke="#1a1714" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>

      <path d="M110 78 L130 60" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="134" cy="57" r="6" stroke="#1a1714" strokeWidth="2" fill="white"/>
      {/* 右手星星 */}
      <path d="M138 48 L139.5 44 L141 48 L145 49.5 L141 51 L139.5 55 L138 51 L134 49.5Z" stroke="#1a1714" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>

      {/* 腿（跳起） */}
      <path d="M66 111 L58 128" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M94 111 L102 128" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M52 128 L64 128" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M96 128 L108 128" stroke="#1a1714" strokeWidth="2.5" strokeLinecap="round"/>

      {/* 阴影（跳起来小） */}
      <ellipse cx="80" cy="138" rx="22" ry="4" fill="#1a1714" opacity="0.06"/>
    </motion.svg>
  );
}