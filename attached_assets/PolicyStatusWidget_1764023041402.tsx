import React from 'react';

interface PolicyStatusWidgetProps {
  user: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    premiumAmount: string;
  };
}

export default function PolicyStatusWidget({ user }: PolicyStatusWidgetProps) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm text-gray-400">Policy Premium</div>
          <div className="text-xl font-bold text-white">£{user.premiumAmount}</div>
        </div>
        <div className="px-3 py-1 bg-green-500/20 rounded-full">
          <span className="text-sm text-green-400">Active</span>
        </div>
      </div>
    </div>
  );
}

