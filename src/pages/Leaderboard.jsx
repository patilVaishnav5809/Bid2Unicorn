import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Trophy, Medal, Briefcase, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import TopBar from "../components/admin/TopBar";

export default function Leaderboard() {
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

  const calculatePortfolioValue = (teamId) => {
    const teamStartups = startups.filter(s => s.winning_team_id === teamId);
    return teamStartups.reduce((sum, s) => sum + (s.current_price || s.base_price), 0);
  };

  const getTeamStartups = (teamId) => {
    return startups.filter(s => s.winning_team_id === teamId);
  };

  const rankedTeams = teams
    .map(team => ({
      ...team,
      portfolioValue: calculatePortfolioValue(team.id),
      startups: getTeamStartups(team.id),
      remaining: team.total_budget - (team.spent || 0)
    }))
    .sort((a, b) => b.portfolioValue - a.portfolioValue);

  const podiumGradients = [
    "from-yellow-400 via-yellow-500 to-amber-600",
    "from-gray-300 via-gray-400 to-gray-500",
    "from-orange-500 via-orange-600 to-orange-700"
  ];

  const podiumHeights = ["h-40", "h-32", "h-28"];
  const podiumOrders = [1, 0, 2]; // Display order: 2nd, 1st, 3rd

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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Startup Premier League Leaderboard
          </h1>
          <p className="text-gray-500 mt-2">Real-time team rankings based on portfolio value</p>
        </div>

        {/* Podium */}
        <div className="flex justify-center items-end gap-4 mb-12">
          {podiumOrders.map((rank) => {
            const team = rankedTeams[rank];
            if (!team) return <div key={rank} className="w-32" />;

            return (
              <div key={team.id} className="flex flex-col items-center">
                {/* Avatar */}
                <div className={`relative ${rank === 0 ? 'mb-4' : 'mb-2'}`}>
                  {rank === 0 && (
                    <Crown className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-8 h-8 text-yellow-400" />
                  )}
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${podiumGradients[rank]} flex items-center justify-center text-3xl font-bold shadow-lg border-4 border-[#0B1020]`}>
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      team.name?.charAt(0) || "T"
                    )}
                  </div>
                </div>

                {/* Team Info */}
                <p className="text-white font-bold text-center max-w-[120px] truncate">{team.name}</p>
                <p className="text-[#FF6B35] font-bold text-xl">₹{team.portfolioValue}L</p>
                <p className="text-xs text-gray-500">{team.startups.length} startups</p>

                {/* Podium */}
                <div className={`w-28 ${podiumHeights[rank]} bg-gradient-to-t ${podiumGradients[rank]} rounded-t-lg mt-4 flex items-center justify-center shadow-lg`}>
                  <span className="text-5xl font-black text-white/30">{rank + 1}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Rankings Table */}
        <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden">
          <div className="p-4 border-b border-[#19388A]/30">
            <h3 className="text-lg font-bold text-white">Full Rankings</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#19388A]/30">
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3 w-16">Rank</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Team</th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Portfolio Value</th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Startups</th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Budget Used</th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {rankedTeams.map((team, index) => {
                  const spentPercent = ((team.spent || 0) / team.total_budget) * 100;
                  
                  return (
                    <tr 
                      key={team.id}
                      className={`border-b border-[#19388A]/20 hover:bg-[#19388A]/10 transition-colors ${index < 3 ? 'bg-[#19388A]/5' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          {index === 0 && <Medal className="w-6 h-6 text-yellow-400" />}
                          {index === 1 && <Medal className="w-6 h-6 text-gray-300" />}
                          {index === 2 && <Medal className="w-6 h-6 text-orange-500" />}
                          {index > 2 && <span className="text-lg font-bold text-gray-500">{index + 1}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center text-lg font-bold">
                            {team.logo_url ? (
                              <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              team.name?.charAt(0) || "T"
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white">{team.name}</p>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${team.is_online ? 'bg-lime-400' : 'bg-gray-500'}`} />
                              <span className="text-xs text-gray-500">{team.is_online ? 'Online' : 'Offline'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-2xl font-bold text-[#FF6B35]">₹{team.portfolioValue}L</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4 text-[#4F91CD]" />
                            <span className="font-bold text-white">{team.startups.length}</span>
                          </div>
                          {team.startups.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {team.startups.slice(0, 3).map((s, i) => (
                                <div 
                                  key={s.id} 
                                  className="w-6 h-6 rounded-md bg-[#0B1020] flex items-center justify-center text-[10px] font-bold text-[#4F91CD]"
                                  title={s.name}
                                >
                                  {s.name?.charAt(0)}
                                </div>
                              ))}
                              {team.startups.length > 3 && (
                                <div className="w-6 h-6 rounded-md bg-[#0B1020] flex items-center justify-center text-[10px] text-gray-500">
                                  +{team.startups.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="w-32 ml-auto">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">₹{team.spent || 0}L</span>
                            <span className="text-gray-500">₹{team.total_budget}L</span>
                          </div>
                          <Progress value={spentPercent} className="h-2 bg-[#0B1020]" />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <p className="text-lg font-bold text-lime-400">₹{team.remaining}L</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}