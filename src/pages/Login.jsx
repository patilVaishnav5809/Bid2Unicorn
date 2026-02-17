import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Shield, Users, ArrowRight } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [teamEmail, setTeamEmail] = useState('');

  const handleAdminLogin = async () => {
    try {
      setLoading(true);
      await login({ name: 'Admin User', role: 'admin' });
      navigate('/AdminDashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamLogin = async (e) => {
    e.preventDefault();
    if (!teamEmail) return;

    try {
      setLoading(true);
      // Using the input as name, AuthContext will format it to email
      await login({ name: teamEmail, role: 'user' });
      navigate('/UserDashboard');
    } catch (error) {
      console.error('Login failed:', error);
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
            <TabsList className="grid w-full grid-cols-2 bg-[#1E3A5F] mb-6">
              <TabsTrigger value="team" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400">
                <Users className="w-4 h-4 mr-2" />
                Team Member
              </TabsTrigger>
              <TabsTrigger value="admin" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-400">
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="team">
              <form onSubmit={handleTeamLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Team Name / ID</label>
                  <Input 
                    type="text" 
                    placeholder="Enter your team name" 
                    value={teamEmail}
                    onChange={(e) => setTeamEmail(e.target.value)}
                    className="bg-[#0A1628] border-[#2A4B7C] text-white placeholder:text-gray-600 focus:border-blue-500"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading || !teamEmail}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11"
                >
                  {loading ? 'Entering...' : 'Enter Arena'}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <div className="space-y-4 py-4">
                <p className="text-sm text-gray-400 text-center mb-4">
                  Access the administrative control panel to manage auctions, users, and settings.
                </p>
                <Button 
                  onClick={handleAdminLogin}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-11"
                >
                  {loading ? 'Authenticating...' : 'Login as Admin'}
                  {!loading && <Shield className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
