import React, { useState } from "react";
import { Zap, ChevronDown } from "lucide-react";
import { POWER_CARDS_DATA } from "@/constants/powerCards";

export default function PowerCardsPanel({ powerCards, allottedCards = [], teams, onToggleCard }) {
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [loadingCards, setLoadingCards] = useState({});

  // Auto-select first team if none selected
  const activeTeamId = selectedTeamId || teams[0]?.id;
  const activeTeam = teams.find(t => t.id === activeTeamId);

  // Filter out which cards are allotted to this team
  const teamAllottedCards = POWER_CARDS_DATA.filter(card => 
    allottedCards.some(a => a.team_id === activeTeamId && a.type === card.id)
  );

  const getCardStatus = (teamId, cardType) => {
    const card = powerCards.find(c => c.team_id === teamId && c.type === cardType);
    return card ? card.status : "available";
  };

  const getCardId = (teamId, cardType) => {
    const card = powerCards.find(c => c.team_id === teamId && c.type === cardType);
    return card ? card.id : null;
  };

  const getUsedCount = (teamId) => {
    return powerCards.filter(c => c.team_id === teamId && c.status === "used").length;
  };

  const usedCount = activeTeamId ? getUsedCount(activeTeamId) : 0;

  return (
    <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#19388A]/30 flex justify-between items-center">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#FF6B35]" />
          Power Cards
        </h3>
        <span className="text-xs text-gray-500">Allotted Cards</span>
      </div>

      {/* Team Selector Dropdown */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <select
            value={activeTeamId || ""}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full appearance-none bg-[#0B1020] border border-[#19388A]/40 rounded-lg px-4 py-2.5 pr-10 text-white text-sm font-semibold cursor-pointer focus:outline-none focus:border-[#4F91CD] transition-colors hover:border-[#4F91CD]/60"
          >
            {teams.map((team) => {
              const count = getUsedCount(team.id);
              return (
                <option key={team.id} value={team.id}>
                  {team.name} — {count} used
                </option>
              );
            })}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Usage counter */}
      {activeTeam && (
        <div className="px-4 pb-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {activeTeam.name}
          </span>
          <span className={`text-xs font-bold text-[#FF6B35]`}>
            {usedCount} Used
          </span>
        </div>
      )}

      {/* Cards Grid */}
      {activeTeamId && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {teamAllottedCards.map((cardDef) => {
              const status = getCardStatus(activeTeamId, cardDef.id);
              const dbId = getCardId(activeTeamId, cardDef.id);
              const Icon = cardDef.icon;
              const isUsed = status === "used";

              return (
                <button
                  key={cardDef.id}
                  title={`${cardDef.name}: ${cardDef.description}`}
                  onClick={async () => {
                    setLoadingCards(prev => ({ ...prev, [cardDef.id]: true }));
                    try {
                      await onToggleCard({
                        id: dbId,
                        type: cardDef.id,
                        team_id: activeTeamId,
                        status: isUsed ? "available" : "used",
                        name: cardDef.name
                      });
                    } finally {
                      setLoadingCards(prev => ({ ...prev, [cardDef.id]: false }));
                    }
                  }}
                  disabled={loadingCards[cardDef.id]}
                  className={`
                    relative flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all
                    ${isUsed
                      ? "bg-[#FF6B35]/20 border-[#FF6B35] shadow-[0_0_10px_rgba(255,107,53,0.3)]"
                      : "bg-[#19388A]/10 border-[#19388A]/30 hover:bg-[#19388A]/30 hover:border-[#4F91CD]"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 mb-1 ${isUsed ? "text-[#FF6B35]" : cardDef.color}`} />
                  <span className={`text-[10px] text-center leading-tight ${isUsed ? "text-white font-bold" : "text-gray-400"}`}>
                    {cardDef.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
            
            {teamAllottedCards.length === 0 && (
              <div className="col-span-3 text-center py-6 text-gray-500 text-sm border border-dashed border-[#19388A]/30 rounded-lg">
                No cards allotted to this team yet. Use the Wallet table to allot cards.
              </div>
            )}
          </div>
        </div>
      )}

      {teams.length === 0 && (
        <div className="p-4 text-center text-gray-500 text-sm">
          No teams registered yet
        </div>
      )}
    </div>
  );
}