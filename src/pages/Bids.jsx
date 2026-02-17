import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Gavel, Search, Filter, Trophy, Clock, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import TopBar from "../components/admin/TopBar";

export default function Bids() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTeam, setFilterTeam] = useState("all");

  const { data: bids = [] } = useQuery({
    queryKey: ["bids"],
    queryFn: () => base44.entities.Bid.list("-created_date"),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: startups = [] } = useQuery({
    queryKey: ["startups"],
    queryFn: () => base44.entities.Startup.list(),
  });

  const { data: settingsArr = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AuctionSettings.list(),
  });

  const settings = settingsArr[0];

  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.name || "Unknown";
  const getStartupName = (startupId) => startups.find(s => s.id === startupId)?.name || "Unknown";

  const filteredBids = bids.filter(bid => {
    const teamName = getTeamName(bid.team_id).toLowerCase();
    const startupName = getStartupName(bid.startup_id).toLowerCase();
    const matchesSearch = teamName.includes(searchQuery.toLowerCase()) || 
                          startupName.includes(searchQuery.toLowerCase());
    const matchesTeam = filterTeam === "all" || bid.team_id === filterTeam;
    return matchesSearch && matchesTeam;
  });

  // Group bids by startup
  const bidsByStartup = {};
  filteredBids.forEach(bid => {
    if (!bidsByStartup[bid.startup_id]) {
      bidsByStartup[bid.startup_id] = [];
    }
    bidsByStartup[bid.startup_id].push(bid);
  });

  const totalVolume = filteredBids.reduce((sum, bid) => sum + bid.amount, 0);
  const winningBids = filteredBids.filter(b => b.is_winning);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        settings={settings}
        activeStartup={startups.find(s => s.status === "active")}
        teamsOnline={teams.filter(t => t.is_online).length}
        totalBids={bids.length}
      />

      <main className="flex-1 overflow-auto p-6 bg-[#050814]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Gavel className="w-6 h-6 text-[#FF6B35]" />
              Bids & Transactions
            </h1>
            <p className="text-sm text-gray-500 mt-1">{bids.length} bids placed</p>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="bg-[#0F1629] rounded-lg border border-[#19388A]/30 px-4 py-2">
              <p className="text-xs text-gray-500">Total Volume</p>
              <p className="text-lg font-bold text-[#FF6B35]">₹{totalVolume}L</p>
            </div>
            <div className="bg-[#0F1629] rounded-lg border border-[#19388A]/30 px-4 py-2">
              <p className="text-xs text-gray-500">Winning Bids</p>
              <p className="text-lg font-bold text-lime-400">{winningBids.length}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by team or startup..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0F1629] border-[#19388A]/50 text-white"
            />
          </div>
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-48 bg-[#0F1629] border-[#19388A]/50 text-white">
              <Filter className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Filter by Team" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F1629] border-[#19388A]/50">
              <SelectItem value="all" className="text-white">All Teams</SelectItem>
              {teams.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-white">{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bids Table */}
        <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#19388A]/30">
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Startup</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Team</th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Amount</th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Round</th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredBids.map((bid, index) => {
                  const startup = startups.find(s => s.id === bid.startup_id);
                  const team = teams.find(t => t.id === bid.team_id);
                  
                  return (
                    <tr 
                      key={bid.id}
                      className={`border-b border-[#19388A]/20 hover:bg-[#19388A]/10 transition-colors ${bid.is_winning ? 'bg-lime-500/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center text-xs font-bold">
                            {startup?.name?.charAt(0) || "S"}
                          </div>
                          <div>
                            <p className="font-medium text-white">{startup?.name || "Unknown"}</p>
                            <p className="text-xs text-[#4F91CD] capitalize">{startup?.domain?.replace(/_/g, " ")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{team?.name || "Unknown"}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className="text-lg font-bold text-[#FF6B35]">{bid.amount}L</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className="bg-[#19388A]/30 text-[#4F91CD] border-0">
                          Round {bid.round || 1}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {bid.is_winning ? (
                          <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30 border">
                            <Trophy className="w-3 h-3 mr-1" />
                            Winner
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-400 border-0">
                            Outbid
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 text-gray-500 text-sm">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(bid.created_date), { addSuffix: true })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredBids.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              <Gavel className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No bids found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}