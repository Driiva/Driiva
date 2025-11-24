import React from 'react';

interface DashboardHeaderProps {
  user: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    premiumAmount: string;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <div className="glass-card rounded-b-2xl p-4">
      <h1 className="text-xl font-bold text-white">Welcome, {user.firstName}</h1>
    </div>
  );
}

