import React, { useState, useEffect, useRef } from 'react';
import { Send, Lock, User, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';
import api from '../utils/api';
import { useAuthStore } from '../store/auth.store';
import { encryptMessage, decryptMessage } from '../utils/crypto';

interface Conversation {
  id: string;
  user1Id: string;
  user2Id: string;
  otherUser: {
    id: string;
    username: string;
    fullName: string;
    publicKey: string;
  };
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  encryptedContent: string;
  iv: string;
  encryptedKeyForReceiver: string;
  encryptedKeyForSender: string;
  createdAt: string;
  decryptedText?: string; // added on client side
}

const Chats = () => {
  const currentUser = useAuthStore(state => state.user);
  const privateKey = useAuthStore(state => state.privateKey);
  const publicKey = useAuthStore(state => state.publicKey);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chats');
      setConversations(res.data);
    } catch (error) {
      console.error('Failed to fetch chats', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchMessages = async (conversation: Conversation) => {
    setIsLoadingMessages(true);
    try {
      const res = await api.get(`/chats/${conversation.id}/messages`);
      const encryptedMessages: Message[] = res.data;
      
      // Decrypt all messages
      if (privateKey) {
        const decryptedMessages = await Promise.all(
          encryptedMessages.map(async (msg) => {
            try {
              // If the sender is deleted and this message's content was wiped
              if (conversation.otherUser.username === 'deleted' && msg.senderId !== currentUser?.id && msg.encryptedContent === '') {
                return { ...msg, decryptedText: 'His/her account permanently deleted.' };
              }

              // Determine which encrypted key to use
              const encryptedKeyToUse = msg.senderId === currentUser?.id 
                ? msg.encryptedKeyForSender 
                : msg.encryptedKeyForReceiver;
                
              const text = await decryptMessage(
                msg.encryptedContent,
                msg.iv,
                encryptedKeyToUse,
                privateKey
              );
              return { ...msg, decryptedText: text };
            } catch (err) {
              console.error('Failed to decrypt message', msg.id, err);
              return { ...msg, decryptedText: '[Failed to decrypt message]' };
            }
          })
        );
        setMessages(decryptedMessages);
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
      // Setup polling for new messages for simplicity
      const interval = setInterval(() => fetchMessages(activeChat), 5000);
      return () => clearInterval(interval);
    }
  }, [activeChat, privateKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat || !publicKey) return;

    const textToSend = inputText;
    setInputText('');
    setIsSending(true);

    try {
      // 1. Encrypt message E2E
      const encryptedPayload = await encryptMessage(
        textToSend,
        activeChat.otherUser.publicKey, // recipient's public key
        publicKey // sender's own public key
      );

      // 2. Send to backend
      await api.post('/chats/messages/send', {
        conversationId: activeChat.id,
        receiverId: activeChat.otherUser.id,
        ...encryptedPayload
      });

      // 3. Refresh messages
      fetchMessages(activeChat);
    } catch (error) {
      console.error('Failed to send message', error);
      setInputText(textToSend); // restore input
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full max-h-screen overflow-hidden">
      {/* Chat List (Sidebar) */}
      <div className={clsx(
        "w-full md:w-80 lg:w-96 border-r border-border-subtle bg-bg-panel flex flex-col transition-all duration-300",
        activeChat ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-border-subtle">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Chats <Lock className="w-4 h-4 text-brand-primary" />
          </h2>
          <p className="text-xs text-brand-primary/80 mt-1">End-to-End Encrypted</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {isLoadingChats ? (
            <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-8 text-text-secondary">
              No chats yet. Go to All Users to add friends!
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={clsx(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                    activeChat?.id === chat.id 
                      ? "bg-brand-primary/10 border-l-2 border-brand-primary" 
                      : "hover:bg-bg-panel-hover border-l-2 border-transparent"
                  )}
                >
                  <div className="w-12 h-12 bg-bg-app rounded-full flex items-center justify-center shrink-0 border border-border-subtle">
                    <span className="text-lg font-bold text-text-primary">
                      {chat.otherUser.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary truncate">{chat.otherUser.fullName}</h3>
                    <p className="text-xs text-text-secondary truncate">Tap to view secure messages</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Conversation Area */}
      <div className={clsx(
        "flex-1 flex flex-col bg-bg-app",
        !activeChat ? "hidden md:flex" : "flex"
      )}>
        {activeChat ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-border-subtle bg-bg-panel flex items-center px-4 shrink-0">
              <button 
                onClick={() => setActiveChat(null)}
                className="md:hidden p-2 mr-2 -ml-2 text-text-secondary hover:text-text-primary"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center mr-3 border border-brand-primary/30">
                <span className="font-bold text-brand-primary">
                  {activeChat.otherUser.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{activeChat.otherUser.fullName}</h3>
                <p className="text-xs text-text-secondary flex items-center gap-1">
                  <Lock className="w-3 h-3 text-brand-primary" /> E2E Encrypted
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
              {isLoadingMessages ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-text-secondary space-y-3">
                  <Lock className="w-12 h-12 text-border-subtle" />
                  <p>No messages yet.</p>
                  <p className="text-xs max-w-xs text-center bg-bg-panel p-3 rounded-lg">
                    Messages are end-to-end encrypted. No one outside of this chat, not even CipherLink, can read them.
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === currentUser?.id;
                  return (
                    <div 
                      key={msg.id} 
                      className={clsx(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                        isMe 
                          ? "bg-brand-primary text-white self-end rounded-tr-sm" 
                          : "bg-bg-panel border border-border-subtle text-text-primary self-start rounded-tl-sm"
                      )}
                    >
                      <p className="break-words leading-relaxed">{msg.decryptedText}</p>
                      <p className={clsx(
                        "text-[10px] mt-1 text-right",
                        isMe ? "text-white/70" : "text-text-secondary"
                      )}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-bg-panel border-t border-border-subtle shrink-0">
              {!privateKey && (
                <div className="mb-2 text-xs text-red-500 bg-red-500/10 p-2 rounded text-center">
                  Private key missing from memory. Please re-login.
                </div>
              )}
              {activeChat.otherUser.username === 'deleted' && (
                <div className="mb-2 text-xs text-text-secondary bg-bg-app border border-border-subtle p-2 rounded text-center">
                  You cannot reply to a permanently deleted account.
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type an encrypted message..."
                  disabled={!privateKey || isSending || activeChat.otherUser.username === 'deleted'}
                  className="flex-1 bg-bg-app border border-border-subtle rounded-full px-5 py-3 focus:outline-none focus:border-brand-primary transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || !privateKey || isSending || activeChat.otherUser.username === 'deleted'}
                  className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center hover:bg-brand-secondary transition-colors disabled:opacity-50 shrink-0"
                >
                  <Send className="w-5 h-5 ml-[-2px]" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary p-8 text-center space-y-4">
            <div className="w-24 h-24 bg-bg-panel rounded-full flex items-center justify-center mb-4 border border-border-subtle">
              <Lock className="w-10 h-10 text-brand-primary/50" />
            </div>
            <h2 className="text-2xl font-semibold text-text-primary">CipherLink Web</h2>
            <p className="max-w-md">
              Select a conversation to start messaging. All direct messages are end-to-end encrypted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;
