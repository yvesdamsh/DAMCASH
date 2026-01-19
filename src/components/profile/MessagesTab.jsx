import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserAvatar from '@/components/ui/UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X } from 'lucide-react';

export default function MessagesTab({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  const loadConversations = async () => {
    try {
      const sent = await base44.entities.Message.filter({ sender_id: user.id }, '-created_date');
      const received = await base44.entities.Message.filter({ receiver_id: user.id }, '-created_date');
      
      const allMessages = [...sent, ...received];
      const conversationMap = new Map();

      allMessages.forEach(msg => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherName = msg.sender_id === user.id ? msg.receiver_name : msg.sender_name;
        const otherAvatar = msg.sender_id === user.id ? undefined : msg.sender_avatar;
        
        if (!conversationMap.has(otherId)) {
          conversationMap.set(otherId, {
            id: otherId,
            name: otherName,
            avatar: otherAvatar,
            lastMessage: msg.content,
            lastTime: msg.created_date,
            unread: msg.receiver_id === user.id && !msg.is_read ? 1 : 0
          });
        } else {
          const conv = conversationMap.get(otherId);
          if (msg.receiver_id === user.id && !msg.is_read) conv.unread++;
        }
      });

      setConversations(Array.from(conversationMap.values()).sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime)));
    } catch (e) {
      console.error('Erreur chargement conversations:', e);
    }
  };

  const openConversation = async (conversation) => {
    setSelectedConversation(conversation);
    try {
      const sent = await base44.entities.Message.filter({ sender_id: user.id, receiver_id: conversation.id }, 'created_date');
      const received = await base44.entities.Message.filter({ receiver_id: user.id, sender_id: conversation.id }, 'created_date');
      
      setMessages([...sent, ...received].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));

      // Marquer comme lus
      received.forEach(async (msg) => {
        if (!msg.is_read) {
          await base44.entities.Message.update(msg.id, { is_read: true, read_at: new Date().toISOString() });
        }
      });
    } catch (e) {
      console.error('Erreur chargement messages:', e);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setLoading(true);
      await base44.entities.Message.create({
        sender_id: user.id,
        sender_name: user.full_name,
        sender_avatar: user.avatar_url,
        receiver_id: selectedConversation.id,
        receiver_name: selectedConversation.name,
        content: newMessage,
        is_read: false
      });
      
      setNewMessage('');
      openConversation(selectedConversation);
      loadConversations();
    } catch (e) {
      console.error('Erreur envoi message:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* Liste conversations */}
      <div className="bg-white/5 border border-[#D4A574]/20 rounded-lg overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-1 p-3">
            {conversations.length === 0 ? (
              <p className="text-center text-[#D4A574]/50 text-sm py-8">Aucune conversation</p>
            ) : (
              conversations.map(conv => (
                <motion.button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full text-left p-3 rounded-lg transition-all flex items-center gap-2 ${
                    selectedConversation?.id === conv.id
                      ? 'bg-[#D4A574]/30 border border-[#D4A574]/50'
                      : 'hover:bg-white/5'
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <UserAvatar user={{ full_name: conv.name, avatar_url: conv.avatar }} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{conv.name}</p>
                    <p className="text-xs text-[#D4A574]/50 truncate">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </motion.button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat */}
      <div className="col-span-1 md:col-span-2 bg-white/5 border border-[#D4A574]/20 rounded-lg flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-[#D4A574]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar user={{ full_name: selectedConversation.name, avatar_url: selectedConversation.avatar }} size="sm" />
                <p className="font-semibold">{selectedConversation.name}</p>
              </div>
              <button onClick={() => setSelectedConversation(null)} className="hover:bg-white/10 p-2 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender_id === user.id
                          ? 'bg-[#D4A574] text-[#2C1810]'
                          : 'bg-white/10 text-[#F5E6D3]'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(msg.created_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-[#D4A574]/20 flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Votre message..."
                className="bg-white/5 border-[#D4A574]/30 text-[#F5E6D3]"
              />
              <Button
                onClick={handleSendMessage}
                disabled={loading || !newMessage.trim()}
                className="bg-[#D4A574] hover:bg-[#D4A574]/80 text-[#2C1810] font-bold"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-[#D4A574]/50">
            Sélectionnez une conversation
          </div>
        )}
      </div>
    </div>
  );
}