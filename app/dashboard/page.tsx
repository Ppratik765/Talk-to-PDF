'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Send, Loader2, File, X, MessageSquare, 
  Menu, FileSpreadsheet, FileIcon 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const FileItem = ({ name }: { name: string }) => {
  const isPdf = name.endsWith('.pdf');
  const isDoc = name.endsWith('.docx');
  const isPpt = name.endsWith('.pptx');

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:bg-zinc-800 transition-colors group"
    >
      <div className={`p-2 rounded-lg ${
        isPdf ? 'bg-red-500/20 text-red-400' :
        isDoc ? 'bg-blue-500/20 text-blue-400' :
        isPpt ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-500/20 text-zinc-400'
      }`}>
        {isPdf ? <FileText size={18} /> : 
         isDoc ? <FileIcon size={18} /> : 
         isPpt ? <FileSpreadsheet size={18} /> : <File size={18} />}
      </div>
      <span className="text-sm font-medium text-zinc-300 truncate w-32">{name}</span>
    </motion.div>
  );
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! I am ready to study. Upload your documents and ask me anything.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsUploading(true);

    const newFiles = Array.from(e.target.files);
    
    for (const file of newFiles) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/ingest', { method: 'POST', body: formData });
        if (res.ok) {
          setFiles((prev) => [...prev, file.name]);
        }
      } catch (error) {
        console.error("Upload failed", error);
      }
    }
    setIsUploading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await response.json();
      const botMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: data.content };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-r border-zinc-800 bg-zinc-900/50 backdrop-blur-xl flex flex-col hidden md:flex"
          >
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
              <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                My Notes
              </span>
              <button onClick={() => setSidebarOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {files.length === 0 ? (
                <div className="text-center mt-10 text-zinc-600">
                  <span className="text-sm">No files uploaded yet.</span>
                </div>
              ) : (
                files.map((f, i) => <FileItem key={i} name={f} />)
              )}
            </div>

            <div className="p-4 border-t border-zinc-800">
              <label className={`
                flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold cursor-pointer transition-all
                ${isUploading ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}
              `}>
                {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                {isUploading ? 'Processing...' : 'Upload Notes'}
                <input type="file" multiple accept=".pdf,.docx,.pptx" className="hidden" onChange={handleFileUpload} disabled={isUploading}/>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950">
        
        {/* HEADER */}
        <div className="h-16 border-b border-zinc-800/50 flex items-center px-6 justify-between bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400">
                <Menu size={20} />
              </button>
            )}
                <h1 className="font-semibold text-lg flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-500" /> 
                Chat Assistant
                </h1>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-xs text-zinc-500 font-mono bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                    Model: Gemini 2.5 Flash
                </div>
                <button onClick={handleSignOut} className="text-sm text-red-400 hover:text-red-300">
                    Sign Out
                </button>
            </div>
        </div>

        {/* MESSAGES LIST */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {messages.map((m) => {
            // 1. If it's a user, render normally
            if (m.role === 'user') {
              return (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-end"
                >
                  <div className="max-w-[85%] md:max-w-[70%] p-4 rounded-2xl shadow-sm bg-blue-600 text-white rounded-br-none">
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </motion.div>
              );
            }
        
            // 2. If it's the AI, split the content by '|||' and render multiple bubbles
            const parts = m.content.split('|||').filter(part => part.trim() !== '');
            
            return (
              <div key={m.id} className="space-y-4"> {/* Container for the group of bubbles */}
                {parts.map((part, index) => (
                  <motion.div 
                    key={`${m.id}-${index}`} // Unique key for each sub-bubble
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }} // Stagger effect: bubbles appear one by one
                    className="flex justify-start"
                  >
                    <div className={`
                      max-w-[85%] md:max-w-[70%] p-5 rounded-2xl shadow-sm 
                      bg-zinc-800 text-zinc-200 border border-zinc-700 
                      ${index === 0 ? 'rounded-bl-none' : 'ml-0'} // Only first bubble has the "chat tail"
                    `}>
                      <div className="prose prose-invert prose-sm max-w-none 
                        prose-p:leading-relaxed prose-p:mb-4 
                        prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700 
                        prose-code:text-blue-300 prose-code:bg-zinc-900/50 prose-code:px-1 prose-code:rounded
                        prose-table:border-collapse prose-table:border prose-table:border-zinc-700
                        prose-th:bg-zinc-900 prose-th:p-3 prose-th:border prose-th:border-zinc-700
                        prose-td:p-3 prose-td:border prose-td:border-zinc-700
                      ">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {part}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-none border border-zinc-700">
                <Loader2 className="animate-spin w-5 h-5 text-zinc-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT AREA */}
        <div className="p-4 bg-zinc-950/80 backdrop-blur-lg border-t border-zinc-800/50">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl pl-5 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:bg-zinc-700 transition-all"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

}



