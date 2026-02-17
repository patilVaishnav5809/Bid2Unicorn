import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { Rocket, Users, Gavel, Zap, Newspaper, DollarSign } from "lucide-react";

import TopBar from "../components/admin/TopBar";
import StatCard from "../components/admin/StatCard";
import AuctionControlPanel from "../components/admin/AuctionControlPanel";
import TeamsWalletTable from "../components/admin/TeamsWalletTable";
import PowerCardsPanel from "../components/admin/PowerCardsPanel";
import BreakingNewsPanel from "../components/admin/BreakingNewsPanel";
import LeaderboardPanel from "../components/admin/LeaderboardPanel";
import ActivityFeed from "../components/admin/ActivityFeed";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [walletDialog, setWalletDialog] = useState({ open: false, team: null });
  const [walletAmount, setWalletAmount] = useState("");
  
  // Add Team State
  const [addTeamDialog, setAddTeamDialog] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", budget: "500", logo: "" });
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await base44.auth.me();
        if (user.role !== "admin") {
          // Not admin, redirect to user dashboard
          window.location.href = "/UserDashboard";
        }
      } catch {
        // Not logged in, redirect to login
        base44.auth.redirectToLogin();
      }
    };
    checkAdmin();
  }, []);

  // Fetch all data
  const { data: startups = [] } = useQuery({
    queryKey: ["startups"],
    queryFn: () => base44.entities.Startup.list("-created_date"),
  });

  const { data: teams = [], refetch: refetchTeams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
        // Try fetching from Supabase first
        const { data, error } = await supabase.from('teams').select('*').order('name');
        if (!error && data && data.length > 0) {
            return data.map(t => ({
                id: t.id,
                name: t.name,
                total_budget: t.total_budget || t.budget || 500,
                spent: t.spent || 0,
                logo_url: t.logo_url,
                is_online: false // Supabase doesn't track this yet
            }));
        }
        // Fallback to mock
        return base44.entities.Team.list();
    },
  });

  const { data: bids = [] } = useQuery({
    queryKey: ["bids"],
    queryFn: () => base44.entities.Bid.list("-created_date"),
  });

  const { data: powerCards = [] } = useQuery({
    queryKey: ["powerCards"],
    queryFn: () => base44.entities.PowerCard.list(),
  });

  const { data: news = [] } = useQuery({
    queryKey: ["news"],
    queryFn: () => base44.entities.BreakingNews.list("-created_date"),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["logs"],
    queryFn: () => base44.entities.ActivityLog.list("-created_date", 50),
  });

  const { data: settingsArr = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AuctionSettings.list(),
  });

  const settings = settingsArr[0];
  const activeStartup = startups.find(s => s.id === settings?.active_startup_id);
  const teamsOnline = teams.filter(t => t.is_online).length;
  const highestBid = activeStartup 
    ? bids.filter(b => b.startup_id === activeStartup.id).sort((a, b) => b.amount - a.amount)[0]
    : null;

  // Mutations
  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, any>} */
  const createBid = useMutation({
    mutationFn: (data) => base44.entities.Bid.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bids"] }),
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateStartup = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Startup.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["startups"] }),
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateTeam = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Team.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teams"] }),
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, any>} */
  const createNews = useMutation({
    mutationFn: (data) => base44.entities.BreakingNews.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["news"] }),
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updatePowerCard = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PowerCard.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["powerCards"] }),
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, any>} */
  const createLog = useMutation({
    mutationFn: (data) => base44.entities.ActivityLog.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["logs"] }),
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateLog = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ActivityLog.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["logs"] }),
  });

  // Handlers
  const handleBidSubmit = async (teamId, amount) => {
    if (!activeStartup) return;

    await createBid.mutateAsync({
      startup_id: activeStartup.id,
      team_id: teamId,
      amount,
      round: settings?.current_round || 1
    });

    await updateStartup.mutateAsync({
      id: activeStartup.id,
      data: { current_price: amount }
    });

    const team = teams.find(t => t.id === teamId);
    await createLog.mutateAsync({
      type: "bid",
      message: `${team?.name || "Team"} placed a bid of ₹${amount}L on ${activeStartup.name}`,
      team_id: teamId,
      startup_id: activeStartup.id,
      amount
    });
  };

  const handleStatusChange = async (startupId, status, winningTeamId, amount) => {
    await updateStartup.mutateAsync({
      id: startupId,
      data: { status, winning_team_id: winningTeamId }
    });

    if (status === "sold" && winningTeamId && amount) {
      const team = teams.find(t => t.id === winningTeamId);
      await updateTeam.mutateAsync({
        id: winningTeamId,
        data: { spent: (team?.spent || 0) + amount }
      });

      const startup = startups.find(s => s.id === startupId);
      await createLog.mutateAsync({
        type: "sale",
        message: `${startup?.name} sold to ${team?.name} for ₹${amount}L`,
        team_id: winningTeamId,
        startup_id: startupId,
        amount
      });
    }
  };

  const handleEditWallet = (team) => {
    setWalletDialog({ open: true, team });
    setWalletAmount(team.total_budget.toString());
  };

  const handleSaveWallet = async () => {
    if (!walletDialog.team) return;
    
    await updateTeam.mutateAsync({
      id: walletDialog.team.id,
      data: { total_budget: parseFloat(walletAmount) }
    });

    await createLog.mutateAsync({
      type: "wallet",
      message: `${walletDialog.team.name}'s budget updated to ₹${walletAmount}L`,
      team_id: walletDialog.team.id,
      amount: parseFloat(walletAmount)
    });

    setWalletDialog({ open: false, team: null });
  };

  const handleTogglePowerCard = async (card) => {
    const newStatus = card.status === "disabled" ? "available" : "disabled";
    await updatePowerCard.mutateAsync({
      id: card.id,
      data: { status: newStatus }
    });

    await createLog.mutateAsync({
      type: "power_card",
      message: `Power card "${card.name}" ${newStatus === "disabled" ? "disabled" : "activated"}`,
    });
  };

  const handleAnnounceNews = async (data) => {
    await createNews.mutateAsync({
      ...data,
      status: "announced"
    });

    await createLog.mutateAsync({
      type: "news",
      message: `Breaking News: ${data.title}`,
    });
  };

  const handleResolveLog = async (logId) => {
    await updateLog.mutateAsync({
      id: logId,
      data: { is_resolved: true }
    });
  };

  const handleCreateTeam = async () => {
      if (!newTeam.name) return;
      setIsCreatingTeam(true);
      try {
          const { error } = await supabase.from('teams').insert({
              name: newTeam.name,
              total_budget: parseFloat(newTeam.budget),
              logo_url: newTeam.logo,
              spent: 0
          });
          
          if (error) throw error;
          
          await refetchTeams();
          setAddTeamDialog(false);
          setNewTeam({ name: "", budget: "500", logo: "" });
          // Log it
          await createLog.mutateAsync({
              type: "admin",
              message: `New team "${newTeam.name}" added to the auction`,
          });
      } catch (error) {
          console.error("Error creating team:", error);
          alert("Failed to create team. Check console for details.");
      } finally {
          setIsCreatingTeam(false);
      }
  };

  // Stats
  const pendingNews = news.filter(n => n.status !== "announced").length;
  const usedCards = powerCards.filter(c => c.status === "used" || c.status === "active").length;
  const soldStartups = startups.filter(s => s.status === "sold").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        settings={settings}
        activeStartup={activeStartup}
        teamsOnline={teamsOnline}
        totalBids={bids.length}
      />

      <main className="flex-1 overflow-auto p-6 bg-[#050814]">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <StatCard 
            title="Active Startup" 
            value={activeStartup?.name || "None"} 
            icon={Rocket} 
            color="blue" 
          />
          <StatCard 
            title="Teams Online" 
            value={teamsOnline} 
            icon={Users} 
            color="lime" 
          />
          <StatCard 
            title="Total Bids" 
            value={bids.length} 
            icon={Gavel} 
            color="orange" 
          />
          <StatCard 
            title="Power Cards Used" 
            value={`${usedCards}/${powerCards.length}`} 
            icon={Zap} 
            color="purple" 
          />
          <StatCard 
            title="News Pending" 
            value={pendingNews} 
            icon={Newspaper} 
            color="orange" 
          />
          <StatCard 
            title="Startups Sold" 
            value={`${soldStartups}/${startups.length}`} 
            icon={DollarSign} 
            color="lime" 
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <AuctionControlPanel
              activeStartup={activeStartup}
              teams={teams}
              highestBid={highestBid}
              onBidSubmit={handleBidSubmit}
              onStatusChange={handleStatusChange}
            />
            <PowerCardsPanel
              powerCards={powerCards}
              teams={teams}
              onToggleCard={handleTogglePowerCard}
            />
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            <TeamsWalletTable
              teams={teams}
              startups={startups}
              onEditWallet={handleEditWallet}
              onAddTeam={() => setAddTeamDialog(true)}
            />
            <BreakingNewsPanel
              news={news}
              onAnnounce={handleAnnounceNews}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <LeaderboardPanel
              teams={teams}
              startups={startups}
            />
            <ActivityFeed
              logs={logs}
              onResolve={handleResolveLog}
            />
          </div>
        </div>
      </main>

      {/* Wallet Edit Dialog */}
      <Dialog open={walletDialog.open} onOpenChange={(open) => setWalletDialog({ ...walletDialog, open })}>
        <DialogContent className="bg-[#0F1629] border-[#19388A]/50 text-white">
          <DialogHeader>
            <DialogTitle>Edit {walletDialog.team?.name}'s Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-gray-400">Total Budget (in Lakhs)</Label>
              <Input
                type="number"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setWalletDialog({ open: false, team: null })}
                className="border-[#19388A]/50 text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveWallet}
                className="bg-[#19388A] hover:bg-[#19388A]/80"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add Team Dialog */}
      <Dialog open={addTeamDialog} onOpenChange={setAddTeamDialog}>
        <DialogContent className="bg-[#0F1629] border-[#19388A]/50 text-white">
          <DialogHeader>
            <DialogTitle>Add New Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-gray-400">Team Name</Label>
              <Input
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="e.g. Alpha Ventures"
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-400">Total Budget (Lakhs)</Label>
              <Input
                type="number"
                value={newTeam.budget}
                onChange={(e) => setNewTeam({ ...newTeam, budget: e.target.value })}
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-400">Logo URL (Optional)</Label>
              <Input
                value={newTeam.logo}
                onChange={(e) => setNewTeam({ ...newTeam, logo: e.target.value })}
                placeholder="https://..."
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setAddTeamDialog(false)}
                className="border-[#19388A]/50 text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTeam}
                disabled={isCreatingTeam || !newTeam.name}
                className="bg-[#19388A] hover:bg-[#19388A]/80"
              >
                {isCreatingTeam ? "Creating..." : "Create Team"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}