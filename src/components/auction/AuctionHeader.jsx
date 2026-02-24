import React from 'react';
import { Timer, Trophy, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function AuctionHeader({ timeLeft, currentStartup, totalStartups }) {
  const { logout, user } = useAuth();
  const isUrgent = parseInt(timeLeft.split(':')[0]) === 0 && parseInt(timeLeft.split(':')[1]) < 60;

  return (
    <div className="bg-[#0F1629]/80 backdrop-blur-md border-b border-[#19388A]/30 p-4 sticky top-0 z-20">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center">
            <span className="text-xl">⚡</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">Startup Premier League</h1>
            <p className="text-xs text-[#4F91CD] font-medium mt-1">Live Auction • Round 2</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#0B1020] rounded-lg border border-[#19388A]/30">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-400">Current Startup:</span>
            <span className="text-sm font-bold text-white">{currentStartup} / {totalStartups}</span>
          </div>

          <div className={`flex items-center gap-3 px-5 py-2 rounded-lg border ${
            isUrgent ? 'bg-red-500/10 border-red-500/30 animate-pulse' : 'bg-[#19388A]/20 border-[#19388A]/30'
          }`}>
            <Timer className={`w-5 h-5 ${isUrgent ? 'text-red-400' : 'text-[#4F91CD]'}`} />
            <span className={`text-2xl font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-white'}`}>
              {timeLeft}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
