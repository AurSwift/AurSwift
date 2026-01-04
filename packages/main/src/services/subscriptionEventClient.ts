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
// SSE CLIENT CLASS
// ============================================================================

export class SubscriptionEventClient extends EventEmitter {
  private licenseKey: string;
  private machineIdHash: string;
  private apiBaseUrl: string;

  private eventSource: EventSource | null = null;
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
    if (this.eventSource || this.isConnecting) {
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
      attempt: this.reconnectAttempts + 1,
    });

    try {
      // Note: In Node.js/Electron, we use eventsource package or native fetch
      // For Electron, we can use the browser's native EventSource
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.isConnecting = false;
        this.reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
        this.reconnectAttempts = 0;

        logger.info("SSE connection established");
        this.emit("connected");
        this.startHeartbeatMonitor();
      };

      this.eventSource.onerror = (error) => {
        logger.warn("SSE connection error:", error);
        this.handleDisconnect();
      };

      // Subscribe to specific event types
      this.subscribeToEventTypes();
    } catch (error) {
      logger.error("Failed to create EventSource:", error);
      this.isConnecting = false;
      this.scheduleReconnect();
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
      connected: this.eventSource?.readyState === EventSource.OPEN,
      lastHeartbeat: this.lastHeartbeat,
      reconnectAttempts: this.reconnectAttempts,
      error: null,
    };
  }

  // =========================================================================
  // EVENT HANDLING
  // =========================================================================

  /**
   * Subscribe to all event types
   */
  private subscribeToEventTypes(): void {
    if (!this.eventSource) return;

    const eventTypes: SubscriptionEventType[] = [
      "subscription_cancelled",
      "subscription_reactivated",
      "subscription_updated",
      "subscription_past_due",
      "subscription_payment_succeeded",
      "license_revoked",
      "license_reactivated",
      "plan_changed",
      "heartbeat_ack",
    ];

    for (const eventType of eventTypes) {
      this.eventSource.addEventListener(eventType, (e: MessageEvent) => {
        this.handleEvent(eventType, e.data);
      });
    }

    // Also listen to generic message event as fallback
    this.eventSource.onmessage = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data) as SubscriptionEvent;
        this.handleEvent(event.type, e.data);
      } catch {
        // Ignore malformed messages
      }
    };
  }

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

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
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
