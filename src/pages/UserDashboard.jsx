import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Trophy, Rocket, Wallet, Users, TrendingUp, Target, Clock, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const queryClient = useQueryClient();

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
        base44.auth.redirectToLogin();
      }
    };
    
    loadUserAndTeam();
  }, []);

  const { data: startups = [] } = useQuery({
    queryKey: ["startups"],
    queryFn: () => base44.entities.Startup.list("order"),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: bids = [] } = useQuery({
    queryKey: ["bids"],
    queryFn: () => base44.entities.Bid.list("-created_date", 100),
  });

  const { data: settingsArr = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AuctionSettings.list(),
  });

  const settings = settingsArr[0];
  const activeStartup = settings?.is_auction_active ? startups.find(s => s.id === settings?.active_startup_id) : null;
  
  const myPortfolio = myTeam ? startups.filter(s => s.winning_team_id === myTeam.id) : [];
  const portfolioValue = myPortfolio.reduce((sum, s) => sum + (s.current_price || s.base_price), 0);
  const remaining = myTeam ? myTeam.total_budget - (myTeam.spent || 0) : 0;
  const spentPercentage = myTeam ? ((myTeam.spent || 0) / myTeam.total_budget) * 100 : 0;

  const activeStartupBids = activeStartup 
    ? bids.filter(b => b.startup_id === activeStartup.id).sort((a, b) => b.amount - a.amount)
    : [];
  
  const highestBid = activeStartupBids[0];
  const minNextBid = (activeStartup?.current_price || activeStartup?.base_price || 0) + 1;

  const rankedTeams = teams
    .map(t => ({
      ...t,
      value: startups
        .filter(s => s.winning_team_id === t.id)
        .reduce((sum, s) => sum + (s.current_price || s.base_price), 0),
      owned: startups.filter(s => s.winning_team_id === t.id).length
    }))
    .sort((a, b) => b.value - a.value);

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, any>} */
  const createBidMutation = useMutation({
    mutationFn: (data) => base44.entities.Bid.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      setBidAmount("");
    },
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateStartupMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Startup.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startups"] }),
  });

  const handlePlaceBid = async () => {
    if (!activeStartup || !myTeam) return;
    
    const amount = parseFloat(bidAmount);
    if (amount < minNextBid) {
      alert(`Minimum bid is ₹${minNextBid}L`);
      return;
    }
    
    if (amount > remaining) {
      alert("Insufficient budget!");
      return;
    }

    await createBidMutation.mutateAsync({
      startup_id: activeStartup.id,
      team_id: myTeam.id,
      amount,
      round: settings?.current_round || 1,
      is_winning: true
    });

    await updateStartupMutation.mutateAsync({
      id: activeStartup.id,
      data: { current_price: amount }
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-[#4F91CD] mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!myTeam) {
    return (
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No Team Assigned</h2>
          <p className="text-gray-500 mb-4">
            You haven't been assigned to a team yet. An administrator needs to add your email ({user.email}) to a team.
          </p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      {/* Top Header */}
      <header className="bg-[#0F1A2E] border-b border-[#1E3A5F] px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Startup Premier League</h1>
              <p className="text-xs text-gray-400">Dashboard • {myTeam.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase">ROUND {settings?.current_round || 1}</p>
              <p className="text-sm font-semibold text-white">{settings?.round_name || "IPL-Style Startup Auction"}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">CURRENT</p>
              <p className="text-lg font-bold text-orange-400">{remaining}L</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        <aside className="w-64 bg-[#0F1A2E] border-r border-[#1E3A5F] overflow-y-auto">
          {/* My Team */}
          <div className="p-4 border-b border-[#1E3A5F]">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-gray-400">My Team</h3>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <span className="text-lg font-bold">{myTeam.name?.charAt(0)}</span>
              </div>
              <h2 className="text-lg font-bold text-white">{myTeam.name}</h2>
            </div>
            
            {myTeam.members && myTeam.members.length > 0 && (
              <div className="space-y-2">
                {myTeam.members.slice(0, 4).map((email, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-900 flex items-center justify-center text-xs">
                        {email.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-gray-300">{email.split('@')[0]}</span>
                    </div>
                    <span className="text-xs text-gray-500">Member</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Team Wallet */}
          <div className="p-4 border-b border-[#1E3A5F]">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold text-gray-400">My Team Wallet</h3>
            </div>
            
            <div className="flex justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#1E3A5F"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#10B981"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (spentPercentage / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <p className="text-2xl font-bold text-green-400">₹{remaining}L</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total Budget</span>
                <span className="text-white font-semibold">₹{myTeam.total_budget}L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-400">Spent</span>
                <span className="text-red-400 font-semibold">₹{myTeam.spent || 0}L</span>
              </div>
            </div>
            
            <Progress value={spentPercentage} className="h-2 mt-3 bg-[#1E3A5F]" />
            <div className="flex justify-between text-xs mt-1">
              <span className="text-red-400">{Math.round(spentPercentage)}% used</span>
              <span className="text-green-400">{Math.round(100 - spentPercentage)}% left</span>
            </div>
          </div>

          {/* My Startups */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-gray-400">My Startups</h3>
              <span className="ml-auto text-xs text-gray-500">{myPortfolio.length} owned</span>
            </div>

            {myPortfolio.length > 0 ? (
              <div className="space-y-2 mb-4">
                {myPortfolio.map(startup => (
                  <div key={startup.id} className="bg-[#1E3A5F]/30 rounded-lg p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold">
                      {startup.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{startup.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{startup.domain?.replace(/_/g, ' ')}</p>
                    </div>
                    <p className="text-sm font-bold text-blue-400">₹{startup.current_price || startup.base_price}L</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No startups yet</p>
            )}

            <div className="pt-3 border-t border-[#1E3A5F]">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">PORTFOLIO VALUE</span>
                <span className="text-blue-400 font-bold">₹{portfolioValue}L</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center - Auction Panel */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeStartup ? (
            <div className="max-w-2xl mx-auto">
              {/* Auction Card */}
              <div className="bg-[#0F1A2E] rounded-xl border border-[#1E3A5F] overflow-hidden mb-6">
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center">
                      {activeStartup.logo_url ? (
                        <img src={activeStartup.logo_url} alt={activeStartup.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span className="text-3xl font-bold">{activeStartup.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-blue-600 text-white border-0 text-xs capitalize">{activeStartup.domain?.replace(/_/g, " ")}</Badge>
                        <span className="text-2xl font-bold text-white">{activeStartup.name}</span>
                      </div>
                      <p className="text-sm text-gray-400">{activeStartup.description || "Instant B2B payments for SMEs across emerging markets"}</p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#1E3A5F]/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">Users</span>
                      </div>
                      <p className="text-lg font-bold text-white">45K</p>
                    </div>
                    <div className="bg-[#1E3A5F]/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">Growth</span>
                      </div>
                      <p className="text-lg font-bold text-green-400">+180%</p>
                    </div>
                    <div className="bg-[#1E3A5F]/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-500">Risk</span>
                      </div>
                      <p className="text-lg font-bold text-yellow-400">Medium</p>
                    </div>
                  </div>

                  {/* Base Price */}
                  <div className="bg-[#1E3A5F]/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 uppercase">Base Price</span>
                      <span className="text-3xl font-bold text-white">₹{activeStartup.base_price}L</span>
                    </div>
                  </div>

                  {/* Live Bidding */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 text-green-400" />
                      <h3 className="text-sm font-semibold text-white">Live Bidding</h3>
                      <Badge className="bg-green-500/20 text-green-400 border-0 text-xs ml-auto">LIVE</Badge>
                    </div>

                    <div className="text-center mb-4">
                      <p className="text-xs text-gray-500 uppercase mb-2">Current Highest Bid</p>
                      <p className="text-5xl font-bold text-green-400 mb-2">₹{highestBid?.amount || activeStartup.base_price}L</p>
                      {highestBid && (
                        <Badge className="bg-blue-600 text-white border-0">
                          {teams.find(t => t.id === highestBid.team_id)?.name || "Unknown Team"}
                        </Badge>
                      )}
                    </div>

                    {/* Recent Bids */}
                    <div className="bg-[#1E3A5F]/30 rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
                      <p className="text-xs text-gray-500 uppercase mb-2">Recent Bids</p>
                      <div className="space-y-2">
                        {activeStartupBids.slice(0, 5).map(bid => (
                          <div key={bid.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-300">{teams.find(t => t.id === bid.team_id)?.name}</span>
                            <span className="font-bold text-white">₹{bid.amount}L</span>
                            <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(bid.created_date), { addSuffix: true })}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bid Input */}
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder={`Min: ₹${minNextBid}L`}
                        className="bg-[#1E3A5F] border-[#1E3A5F] text-white flex-1"
                      />
                      <Button
                        onClick={handlePlaceBid}
                        disabled={!bidAmount || parseFloat(bidAmount) < minNextBid}
                        className="bg-lime-500 hover:bg-lime-600 text-black font-bold px-8"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        PLACE BID - ₹{bidAmount || minNextBid}L
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Min next bid: ₹{minNextBid}L (₹1L higher)</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <Clock className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">No Active Auction</h2>
              <p className="text-gray-500">Waiting for the next round to begin</p>
            </div>
          )}
        </main>

        {/* Right Sidebar - Leaderboard */}
        <aside className="w-80 bg-[#0F1A2E] border-l border-[#1E3A5F] overflow-y-auto">
          <div className="p-4 border-b border-[#1E3A5F]">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-white">Teams Leaderboard</h3>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-500 uppercase mb-3 px-2">
              <span>Team</span>
              <span className="text-right">Portfolio</span>
              <span className="text-right">Budget</span>
              <span className="text-right">Owned</span>
            </div>

            <div className="space-y-2">
              {rankedTeams.map((team, idx) => (
                <div
                  key={team.id}
                  className={`rounded-lg p-3 ${
                    team.id === myTeam?.id 
                      ? 'bg-blue-600/20 border border-blue-500/50' 
                      : 'bg-[#1E3A5F]/30'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-500 text-black' :
                      idx === 1 ? 'bg-gray-400 text-black' :
                      idx === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-sm font-bold">
                      {team.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{team.name}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Portfolio</p>
                      <p className="font-bold text-green-400">₹{team.value}L</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Budget</p>
                      <p className="font-bold text-blue-400">₹{team.total_budget - (team.spent || 0)}L</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Owned</p>
                      <p className="font-bold text-white">{team.owned}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}