'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  'Thinking',
  'Thinking.',
  'Thinking..',
  'Thinking...',
];

export function ChatTypingIndicator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="bg-white text-[#9a8f82] border border-[#e0d9ce] rounded-[16px_16px_16px_4px] p-[12px_16px] text-[13px] self-start font-sans">
        <AnimatePresence mode="wait">
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {messages[index]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}