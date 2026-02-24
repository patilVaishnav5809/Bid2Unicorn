import React, { useState, useEffect } from "react";
import { Timer, Users, Activity, Bell, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/AuthContext";

export default function TopBar({ settings, activeStartup, teamsOnline, totalBids }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!settings?.timer_end_time) return;
    
    const interval = setInterval(() => {
      const end = new Date(settings.timer_end_time).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [settings?.timer_end_time]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="h-16 bg-[#0B1020] border-b border-[#19388A]/30 px-6 flex items-center justify-between">
      {/* Left - Round Info */}
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Current Round</p>
          <h2 className="text-sm font-semibold text-white">
            {settings?.round_name || "Round 1: IPL-Style Startup Auction"}
          </h2>
        </div>
        
        {activeStartup && (
          <div className="pl-6 border-l border-[#19388A]/30">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Active Startup</p>
            <h3 className="text-sm font-semibold text-[#4F91CD]">{activeStartup.name}</h3>
          </div>
        )}
      </div>

      {/* Center - Stats */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${timeLeft > 60 ? 'bg-[#19388A]/30' : 'bg-red-500/30 animate-pulse'}`}>
            <Timer className={`w-4 h-4 ${timeLeft > 60 ? 'text-[#4F91CD]' : 'text-red-400'}`} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Time Left</p>
            <p className={`text-lg font-mono font-bold ${timeLeft > 60 ? 'text-white' : 'text-red-400'}`}>
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Teams Online</p>
            <p className="text-lg font-bold text-white">{teamsOnline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-[#FF6B35]" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Bids</p>
            <p className="text-lg font-bold text-white">{totalBids}</p>
          </div>
        </div>
      </div>

      {/* Right - Notifications & Profile */}
      <div className="flex items-center gap-4">
        <button className="relative w-10 h-10 rounded-lg bg-[#0F1629] border border-[#19388A]/30 flex items-center justify-center hover:border-[#4F91CD]/50 transition-all">
          <Bell className="w-5 h-5 text-gray-400" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF6B35] rounded-full text-[10px] font-bold flex items-center justify-center">
            3
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0F1629] border border-[#19388A]/30 hover:border-[#4F91CD]/50 transition-all">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">{user?.full_name || "Admin"}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#0F1629] border-[#19388A]/30">
            <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white focus:bg-[#19388A]/30">
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10"
              onClick={logout}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}