import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { 
  Newspaper, Plus, Edit2, Trash2, Send, Clock, 
  CheckCircle, AlertTriangle, Search 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatDistanceToNow } from "date-fns";
import TopBar from "../components/admin/TopBar";

const DOMAINS = ["fintech", "healthtech", "edtech", "ecommerce", "saas", "ai_ml", "cleantech", "gaming", "logistics", "social"];

const statusStyles = {
  draft: { bg: "bg-gray-500/20", text: "text-gray-400", icon: Clock },
  scheduled: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: Clock },
  announced: { bg: "bg-lime-500/20", text: "text-lime-400", icon: CheckCircle }
};

export default function BreakingNews() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialog, setDialog] = useState({ open: false, news: null });
  const [formData, setFormData] = useState({
    title: "", description: "", affected_domains: [], multiplier: 1
  });

  const { data: news = [] } = useQuery({
    queryKey: ["news"],
    queryFn: () => base44.entities.BreakingNews.list("-created_date"),
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
  const createNews = useMutation({
    mutationFn: (data) => base44.entities.BreakingNews.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      setDialog({ open: false, news: null });
    },
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateNews = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BreakingNews.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news"] });
      setDialog({ open: false, news: null });
    },
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, string>} */
  const deleteNews = useMutation({
    mutationFn: (id) => base44.entities.BreakingNews.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["news"] }),
  });

  const handleOpenDialog = (newsItem = null) => {
    if (newsItem) {
      setFormData({
        title: newsItem.title,
        description: newsItem.description,
        affected_domains: newsItem.affected_domains || [],
        multiplier: newsItem.multiplier || 1
      });
    } else {
      setFormData({ title: "", description: "", affected_domains: [], multiplier: 1 });
    }
    setDialog({ open: true, news: newsItem });
  };

  const handleSave = async (status = "draft") => {
    const data = { ...formData, status };
    if (dialog.news) {
      await updateNews.mutateAsync({ id: dialog.news.id, data });
    } else {
      await createNews.mutateAsync(data);
    }
  };

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateStartupPrice = useMutation({
      mutationFn: ({ id, data }) => base44.entities.Startup.update(id, data),
  });

  const handleAnnounce = async (newsItem) => {
    // 1. Announce the news
    await updateNews.mutateAsync({
      id: newsItem.id,
      data: { status: "announced" }
    });

    // 2. Apply Multiplier impact to affected startups
    if (newsItem.multiplier && newsItem.multiplier !== 1 && newsItem.affected_domains?.length > 0) {
        // Filter target startups
        const targets = startups.filter(s => 
            newsItem.affected_domains.includes(s.domain)
        );
        
        if (targets.length > 0) {
            const updates = targets.map(s => {
                const currentVal = s.current_price || s.base_price || 10;
                const newPrice = Math.max(1, Math.floor(currentVal * newsItem.multiplier));
                const newBase = Math.max(1, Math.floor((s.base_price || 10) * newsItem.multiplier));
                
                return updateStartupPrice.mutateAsync({
                    id: s.id,
                    data: { 
                        current_price: newPrice,
                        base_price: newBase
                    }
                });
            });

            await Promise.all(updates);
            
            // Force refresh of startups to show new prices immediately
            queryClient.invalidateQueries({ queryKey: ["startups"] });
        }
    }
  };

  const toggleDomain = (domain) => {
    if (formData.affected_domains.includes(domain)) {
      setFormData({
        ...formData,
        affected_domains: formData.affected_domains.filter(d => d !== domain)
      });
    } else {
      setFormData({
        ...formData,
        affected_domains: [...formData.affected_domains, domain]
      });
    }
  };

  const filteredNews = news.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const announcedCount = news.filter(n => n.status === "announced").length;
  const pendingCount = news.filter(n => n.status !== "announced").length;

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
              <Newspaper className="w-6 h-6 text-[#FF6B35]" />
              Breaking News
            </h1>
            <p className="text-sm text-gray-500 mt-1">{news.length} news items</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-[#0F1629] rounded-lg border border-[#19388A]/30 px-4 py-2">
              <p className="text-xs text-gray-500">Announced</p>
              <p className="text-lg font-bold text-lime-400">{announcedCount}</p>
            </div>
            <div className="bg-[#0F1629] rounded-lg border border-[#19388A]/30 px-4 py-2">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-lg font-bold text-yellow-400">{pendingCount}</p>
            </div>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/80"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create News
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#0F1629] border-[#19388A]/50 text-white"
          />
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNews.map((item) => {
            const status = statusStyles[item.status] || statusStyles.draft;
            const StatusIcon = status.icon;
            
            return (
              <div 
                key={item.id}
                className={`bg-[#0F1629] rounded-xl border ${item.status === "announced" ? 'border-[#FF6B35]/50' : 'border-[#19388A]/30'} overflow-hidden hover:border-[#4F91CD]/50 transition-all`}
              >
                {/* Header */}
                <div className={`p-4 ${item.status === "announced" ? 'bg-[#FF6B35]/10' : 'bg-[#0B1020]'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`w-5 h-5 ${item.status === "announced" ? 'text-[#FF6B35]' : 'text-gray-500'}`} />
                      <Badge className={`${status.bg} ${status.text} border-0`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {item.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(item.created_date), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-white text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-400 mt-2 line-clamp-3">{item.description}</p>

                  {item.affected_domains?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Affected Domains</p>
                      <div className="flex flex-wrap gap-1">
                        {item.affected_domains.map(d => (
                          <Badge key={d} className="bg-[#19388A]/30 text-[#4F91CD] border-0 text-[10px] capitalize">
                            {d.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.multiplier && item.multiplier !== 1 && (
                    <div className="mt-4 p-2 bg-[#FF6B35]/10 rounded-lg">
                      <p className="text-xs text-gray-500">Value Multiplier</p>
                      <p className="text-lg font-bold text-[#FF6B35]">{item.multiplier}x</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    {item.status !== "announced" && (
                      <Button
                        size="sm"
                        onClick={() => handleAnnounce(item)}
                        className="flex-1 bg-lime-500 hover:bg-lime-600 text-black"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Announce
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(item)}
                      className="text-[#4F91CD] hover:text-white hover:bg-[#19388A]/30"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNews.mutate(item.id)}
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
        <DialogContent aria-describedby={undefined} className="bg-[#0F1629] border-[#19388A]/50 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.news ? "Edit News" : "Create Breaking News"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-gray-400">Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Major policy change affects..."
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-400">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the news..."
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white h-24"
              />
            </div>
            <div>
              <Label className="text-gray-400">Affected Domains</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DOMAINS.map(d => (
                  <Badge 
                    key={d}
                    className={`cursor-pointer capitalize transition-all ${
                      formData.affected_domains.includes(d)
                        ? 'bg-[#4F91CD] text-white border-[#4F91CD]'
                        : 'bg-[#0B1020] text-gray-400 border-[#19388A]/50 hover:border-[#4F91CD]/50'
                    }`}
                    onClick={() => toggleDomain(d)}
                  >
                    {d.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Value Multiplier</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.multiplier}
                onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) })}
                className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white w-32"
              />
              <p className="text-xs text-gray-500 mt-1">Affects portfolio value calculation</p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setDialog({ open: false, news: null })}
                className="border-[#19388A]/50 text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleSave("draft")}
                disabled={!formData.title || !formData.description}
                className="bg-[#19388A] hover:bg-[#19388A]/80"
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSave("announced")}
                disabled={!formData.title || !formData.description}
                className="bg-[#FF6B35] hover:bg-[#FF6B35]/80"
              >
                <Send className="w-4 h-4 mr-1" />
                Announce Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}