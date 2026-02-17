import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Zap, Plus, Edit2, Trash2, Shield, Eye, Sparkles, 
  Ban, Rocket, DollarSign, Search, Filter 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const CARD_TYPES = [
  { value: "right_to_match", label: "Right to Match", icon: Shield, color: "from-purple-500 to-purple-700" },
  { value: "stealth_bid", label: "Stealth Bid", icon: Eye, color: "from-cyan-500 to-cyan-700" },
  { value: "double_down", label: "Double Down", icon: Sparkles, color: "from-orange-500 to-orange-700" },
  { value: "veto", label: "Veto", icon: Ban, color: "from-red-500 to-red-700" },
  { value: "wildcard", label: "Wildcard", icon: Rocket, color: "from-lime-500 to-lime-700" },
  { value: "budget_boost", label: "Budget Boost", icon: DollarSign, color: "from-yellow-500 to-yellow-700" }
];

const statusColors = {
  available: "bg-lime-500/20 text-lime-400 border-lime-500/30",
  active: "bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30",
  used: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  disabled: "bg-red-500/20 text-red-400 border-red-500/30"
};

export default function PowerCards() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dialog, setDialog] = useState({ open: false, card: null });
  const [formData, setFormData] = useState({
    name: "", type: "right_to_match", description: "", team_id: "", effect_value: 1
  });

  const { data: powerCards = [] } = useQuery({
    queryKey: ["powerCards"],
    queryFn: () => base44.entities.PowerCard.list(),
  });

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

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, any>} */
  const createCard = useMutation({
    mutationFn: (data) => base44.entities.PowerCard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["powerCards"] });
      setDialog({ open: false, card: null });
    },
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateCard = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PowerCard.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["powerCards"] });
      setDialog({ open: false, card: null });
    },
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, string>} */
  const deleteCard = useMutation({
    mutationFn: (id) => base44.entities.PowerCard.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["powerCards"] }),
  });

  const handleOpenDialog = (card = null) => {
    if (card) {
      setFormData({
        name: card.name,
        type: card.type,
        description: card.description || "",
        team_id: card.team_id || "",
        effect_value: card.effect_value || 1
      });
    } else {
      setFormData({ name: "", type: "right_to_match", description: "", team_id: "", effect_value: 1 });
    }
    setDialog({ open: true, card });
  };

  const handleSave = async () => {
    if (dialog.card) {
      await updateCard.mutateAsync({ id: dialog.card.id, data: formData });
    } else {
      await createCard.mutateAsync({ ...formData, status: formData.team_id ? "available" : "available" });
    }
  };

  const filteredCards = powerCards.filter(card => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || card.type === filterType;
    const matchesStatus = filterStatus === "all" || card.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.name || "Unassigned";
  const getCardType = (type) => CARD_TYPES.find(t => t.value === type) || CARD_TYPES[0];

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
              <Zap className="w-6 h-6 text-[#FF6B35]" />
              Power Cards Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">{powerCards.length} power cards configured</p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Power Card
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0F1629] border-[#19388A]/50 text-white"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 bg-[#0F1629] border-[#19388A]/50 text-white">
              <Filter className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F1629] border-[#19388A]/50">
              <SelectItem value="all" className="text-white">All Types</SelectItem>
              {CARD_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>
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
              <SelectItem value="available" className="text-white">Available</SelectItem>
              <SelectItem value="active" className="text-white">Active</SelectItem>
              <SelectItem value="used" className="text-white">Used</SelectItem>
              <SelectItem value="disabled" className="text-white">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCards.map((card) => {
            const cardType = getCardType(card.type);
            const IconComponent = cardType.icon;
            
            return (
              <div 
                key={card.id}
                className={`bg-[#0F1629] rounded-xl border ${card.status === "active" ? 'border-[#FF6B35]/50 shadow-[0_0_30px_rgba(255,107,53,0.2)]' : 'border-[#19388A]/30'} overflow-hidden hover:border-[#4F91CD]/50 transition-all`}
              >
                {/* Card Header */}
                <div className={`h-20 bg-gradient-to-br ${cardType.color} flex items-center justify-center relative`}>
                  <IconComponent className="w-10 h-10 text-white/80" />
                  <Badge className={`absolute top-3 right-3 ${statusColors[card.status]} border text-[10px]`}>
                    {card.status}
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-white">{card.name}</h3>
                  <p className="text-xs text-[#4F91CD] capitalize">{card.type.replace(/_/g, " ")}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{card.description}</p>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Assigned to</span>
                      <span className="text-white font-medium">{getTeamName(card.team_id)}</span>
                    </div>
                    {card.effect_value && card.effect_value !== 1 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Effect</span>
                        <span className="text-[#FF6B35] font-medium">{card.effect_value}x</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(card)}
                      className="flex-1 text-[#4F91CD] hover:text-white hover:bg-[#19388A]/30"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCard.mutate(card.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialog.open} onOpenChange={(open) => setDialog({ ...dialog, open })}>
        <DialogContent className="bg-[#0F1629] border-[#19388A]/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{dialog.card ? "Edit Power Card" : "Add New Power Card"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-gray-400">Card Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-400">Card Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                <SelectTrigger className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F1629] border-[#19388A]/50">
                  {CARD_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value} className="text-white">{t.label}</SelectItem>
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
            <div>
              <Label className="text-gray-400">Assign to Team (optional)</Label>
              <Select value={formData.team_id} onValueChange={(v) => setFormData({ ...formData, team_id: v })}>
                <SelectTrigger className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent className="bg-[#0F1629] border-[#19388A]/50">
                  <SelectItem value={null} className="text-white">Unassigned</SelectItem>
                  {teams.map(t => (
                    <SelectItem key={t.id} value={t.id} className="text-white">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400">Effect Value (multiplier)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.effect_value}
                onChange={(e) => setFormData({ ...formData, effect_value: parseFloat(e.target.value) })}
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialog({ open: false, card: null })}
                className="border-[#19388A]/50 text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name}
                className="bg-[#FF6B35] hover:bg-[#FF6B35]/80"
              >
                {dialog.card ? "Save Changes" : "Add Card"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}