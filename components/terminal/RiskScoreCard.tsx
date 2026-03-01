'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClearRobot, RiskRobot, WaitingRobot } from '@/components/illustrations/RobotIllustrations';

interface RiskScoreCardProps {
  score: number;
  verdict: string;
  isVisible: boolean;
}

export function RiskScoreCard({ score, verdict, isVisible }: RiskScoreCardProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setDisplayScore(0);
      setProgress(0);
      return;
    }

    // Count up animation
    const duration = 1500; // 1.5s
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out easing
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setDisplayScore(Math.round(score * eased));
      setProgress(score * eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [score, isVisible]);

  const getRiskColor = (s: number) => {
    if (s <= 40) return { bg: '#dcfce7', text: '#16a34a', label: 'Low Risk' };
    if (s <= 70) return { bg: '#fef3c7', text: '#d97706', label: 'Medium Risk' };
    return { bg: '#fee2e2', text: '#dc2626', label: 'High Risk' };
  };

  const getRobotComponent = (s: number) => {
    if (s <= 40) return <ClearRobot size={120} />;
    if (s <= 70) return <WaitingRobot size={120} />;
    return <RiskRobot size={120} />;
  };

  const colors = getRiskColor(score);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="w-full bg-white border border-[#e0d9ce] rounded-2xl p-6 shadow-sm"
    >
      <div className="flex flex-col items-center">
        {/* Robot */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-4"
        >
          {getRobotComponent(score)}
        </motion.div>

        {/* Score Number */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-4"
        >
          <div 
            className="text-6xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            {displayScore}
          </div>
          <div className="text-sm font-medium text-[#6b7280]">
            {colors.label}
          </div>
        </motion.div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-[#f5f0e8] rounded-full overflow-hidden mb-4">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: colors.text }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>

        {/* Verdict */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-[#3a3530] text-sm leading-relaxed"
        >
          {verdict}
        </motion.p>
      </div>
    </motion.div>
  );
}
