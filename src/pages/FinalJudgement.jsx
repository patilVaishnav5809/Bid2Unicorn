import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trophy, Lock, Save, Bot, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { supabase } from "@/lib/supabase";
import { autoJudgeTeam } from "@/api/aiJudgeService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_SETTINGS = {
  required_judges: 3,
  is_finalized: false,
  deadline_at: null,
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isLocked(settings) {
  if (settings?.is_finalized) return true;
  if (!settings?.deadline_at) return false;
  return Date.now() > new Date(settings.deadline_at).getTime();
}

function validateRange(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function isMissingTable(error) {
  const msg = error?.message || "";
  return msg.includes("does not exist") || error?.code === "42P01";
}

export default function FinalJudgement() {
  const queryClient = useQueryClient();
  const [judgeId, setJudgeId] = useState("");
  const [activeTab, setActiveTab] = useState("news");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedNewsEventId, setSelectedNewsEventId] = useState("");
  const [selectedPowerEventId, setSelectedPowerEventId] = useState("");
  const [newsForm, setNewsForm] = useState({
    relevance_detection: 0,
    speed_response: 0,
    decision_quality: 0,
    outcome_realization: 0,
    comment: "",
  });
  const [powerForm, setPowerForm] = useState({
    timing_precision: 0,
    context_fit: 0,
    impact_value: 0,
    resource_efficiency: 0,
    comment: "",
  });
  const [coreForm, setCoreForm] = useState({
    strategy_core: 0,
    execution_discipline: 0,
    efficiency: 0,
    comment: "",
  });

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const me = await base44.auth.me();
        if (me.role !== "admin") {
          window.location.href = "/UserDashboard";
          return;
        }
        setJudgeId(me.id || me.email || "");
      } catch {
        base44.auth.redirectToLogin();
      }
    };
    checkAdmin();
  }, []);

  const { data: teams = [] } = useQuery({
    queryKey: ["teams", "judgement-page"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("id,name").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: settings = DEFAULT_SETTINGS } = useQuery({
    queryKey: ["judging-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("judging_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        if (isMissingTable(error)) return DEFAULT_SETTINGS;
        throw error;
      }
      return data || DEFAULT_SETTINGS;
    },
  });

  const { data: newsEvents = [] } = useQuery({
    queryKey: ["news-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_events")
        .select("id,title,announced_at,impact_weight")
        .order("announced_at", { ascending: false });
      if (error) {
        if (isMissingTable(error)) return [];
        throw error;
      }
      return data || [];
    },
  });

  const { data: powerEvents = [] } = useQuery({
    queryKey: ["powercard-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("powercard_events")
        .select("id,team_id,card_type,used_at,impact_weight")
        .order("used_at", { ascending: false });
      if (error) {
        if (isMissingTable(error)) return [];
        throw error;
      }
      return data || [];
    },
  });

  const { data: leaderboard = [] } = useQuery({
    queryKey: ["final-judgement-scores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("final_judgement_scores")
        .select("*")
        .order("final_score", { ascending: false })
        .order("tie_news_power", { ascending: false })
        .order("tie_hi_impact_accuracy", { ascending: false })
        .order("tie_risk_adjusted_return", { ascending: false });

      if (error) {
        if (isMissingTable(error)) return [];
        throw error;
      }
      return data || [];
    },
  });

  useEffect(() => {
    if (!selectedTeamId && teams.length > 0) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  useEffect(() => {
    if (!selectedNewsEventId && newsEvents.length > 0) {
      setSelectedNewsEventId(newsEvents[0].id);
    }
  }, [newsEvents, selectedNewsEventId]);

  useEffect(() => {
    if (!selectedPowerEventId && powerEvents.length > 0) {
      setSelectedPowerEventId(powerEvents[0].id);
    }
  }, [powerEvents, selectedPowerEventId]);

  const locked = isLocked(settings);
  const canFinalize = useMemo(() => {
    if (!leaderboard.length) return false;
    return leaderboard.every((row) => toNumber(row.judge_count) >= toNumber(settings.required_judges || 3));
  }, [leaderboard, settings.required_judges]);

  const saveNews = useMutation({
    mutationFn: async () => {
      if (!judgeId) throw new Error("Judge identity missing.");
      if (!selectedTeamId || !selectedNewsEventId) throw new Error("Select team and news event.");

      const payload = {
        team_id: selectedTeamId,
        news_event_id: selectedNewsEventId,
        judge_id: judgeId,
        relevance_detection: toNumber(newsForm.relevance_detection),
        speed_response: toNumber(newsForm.speed_response),
        decision_quality: toNumber(newsForm.decision_quality),
        outcome_realization: toNumber(newsForm.outcome_realization),
        comment: newsForm.comment?.trim() || null,
      };

      if (
        !validateRange(payload.relevance_detection, 0, 8) ||
        !validateRange(payload.speed_response, 0, 8) ||
        !validateRange(payload.decision_quality, 0, 8) ||
        !validateRange(payload.outcome_realization, 0, 6)
      ) {
        throw new Error("News scores out of range.");
      }

      const { error } = await supabase
        .from("team_news_judgements")
        .upsert(payload, { onConflict: "team_id,news_event_id,judge_id" });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["final-judgement-scores"] });
      toast.success("News judgement saved.");
    },
    onError: (error) => toast.error(error.message || "Failed to save judgement."),
  });

  const savePower = useMutation({
    mutationFn: async () => {
      if (!judgeId) throw new Error("Judge identity missing.");
      if (!selectedTeamId || !selectedPowerEventId) throw new Error("Select team and powercard event.");

      const payload = {
        team_id: selectedTeamId,
        powercard_event_id: selectedPowerEventId,
        judge_id: judgeId,
        timing_precision: toNumber(powerForm.timing_precision),
        context_fit: toNumber(powerForm.context_fit),
        impact_value: toNumber(powerForm.impact_value),
        resource_efficiency: toNumber(powerForm.resource_efficiency),
        comment: powerForm.comment?.trim() || null,
      };

      if (
        !validateRange(payload.timing_precision, 0, 10) ||
        !validateRange(payload.context_fit, 0, 8) ||
        !validateRange(payload.impact_value, 0, 8) ||
        !validateRange(payload.resource_efficiency, 0, 4)
      ) {
        throw new Error("Powercard scores out of range.");
      }

      const { error } = await supabase
        .from("team_powercard_judgements")
        .upsert(payload, { onConflict: "team_id,powercard_event_id,judge_id" });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["final-judgement-scores"] });
      toast.success("Powercard judgement saved.");
    },
    onError: (error) => toast.error(error.message || "Failed to save judgement."),
  });

  const saveCore = useMutation({
    mutationFn: async () => {
      if (!judgeId) throw new Error("Judge identity missing.");
      if (!selectedTeamId) throw new Error("Select team.");

      const payload = {
        team_id: selectedTeamId,
        judge_id: judgeId,
        strategy_core: toNumber(coreForm.strategy_core),
        execution_discipline: toNumber(coreForm.execution_discipline),
        efficiency: toNumber(coreForm.efficiency),
        comment: coreForm.comment?.trim() || null,
      };

      if (
        !validateRange(payload.strategy_core, 0, 20) ||
        !validateRange(payload.execution_discipline, 0, 10) ||
        !validateRange(payload.efficiency, 0, 10)
      ) {
        throw new Error("Core scores out of range.");
      }

      const { error } = await supabase
        .from("team_final_judgements")
        .upsert(payload, { onConflict: "team_id,judge_id" });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["final-judgement-scores"] });
      toast.success("Core judgement saved.");
    },
    onError: (error) => toast.error(error.message || "Failed to save judgement."),
  });

  const finalize = useMutation({
    mutationFn: async () => {
      if (!leaderboard.length) throw new Error("Leaderboard is empty.");
      if (!canFinalize) throw new Error("Not enough judge submissions for all teams.");
      if (locked) throw new Error("Judgement is locked.");

      const winner = leaderboard[0];
      const payload = {
        is_finalized: true,
        winner_team_id: winner.team_id,
        finalized_at: new Date().toISOString(),
        finalized_by: judgeId || "admin",
      };

      const { data: row, error: fetchErr } = await supabase
        .from("judging_settings")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (fetchErr && !isMissingTable(fetchErr)) throw fetchErr;
      if (!row?.id) throw new Error("judging_settings row missing. Run SQL setup.");

      const { error } = await supabase.from("judging_settings").update(payload).eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["judging-settings"] });
      toast.success("Winner finalized. Judgement is now locked.");
    },
    onError: (error) => toast.error(error.message || "Failed to finalize."),
  });

  const autoJudge = useMutation({
    mutationFn: async () => {
      if (!selectedTeamId) throw new Error("Please select a team first.");
      
      const team = teams.find(t => t.id === selectedTeamId);
      const teamLeaderboardData = leaderboard.find(l => l.team_id === selectedTeamId);
      
      // Determine what context we need based on the active tab
      let context = {
        teamName: team?.name,
        actionBeingJudged: activeTab,
        overallPortfolioValue: teamLeaderboardData ? Number(teamLeaderboardData.portfolio_value || 0) : 0,
        overallSpent: teamLeaderboardData ? Number(teamLeaderboardData.spent || 0) : 0,
      };

      if (activeTab === "news") {
        if (!selectedNewsEventId) throw new Error("Please select a News Event.");
        const news = newsEvents.find(n => n.id === selectedNewsEventId);
        context.newsEvent = news;
        context.instructions = "Score the team's reaction to this specific news event. If they did not react, give 0s.";
      } else if (activeTab === "power") {
        if (!selectedPowerEventId) throw new Error("Please select a Powercard Event.");
        const card = powerEvents.find(p => p.id === selectedPowerEventId);
        context.powercardEvent = card;
        context.instructions = "Score the team's usage of this specific powercard.";
      } else {
        context.instructions = "Score the team's overall strategy and execution based on their portfolio value versus what they spent.";
      }

      return await autoJudgeTeam(context);
    },
    onSuccess: (data) => {
      if (activeTab === "news" && data?.news) {
        setNewsForm({
          relevance_detection: data.news.relevance_detection || 0,
          speed_response: data.news.speed_response || 0,
          decision_quality: data.news.decision_quality || 0,
          outcome_realization: data.news.outcome_realization || 0,
          comment: data.news.comment || "",
        });
        toast.success("AI generated News scores!");
      } else if (activeTab === "power" && data?.powercard) {
        setPowerForm({
          timing_precision: data.powercard.timing_precision || 0,
          context_fit: data.powercard.context_fit || 0,
          impact_value: data.powercard.impact_value || 0,
          resource_efficiency: data.powercard.resource_efficiency || 0,
          comment: data.powercard.comment || "",
        });
        toast.success("AI generated Powercard scores!");
      } else if (activeTab === "core" && data?.core) {
        setCoreForm({
          strategy_core: data.core.strategy_core || 0,
          execution_discipline: data.core.execution_discipline || 0,
          efficiency: data.core.efficiency || 0,
          comment: data.core.comment || "",
        });
        toast.success("AI generated Core Strategy scores!");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <main className="flex-1 overflow-auto p-6 bg-[#050814] text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Final Judgement
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Score teams on strategy, news intelligence, and powercard mastery.
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-gray-300">Required Judges: {settings.required_judges || 3}</p>
            <p className="text-gray-400">
              {locked ? "Locked" : "Open"} {settings.deadline_at ? `until ${new Date(settings.deadline_at).toLocaleString()}` : ""}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-[#0F1629] border border-[#19388A]/30 rounded-xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-[#19388A]/30 pb-4">
              <div className="flex gap-2">
                <Button variant={activeTab === "news" ? "default" : "outline"} onClick={() => setActiveTab("news")}>
                  News
                </Button>
                <Button variant={activeTab === "power" ? "default" : "outline"} onClick={() => setActiveTab("power")}>
                  Powercard
                </Button>
                <Button variant={activeTab === "core" ? "default" : "outline"} onClick={() => setActiveTab("core")}>
                  Core
                </Button>
              </div>
              <Button 
                variant="outline" 
                onClick={() => autoJudge.mutate()}
                disabled={locked || autoJudge.isPending}
                className="bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20 hover:text-purple-300 transition-all font-semibold"
              >
                {autoJudge.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Bot className="w-4 h-4 mr-2" />
                )}
                Auto-Judge with AI
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">Team</Label>
                <select
                  className="w-full mt-2 rounded-md bg-[#0B1020] border border-[#19388A]/40 px-3 py-2 text-white"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  disabled={locked}
                >
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              {activeTab === "news" && (
                <div>
                  <Label className="text-gray-300">News Event</Label>
                  <select
                    className="w-full mt-2 rounded-md bg-[#0B1020] border border-[#19388A]/40 px-3 py-2 text-white"
                    value={selectedNewsEventId}
                    onChange={(e) => setSelectedNewsEventId(e.target.value)}
                    disabled={locked}
                  >
                    {newsEvents.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {activeTab === "power" && (
                <div>
                  <Label className="text-gray-300">Powercard Event</Label>
                  <select
                    className="w-full mt-2 rounded-md bg-[#0B1020] border border-[#19388A]/40 px-3 py-2 text-white"
                    value={selectedPowerEventId}
                    onChange={(e) => setSelectedPowerEventId(e.target.value)}
                    disabled={locked}
                  >
                    {powerEvents.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.card_type} ({new Date(event.used_at).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {activeTab === "news" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="flex flex-col gap-1">
                      <span>Relevance (0-8)</span>
                      <span className="text-[10px] text-gray-400 font-normal">Picked truly market-moving news, ignored noise</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={8}
                      value={newsForm.relevance_detection}
                      onChange={(e) => setNewsForm((p) => ({ ...p, relevance_detection: toNumber(e.target.value) }))}
                      disabled={locked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex flex-col gap-1">
                      <span>Speed (0-8)</span>
                      <span className="text-[10px] text-gray-400 font-normal">How quickly they acted after news</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={8}
                      value={newsForm.speed_response}
                      onChange={(e) => setNewsForm((p) => ({ ...p, speed_response: toNumber(e.target.value) }))}
                      disabled={locked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex flex-col gap-1">
                      <span>Decision Quality (0-8)</span>
                      <span className="text-[10px] text-gray-400 font-normal">Action matched news direction and context</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={8}
                      value={newsForm.decision_quality}
                      onChange={(e) => setNewsForm((p) => ({ ...p, decision_quality: toNumber(e.target.value) }))}
                      disabled={locked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex flex-col gap-1">
                      <span>Outcome Realization (0-6)</span>
                      <span className="text-[10px] text-gray-400 font-normal">Measurable benefit from news-based move</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={6}
                      value={newsForm.outcome_realization}
                      onChange={(e) => setNewsForm((p) => ({ ...p, outcome_realization: toNumber(e.target.value) }))}
                      disabled={locked}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Comment</Label>
                  <Textarea
                    value={newsForm.comment}
                    onChange={(e) => setNewsForm((p) => ({ ...p, comment: e.target.value }))}
                    disabled={locked}
                  />
                </div>
                <Button onClick={() => saveNews.mutate()} disabled={locked || saveNews.isPending}>
                  <Save className="w-4 h-4 mr-2" /> Save News Score
                </Button>
              </div>
            )}

            {activeTab === "power" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="flex flex-col gap-1">
                      <span>Timing Precision (0-10)</span>
                      <span className="text-[10px] text-gray-400 font-normal">Used card at maximum leverage moment</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={powerForm.timing_precision}
                      onChange={(e) => setPowerForm((p) => ({ ...p, timing_precision: toNumber(e.target.value) }))}
                      disabled={locked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex flex-col gap-1">
                      <span>Context Fit (0-8)</span>
                      <span className="text-[10px] text-gray-400 font-normal">Selected the right card for current board state</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={8}
                      value={powerForm.context_fit}
                      onChange={(e) => setPowerForm((p) => ({ ...p, context_fit: toNumber(e.target.value) }))}
                      disabled={locked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex flex-col gap-1">
                      <span>Impact Value (0-8)</span>
                      <span className="text-[10px] text-gray-400 font-normal">Card usage changed position materially</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={8}
                      value={powerForm.impact_value}
                      onChange={(e) => setPowerForm((p) => ({ ...p, impact_value: toNumber(e.target.value) }))}
                      disabled={locked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex flex-col gap-1">
                      <span>Resource Efficiency (0-4)</span>
                      <span className="text-[10px] text-gray-400 font-normal">No wasteful/defensive panic usage</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={4}
                      value={powerForm.resource_efficiency}
                      onChange={(e) => setPowerForm((p) => ({ ...p, resource_efficiency: toNumber(e.target.value) }))}
                      disabled={locked}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Comment</Label>
                  <Textarea
                    value={powerForm.comment}
                    onChange={(e) => setPowerForm((p) => ({ ...p, comment: e.target.value }))}
                    disabled={locked}
                  />
                </div>
                <Button onClick={() => savePower.mutate()} disabled={locked || savePower.isPending}>
                  <Save className="w-4 h-4 mr-2" /> Save Powercard Score
                </Button>
              </div>
            )}

            {activeTab === "core" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="flex flex-col gap-1">
                      <span>Strategy Core (0-20)</span>
                      <span className="text-[10px] text-gray-400 font-normal">Clarity and consistency of their plan</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      value={coreForm.strategy_core}
                      onChange={(e) => setCoreForm((p) => ({ ...p, strategy_core: toNumber(e.target.value) }))}
                      disabled={locked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex flex-col gap-1">
                      <span>Execution Discipline (0-10)</span>
                      <span className="text-[10px] text-gray-400 font-normal">How well they followed planned decisions</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={coreForm.execution_discipline}
                      onChange={(e) => setCoreForm((p) => ({ ...p, execution_discipline: toNumber(e.target.value) }))}
                      disabled={locked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="flex flex-col gap-1">
                      <span>Efficiency (0-10)</span>
                      <span className="text-[10px] text-gray-400 font-normal">Result quality vs spend/risk</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      value={coreForm.efficiency}
                      onChange={(e) => setCoreForm((p) => ({ ...p, efficiency: toNumber(e.target.value) }))}
                      disabled={locked}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>Comment</Label>
                  <Textarea
                    value={coreForm.comment}
                    onChange={(e) => setCoreForm((p) => ({ ...p, comment: e.target.value }))}
                    disabled={locked}
                  />
                </div>
                <Button onClick={() => saveCore.mutate()} disabled={locked || saveCore.isPending}>
                  <Save className="w-4 h-4 mr-2" /> Save Core Score
                </Button>
              </div>
            )}
          </div>

          <div className="bg-[#0F1629] border border-[#19388A]/30 rounded-xl p-5">
            <h2 className="font-semibold mb-4">Final Ranking</h2>
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {leaderboard.map((row, index) => (
                <div key={row.team_id} className="rounded-lg p-3 bg-[#0B1020] border border-[#19388A]/20">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {index + 1}. {row.team_name}
                    </span>
                    <span className="text-[#84CC16] font-bold">{row.final_score}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    NP: {row.tie_news_power} | HI: {row.tie_hi_impact_accuracy} | RAR: {row.tie_risk_adjusted_return}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Judges: {row.judge_count}</p>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <p className="text-sm text-gray-400">
                  No leaderboard data. Run `scripts/final_judgement_schema.sql` in Supabase first.
                </p>
              )}
            </div>

            <div className="mt-5">
              <Button
                className="w-full"
                onClick={() => finalize.mutate()}
                disabled={locked || !canFinalize || finalize.isPending}
              >
                {locked ? <Lock className="w-4 h-4 mr-2" /> : null}
                {locked ? "Judgement Locked" : "Finalize Winner"}
              </Button>
              {!canFinalize && !locked && (
                <p className="text-xs text-orange-400 mt-2">
                  Finalization requires at least {settings.required_judges || 3} core judge entries per team.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
