'use client';

import { Phone, User } from 'lucide-react';

interface ContactCardProps {
  name?: string;
  phone?: string;
  type?: 'loading' | 'delivery';
}

export function ContactCard({ name, phone, type = 'loading' }: ContactCardProps) {
  if (!name && !phone) {
    return null;
  }

  const typeLabel = type === 'loading' ? 'Loading Contact' : 'Delivery Contact';

  return (
    <div className="space-y-2">
      {name && (
        <div className="flex items-center gap-2 text-gray-700">
          <User className="w-4 h-4 text-gray-500" />
          <span className="font-medium">{name}</span>
        </div>
      )}
      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Phone className="w-4 h-4" />
          <span className="font-medium">{phone}</span>
        </a>
      )}
    </div>
  );
}
