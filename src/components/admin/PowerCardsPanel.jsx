import React from "react";
import { Zap, Shield, Eye, Sparkles, Ban, Rocket, DollarSign, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const cardIcons = {
  right_to_match: Shield,
  stealth_bid: Eye,
  double_down: Sparkles,
  veto: Ban,
  wildcard: Rocket,
  budget_boost: DollarSign
};

const cardColors = {
  right_to_match: "from-purple-500 to-purple-700",
  stealth_bid: "from-cyan-500 to-cyan-700",
  double_down: "from-orange-500 to-orange-700",
  veto: "from-red-500 to-red-700",
  wildcard: "from-lime-500 to-lime-700",
  budget_boost: "from-yellow-500 to-yellow-700"
};

export default function PowerCardsPanel({ powerCards, teams, onToggleCard }) {
  const getTeamName = (teamId) => {
    return teams.find(t => t.id === teamId)?.name || "Unassigned";
  };

  const getStatusBadge = (status) => {
    const styles = {
      available: "bg-lime-500/20 text-lime-400 border-lime-500/30",
      active: "bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30 animate-pulse",
      used: "bg-gray-500/20 text-gray-400 border-gray-500/30",
      disabled: "bg-red-500/20 text-red-400 border-red-500/30"
    };
    return styles[status] || styles.available;
  };

  return (
    <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden">
      <div className="p-4 border-b border-[#19388A]/30">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#FF6B35]" />
          Power Cards
        </h3>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
        {powerCards.map((card) => {
          const IconComponent = cardIcons[card.type] || Zap;
          const gradient = cardColors[card.type] || "from-blue-500 to-blue-700";
          
          return (
            <div 
              key={card.id}
              className="bg-[#0B1020] rounded-lg border border-[#19388A]/30 p-3 hover:border-[#4F91CD]/50 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white text-sm truncate">{card.name}</h4>
                    <Badge className={`text-[10px] px-1.5 py-0 border ${getStatusBadge(card.status)}`}>
                      {card.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {card.team_id ? getTeamName(card.team_id) : "Not Assigned"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggleCard(card)}
                  disabled={card.status === "used"}
                  className="text-gray-400 hover:text-white"
                >
                  {card.status === "disabled" ? (
                    <ToggleLeft className="w-5 h-5" />
                  ) : (
                    <ToggleRight className="w-5 h-5 text-lime-400" />
                  )}
                </Button>
              </div>
            </div>
          );
        })}

        {powerCards.length === 0 && (
          <div className="col-span-2 py-8 text-center text-gray-500">
            No power cards configured yet.
          </div>
        )}
      </div>
    </div>
  );
}