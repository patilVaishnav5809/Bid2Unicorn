import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, CheckCircle, XCircle, Mail, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function InviteUsers() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setResult(null);

    try {
      await base44.users.inviteUser(email, role);
      setResult({ success: true, message: `Successfully invited ${email} as ${role}` });
      setEmail("");
      setRole("user");
    } catch (error) {
      setResult({ success: false, message: error.message || "Failed to invite user" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Invite Users</h1>
              <p className="text-gray-500">Add new team members and administrators</p>
            </div>
          </div>
        </div>

        {/* Invite Form */}
        <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 p-6 mb-6">
          <form onSubmit={handleInvite} className="space-y-6">
            <div>
              <Label className="text-white mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#4F91CD]" />
                Email Address
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="bg-[#0B1020] border-[#19388A]/30 text-white"
                required
              />
            </div>

            <div>
              <Label className="text-white mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#4F91CD]" />
                Role
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-[#0B1020] border-[#19388A]/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F1629] border-[#19388A]/30">
                  <SelectItem value="user" className="text-white hover:bg-[#19388A]/20">
                    Regular User - Access to User Dashboard
                  </SelectItem>
                  <SelectItem value="admin" className="text-white hover:bg-[#19388A]/20">
                    Administrator - Full Admin Access
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#19388A] to-[#4F91CD] hover:from-[#19388A]/80 hover:to-[#4F91CD]/80 h-12 font-bold"
            >
              {loading ? (
                <>Processing...</>
              ) : (
                <>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Result Message */}
        {result && (
          <div className={`rounded-xl border p-4 flex items-start gap-3 ${
            result.success 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.success ? 'Success!' : 'Error'}
              </p>
              <p className="text-sm text-gray-400 mt-1">{result.message}</p>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="bg-[#0F1629] rounded-xl border border-[#19388A]/30 p-5">
            <Badge className="bg-blue-500/20 text-blue-400 border-0 mb-3">Regular User</Badge>
            <h3 className="font-semibold text-white mb-2">User Dashboard Access</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• View their team's portfolio</li>
              <li>• Participate in auctions</li>
              <li>• Track rankings & stats</li>
              <li>• Receive breaking news</li>
            </ul>
          </div>

          <div className="bg-[#0F1629] rounded-xl border border-[#FF6B35]/30 p-5">
            <Badge className="bg-[#FF6B35]/20 text-[#FF6B35] border-0 mb-3">Administrator</Badge>
            <h3 className="font-semibold text-white mb-2">Full Admin Panel</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Manage all teams & wallets</li>
              <li>• Control auction settings</li>
              <li>• Publish breaking news</li>
              <li>• Monitor all activities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}