import React, { useState } from "react";
import { Rocket, TrendingUp, CheckCircle, XCircle, Undo2, Users, TrendingUp as GrowthIcon, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuctionControlPanel({ activeStartup, teams, highestBid, settings, onIncrementChange, onStatusChange, onRevertSale, startups }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmSale = async () => {
    if (!highestBid || !activeStartup) return;
    await onStatusChange(activeStartup.id, "sold", highestBid.team_id, highestBid.amount);
  };

  const handleMarkUnsold = async () => {
    if (!activeStartup) return;
    await onStatusChange(activeStartup.id, "unsold", null, 0);
  };

  if (!activeStartup) {
    return (
      <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-[#4F91CD]" />
          Auction Control
        </h3>
        <div className="flex items-center justify-center h-48 text-gray-500">
          <p>No active startup. Select one from the Startups page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#19388A]/30 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Rocket className="w-5 h-5 text-[#4F91CD]" />
          Auction Control
        </h3>
        <span className="px-3 py-1 bg-lime-500/20 text-lime-400 text-xs font-bold rounded-full uppercase tracking-wider animate-pulse">
          Live
        </span>
      </div>

      {/* Active Startup Card */}
      <div className="p-4 border-b border-[#19388A]/30">
        <div className="flex gap-4">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center text-3xl font-bold">
            {activeStartup.logo_url ? (
              <img src={activeStartup.logo_url} alt={activeStartup.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              activeStartup.name?.charAt(0) || "S"
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-bold text-white">{activeStartup.name}</h4>
            <p className="text-sm text-[#4F91CD] capitalize">{activeStartup.domain?.replace(/_/g, " ")}</p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{activeStartup.description}</p>
          </div>
        </div>

        {/* New Metrics Row */}
        {(activeStartup.users || activeStartup.growth || activeStartup.risk) && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-[#19388A]/30">
            {activeStartup.users && (
              <div className="flex items-center gap-1.5 bg-[#0B1020] px-3 py-1.5 rounded-md border border-[#19388A]/30 flex-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs text-gray-300 font-medium truncate">{activeStartup.users}</span>
              </div>
            )}
            {activeStartup.growth && (
              <div className="flex items-center gap-1.5 bg-[#0B1020] px-3 py-1.5 rounded-md border border-[#19388A]/30 flex-1">
                <GrowthIcon className="w-3.5 h-3.5 text-green-400" />
                <span className="text-xs text-gray-300 font-medium truncate">{activeStartup.growth}</span>
              </div>
            )}
            {activeStartup.risk && (
              <div className="flex items-center gap-1.5 bg-[#0B1020] px-3 py-1.5 rounded-md border border-[#19388A]/30 flex-1">
                <ShieldAlert className={`w-3.5 h-3.5 ${activeStartup.risk.toLowerCase() === 'high' ? 'text-red-400' : activeStartup.risk.toLowerCase() === 'medium' ? 'text-yellow-400' : 'text-green-400'}`} />
                <span className="text-xs text-gray-300 font-medium">{activeStartup.risk}</span>
              </div>
            )}
          </div>
        )}

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-[#0B1020] rounded-lg p-3">
            <p className="text-xs text-gray-500 uppercase">Base Price</p>
            <p className="text-xl font-bold text-white">₹{activeStartup.base_price}L</p>
          </div>
          <div className="bg-[#0B1020] rounded-lg p-3 glow-border">
            <p className="text-xs text-gray-500 uppercase">Current Price</p>
            <p className="text-xl font-bold text-[#FF6B35]">₹{activeStartup.current_price || activeStartup.base_price}L</p>
          </div>
        </div>
      </div>

      {/* Highest Bid */}
      {highestBid && (
        <div className="p-4 border-b border-[#19388A]/30 bg-[#FF6B35]/10">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-[#FF6B35]" />
            <div className="flex-1">
              <p className="text-xs text-gray-400">Current Highest Bid</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-[#FF6B35]">₹{highestBid.amount}L</p>
                <span className="text-sm text-gray-400">by</span>
                <span className="text-sm font-semibold text-white">
                  {teams.find(t => t.id === highestBid.team_id)?.name || "Unknown Team"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Bid Increment Setting */}
      <div className="p-4 border-b border-[#19388A]/30">
        <p className="text-xs text-gray-500 uppercase mb-3">Global Bid Increment</p>
        <div className="flex gap-3">
          {[1, 2, 5].map((inc) => (
              <Button
                key={inc}
                onClick={() => {
                   setIsSubmitting(true);
                   onIncrementChange(inc).finally(() => setIsSubmitting(false));
                }}
                disabled={isSubmitting || settings?.current_bid_increment === inc}
                variant={settings?.current_bid_increment === inc ? "default" : "outline"}
                className={`flex-1 font-bold ${
                  settings?.current_bid_increment === inc
                    ? "bg-lime-500 text-black shadow-[0_0_15px_rgba(132,204,22,0.4)]"
                    : "border-lime-500/30 text-lime-400 hover:bg-lime-500/10 hover:text-lime-300"
                }`}
              >
                +{inc} Lakh
              </Button>
          ))}
        </div>
        <p className="text-[10px] text-gray-500 mt-3 text-center">
          When teams click "Place Bid", the amount will increase by ₹{settings?.current_bid_increment || 1}L.
        </p>
      </div>

      {/* Actions */}
      <div className="p-4 flex gap-3">
        <Button 
          onClick={handleConfirmSale}
          disabled={!highestBid}
          className="flex-1 bg-lime-500 hover:bg-lime-600 text-black font-bold"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Confirm Sale
        </Button>
        <Button 
          onClick={handleMarkUnsold}
          variant="outline"
          className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
        >
          <XCircle className="w-4 h-4 mr-2" />
          Mark Unsold
        </Button>
      </div>
      
      {/* Revert Sale Action */}
      {startups && startups.some(s => s.status === 'sold') && (
        <div className="px-4 pb-4">
          <Button 
            onClick={onRevertSale}
            variant="ghost"
            className="w-full text-xs text-gray-500 hover:text-white hover:bg-[#19388A]/20 h-8"
          >
            <Undo2 className="w-3 h-3 mr-2" />
            Revert Last Sale
          </Button>
        </div>
      )}
    </div>
  );
}