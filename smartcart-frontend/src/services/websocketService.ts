import { Client } from "@stomp/stompjs";
import type { BackgroundJob } from "../types/job";

export type JobUpdateCallback = (job: BackgroundJob) => void;

class WebSocketService {
    private client: Client | null = null;
    private listeners: Set<JobUpdateCallback> = new Set();
    private isConnected: boolean = false;

    public connect(onConnected?: () => void) {
        if (this.client && (this.client.active || this.isConnected)) {
            if (this.isConnected && onConnected) onConnected();
            return;
        }

        const token = localStorage.getItem("token");

        const getBrokerUrl = (): string => {
            if (import.meta.env.VITE_WS_URL) {
                return import.meta.env.VITE_WS_URL as string;
            }
            const apiUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:8080";
            const wsBase = apiUrl.replace(/^http(s?):\/\//, "ws$1://").replace(/\/+api\/?$/, "").replace(/\/+$/, "");
            return `${wsBase}/ws-smartcart`;
        };

        this.client = new Client({
            brokerURL: getBrokerUrl(),
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
            reconnectDelay: 3000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            debug: (str) => {
                if (import.meta.env.DEV) {
                    console.debug("[STOMP]", str);
                }
            },
            onConnect: () => {
                this.isConnected = true;
                if (onConnected) onConnected();

                this.client?.subscribe("/topic/jobs", (message) => {
                    try {
                        const job: BackgroundJob = JSON.parse(message.body);
                        this.notifyListeners(job);
                    } catch (err) {
                        console.error("Failed to parse incoming WebSocket message:", err);
                    }
                });
            },
            onDisconnect: () => {
                this.isConnected = false;
            },
            onStompError: (frame) => {
                console.error("STOMP protocol error:", frame.headers["message"], frame.body);
            },
            onWebSocketError: (event) => {
                console.warn("WebSocket transport error:", event);
            }
        });

        this.client.activate();
    }

    public subscribe(callback: JobUpdateCallback): () => void {
        this.listeners.add(callback);
        this.connect();
        return () => {
            this.listeners.delete(callback);
            if (this.listeners.size === 0) {
                // Keep connected or disconnect if no more listeners
            }
        };
    }

    private notifyListeners(job: BackgroundJob) {
        this.listeners.forEach((listener) => {
            try {
                listener(job);
            } catch (err) {
                console.error("Error in job update listener:", err);
            }
        });
    }

    public disconnect() {
        if (this.client) {
            this.client.deactivate();
            this.client = null;
            this.isConnected = false;
        }
    }

    public getConnectedStatus(): boolean {
        return this.isConnected;
    }
}

export const websocketService = new WebSocketService();
export default websocketService;
