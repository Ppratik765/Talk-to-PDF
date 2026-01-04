'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Check, Sparkles, Zap, Shield, Mail } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-blue-500/30">
      
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-lg border-b border-white/5 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Talk-to-PDF
          </div>
          <div className="flex gap-4">
            {['Login', 'Signup', 'Contact', 'Pricing'].map((item) => (
              <Link 
                key={item}
                href={item === 'Contact' ? '#contact' : item === 'Pricing' ? '#pricing' : `/${item.toLowerCase().replace(' ', '')}`}
              >
                <button className="px-6 py-2 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-500 transition-all font-medium text-sm rounded-none uppercase tracking-wide">
                  {item}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-40 pb-20 px-6 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10" />
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl font-bold tracking-tight">
            Chat with your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 animate-pulse">
              Documents.
            </span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Transform static PDFs into dynamic conversations. Built with Gemini AI for lightning-fast, context-aware answers.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex justify-center gap-4">
            <Link href="/signup">
              <button className="px-8 py-4 bg-white text-black font-bold text-lg hover:scale-105 transition-transform rounded-none flex items-center gap-2">
                Get Started <ArrowRight size={20} />
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* SCROLL INSTRUCTIONS */}
      <section className="py-32 px-6 bg-zinc-900/30">
        <div className="max-w-5xl mx-auto space-y-32">
          {[
            { title: "Upload", desc: "Drag & drop your PDFs, Docs, or PPTs.", icon: <Zap className="text-yellow-400" size={40} /> },
            { title: "Analyze", desc: "Our AI vectorizes your content securely.", icon: <Shield className="text-emerald-400" size={40} /> },
            { title: "Chat", desc: "Ask anything and get instant answers.", icon: <Sparkles className="text-purple-400" size={40} /> }
          ].map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className={`flex items-center gap-12 ${i % 2 !== 0 ? 'flex-row-reverse text-right' : ''}`}
            >
              <div className="flex-1 space-y-4">
                <div className={`w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 border border-zinc-700 ${i % 2 !== 0 ? 'ml-auto' : ''}`}>
                  {step.icon}
                </div>
                <h3 className="text-4xl font-bold text-white">{step.title}</h3>
                <p className="text-xl text-zinc-400">{step.desc}</p>
              </div>
              <div className="flex-1 h-64 bg-zinc-800/50 rounded-3xl border border-zinc-700/50 backdrop-blur-sm flex items-center justify-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 group-hover:opacity-100 transition-opacity" />
                 <span className="text-9xl font-black text-zinc-800 select-none opacity-50">{i + 1}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-32 px-6">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-center mb-16">Simple Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Free", price: "$0", features: ["10 PDF uploads", "Basic Chat Model", "Community Support"] },
              { name: "Hobbyist", price: "$9", features: ["Unlimited uploads", "Faster Responses", "Email Support", "Priority Queue"] },
              { name: "Professional", price: "$29", features: ["Team Collaboration", "API Access", "24/7 Support", "Custom Models", "SSO"] }
            ].map((plan, i) => (
              <motion.div 
                key={i}
                variants={fadeInUp}
                className={`p-8 bg-zinc-900 border ${i === 1 ? 'border-blue-500 shadow-2xl shadow-blue-900/20 scale-105 z-10' : 'border-zinc-800'} relative`}
              >
                {i === 1 && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-xs font-bold px-3 py-1 uppercase tracking-wider">Popular</div>}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-6">{plan.price}<span className="text-base font-normal text-zinc-500">/mo</span></div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-zinc-400 text-sm">
                      <Check size={16} className="text-blue-500" /> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 font-semibold transition-colors ${i === 1 ? 'bg-blue-600 hover:bg-blue-500' : 'bg-zinc-800 hover:bg-zinc-700'}`}>
                  Choose Plan
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-32 px-6 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
          <div className="p-8 border border-zinc-700 bg-zinc-950 flex flex-col items-center gap-4">
             <Mail size={32} className="text-zinc-500" />
             <p className="text-zinc-400">Questions? Bugs? Feature requests?</p>
             <a href="mailto:hello@talktopdf.com" className="text-2xl font-mono text-blue-400 hover:underline">
               hello@talktopdf.com
             </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center text-zinc-600 text-sm">
        © 2024 Talk-to-PDF. All rights reserved.
      </footer>
    </div>
  );
}
