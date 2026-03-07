import React, { ReactNode, useCallback, useEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useMatrixClient } from '../hooks/useMatrixClient';
import { MatrixRTCManager } from '../features/rtc/MatrixRTCManager';
import {
  rtcManagerAtom,
  activeCallRoomIdAtom,
  isCallConnectedAtom,
  callMembersAtom,
  localCallMemberAtom,
  isAudioEnabledAtom,
  isVideoEnabledAtom,
  callChatVisibleAtom,
} from '../state/rtc';

type RTCProviderProps = {
  children?: ReactNode;
};

/**
 * RTCProvider manages the Matrix RTC state and lifecycle.
 * It provides call functionality through the Element Call Headless SDK.
 */
export function RTCProvider({ children }: RTCProviderProps) {
  const mx = useMatrixClient();
  const setRtcManager = useSetAtom(rtcManagerAtom);
  const setActiveCallRoomId = useSetAtom(activeCallRoomIdAtom);
  const setIsCallConnected = useSetAtom(isCallConnectedAtom);
  const setCallMembers = useSetAtom(callMembersAtom);
  const setLocalCallMember = useSetAtom(localCallMemberAtom);
  const setIsAudioEnabled = useSetAtom(isAudioEnabledAtom);
  const setIsVideoEnabled = useSetAtom(isVideoEnabledAtom);

  const rtcManager = useAtomValue(rtcManagerAtom);

  // Setup subscriptions when rtcManager changes
  useEffect(() => {
    if (!rtcManager) {
      // Reset all state when manager is cleared
      setIsCallConnected(false);
      setCallMembers([]);
      setLocalCallMember(null);
      setIsAudioEnabled(true);
      setIsVideoEnabled(false);
      setActiveCallRoomId(undefined);
      return;
    }

    console.log('[RTCProvider] Setting up subscriptions for rtcManager');

    // Subscribe to connection state
    const unsubConnected = rtcManager.subscribeToConnected((connected) => {
      console.log('[RTCProvider] Connection state:', connected);
      setIsCallConnected(connected);
    });

    // Subscribe to members
    const unsubMembers = rtcManager.subscribeToMembers((members) => {
      console.log('[RTCProvider] Members updated:', members.length);
      setCallMembers(members);
    });

    // Subscribe to local member (for audio/video state sync)
    const unsubLocalMember = rtcManager.subscribeToLocalMember((member) => {
      console.log('[RTCProvider] Local member updated:', member);
      setLocalCallMember(member);

      if (member) {
        setIsAudioEnabled(member.isMicEnabled);
        setIsVideoEnabled(member.isCameraEnabled);
      }
    });

    // Cleanup subscriptions
    return () => {
      console.log('[RTCProvider] Cleaning up subscriptions');
      unsubConnected();
      unsubMembers();
      unsubLocalMember();
    };
  }, [
    rtcManager,
    setIsCallConnected,
    setCallMembers,
    setLocalCallMember,
    setIsAudioEnabled,
    setIsVideoEnabled,
    setActiveCallRoomId,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[RTCProvider] Component unmounting, cleaning up rtcManager');
      if (rtcManager) {
        rtcManager.stop();
        setRtcManager(undefined);
      }
    };
  }, []);

  return <>{children}</>;
}

/**
 * Hook to join a call
 */
export function useJoinCall() {
  const mx = useMatrixClient();
  const [rtcManager, setRtcManager] = useAtom(rtcManagerAtom);
  const setActiveCallRoomId = useSetAtom(activeCallRoomIdAtom);

  return useCallback(
    async (roomId: string) => {
      console.log('[useJoinCall] Joining call in room:', roomId);

      // Stop existing manager if any
      if (rtcManager) {
        console.log('[useJoinCall] Stopping existing rtcManager');
        rtcManager.stop();
      }

      try {
        // Create new manager
        const manager = new MatrixRTCManager(mx, roomId, {
          application: 'm.call',
          sticky: false,
        });

        // Initialize and wait for ready
        await manager.initialize();
        console.log('[useJoinCall] Manager initialized successfully');

        // Set the manager (this will trigger subscriptions in RTCProvider)
        setRtcManager(manager);
        setActiveCallRoomId(roomId);

        console.log('[useJoinCall] Call joined successfully');
      } catch (error) {
        console.error('[useJoinCall] Failed to join call:', error);
        setRtcManager(undefined);
        setActiveCallRoomId(undefined);
        throw error;
      }
    },
    [mx, rtcManager, setRtcManager, setActiveCallRoomId]
  );
}

