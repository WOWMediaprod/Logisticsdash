"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  joinTracking: (companyId: string) => void;
  leaveTracking: (companyId: string) => void;
  joinJobTracking: (jobId: string) => void;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

type SocketProviderProps = {
  children: React.ReactNode;
};

const trimTrailingSlash = (value?: string) => value?.replace(/\/$/, '');

const resolveSocketBaseUrl = () => {
  const envInternal = trimTrailingSlash(process.env.API_INTERNAL_WS_URL || process.env.API_INTERNAL_URL);
  const envSocket = trimTrailingSlash(process.env.NEXT_PUBLIC_SOCKET_URL);
  const envHttps = trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL_HTTPS);
  const envDefault = trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL);

  if (typeof window === "undefined") {
    return envInternal || envSocket || envHttps || envDefault || "";
  }

  const isHttpsPage = window.location.protocol === "https:";
  const hostname = window.location.hostname;
  const isNgrok = hostname.includes('.ngrok') || hostname.includes('.ngrok-free.app');

  // For ngrok tunnels, use the configured Socket URL (NEXT_PUBLIC_SOCKET_URL)
  if (isNgrok) {
    console.log("🔧 Detected ngrok environment");
    if (envSocket) {
      console.log("✅ Using configured NEXT_PUBLIC_SOCKET_URL:", envSocket);
      return envSocket;
    }
    console.warn("⚠️ ngrok detected but NEXT_PUBLIC_SOCKET_URL not set!");
  }

  if (isHttpsPage) {
    if (envSocket?.startsWith("https://")) {
      return envSocket;
    }
    if (envHttps) {
      return envHttps;
    }
    if (envDefault?.startsWith("https://")) {
      return envDefault;
    }
    if (envInternal?.startsWith("https://")) {
      return envInternal;
    }
    return `https://${hostname}:3004`;
  }

  if (envSocket && !envSocket.startsWith("https://")) {
    return envSocket;
  }

  if (envInternal && envInternal.startsWith("http://")) {
    return envInternal;
  }

  if (envDefault) {
    return envDefault;
  }

  return `http://${hostname}:3004`;
};

const resolveSocketUrl = () => {
  const baseUrl = resolveSocketBaseUrl();
  if (!baseUrl) {
    console.warn("SocketProvider: unable to resolve socket base URL");
    return "";
  }
  return `${baseUrl}/tracking`;
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const url = resolveSocketUrl();
    if (!url) {
      console.log("📡 No socket URL configured, using HTTP-only mode");
      setIsConnected(false);
      return undefined;
    }

    const isSecure = url.startsWith("https://");

    const newSocket = io(url, {
      transports: ["polling", "websocket"], // Try polling first, then websocket
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      forceNew: true,
      withCredentials: false, // Disable for cross-origin issues
      secure: isSecure,
      upgrade: true, // Allow transport upgrades
      rememberUpgrade: false, // Don't remember websocket upgrade failures
    });

    const handleConnect = () => {
      console.log("✅ Socket.IO connected", { url, id: newSocket.id, transport: newSocket.io.engine.transport.name });
      setIsConnected(true);
    };

    const handleDisconnect = (reason: string) => {
      console.log("❌ Socket.IO disconnected", { reason });
      setIsConnected(false);
    };

    const handleError = (error: any) => {
      console.error("🔴 Socket.IO connection error", { error, url });
      setIsConnected(false);
    };

    const handleConnectError = (error: any) => {
      console.error("🔴 Socket.IO connect_error", { error, url });
      console.log("💡 Falling back to HTTP polling only");
      setIsConnected(false);
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);
    newSocket.on("connect_error", handleConnectError);
    newSocket.on("reconnect_error", handleError);

    setSocket(newSocket);

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
      newSocket.off("connect_error", handleConnectError);
      newSocket.off("reconnect_error", handleError);
      newSocket.close();
    };
  }, []);

  const joinTracking = (companyId: string) => {
    if (socket && isConnected) {
      socket.emit("join-tracking", { companyId });
    }
  };

  const leaveTracking = (companyId: string) => {
    if (socket && isConnected) {
      socket.emit("leave-tracking", { companyId });
    }
  };

  const joinJobTracking = (jobId: string) => {
    if (socket && isConnected) {
      socket.emit("join-job", { jobId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinTracking, leaveTracking, joinJobTracking }}>
      {children}
    </SocketContext.Provider>
  );
};

