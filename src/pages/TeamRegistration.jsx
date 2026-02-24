import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Trophy, Mail, Shield, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/ui/ImageUpload";

export default function TeamRegistration() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    leaderName: "",
    leaderEmail: "",
    teamPassword: "",
    logoUrl: "",
    budget: 500, // Default budget
    members: [{ name: "", role: "Member" }] // Initial member
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...formData.members];
    newMembers[index][field] = value;
    setFormData(prev => ({ ...prev, members: newMembers }));
  };

  const addMember = () => {
    setFormData(prev => ({
      ...prev,
      members: [...prev.members, { name: "", role: "Member" }]
    }));
  };

  const removeMember = (index) => {
    if (formData.members.length > 1) {
      const newMembers = [...formData.members];
      newMembers.splice(index, 1);
      setFormData(prev => ({ ...prev, members: newMembers }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate
      if (!formData.name || !formData.leaderName || !formData.leaderEmail || !formData.teamPassword) {
        throw new Error("Please fill in all required fields");
      }

      const emailAddress = formData.leaderEmail.toLowerCase().trim();

      // Prepare data for DB
      const teamData = {
        name: formData.name,
        leader_name: formData.leaderName,
        leader_email: emailAddress,
        team_password: formData.teamPassword,
        logo_url: formData.logoUrl,
        members: [emailAddress, ...formData.members.map(m => m.name)],
        participants: formData.members,
        total_budget: Number(formData.budget),
        spent: 0,
        is_online: false,
        created_by: 'admin'
      };

      // Save to DB
      await base44.entities.Team.create(teamData);
      
      // Also invite the leader as a user so they can login
      try {
          // Check if user exists first to avoid duplicate invite error in logs
          const users = await base44.entities.User.list();
          if (!users.find(u => u.email === emailAddress)) {
              await base44.entities.User.create({
                email: emailAddress,
                role: 'user',
                status: 'registered',
                team_id: teamData.id 
              });
          }
      } catch (err) {
          console.warn("Could not auto-register leader as user", err);
      }



      toast.success(`Team "${formData.name}" registered successfully!`);
      
      // Reset form
      setFormData({
        name: "",
        leaderName: "",
        leaderEmail: "",
        teamPassword: "",
        logoUrl: "",
        budget: 500,
        members: [{ name: "", role: "Member" }]
      });

    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to register team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#19388A] to-[#4F91CD] flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Team Registration</h1>
              <p className="text-gray-500">Register new teams for the Startup Premier League</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Team Details Card */}
          <Card className="bg-[#0F1629] border-[#19388A]/30 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#4F91CD]" />
                Team Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Team Name *</Label>
                <Input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="e.g. Alpha Ventures"
                  className="bg-[#0B1020] border-[#19388A]/30"
                />
              </div>
              <div className="space-y-2">
                <Label>Team Logo</Label>
                <ImageUpload 
                  value={formData.logoUrl} 
                  onChange={(url) => setFormData(prev => ({ ...prev, logoUrl: url }))} 
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label>Budget Allocated (₹M)</Label>
                <Input 
                    type="number"
                    name="budget" 
                    value={formData.budget} 
                    onChange={handleChange} 
                    className="bg-[#0B1020] border-[#19388A]/30 font-mono text-green-400 font-bold"
                />
                <p className="text-xs text-slate-500 mt-1">Default is 500M. Adjust if special rules apply.</p>
              </div>
            </CardContent>
          </Card>

          {/* Leader Details Card */}
          <Card className="bg-[#0F1629] border-[#19388A]/30 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#FF6B35]" />
                Team Leader
              </CardTitle>
              <CardDescription className="text-gray-400">
                Primary contact for the team
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Leader Name *</Label>
                <Input 
                  name="leaderName" 
                  value={formData.leaderName} 
                  onChange={handleChange} 
                  placeholder="Full Name"
                  className="bg-[#0B1020] border-[#19388A]/30"
                />
              </div>
              <div className="space-y-2">
                <Label>Leader Email *</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                    name="leaderEmail" 
                    value={formData.leaderEmail} 
                    onChange={handleChange} 
                    placeholder="leader@example.com"
                    className="pl-9 bg-[#0B1020] border-[#19388A]/30"
                    />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Set Team Password *</Label>
                <div className="relative">
                    <Shield className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                    name="teamPassword" 
                    type="text"
                    value={formData.teamPassword} 
                    onChange={handleChange} 
                    placeholder="Create a secure password"
                    className="pl-9 bg-[#0B1020] border-[#19388A]/30"
                    />
                </div>
                <p className="text-xs text-slate-500 mt-1">This password will be required for the team to log in.</p>
              </div>
            </CardContent>
          </Card>

          {/* Participants Card */}
          <Card className="bg-[#0F1629] border-[#19388A]/30 text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-lime-400" />
                    Team Members
                </CardTitle>
                <CardDescription className="text-gray-400">
                    Add all other participants in the team
                </CardDescription>
              </div>
              <Button type="button" onClick={addMember} variant="outline" size="sm" className="border-[#19388A]/50 hover:bg-[#19388A]/20">
                <Plus className="w-4 h-4 mr-1" /> Add Member
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.members.map((member, index) => (
                <div key={index} className="flex gap-4 items-end animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex-1 space-y-2">
                    <Label className="text-xs text-gray-500">Member Name</Label>
                    <Input 
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      placeholder="Participant Name"
                      className="bg-[#0B1020] border-[#19388A]/30"
                    />
                  </div>
                  <div className="w-1/3 space-y-2">
                    <Label className="text-xs text-gray-500">Role</Label>
                    <Input 
                      value={member.role}
                      onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                      placeholder="Role (e.g. Analyst)"
                      className="bg-[#0B1020] border-[#19388A]/30"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeMember(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 mb-[2px]"
                    disabled={formData.members.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl shadow-blue-500/10"
          >
            {loading ? "Registering Team..." : "Complete Registration"}
          </Button>
        </form>
      </div>
    </div>
  );
}
