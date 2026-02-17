import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string|number} props.value
 * @param {any} props.icon
 * @param {string} [props.color]
 * @param {string} [props.trend]
 * @param {string|number} [props.trendValue]
 */
export default function StatCard({ title, value, icon, color = "blue", trend, trendValue }) {
  const Icon = icon;
  const colorClasses = {
    blue: {
      bg: "bg-[#19388A]/20",
      icon: "text-[#4F91CD]",
      glow: "shadow-[0_0_30px_rgba(79,145,205,0.15)]"
    },
    orange: {
      bg: "bg-[#FF6B35]/20",
      icon: "text-[#FF6B35]",
      glow: "shadow-[0_0_30px_rgba(255,107,53,0.15)]"
    },
    lime: {
      bg: "bg-lime-500/20",
      icon: "text-lime-400",
      glow: "shadow-[0_0_30px_rgba(132,204,22,0.15)]"
    },
    purple: {
      bg: "bg-purple-500/20",
      icon: "text-purple-400",
      glow: "shadow-[0_0_30px_rgba(168,85,247,0.15)]"
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`relative overflow-hidden bg-[#0F1629] rounded-xl border border-[#19388A]/30 p-5 ${colors.glow} hover:border-[#4F91CD]/50 transition-all duration-300`}>
      {/* Background Gradient */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${colors.bg} rounded-full blur-2xl`} />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-lime-400' : 'text-red-400'}`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}