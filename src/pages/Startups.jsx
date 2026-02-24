import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  Rocket, Plus, Edit2, Trash2, Play, 
  Search, Filter, CheckCircle, Clock, XCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ui/ImageUpload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import TopBar from "../components/admin/TopBar";

const DOMAINS = ["fintech", "healthtech", "edtech", "ecommerce", "saas", "ai_ml", "cleantech", "gaming", "logistics", "social"];

const statusColors = {
  upcoming: "bg-[#4F91CD]/20 text-[#4F91CD] border-[#4F91CD]/30",
  active: "bg-lime-500/20 text-lime-400 border-lime-500/30",
  sold: "bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30",
  unsold: "bg-gray-500/20 text-gray-400 border-gray-500/30"
};

const statusIcons = {
  upcoming: Clock,
  active: Play,
  sold: CheckCircle,
  unsold: XCircle
};

export default function Startups() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDomain, setFilterDomain] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialog, setDialog] = useState({ open: false, startup: null });
  const [formData, setFormData] = useState({
    name: "", domain: "fintech", description: "", base_price: 0, logo_url: "",
    users: "", growth: "", risk: "Medium"
  });

  const { data: startups = [] } = useQuery({
    queryKey: ["startups"],
    queryFn: () => base44.entities.Startup.list("order"),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: settingsArr = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AuctionSettings.list(),
  });

  const settings = settingsArr[0];

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, any>} */
  const createStartup = useMutation({
    mutationFn: (data) => base44.entities.Startup.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      setDialog({ open: false, startup: null });
    },
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateStartup = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Startup.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      setDialog({ open: false, startup: null });
    },
  });

  const deleteStartup = useMutation({
    mutationFn: (id) => base44.entities.Startup.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["startups"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Startup deleted successfully");
    },
    onError: (err) => {
      toast.error("Failed to delete startup: " + err.message);
    }
  });

  const handleDeleteStartup = async (startup) => {
    if (!window.confirm(`Are you sure you want to delete "${startup.name}"? This will delete all associated bids.`)) {
      return;
    }

    try {
      // 1. Delete associated bids
      await supabase.from('bids').delete().eq('startup_id', startup.id);
      
      // 2. Unlink from auction settings unconditionally
      await supabase.from('auction_settings')
        .update({ active_startup_id: null, is_auction_active: false })
        .eq('active_startup_id', startup.id);

      // 3. Delete the startup
      await deleteStartup.mutateAsync(startup.id);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete startup: " + error.message);
    }
  };

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateSettings = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AuctionSettings.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, any>} */
  const createSettings = useMutation({
    mutationFn: (data) => base44.entities.AuctionSettings.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  const handleOpenDialog = (startup = null) => {
    if (startup) {
      setFormData({
        name: startup.name,
        domain: startup.domain,
        description: startup.description || "",
        base_price: startup.base_price,
        logo_url: startup.logo_url || "",
        users: startup.users || "",
        growth: startup.growth || "",
        risk: startup.risk || "Medium"
      });
    } else {
      setFormData({ name: "", domain: "fintech", description: "", base_price: 0, logo_url: "", users: "", growth: "", risk: "Medium" });
    }
    setDialog({ open: true, startup });
  };

  const handleSave = async () => {
    const payload = {
        name: formData.name,
        domain: formData.domain,
        description: formData.description,
        base_price: Number(formData.base_price) || 0,
        logo_url: formData.logo_url
    };

    if (dialog.startup) {
      await updateStartup.mutateAsync({ id: dialog.startup.id, data: payload });
    } else {
      await createStartup.mutateAsync({
        ...payload,
        status: "upcoming",
        order: startups.length + 1
      });
    }
  };

  const handleSetActive = async (startup) => {
    // First, set any currently active startup to upcoming
    const currentActive = startups.find(s => s.status === "active");
    if (currentActive && currentActive.id !== startup.id) {
      await updateStartup.mutateAsync({
        id: currentActive.id,
        data: { status: "upcoming" }
      });
    }

    // Set the new startup as active
    await updateStartup.mutateAsync({
      id: startup.id,
      data: { status: "active", current_price: startup.base_price }
    });

    // Update auction settings
    if (settings) {
      await updateSettings.mutateAsync({
        id: settings.id,
        data: { 
          active_startup_id: startup.id,
          is_auction_active: true,
          timer_end_time: new Date(Date.now() + (settings.timer_seconds || 300) * 1000).toISOString()
        }
      });
    } else {
      await createSettings.mutateAsync({
        active_startup_id: startup.id,
        is_auction_active: true,
        current_round: 1,
        round_name: "Round 1: IPL-Style Startup Auction",
        timer_seconds: 300,
        timer_end_time: new Date(Date.now() + 300 * 1000).toISOString()
      });
    }
  };

  const filteredStartups = startups.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = filterDomain === "all" || s.domain === filterDomain;
    const matchesStatus = filterStatus === "all" || s.status === filterStatus;
    return matchesSearch && matchesDomain && matchesStatus;
  });

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
              <Rocket className="w-6 h-6 text-[#4F91CD]" />
              Startups Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">{startups.length} startups in the auction</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-[#19388A] hover:bg-[#19388A]/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Startup
          </Button>
        </div>

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
          <Select value={filterDomain} onValueChange={setFilterDomain}>
            <SelectTrigger className="w-40 bg-[#0F1629] border-[#19388A]/50 text-white">
              <Filter className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Domain" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F1629] border-[#19388A]/50">
              <SelectItem value="all" className="text-white">All Domains</SelectItem>
              {DOMAINS.map(d => (
                <SelectItem key={d} value={d} className="text-white capitalize">{d.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-[#0F1629] border-[#19388A]/50 text-white">
              <Filter className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F1629] border-[#19388A]/50">
              <SelectItem value="all" className="text-white">All Status</SelectItem>
              <SelectItem value="upcoming" className="text-white">Upcoming</SelectItem>
              <SelectItem value="active" className="text-white">Active</SelectItem>
              <SelectItem value="sold" className="text-white">Sold</SelectItem>
              <SelectItem value="unsold" className="text-white">Unsold</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Startups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStartups.map((startup) => {
            const StatusIcon = statusIcons[startup.status] || Clock;
            const winningTeam = teams.find(t => t.id === startup.winning_team_id);
            
            return (
              <div 
                key={startup.id}
                className={`bg-[#0F1629] rounded-xl border ${startup.status === "active" ? 'border-lime-500/50 shadow-[0_0_30px_rgba(132,204,22,0.2)]' : 'border-[#19388A]/30'} overflow-hidden hover:border-[#4F91CD]/50 transition-all`}
              >
                {/* Logo/Header */}
                <div className="h-24 bg-gradient-to-br from-[#19388A]/50 to-[#0B1020] flex items-center justify-center relative">
                  {startup.logo_url ? (
                    <img src={startup.logo_url} alt={startup.name} className="w-16 h-16 object-contain" />
                  ) : (
                    <span className="text-4xl font-bold text-white/50">{startup.name?.charAt(0)}</span>
                  )}
                  <Badge className={`absolute top-3 right-3 ${statusColors[startup.status]} border text-[10px]`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {startup.status}
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-white">{startup.name}</h3>
                  <p className="text-xs text-[#4F91CD] capitalize">{startup.domain?.replace(/_/g, " ")}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{startup.description}</p>

                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <p className="text-xs text-gray-500">Base Price</p>
                      <p className="text-lg font-bold text-white">₹{startup.base_price}L</p>
                    </div>
                    {startup.status === "sold" && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Sold For</p>
                        <p className="text-lg font-bold text-[#FF6B35]">₹{startup.current_price}L</p>
                      </div>
                    )}
                  </div>

                  {winningTeam && (
                    <div className="mt-3 pt-3 border-t border-[#19388A]/30">
                      <p className="text-xs text-gray-500">Acquired by</p>
                      <p className="text-sm font-semibold text-lime-400">{winningTeam.name}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    {startup.status === "upcoming" && (
                      <Button
                        size="sm"
                        onClick={() => handleSetActive(startup)}
                        className="flex-1 bg-lime-500 hover:bg-lime-600 text-black"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start Auction
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(startup)}
                      className="text-[#4F91CD] hover:text-white hover:bg-[#19388A]/30"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    {startup.status !== "sold" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteStartup(startup)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
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
            <DialogTitle>{dialog.startup ? "Edit Startup" : "Add New Startup"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-gray-400">Startup Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-400">Domain</Label>
              <Select value={formData.domain} onValueChange={(v) => setFormData({ ...formData, domain: v })}>
                <SelectTrigger className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F1629] border-[#19388A]/50">
                  {DOMAINS.map(d => (
                    <SelectItem key={d} value={d} className="text-white capitalize">{d.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white h-20"
              />
            </div>
            
            {/* New Metrics Row */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-400">Active Users</Label>
                <Input
                  value={formData.users}
                  onChange={(e) => setFormData({ ...formData, users: e.target.value })}
                  placeholder="e.g. 1M+"
                  className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">Growth Rate</Label>
                <Input
                  value={formData.growth}
                  onChange={(e) => setFormData({ ...formData, growth: e.target.value })}
                  placeholder="e.g. 20% MoM"
                  className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">Risk Profile</Label>
                <Select value={formData.risk} onValueChange={(v) => setFormData({ ...formData, risk: v })}>
                  <SelectTrigger className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F1629] border-[#19388A]/50">
                    <SelectItem value="Low" className="text-white">Low</SelectItem>
                    <SelectItem value="Medium" className="text-white">Medium</SelectItem>
                    <SelectItem value="High" className="text-white">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Base Price (in Lakhs)</Label>
              <Input
                type="number"
                value={formData.base_price === 0 ? '' : formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value ? parseFloat(e.target.value) : 0 })}
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
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialog({ open: false, startup: null })}
                className="border-[#19388A]/50 text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name || !formData.base_price}
                className="bg-[#19388A] hover:bg-[#19388A]/80"
              >
                {dialog.startup ? "Save Changes" : "Add Startup"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
