import React from "react";
import { Trophy } from "lucide-react";

export default function LeaderboardPanel({ teams, startups }) {
  const calculatePortfolioValue = (teamId) => {
    const teamStartups = startups.filter(s => s.winning_team_id === teamId);
    return teamStartups.reduce((sum, s) => sum + (s.current_price || s.base_price), 0);
  };

  const getStartupCount = (teamId) => {
    return startups.filter(s => s.winning_team_id === teamId).length;
  };

  const rankedTeams = teams
    .map(team => ({
      ...team,
      portfolioValue: calculatePortfolioValue(team.id),
      startupCount: getStartupCount(team.id)
    }))
    .sort((a, b) => b.portfolioValue - a.portfolioValue);

  const podiumColors = [
    "from-yellow-500 to-amber-600",
    "from-gray-300 to-gray-400",
    "from-orange-600 to-orange-700"
  ];

  return (
    <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden">
      <div className="p-4 border-b border-[#19388A]/30">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Leaderboard
        </h3>
      </div>

      {/* Top 3 Podium */}
      <div className="p-4 flex justify-center items-end gap-2 border-b border-[#19388A]/30">
        {[1, 0, 2].map((index) => {
          const team = rankedTeams[index];
          if (!team) return <div key={index} className="w-24" />;
          
          const heights = ["h-24", "h-20", "h-16"];
          const positions = [1, 2, 3];
          
          return (
            <div key={team.id} className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${podiumColors[index]} flex items-center justify-center text-lg font-bold mb-2 shadow-lg`}>
                {team.logo_url ? (
                  <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  team.name?.charAt(0) || "T"
                )}
              </div>
              <p className="text-xs text-white font-medium text-center truncate max-w-[80px]">{team.name}</p>
              <p className="text-xs text-[#FF6B35] font-bold">₹{team.portfolioValue}L</p>
              <div className={`w-20 ${heights[index]} bg-gradient-to-t ${podiumColors[index]} rounded-t-lg mt-2 flex items-center justify-center`}>
                <span className="text-2xl font-bold text-white/80">{positions[index]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full List */}
      <div className="p-4 space-y-2 max-h-[200px] overflow-y-auto">
        {rankedTeams.slice(3).map((team, index) => (
          <div 
            key={team.id}
            className="flex items-center gap-3 p-2 rounded-lg bg-[#0B1020] hover:bg-[#19388A]/20 transition-colors"
          >
            <span className="w-6 text-center text-sm font-bold text-gray-500">{index + 4}</span>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center text-xs font-bold">
              {team.name?.charAt(0) || "T"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{team.name}</p>
              <p className="text-xs text-gray-500">{team.startupCount} startups</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-[#FF6B35]">₹{team.portfolioValue}L</p>
              <p className="text-xs text-gray-500">₹{team.total_budget - (team.spent || 0)}L left</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}