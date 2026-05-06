import { useEffect, useRef, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';

export default function MessagesPage() {
  const { user } = useAuth();
  const { socketRef, connected } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers]           = useState([]);
  const [active, setActive]               = useState(null);
  const [activeUser, setActiveUser]       = useState(null);
  const [thread, setThread]               = useState([]);
  const [text, setText]                   = useState('');
  const [typing, setTyping]               = useState(false);
  const [loading, setLoading]             = useState(false);
  const [showUsers, setShowUsers]         = useState(false);
  const [searchUser, setSearchUser]       = useState('');

  const activeRef   = useRef(active);
  const typingTimer = useRef(null);
  const bottomRef   = useRef(null);

  // activeRef sync
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // ============================================
  // ✅ SOCKET EVENTS
  // ============================================
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !user) return;

    const handleMessage = (msg) => {
      console.log('📥 Message received:', msg);

      loadConversations();

      const currentActive = activeRef.current;
      if (!currentActive) return;

      const otherId =
        msg.sender?._id === user?._id
          ? msg.receiver?._id
          : msg.sender?._id;

      if (String(otherId) === String(currentActive)) {
        setThread((prev) => {
          const exists = prev.find((m) => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleTyping = ({ senderId, isTyping }) => {
      if (String(senderId) === String(activeRef.current)) {
        setTyping(isTyping);
      }
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:typing', handleTyping);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:typing', handleTyping);
    };
  }, [connected, user]);

  // ============================================
  // ✅ AUTO SCROLL
  // ============================================
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread]);

  // ============================================
  // ✅ LOAD CONVERSATIONS
  // ============================================
  function loadConversations() {
    api.get('/messages/conversations')
      .then((res) => {
        console.log('📋 Conversations:', res.data);
        setConversations(res.data);
      })
      .catch((err) => console.log('Conv error:', err));
  }

  useEffect(() => {
    setLoading(true);
    loadConversations();
    setLoading(false);
  }, []);

  // ============================================
  // ✅ LOAD ALL USERS - FIXED
  // ============================================
  function loadAllUsers() {
    // ✅ New endpoint use karo - 403 nahi aayega
    api.get('/users/for-messaging')
      .then((res) => {
        console.log('👥 All users:', res.data.length);
        setAllUsers(res.data);
        setShowUsers(true);
      })
      .catch((err) => {
        console.log('❌ Users error:', err.response?.status, err.message);

        // ✅ Fallback - agar for-messaging bhi fail ho
        if (err.response?.status === 404) {
          // Old endpoint try karo
          api.get('/users')
            .then((res) => {
              const others = Array.isArray(res.data)
                ? res.data.filter((u) => String(u._id) !== String(user._id))
                : [];
              setAllUsers(others);
              setShowUsers(true);
            })
            .catch(() => {
              alert('Users load nahi ho sake!');
            });
        } else {
          alert(`Users load failed: ${err.response?.status} - ${err.message}`);
        }
      });
  }

  // ============================================
  // ✅ SELECT USER
  // ============================================
  function selectUser(selectedUser) {
    console.log('👤 Starting chat with:', selectedUser.name);
    setActive(selectedUser._id);
    setActiveUser(selectedUser);
    setShowUsers(false);
    setSearchUser('');

    const exists = conversations.find(
      (c) => String(c.user._id) === String(selectedUser._id)
    );

    if (!exists) {
      setConversations((prev) => [
        { user: selectedUser, lastMessage: null },
        ...prev,
      ]);
    }
  }

  // ============================================
  // ✅ LOAD THREAD
  // ============================================
  useEffect(() => {
    if (!active) {
      setThread([]);
      return;
    }

    console.log('📨 Loading thread for:', active);

    api.get(`/messages/${active}`)
      .then((res) => {
        console.log('📨 Thread:', res.data.length, 'messages');
        setThread(res.data);
      })
      .catch((err) => console.log('Thread error:', err));

    const socket = socketRef.current;
    if (socket?.connected) {
      socket.emit('chat:read', { senderId: active });
    }
  }, [active]);

  // ============================================
  // ✅ TYPING HANDLER
  // ============================================
  function handleTextChange(e) {
    setText(e.target.value);

    const socket = socketRef.current;
    if (!socket?.connected || !active) return;

    socket.emit('chat:typing', { receiverId: active, isTyping: true });

    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('chat:typing', { receiverId: active, isTyping: false });
    }, 2000);
  }

  // ============================================
  // ✅ SEND MESSAGE
  // ============================================
  function send() {
    const socket = socketRef.current;

    if (!socket?.connected) {
      alert('Server se connected nahi hai!');
      return;
    }

    if (!active) {
      alert('Pehle koi user select karo!');
      return;
    }

    if (!text.trim()) return;

    const msgText = text.trim();
    setText('');

    socket.emit('chat:typing', { receiverId: active, isTyping: false });
    clearTimeout(typingTimer.current);

    console.log('📤 Sending:', msgText);

    socket.emit(
      'chat:send',
      { receiverId: active, content: msgText },
      (res) => {
        console.log('✅ ACK:', res);
        if (res?.error) {
          setText(msgText);
          alert('Send failed: ' + res.error);
        }
      }
    );
  }

  // ============================================
  // ✅ FILTERED USERS
  // ============================================
  const filteredUsers = allUsers.filter((u) =>
    u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const activeUserName =
    activeUser?.name ||
    conversations.find((c) => c.user._id === active)?.user?.name ||
    '';

  const canSend = !!socketRef.current?.connected && !!active && !!text.trim();

  if (!user) return null;

  return (
    <div className="grid md:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">

      {/* ==================== LEFT ==================== */}
      <div className="bg-white border rounded-xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-3 font-semibold border-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span>Messages</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              connected
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-600'
            }`}>
              {connected ? '🟢' : '🔴'}
            </span>
          </div>

          <button
            type="button"
            onClick={loadAllUsers}
            className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            + New Chat
          </button>
        </div>

        {/* User Search */}
        {showUsers && (
          <div className="border-b bg-slate-50 p-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-slate-600">
                Select a user:
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowUsers(false);
                  setSearchUser('');
                }}
                className="ml-auto text-xs text-slate-400 hover:text-slate-600"
              >
                ✕ Close
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by name..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-teal-500 mb-2"
            />

            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => selectUser(u)}
                    className="w-full text-left px-2 py-2 text-xs rounded-lg hover:bg-teal-50 flex items-center gap-2 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {u.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-slate-400 capitalize">{u.role}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">
                  No users found
                </p>
              )}
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="p-3 text-sm text-slate-400 text-center">
              Loading...
            </p>
          )}

          {!loading && conversations.length > 0 ? (
            conversations.map((c) => (
              <button
                key={c.user._id}
                type="button"
                onClick={() => {
                  setActive(c.user._id);
                  setActiveUser(c.user);
                }}
                className={`w-full text-left px-3 py-3 text-sm border-b hover:bg-slate-50 transition-colors ${
                  active === c.user._id
                    ? 'bg-teal-50 border-l-4 border-l-teal-600'
                    : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block truncate">
                      {c.user.name}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">
                      {c.user.role}
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            !loading && (
              <div className="p-4 text-center">
                <p className="text-sm text-slate-500 mb-2">
                  No conversations yet.
                </p>
                <p className="text-xs text-slate-400">
                  Click "+ New Chat" to start
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* ==================== RIGHT: CHAT ==================== */}
      <div className="md:col-span-2 bg-white border rounded-xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-3 border-b bg-white">
          {active && activeUserName ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">
                {activeUserName?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">{activeUserName}</p>
                {typing ? (
                  <p className="text-xs text-teal-600 animate-pulse">
                    typing...
                  </p>
                ) : (
                  <p className="text-xs text-green-500">Online</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">
              Select or start a conversation
            </p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm bg-slate-50">
          {!active && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <span className="text-4xl">💬</span>
              <p>Select a conversation or start a new chat</p>
              <button
                type="button"
                onClick={loadAllUsers}
                className="mt-2 px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
              >
                + Start New Chat
              </button>
            </div>
          )}

          {active && thread.length === 0 && (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>No messages yet. Say hello! 👋</p>
            </div>
          )}

          {thread.map((m) => {
            const isMine = String(m.sender?._id) === String(user?._id);
            return (
              <div
                key={m._id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isMine
                    ? 'bg-teal-700 text-white rounded-br-sm'
                    : 'bg-white text-slate-800 border rounded-bl-sm shadow-sm'
                }`}>
                  <p className="break-words">
                    {typeof m.content === 'string'
                      ? m.content
                      : JSON.stringify(m.content)}
                  </p>
                  <p className={`text-xs mt-1 ${
                    isMine ? 'text-teal-200' : 'text-slate-400'
                  }`}>
                    {m.createdAt
                      ? new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </p>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-white flex gap-2 items-center">
          <input
            className={`flex-1 border rounded-xl px-4 py-2 text-sm outline-none focus:border-teal-500 transition-colors ${
              !active ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'
            }`}
            placeholder={
              !socketRef.current?.connected
                ? '⏳ Connecting...'
                : !active
                ? 'Select a user to chat...'
                : 'Type a message…'
            }
            value={text}
            onChange={handleTextChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={!active}
          />

          <button
            type="button"
            onClick={send}
            disabled={!canSend}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
              canSend
                ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}