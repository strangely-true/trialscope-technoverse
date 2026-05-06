"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { CohortEvent } from "@/types/monitoring";

interface WebSocketOptions {
  trialId: string;
  enabled?: boolean;
  onEvent?: (event: CohortEvent) => void;
}

export function useCohortWebSocket({
  trialId,
  enabled = true,
  onEvent,
}: WebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<CohortEvent | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !trialId) return;

    const token = localStorage.getItem("trialgo_token");
    const socket = io(
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8000",
      {
        path: "/ws/dashboard",
        query: { trial_id: trialId },
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
      }
    );

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("cohort_update", (event: CohortEvent) => {
      setLastEvent(event);
      onEvent?.(event);
    });

    socketRef.current = socket;
  }, [trialId, enabled, onEvent]);

  useEffect(() => {
    connect();
    return () => {
      socketRef.current?.disconnect();
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    socketRef.current?.disconnect();
    connect();
  }, [connect]);

  return { isConnected, lastEvent, reconnect };
}
