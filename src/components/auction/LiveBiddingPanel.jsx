import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gavel, History } from "lucide-react";

export default function LiveBiddingPanel({ currentBid, bidHistory, onPlaceBid, myTeamName, className = "" }) {
  const isMyBidWinning = currentBid.team === myTeamName;

  return (
    <div className={`p-4 bg-transparent flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-black text-gray-100 uppercase tracking-widest flex items-center gap-1.5">
          <Gavel className="w-4 h-4 text-amber-500" />
          Live Bidding
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" />
          <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Live</span>
        </div>
      </div>

      {/* Current Highest Bid */}
      <div className="text-center mb-4 py-4 bg-black/60 rounded-xl border border-amber-500/20 relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.05)]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
        <p className="text-[9px] text-amber-500/70 font-bold uppercase tracking-widest mb-1">Current Highest Bid</p>
        <div className="text-4xl lg:text-5xl font-black text-gray-100 mb-2 tracking-tight drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          ₹{currentBid.amount}M
        </div>
        <Badge className={`
          px-3 py-1 text-[10px] uppercase tracking-widest font-bold border-0
          ${isMyBidWinning 
            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30' 
            : 'bg-black/80 text-gray-400 hover:bg-black/90 border border-amber-500/10'}
        `}>
          {isMyBidWinning ? 'You are winning!' : `Held by ${currentBid.team}`}
        </Badge>
      </div>

      {/* Bid Actions */}
      <div className="mb-4 relative">
        <div className="absolute inset-0 bg-amber-500 blur-[20px] opacity-20 rounded-lg pointer-events-none" />
        <Button 
          onClick={onPlaceBid}
          className="relative w-full h-12 text-lg font-black bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 hover:from-yellow-400 hover:via-amber-400 hover:to-yellow-500 text-black shadow-lg transition-all transform hover:scale-[1.02] border border-yellow-200/50"
        >
          PLACE BID - ₹{currentBid.amount + currentBid.minNext}M
        </Button>
        <p className="text-center text-[9px] text-amber-500/70 font-bold tracking-widest uppercase mt-2">
          Minimum next bid: ₹{currentBid.minNext}M higher
        </p>
      </div>

      {/* Recent Bids */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <h4 className="text-[9px] font-bold text-amber-500/50 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <History className="w-3 h-3" />
          Recent Activity
        </h4>
        <div className="space-y-1.5 overflow-y-auto pr-2 custom-scrollbar flex-1">
          {bidHistory.map((bid, index) => (
            <div 
              key={index} 
              className={`
                flex items-center justify-between p-3 rounded-lg border transition-colors
                ${index === 0 
                  ? 'bg-amber-500/10 border-amber-500/30' 
                  : 'bg-black/40 border-amber-500/5 opacity-70'}
              `}
            >
              <div className="flex flex-col">
                <span className={`font-bold text-xs tracking-wide ${bid.team === myTeamName ? 'text-amber-400' : 'text-gray-300'}`}>
                  {bid.team}
                </span>
                <span className="text-[9px] text-gray-600 uppercase font-bold">{bid.time}</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-amber-500 text-sm">₹{bid.amount}M</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
