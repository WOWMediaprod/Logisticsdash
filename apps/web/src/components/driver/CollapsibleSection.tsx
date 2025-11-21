'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  bgColor?: string;
  borderColor?: string;
}

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = true,
  bgColor = 'bg-blue-50',
  borderColor = 'border-blue-200',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border ${borderColor} rounded-xl overflow-hidden`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${bgColor} px-4 py-3 flex items-center justify-between hover:bg-opacity-80 transition-colors`}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-600" />
        </motion.div>
      </button>

      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
      >
        <div className="px-4 py-3 bg-white space-y-2 text-sm text-gray-700">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
