import React, { useState } from "react";
import { Rocket, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AuctionControlPanel({ activeStartup, teams, highestBid, onBidSubmit, onStatusChange }) {
  const [selectedTeam, setSelectedTeam] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitBid = async () => {
    if (!selectedTeam || !bidAmount || !activeStartup) return;
    
    setIsSubmitting(true);
    await onBidSubmit(selectedTeam, parseFloat(bidAmount));
    setBidAmount("");
    setSelectedTeam("");
    setIsSubmitting(false);
  };

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

      {/* Bid Input */}
      <div className="p-4 border-b border-[#19388A]/30">
        <p className="text-xs text-gray-500 uppercase mb-3">Manual Bid Entry</p>
        <div className="flex gap-3">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="flex-1 bg-[#0B1020] border-[#19388A]/50 text-white">
              <SelectValue placeholder="Select Team" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F1629] border-[#19388A]/50">
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id} className="text-white hover:bg-[#19388A]/30">
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Amount (L)"
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            className="w-32 bg-[#0B1020] border-[#19388A]/50 text-white"
          />
          <Button 
            onClick={handleSubmitBid} 
            disabled={isSubmitting || !selectedTeam || !bidAmount}
            className="bg-[#19388A] hover:bg-[#19388A]/80 text-white"
          >
            Submit
          </Button>
        </div>
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
    </div>
  );
}