import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default function MyTeamSection({ team }) {
  if (!team) return null;

  return (
    <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-amber-500/20 p-3 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-yellow-500 shadow-lg shadow-amber-500/20 flex items-center justify-center text-2xl text-black font-bold">
          {team.avatar}
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-100 tracking-wide">{team.name}</h3>
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0">
            You
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-[9px] uppercase text-amber-500/70 font-bold tracking-widest flex items-center gap-1.5 mb-1.5">
          <Users className="w-2.5 h-2.5" />
          Members
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {team.members.map((member, index) => (
            <div key={index} className="bg-black/60 p-1.5 rounded-lg border border-amber-500/10 hover:border-amber-500/30 transition-colors">
              <p className="text-xs font-semibold text-gray-200 truncate">{member.name}</p>
              <p className="text-[10px] text-gray-500">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
