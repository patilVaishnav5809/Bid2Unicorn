import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Zap, TrendingUp, Radio, AlertCircle, Users, TrendingUp as GrowthIcon, ShieldAlert } from 'lucide-react';

const ScreenDashboard = () => {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  // Auto-refresh queries
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
    refetchInterval: 5000,
  });

  const { data: startups = [] } = useQuery({
    queryKey: ["startups"],
    queryFn: () => base44.entities.Startup.list(),
    refetchInterval: 5000,
  });

  const { data: activeCards = [] } = useQuery({
    queryKey: ['power_cards', 'active'],
    queryFn: async () => {
      const cards = await base44.entities.PowerCard.list('-created_at');
      return cards.filter(c => c.status === 'active').slice(0, 3);
    },
    refetchInterval: 3000,
  });

  const { data: breakingNews = [] } = useQuery({
    queryKey: ['breaking_news'],
    queryFn: () => base44.entities.BreakingNews.list('-created_at', 5),
    refetchInterval: 10000,
  });

  const { data: auctionSettings } = useQuery({
    queryKey: ['auction_settings'],
    queryFn: async () => {
      const settings = await base44.entities.AuctionSettings.list();
      return settings[0] || {};
    },
    refetchInterval: 5000,
  });

  const { data: activeStartup } = useQuery({
    queryKey: ['startup', auctionSettings?.current_startup_id],
    queryFn: () => auctionSettings?.current_startup_id 
      ? base44.entities.Startup.get(auctionSettings.current_startup_id)
      : null,
    enabled: !!auctionSettings?.current_startup_id,
    refetchInterval: 3000,
  });

  const { data: highestBid } = useQuery({
    queryKey: ['highest_bid', auctionSettings?.current_startup_id],
    queryFn: async () => {
       if (!auctionSettings?.current_startup_id) return null;
       const bids = await base44.entities.Bid.list('-amount');
       return bids.find(b => b.startup_id === auctionSettings.current_startup_id);
    },
    enabled: !!auctionSettings?.current_startup_id,
    refetchInterval: 2000,
  });

  // Rotate news
  useEffect(() => {
    if (breakingNews.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentNewsIndex(prev => (prev + 1) % breakingNews.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [breakingNews.length]);

  return (
    <div className="min-h-screen bg-[#050814] text-white p-6 flex flex-col overflow-hidden relative font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#0A1628]/50 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="flex justify-between items-center mb-6 relative z-10 border-b border-[#1E3A5F] pb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Bid2Unicorn
            </h1>
            <p className="text-lg text-blue-300 font-medium tracking-widest uppercase">Live Arena Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-[#0F1A2E]/80 backdrop-blur-md px-6 py-3 rounded-full border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
          <Radio className="w-5 h-5 text-red-500 animate-pulse" />
          <span className="text-red-400 font-bold tracking-widest uppercase text-sm">Live Broadcast</span>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-12 gap-6 relative z-10">
        
        {/* Left Column: Leaderboard */}
        <div className="col-span-3 flex flex-col gap-6">
          <Card className="bg-[#0F1A2E]/80 border-[#1E3A5F] backdrop-blur-md shadow-xl flex-1 flex flex-col">
            <CardHeader className="border-b border-[#1E3A5F] pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Live Standings
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 overflow-hidden flex flex-col gap-3">
              {(() => {
                const teamsWithValues = teams.map(team => {
                  const teamStartups = startups.filter(s => s.winning_team_id === team.id);
                  const portfolioValue = teamStartups.reduce((sum, s) => sum + (s.current_price || s.base_price || 0), 0);
                  const remaining = (team.total_budget || 0) - (team.spent || 0);
                  const totalValue = portfolioValue + remaining;
                  return { ...team, portfolioValue, remaining, totalValue };
                }).sort((a, b) => b.totalValue - a.totalValue).slice(0, 10);

                if (teamsWithValues.length === 0) {
                  return (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                      Waiting for teams...
                    </div>
                  );
                }

                return teamsWithValues.map((team, index) => (
                  <div 
                    key={team.id} 
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : 
                      index === 1 ? 'bg-gradient-to-r from-slate-300/10 to-transparent border-slate-300/30' :
                      index === 2 ? 'bg-gradient-to-r from-amber-600/10 to-transparent border-amber-600/30' :
                      'bg-[#0A1628] border-[#1E3A5F]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-black text-lg ${
                        index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-500'
                      }`}>
                        #{index + 1}
                      </span>
                      <span className="font-bold text-white max-w-[120px] truncate">{team.name}</span>
                    </div>
                    <span className="font-mono text-green-400 font-bold">
                      ₹{team.totalValue}L
                    </span>
                  </div>
                ));
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Center Column: Active Auction & News */}
        <div className="col-span-6 flex flex-col gap-6">
          
          {/* Active Startup Focus */}
          <Card className="flex-1 bg-gradient-to-b from-[#0F1A2E]/90 to-[#050814]/90 border border-blue-500/30 backdrop-blur-xl shadow-[0_0_50px_rgba(59,130,246,0.1)] relative overflow-hidden">
             {/* Fancy corners */}
             <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-blue-500/50 rounded-tl-xl mx-2 my-2" />
             <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-blue-500/50 rounded-tr-xl mx-2 my-2" />
             <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-blue-500/50 rounded-bl-xl mx-2 my-2" />
             <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-blue-500/50 rounded-br-xl mx-2 my-2" />

             {activeStartup ? (
                <div className="h-full flex flex-col p-8">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 font-bold text-sm uppercase tracking-widest mb-6">
                      On The Block
                    </div>
                    {activeStartup.logo_url && (
                        <div className="flex justify-center mb-6">
                            <img 
                                src={activeStartup.logo_url} 
                                alt={activeStartup.name} 
                                className="w-32 h-32 rounded-2xl object-cover border-4 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)] mix-blend-lighten"
                            />
                        </div>
                    )}
                    <h2 className="text-6xl font-black text-white tracking-tight mb-2 drop-shadow-lg">
                      {activeStartup.name}
                    </h2>
                    <p className="text-2xl text-blue-300 font-medium mb-4">
                      {activeStartup.domain?.replace(/_/g, " ") || activeStartup.sector}
                    </p>
                    {activeStartup.description && (
                      <p className="text-lg text-slate-400 max-w-3xl mx-auto mb-2 leading-relaxed italic line-clamp-3">
                        "{activeStartup.description}"
                      </p>
                    )}


                    {/* New Metrics Row */}
                    {(activeStartup.users || activeStartup.growth || activeStartup.risk) && (
                      <div className="flex justify-center gap-6 mt-4">
                        {activeStartup.users && (
                          <div className="flex items-center gap-2 bg-[#0A1628]/80 border border-blue-500/30 px-4 py-2 rounded-xl backdrop-blur-md">
                            <Users className="w-5 h-5 text-blue-400" />
                            <div className="text-left">
                               <p className="text-[10px] text-blue-300/70 uppercase tracking-widest font-bold">Users</p>
                               <p className="text-sm font-bold text-white leading-none">{activeStartup.users}</p>
                            </div>
                          </div>
                        )}
                        {activeStartup.growth && (
                          <div className="flex items-center gap-2 bg-[#0A1628]/80 border border-green-500/30 px-4 py-2 rounded-xl backdrop-blur-md">
                            <GrowthIcon className="w-5 h-5 text-green-400" />
                            <div className="text-left">
                               <p className="text-[10px] text-green-300/70 uppercase tracking-widest font-bold">Growth</p>
                               <p className="text-sm font-bold text-white leading-none">{activeStartup.growth}</p>
                            </div>
                          </div>
                        )}
                        {activeStartup.risk && (
                          <div className={`flex items-center gap-2 bg-[#0A1628]/80 border px-4 py-2 rounded-xl backdrop-blur-md ${
                              activeStartup.risk.toLowerCase() === 'high' ? 'border-red-500/30' : 
                              activeStartup.risk.toLowerCase() === 'medium' ? 'border-yellow-500/30' : 
                              'border-emerald-500/30'
                            }`}>
                            <ShieldAlert className={`w-5 h-5 ${
                              activeStartup.risk.toLowerCase() === 'high' ? 'text-red-400' : 
                              activeStartup.risk.toLowerCase() === 'medium' ? 'text-yellow-400' : 
                              'text-emerald-400'
                            }`} />
                            <div className="text-left">
                               <p className={`text-[10px] uppercase tracking-widest font-bold ${
                                 activeStartup.risk.toLowerCase() === 'high' ? 'text-red-300/70' : 
                                 activeStartup.risk.toLowerCase() === 'medium' ? 'text-yellow-300/70' : 
                                 'text-emerald-300/70'
                               }`}>Risk</p>
                               <p className="text-sm font-bold text-white leading-none">{activeStartup.risk}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center gap-8">
                      {highestBid ? (
                          <div className="flex flex-col items-center animate-in zoom-in duration-500">
                            <span className="text-slate-400 text-lg uppercase tracking-widest font-bold mb-2">Current Highest Bid</span>
                            <span className="text-7xl font-black text-green-400 font-mono drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]">
                               ₹{highestBid.amount}L
                            </span>
                            <div className="mt-4 px-6 py-2 bg-blue-900/40 rounded-full border border-blue-500/30">
                              <span className="text-white text-xl">
                                by <span className="font-bold text-blue-300">{highestBid.teams?.name || 'A Team'}</span>
                              </span>
                            </div>
                         </div>
                      ) : (
                         <div className="flex flex-col items-center opacity-80">
                            <span className="text-slate-400 text-lg uppercase tracking-widest font-bold mb-2">Base Pitch Value</span>
                            <span className="text-6xl font-black text-slate-200 font-mono">
                               ₹{activeStartup.base_price || 0}L
                            </span>
                            <span className="mt-4 text-blue-400 text-xl animate-pulse">Waiting for bids...</span>
                         </div>
                      )}
                  </div>
                </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <div className="w-24 h-24 rounded-full bg-[#0A1628] border border-[#1E3A5F] flex items-center justify-center mb-4">
                     <TrendingUp className="w-10 h-10 text-slate-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-400">No Active Auction</p>
                  <p className="text-slate-500">Waiting for Admin to start the next round...</p>
                </div>
             )}
          </Card>

          {/* Breaking News Ticker */}
          <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4 flex items-center gap-4 overflow-hidden relative backdrop-blur-md">
            <div className="flex-shrink-0 bg-red-600 text-white px-4 py-1 rounded text-sm font-black uppercase tracking-widest animate-pulse flex items-center gap-2 z-10">
              <AlertCircle className="w-4 h-4" />
              Breaking News
            </div>
            <div className="flex-1 relative h-6 overflow-hidden">
               {breakingNews.length > 0 ? (
                 <div key={currentNewsIndex} className="absolute inset-0 flex items-center animate-in slide-in-from-bottom-6 fade-in duration-500">
                   <p className="text-red-100 text-lg font-medium whitespace-nowrap truncate">
                     {breakingNews[currentNewsIndex].title}: <span className="text-red-300/80">{breakingNews[currentNewsIndex].content}</span>
                   </p>
                 </div>
               ) : (
                 <div className="absolute inset-0 flex items-center text-red-900 font-medium">
                   No breaking news at this time.
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Right Column: Power Cards */}
        <div className="col-span-3 flex flex-col gap-6">
          <Card className="bg-[#0F1A2E]/80 border-[#1E3A5F] backdrop-blur-md shadow-xl flex-1 flex flex-col">
            <CardHeader className="border-b border-[#1E3A5F] pb-3">
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-white">
                <Zap className="w-5 h-5 text-purple-400" />
                Active Power Cards
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 overflow-hidden flex flex-col gap-4">
               {activeCards.length > 0 ? activeCards.map(card => (
                  <div key={card.id} className="bg-gradient-to-r from-purple-900/30 to-[#0A1628] border border-purple-500/30 rounded-xl p-4 relative overflow-hidden group">
                     <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
                     <div className="absolute top-2 right-2">
                        <Zap className="w-6 h-6 text-purple-400/20 group-hover:text-purple-400/40 transition-colors" />
                     </div>
                     <span className="text-xs uppercase tracking-widest text-purple-300 font-bold mb-1 block">
                       {card.teams?.name || 'A Team'} Played
                     </span>
                     <h3 className="text-lg font-black text-white mb-2">{card.title}</h3>
                     <p className="text-sm text-purple-200/70 leading-snug">
                       {card.description}
                     </p>
                  </div>
               )) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
                    <Zap className="w-8 h-8 text-slate-600 opacity-50" />
                    <p>No power cards in play.</p>
                  </div>
               )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default ScreenDashboard;
