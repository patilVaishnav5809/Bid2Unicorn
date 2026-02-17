import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Settings, Timer, Play, Pause, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import TopBar from "../components/admin/TopBar";

export default function AuctionSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    current_round: 1,
    round_name: "Round 1: IPL-Style Startup Auction",
    timer_seconds: 300,
    is_auction_active: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const { data: settingsArr = [] } = useQuery({
    queryKey: ["settings"],
    queryFn: () => base44.entities.AuctionSettings.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams"],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: startups = [] } = useQuery({
    queryKey: ["startups"],
    queryFn: () => base44.entities.Startup.list(),
  });

  const settings = settingsArr[0];

  useEffect(() => {
    if (settings) {
      setFormData({
        current_round: settings.current_round || 1,
        round_name: settings.round_name || "Round 1: IPL-Style Startup Auction",
        timer_seconds: settings.timer_seconds || 300,
        is_auction_active: settings.is_auction_active || false
      });
    }
  }, [settings]);

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, any>} */
  const createSettings = useMutation({
    mutationFn: (data) => base44.entities.AuctionSettings.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  /** @type {import('@tanstack/react-query').UseMutationResult<any, Error, { id: string, data: any }>} */
  const updateSettings = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AuctionSettings.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settings"] }),
  });

  const handleSave = async () => {
    setIsSaving(true);
    if (settings) {
      await updateSettings.mutateAsync({ id: settings.id, data: formData });
    } else {
      await createSettings.mutateAsync(formData);
    }
    setIsSaving(false);
  };

  const handleStartTimer = async () => {
    const endTime = new Date(Date.now() + formData.timer_seconds * 1000).toISOString();
    const data = { 
      ...formData, 
      is_auction_active: true,
      timer_end_time: endTime 
    };
    
    if (settings) {
      await updateSettings.mutateAsync({ id: settings.id, data });
    } else {
      await createSettings.mutateAsync(data);
    }
  };

  const handlePauseAuction = async () => {
    if (settings) {
      await updateSettings.mutateAsync({ 
        id: settings.id, 
        data: { is_auction_active: false } 
      });
    }
  };

  const handleResetTimer = async () => {
    const endTime = new Date(Date.now() + formData.timer_seconds * 1000).toISOString();
    if (settings) {
      await updateSettings.mutateAsync({ 
        id: settings.id, 
        data: { timer_end_time: endTime } 
      });
    }
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#4F91CD]" />
            Auction Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure auction rounds and timer settings</p>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Round Settings */}
          <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 p-6">
            <h3 className="text-lg font-bold text-white mb-6">Round Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400">Current Round Number</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.current_round}
                  onChange={(e) => setFormData({ ...formData, current_round: parseInt(e.target.value) })}
                  className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white w-32"
                />
              </div>

              <div>
                <Label className="text-gray-400">Round Name</Label>
                <Input
                  value={formData.round_name}
                  onChange={(e) => setFormData({ ...formData, round_name: e.target.value })}
                  placeholder="Round 1: IPL-Style Startup Auction"
                  className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white"
                />
              </div>
            </div>
          </div>

          {/* Timer Settings */}
          <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Timer className="w-5 h-5 text-[#4F91CD]" />
              Timer Settings
            </h3>
            
            <div className="space-y-6">
              <div>
                <Label className="text-gray-400">Bid Timer Duration (seconds)</Label>
                <Input
                  type="number"
                  min="30"
                  value={formData.timer_seconds}
                  onChange={(e) => setFormData({ ...formData, timer_seconds: parseInt(e.target.value) })}
                  className="mt-2 bg-[#0B1020] border-[#19388A]/50 text-white w-32"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {Math.floor(formData.timer_seconds / 60)}:{(formData.timer_seconds % 60).toString().padStart(2, '0')} minutes
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#0B1020] rounded-lg">
                <div>
                  <p className="text-white font-medium">Auction Status</p>
                  <p className="text-xs text-gray-500">Toggle to pause/resume the auction</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${formData.is_auction_active ? 'text-lime-400' : 'text-gray-500'}`}>
                    {formData.is_auction_active ? 'Active' : 'Paused'}
                  </span>
                  <Switch
                    checked={formData.is_auction_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_auction_active: checked })}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleStartTimer}
                  className="flex-1 bg-lime-500 hover:bg-lime-600 text-black"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Timer
                </Button>
                <Button
                  onClick={handlePauseAuction}
                  variant="outline"
                  className="flex-1 border-[#FF6B35]/50 text-[#FF6B35] hover:bg-[#FF6B35]/10"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={handleResetTimer}
                  variant="outline"
                  className="border-[#19388A]/50 text-[#4F91CD] hover:bg-[#19388A]/20"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 p-6">
            <h3 className="text-lg font-bold text-white mb-6">Auction Overview</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#0B1020] rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-white">{teams.length}</p>
                <p className="text-xs text-gray-500 mt-1">Teams Registered</p>
              </div>
              <div className="bg-[#0B1020] rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-white">{startups.length}</p>
                <p className="text-xs text-gray-500 mt-1">Total Startups</p>
              </div>
              <div className="bg-[#0B1020] rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-lime-400">{startups.filter(s => s.status === "sold").length}</p>
                <p className="text-xs text-gray-500 mt-1">Startups Sold</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#19388A] hover:bg-[#19388A]/80 h-12"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </main>
    </div>
  );
}