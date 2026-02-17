import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  LayoutDashboard,
  Rocket,
  Users,
  Gavel,
  Zap,
  Newspaper,
  Trophy,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  UserPlus
} from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = useMemo(() => [
    { name: "Dashboard", icon: LayoutDashboard, page: "AdminDashboard" },
    { name: "Startups", icon: Rocket, page: "Startups" },
    { name: "Teams & Wallets", icon: Users, page: "Teams" },
    { name: "Bids & Transactions", icon: Gavel, page: "Bids" },
    { name: "Power Cards", icon: Zap, page: "PowerCards" },
    { name: "Breaking News", icon: Newspaper, page: "BreakingNews" },
    { name: "Leaderboard", icon: Trophy, page: "Leaderboard" },
    { name: "Settings", icon: Settings, page: "AuctionSettings" },
  ], []);

  const inviteNavItem = useMemo(() => ({ 
    name: "Invite Users", 
    icon: UserPlus, 
    page: "InviteUsers" 
  }), []);

  return (
    <div className="min-h-screen bg-[#050814] text-white flex">
      <style>{`
        :root {
          --bg-primary: #050814;
          --bg-secondary: #0B1020;
          --bg-card: #0F1629;
          --accent-blue: #19388A;
          --accent-sky: #4F91CD;
          --accent-orange: #FF6B35;
          --accent-lime: #84CC16;
          --border-glow: rgba(79, 145, 205, 0.3);
        }
        
        .glow-border {
          box-shadow: 0 0 20px rgba(79, 145, 205, 0.2), inset 0 0 20px rgba(79, 145, 205, 0.05);
        }
        
        .glow-orange {
          box-shadow: 0 0 20px rgba(255, 107, 53, 0.3);
        }
        
        .neon-text {
          text-shadow: 0 0 10px rgba(79, 145, 205, 0.5);
        }
        
        .gradient-border {
          background: linear-gradient(135deg, #19388A 0%, #4F91CD 100%);
        }
        
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #0B1020;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #19388A;
          border-radius: 3px;
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#0B1020] border-r border-[#19388A]/30 transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-[#19388A]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-sm text-white">Startup Premier</h1>
                <p className="text-[10px] text-[#4F91CD]">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#19388A] to-[#19388A]/50 text-white glow-border' 
                    : 'text-gray-400 hover:text-white hover:bg-[#19388A]/20'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#4F91CD]' : ''}`} />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-sm font-medium">{item.name}</span>
                    {isActive && <ChevronRight className="w-4 h-4 text-[#4F91CD]" />}
                  </>
                )}
              </Link>
            );
          })}
          
          {/* Invite Users - Separated */}
          <div className="pt-2 border-t border-[#19388A]/30 mt-2">
            <Link
              to={createPageUrl(inviteNavItem.page)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                ${currentPageName === inviteNavItem.page 
                  ? 'bg-gradient-to-r from-[#19388A] to-[#19388A]/50 text-white glow-border' 
                  : 'text-gray-400 hover:text-white hover:bg-[#19388A]/20'
                }`}
            >
              <inviteNavItem.icon className={`w-5 h-5 ${currentPageName === inviteNavItem.page ? 'text-[#4F91CD]' : ''}`} />
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-sm font-medium">{inviteNavItem.name}</span>
                  {currentPageName === inviteNavItem.page && <ChevronRight className="w-4 h-4 text-[#4F91CD]" />}
                </>
              )}
            </Link>
          </div>
        </nav>

        {/* Toggle & Logout */}
        <div className="p-3 border-t border-[#19388A]/30 space-y-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#19388A]/20 transition-all"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {sidebarOpen && <span className="text-sm">Collapse</span>}
          </button>
          <button
            onClick={() => base44.auth.logout()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}