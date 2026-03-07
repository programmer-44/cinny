import { atom } from 'jotai';
import { MatrixRTCManager } from '../features/rtc/MatrixRTCManager';
import type { SerializedMemberInfo, SerializedLocalMemberInfo } from '../features/rtc/sdk-types';

/**
 * Atom to store the active RTC manager instance
 */
const baseRtcManagerAtom = atom<MatrixRTCManager | undefined>(undefined);

export const rtcManagerAtom = atom<
  MatrixRTCManager | undefined,
  [MatrixRTCManager | undefined],
  void
>(
  (get) => get(baseRtcManagerAtom),
  (get, set, rtcManager) => {
    const prevRtcManager = get(baseRtcManagerAtom);
    if (rtcManager === prevRtcManager) return;

    if (prevRtcManager) {
      prevRtcManager.stop();
    }

    set(baseRtcManagerAtom, rtcManager);
  }
);

/**
 * Atom to store the active call room ID
 */
export const activeCallRoomIdAtom = atom<string | undefined>(undefined);

/**
 * Atom to store whether we're connected to the call
 */
export const isCallConnectedAtom = atom<boolean>(false);

/**
 * Atom to store call members
 */
export const callMembersAtom = atom<SerializedMemberInfo[]>([]);

/**
 * Atom to store local member state
 */
export const localCallMemberAtom = atom<SerializedLocalMemberInfo | null>(null);

/**
 * Atom to store audio enabled state
 */
export const isAudioEnabledAtom = atom<boolean>(true);

/**
 * Atom to store video enabled state
 */
export const isVideoEnabledAtom = atom<boolean>(false);

/**
 * Atom for chat visibility (mobile)
 */
export const callChatVisibleAtom = atom<boolean>(false);
