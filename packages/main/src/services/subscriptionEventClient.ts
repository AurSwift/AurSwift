/**
 * Subscription Event Client (SSE)
 *
 * Real-time event client using Server-Sent Events (SSE) for instant
 * subscription notifications from the web server.
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Event deduplication (idempotency)
 * - Heartbeat monitoring
 * - Graceful degradation to polling if SSE unavailable
 *
 * Events handled:
 * - subscription_cancelled: Immediate or scheduled cancellation
 * - subscription_reactivated: Subscription restored
 * - subscription_updated: Status change (active, past_due, etc.)
 * - subscription_past_due: Payment failed, grace period active
 * - subscription_payment_succeeded: Payment recovered
 * - license_revoked: License disabled by admin
 * - license_reactivated: License restored
 * - plan_changed: Plan upgrade/downgrade
 * - heartbeat_ack: Connection health check
 */

import { EventEmitter } from "events";
import { getLogger } from "../utils/logger.js";
import { app } from "electron";
import { IncomingMessage } from "http";
import https from "https";
import http from "http";

const logger = getLogger("subscriptionEventClient");

// ============================================================================
// CONFIGURATION
// ============================================================================

// Reconnection settings
const INITIAL_RECONNECT_DELAY_MS = 1000; // 1 second
const MAX_RECONNECT_DELAY_MS = 5 * 60 * 1000; // 5 minutes
const RECONNECT_BACKOFF_MULTIPLIER = 2;

// Heartbeat monitoring
const HEARTBEAT_TIMEOUT_MS = 60 * 1000; // Expect heartbeat every 60s (server sends every 30s)

// Event deduplication window
const EVENT_DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// TYPES
// ============================================================================

export type SubscriptionEventType =
  | "subscription_cancelled"
  | "subscription_reactivated"
  | "subscription_updated"
  | "subscription_past_due"
  | "subscription_payment_succeeded"
  | "license_revoked"
  | "license_reactivated"
  | "plan_changed"
  | "heartbeat_ack";

export interface SubscriptionEvent {
  id: string;
  type: SubscriptionEventType;
  timestamp: string;
  licenseKey: string;
  data: Record<string, unknown>;
}

export interface ConnectionState {
  connected: boolean;
  lastHeartbeat: Date | null;
  reconnectAttempts: number;
  error: string | null;
}

// Event handler type
type EventHandler = (event: SubscriptionEvent) => void;

// ============================================================================
// SSE CLIENT CLASS (Native Node.js Implementation)
// ============================================================================

export class SubscriptionEventClient extends EventEmitter {
  private licenseKey: string;
  private machineIdHash: string;
  private apiBaseUrl: string;

  private httpRequest: http.ClientRequest | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
  private reconnectAttempts = 0;

  // Event deduplication
  private processedEvents = new Map<string, number>(); // eventId -> timestamp

  // State
  private isConnecting = false;
  private shouldReconnect = true;
  private lastHeartbeat: Date | null = null;
  private connected = false;

  constructor(licenseKey: string, machineIdHash: string, apiBaseUrl: string) {
    super();
    this.licenseKey = licenseKey.toUpperCase();
    this.machineIdHash = machineIdHash;
    this.apiBaseUrl = apiBaseUrl;

    // Cleanup old processed events periodically
    setInterval(() => this.cleanupProcessedEvents(), EVENT_DEDUP_WINDOW_MS);
  }

  // =========================================================================
  // CONNECTION MANAGEMENT
  // =========================================================================

