import React from "react";
import { Wallet, Briefcase, Edit2, Plus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function TeamsWalletTable({ teams, startups, onEditWallet, onAddTeam, onDeleteTeam, onAllotCards }) {
  const getPortfolioCount = (teamId) => {
    return startups.filter(s => s.winning_team_id === teamId).length;
  };

  const getRemaining = (team) => {
    return team.total_budget - (team.spent || 0);
  };

  const getSpentPercentage = (team) => {
    return ((team.spent || 0) / team.total_budget) * 100;
  };

  return (
    <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden">
      <div className="p-4 border-b border-[#19388A]/30 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#4F91CD]" />
          Teams & Wallets
        </h3>
        {onAddTeam && (
            <Button 
                onClick={onAddTeam}
                size="sm"
                className="bg-[#19388A] hover:bg-[#19388A]/80 text-white ml-auto flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Add Team
            </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#19388A]/30">
              <th className="text-left text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Team</th>
              <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Total Budget</th>
              <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Spent</th>
              <th className="text-right text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Remaining</th>
              <th className="text-center text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Portfolio</th>
              <th className="text-center text-xs text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr 
                key={team.id} 
                className="border-b border-[#19388A]/20 hover:bg-[#19388A]/10 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center text-sm font-bold">
                      {team.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        team.name?.charAt(0) || "T"
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">{team.name}</p>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${team.status === 'active' ? 'bg-lime-400' : 'bg-gray-500'}`} />
                        <span className="text-xs text-gray-500 capitalize">{team.status || 'inactive'}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="font-semibold text-white">₹{team.total_budget}L</p>
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="font-semibold text-[#FF6B35]">₹{team.spent || 0}L</p>
                  <Progress 
                    value={getSpentPercentage(team)} 
                    className="h-1 mt-1 bg-[#0B1020]"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <p className="font-semibold text-lime-400">₹{getRemaining(team)}L</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-white">{getPortfolioCount(team.id)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center min-w-[120px]">
                  {onAllotCards && (
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Allot Power Cards"
                      onClick={() => onAllotCards(team)}
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Edit Team"
                    onClick={() => onEditWallet(team)}
                    className="text-[#4F91CD] hover:text-white hover:bg-[#19388A]/30 ml-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Delete Team"
                    onClick={() => onDeleteTeam(team)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}