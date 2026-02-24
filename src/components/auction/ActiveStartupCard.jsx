import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, AlertTriangle } from "lucide-react";

export default function ActiveStartupCard({ startup, className = "" }) {
  if (!startup) return null;

  return (
    <div className={`bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.05)] ${className}`}>
      <div className="flex gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <img 
              src={startup.logo} 
              alt={startup.name} 
              className="w-full h-full object-cover mix-blend-lighten"
            />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black border border-amber-500 flex items-center justify-center text-xs font-bold text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
            #{startup.id}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <div>
              <h2 className="text-2xl font-black text-gray-100 mb-0.5 tracking-wide">{startup.name}</h2>
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 border text-[9px] uppercase font-bold tracking-widest px-2 py-0 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                {startup.category}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-amber-500/70 mb-0.5 uppercase font-bold tracking-widest">Base Price</p>
              <p className="text-xl font-black text-gray-200 leading-none">₹{startup.basePrice}M</p>
            </div>
          </div>
          
          <p className="text-gray-400 text-xs mb-3 leading-relaxed font-medium line-clamp-2">
            {startup.description}
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-black/60 rounded-lg p-2 border border-amber-500/10 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-1.5 mb-0.5 text-[9px] uppercase font-bold tracking-widest text-amber-500/70">
                <Users className="w-2.5 h-2.5 text-amber-500/70" />
                <span>Users</span>
              </div>
              <p className="font-bold text-sm text-gray-200">{startup.users}</p>
            </div>
            <div className="bg-black/60 rounded-lg p-2 border border-amber-500/10 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-1.5 mb-0.5 text-[9px] uppercase font-bold tracking-widest text-amber-500/70">
                <TrendingUp className="w-2.5 h-2.5 text-lime-400" />
                <span>Growth</span>
              </div>
              <p className="font-bold text-sm text-lime-400 drop-shadow-[0_0_5px_rgba(132,204,22,0.5)]">{startup.growth}</p>
            </div>
            <div className="bg-black/60 rounded-lg p-2 border border-amber-500/10 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-1.5 mb-0.5 text-[9px] uppercase font-bold tracking-widest text-amber-500/70">
                <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                <span>Risk</span>
              </div>
              <p className="font-bold text-sm text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">{startup.risk}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
