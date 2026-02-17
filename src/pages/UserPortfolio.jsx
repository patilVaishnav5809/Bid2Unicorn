import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  ArrowLeft, Rocket, TrendingUp, DollarSign, 
  BarChart3, Filter, Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function UserPortfolio() {
  const [user, setUser] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDomain, setFilterDomain] = useState("all");

  useEffect(() => {
    const loadUserAndTeam = async () => {
      try {
        const user = await base44.auth.me();
        setUser(user);
        
        const teams = await base44.entities.Team.list();
        const team = teams.find(t => 
          t.members?.includes(user.email) || 
          t.created_by === user.email
        );
        setMyTeam(team);
      } catch (error) {
        console.error("Error loading user/team:", error);
      }
    };
    
    loadUserAndTeam();
  }, []);

  const { data: startups = [] } = useQuery({
    queryKey: ["startups"],
    queryFn: () => base44.entities.Startup.list("order"),
  });

  const myPortfolio = myTeam ? startups.filter(s => s.winning_team_id === myTeam.id) : [];
  const portfolioValue = myPortfolio.reduce((sum, s) => sum + (s.current_price || s.base_price), 0);
  const totalSpent = myTeam?.spent || 0;
  const unrealizedGain = portfolioValue - totalSpent;

  const filteredPortfolio = myPortfolio.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = filterDomain === "all" || s.domain === filterDomain;
    return matchesSearch && matchesDomain;
  });

  const domains = [...new Set(myPortfolio.map(s => s.domain))];

  const domainBreakdown = domains.map(domain => {
    const domainStartups = myPortfolio.filter(s => s.domain === domain);
    const value = domainStartups.reduce((sum, s) => sum + (s.current_price || s.base_price), 0);
    return { domain, count: domainStartups.length, value };
  }).sort((a, b) => b.value - a.value);

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
            <Rocket className="w-8 h-8 text-[#4F91CD]" />
            My Portfolio
          </h1>
          <p className="text-gray-500">{myTeam?.name || "Your Team"}'s startup investments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 p-6">
            <div className="flex items-center justify-between mb-3">
              <Rocket className="w-8 h-8 text-[#4F91CD]" />
              <TrendingUp className="w-5 h-5 text-lime-400" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Startups</p>
            <p className="text-3xl font-bold text-white">{myPortfolio.length}</p>
          </div>

          <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 p-6">
            <div className="flex items-center justify-between mb-3">
              <BarChart3 className="w-8 h-8 text-[#FF6B35]" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Portfolio Value</p>
            <p className="text-3xl font-bold text-[#FF6B35]">₹{portfolioValue}L</p>
          </div>

          <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 p-6">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Invested</p>
            <p className="text-3xl font-bold text-white">₹{totalSpent}L</p>
          </div>

          <div className={`bg-[#0F1629] rounded-xl border ${unrealizedGain >= 0 ? 'border-lime-500/30' : 'border-red-500/30'} p-6`}>
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className={`w-8 h-8 ${unrealizedGain >= 0 ? 'text-lime-400' : 'text-red-400'}`} />
            </div>
            <p className="text-sm text-gray-500 mb-1">Unrealized Gain</p>
            <p className={`text-3xl font-bold ${unrealizedGain >= 0 ? 'text-lime-400' : 'text-red-400'}`}>
              {unrealizedGain >= 0 ? '+' : ''}₹{unrealizedGain}L
            </p>
          </div>
        </div>

        {/* Domain Breakdown */}
        {domainBreakdown.length > 0 && (
          <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Portfolio Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {domainBreakdown.map(({ domain, count, value }) => (
                <div key={domain} className="bg-[#0B1020] rounded-lg p-4 border border-[#19388A]/30">
                  <p className="text-xs text-gray-500 capitalize mb-1">{domain.replace(/_/g, " ")}</p>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-sm text-[#FF6B35] mt-1">₹{value}L</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search startups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0F1629] border-[#19388A]/50 text-white"
            />
          </div>
          {domains.length > 0 && (
            <Select value={filterDomain} onValueChange={setFilterDomain}>
              <SelectTrigger className="w-48 bg-[#0F1629] border-[#19388A]/50 text-white">
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="bg-[#0F1629] border-[#19388A]/50">
                <SelectItem value="all" className="text-white">All Domains</SelectItem>
                {domains.map(d => (
                  <SelectItem key={d} value={d} className="text-white capitalize">
                    {d.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Portfolio Grid */}
        {filteredPortfolio.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPortfolio.map(startup => {
              const purchasePrice = startup.current_price || startup.base_price;
              const currentValue = startup.current_price || startup.base_price;
              const gain = currentValue - purchasePrice;
              
              return (
                <div 
                  key={startup.id}
                  className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden hover:border-[#4F91CD]/50 transition-all"
                >
                  {/* Header */}
                  <div className="h-24 bg-gradient-to-br from-[#19388A]/50 to-[#0B1020] flex items-center justify-center relative">
                    {startup.logo_url ? (
                      <img src={startup.logo_url} alt={startup.name} className="w-16 h-16 object-contain" />
                    ) : (
                      <span className="text-4xl font-bold text-white/50">{startup.name?.charAt(0)}</span>
                    )}
                    <Badge className="absolute top-3 right-3 bg-[#4F91CD]/20 text-[#4F91CD] border-[#4F91CD]/30 border text-xs capitalize">
                      {startup.domain?.replace(/_/g, " ")}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-bold text-white text-lg mb-2">{startup.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">{startup.description}</p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Purchase Price</span>
                        <span className="text-sm font-semibold text-white">₹{purchasePrice}L</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Current Value</span>
                        <span className="text-lg font-bold text-[#FF6B35]">₹{currentValue}L</span>
                      </div>
                      {gain !== 0 && (
                        <div className={`flex justify-between items-center p-2 rounded-lg ${gain >= 0 ? 'bg-lime-500/10' : 'bg-red-500/10'}`}>
                          <span className="text-xs text-gray-500">Gain/Loss</span>
                          <span className={`text-sm font-bold ${gain >= 0 ? 'text-lime-400' : 'text-red-400'}`}>
                            {gain >= 0 ? '+' : ''}₹{gain}L
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 p-12 text-center">
            <Rocket className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Startups Yet</h3>
            <p className="text-gray-500 mb-6">
              {myPortfolio.length === 0 
                ? "You haven't acquired any startups yet. Join an auction to start building your portfolio!"
                : "No startups match your filters."
              }
            </p>
            {myPortfolio.length === 0 && (
              <Link to={createPageUrl("UserAuction")}>
                <Button className="bg-[#19388A] hover:bg-[#19388A]/80">
                  Join Auction
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}