  /**
   * Connect to the SSE endpoint
   */
  connect(): void {
    if (this.httpRequest || this.isConnecting) {
      logger.debug("Already connected or connecting");
      return;
    }

    this.shouldReconnect = true;
    this.isConnecting = true;

    const url = `${this.apiBaseUrl}/api/events/${encodeURIComponent(
      this.licenseKey
    )}?machineId=${encodeURIComponent(this.machineIdHash)}`;

    logger.info("Connecting to SSE endpoint:", {
      licenseKey: this.licenseKey.substring(0, 15) + "...",
      machineIdHash: this.machineIdHash.substring(0, 20) + "...",
      fullUrl: url,
      attempt: this.reconnectAttempts + 1,
    });

    try {
      // Parse URL to determine http or https
      const parsedUrl = new URL(url);
      const isHttps = parsedUrl.protocol === "https:";
      const httpModule = isHttps ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: "GET",
        headers: {
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      };

      this.httpRequest = httpModule.request(
        options,
        (response: IncomingMessage) => {
          if (response.statusCode !== 200) {
            // Read response body for error details
            let errorBody = "";
            response.on("data", (chunk: Buffer) => {
              errorBody += chunk.toString();
            });
            response.on("end", () => {
              logger.error("SSE connection failed", {
                statusCode: response.statusCode,
                statusMessage: response.statusMessage,
                errorBody: errorBody.substring(0, 500),
                url: `${parsedUrl.hostname}${parsedUrl.pathname}`,
              });
            });
            this.handleDisconnect();
            return;
          }

          this.isConnecting = false;
          this.connected = true;
          this.reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
          this.reconnectAttempts = 0;

          logger.info("SSE connection established");
          this.emit("connected");
          this.startHeartbeatMonitor();

          let buffer = "";

          response.on("data", (chunk: Buffer) => {
            buffer += chunk.toString();

            // Process complete SSE messages
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || ""; // Keep incomplete message in buffer

            for (const message of lines) {
              this.parseSSEMessage(message);
            }
          });

          response.on("end", () => {
            logger.info("SSE connection ended");
            this.handleDisconnect();
          });

          response.on("error", (error) => {
            logger.error("SSE response error:", error);
            this.handleDisconnect();
          });
        }
      );

      this.httpRequest.on("error", (error) => {
        logger.error("SSE request error:", error);
        this.isConnecting = false;
        this.handleDisconnect();
      });

      this.httpRequest.end();
    } catch (error) {
      logger.error("Failed to create SSE connection:", error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Parse SSE message format
   */
  private parseSSEMessage(message: string): void {
    const lines = message.split("\n");
    let eventType = "message";
    let data = "";
    let eventId = "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data += line.slice(5).trim();
      } else if (line.startsWith("id:")) {
        eventId = line.slice(3).trim();
      }
    }

    if (data) {
      this.handleEventMessage(eventType, data, eventId);
    }
  }

  /**
   * Handle parsed SSE event
   */
  private handleEventMessage(
    eventType: string,
    data: string,
    eventId: string
  ): void {
    try {
      // Handle heartbeat - these are not stored as events
      if (eventType === "heartbeat" || eventType === "heartbeat_ack") {
        this.lastHeartbeat = new Date();
        this.resetHeartbeatTimeout();
        logger.debug("Heartbeat received from server");
        return;
      }

      // Deduplicate events
      if (eventId && this.processedEvents.has(eventId)) {
        logger.debug("Skipping duplicate event:", eventId);
        return;
      }

      if (eventId) {
        this.processedEvents.set(eventId, Date.now());
      }

      // Parse and emit event
      const parsedData = JSON.parse(data);
      const event: SubscriptionEvent = {
        id: eventId || `${Date.now()}`,
        type: eventType as SubscriptionEventType,
        timestamp: new Date().toISOString(),
        licenseKey: this.licenseKey,
        data: parsedData,
      };

      logger.info("SSE event received:", { type: eventType, id: eventId });
      this.emit("event", event);
    } catch (error) {
      logger.error("Failed to parse SSE event:", error);
    }
  }

  /**
   * Disconnect from the SSE endpoint
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.cleanup();
    logger.info("SSE client disconnected");
    this.emit("disconnected");
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return {
      connected: this.connected,
      lastHeartbeat: this.lastHeartbeat,
      reconnectAttempts: this.reconnectAttempts,
      error: null,
    };
  }

  // =========================================================================
  // EVENT HANDLING
  // =========================================================================
  // (Event subscription handled in parseSSEMessage)
  // =========================================================================

  /**
   * Handle incoming event
   */
  private handleEvent(eventType: SubscriptionEventType, data: string): void {
    try {
      const event = JSON.parse(data) as SubscriptionEvent;

      // Deduplicate events
      if (this.processedEvents.has(event.id)) {
        logger.debug(`Ignoring duplicate event: ${event.id}`);
        return;
      }
      this.processedEvents.set(event.id, Date.now());

      // Handle heartbeat separately
      if (eventType === "heartbeat_ack") {
        this.handleHeartbeat(event);
        return;
      }

      logger.info(`Received subscription event: ${eventType}`, {
        eventId: event.id,
        licenseKey: event.licenseKey.substring(0, 15) + "...",
      });

      // Emit the event for handlers to process
      this.emit("event", event);
      this.emit(eventType, event);
    } catch (error) {
      logger.error("Failed to process event:", error);
    }
  }

  /**
   * Handle heartbeat event
   */
  private handleHeartbeat(event: SubscriptionEvent): void {
    this.lastHeartbeat = new Date();
    this.resetHeartbeatTimeout();
    logger.debug("Heartbeat received from server");
  }

  // =========================================================================
  // HEARTBEAT MONITORING
  // =========================================================================

  /**
   * Start monitoring for heartbeats
   */
  private startHeartbeatMonitor(): void {
    this.resetHeartbeatTimeout();
  }

  /**
   * Reset heartbeat timeout
   */
  private resetHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
    }

