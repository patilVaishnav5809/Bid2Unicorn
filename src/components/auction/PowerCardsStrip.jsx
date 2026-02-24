import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap } from "lucide-react";

export default function PowerCardsStrip({ cards, onUseCard, isVisible, onClose }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-4 flex justify-center items-end pointer-events-none"
        >
           <div className="bg-[#0F1629]/90 backdrop-blur-xl border border-[#19388A]/50 rounded-2xl shadow-2xl p-6 relative pointer-events-auto max-w-4xl w-full">
              <button 
                onClick={onClose}
                className="absolute top-2 right-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                 <Zap className="w-5 h-5 text-yellow-400 fill-current" />
                 Power Cards
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {cards.map(card => (
                   <div 
                     key={card.id}
                     className={`
                       relative overflow-hidden rounded-xl p-4 border transition-all cursor-pointer group
                       ${card.used 
                         ? 'bg-gray-800/50 border-gray-700 opacity-50 grayscale' 
                         : 'bg-gradient-to-br from-[#19388A]/40 to-[#0B1020] border-[#4F91CD]/30 hover:border-[#4F91CD] hover:scale-105 hover:shadow-[0_0_20px_rgba(79,145,205,0.3)]'}
                     `}
                     onClick={() => !card.used && onUseCard(card.id)}
                   >
                      <div className="text-2xl mb-2">{card.icon}</div>
                      <h4 className="font-bold text-white text-sm mb-1">{card.name}</h4>
                      <p className="text-[10px] text-gray-400 leading-tight">{card.description}</p>
                      
                      {card.used && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                           <span className="text-xs font-bold text-white uppercase tracking-widest rotate-[-15deg] border-2 border-white px-2 py-1">Used</span>
                        </div>
                      )}
                   </div>
                 ))}
              </div>
           </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
