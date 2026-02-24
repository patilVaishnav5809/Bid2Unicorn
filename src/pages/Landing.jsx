import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Trophy, Gavel } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050814] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-in fade-in zoom-in duration-500">
            <Trophy className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight animate-in slide-in-from-bottom-4 duration-700">
          Bid2Unicorn
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mt-2">
            Startup Premier League
          </span>
        </h1>
        
        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto animate-in slide-in-from-bottom-8 duration-700 delay-100">
          Enter the high-stakes arena of startup auctions. Build your portfolio, manage your budget, and compete to create the ultimate unicorn portfolio.
        </p>

        <div className="animate-in slide-in-from-bottom-12 duration-700 delay-200">
          <Button 
            onClick={() => navigate('/Login')}
            className="h-14 px-8 text-lg bg-white text-slate-900 hover:bg-slate-100 rounded-full font-bold shadow-xl shadow-white/10 transition-all hover:scale-105"
          >
            Enter The Arena
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Animated Ticker */}
      <div className="absolute bottom-0 w-full bg-[#0B1020]/80 border-t border-[#19388A]/30 backdrop-blur-sm py-3 overflow-hidden z-20">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            repeat: Infinity,
            duration: 20,
            ease: "linear",
          }}
          className="whitespace-nowrap flex gap-8 text-[#4F91CD] font-mono text-sm tracking-widest"
        >
          {Array(10).fill("STARTUP PREMIER LEAGUE • LIVE BIDDING • HIGH STAKES • UNICORN PORTFOLIO • THE ENTREPRENEURSHIP CELL RCPIT • ").map((text, i) => (
            <span key={i}>{text}</span>
          ))}
        </motion.div>
      </div>

      {/* Floating Gavel */}
      <motion.div 
        className="absolute bottom-16 right-8 md:right-16 z-30 flex flex-col items-center"
        initial={{ rotate: 0 }}
        whileHover={{ scale: 1.1 }}
      >
         <div className="relative">
            <motion.div
                animate={{ rotate: [0, -20, 0] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 1.5 }}
            >
                <Gavel className="w-16 h-16 text-[#FF6B35] drop-shadow-[0_0_15px_rgba(255,107,53,0.5)]" />
            </motion.div>
            {/* Sound block / Plate */}
            <div className="w-12 h-3 bg-[#19388A] rounded-full mt-[-4px] ml-2 border border-[#4F91CD]/50 shadow-lg blur-[1px]" />
         </div>
      </motion.div>
    </div>
  );
};

export default Landing;
