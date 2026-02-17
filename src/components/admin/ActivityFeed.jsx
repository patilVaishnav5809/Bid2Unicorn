import React from "react";
import { Activity, Gavel, Zap, Newspaper, Wallet, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const typeIcons = {
  bid: Gavel,
  sale: CheckCircle,
  power_card: Zap,
  news: Newspaper,
  wallet: Wallet,
  system: Activity
};

const typeColors = {
  bid: "text-[#4F91CD] bg-[#4F91CD]/20",
  sale: "text-lime-400 bg-lime-400/20",
  power_card: "text-[#FF6B35] bg-[#FF6B35]/20",
  news: "text-yellow-400 bg-yellow-400/20",
  wallet: "text-purple-400 bg-purple-400/20",
  system: "text-gray-400 bg-gray-400/20"
};

export default function ActivityFeed({ logs, onResolve }) {
  return (
    <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden">
      <div className="p-4 border-b border-[#19388A]/30 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#4F91CD]" />
          Activity Feed
        </h3>
        <span className="text-xs text-gray-500">{logs.length} activities</span>
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {logs.map((log) => {
          const IconComponent = typeIcons[log.type] || Activity;
          const colorClass = typeColors[log.type] || typeColors.system;
          
          return (
            <div 
              key={log.id}
              className={`px-4 py-3 border-b border-[#19388A]/20 hover:bg-[#19388A]/10 transition-colors flex items-start gap-3 ${log.is_resolved ? 'opacity-50' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{log.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(log.created_date), { addSuffix: true })}
                  </span>
                  {log.amount && (
                    <span className="text-xs text-[#FF6B35] font-semibold">₹{log.amount}L</span>
                  )}
                </div>
              </div>
              {!log.is_resolved && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onResolve(log.id)}
                  className="text-gray-400 hover:text-lime-400 hover:bg-lime-400/10"
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        })}

        {logs.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No activity yet.
          </div>
        )}
      </div>
    </div>
  );
}