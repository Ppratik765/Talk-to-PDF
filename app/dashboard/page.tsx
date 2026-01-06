'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, Send, Loader2, X, MessageSquare, 
  Menu, LogOut, FileText, GripVertical, CloudUpload 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// --- TYPES ---
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type FileData = {
  name: string;
  url: string; // The Blob URL for the iframe
  type: string;
};

export default function Dashboard() {
  // --- STATE ---
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: 'Hello! I am ready to study. Upload your documents and ask me anything.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // DRAG & DROP STATE
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  
  // FILES STATE
  const [files, setFiles] = useState<FileData[]>([]);
  const [activeFile, setActiveFile] = useState<FileData | null>(null);

  // LAYOUT STATE
  const [leftWidth, setLeftWidth] = useState(50); // Percentage width of left panel
  const [isDragging, setIsDragging] = useState(false);

  // SCROLL REFS
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // --- HANDLERS ---

  // 1. Resizable Logic
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // 2. Chat Scroll Logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleBack = () => router.push('/');

  // 3. Shared File Processing Logic (Used by both Input and Drag & Drop)
  const processFiles = async (filesList: File[]) => {
    if (filesList.length === 0) return;
    setIsUploading(true);
    setIsDraggingFile(false); // Reset drag state

    for (const file of filesList) {
      // A. Create Blob URL for Instant Viewing
      const fileUrl = URL.createObjectURL(file);
      const newFile: FileData = { name: file.name, url: fileUrl, type: file.type };
      
      setFiles((prev) => [...prev, newFile]);
      setActiveFile(newFile); // Switch view to new file

      // B. Upload to Backend for Vectorization
      const formData = new FormData();
      formData.append('file', file);
      try {
        await fetch('/api/ingest', { method: 'POST', body: formData });
      } catch (error) { console.error("Upload failed", error); }
    }
    setIsUploading(false);
  };

  // 4. File Input Change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
  };

  // 5. Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  // 6. Delete File
  const handleDeleteFile = async (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation(); 
    const updatedFiles = files.filter(f => f.name !== fileName);
    setFiles(updatedFiles);
    
    if (activeFile?.name === fileName) {
      setActiveFile(updatedFiles.length > 0 ? updatedFiles[updatedFiles.length - 1] : null);
    }

    try {
      await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `I have removed "${fileName}" from my memory.` }]);
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // 7. Send Message
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

      if (!response.body) throw new Error('No response body');

      const aiMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: aiMessageId, role: 'assistant', content: '' }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedContent = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        accumulatedContent += chunkValue;

        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId ? { ...msg, content: accumulatedContent } : msg
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { id: 'error', role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden"
      // Global Drop Zone (Optional: allows dropping anywhere)
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      
      {/* --- TOP BAR --- */}
      <div className="h-14 border-b border-zinc-800 bg-zinc-900/80 flex items-center px-4 justify-between select-none z-20">
        
        {/* Left: Document Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 mr-4">
          <div className="flex items-center gap-2 mr-4 shrink-0">
             <span className="font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mr-2">
                My Docs
             </span>
             {/* CLEARER UPLOAD BUTTON */}
             <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-white transition-all flex items-center gap-2 text-xs font-semibold shadow-lg shadow-blue-500/20">
                <Upload size={14} />
                Upload
                <input type="file" multiple accept=".pdf,.docx,.pptx" className="hidden" onChange={handleFileUpload} />
             </label>
          </div>

          {files.map((file) => (
            <div 
              key={file.name}
              onClick={() => setActiveFile(file)}
              className={`
                group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-all min-w-[120px] max-w-[200px] shrink-0
                ${activeFile?.name === file.name 
                  ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                  : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800'}
              `}
            >
              <FileText size={14} className="shrink-0" />
              <span className="truncate">{file.name}</span>
              <button 
                onClick={(e) => handleDeleteFile(e, file.name)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all bg-zinc-900 shadow-md"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-xs text-zinc-500 font-mono hidden md:block">Gemma-3 27B</div>
          <button onClick={handleBack} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
            <LogOut size={16} /> Exit
          </button>
        </div>
      </div>

      {/* --- MAIN SPLIT VIEW --- */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANE: Document Viewer */}
        <div 
          className="bg-zinc-900/30 flex flex-col relative"
          style={{ width: `${leftWidth}%` }}
        >
          {/* DRAG OVERLAY FEEDBACK */}
          {isDraggingFile && (
            <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 z-50 flex flex-col items-center justify-center backdrop-blur-sm pointer-events-none">
              <CloudUpload size={64} className="text-blue-400 animate-bounce" />
              <h2 className="text-xl font-bold text-blue-200 mt-4">Drop files here</h2>
            </div>
          )}

          {activeFile ? (
            activeFile.type === 'application/pdf' ? (
              <iframe 
                src={activeFile.url} 
                className="w-full h-full border-none"
                title="PDF Viewer"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-4 p-8 text-center">
                <FileText size={48} />
                <p>Preview not available for this format.</p>
                <p className="text-sm text-zinc-600">You can still chat with it!</p>
              </div>
            )
          ) : (
            // --- EMPTY STATE / DROP ZONE ---
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-6 p-8">
               <div className="w-24 h-24 bg-zinc-800/50 rounded-full flex items-center justify-center border-2 border-dashed border-zinc-700">
                  <CloudUpload size={48} className="text-zinc-500" />
               </div>
               <div className="text-center space-y-2">
                 <h3 className="text-xl font-semibold text-zinc-300">Upload your documents</h3>
                 <p className="text-sm max-w-xs mx-auto">Drag & drop files here, or click the button below.</p>
               </div>
               
               {/* BIG CLEAR BUTTON */}
               <label className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-bold cursor-pointer transition-all hover:scale-105
                  ${isUploading 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'}
               `}>
                 {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                 {isUploading ? 'Processing...' : 'Select Files'}
                 <input type="file" multiple accept=".pdf,.docx,.pptx" className="hidden" onChange={handleFileUpload} disabled={isUploading}/>
               </label>

               <p className="text-xs text-zinc-700 mt-4">Supports PDF, DOCX, PPTX</p>
            </div>
          )}
        </div>

        {/* RESIZER HANDLE */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-1 bg-zinc-800 hover:bg-blue-500 cursor-col-resize flex items-center justify-center z-10 transition-colors ${isDragging ? 'bg-blue-500 w-1.5' : ''}`}
        >
           <GripVertical size={12} className="text-zinc-500" />
        </div>

        {/* RIGHT PANE: Chat Interface */}
        <div className="flex-1 flex flex-col bg-zinc-950 min-w-[300px]">
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.map((m) => {
              if (m.role === 'user') {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] p-4 rounded-2xl shadow-sm bg-blue-600 text-white rounded-br-none">
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                );
              }

              // Natural Splitting by Headers
              const parts = m.content.split(/\n(?=#{2,3} )/).filter(part => part.trim() !== '');
              const bubbles = parts.length > 0 ? parts : [''];

              return (
                <div key={m.id} className="space-y-4">
                  {bubbles.map((part, index) => (
                    <div key={`${m.id}-${index}`} className="flex justify-start">
                      <div className={`max-w-[90%] p-5 rounded-2xl shadow-sm bg-zinc-800 text-zinc-200 border border-zinc-700 ${index === 0 ? 'rounded-bl-none' : 'ml-0'}`}>
                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700">
                          <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
                            {part}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                 <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-none border border-zinc-700">
                    <Loader2 className="animate-spin w-5 h-5 text-zinc-400" />
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="Ask about your document..." 
                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-xl pl-5 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()} 
                className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}