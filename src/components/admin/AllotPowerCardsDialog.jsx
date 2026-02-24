import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Zap } from "lucide-react";
import { POWER_CARDS_DATA } from "@/constants/powerCards";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function AllotPowerCardsDialog({
  open,
  onOpenChange,
  team,
  allottedCards = [],
  powerCardUsage = [],
  onSuccess
}) {
  const [selectedCardsToAllot, setSelectedCardsToAllot] = useState([]);
  const [isAllotting, setIsAllotting] = useState(false);

  useEffect(() => {
    if (open && team) {
      const teamCards = allottedCards.filter(c => c.team_id === team.id).map(c => c.type);
      setSelectedCardsToAllot(teamCards);
    }
  }, [open, team, allottedCards]);

  const handleSave = async () => {
    if (!team) return;
    setIsAllotting(true);
    try {
      // 1. Delete all existing allotted cards for this team
      await supabase.from('power_cards').delete().eq('team_id', team.id);
      
      // 2. Insert new ones
      if (selectedCardsToAllot.length > 0) {
        const cardsToInsert = selectedCardsToAllot.map(type => {
          const cardDef = POWER_CARDS_DATA.find(c => c.id === type);
          return {
            team_id: team.id,
            type: type,
            name: cardDef ? cardDef.name : type
          };
        });
        const { error } = await supabase.from('power_cards').insert(cardsToInsert);
        if (error) throw error;
      }

      toast.success(`Power cards updated for ${team.name}`);
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error allotting cards:", error);
      toast.error("Failed to allot cards: " + (error?.message || "Unknown error"));
    } finally {
      setIsAllotting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="bg-[#0F1629] border-[#19388A]/50 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400 fill-current" />
            Allot Power Cards to {team?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-gray-400">
            Select power cards to give to this team. Cards currently marked as "Used" for this team cannot be removed.
          </p>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {POWER_CARDS_DATA.map(card => {
              const Icon = card.icon;
              const isSelected = selectedCardsToAllot.includes(card.id);
              const isUsed = powerCardUsage.some(c => c.team_id === team?.id && c.type === card.id && c.status === "used");

              const toggleCard = () => {
                if (isUsed) {
                  toast.info("This card has already been used and cannot be un-allotted.");
                  return;
                }
                if (isSelected) {
                  setSelectedCardsToAllot(prev => prev.filter(id => id !== card.id));
                } else {
                  setSelectedCardsToAllot(prev => [...prev, card.id]);
                }
              };

              return (
                <div 
                  key={card.id}
                  onClick={toggleCard}
                  className={`
                    relative p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-center items-center text-center h-28
                    ${isUsed ? 'bg-gray-800/50 border-gray-700 opacity-60' : 
                      isSelected ? 'bg-purple-900/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 
                      'bg-[#0B1020] border-[#19388A]/30 hover:border-purple-500/50 hover:bg-[#19388A]/10'
                    }
                  `}
                >
                  <Icon className={`w-6 h-6 mb-2 ${isUsed ? 'text-gray-500' : isSelected ? 'text-purple-400' : card.color}`} />
                  <span className="text-xs font-bold text-white leading-tight">{card.name}</span>
                  {isUsed && (
                    <div className="absolute top-1 right-1 pointer-events-none">
                      <span className="text-[9px] bg-red-500/20 text-red-400 px-1 rounded uppercase font-bold tracking-widest border border-red-500/30">Used</span>
                    </div>
                  )}
                  {isSelected && !isUsed && (
                    <div className="absolute top-1 right-1 pointer-events-none">
                      <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1 rounded uppercase font-bold tracking-widest border border-purple-500/30">Allotted</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[#19388A]/30 mt-4">
            <span className="text-sm font-semibold">
              <span className="text-purple-400">
                {selectedCardsToAllot.length}
              </span>
              <span className="text-gray-500"> Cards Selected</span>
            </span>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#19388A]/50 text-gray-400 hover:text-white">Cancel</Button>
              <Button onClick={handleSave} disabled={isAllotting} className="bg-purple-600 hover:bg-purple-700 text-white">
                {isAllotting ? "Saving..." : "Save Allotment"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
