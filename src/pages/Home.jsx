import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { User, Shield, Lock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Home() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState("user"); // "user" or "admin"
  
  // Admin Credentials
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // Participant Credentials
  const [teamName, setTeamName] = useState("");
  
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (role === "admin") {
        // Admin Validation
        if (adminEmail === "admin@gmail.com" && adminPassword === "Bid2Unicorn@2026") {
           await login({ name: "Admin", email: adminEmail, role: "admin" });
           navigate("/AdminDashboard");
           toast.success("Welcome back, Admin!");
        } else {
           toast.error("Invalid credentials");
        }
      } else {
        // Participant Validation
        if (!teamName.trim()) {
           toast.error("Please enter your team name");
           return;
        }
        await login({ name: teamName, role: "user" });
        navigate("/UserDashboard");
        toast.success(`Welcome, ${teamName}!`);
      }
    } catch (error) {
      toast.error("Login failed. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]" />
        </div>

      <div className="w-full max-w-md bg-[#0B1020] border border-[#1E293B] rounded-2xl shadow-xl p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {role === "admin" ? "Admin Access" : "Team Login"}
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            {role === "admin" ? "Secure control panel access" : "Enter your team credentials to participate"}
          </p>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#1E293B]/50 rounded-lg mb-8">
             <button
                type="button"
                onClick={() => setRole("user")}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  role === "user" 
                    ? "bg-[#19388A] text-white shadow-lg" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <User size={16} />
                Participant
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  role === "admin" 
                    ? "bg-[#19388A] text-white shadow-lg" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Shield size={16} />
                Admin
              </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          {role === "admin" ? (
              <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase">Email Address</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                        <Input 
                            type="email" 
                            placeholder="admin@example.com"
                            className="pl-10 bg-[#050814] border-[#1E293B] text-white focus:ring-blue-500"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            required
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                         <Input 
                            type="password" 
                            placeholder="••••••••"
                            className="pl-10 bg-[#050814] border-[#1E293B] text-white focus:ring-blue-500"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            required
                        />
                    </div>
                  </div>
              </div>
          ) : (
              <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 uppercase">Team Name / ID</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                        <Input 
                            type="text" 
                            placeholder="Enter your team name..."
                            className="pl-10 bg-[#050814] border-[#1E293B] text-white focus:ring-blue-500"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            required
                        />
                    </div>
                  </div>
              </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20"
          >
            {loading ? "Verifying..." : (
                <span className="flex items-center gap-2">
                    {role === "admin" ? "Access Control Panel" : "Join Auction"}
                    <ArrowRight size={18} />
                </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
