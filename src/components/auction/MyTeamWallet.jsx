import React from "react";
import { Wallet } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function MyTeamWallet({ totalBudget, spent, remaining }) {
  const spentPercentage = (spent / totalBudget) * 100;

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-amber-500/20 p-3 flex flex-col h-full relative overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.05)]">
      {/* Header */}
      <h3 className="text-xs font-bold text-gray-200 flex items-center gap-1.5 mb-2 z-10 relative">
        <Wallet className="w-3.5 h-3.5 text-amber-500" />
        My Team Wallet
      </h3>
      {/* Main Content Area */}
      <div className="flex gap-2 mb-2 z-10 relative">
        
        {/* Amount Boxes */}
        <div className="flex-1 bg-black/60 rounded-lg border border-amber-500/10 relative overflow-hidden flex flex-col justify-center p-2 min-h-[50px] hover:border-amber-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-8 h-8 bg-amber-500/10 rounded-bl-full pointer-events-none" />
            <p className="text-[9px] text-amber-500/70 font-bold mb-0.5 uppercase tracking-widest">Total Budget</p>
            <div className="text-xl font-black text-gray-100 leading-none">₹{totalBudget}M</div>
        </div>
        
        <div className="flex-1 bg-black/60 rounded-lg border border-amber-500/10 relative overflow-hidden flex flex-col justify-center p-2 min-h-[50px] hover:border-amber-500/30 transition-colors">
            <p className="text-[9px] text-amber-500/70 font-bold mb-0.5 uppercase tracking-widest">Spent</p>
            <div className="text-lg font-bold text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] leading-none">₹{spent}M</div>
        </div>
        
        <div className="flex-1 bg-black/60 rounded-lg border border-amber-500/10 relative overflow-hidden flex flex-col justify-center p-2 min-h-[50px] hover:border-amber-500/30 transition-colors">
            <p className="text-[9px] text-amber-500/70 font-bold mb-0.5 uppercase tracking-widest">Remaining</p>
            <div className="text-lg font-bold text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] leading-none">₹{remaining}M</div>
        </div>
      </div>

      {/* Bottom: Progress Bar */}
      <div className="mt-auto z-10 relative pt-1 border-t border-amber-500/10">
         <div className="flex justify-between text-[9px] text-amber-500/70 font-bold mb-1 uppercase tracking-widest">
             <span>{spentPercentage.toFixed(0)}% Used</span>
             <span className="text-amber-500">{(100 - spentPercentage).toFixed(0)}% Left</span>
         </div>
         <Progress value={spentPercentage} className="h-1.5 bg-[#050505] border border-amber-500/10" indicatorClassName="bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
      </div>
    
      {/* Background Glow (to match UserDashboard aesthetic) */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none" />
    </div>
  );
}
