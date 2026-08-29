import React from 'react';
import { Edit3, Megaphone, Users, Gift, Calendar } from 'lucide-react';

export default function PromoCardMockup() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-8">
      {/* Main Card Container */}
      <div className="relative w-full max-w-[1000px] aspect-[16/10] bg-gradient-to-br from-[#e0f2fe] via-[#f0f9ff] to-white overflow-hidden rounded-3xl shadow-2xl border border-blue-100">
        
        {/* Decorative Dots Background (Top Left & Middle Right) */}
        <div className="absolute top-4 left-4 grid grid-cols-4 gap-2 opacity-20">
          {[...Array(16)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-blue-500" />)}
        </div>
        <div className="absolute top-1/2 right-1/4 grid grid-cols-3 gap-2 opacity-20 -rotate-12">
          {[...Array(15)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-blue-600" />)}
        </div>

        {/* --- LEFT SIDE: OVERLAPPING CIRCLES --- */}
        {/* Main Logo Circle */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-20 w-[480px] h-[480px] bg-gradient-to-b from-blue-50 to-blue-100 rounded-full border-[12px] border-white shadow-[0_0_40px_rgba(0,0,0,0.05)] flex items-center justify-center">
          {/* Placeholder for the main Penguin logo */}
          <div className="w-64 h-64 bg-slate-800 rounded-full flex items-center justify-center text-white/50 font-bold">
            [Main Logo]
          </div>
        </div>

        {/* User Profile Circle Overlap */}
        <div className="absolute bottom-16 left-[280px] w-36 h-36 bg-white rounded-full border-8 border-white shadow-xl overflow-hidden z-10">
          {/* Placeholder for the Anime Avatar */}
          <img src="[https://api.dicebear.com/7.x/avataaars/svg?seed=0xdalai](https://api.dicebear.com/7.x/avataaars/svg?seed=0xdalai)" alt="Avatar" className="w-full h-full object-cover bg-red-500" />
        </div>
        
        {/* X / Twitter Handle Badge */}
        <div className="absolute bottom-8 left-[270px] bg-white rounded-full pr-6 pl-2 py-2 flex items-center gap-3 shadow-lg z-20">
          <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
            𝕏
          </div>
          <span className="text-xl font-bold text-slate-900">@0xdalai</span>
        </div>

        {/* --- RIGHT SIDE: CONTENT PANELS --- */}
        <div className="absolute top-0 right-0 w-3/5 h-full p-10 flex flex-col justify-center gap-6 z-20">
          
          {/* Header */}
          <div>
            <h1 className="text-[54px] leading-tight font-black text-slate-950 tracking-tight">
              Content <span className="text-blue-500 relative">Program
                {/* Decorative sparks */}
                <div className="absolute -top-4 -right-6 text-blue-500 text-2xl font-light">\ | /</div>
              </span>
            </h1>
            <div className="w-24 h-1.5 bg-blue-600 rounded-full mt-2 flex gap-1">
                <div className="w-16 h-full bg-blue-600 rounded-full"></div>
                <div className="w-2 h-full bg-blue-400 rounded-full"></div>
                <div className="w-2 h-full bg-blue-300 rounded-full"></div>
            </div>
          </div>

          {/* Feature 4-Column Box (Solid Blue) */}
          <div className="bg-[#1e40af] rounded-[2rem] p-6 flex justify-between items-center text-white shadow-lg">
            <div className="flex flex-col items-center gap-2 px-2 text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#1e40af]"><Edit3 size="{24}"/></div>
              <span className="font-bold text-sm leading-tight">Create<br/>Quality Content</span>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="flex flex-col items-center gap-2 px-2 text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#1e40af]"><Megaphone size="{24}"/></div>
              <span className="font-bold text-sm leading-tight">Amplify<br/>Alpha</span>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="flex flex-col items-center gap-2 px-2 text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#1e40af]"><Users size="{24}"/></div>
              <span className="font-bold text-sm leading-tight">Grow<br/>Together</span>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="flex flex-col items-center gap-2 px-2 text-center">
              <div className="w-12 h-12 bg-transparent border-2 border-white rounded-full flex items-center justify-center text-white"><Gift size="{24}"/></div>
              <span className="font-bold text-sm leading-tight">Earn<br/>Rewards</span>
            </div>
          </div>

          {/* Main Reward Box (Dark Gradient) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2rem] p-8 flex items-center justify-between shadow-2xl relative overflow-hidden border border-slate-800">
            {/* Confetti particles */}
            <div className="absolute top-4 right-32 w-2 h-2 bg-blue-400 rotate-45 rounded-sm"></div>
            <div className="absolute bottom-6 right-48 w-3 h-3 bg-blue-500 rounded-full"></div>
            
            <div className="flex flex-col">
              <span className="text-white text-lg font-bold">Earn Upto</span>
              <div className="text-[72px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-300 to-blue-600 tracking-tighter">
                $1100
              </div>
            </div>
            
            <div className="flex flex-col z-10 mr-16">
              <span className="text-white text-4xl font-black">Rewards</span>
              <span className="text-blue-100 text-lg font-medium">for Top Creators</span>
            </div>

            {/* 3D Gift Box Placeholder */}
            <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/20 rounded-2xl rotate-12 flex items-center justify-center backdrop-blur-sm border border-blue-400/30">
              <Gift className="text-blue-200 opacity-50" size="{64}"/>
            </div>
          </div>

          {/* Deadline Pill */}
          <div className="self-end bg-white rounded-full px-8 py-4 flex items-center gap-4 shadow-xl border border-slate-100 mt-2 z-20">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
              <Calendar size="{28}"/>
            </div>
            <div className="flex flex-col">
              <span className="text-blue-600 font-bold text-xl leading-tight">Deadline</span>
              <span className="text-slate-900 font-black text-3xl leading-tight">24th August</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}