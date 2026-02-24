import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { Rocket, Users, Gavel, Zap, Newspaper, DollarSign } from "lucide-react";

import TopBar from "../components/admin/TopBar";
import StatCard from "../components/admin/StatCard";
import AuctionControlPanel from "../components/admin/AuctionControlPanel";
import TeamsWalletTable from "../components/admin/TeamsWalletTable";
import PowerCardsPanel from "../components/admin/PowerCardsPanel";
import BreakingNewsPanel from "../components/admin/BreakingNewsPanel";
import LeaderboardPanel from "../components/admin/LeaderboardPanel";
import ActivityFeed from "../components/admin/ActivityFeed";
import AllotPowerCardsDialog from "../components/admin/AllotPowerCardsDialog";

import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { validateEmailSyntax } from "@/utils/emailValidation";

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  // Edit Team State
  const [editTeamDialog, setEditTeamDialog] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    leaderName: "",
    leaderEmail: "",
    budget: "",
    logo: ""
  });

  // Add Team State
  const [addTeamDialog, setAddTeamDialog] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    budget: "500",
    logo: "",
    leaderName: "",
    leaderEmail: ""
  });
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // Allot Cards State
  const [allotCardsDialog, setAllotCardsDialog] = useState(false);
  const [allottingTeam, setAllottingTeam] = useState(null);

  const { user, isLoadingAuth, navigateToLogin } = useAuth();

  // Check if user is admin once auth is loaded
  useEffect(() => {
    if (!isLoadingAuth) {
      if (!user) {
        navigateToLogin();
      } else if (user.role !== "admin") {
        window.location.href = "/UserDashboard";
      }
    }
  }, [user, isLoadingAuth, navigateToLogin]);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#050814]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
            const now = Date.now();
            const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
            return data.map(t => {
                // Derive online status from last_active_at with 15-min timeout
                const lastActive = t.last_active_at ? new Date(t.last_active_at).getTime() : 0;
                const isRecentlyActive = (now - lastActive) < INACTIVITY_TIMEOUT;
                const computedOnline = t.is_online && isRecentlyActive;

                return {
                    id: t.id,
                    name: t.name,
                    total_budget: t.total_budget || t.budget || 500,
                    spent: t.spent || 0,
                    logo_url: t.logo_url,
                    leader_name: t.leader_name,
                    leader_email: t.leader_email,
                    is_online: computedOnline,
                    last_login_at: t.last_login_at,
                    last_active_at: t.last_active_at,
                    status: computedOnline ? 'online' : (isRecentlyActive ? 'away' : 'offline')
                };
            });
        }
        // Fallback to mock
        return base44.entities.Team.list();
    },
    refetchInterval: 10000, // Poll every 10s for online status updates
  });

  const { data: bids = [] } = useQuery({
    queryKey: ["bids"],
    queryFn: () => base44.entities.Bid.list("-created_date"),
  });

  // Fetch power card usage from activity_logs (bypasses power_cards table constraint)
  const { data: powerCardUsageLogs = [] } = useQuery({
    queryKey: ["powerCardUsage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('type', 'power_card')
        .like('message', '[CARD_USED:%');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch allotted power cards
  const { data: allottedCards = [], refetch: refetchAllottedCards } = useQuery({
    queryKey: ["allottedCards"],
    queryFn: async () => {
      const { data, error } = await supabase.from('power_cards').select('*');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  // Transform activity logs into a format PowerCardsPanel understands
  // Message format: "[CARD_USED:<card_type>] <card_name> activated for <team_name>"
  const powerCardUsage = [];
  powerCardUsageLogs.forEach(log => {
    try {
      const match = log.message?.match(/\[CARD_USED:([^\]]+)\]/);
      if (match) {
        const cardType = match[1];
        // Deduplicate
        if (!powerCardUsage.some(c => c.team_id === log.team_id && c.type === cardType)) {
          powerCardUsage.push({
            id: log.id,
            type: cardType,
            team_id: log.team_id,
            status: "used"
          });
        }
      }
    } catch {}
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

  // updatePowerCard removed — power card state is now tracked via activity_logs

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
    /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateSettings = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AuctionSettings.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  // Handlers
  const handleIncrementChange = async (incrementSize) => {
    if (!settings) {
       toast.error("Auction settings not found. Please initialize settings first.");
       return;
    }
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        data: { current_bid_increment: incrementSize }
      });
      await createLog.mutateAsync({
        type: "admin",
        message: "Admin updated Global Bid Increment to ₹" + incrementSize + "L",
      });
      toast.success("Global Bid Increment set to ₹" + incrementSize + "L");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update bid increment.");
    }
  };

  const handleStatusChange = async (startupId, status, winningTeamId, amount) => {
    await updateStartup.mutateAsync({
      id: startupId,
      data: { status, winning_team_id: winningTeamId, current_price: amount } // Ensure price is saved
    });

    if (status === "sold" && winningTeamId) {
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
      
      // AUTO-ADVANCE LOGIC
      // Find the next upcoming startup by order or creation
      const nextStartup = [...startups]
        .filter(s => s.status === "upcoming" && s.id !== startupId)
        .sort((a, b) => {
           const orderA = typeof a.order === 'number' ? a.order : 9999;
           const orderB = typeof b.order === 'number' ? b.order : 9999;
           if (orderA !== orderB) return orderA - orderB;
           return new Date(a.created_date || 0).getTime() - new Date(b.created_date || 0).getTime();
        })[0];

      if (nextStartup) {
         // Mark next startup as active
         await updateStartup.mutateAsync({
            id: nextStartup.id,
            data: { status: "active", current_price: nextStartup.base_price }
         });
         
         // Update settings
         if (settings) {
             await updateSettings.mutateAsync({
                 id: settings.id,
                 data: { active_startup_id: nextStartup.id, is_auction_active: true }
             });
         }
         toast.success(`${startup?.name} sold. Moving to ${nextStartup.name}.`);
      } else {
         if (settings) {
             await updateSettings.mutateAsync({
                 id: settings.id,
                 data: { active_startup_id: null, is_auction_active: false }
             });
         }
         toast.success("Auction block complete. No more upcoming startups.");
      }
    } else if (status === "unsold") {
       // Also auto-advance on unsold
       const nextStartup = [...startups]
        .filter(s => s.status === "upcoming" && s.id !== startupId)
        .sort((a, b) => {
           const orderA = typeof a.order === 'number' ? a.order : 9999;
           const orderB = typeof b.order === 'number' ? b.order : 9999;
           if (orderA !== orderB) return orderA - orderB;
           return new Date(a.created_date || 0).getTime() - new Date(b.created_date || 0).getTime();
        })[0];

       if (nextStartup) {
         await updateStartup.mutateAsync({
            id: nextStartup.id,
            data: { status: "active", current_price: nextStartup.base_price }
         });
         if (settings) {
             await updateSettings.mutateAsync({
                 id: settings.id,
                 data: { active_startup_id: nextStartup.id, is_auction_active: true }
             });
         }
         toast.info(`Marked unsold. Auto-advanced to ${nextStartup.name}.`);
      } else {
         if (settings) {
             await updateSettings.mutateAsync({
                 id: settings.id,
                 data: { active_startup_id: null, is_auction_active: false }
             });
         }
      }
    }
  };

  const handleRevertSale = async () => {
     // Find the most recently sold startup. 
     // We can look at activity logs, or just the most recently updated "sold" startup
     const sortedSoldStartups = [...startups]
        .filter(s => s.status === "sold")
        .sort((a, b) => new Date(b.updated_date || 0).getTime() - new Date(a.updated_date || 0).getTime());
        
     const lastSold = sortedSoldStartups[0];
     
     if (!lastSold) {
        toast.error("No recent sales to revert.");
        return;
     }
     
     if (!window.confirm(`Are you sure you want to revert the sale of ${lastSold.name}?`)) return;

     try {
        // 1. Refund the team
        if (lastSold.winning_team_id && lastSold.current_price) {
           const team = teams.find(t => t.id === lastSold.winning_team_id);
           if (team) {
              await updateTeam.mutateAsync({
                  id: team.id,
                  data: { spent: Math.max(0, (team.spent || 0) - (lastSold.current_price || 0)) }
              });
           }
        }
        
        // 2. Set the currently active one back to upcoming (if one exists)
        if (activeStartup) {
           await updateStartup.mutateAsync({
              id: activeStartup.id,
              data: { status: "upcoming" }
           });
        }
        
        // 3. Make the reverted startup active again
        await updateStartup.mutateAsync({
           id: lastSold.id,
           data: { status: "active", winning_team_id: null }
        });
        
        // 4. Update the settings to point at the reverted startup
        if (settings) {
           await updateSettings.mutateAsync({
               id: settings.id,
               data: { active_startup_id: lastSold.id, is_auction_active: true }
           });
        }

        // 5. Optionally remove the sale log
        const { data: saleLogs } = await supabase
           .from('activity_logs')
           .select('id')
           .eq('type', 'sale')
           .eq('startup_id', lastSold.id)
           .limit(1);
           
        if (saleLogs && saleLogs.length > 0) {
           await supabase.from('activity_logs').delete().eq('id', saleLogs[0].id);
           queryClient.invalidateQueries({ queryKey: ["logs"] });
        }
        
        await createLog.mutateAsync({
           type: "admin",
           message: `Admin reverted the sale of ${lastSold.name}`
        });

        toast.success(`Sale reverted. ${lastSold.name} is back on the block.`);
     } catch (err) {
        console.error("Revert failed:", err);
        toast.error("Failed to revert sale.");
     }
  };

  const handleEditTeam = (team) => {
    setEditingTeamId(team.id);
    setEditForm({
        name: team.name || "",
        leaderName: team.leader_name || "",
        leaderEmail: team.leader_email || "",
        budget: team.total_budget?.toString() || "",
        logo: team.logo_url || ""
    });
    setEditTeamDialog(true);
  };

  const handleUpdateTeam = async () => {
    if (!editingTeamId) return;
    
    try {
        await updateTeam.mutateAsync({
          id: editingTeamId,
          data: { 
              name: editForm.name,
              total_budget: parseFloat(editForm.budget),
              leader_name: editForm.leaderName,
              leader_email: editForm.leaderEmail,
              logo_url: editForm.logo
          }
        });
    
        await createLog.mutateAsync({
          type: "wallet",
          message: `Team "${editForm.name}" updated by Admin`,
          team_id: editingTeamId,
        });
        
        toast.success("Team updated successfully");
        setEditTeamDialog(false);
    } catch (err) {
        console.error("Update failed", err);
        toast.error("Failed to update team");
    }
  };

  const handleTogglePowerCard = async (card) => {
    // We use activity_logs with type='power_card' (allowed by the check constraint)
    // The card_type is encoded in the message as "[CARD_USED:<card_type>] <card_name>"
    
    const messagePrefix = `[CARD_USED:${card.type}]`;
    
    try {
        if (card.status === "used") {
            // Mark as USED: Insert an activity log entry
            const { data: existingLogs } = await supabase
                .from('activity_logs')
                .select('id')
                .eq('type', 'power_card')
                .eq('team_id', card.team_id)
                .like('message', `${messagePrefix}%`);

            if (!existingLogs || existingLogs.length === 0) {
                const { error } = await supabase
                    .from('activity_logs')
                    .insert({
                        type: "power_card",
                        message: `${messagePrefix} ${card.name} activated for ${teams.find(t => t.id === card.team_id)?.name || "Unknown"}`,
                        team_id: card.team_id
                    });
                if (error) throw error;

                // Track powercard usage as an event for final judgement (ignore if table is not set up yet).
                const { error: eventError } = await supabase
                  .from("powercard_events")
                  .insert({
                    team_id: card.team_id,
                    card_type: card.type,
                    used_at: new Date().toISOString(),
                    impact_weight: 3
                  });
                if (eventError && !String(eventError.message || "").includes("does not exist")) {
                  console.warn("Failed to create powercard event", eventError);
                }
            }
        } else {
            // Mark as AVAILABLE (undo): Delete the matching log entry
            // Find all matching entries and delete them to clean up duplicates
            const { data: matchingLogs } = await supabase
                .from('activity_logs')
                .select('id')
                .eq('type', 'power_card')
                .eq('team_id', card.team_id)
                .like('message', `${messagePrefix}%`);
            
            if (matchingLogs && matchingLogs.length > 0) {
                const idsToDelete = matchingLogs.map(l => l.id);
                const { error } = await supabase
                    .from('activity_logs')
                    .delete()
                    .in('id', idsToDelete);
                if (error) throw error;
            }
        }
        
        // Refresh power cards data
        await queryClient.invalidateQueries({ queryKey: ["powerCardUsage"] });
        queryClient.invalidateQueries({ queryKey: ["logs"] });
        queryClient.invalidateQueries({ queryKey: ["powercard-events"] });

        toast.success(`Power card "${card.name}" is now ${card.status}`);
    } catch (error) {
        console.error("Failed to toggle power card", error);
        toast.error("Failed to update power card: " + (error?.message || "Unknown error"));
    }
  };

  const handleAnnounceNews = async (data) => {
    const createdNews = await createNews.mutateAsync({
      ...data,
      status: "announced"
    });

    // Track announced news as an event for final judgement (ignore if table is not set up yet).
    const { error: newsEventError } = await supabase
      .from("news_events")
      .insert({
        source_news_id: createdNews?.id || null,
        title: createdNews?.title || data.title,
        announced_at: new Date().toISOString(),
        impact_weight: 3
      });
    if (newsEventError && !String(newsEventError.message || "").includes("does not exist")) {
      console.warn("Failed to create news event", newsEventError);
    }

    await createLog.mutateAsync({
      type: "news",
      message: `Breaking News: ${data.title}`,
    });
    queryClient.invalidateQueries({ queryKey: ["news-events"] });
  };

  const handleResolveLog = async (logId) => {
    await updateLog.mutateAsync({
      id: logId,
      data: { is_resolved: true }
    });
  };

  const handleCreateTeam = async () => {
      if (!newTeam.name || !newTeam.leaderName || !newTeam.leaderEmail) {
          toast.error("Please fill in Name, Leader Name, and Leader Email");
          return;
      }

      const emailValidation = validateEmailSyntax(newTeam.leaderEmail);
      if (!emailValidation.valid) {
        toast.error(emailValidation.reason);
        return;
      }

      setIsCreatingTeam(true);
      try {
          // 1. Create Team in DB
          const teamDataToInsert = {
              name: newTeam.name,
              total_budget: parseFloat(newTeam.budget),
              logo_url: newTeam.logo,
              leader_name: newTeam.leaderName,
              leader_email: emailValidation.normalized,
              participants: [{ name: newTeam.leaderName, role: "Leader" }],
              spent: 0,
              created_by: 'admin'
          };
          
          const { data: teamRows, error: teamError } = await supabase
            .from('teams')
            .insert([teamDataToInsert])
            .select();
          
          if (teamError) throw teamError;
          const createdTeam = teamRows[0];
          
          // 2. Create User Account for Leader (if not exists)
          // We check existence loosely or just try insert and ignore unique constraint violation if needed, but better to check.
          // For simplicity, we'll try to insert.
           const { error: userError } = await supabase.from('users').insert([{
               email: emailValidation.normalized,
               role: 'user',
               status: 'registered',
               team_id: createdTeam.id
          }]);
          
          if (userError) {
              console.warn("User creation warning (might already exist):", userError.message);
          }

          await refetchTeams();
          setAddTeamDialog(false);
          setNewTeam({ name: "", budget: "500", logo: "", leaderName: "", leaderEmail: "" });
          
          // Log it
          await createLog.mutateAsync({
              type: "admin",
              message: `New team "${newTeam.name}" registered by Admin`,
          });
          
          toast.success(`Team "${newTeam.name}" created successfully`);
      } catch (error) {
          console.error("Error creating team:", error);
          toast.error("Failed to create team: " + error.message);
      } finally {
          setIsCreatingTeam(false);
      }
  };

  const handleAllotCards = (team) => {
    setAllottingTeam(team);
    setAllotCardsDialog(true);
  };

  // Stats
  const pendingNews = news.filter(n => n.status !== "announced").length;
  const usedCards = powerCardUsage.length;
  const soldStartups = startups.filter(s => s.status === "sold").length;
  const totalAllotted = allottedCards.length;

  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`Are you sure you want to delete team "${team.name}"? This will delete all their bids, users, and history.`)) {
        return;
    }

    try {
        const teamId = team.id;
        
        // Cascading Delete
        await supabase.from('power_cards').delete().eq('team_id', teamId);
        await supabase.from('bids').delete().eq('team_id', teamId);
        await supabase.from('activity_logs').delete().eq('team_id', teamId);
        await supabase.from('users').delete().eq('team_id', teamId);
        
        const { error } = await supabase.from('teams').delete().eq('id', teamId);
        
        if (error) throw error;
        
        await refetchTeams();
        
        await createLog.mutateAsync({
            type: "admin",
            message: `Team "${team.name}" deleted by Admin`,
        });
        
        toast.success(`Team "${team.name}" deleted successfully`);
    } catch (error) {
        console.error("Delete failed:", error);
        toast.error("Failed to delete team: " + error.message);
    }
  };

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
            value={`${usedCards}/${totalAllotted}`} 
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
              settings={settings}
              onIncrementChange={handleIncrementChange}
              onStatusChange={handleStatusChange}
              onRevertSale={handleRevertSale}
              startups={startups}
            />
            <PowerCardsPanel
              powerCards={powerCardUsage}
              allottedCards={allottedCards}
              teams={teams}
              onToggleCard={handleTogglePowerCard}
            />
          </div>

          {/* Middle Column */}
          <div className="space-y-6">
            <TeamsWalletTable
              teams={teams}
              startups={startups}
              onEditWallet={handleEditTeam}
              onAddTeam={() => setAddTeamDialog(true)}
              onDeleteTeam={handleDeleteTeam}
              onAllotCards={handleAllotCards}
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

      {/* Edit Team Dialog */}
      <Dialog open={editTeamDialog} onOpenChange={setEditTeamDialog}>
        <DialogContent aria-describedby={undefined} className="bg-[#0F1629] border-[#19388A]/50 text-white">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-gray-400">Team Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Leader Name</Label>
                  <Input
                    value={editForm.leaderName}
                    onChange={(e) => setEditForm({ ...editForm, leaderName: e.target.value })}
                    className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Leader Email</Label>
                  <Input
                    value={editForm.leaderEmail}
                    onChange={(e) => setEditForm({ ...editForm, leaderEmail: e.target.value })}
                    className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
                  />
                </div>
            </div>
            <div>
              <Label className="text-gray-400">Total Budget (Lakhs)</Label>
              <Input
                type="number"
                value={editForm.budget}
                onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
             <div>
              <Label className="text-gray-400">Logo URL</Label>
              <Input
                value={editForm.logo}
                onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setEditTeamDialog(false)}
                className="border-[#19388A]/50 text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateTeam}
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
        <DialogContent aria-describedby={undefined} className="bg-[#0F1629] border-[#19388A]/50 text-white">
          <DialogHeader>
            <DialogTitle>Add New Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-gray-400">Team Name *</Label>
              <Input
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="e.g. Team Name"
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Leader Name *</Label>
                  <Input
                    value={newTeam.leaderName}
                    onChange={(e) => setNewTeam({ ...newTeam, leaderName: e.target.value })}
                    placeholder="John Doe"
                    className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Leader Email *</Label>
                  <Input
                    value={newTeam.leaderEmail}
                    onChange={(e) => setNewTeam({ ...newTeam, leaderEmail: e.target.value })}
                    placeholder="john@example.com"
                    className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
                  />
                </div>
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

      {/* Allot Power Cards Dialog */}
      <AllotPowerCardsDialog 
        open={allotCardsDialog} 
        onOpenChange={setAllotCardsDialog}
        team={allottingTeam}
        allottedCards={allottedCards}
        powerCardUsage={powerCardUsage}
        onSuccess={refetchAllottedCards}
      />
    </div>
  );
}
