import {
  Compass,
  Award,
  ShieldCheck,
  Users,
  TrendingUp,
  Eye,
  ClipboardList,
  Trophy,
  BarChart3,
  Store,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "./useAuth";
import heroShip from "./assets/sailor-pass-hero.png";
import ctaChest from "./assets/marketplace-treasure.png";

const nav = [
  { name: "Airdrops", path: "/" },
  { name: "Sailor Pass", path: "/subscription" },
  { name: "Marketplace", path: "/marketplace" },
  { name: "XP & Levels", path: "/xp-levels" },
  { name: "Sybil Scanner", path: "/scanner" }
];

const heroBullets = [
  { icon: Compass, title: "Curated Airdrops", desc: "Only quality, verified opportunities." },
  { icon: Award, title: "Earn XP & Level Up", desc: "Complete tasks and unlock exclusive rewards." },
  { icon: ShieldCheck, title: "Secure & Transparent", desc: "Built for fairness and transparency." },
];

const community = [
  { icon: Users, title: "Community First", desc: "Built with and for Web3 sailors." },
  { icon: Award, title: "Quality Over Quantity", desc: "We focus on real value, not hype." },
  { icon: TrendingUp, title: "Always Evolving", desc: "New features and airdrops, always." },
  { icon: Eye, title: "Open & Transparent", desc: "Clear, honest, and trustworthy." },
];

const features = [
  { icon: Compass, title: "Airdrop Explorer", desc: "Discover handpicked airdrops across DeFi, NFT, Layer 1, and more.", cta: "Explore Airdrops", path: "/", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: ClipboardList, title: "Tasks & Quests", desc: "Complete simple tasks and quests to earn XP and unlock new levels.", cta: "View Tasks", path: "/early-tasks", color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: Trophy, title: "XP & Levels", desc: "Earn XP for every action and climb the ranks to unlock exclusive perks.", cta: "View Levels", path: "/xp-levels", color: "text-purple-600", bg: "bg-purple-50" },
  { icon: BarChart3, title: "Progress Tracker", desc: "Track your activity, XP history, and achievements in one powerful dashboard.", cta: "Go to Tracker", path: "/profile/overview", color: "text-indigo-600", bg: "bg-indigo-50" },
  { icon: Store, title: "Marketplace", desc: "Use your XP and rewards in our exclusive marketplace.", cta: "Visit Marketplace", path: "/marketplace", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: ShieldCheck, title: "Sybil Scanner", desc: "Advanced on-chain and off-chain analysis to ensure a healthy ecosystem.", cta: "Learn More", path: "/scanner", color: "text-sky-600", bg: "bg-sky-50" },
];

const steps = [
  { n: 1, icon: Compass, title: "Explore", desc: "Find the best airdrops and opportunities curated for you.", color: "bg-blue-50", iconColor: "text-blue-600" },
  { n: 2, icon: ClipboardList, title: "Complete", desc: "Finish tasks, quests, and campaigns to earn XP and rewards.", color: "bg-emerald-50", iconColor: "text-emerald-600" },
  { n: 3, icon: Trophy, title: "Earn & Grow", desc: "Level up, unlock perks, and redeem amazing rewards.", color: "bg-purple-50", iconColor: "text-purple-600" },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
        <img src="https://pddykfluvauwsfleqsfk.supabase.co/storage/v1/object/public/assets/logo-icon.png" alt="Logo" className="w-5 h-5 object-contain" />
      </div>
      <span className="font-black text-slate-900 text-xl tracking-tight">AirdropSailor</span>
    </Link>
  );
}

const SocialIcon = ({ path }) => (
  <a href="#" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors">
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d={path} />
    </svg>
  </a>
);

