import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ChatWindow({ roomId, user, maxHeight = '400px', compact = false }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charger messages existants
  useEffect(() => {
    if (!roomId) return;

    const loadMessages = async () => {
      try {
        const data = await base44.entities.ChatMessage.filter(
          { room_id: roomId },
          'created_date',
          50
        );
        setMessages(Array.isArray(data) ? data : []);
      } catch (e) {
        console.log('Load messages error:', e?.message || e);
      }
    };

    loadMessages();
  }, [roomId]);

  // Subscribe aux nouveaux messages en temps réel
  useEffect(() => {
    if (!roomId) return;

    const unsubscribe = base44.entities.ChatMessage?.subscribe?.((event) => {
      if (event?.type !== 'create') return;
      if (!event?.data || event.data.room_id !== roomId) return;
      
      setMessages(prev => {
        const exists = prev.some(m => m.id === event.data.id);
        if (exists) return prev;
        return [...prev, event.data];
      });
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [roomId]);

  const handleSendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !user || !roomId) return;

    setLoading(true);
    try {
      await base44.entities.ChatMessage.create({
        room_id: roomId,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_email: user.email,
        content: text,
        is_system: false
      });

      setNewMessage('');
    } catch (e) {
      console.log('Send message error:', e?.message || e);
      toast.error('Erreur envoi');
    } finally {
      setLoading(false);
    }
  };

  const displayMessages = compact ? messages.slice(-10) : messages;

  return (
    <div className="flex flex-col h-full bg-[#2C1810]/50 border border-[#D4A574]/20 rounded-xl overflow-hidden">
      {/* Messages */}
      <ScrollArea className="flex-1" style={{ maxHeight }}>
        <div className="p-4 space-y-3">
          <AnimatePresence>
            {displayMessages.map((msg, idx) => {
              const isOwnMessage = msg.sender_id === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-[#D4A574]/20 border border-[#D4A574]/40 text-[#F5E6D3]'
                        : 'bg-white/10 border border-[#D4A574]/20 text-[#D4A574]'
                    }`}
                  >
                    {!isOwnMessage && msg.sender_name && (
                      <p className="text-xs font-bold mb-1 opacity-70">{msg.sender_name}</p>
                    )}
                    <p className="text-sm break-words">{msg.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {format(new Date(msg.created_date), 'HH:mm', { locale: fr })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-[#D4A574]/20 flex gap-2">
        <Input
          placeholder="Message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={loading}
          className="bg-white/5 border-[#D4A574]/30 text-white placeholder:text-[#D4A574]/50 text-sm"
        />
        <Button
          onClick={handleSendMessage}
          disabled={loading || !newMessage.trim()}
          size="sm"
          className="bg-[#D4A574]/20 hover:bg-[#D4A574]/40 text-[#D4A574] px-3"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}