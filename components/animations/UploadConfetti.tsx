'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface UploadConfettiProps {
  fire: boolean;
}

export function UploadConfetti({ fire }: UploadConfettiProps) {
  useEffect(() => {
    if (fire) {
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#F59E0B', '#FDE68A', '#D97706']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#F59E0B', '#FDE68A', '#D97706']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [fire]);

  return null;
}
