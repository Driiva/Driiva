import React from 'react';

interface BottomNavigationProps {
  activeTab: string;
}

export default function BottomNavigation({ activeTab }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 glass-card rounded-t-2xl p-4">
      <div className="flex justify-around">
        <button className="text-white">Home</button>
        <button className="text-gray-400">Trips</button>
        <button className="text-gray-400">Rewards</button>
        <button className="text-gray-400">Profile</button>
      </div>
    </div>
  );
}

