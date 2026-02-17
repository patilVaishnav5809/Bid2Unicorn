import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  ArrowLeft, Gavel, Timer, TrendingUp, AlertTriangle,
  Send, Trophy, Users, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";

export default function UserAuction() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [myTeam, setMyTeam] = useState(null);
  const [bidAmount, setBidAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: bids = [] } = useQuery({
    queryKey: ["bids"],
    queryFn: () => base44.entities.Bid.list("-created_date"),
  });

  const { data: settingsArr = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AuctionSettings.list(),
  });

  const settings = settingsArr[0];
  const activeStartup = startups.find(s => s.id === settings?.active_startup_id);

  useEffect(() => {
    if (!settings?.timer_end_time) return;
    
    const interval = setInterval(() => {
      const end = new Date(settings.timer_end_time).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeft(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [settings?.timer_end_time]);

  // Real-time bid subscription
  useEffect(() => {
    const unsubscribe = base44.entities.Bid.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["startups"] });
    });
    return unsubscribe;
  }, [queryClient]);

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, any>} */
  const createBid = useMutation({
    mutationFn: (data) => base44.entities.Bid.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      setBidAmount("");
    },
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateStartup = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Startup.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startups"] }),
  });

  const handlePlaceBid = async () => {
    if (!myTeam || !activeStartup || !bidAmount) return;
    
    const amount = parseFloat(bidAmount);
    const minBid = (activeStartup.current_price || activeStartup.base_price) + 1;
    
    if (amount < minBid) {
      alert(`Minimum bid is ₹${minBid}L`);
      return;
    }

    const remaining = myTeam.total_budget - (myTeam.spent || 0);
    if (amount > remaining) {
      alert(`You only have ₹${remaining}L available`);
      return;
    }

    setIsSubmitting(true);
    await createBid.mutateAsync({
      startup_id: activeStartup.id,
      team_id: myTeam.id,
      amount,
      round: settings?.current_round || 1,
      is_winning: false
    });

    await updateStartup.mutateAsync({
      id: activeStartup.id,
      data: { current_price: amount }
    });

    setIsSubmitting(false);
  };

  const startupBids = activeStartup 
    ? bids.filter(b => b.startup_id === activeStartup.id).sort((a, b) => b.amount - a.amount)
    : [];

  const highestBid = startupBids[0];
  const myBid = startupBids.find(b => b.team_id === myTeam?.id);
  const isMyBidWinning = highestBid?.team_id === myTeam?.id;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remaining = myTeam ? myTeam.total_budget - (myTeam.spent || 0) : 0;
  const minBid = activeStartup ? (activeStartup.current_price || activeStartup.base_price) + 1 : 0;

  if (!activeStartup) {
    return (
      <div className="min-h-screen bg-[#050814] text-white">
        <div className="container mx-auto px-6 py-8">
          <Link to={createPageUrl("UserDashboard")}>
            <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Gavel className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">No Active Auction</h2>
              <p className="text-gray-500">There's no auction happening right now. Check back soon!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050814] text-white">
      <div className="container mx-auto px-6 py-8">
        <Link to={createPageUrl("UserDashboard")}>
          <Button variant="ghost" className="mb-6 text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Auction Panel */}
          <div className="lg:col-span-2">
            <div className="bg-[#0F1629] rounded-xl border border-lime-500/50 overflow-hidden shadow-[0_0_40px_rgba(132,204,22,0.2)]">
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-lime-500/20 to-[#FF6B35]/20 border-b border-lime-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-lime-400 animate-pulse" />
                    <h1 className="text-2xl font-bold text-white">Live Auction</h1>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${timeLeft < 60 ? 'bg-red-500/20 animate-pulse' : 'bg-[#19388A]/30'}`}>
                      <Timer className={`w-5 h-5 ${timeLeft < 60 ? 'text-red-400' : 'text-[#4F91CD]'}`} />
                      <span className={`text-2xl font-mono font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Startup Details */}
              <div className="p-8 border-b border-[#19388A]/30">
                <div className="flex gap-6">
                  <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center text-5xl font-bold flex-shrink-0">
                    {activeStartup.logo_url ? (
                      <img src={activeStartup.logo_url} alt={activeStartup.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      activeStartup.name?.charAt(0) || "S"
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-white mb-2">{activeStartup.name}</h2>
                    <Badge className="bg-[#4F91CD]/20 text-[#4F91CD] border-[#4F91CD]/30 border mb-3 capitalize">
                      {activeStartup.domain?.replace(/_/g, " ")}
                    </Badge>
                    <p className="text-gray-400">{activeStartup.description}</p>
                  </div>
                </div>

                {/* Price Display */}
                <div className="grid grid-cols-2 gap-6 mt-8">
                  <div className="bg-[#0B1020] rounded-xl p-6 border border-[#19388A]/30">
                    <p className="text-sm text-gray-500 mb-2">Base Price</p>
                    <p className="text-3xl font-bold text-white">₹{activeStartup.base_price}L</p>
                  </div>
                  <div className="bg-[#FF6B35]/10 rounded-xl p-6 border border-[#FF6B35]/50 shadow-[0_0_20px_rgba(255,107,53,0.2)]">
                    <p className="text-sm text-gray-400 mb-2">Current Highest Bid</p>
                    <p className="text-4xl font-bold text-[#FF6B35]">₹{activeStartup.current_price || activeStartup.base_price}L</p>
                    {highestBid && (
                      <p className="text-sm text-gray-400 mt-2">
                        by {teams.find(t => t.id === highestBid.team_id)?.name || "Unknown"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bid Form */}
              <div className="p-8 bg-[#0B1020]">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Target className="w-6 h-6 text-lime-400" />
                  Place Your Bid
                </h3>

                {myTeam ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-[#0F1629] rounded-lg p-4 border border-[#19388A]/30">
                        <p className="text-xs text-gray-500 mb-1">Your Budget</p>
                        <p className="text-2xl font-bold text-lime-400">₹{remaining}L</p>
                        <Progress value={((myTeam.spent || 0) / myTeam.total_budget) * 100} className="h-1 mt-2 bg-[#0B1020]" />
                      </div>
                      <div className="bg-[#0F1629] rounded-lg p-4 border border-[#19388A]/30">
                        <p className="text-xs text-gray-500 mb-1">Minimum Bid</p>
                        <p className="text-2xl font-bold text-[#4F91CD]">₹{minBid}L</p>
                        <p className="text-xs text-gray-500 mt-2">+₹1L from current</p>
                      </div>
                    </div>

                    {isMyBidWinning && (
                      <div className="bg-lime-500/10 border border-lime-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-lime-400 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-lime-400">You're Leading!</p>
                          <p className="text-sm text-gray-400">Your bid of ₹{myBid?.amount}L is currently the highest</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={`Enter amount (min ₹${minBid}L)`}
                          className="bg-[#0F1629] border-[#19388A]/50 text-white h-14 text-xl"
                          disabled={isSubmitting}
                        />
                      </div>
                      <Button 
                        onClick={handlePlaceBid}
                        disabled={isSubmitting || !bidAmount || parseFloat(bidAmount) < minBid}
                        className="bg-lime-500 hover:bg-lime-600 text-black font-bold h-14 px-8 text-lg"
                      >
                        <Send className="w-5 h-5 mr-2" />
                        {isSubmitting ? "Submitting..." : "Place Bid"}
                      </Button>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBidAmount(minBid.toString())}
                        className="border-[#19388A]/50 text-gray-400 hover:text-white hover:bg-[#19388A]/20"
                      >
                        Min: ₹{minBid}L
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBidAmount((minBid + 5).toString())}
                        className="border-[#19388A]/50 text-gray-400 hover:text-white hover:bg-[#19388A]/20"
                      >
                        +₹5L
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBidAmount((minBid + 10).toString())}
                        className="border-[#19388A]/50 text-gray-400 hover:text-white hover:bg-[#19388A]/20"
                      >
                        +₹10L
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <p className="text-gray-400">You need to be part of a team to bid</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Bid History */}
            <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden">
              <div className="p-4 border-b border-[#19388A]/30">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#FF6B35]" />
                  Bid History
                </h3>
              </div>
              <div className="divide-y divide-[#19388A]/20 max-h-[500px] overflow-y-auto">
                {startupBids.map((bid, index) => {
                  const team = teams.find(t => t.id === bid.team_id);
                  const isWinning = index === 0;
                  const isMyBid = bid.team_id === myTeam?.id;
                  
                  return (
                    <div 
                      key={bid.id}
                      className={`p-4 ${isWinning ? 'bg-lime-500/10' : ''} ${isMyBid ? 'border-l-4 border-[#4F91CD]' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center text-sm font-bold">
                            {team?.name?.charAt(0) || "T"}
                          </div>
                          <div>
                            <p className={`font-semibold ${isMyBid ? 'text-[#4F91CD]' : 'text-white'}`}>
                              {isMyBid ? "You" : team?.name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(bid.created_date), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${isWinning ? 'text-lime-400' : 'text-[#FF6B35]'}`}>
                            ₹{bid.amount}L
                          </p>
                          {isWinning && (
                            <Badge className="bg-lime-500/20 text-lime-400 border-0 text-xs">
                              Leading
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {startupBids.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <p>No bids yet</p>
                    <p className="text-sm mt-1">Be the first to bid!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Teams */}
            <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden">
              <div className="p-4 border-b border-[#19388A]/30">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#4F91CD]" />
                  Active Teams
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {teams.filter(t => t.is_online).map(team => (
                  <div key={team.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#0B1020]">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center text-xs font-bold">
                      {team.name?.charAt(0) || "T"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{team.name}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-lime-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}