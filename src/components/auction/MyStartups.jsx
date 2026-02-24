import React from 'react';
import { Rocket } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MyStartups({ startups }) {
  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-amber-500/20 flex flex-col h-full max-h-[300px] shadow-[0_0_15px_rgba(245,158,11,0.05)]">
      <div className="p-3 border-b border-amber-500/20 bg-black/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent pointer-events-none" />
        <h3 className="text-xs font-bold text-gray-100 flex items-center justify-between gap-1.5 relative z-10 w-full mb-0 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5 text-amber-500" />
            My Startups
          </div>
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-black h-4 px-2 uppercase tracking-widest leading-none">
            {startups.length} owned
          </Badge>
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {startups.length > 0 ? (
          <div className="space-y-1.5">
            {startups.map((startup, index) => (
              <div key={index} className="bg-black/60 p-2 rounded-lg border border-amber-500/10 hover:border-amber-500/30 transition-colors group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-200 group-hover:text-amber-400 transition-colors">{startup.name}</p>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-amber-500/70">{startup.category}</p>
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-black text-amber-500 drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">₹{startup.price}M</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
             <Rocket className="w-8 h-8 text-amber-500/30 mb-2" />
             <p className="text-[10px] text-amber-500/50 uppercase font-bold tracking-widest">No startups yet. Start bidding!</p>
          </div>
        )}
      </div>
    </div>
  );
}
