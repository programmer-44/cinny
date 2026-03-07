import type { CallMembership } from 'matrix-js-sdk/lib/matrixrtc';
import type { LocalParticipant, RemoteParticipant } from 'livekit-client';
import type { Observable } from 'rxjs';

/**
 * Represents the connection state of a participant
 */
export interface Connection {
  state: 'connected' | 'connecting' | 'disconnected';
}

/**
 * Information about a call member (remote or local)
 */
export interface MemberInfo {
  connection: Connection | null;
  membership: CallMembership;
  participant: LocalParticipant | RemoteParticipant | null;
}

/**
 * Information about the local participant
 */
export interface LocalMemberInfo {
  connection: Connection | null;
  membership: CallMembership;
  participant: LocalParticipant | null;
}

/**
 * Data message received from the call
 */
export interface DataMessage {
  rtcBackendIdentity: string;
  data: string;
}

/**
 * The MatrixRTC SDK interface
 */
export interface MatrixRTCSdk {
  join: () => void;
  leave: () => void;
  stop: () => void;
  data$: Observable<DataMessage>;
  members$: Observable<MemberInfo[]> & { value: MemberInfo[] };
  localMember$: Observable<LocalMemberInfo | null> & { value: LocalMemberInfo | null };
  connected$: Observable<boolean> & { value: boolean };
  sendData?: (data: unknown) => Promise<void>;
  sendRoomMessage?: (message: string) => Promise<void>;
}

/**
 * Function to create a MatrixRTC SDK instance
 * @param application - Application identifier (e.g., 'm.call')
 * @param id - Optional session ID
 * @param sticky - Whether the session should be sticky
 */
export interface CreateMatrixRTCSdkFn {
  (application?: string, id?: string, sticky?: boolean): Promise<MatrixRTCSdk>;
}

/**
 * Serialized member information for postMessage communication
 */
export interface SerializedMemberInfo {
  userId: string;
  deviceId: string;
  connectionState: 'connected' | 'connecting' | 'disconnected' | null;
  participantIdentity: string | null;
  isMicEnabled: boolean | null;
  isCameraEnabled: boolean | null;
}

/**
 * Serialized local member information for postMessage communication
 */
export interface SerializedLocalMemberInfo {
  userId: string;
  deviceId: string;
  connectionState: 'connected' | 'connecting' | 'disconnected' | null;
  participantIdentity: string;
  isMicEnabled: boolean;
  isCameraEnabled: boolean;
}

/**
 * Messages sent from the widget to the parent window
 */
export type MessageFromWidget =
  | { type: 'ready' }
  | { type: 'error'; error: string }
  | { type: 'connected'; value: boolean }
  | { type: 'members'; value: SerializedMemberInfo[] }
  | { type: 'localMember'; value: SerializedLocalMemberInfo | null }
  | { type: 'data'; value: DataMessage };

/**
 * Messages sent from the parent window to the widget
 */
export type MessageToWidget =
  | { type: 'leave' }
  | { type: 'toggleAudio'; data: { enabled: boolean } }
  | { type: 'toggleVideo'; data: { enabled: boolean } };
