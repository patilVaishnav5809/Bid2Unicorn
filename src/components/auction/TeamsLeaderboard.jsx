import React from 'react';
import { Trophy } from "lucide-react";

export default function TeamsLeaderboard({ teams, myTeamName }) {
  const sortedTeams = [...teams].sort((a, b) => b.portfolio - a.portfolio);

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-amber-500/20 flex flex-col h-full overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.05)]">
      <div className="p-3 border-b border-amber-500/20 bg-black/60 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent pointer-events-none" />
        <h3 className="text-sm font-black text-gray-100 uppercase tracking-widest flex items-center gap-1.5 relative z-10">
          <Trophy className="w-4 h-4 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          Teams Leaderboard
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-black/80 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="p-2 text-[9px] font-bold text-amber-500/70 uppercase tracking-widest pl-3">Team</th>
              <th className="p-2 text-[9px] font-bold text-amber-500/70 uppercase tracking-widest text-right">Portfolio</th>
              <th className="p-2 text-[9px] font-bold text-amber-500/70 uppercase tracking-widest text-right">Budget</th>
              <th className="p-2 text-[9px] font-bold text-amber-500/70 uppercase tracking-widest text-center">Owned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-500/10">
            {sortedTeams.map((team, index) => {
              const isMyTeam = team.name === myTeamName;
              
              return (
                <tr 
                  key={index} 
                  className={`
                    transition-colors hover:bg-amber-500/5
                    ${isMyTeam ? 'bg-amber-500/10' : ''}
                  `}
                >
                  <td className="p-2 pl-3">
                    <div className="flex items-center gap-2">
                      <div className={`
                        w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm
                        ${index === 0 ? 'bg-yellow-400 text-black shadow-yellow-400/50' : 
                          index === 1 ? 'bg-gray-300 text-black shadow-gray-300/50' : 
                          index === 2 ? 'bg-amber-700 text-white shadow-amber-700/50' : 
                          'bg-black/60 border border-amber-500/30 text-amber-500/70'}
                      `}>
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-bold text-xs tracking-wide ${isMyTeam ? 'text-amber-400' : 'text-gray-300'}`}>
                          {team.name.length > 12 ? team.name.substring(0, 10) + '...' : team.name}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-2 text-right">
                    <span className="font-black text-amber-500 text-xs drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">₹{team.portfolio}M</span>
                  </td>
                  <td className="p-2 text-right">
                    <span className="font-mono font-bold text-gray-500 text-xs">₹{team.remaining}M</span>
                  </td>
                  <td className="p-2 text-center">
                    <span className="bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-gray-300 font-bold border border-amber-500/20">
                      {team.startups}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* My Team Summary at Bottom */}
       <div className="p-3 bg-black/60 backdrop-blur-md border-t border-amber-500/30 mt-auto relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 to-transparent pointer-events-none" />
         {(() => {
             const myTeamStats = teams.find(t => t.name === myTeamName);
             if (!myTeamStats) return null;
             const myRank = sortedTeams.findIndex(t => t.name === myTeamName) + 1;
             
             return (
                 <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold relative z-10">
                    <span className="text-amber-400">Your Rank: #{myRank}</span>
                    <span className="text-gray-500">Next rank: <span className="text-amber-500">₹{sortedTeams[myRank-2]?.portfolio - myTeamStats.portfolio || 0}M</span> more</span>
                 </div>
             )
         })()}
       </div>
    </div>
  );
}
