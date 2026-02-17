import React, { useState } from "react";
import { Newspaper, Send, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function BreakingNewsPanel({ news, onAnnounce }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    multiplier: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) return;
    
    setIsSubmitting(true);
    await onAnnounce(formData);
    setFormData({ title: "", description: "", multiplier: 1 });
    setShowForm(false);
    setIsSubmitting(false);
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: { bg: "bg-gray-500/20", text: "text-gray-400", icon: Clock },
      scheduled: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: Clock },
      announced: { bg: "bg-lime-500/20", text: "text-lime-400", icon: CheckCircle }
    };
    return styles[status] || styles.draft;
  };

  return (
    <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 overflow-hidden">
      <div className="p-4 border-b border-[#19388A]/30 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-[#FF6B35]" />
          Breaking News
        </h3>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="bg-[#FF6B35] hover:bg-[#FF6B35]/80 text-white"
        >
          <AlertTriangle className="w-4 h-4 mr-1" />
          New Alert
        </Button>
      </div>

      {showForm && (
        <div className="p-4 border-b border-[#19388A]/30 bg-[#0B1020]">
          <div className="space-y-3">
            <Input
              placeholder="News Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-[#0F1629] border-[#19388A]/50 text-white"
            />
            <Textarea
              placeholder="Description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-[#0F1629] border-[#19388A]/50 text-white h-20"
            />
            <div className="flex gap-3 items-center">
              <Input
                type="number"
                placeholder="Multiplier"
                value={formData.multiplier}
                onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) })}
                className="w-32 bg-[#0F1629] border-[#19388A]/50 text-white"
                step="0.1"
              />
              <span className="text-xs text-gray-500">Value multiplier effect</span>
              <div className="flex-1" />
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.title || !formData.description}
                className="bg-lime-500 hover:bg-lime-600 text-black"
              >
                <Send className="w-4 h-4 mr-1" />
                Announce Now
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
        {news.map((item) => {
          const status = getStatusBadge(item.status);
          const StatusIcon = status.icon;
          
          return (
            <div 
              key={item.id}
              className={`p-3 rounded-lg border ${item.status === 'announced' ? 'bg-[#FF6B35]/10 border-[#FF6B35]/30' : 'bg-[#0B1020] border-[#19388A]/30'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                    <Badge className={`${status.bg} ${status.text} text-[10px] px-1.5 py-0 border-0`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>
                  {item.multiplier && item.multiplier !== 1 && (
                    <p className="text-xs text-[#FF6B35] mt-1">
                      Multiplier: {item.multiplier}x
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {news.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            No news announcements yet.
          </div>
        )}
      </div>
    </div>
  );
}