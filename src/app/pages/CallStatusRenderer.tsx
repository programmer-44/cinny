import React from 'react';
import { useAtomValue } from 'jotai';
import { CallStatus } from '../features/call-status';
import { activeCallRoomIdAtom } from '../state/rtc';
import { useMatrixClient } from '../hooks/useMatrixClient';

export function CallStatusRenderer() {
  const mx = useMatrixClient();
  const activeCallRoomId = useAtomValue(activeCallRoomIdAtom);

  if (!activeCallRoomId) return null;

  const room = mx.getRoom(activeCallRoomId);
  if (!room) return null;

  return <CallStatus room={room} />;
}
