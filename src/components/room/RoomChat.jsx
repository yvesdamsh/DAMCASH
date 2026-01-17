import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoomChat({ roomId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (roomId) {
      loadMessages();
      subscribeToMessages();
    }
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.RoomMessage.filter(
        { room_id: roomId },
        'created_date',
        50
      );
      setMessages(msgs);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const unsubscribe = base44.entities.RoomMessage.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      if (event.type === 'create') {
        setMessages((prev) => [...prev, event.data]);
      }
    });
    return unsubscribe;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    try {
      await base44.entities.RoomMessage.create({
        room_id: roomId,
        user_id: user.id,
        user_name: user.full_name,
        content: newMessage,
        timestamp: new Date().toISOString()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#2C1810] rounded-lg border border-[#D4A574]/30">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex gap-2 ${
                msg.user_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs rounded-lg p-3 ${
                  msg.user_id === user?.id
                    ? 'bg-amber-600/20 border border-amber-500/50 text-[#F5E6D3]'
                    : 'bg-[#5D3A1A] border border-[#D4A574]/30 text-[#F5E6D3]'
                }`}
              >
                {msg.user_id !== user?.id && (
                  <p className="text-xs font-semibold text-[#D4A574] mb-1">
                    {msg.user_name}
                  </p>
                )}
                <p className="text-sm break-words">{msg.content}</p>
                <p className="text-xs text-[#D4A574]/50 mt-1">
                  {new Date(msg.timestamp || msg.created_date).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="p-4 border-t border-[#D4A574]/30 flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Votre message..."
          className="flex-1 bg-[#5D3A1A] border border-[#D4A574]/30 rounded-lg px-3 py-2 text-[#F5E6D3] placeholder-[#D4A574]/50 focus:outline-none focus:border-[#D4A574]"
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={!newMessage.trim() || loading}
          className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
          size="icon"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}