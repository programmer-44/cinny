import type { MatrixClient } from 'matrix-js-sdk';
import type { LocalParticipant, RemoteParticipant } from 'livekit-client';
import type { MessageFromWidget, MessageToWidget } from './sdk-types';

/**
 * RTCBridge manages communication between Cinny and the headless widget
 * through postMessage API. It creates a hidden iframe that hosts the
 * Element Call headless SDK and provides methods to send commands and
 * subscribe to events from the widget.
 */
export class RTCBridge {
  private iframe: HTMLIFrameElement;
  private subscribers: Map<string, Set<(value: any) => void>> = new Map();
  private readyPromise: Promise<void>;
  private readyResolve?: () => void;
  private readyReject?: (error: Error) => void;
  private destroyed = false;

  constructor(private mx: MatrixClient, private roomId: string) {
    // Create ready promise
    this.readyPromise = new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
    });

    // Create hidden iframe
    this.iframe = document.createElement('iframe');
    this.iframe.style.display = 'none';
    this.iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');

    // Construct widget URL with parameters
    const url = this.constructWidgetUrl();
    this.iframe.src = url;

    // Setup message listener
    window.addEventListener('message', this.handleMessage);

    // Append iframe to body
    document.body.appendChild(this.iframe);

    // Setup timeout for ready event
    setTimeout(() => {
      if (this.readyReject) {
        this.readyReject(new Error('Widget initialization timeout'));
      }
    }, 10000); // 10 second timeout
  }

  /**
   * Construct the widget URL with necessary parameters
   */
  private constructWidgetUrl(): string {
    const baseUrl = window.location.origin;
    const userId = this.mx.getUserId();
    const deviceId = this.mx.getDeviceId();
    const accessToken = this.mx.getAccessToken();
    const homeserverUrl = this.mx.baseUrl;

    const params = new URLSearchParams({
      roomId: this.roomId,
      userId: userId || '',
      deviceId: deviceId || '',
      baseUrl: homeserverUrl,
      parentUrl: baseUrl,
    });

    // Include access token if available (for widget auth)
    if (accessToken) {
      params.set('accessToken', accessToken);
    }

    return `/element-call-sdk/widget.html?${params.toString()}`;
  }

  /**
   * Handle messages from the widget
   */
  private handleMessage = (event: MessageEvent<MessageFromWidget>) => {
    // Validate origin
    if (event.origin !== window.location.origin) {
      return;
    }

    // Only process messages from our iframe
    if (event.source !== this.iframe.contentWindow) {
      return;
    }

    const message = event.data;

    try {
      // Handle ready event
      if (message.type === 'ready') {
        if (this.readyResolve) {
          this.readyResolve();
          this.readyResolve = undefined;
          this.readyReject = undefined;
        }
        return;
      }

      // Handle error event
      if (message.type === 'error') {
        console.error('[RTCBridge] Widget error:', message.error);
        if (this.readyReject) {
          this.readyReject(new Error(message.error));
          this.readyResolve = undefined;
          this.readyReject = undefined;
        }
        // Also notify error subscribers
        this.notifySubscribers('error', message.error);
        return;
      }

      // Notify subscribers
      this.notifySubscribers(message.type, message.value);
    } catch (error) {
      console.error('[RTCBridge] Error handling message:', error);
    }
  };

  /**
   * Notify all subscribers of a specific event type
   */
  private notifySubscribers(eventType: string, value: any): void {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(value);
        } catch (error) {
          console.error(`[RTCBridge] Error in subscriber callback for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Wait for the widget to be ready
   */
  async waitForReady(): Promise<void> {
    return this.readyPromise;
  }

  /**
   * Subscribe to events from the widget
   */
  subscribe(eventType: string, callback: (value: any) => void): () => void {
    if (this.destroyed) {
      throw new Error('RTCBridge has been destroyed');
    }

    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    this.subscribers.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(eventType);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }

  /**
   * Send a command to the widget
   */
  private sendCommand(message: MessageToWidget): void {
    if (this.destroyed) {
      throw new Error('RTCBridge has been destroyed');
    }

    if (!this.iframe.contentWindow) {
      throw new Error('Widget iframe not ready');
    }

    this.iframe.contentWindow.postMessage(message, window.location.origin);
  }

  /**
   * Send leave command to the widget
   */
  leave(): void {
    this.sendCommand({ type: 'leave' });
  }

  /**
   * Toggle audio on/off
   */
  toggleAudio(enabled: boolean): void {
    this.sendCommand({
      type: 'toggleAudio',
      data: { enabled },
    });
  }

  /**
   * Toggle video on/off
   */
  toggleVideo(enabled: boolean): void {
    this.sendCommand({
      type: 'toggleVideo',
      data: { enabled },
    });
  }

  /**
   * Destroy the bridge and clean up resources
   */
  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    // Remove message listener
    window.removeEventListener('message', this.handleMessage);

    // Remove iframe
    if (this.iframe.parentNode) {
      this.iframe.parentNode.removeChild(this.iframe);
    }

    // Clear all subscribers
    this.subscribers.clear();
  }

  /**
   * Get a LiveKit participant by their identity
   */
  getParticipant(identity: string): LocalParticipant | RemoteParticipant | null {
    if (this.destroyed || !this.iframe.contentWindow) {
      return null;
    }

    try {
      const getParticipant = (this.iframe.contentWindow as any).__matrixrtc_getParticipant;
      if (typeof getParticipant === 'function') {
        return getParticipant(identity);
      }
    } catch (error) {
      console.error('[RTCBridge] Error getting participant:', error);
    }

    return null;
  }

  /**
   * Get the local LiveKit participant
   */
  getLocalParticipant(): LocalParticipant | null {
    if (this.destroyed || !this.iframe.contentWindow) {
      return null;
    }

    try {
      const getLocal = (this.iframe.contentWindow as any).__matrixrtc_getLocalParticipant;
      if (typeof getLocal === 'function') {
        return getLocal();
      }
    } catch (error) {
      console.error('[RTCBridge] Error getting local participant:', error);
    }

    return null;
  }
}
