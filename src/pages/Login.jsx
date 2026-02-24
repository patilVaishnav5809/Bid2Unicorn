import React, { useState } from 'react';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Shield, Users, ArrowRight, MonitorPlay } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teamEmail, setTeamEmail] = useState('');
  const [teamPassword, setTeamPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [screenPassword, setScreenPassword] = useState('');

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) return;
    try {
      setLoading(true);
      await login({ email: adminEmail, role: 'admin', password: adminPassword });
      navigate('/AdminDashboard');
    } catch (error) {
      console.error('Admin login failed:', error.message);
      toast.error(error.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleScreenLogin = async (e) => {
    e.preventDefault();
    if (!screenPassword) return;
    try {
      setLoading(true);
      // Optional: Replace hardcoded password with env var checking if preferred
      if (screenPassword !== "Screen@2026") {
         throw new Error("Invalid screen passcode.");
      }
      
      // Bypass standard auth or login as a dedicated screen user.
      // For now we'll login as a special role or mock user to get access to the dashboard.
      // Since it's view-only, we just want to get past the gate.
      // Easiest is to use the generic 'admin' role login but redirect differently
      await login({ email: "admin@gmail.com", role: 'admin', password: 'Bid2Unicorn@2026' }); // Adjust if you have a real screen account
      
      toast.success("Screen mode activated");
      navigate('/ScreenDashboard');
    } catch (error) {
      console.error('Screen login failed:', error.message);
      toast.error(error.message || 'Screen login failed.');
    } finally {
      setLoading(false);
    }
  };

  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleResendConfirmation = async () => {
      try {
          setLoading(true);
          const { error } = await base44.auth.resendConfirmation(teamEmail);
          if (error) throw error;
          toast.success("Confirmation email resent! Check your inbox.");
      } catch (error) {
          toast.error("Failed to resend: " + error.message);
      } finally {
          setLoading(false);
      }
  };

  const handleTeamLogin = async (e) => {
    e.preventDefault();
    console.log("Team login submitted", { teamEmail });
    if (!teamEmail) return;

    try {
      setLoading(true);
      setNeedsConfirmation(false);
      // AuthContext will use this email for Supabase auth
      await login({ email: teamEmail, role: 'user', password: teamPassword });
      navigate('/UserDashboard');
    } catch (error) {
      console.error('Login failed full error:', error);
      
      // Explicitly handle "Email not confirmed" to ensure UI updates
      // Note: We're checking for both the standard Supabase error string and our custom wrapper
      if (error.message && (error.message.includes("confirm your email") || error.message.includes("Email not confirmed"))) {
          setNeedsConfirmation(true);
          toast.error("Please confirm your email address. Check your inbox.", {
            duration: 5000,
            action: {
              label: 'Resend',
              onClick: handleResendConfirmation
            }
          });
      } else {
          // General error
          toast.error(error.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[100px]" />
      </div>

      <Card className="w-full max-w-md bg-[#0F1A2E] border-[#1E3A5F] relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Welcome Back</CardTitle>
          <CardDescription className="text-gray-400">
            Select your role to access the arena
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="team" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-[#1E3A5F] mb-6">
              <TabsTrigger value="team" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400">
                <Users className="w-4 h-4 mr-2" />
                Team
              </TabsTrigger>
              <TabsTrigger value="admin" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400">
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </TabsTrigger>
              <TabsTrigger value="screen" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white text-gray-400">
                <MonitorPlay className="w-4 h-4 mr-2" />
                Screen
              </TabsTrigger>
            </TabsList>

            <TabsContent value="team">
              <form onSubmit={handleTeamLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Team Leader Email</label>
                  <Input 
                    type="email" 
                    placeholder="Enter Team Leader Email" 
                    value={teamEmail}
                    onChange={(e) => setTeamEmail(e.target.value)}
                    className="bg-[#0A1628] border-[#2A4B7C] text-white placeholder:text-gray-600 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Password</label>
                  <Input 
                    type="password" 
                    placeholder="Enter your password" 
                    value={teamPassword}
                    onChange={(e) => setTeamPassword(e.target.value)}
                    className="bg-[#0A1628] border-[#2A4B7C] text-white placeholder:text-gray-600 focus:border-blue-500"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !teamEmail || !teamPassword}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11"
                >
                  {loading ? 'Entering...' : 'Enter Arena'}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>

                {needsConfirmation && (
                    <Button 
                      type="button" 
                      onClick={handleResendConfirmation}
                      disabled={loading}
                      variant="outline"
                      className="w-full border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 mt-2"
                    >
                      Resend Confirmation Email
                    </Button>
                )}
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Admin Email</label>
                  <Input 
                    type="email" 
                    placeholder="Enter admin email" 
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="bg-[#0A1628] border-[#2A4B7C] text-white placeholder:text-gray-600 focus:border-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Password</label>
                  <Input 
                    type="password" 
                    placeholder="Enter admin password" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="bg-[#0A1628] border-[#2A4B7C] text-white placeholder:text-gray-600 focus:border-purple-500"
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={loading || !adminEmail || !adminPassword}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-11"
                >
                  {loading ? 'Authenticating...' : 'Login as Admin'}
                  {!loading && <Shield className="w-4 h-4 ml-2" />}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="screen">
              <form onSubmit={handleScreenLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Screen Passcode</label>
                  <Input 
                    type="password" 
                    placeholder="Enter screen passcode" 
                    value={screenPassword}
                    onChange={(e) => setScreenPassword(e.target.value)}
                    className="bg-[#0A1628] border-[#2A4B7C] text-white placeholder:text-gray-600 focus:border-orange-500"
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={loading || !screenPassword}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-11"
                >
                  {loading ? 'Activating...' : 'Activate Screen Mode'}
                  {!loading && <MonitorPlay className="w-4 h-4 ml-2" />}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
