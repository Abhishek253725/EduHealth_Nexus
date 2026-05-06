import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    if (socketRef.current?.connected) {
      return;
    }

    console.log('🔌 Creating socket...');

    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Socket Connected:', socket.id);
      setConnected(true);
    });

    socket.on('connect_error', (err) => {
      console.log('❌ Socket Error:', err.message);
      setConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔴 Disconnected:', reason);
      setConnected(false);
    });

    socket.on('reconnect', () => {
      console.log('🔄 Reconnected');
      setConnected(true);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socketRef, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}