export default function LandingPage() {
  // 🚀 Now we check if they are already logged in!
  const { authenticated, login } = useAuth(); 

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 overflow-x-hidden">
      
      {/* 1. Header */}
      <header className="max-w-[1300px] mx-auto px-6 py-6 flex items-center justify-between relative z-50">
        <Logo />
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {nav.map((n) => (
            <Link key={n.name} to={n.path} className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors">
              {n.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {/* 🚀 Dynamic Header Buttons */}
          {authenticated ? (
            <Link to="/" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <button onClick={login} className="px-5 py-2.5 text-sm font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all">
                Log in
              </button>
              <button onClick={login} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all">
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[800px] bg-gradient-to-b from-blue-50/50 to-white -z-10 rounded-b-[100px]"></div>

        <div className="max-w-[1300px] mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center relative">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full mb-6 border border-blue-200/50">
              <Compass className="w-3.5 h-3.5" /> Your Compass in Web3
            </span>
            <h1 className="text-[44px] lg:text-[64px] font-black tracking-tight leading-[1.1] text-slate-900 mb-6">
              Find Opportunities.<br />
              Earn XP. <span className="text-blue-600">Grow Together.</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-[480px] leading-relaxed mb-8 font-medium">
              AirdropSailor helps you discover quality airdrops, complete meaningful tasks, track your progress, and level up with XP — all in one place.
            </p>
            <div className="flex flex-wrap gap-4">
              {/* 🚀 Dynamic Hero CTA */}
              {authenticated ? (
                <Link to="/" className="px-8 py-3.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all inline-flex items-center gap-2">
                  Go to Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button onClick={login} className="px-8 py-3.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5 transition-all inline-flex items-center gap-2">
                  Start Your Journey <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <Link to="/" className="px-8 py-3.5 bg-white border border-slate-200 text-sm font-bold rounded-xl hover:border-blue-300 text-slate-700 hover:text-blue-600 transition-all inline-block">
                Explore Features
              </Link>
            </div>
          </div>

          <div className="relative z-10 hidden lg:block">
            <img 
              src={heroShip} 
              alt="Sailing ship" 
              className="w-[120%] max-w-[800px] h-auto object-contain scale-110 translate-x-12 -translate-y-8 drop-shadow-2xl" 
            />
          </div>
        </div>

        <div className="max-w-[1300px] mx-auto px-6 mt-16 relative z-20">
          <div className="grid md:grid-cols-3 gap-6">
            {heroBullets.map((b) => (
              <div key={b.title} className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-black text-slate-900">{b.title}</div>
                  <div className="text-xs text-slate-500 mt-1 font-medium">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Community Section */}
      <section className="max-w-[1300px] mx-auto px-6 py-16">
        <h3 className="text-center text-xl font-black text-slate-900 mb-10">Built for the Web3 Community</h3>
        <div className="bg-slate-50/80 rounded-[32px] p-8 lg:p-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {community.map((c) => (
            <div key={c.title} className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                <c.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-black text-slate-900">{c.title}</div>
                <div className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Features Section */}
      <section className="max-w-[1300px] mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Everything You Need to <span className="text-blue-600">Sail Ahead</span>
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((f) => (
            <div key={f.title} className="bg-white border border-slate-100 rounded-[24px] p-8 shadow-[0_2px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-blue-100 transition-all duration-300 group">
              <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                <f.icon className={`w-7 h-7 ${f.color}`} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 min-h-[60px] font-medium">{f.desc}</p>
              <Link to={f.path} className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 group/link">
                {f.cta} <ArrowRight className="w-4 h-4 transform group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 5. How it Works */}
      <section className="max-w-[1000px] mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            How <span className="text-blue-600">AirdropSailor</span> Works
          </h2>
          <p className="text-slate-500 font-medium mt-3">Start your journey in 3 simple steps.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          <div className="hidden md:block absolute top-10 left-[16%] right-[16%] border-t-2 border-dashed border-slate-200 -z-10" />
          
          {steps.map((s) => (
            <div key={s.n} className="text-center flex flex-col items-center">
              <div className="relative mb-6">
                <div className={`w-20 h-20 rounded-full ${s.color} border-4 border-white shadow-sm flex items-center justify-center`}>
                  <s.icon className={`w-8 h-8 ${s.iconColor}`} />
                </div>
                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shadow-md border-2 border-white">
                  {s.n}
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[240px]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CTA Banner */}
      <section className="max-w-[1300px] mx-auto px-6 pb-24">
        <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-8 py-12 lg:px-20 lg:py-16 flex flex-col lg:flex-row items-center justify-between shadow-2xl shadow-blue-900/20">
          
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl mix-blend-overlay"></div>
            <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-400 rounded-full blur-3xl mix-blend-overlay"></div>
          </div>

          <div className="relative z-10 w-full lg:w-1/2 flex justify-center lg:justify-start mb-10 lg:mb-0">
            <img src={ctaChest} alt="Treasure" className="w-[280px] lg:w-[360px] drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
          </div>

          <div className="relative z-10 w-full lg:w-1/2 text-center lg:text-left">
            <h2 className="text-3xl lg:text-[40px] font-black text-white tracking-tight mb-4">
              Ready to Set Sail?
            </h2>
            <p className="text-blue-100 text-lg font-medium mb-8">
              Join AirdropSailor and start your Web3 adventure today.
            </p>
            {/* 🚀 Dynamic Bottom Banner CTA */}
            {authenticated ? (
              <Link to="/" className="px-8 py-4 bg-white text-blue-700 text-sm font-black rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center gap-2">
                Explore Opportunities <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button onClick={login} className="px-8 py-4 bg-white text-blue-700 text-sm font-black rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center gap-2">
                Create Free Account <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-[1300px] mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 mb-16">
            
            {/* Logo & Socials */}
            <div className="lg:col-span-2">
              <Logo />
              <p className="mt-4 text-sm text-slate-500 font-medium leading-relaxed max-w-[280px]">
                Your trusted compass in the Web3 ocean. Discover, track, and earn rewards like a true sailor.
              </p>
              <div className="flex gap-3 mt-6">
                <SocialIcon path="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                <SocialIcon path="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                <SocialIcon path="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                <SocialIcon path="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <div className="font-black text-slate-900 mb-4">Product</div>
              <ul className="space-y-3 text-sm font-medium text-slate-500">
                <li><Link to="/" className="hover:text-blue-600 transition-colors">Airdrops</Link></li>
                <li><Link to="/early-tasks" className="hover:text-blue-600 transition-colors">Tasks</Link></li>
                <li><Link to="/xp-levels" className="hover:text-blue-600 transition-colors">XP & Levels</Link></li>
                <li><Link to="/profile/overview" className="hover:text-blue-600 transition-colors">Tracker</Link></li>
                <li><Link to="/marketplace" className="hover:text-blue-600 transition-colors">Marketplace</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-black text-slate-900 mb-4">Company</div>
              <ul className="space-y-3 text-sm font-medium text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <div className="font-black text-slate-900 mb-4">Resources</div>
              <ul className="space-y-3 text-sm font-medium text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition-colors">Docs</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Guides</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-blue-600 transition-colors">Support</a></li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="font-black text-slate-900 mb-2">Stay in the Loop</div>
                <p className="text-sm text-slate-500 font-medium mb-4 leading-relaxed">
                  Subscribe to get the latest airdrops and platform updates.
                </p>
                <div className="flex flex-col gap-3">
                  <input 
                    placeholder="Enter your email" 
                    className="w-full px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50" 
                  />
                  <button className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-medium text-slate-400">© 2026 AirdropSailor. All rights reserved.</div>
            <div className="flex gap-6 text-sm font-medium text-slate-400">
              <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}