/**
 * Hook to leave a call
 */
export function useLeaveCall() {
  const [rtcManager, setRtcManager] = useAtom(rtcManagerAtom);
  const setActiveCallRoomId = useSetAtom(activeCallRoomIdAtom);

  return useCallback(() => {
    console.log('[useLeaveCall] Leaving call');

    if (rtcManager) {
      rtcManager.leave();
      rtcManager.stop();
      setRtcManager(undefined);
    }

    setActiveCallRoomId(undefined);
  }, [rtcManager, setRtcManager, setActiveCallRoomId]);
}

/**
 * Hook to toggle audio
 */
export function useToggleAudio() {
  const rtcManager = useAtomValue(rtcManagerAtom);
  const [isAudioEnabled, setIsAudioEnabled] = useAtom(isAudioEnabledAtom);

  return useCallback(async () => {
    if (!rtcManager) {
      console.warn('[useToggleAudio] No rtcManager available');
      return;
    }

    const newState = !isAudioEnabled;
    console.log('[useToggleAudio] Toggling audio to:', newState);

    try {
      // Optimistically update state
      setIsAudioEnabled(newState);

      // Send command to widget
      await rtcManager.toggleAudio(newState);
    } catch (error) {
      console.error('[useToggleAudio] Failed to toggle audio:', error);
      // Rollback on error
      setIsAudioEnabled(!newState);
    }
  }, [rtcManager, isAudioEnabled, setIsAudioEnabled]);
}

/**
 * Hook to toggle video
 */
export function useToggleVideo() {
  const rtcManager = useAtomValue(rtcManagerAtom);
  const [isVideoEnabled, setIsVideoEnabled] = useAtom(isVideoEnabledAtom);

  return useCallback(async () => {
    if (!rtcManager) {
      console.warn('[useToggleVideo] No rtcManager available');
      return;
    }

    const newState = !isVideoEnabled;
    console.log('[useToggleVideo] Toggling video to:', newState);

    try {
      // Optimistically update state
      setIsVideoEnabled(newState);

      // Send command to widget
      await rtcManager.toggleVideo(newState);
    } catch (error) {
      console.error('[useToggleVideo] Failed to toggle video:', error);
      // Rollback on error
      setIsVideoEnabled(!newState);
    }
  }, [rtcManager, isVideoEnabled, setIsVideoEnabled]);
}

/**
 * Hook to toggle chat (mobile)
 */
export function useToggleCallChat() {
  const [chatVisible, setChatVisible] = useAtom(callChatVisibleAtom);

  return useCallback(() => {
    setChatVisible((prev) => !prev);
  }, [setChatVisible]);
}

/**
 * Hook to get all RTC state
 */
export function useRTCState() {
  const rtcManager = useAtomValue(rtcManagerAtom);
  const activeCallRoomId = useAtomValue(activeCallRoomIdAtom);
  const isCallConnected = useAtomValue(isCallConnectedAtom);
  const callMembers = useAtomValue(callMembersAtom);
  const localCallMember = useAtomValue(localCallMemberAtom);
  const isAudioEnabled = useAtomValue(isAudioEnabledAtom);
  const isVideoEnabled = useAtomValue(isVideoEnabledAtom);
  const chatVisible = useAtomValue(callChatVisibleAtom);

  const joinCall = useJoinCall();
  const leaveCall = useLeaveCall();
  const toggleAudio = useToggleAudio();
  const toggleVideo = useToggleVideo();
  const toggleChat = useToggleCallChat();

  return {
    rtcManager,
    activeCallRoomId,
    isCallConnected,
    callMembers,
    localCallMember,
    isAudioEnabled,
    isVideoEnabled,
    chatVisible,
    joinCall,
    leaveCall,
    toggleAudio,
    toggleVideo,
    toggleChat,
  };
}
