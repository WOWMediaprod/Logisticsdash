'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import Confetti from 'react-confetti';

interface SlideToCompleteProps {
  onComplete: () => Promise<void>;
  disabled?: boolean;
  validationMessage?: string;
}

export function SlideToComplete({ onComplete, disabled, validationMessage }: SlideToCompleteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const SLIDE_THRESHOLD = 0.85; // 85% slide to trigger

  // Touch/Mouse handlers for sliding
  const handleStart = (clientX: number) => {
    if (disabled || isCompleting) return;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !containerRef.current || isCompleting) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const maxSlide = containerRect.width - 56; // Button width (14 * 4 = 56px)
    const newPosition = Math.max(0, Math.min(clientX - containerRect.left - 28, maxSlide));

    setSliderPosition(newPosition);

    // Trigger completion at threshold
    const progress = newPosition / maxSlide;
    if (progress >= SLIDE_THRESHOLD && !isCompleting) {
      handleComplete();
    }
  };

  const handleEnd = () => {
    if (isCompleting) return;
    setIsDragging(false);
    // Snap back if not completed
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const maxSlide = containerRect.width - 56;
      if (sliderPosition / maxSlide < SLIDE_THRESHOLD) {
        setSliderPosition(0);
      }
    }
  };

  const handleComplete = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    setIsDragging(false);

    try {
      await onComplete();
      setShowSuccess(true);
    } catch (error) {
      // Reset on error
      setSliderPosition(0);
      setIsCompleting(false);
    }
  };

  // Global mouse/touch handlers
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };

    const handleGlobalEnd = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMove);
      document.addEventListener('mouseup', handleGlobalEnd);
      document.addEventListener('touchmove', handleGlobalTouchMove);
      document.addEventListener('touchend', handleGlobalTouchEnd);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMove);
        document.removeEventListener('mouseup', handleGlobalEnd);
        document.removeEventListener('touchmove', handleGlobalTouchMove);
        document.removeEventListener('touchend', handleGlobalTouchEnd);
      };
    }
  }, [isDragging, handleMove, handleEnd]);

  return (
    <>
      {showSuccess && (
        <>
          <Confetti
            width={typeof window !== 'undefined' ? window.innerWidth : 300}
            height={typeof window !== 'undefined' ? window.innerHeight : 200}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
          >
            <div className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                transition={{ duration: 0.6 }}
              >
                <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mt-4">Job Completed!</h2>
              <p className="text-gray-600 mt-2">Great work! View your earnings.</p>
            </div>
          </motion.div>
        </>
      )}

      <div className="relative">
        {disabled && validationMessage && (
          <div className="mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {validationMessage}
          </div>
        )}

        <div
          ref={containerRef}
          className={`relative h-16 bg-gradient-to-r ${
            disabled ? 'from-gray-300 to-gray-400' : 'from-green-500 to-emerald-600'
          } rounded-full overflow-hidden ${disabled ? 'opacity-50' : ''} touch-none select-none`}
        >
          {/* Background progress track */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-white/20"
            style={{
              width: containerRef.current
                ? `${(sliderPosition / (containerRef.current.offsetWidth - 56)) * 100}%`
                : '0%',
            }}
          />

          {/* Text label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white font-bold text-lg flex items-center gap-2">
              {isCompleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Completing Job...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Slide to Complete Job
                  <ChevronRight className="w-5 h-5 animate-pulse" />
                </>
              )}
            </span>
          </div>

          {/* Sliding button */}
          <motion.div
            className={`absolute top-2 left-2 w-12 h-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing ${
              disabled ? 'bg-gray-500' : 'bg-white shadow-lg'
            } touch-none`}
            style={{ x: sliderPosition }}
            onMouseDown={(e) => handleStart(e.clientX)}
            onTouchStart={(e) => handleStart(e.touches[0].clientX)}
            whileTap={{ scale: 0.95 }}
            animate={isCompleting ? { scale: [1, 1.1, 1] } : {}}
            transition={isCompleting ? { duration: 0.5, repeat: Infinity } : {}}
          >
            {isCompleting ? (
              <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
            ) : (
              <ChevronRight className={`w-6 h-6 ${disabled ? 'text-gray-300' : 'text-green-600'}`} />
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
