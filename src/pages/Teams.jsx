import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Users, Plus, Edit2, Trash2, Wallet, Briefcase, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ImageUpload from "@/components/ui/ImageUpload";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import TopBar from "../components/admin/TopBar";

export default function Teams() {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState({ open: false, team: null });
  const [formData, setFormData] = useState({
    name: "", total_budget: 500, logo_url: "", members: [], leaderName: "", leaderEmail: ""
  });
  const [newMember, setNewMember] = useState("");

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: startups = [] } = useQuery({
    queryKey: ["startups"],
    queryFn: () => base44.entities.Startup.list(),
  });

  const { data: settingsArr = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AuctionSettings.list(),
  });

  const settings = settingsArr[0];

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateTeam = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Team.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      setDialog({ open: false, team: null });
    },
  });

  /* Removed deleteTeam mutation to use manual cascading delete */

  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`Are you sure you want to delete team "${team.name}"? This will delete all their bids, users, and history.`)) {
        return;
    }

    try {
        const teamId = team.id;
        
        // Cascading Delete logic (same as AdminDashboard)
        await supabase.from('power_cards').delete().eq('team_id', teamId);
        await supabase.from('bids').delete().eq('team_id', teamId);
        await supabase.from('activity_logs').delete().eq('team_id', teamId);
        await supabase.from('users').delete().eq('team_id', teamId);
        
        const { error } = await supabase.from('teams').delete().eq('id', teamId);
        
        if (error) throw error;
        
        queryClient.invalidateQueries({ queryKey: ["teams"] });
        
        toast.success(`Team "${team.name}" deleted successfully`);
    } catch (error) {
        console.error("Delete failed:", error);
        toast.error("Failed to delete team: " + error.message);
    }
  };

  const handleOpenDialog = (team = null) => {
    if (team) {
      setFormData({
        name: team.name,
        total_budget: team.total_budget,
        logo_url: team.logo_url || "",
        members: team.members || [],
        leaderName: team.leader_name || "",
        leaderEmail: team.leader_email || ""
      });
    } else {
      setFormData({ 
        name: "", 
        total_budget: 500, 
        logo_url: "", 
        members: [], 
        leaderName: "", 
        leaderEmail: "" 
      });
    }
    setDialog({ open: true, team });
  };

  const handleSave = async () => {
    if (dialog.team) {
      try {
        await updateTeam.mutateAsync({ 
          id: dialog.team.id, 
          data: {
              name: formData.name,
              total_budget: Number(formData.total_budget),
              logo_url: formData.logo_url,
              leader_name: formData.leaderName,
              leader_email: formData.leaderEmail
          } 
        });
        toast.success("Team updated successfully");
      } catch (error) {
        console.error("Error updating team:", error);
        toast.error("Failed to update team: " + error.message);
      }
    } else {
        // Create Logic
      if (!formData.name || !formData.leaderName || !formData.leaderEmail) {
          toast.error("Please fill in Name, Leader Name, and Leader Email");
          return;
      }
      
      try {
           // 1. Create Team in DB
           const teamDataToInsert = {
              name: formData.name,
              total_budget: Number(formData.total_budget || 0),
              logo_url: formData.logo_url,
              leader_name: formData.leaderName,
              leader_email: formData.leaderEmail,
              participants: [{ name: formData.leaderName, role: "Leader" }],
              spent: 0,
              created_by: 'admin'
           };

           const { data: teamRows, error: teamError } = await supabase
            .from('teams')
            .insert([teamDataToInsert])
            .select();
          
          if (teamError) throw teamError;
          const createdTeam = teamRows[0];

          // 2. Create User
           const { error: userError } = await supabase.from('users').insert([{
               email: formData.leaderEmail,
               role: 'user',
               status: 'registered',
               team_id: createdTeam.id
          }]);
           if (userError) console.warn("User creation warning:", userError.message);

          // 3. Send Email
           try {
            await fetch('http://localhost:5000/api/send-credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.leaderEmail,
                    username: formData.leaderName,
                    loginLink: window.location.origin
                }),
            });
            toast.success("Credentials emailed to team leader!");
          } catch (emailErr) {
              console.error("Failed to send email:", emailErr);
              toast.warning("Team created, but email notification failed.");
          }

          queryClient.invalidateQueries({ queryKey: ["teams"] });
          setDialog({ open: false, team: null });
          toast.success("Team created successfully");
          
      } catch (error) {
          console.error("Error creating team:", error);
          toast.error("Failed to create team: " + error.message);
      }
    }
  };

  const handleAddMember = () => {
    if (newMember && !formData.members.includes(newMember)) {
      setFormData({ ...formData, members: [...formData.members, newMember] });
      setNewMember("");
    }
  };

  const handleRemoveMember = (email) => {
    setFormData({ ...formData, members: formData.members.filter(m => m !== email) });
  };

  const getTeamStartups = (teamId) => {
    return startups.filter(s => s.winning_team_id === teamId);
  };

  const getPortfolioValue = (teamId) => {
    return getTeamStartups(teamId).reduce((sum, s) => sum + (s.current_price || s.base_price), 0);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TopBar 
        settings={settings}
        activeStartup={startups.find(s => s.status === "active")}
        teamsOnline={teams.filter(t => t.is_online).length}
        totalBids={0}
      />

      <main className="flex-1 overflow-auto p-6 bg-[#050814]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-[#4F91CD]" />
              Teams & Wallets
            </h1>
            <p className="text-sm text-gray-500 mt-1">{teams.length} teams registered</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-[#19388A] hover:bg-[#19388A]/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team
          </Button>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const teamStartups = getTeamStartups(team.id);
            const portfolioValue = getPortfolioValue(team.id);
            const remaining = team.total_budget - (team.spent || 0);
            const spentPercent = ((team.spent || 0) / team.total_budget) * 100;

            return (
              <div 
                key={team.id}
                className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden hover:border-[#4F91CD]/50 transition-all"
              >
                {/* Header */}
                <div className="p-4 border-b border-[#19388A]/30 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center text-2xl font-bold">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      team.name?.charAt(0) || "T"
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">{team.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${team.is_online ? 'bg-lime-400' : 'bg-gray-500'}`} />
                      <span className="text-xs text-gray-500">{team.is_online ? 'Online' : 'Offline'}</span>
                      <span className="text-xs text-gray-600">•</span>
                      <span className="text-xs text-gray-500">{team.members?.length || 0} members</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(team)}
                      className="text-[#4F91CD] hover:text-white hover:bg-[#19388A]/30"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTeam(team)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Budget Section */}
                <div className="p-4 border-b border-[#19388A]/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Wallet className="w-4 h-4" /> Budget
                    </span>
                    <span className="text-sm font-bold text-white">₹{team.total_budget}L</span>
                  </div>
                  <Progress value={spentPercent} className="h-2 bg-[#0B1020]" />
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-[#FF6B35]">Spent: ₹{team.spent || 0}L</span>
                    <span className="text-lime-400">Remaining: ₹{remaining}L</span>
                  </div>
                </div>

                {/* Portfolio Section */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Briefcase className="w-4 h-4" /> Portfolio
                    </span>
                    <Badge className="bg-[#4F91CD]/20 text-[#4F91CD] border-0">
                      {teamStartups.length} startups
                    </Badge>
                  </div>

                  {teamStartups.length > 0 ? (
                    <div className="space-y-2">
                      {teamStartups.slice(0, 3).map(startup => (
                        <div key={startup.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{startup.name}</span>
                          <span className="text-white font-medium">₹{startup.current_price || startup.base_price}L</span>
                        </div>
                      ))}
                      {teamStartups.length > 3 && (
                        <p className="text-xs text-gray-500">+{teamStartups.length - 3} more</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No acquisitions yet</p>
                  )}

                  <div className="mt-4 pt-4 border-t border-[#19388A]/30 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Portfolio Value</span>
                    <span className="text-lg font-bold text-[#FF6B35]">₹{portfolioValue}L</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
        <DialogContent aria-describedby={undefined} className="bg-[#0F1629] border-[#19388A]/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.team ? "Edit Team" : "Add New Team"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-gray-400">Team Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
            
            {!dialog.team && (
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400">Leader Name *</Label>
                      <Input
                        value={formData.leaderName}
                        onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                        placeholder="John Doe"
                        className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400">Leader Email *</Label>
                      <Input
                        value={formData.leaderEmail}
                        onChange={(e) => setFormData({ ...formData, leaderEmail: e.target.value })}
                        placeholder="john@example.com"
                        className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
                      />
                    </div>
                </div>
            )}
            <div>
              <Label className="text-gray-400">Total Budget (in Lakhs)</Label>
              <Input
                type="number"
                value={formData.total_budget}
                onChange={(e) => setFormData({ ...formData, total_budget: parseFloat(e.target.value) })}
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-400">Logo Upload</Label>
              <div className="mt-2">
                <ImageUpload
                  value={formData.logo_url}
                  onChange={(url) => setFormData({ ...formData, logo_url: url })}
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Team Members</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="email"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  placeholder="email@example.com"
                  className="bg-[#0B1020] border-[#19388A]/50 text-white"
                />
                <Button onClick={handleAddMember} className="bg-[#19388A] hover:bg-[#19388A]/80">
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.members.map(email => (
                  <Badge 
                    key={email} 
                    className="bg-[#4F91CD]/20 text-[#4F91CD] border-[#4F91CD]/30 cursor-pointer hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
                    onClick={() => handleRemoveMember(email)}
                  >
                    {email} ×
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialog({ open: false, team: null })}
                className="border-[#19388A]/50 text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name || !formData.total_budget}
                className="bg-[#19388A] hover:bg-[#19388A]/80"
              >
                {dialog.team ? "Save Changes" : "Add Team"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
