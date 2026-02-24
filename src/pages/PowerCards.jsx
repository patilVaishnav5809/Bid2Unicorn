import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { Zap, Search, Filter, Users, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import TopBar from "../components/admin/TopBar";
import { POWER_CARDS_DATA } from "@/constants/powerCards";
import { toast } from "sonner";

const statusColors = {
  available: "bg-lime-500/20 text-lime-400 border-lime-500/30",
  used: "bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30",
};

export default function PowerCards() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loadingCards, setLoadingCards] = useState({});

  // Fetch teams
  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from('teams').select('*').order('name');
      if (!error && data) return data;
      return base44.entities.Team.list();
    },
  });

  // Fetch power card usage from activity_logs
  const { data: powerCardUsageLogs = [] } = useQuery({
    queryKey: ["powerCardUsage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('type', 'power_card')
        .like('message', '[CARD_USED:%');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });

  // Fetch allotted cards
  const { data: allottedCards = [] } = useQuery({
    queryKey: ["allottedCards"],
    queryFn: async () => {
      const { data, error } = await supabase.from('power_cards').select('*');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  // Parse usage logs into a set of { team_id, card_type }
  const usedEntries = [];
  powerCardUsageLogs.forEach(log => {
    const match = log.message?.match(/\[CARD_USED:([^\]]+)\]/);
    if (match) {
      const cardType = match[1];
      if (!usedEntries.some(e => e.team_id === log.team_id && e.card_type === cardType)) {
        usedEntries.push({ team_id: log.team_id, card_type: cardType });
      }
    }
  });

  const isCardUsed = (teamId, cardType) =>
    usedEntries.some(e => e.team_id === teamId && e.card_type === cardType);

  // Fetch settings for TopBar
  const { data: startups = [] } = useQuery({
    queryKey: ["startups"],
    queryFn: () => base44.entities.Startup.list(),
  });
  const { data: settingsArr = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AuctionSettings.list(),
  });
  const settings = settingsArr[0];

  // Build flat list of all cards across all teams
  const allCards = teams.flatMap(team => {
    // Only get cards allotted to this team
    const teamAllotted = allottedCards.filter(a => a.team_id === team.id).map(a => a.type);
    
    return POWER_CARDS_DATA.filter(card => teamAllotted.includes(card.id)).map(card => {
      const used = isCardUsed(team.id, card.id);
      return {
        key: `${team.id}-${card.id}`,
        teamId: team.id,
        teamName: team.name,
        cardId: card.id,
        cardName: card.name,
        CardIcon: card.icon,
        cardColor: card.color,
        description: card.description,
        used,
        status: used ? "used" : "available",
      };
    })
  });

  // Apply filters
  const filteredCards = allCards.filter(card => {
    const matchesSearch =
      card.cardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.teamName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTeam = filterTeam === "all" || card.teamId === filterTeam;
    const matchesStatus = filterStatus === "all" || card.status === filterStatus;
    return matchesSearch && matchesTeam && matchesStatus;
  });

  // Stats
  const totalUsed = usedEntries.length;
  const totalCards = allottedCards.length; // total allotted

  const handleTogglePowerCard = async (card) => {
    const messagePrefix = `[CARD_USED:${card.cardId}]`;
    setLoadingCards(prev => ({ ...prev, [card.key]: true }));
    
    try {
        if (card.status === "used") {
            // Mark as USED: Insert an activity log entry
            const { data: existingLogs } = await supabase
                .from('activity_logs')
                .select('id')
                .eq('type', 'power_card')
                .eq('team_id', card.teamId)
                .like('message', `${messagePrefix}%`);

            if (!existingLogs || existingLogs.length === 0) {
                const { error } = await supabase
                    .from('activity_logs')
                    .insert({
                        type: "power_card",
                        message: `${messagePrefix} ${card.cardName} activated for ${card.teamName}`,
                        team_id: card.teamId
                    });
                if (error) throw error;
            }
        } else {
            // Mark as AVAILABLE: Delete the matching log entry
            const { data: matchingLogs } = await supabase
                .from('activity_logs')
                .select('id')
                .eq('type', 'power_card')
                .eq('team_id', card.teamId)
                .like('message', `${messagePrefix}%`);
            
            if (matchingLogs && matchingLogs.length > 0) {
                const idsToDelete = matchingLogs.map(l => l.id);
                const { error } = await supabase
                    .from('activity_logs')
                    .delete()
                    .in('id', idsToDelete);
                if (error) throw error;
            }
        }
        
        await queryClient.invalidateQueries({ queryKey: ["powerCardUsage"] });
        queryClient.invalidateQueries({ queryKey: ["logs"] });
        toast.success(`Power card "${card.cardName}" is now ${card.status}`);
    } catch (error) {
        console.error("Failed to toggle power card", error);
        toast.error("Failed to update power card: " + (error?.message || "Unknown error"));
    } finally {
        setLoadingCards(prev => ({ ...prev, [card.key]: false }));
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar
        settings={settings}
        activeStartup={startups.find(s => s.status === "active")}
        teamsOnline={teams.filter(t => t.is_online).length}
        totalBids={0}
      />

      <main className="flex-1 overflow-auto p-6 bg-[#050814]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-[#FF6B35]" />
              Power Cards Overview
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {totalUsed} / {totalCards} cards used across {teams.length} teams
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-[#0F1629] rounded-lg border border-[#19388A]/30 px-4 py-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-sm text-gray-400">Used:</span>
              <span className="text-white font-bold">{totalUsed}</span>
            </div>
            <div className="bg-[#0F1629] rounded-lg border border-[#19388A]/30 px-4 py-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#4F91CD]" />
              <span className="text-sm text-gray-400">Teams:</span>
              <span className="text-white font-bold">{teams.length}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search cards or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0F1629] border-[#19388A]/50 text-white"
            />
          </div>
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-48 bg-[#0F1629] border-[#19388A]/50 text-white">
              <Filter className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F1629] border-[#19388A]/50">
              <SelectItem value="all" className="text-white">All Teams</SelectItem>
              {teams.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-white">{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-[#0F1629] border-[#19388A]/50 text-white">
              <Filter className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F1629] border-[#19388A]/50">
              <SelectItem value="all" className="text-white">All Status</SelectItem>
              <SelectItem value="available" className="text-white">Available</SelectItem>
              <SelectItem value="used" className="text-white">Used</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Team-grouped view */}
        {filterTeam === "all" ? (
          // Show grouped by team
          <div className="space-y-6">
            {teams.map(team => {
              const teamCards = filteredCards.filter(c => c.teamId === team.id);
              if (teamCards.length === 0) return null;
              const teamUsed = usedEntries.filter(e => e.team_id === team.id).length;

              return (
                <div key={team.id} className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden">
                  {/* Team Header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-[#19388A]/20">
                    <div className="flex items-center gap-3">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#19388A]/40 flex items-center justify-center text-white font-bold text-sm">
                          {team.name?.charAt(0)}
                        </div>
                      )}
                      <h2 className="text-lg font-bold text-white">{team.name}</h2>
                    </div>
                    <span className="text-sm font-semibold text-[#FF6B35]">
                      {teamUsed} Used
                    </span>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 p-4">
                    {teamCards.map(card => {
                      const CardIcon = card.CardIcon;
                      return (
                      <button
                        key={card.key}
                        disabled={loadingCards[card.key]}
                        onClick={() => handleTogglePowerCard({ ...card, status: card.used ? 'available' : 'used' })}
                        className={`relative rounded-lg border p-3 text-center transition-all ${
                          card.used
                            ? 'bg-[#FF6B35]/10 border-[#FF6B35]/50 shadow-[0_0_15px_rgba(255,107,53,0.15)] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50'
                            : 'bg-[#0B1020] border-[#19388A]/30 hover:border-[#4F91CD]/50 focus:outline-none focus:ring-2 focus:ring-[#4F91CD]/50'
                        } ${loadingCards[card.key] ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-105'}`}
                      >
                        <CardIcon className={`w-6 h-6 mx-auto ${card.used ? 'text-[#FF6B35]' : 'text-gray-400'}`} />
                        <p className="text-xs font-semibold text-white truncate">{card.cardName}</p>
                        <Badge className={`mt-2 text-[9px] px-1.5 py-0 ${statusColors[card.status]} border`}>
                          {card.status}
                        </Badge>
                      </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Show flat grid for single team
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCards.map(card => {
              const CardIcon = card.CardIcon;
              return (
              <button
                key={card.key}
                disabled={loadingCards[card.key]}
                onClick={() => handleTogglePowerCard({ ...card, status: card.used ? 'available' : 'used' })}
                className={`bg-[#0F1629] rounded-xl border overflow-hidden transition-all text-left w-full ${
                  card.used
                    ? 'border-[#FF6B35]/50 shadow-[0_0_30px_rgba(255,107,53,0.2)] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50'
                    : 'border-[#19388A]/30 hover:border-[#4F91CD]/50 focus:outline-none focus:ring-2 focus:ring-[#4F91CD]/50'
                } ${loadingCards[card.key] ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:scale-[1.02]'}`}
              >
                <div className={`h-16 flex items-center justify-center ${
                  card.used ? 'bg-[#FF6B35]/20' : 'bg-[#0B1020]'
                }`}>
                  <CardIcon className={`w-8 h-8 ${card.used ? 'text-[#FF6B35]' : 'text-gray-400'}`} />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white text-sm">{card.cardName}</h3>
                    <Badge className={`${statusColors[card.status]} border text-[10px]`}>
                      {card.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>
                  <div className="flex justify-between text-xs mt-3">
                    <span className="text-gray-500">Team</span>
                    <span className="text-[#4F91CD] font-medium">{card.teamName}</span>
                  </div>
                </div>
              </button>
              );
            })}
          </div>
        )}

        {filteredCards.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No power cards match your filters</p>
          </div>
        )}
      </main>
    </div>
  );
}