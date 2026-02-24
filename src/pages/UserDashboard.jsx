import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext"; // Import useAuth
import AuctionHeader from "../components/auction/AuctionHeader";
import ActiveStartupCard from "../components/auction/ActiveStartupCard";
import LiveBiddingPanel from "../components/auction/LiveBiddingPanel";
import TeamsLeaderboard from "../components/auction/TeamsLeaderboard";
import MyTeamSection from "../components/auction/MyTeamSection";
import MyTeamWallet from "../components/auction/MyTeamWallet";
import MyStartups from "../components/auction/MyStartups";
import PowerCardsStrip from "../components/auction/PowerCardsStrip";
import { AlertTriangle } from "lucide-react";

export default function UserDashboard() {
  const queryClient = useQueryClient();
  const { user, isLoadingAuth } = useAuth(); // Use useAuth
  const [myTeam, setMyTeam] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showPowerCards, setShowPowerCards] = useState(false);

  // Power Cards — read from activity_logs (same source the admin writes to)
  const { data: powerCardUsageLogs = [] } = useQuery({
    queryKey: ["myPowerCards", myTeam?.id],
    queryFn: async () => {
      if (!myTeam) return [];
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('type', 'power_card')
        .eq('team_id', myTeam.id)
        .like('message', '[CARD_USED:%');
      if (error) throw error;
      return data || [];
    },
    enabled: !!myTeam,
    refetchInterval: 5000, // Poll every 5s for real-time sync with admin
  });

  // Parse which card types have been used by this team
  const usedCardTypes = powerCardUsageLogs.map(log => {
    const match = log.message?.match(/\[CARD_USED:([^\]]+)\]/);
    return match ? match[1] : null;
  }).filter(Boolean);

  // Fetch allotted cards for this team
  const { data: allottedCards = [] } = useQuery({
    queryKey: ["allottedCards", myTeam?.id],
    queryFn: async () => {
      if (!myTeam) return [];
      const { data, error } = await supabase
        .from('power_cards')
        .select('*')
        .eq('team_id', myTeam.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!myTeam,
    refetchInterval: 10000,
  });

  const POWER_CARDS_CONSTANTS = [
    { id: "double_value", name: "Double Value", icon: "2️⃣", description: "2x Startups value in final scoring. Cost remains same." },
    { id: "steal_startup", name: "Steal Startup", icon: "🦹", description: "Pay 80% to steal a startup won by another team within 10s." },
    { id: "freeze_budget", name: "Freeze Budget", icon: "❄️", description: "One team cannot bid on the next startup." },
    { id: "emergency_budget", name: "Emergency Budget", icon: "💰", description: "Instantly add ₹20M to your total budget." },
    { id: "reverse_auction", name: "Reverse Auction", icon: "🔄", description: "Lowest bid wins instead of highest for one startup." },
    { id: "block_team", name: "Block Team", icon: "🚫", description: "Reserve a specific startup (Coming Soon) so one team can't bid." },
    { id: "insider_info", name: "Insider Info", icon: "🕵️", description: "Peek at next 3 startup stats before Round 2." },
    { id: "wild_card", name: "Wild Card", icon: "🃏", description: "Design your own power (Free startup, Swap, etc.) - Must announce." },
  ];

  // Filter constants based on allottedCards
  const allottedConstants = POWER_CARDS_CONSTANTS.filter(pc => 
    allottedCards.some(a => a.type === pc.id)
  );

  const powerCards = allottedConstants.map(pc => ({
      ...pc,
      used: usedCardTypes.includes(pc.id),
      status: usedCardTypes.includes(pc.id) ? 'used' : 'available',
  }));

  const handleUsePowerCard = async (card) => {
    if (card.status === 'used' || card.status === 'disabled') {
       alert("This card is not available.");
       return;
    }

    if (!myTeam) {
        alert("Team data not loaded yet.");
        return;
    }

    // Since we don't have a loading state variable here per card, we just execute
    try {
      // Record card usage in activity_logs
      // Admin dashboard will listen to this and update UI
      const { error } = await supabase.from('activity_logs').insert({
          team_id: myTeam.id,
          team_name: myTeam.name,
          type: 'power_card',
          message: `[CARD_USED:${card.id}] ${card.name} activated for ${myTeam.name}`
      });

      if (error) throw error;
      
      // Instantly refresh the local UI
      await queryClient.invalidateQueries({ queryKey: ["myPowerCards", myTeam.id] });
      alert(`${card.name} activated successfully!`);
    } catch (error) {
      console.error("Error using power card:", error);
      alert("Failed to use power card.");
    }
  };

  // Load Team based on Authenticated User
  useEffect(() => {
    const loadTeam = async () => {
      if (!user) return; // Wait for user

      try {
        const teams = await base44.entities.Team.list();
        // Since Admins create the teams, 'created_by' is always 'admin'.
        // The definitive link for a user to their team is their email matching the team's 'leader_email'.
        const team = teams.find(t => t.leader_email === user.email || (t.participants && t.participants.some(p => p.email === user.email)));
        setMyTeam(team);
      } catch (error) {
        console.error("Error loading team:", error);
      }
    };
    
    loadTeam();
  }, [user]); // Dependency on user

  // Fetch Data
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

  // Derived Data
  const settings = settingsArr[0];
  const activeStartup = startups.find(s => s.id === settings?.active_startup_id);
  
  // Real-time Timer
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

  // Real-time Subscriptions
  useEffect(() => {
    const unsubscribeBid = base44.entities.Bid.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["startups"] });
    });
    const unsubscribeStartup = base44.entities.Startup.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ["startups"] });
    });
    const unsubscribeSettings = base44.entities.AuctionSettings.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ["settings"] });
    });
    const unsubscribeTeam = base44.entities.Team.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ["teams"] });
    });

    return () => {
        unsubscribeBid();
        unsubscribeStartup();
        unsubscribeSettings();
        unsubscribeTeam();
    };
  }, [queryClient]);

  // Calculations
  const myStartups = myTeam ? startups.filter(s => s.winning_team_id === myTeam.id) : [];
  
  const startupBids = activeStartup 
    ? bids.filter(b => b.startup_id === activeStartup.id).sort((a, b) => b.amount - a.amount)
    : [];
  
  const currentBidIncrement = Number(settings?.current_bid_increment || 1);

  const highestBid = startupBids[0] ? {
    amount: Number(startupBids[0].amount),
    team: teams.find(t => t.id === startupBids[0].team_id)?.name || "Unknown",
    minNext: currentBidIncrement
  } : {
    amount: activeStartup ? Number(activeStartup.base_price || 0) : 0,
    team: "No Bids",
    minNext: currentBidIncrement
  };

  const currentBidData = {
    amount: highestBid.amount,
    team: highestBid.team,
    minNext: currentBidIncrement
  };

  const formattedBidHistory = startupBids.slice(0, 5).map(bid => ({
    team: teams.find(t => t.id === bid.team_id)?.name || "Unknown",
    amount: bid.amount,
    time: "Just now" // Simplified for display
  }));

  const TeamsWithPortfolio = teams.map(team => {
      const teamStartups = startups.filter(s => s.winning_team_id === team.id);
      const portfolioValue = teamStartups.reduce((sum, s) => sum + (s.current_price || s.base_price), 0);
      return {
          ...team,
          portfolio: portfolioValue,
          remaining: team.total_budget - (team.spent || 0),
          startups: teamStartups.length
      };
  });

  const myTeamData = myTeam ? {
      name: myTeam.name,
      avatar: myTeam.name.charAt(0),
      members: myTeam.participants || [], // Use participants saved by Admin
      totalBudget: myTeam.total_budget,
      spent: myTeam.spent || 0,
      remaining: myTeam.total_budget - (myTeam.spent || 0)
  } : null;

  const formattedMyStartups = myStartups.map(s => ({
      name: s.name,
      category: s.domain,
      price: s.current_price || s.base_price
  }));

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Bidding Logic
  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, any>} */
  const createBid = useMutation({
    mutationFn: (data) => base44.entities.Bid.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["startups"] });
    },
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateStartup = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Startup.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startups"] }),
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, any>} */
  const createLog = useMutation({
    mutationFn: (data) => base44.entities.ActivityLog.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["logs"] }),
  });

  const handlePlaceBid = async () => {
    if (!myTeam || !activeStartup) return;
    
    // Calculate next bid amount (Current Highest + Increment)
    const currentHighest = Number(highestBid.amount); 
    const isFirstBid = startupBids.length === 0;
    const bidAmount = isFirstBid ? (Number(activeStartup.base_price) + currentBidIncrement) : (currentHighest + currentBidIncrement);

    const remaining = myTeam.total_budget - (myTeam.spent || 0);
    if (bidAmount > remaining) {
      alert(`You only have ₹${remaining}L available`);
      return;
    }

    try {
        await createBid.mutateAsync({
            startup_id: activeStartup.id,
            team_id: myTeam.id,
            amount: bidAmount,
            round: settings?.current_round || 1,
            is_winning: false
        });

        await updateStartup.mutateAsync({
            id: activeStartup.id,
            data: { current_price: bidAmount }
        });

        await createLog.mutateAsync({
            type: "bid",
            message: `${myTeam.name} placed a bid of ₹${bidAmount}L on ${activeStartup.name}`,
            team_id: myTeam.id,
            startup_id: activeStartup.id,
            amount: bidAmount
        });
    } catch (e) {
        console.error("Bid failed", e);
    }
  };



  if (isLoadingAuth) {
      return <div className="min-h-screen bg-[#050814] text-white flex items-center justify-center">Loading Authentication...</div>;
  }

  if (!user) {
       return <div className="min-h-screen bg-[#050814] text-white flex items-center justify-center">Please Log In</div>;
  }

  if (!myTeam) {
       return <div className="min-h-screen bg-[#050814] text-white flex items-center justify-center">Loading Team Data...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#000000] text-gray-200 overflow-hidden font-sans">
      {/* Cinematic Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[30rem] h-[30rem] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[25rem] h-[25rem] bg-yellow-600/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-[20rem] h-[20rem] bg-orange-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <AuctionHeader 
          timeLeft={formatTime(timeLeft)} 
          currentStartup={activeStartup ? `${activeStartup.order || '?'}` : "-"} 
          totalStartups={startups.length} 
        />

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-12 gap-3 p-3 pb-2 overflow-hidden">
          {/* Left Column */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
             {myTeamData && <MyTeamSection team={myTeamData} />}
             {myTeamData && (
                <MyTeamWallet 
                totalBudget={myTeamData.totalBudget} 
                spent={myTeamData.spent} 
                remaining={myTeamData.remaining} 
                />
            )}
            <MyStartups startups={formattedMyStartups} />
          </div>

          {/* Center Column - Merged Card */}
          <div className="col-span-12 lg:col-span-5 flex flex-col h-full">
            <div className="flex-1 bg-[#0F1629] border border-[#19388A]/30 rounded-xl overflow-hidden flex flex-col shadow-2xl relative">
              {/* Background gradient for the merged card */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#19388A]/5 to-transparent pointer-events-none" />
              
              <div className="p-1 flex-1 relative">
                 {activeStartup ? (
                       <ActiveStartupCard 
                        startup={{
                           id: activeStartup.id,
                           name: activeStartup.name,
                           logo: activeStartup.logo_url,
                           description: activeStartup.description,
                           category: activeStartup.domain,
                           basePrice: activeStartup.base_price,
                           users: activeStartup.users,
                           growth: activeStartup.growth,
                           risk: activeStartup.risk 
                        }} 
                        className="border-none shadow-none bg-transparent h-full" 
                      />
                 ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <AlertTriangle className="w-12 h-12 mb-4 text-yellow-500" />
                        <p>No Active Auction</p>
                    </div>
                 )}
              </div>
              
              <div className="bg-[#050814]/30 backdrop-blur-sm border-t border-[#19388A]/30">
                 {activeStartup && (
                     <LiveBiddingPanel 
                        currentBid={currentBidData}
                        bidHistory={formattedBidHistory}
                        onPlaceBid={handlePlaceBid}
                        myTeamName={myTeam?.name}
                        className="border-none shadow-none bg-transparent"
                    />
                 )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-12 lg:col-span-4">
            <TeamsLeaderboard teams={TeamsWithPortfolio} myTeamName={myTeam?.name} />
          </div>
        </div>

        {/* Power Cards Toggle Button */}
        <motion.button
          onClick={() => setShowPowerCards(!showPowerCards)}
          className="fixed bottom-20 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 via-amber-600 to-yellow-700 text-black border border-yellow-400/50 flex items-center justify-center shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-shadow"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.span 
            className="text-3xl font-bold"
            animate={{ rotate: showPowerCards ? 180 : 0 }}
          >
            ⚡
          </motion.span>
        </motion.button>

        {/* Power Cards Strip */}
        <PowerCardsStrip 
          cards={powerCards} 
          onUseCard={handleUsePowerCard}
          isVisible={showPowerCards}
          onClose={() => setShowPowerCards(false)}
        />
      </div>
    </div>
  );
}