    this.heartbeatTimeout = setTimeout(() => {
      logger.warn("Heartbeat timeout - reconnecting");
      this.handleDisconnect();
    }, HEARTBEAT_TIMEOUT_MS);
  }

  // =========================================================================
  // RECONNECTION LOGIC
  // =========================================================================

  /**
   * Handle disconnection
   */
  private handleDisconnect(): void {
    this.cleanup();

    if (this.shouldReconnect) {
      this.emit("disconnected");
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    logger.info(`Scheduling reconnect in ${this.reconnectDelay / 1000}s`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(
      this.reconnectDelay * RECONNECT_BACKOFF_MULTIPLIER,
      MAX_RECONNECT_DELAY_MS
    );
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  /**
   * Clean up resources
   */
  private cleanup(): void {
    this.isConnecting = false;
    this.connected = false;

    if (this.httpRequest) {
      this.httpRequest.destroy();
      this.httpRequest = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Clean up old processed events to prevent memory leak
   */
  private cleanupProcessedEvents(): void {
    const now = Date.now();
    for (const [eventId, timestamp] of this.processedEvents) {
      if (now - timestamp > EVENT_DEDUP_WINDOW_MS) {
        this.processedEvents.delete(eventId);
      }
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE & FACTORY
// ============================================================================

let sseClientInstance: SubscriptionEventClient | null = null;

/**
 * Initialize the SSE client
 */
export function initializeSSEClient(
  licenseKey: string,
  machineIdHash: string,
  apiBaseUrl: string
): SubscriptionEventClient {
  // Clean up existing instance
  if (sseClientInstance) {
    sseClientInstance.disconnect();
  }

  sseClientInstance = new SubscriptionEventClient(
    licenseKey,
    machineIdHash,
    apiBaseUrl
  );

  return sseClientInstance;
}

/**
 * Get the current SSE client instance
 */
export function getSSEClient(): SubscriptionEventClient | null {
  return sseClientInstance;
}

/**
 * Disconnect and cleanup the SSE client
 */
export function disconnectSSEClient(): void {
  if (sseClientInstance) {
    sseClientInstance.disconnect();
    sseClientInstance = null;
  }
}
