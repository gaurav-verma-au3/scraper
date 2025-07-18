import React, { createContext, useEffect, useRef, useState } from "react";
import { w3cwebsocket as W3CWebSocket } from "websocket";

// Create Context
const WebSocketContext = createContext();

// Provider Component
export const WebSocketProvider = ({
  url = "ws://localhost:3000/",
  protocol = "echo-protocol",
  children,
  onMessage: externalOnMessage, // 👈 New: accept callback
}) => {
  const clientRef = useRef(null);
  const intervalRef = useRef(null);
  const [message, setMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = new W3CWebSocket(url, protocol);
    clientRef.current = client;

    client.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    client.onopen = () => {
      console.log("WebSocket Connected");
      setIsConnected(true);

      intervalRef.current = setInterval(() => {
        if (client.readyState === client.OPEN) {
          const number = Math.round(Math.random() * 0xffffff);
          client.send(number.toString());
        }
      }, 1000);
    };

    client.onmessage = (message) => {
      if (typeof message.data === "string") {
        console.log("Received:", message.data);
        setMessage(message.data);

        // ✅ Call external handler if provided
        if (typeof externalOnMessage === "function") {
          externalOnMessage(message.data);
        }
      }
    };

    client.onclose = () => {
      console.log("WebSocket Disconnected");
      setIsConnected(false);
    };

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (client.readyState === client.OPEN) client.close();
    };
  }, [url, protocol, externalOnMessage]);

  const sendMessage = (data) => {
    if (clientRef.current && clientRef.current.readyState === clientRef.current.OPEN) {
      clientRef.current.send(data);
    }
  };

  return <WebSocketContext.Provider value={{ sendMessage, message, isConnected }}>{children}</WebSocketContext.Provider>;
};

// Export context in case it's needed
export { WebSocketContext };
