
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, Clock, MessageCircle, Loader2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ChatMessage, AuthState } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  auth: AuthState;
  isDarkMode?: boolean;
}

const ChatModal: React.FC<Props> = ({ isOpen, onClose, auth, isDarkMode = true }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !auth.outlet) return;

    const chatPath = `chats`;
    const q = query(
      collection(db, chatPath),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgs);
      setIsLoading(false);
      
      // Auto scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, chatPath);
    });

    return () => unsubscribe();
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.outlet) return;

    const chatPath = `chats`;
    const messageData = {
      senderName: auth.username,
      senderRole: auth.role || 'Staff',
      text: newMessage.trim(),
      timestamp: Date.now(), // Fallback for local sort
      outletId: auth.outlet
    };

    try {
      setNewMessage('');
      await addDoc(collection(db, chatPath), {
        ...messageData,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, chatPath);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-2xl bg-dark-900 border border-gold-900/30 rounded-[2.5rem] shadow-2xl flex flex-col h-[80vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-dark-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gold-500/10 rounded-2xl flex items-center justify-center text-gold-500 border border-gold-500/20 shadow-lg">
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-black text-white uppercase tracking-tight">Inter-Outlet Live Chat</h3>
              <p className="text-[10px] text-gold-500 font-bold uppercase tracking-widest">Connect with All Branches</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-white/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-white/5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
        >
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 size={32} className="animate-spin text-gold-500" />
              <p className="text-[10px] font-black uppercase tracking-widest">Entering Secure Network...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-gray-700">
                <MessageCircle size={40} />
              </div>
              <div>
                <p className="text-white font-black uppercase text-sm tracking-tight">No transmissions yet</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Broadcast a message to all outlets</p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderName === auth.username && msg.outletId === auth.outlet;
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1 px-2">
                       <span className="text-[9px] font-black text-gold-500 uppercase tracking-widest">{msg.senderName.split(' ')[0]}</span>
                       <span className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">[{msg.outletId}]</span>
                       <span className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">{msg.senderRole}</span>
                    </div>
                    <div className={`p-4 rounded-3xl text-sm ${isMe ? 'bg-gold-500 text-black rounded-tr-none shadow-[0_5px_15px_rgba(212,175,55,0.2)]' : 'bg-white/5 text-white border border-white/10 rounded-tl-none'} transition-all hover:scale-[1.02]`}>
                       <p className="leading-relaxed font-medium">{msg.text}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-2 opacity-40">
                       <Clock size={8} />
                       <span className="text-[8px] font-bold uppercase">
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Sending...'}
                       </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/5 bg-dark-800">
          <form onSubmit={handleSendMessage} className="relative flex gap-3">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message to staff..." 
              className="flex-1 bg-dark-900 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white outline-none focus:border-gold-500 transition-all shadow-inner"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:grayscale text-black px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-gold-500/20 active:scale-95 flex items-center gap-2"
            >
              Send <Send size={16} />
            </button>
          </form>
          <p className="text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em] mt-4 text-center">
            Standard Operating Procedure: All messages are logged for operational review
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatModal;
