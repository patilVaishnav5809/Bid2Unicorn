import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { ArrowLeft, Trophy, Crown, TrendingUp, Rocket, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function UserLeaderboard() {
  const [myTeam, setMyTeam] = useState(null);

  useEffect(() => {
    const loadUserAndTeam = async () => {
      try {
        const currentUser = await base44.auth.me();
        
        const teams = await base44.entities.Team.list();
        const team = teams.find(t => 
          t.members?.includes(currentUser.email) || 
          t.created_by === currentUser.email
        );
        setMyTeam(team);
      } catch (error) {
        console.error("Error loading user/team:", error);
      }
    };
    
    loadUserAndTeam();
  }, []);

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: startups = [] } = useQuery({
    queryKey: ["startups"],
    queryFn: () => base44.entities.Startup.list(),
  });

  const calculatePortfolioValue = (teamId) => {
    const teamStartups = startups.filter(s => s.winning_team_id === teamId);
    return teamStartups.reduce((sum, s) => sum + (s.current_price || s.base_price), 0);
  };

  const rankedTeams = teams
    .map(team => ({
      ...team,
      portfolioValue: calculatePortfolioValue(team.id),
      startupCount: startups.filter(s => s.winning_team_id === team.id).length,
      remaining: team.total_budget - (team.spent || 0)
    }))
    .sort((a, b) => b.portfolioValue - a.portfolioValue);

  const myRank = myTeam ? rankedTeams.findIndex(t => t.id === myTeam.id) + 1 : 0;
  const podiumGradients = [
    "from-yellow-400 via-yellow-500 to-amber-600",
    "from-gray-300 via-gray-400 to-gray-500",
    "from-orange-500 via-orange-600 to-orange-700"
  ];

  return (
    <div className="min-h-screen bg-[#050814] text-white">
      <div className="container mx-auto px-6 py-8">
        <Link to={createPageUrl("UserDashboard")}>
          <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3 mb-3">
            <Trophy className="w-10 h-10 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-gray-500">Team rankings based on portfolio value</p>
          {myTeam && (
            <div className="mt-4 inline-block px-6 py-3 bg-[#0F1629] rounded-lg border border-[#19388A]/30">
              <span className="text-gray-500">Your Team Rank: </span>
              <span className="text-2xl font-bold text-[#4F91CD]">#{myRank}</span>
              <span className="text-gray-500"> of {teams.length}</span>
            </div>
          )}
        </div>

        {/* Top 3 Podium */}
        <div className="flex justify-center items-end gap-6 mb-16">
          {[1, 0, 2].map((index) => {
            const team = rankedTeams[index];
            if (!team) return <div key={index} className="w-32" />;

            const heights = ["h-48", "h-40", "h-32"];
            const isMyTeam = team.id === myTeam?.id;

            return (
              <div key={team.id} className="flex flex-col items-center">
                <div className="relative mb-4">
                  {index === 0 && (
                    <Crown className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-10 h-10 text-yellow-400 animate-pulse" />
                  )}
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${podiumGradients[index]} flex items-center justify-center text-3xl font-bold shadow-2xl border-4 ${isMyTeam ? 'border-[#4F91CD]' : 'border-[#0B1020]'}`}>
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      team.name?.charAt(0) || "T"
                    )}
                  </div>
                  {isMyTeam && (
                    <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#4F91CD] text-white border-0 text-xs">
                      YOU
                    </Badge>
                  )}
                </div>

                <p className="text-white font-bold text-center max-w-[140px] truncate mb-1">
                  {team.name}
                </p>
                <p className="text-[#FF6B35] font-bold text-2xl mb-1">₹{team.portfolioValue}L</p>
                <p className="text-xs text-gray-500 mb-2">{team.startupCount} startups</p>

                <div className={`w-32 ${heights[index]} bg-gradient-to-t ${podiumGradients[index]} rounded-t-xl shadow-lg flex flex-col items-center justify-center`}>
                  <Trophy className="w-8 h-8 text-white/30 mb-2" />
                  <span className="text-5xl font-black text-white/40">{index + 1}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Rankings */}
        <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden">
          <div className="p-6 border-b border-[#19388A]/30">
            <h3 className="text-xl font-bold text-white">Complete Rankings</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#19388A]/30">
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-4 w-20">Rank</th>
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-6 py-4">Team</th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-6 py-4">Portfolio Value</th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wider px-6 py-4">Startups</th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-6 py-4">Budget Used</th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-6 py-4">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {rankedTeams.map((team, index) => {
                  const isMyTeam = team.id === myTeam?.id;
                  const spentPercent = ((team.spent || 0) / team.total_budget) * 100;

                  return (
                    <tr 
                      key={team.id}
                      className={`border-b border-[#19388A]/20 hover:bg-[#19388A]/10 transition-colors ${isMyTeam ? 'bg-[#4F91CD]/10 border-l-4 border-l-[#4F91CD]' : ''} ${index < 3 ? 'bg-[#19388A]/5' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center">
                          {index < 3 ? (
                            <Trophy className={`w-7 h-7 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : 'text-orange-500'}`} />
                          ) : (
                            <span className="text-xl font-bold text-gray-500">{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center text-xl font-bold">
                            {team.logo_url ? (
                              <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              team.name?.charAt(0) || "T"
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={`font-bold text-lg ${isMyTeam ? 'text-[#4F91CD]' : 'text-white'}`}>
                                {team.name}
                              </p>
                              {isMyTeam && (
                                <Badge className="bg-[#4F91CD] text-white border-0 text-xs">
                                  YOUR TEAM
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`w-2 h-2 rounded-full ${team.is_online ? 'bg-lime-400' : 'bg-gray-500'}`} />
                              <span className="text-xs text-gray-500">{team.is_online ? 'Online' : 'Offline'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TrendingUp className="w-5 h-5 text-[#FF6B35]" />
                          <p className="text-2xl font-bold text-[#FF6B35]">₹{team.portfolioValue}L</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Rocket className="w-5 h-5 text-[#4F91CD]" />
                          <span className="text-xl font-bold text-white">{team.startupCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-36 ml-auto">
                          <div className="flex justify-between text-xs mb-2">
                            <span className="text-gray-500">₹{team.spent || 0}L</span>
                            <span className="text-gray-500">₹{team.total_budget}L</span>
                          </div>
                          <Progress value={spentPercent} className="h-2 bg-[#0B1020]" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Wallet className="w-5 h-5 text-lime-400" />
                          <p className="text-xl font-bold text-lime-400">₹{team.remaining}L</p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}