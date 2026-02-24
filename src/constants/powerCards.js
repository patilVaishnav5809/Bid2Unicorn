import { Sparkles, Shield, Eye, Ban, Rocket, DollarSign, RefreshCw, Lock } from "lucide-react";

export const POWER_CARDS_DATA = [
  { id: "double_value", name: "Double Value", icon: Sparkles, description: "2x Startups value in final scoring.", color: "text-purple-400" },
  { id: "steal_startup", name: "Steal Startup", icon: Shield, description: "Pay 80% to steal a startup won by another team.", color: "text-red-400" },
  { id: "freeze_budget", name: "Freeze Budget", icon: Ban, description: "One team cannot bid on the next startup.", color: "text-blue-400" },
  { id: "emergency_budget", name: "Emergency Budget", icon: DollarSign, description: "Add ₹20M to your total budget.", color: "text-green-400" },
  { id: "reverse_auction", name: "Reverse Auction", icon: RefreshCw, description: "Lowest bid wins instead of highest.", color: "text-yellow-400" },
  { id: "block_team", name: "Block Team", icon: Lock, description: "Reserve a specific startup so one team can't bid.", color: "text-orange-400" },
  { id: "insider_info", name: "Insider Info", icon: Eye, description: "Peek at next 3 startup stats.", color: "text-cyan-400" },
  { id: "wild_card", name: "Wild Card", icon: Rocket, description: "Design your own power.", color: "text-pink-400" },
];
