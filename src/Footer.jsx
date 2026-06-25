import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Anchor, Twitter, Send, Youtube, 
  Instagram, BookOpen, ArrowUpRight 
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8 mt-auto font-sans">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* TOP SECTION: Links & Branding */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand & Description (Takes up more space) */}
          <div className="lg:col-span-5">
            <Link to="/" className="flex items-center gap-2.5 group w-max mb-6">
              <div className="w-9 h-9 flex items-center justify-center group-hover:scale-105 transition-transform">
                <img 
                  src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" 
                  alt="AirdropSailor Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="font-black text-xl text-slate-900 tracking-tight">AirdropSailor</span>
            </Link>
            <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-sm mb-8">
              Navigate the Web3 ecosystem with precision. Track top-tier airdrops, manage your daily farming tasks, and maximize your on-chain allocations with our premium analytics engine.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {/* Active Socials */}
              <a href="https://x.com/airdropsailor" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-sky-50 hover:text-sky-500 hover:scale-110 transition-all border border-slate-200 shadow-sm" aria-label="X (Twitter)">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://telegram.me/airdropsailor" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-500 hover:scale-110 transition-all border border-slate-200 shadow-sm" aria-label="Telegram">
                <Send className="w-4 h-4 ml-[-2px] mt-[2px]" /> {/* Tweaked position for Telegram arrow */}
              </a>
              
              {/* Coming Soon Socials (Muted) */}
              <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all border border-slate-200 cursor-not-allowed group relative" aria-label="Medium">
                <BookOpen className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all border border-slate-200 cursor-not-allowed group relative" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all border border-slate-200 cursor-not-allowed group relative" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Spacer for desktop layout */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Links Column 1: Platform */}
          <div className="lg:col-span-2">
            <h3 className="text-slate-900 font-bold text-sm tracking-tight mb-5">Platform</h3>
            <ul className="space-y-3.5">
              <li><Link to="/" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Airdrop Radar</Link></li>
              <li><Link to="/early-tasks" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Early Tasks</Link></li>
              <li><Link to="/subscription" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1.5">Points Arena <span className="bg-amber-100 text-amber-600 text-[9px] font-black uppercase px-1.5 py-0.5 rounded">Hot</span></Link></li>
              <li><Link to="/fundraising" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Fundraising Hub</Link></li>
            </ul>
          </div>

          {/* Links Column 2: Dashboard */}
          <div className="lg:col-span-2">
            <h3 className="text-slate-900 font-bold text-sm tracking-tight mb-5">Command Center</h3>
            <ul className="space-y-3.5">
              <li><Link to="/profile/overview" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">My Overview</Link></li>
              <li><Link to="/profile/daily-tasks" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Daily Actions</Link></li>
              <li><Link to="/profile/onchain-analysis" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Sybil Scanner</Link></li>
              <li><Link to="/profile/settings" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Settings</Link></li>
            </ul>
          </div>

          {/* Links Column 3: Legal & Support */}
          <div className="lg:col-span-2">
            <h3 className="text-slate-900 font-bold text-sm tracking-tight mb-5">Resources</h3>
            <ul className="space-y-3.5">
              <li><a href="#" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Help Center</a></li>
              <li><a href="#" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Submit a Project</a></li>
              <li><a href="#" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

        </div>

        {/* BOTTOM SECTION: Copyright */}
        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm font-medium text-center md:text-left">
            © {currentYear} AirdropSailor. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-widest">
            Built for Web3 Farmers <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>
    </footer>
  );
}