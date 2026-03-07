import type { MatrixClient } from 'matrix-js-sdk';
import type { LocalParticipant, RemoteParticipant } from 'livekit-client';
import { RTCBridge } from './RTCBridge';
import type { SerializedMemberInfo, SerializedLocalMemberInfo } from './sdk-types';

/**
 * Configuration options for MatrixRTCManager
 */
export interface MatrixRTCManagerConfig {
  application?: string;
  id?: string;
  sticky?: boolean;
}

/**
 * MatrixRTCManager provides a clean interface for managing RTC calls using the
 * Element Call Headless SDK. It wraps the RTCBridge communication layer and
 * manages SDK lifecycle, subscriptions, and state.
 */
export class MatrixRTCManager {
  private bridge: RTCBridge | null = null;
  private unsubscribers: Array<() => void> = [];

  // Cached state from subscriptions
  private membersState: SerializedMemberInfo[] = [];
  private connectedState: boolean = false;
  private localMemberState: SerializedLocalMemberInfo | null = null;

  constructor(
    private mx: MatrixClient,
    private roomId: string,
    private config: MatrixRTCManagerConfig = {}
  ) {}

  /**
   * Initialize the RTC manager and wait for the widget to be ready
   */
  async initialize(): Promise<void> {
    if (this.bridge) {
      throw new Error('MatrixRTCManager already initialized');
    }

    console.log('[MatrixRTCManager] Initializing for room:', this.roomId);

    // Create bridge
    this.bridge = new RTCBridge(this.mx, this.roomId);

    // Wait for widget to be ready
    await this.bridge.waitForReady();

    console.log('[MatrixRTCManager] Widget is ready');

    // Setup subscriptions automatically
    this.setupSubscriptions();
  }

  /**
   * Setup all subscriptions to widget events
   */
  private setupSubscriptions(): void {
    if (!this.bridge) return;

    // Subscribe to connected state
    const unsubConnected = this.bridge.subscribe('connected', (connected: boolean) => {
      console.log('[MatrixRTCManager] Connected:', connected);
      this.connectedState = connected;
    });
    this.unsubscribers.push(unsubConnected);

    // Subscribe to members
    const unsubMembers = this.bridge.subscribe('members', (members: SerializedMemberInfo[]) => {
      console.log('[MatrixRTCManager] Members updated:', members.length);
      this.membersState = members;
    });
    this.unsubscribers.push(unsubMembers);

    // Subscribe to local member
    const unsubLocalMember = this.bridge.subscribe(
      'localMember',
      (member: SerializedLocalMemberInfo | null) => {
        console.log('[MatrixRTCManager] Local member updated:', member);
        this.localMemberState = member;
      }
    );
    this.unsubscribers.push(unsubLocalMember);

    // Subscribe to errors
    const unsubError = this.bridge.subscribe('error', (error: string) => {
      console.error('[MatrixRTCManager] Widget error:', error);
    });
    this.unsubscribers.push(unsubError);
  }

  /**
   * Join the call (widget auto-joins, but this can be used for explicit control)
   */
  join(): void {
    if (!this.bridge) {
      throw new Error('MatrixRTCManager not initialized');
    }
    // The widget auto-joins on creation, so this is mostly a no-op
    // but provided for API completeness
    console.log('[MatrixRTCManager] Join called (widget auto-joins)');
  }

  /**
   * Leave the call
   */
  leave(): void {
    if (!this.bridge) {
      throw new Error('MatrixRTCManager not initialized');
    }

    console.log('[MatrixRTCManager] Leaving call');
    this.bridge.leave();
  }

  /**
   * Stop the manager and clean up all resources
   */
  stop(): void {
    if (!this.bridge) {
      return;
    }

    console.log('[MatrixRTCManager] Stopping');

    // Unsubscribe all
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];

    // Destroy bridge
    this.bridge.destroy();
    this.bridge = null;

    // Clear state
    this.membersState = [];
    this.connectedState = false;
    this.localMemberState = null;
  }

  /**
   * Subscribe to member updates
   */
  subscribeToMembers(callback: (members: SerializedMemberInfo[]) => void): () => void {
    if (!this.bridge) {
      throw new Error('MatrixRTCManager not initialized');
    }

    // Call with current value immediately
    callback(this.membersState);

    // Subscribe to future updates
    const unsub = this.bridge.subscribe('members', callback);

    return unsub;
  }

  /**
   * Subscribe to connection state updates
   */
  subscribeToConnected(callback: (connected: boolean) => void): () => void {
    if (!this.bridge) {
      throw new Error('MatrixRTCManager not initialized');
    }

    // Call with current value immediately
    callback(this.connectedState);

    // Subscribe to future updates
    const unsub = this.bridge.subscribe('connected', callback);

    return unsub;
  }

  /**
   * Subscribe to local member updates
   */
  subscribeToLocalMember(callback: (member: SerializedLocalMemberInfo | null) => void): () => void {
    if (!this.bridge) {
      throw new Error('MatrixRTCManager not initialized');
    }

    // Call with current value immediately
    callback(this.localMemberState);

    // Subscribe to future updates
    const unsub = this.bridge.subscribe('localMember', callback);

    return unsub;
  }

  /**
   * Toggle audio on/off
   */
  async toggleAudio(enabled: boolean): Promise<void> {
    if (!this.bridge) {
      throw new Error('MatrixRTCManager not initialized');
    }

    console.log('[MatrixRTCManager] Toggling audio:', enabled);
    this.bridge.toggleAudio(enabled);
  }

  /**
   * Toggle video on/off
   */
  async toggleVideo(enabled: boolean): Promise<void> {
    if (!this.bridge) {
      throw new Error('MatrixRTCManager not initialized');
    }

    console.log('[MatrixRTCManager] Toggling video:', enabled);
    this.bridge.toggleVideo(enabled);
  }

  /**
   * Get current members
   */
  get members(): SerializedMemberInfo[] {
    return this.membersState;
  }

  /**
   * Get current connection state
   */
  get connected(): boolean {
    return this.connectedState;
  }

  /**
   * Get current local member
   */
  get localMember(): SerializedLocalMemberInfo | null {
    return this.localMemberState;
  }

  /**
   * Get a LiveKit participant by their identity
   */
  getParticipant(identity: string): LocalParticipant | RemoteParticipant | null {
    if (!this.bridge) {
      return null;
    }
    return this.bridge.getParticipant(identity);
  }

  /**
   * Get the local LiveKit participant
   */
  getLocalParticipant(): LocalParticipant | null {
    if (!this.bridge) {
      return null;
    }
    return this.bridge.getLocalParticipant();
  }
}
