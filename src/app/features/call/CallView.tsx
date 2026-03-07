import React, { useEffect } from 'react';
import { Badge, Box, color, Header, Scroll, Text, toRem } from 'folds';
import { useAtomValue } from 'jotai';
import { ContainerColor } from '../../styles/ContainerColor.css';
import { PrescreenControls } from './PrescreenControls';
import { usePowerLevelsContext } from '../../hooks/usePowerLevels';
import { useRoom } from '../../hooks/useRoom';
import { useRoomCreators } from '../../hooks/useRoomCreators';
import { useRoomPermissions } from '../../hooks/useRoomPermissions';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { StateEvent } from '../../../types/matrix/room';
import { useCallMembers, useCallSession } from '../../hooks/useCall';
import { CallMemberRenderer } from './CallMemberCard';
import { VideoTrack } from './VideoTrack';
import {
  activeCallRoomIdAtom,
  isCallConnectedAtom,
  callMembersAtom,
  localCallMemberAtom,
} from '../../state/rtc';
import * as css from './styles.css';

function JoinMessage({ hasParticipant }: { hasParticipant?: boolean }) {
  if (hasParticipant) return null;

  return (
    <Text style={{ margin: 'auto' }} size="L400" align="Center">
      Voice chat’s empty — Be the first to hop in!
    </Text>
  );
}

function NoPermissionMessage() {
  return (
    <Text style={{ margin: 'auto' }} size="L400" align="Center">
      You don&#39;t have permission to join!
    </Text>
  );
}

function AlreadyInCallMessage() {
  return (
    <Text style={{ margin: 'auto', color: color.Warning.Main }} size="L400" align="Center">
      Already in another call — End the current call to join!
    </Text>
  );
}

export function CallView() {
  const mx = useMatrixClient();
  const room = useRoom();

  const powerLevels = usePowerLevelsContext();
  const creators = useRoomCreators(room);

  const permissions = useRoomPermissions(creators, powerLevels);
  const canJoin = permissions.event(StateEvent.GroupCallMemberPrefix, mx.getSafeUserId());

  const callSession = useCallSession(room);
  const callMembers = useCallMembers(room, callSession);
  const hasParticipant = callMembers.length > 0;

  // Get new RTC state
  const activeCallRoomId = useAtomValue(activeCallRoomIdAtom);
  const isCallConnected = useAtomValue(isCallConnectedAtom);
  const rtcCallMembers = useAtomValue(callMembersAtom);
  const localCallMember = useAtomValue(localCallMemberAtom);

  // Determine if we should show the video grid (user is in active call in THIS room)
  const isInActiveCall = activeCallRoomId === room.roomId;
  const inOtherCall = activeCallRoomId && activeCallRoomId !== room.roomId;
  const showVideoGrid = isInActiveCall && (isCallConnected || localCallMember !== null);

  // Debug logging
  useEffect(() => {
    console.log('[CallView] State:', {
      roomId: room.roomId,
      activeCallRoomId,
      isCallConnected,
      localCallMember: localCallMember?.userId,
      rtcCallMembersCount: rtcCallMembers.length,
      isInActiveCall,
      showVideoGrid,
    });
  }, [
    room.roomId,
    activeCallRoomId,
    isCallConnected,
    localCallMember,
    rtcCallMembers.length,
    isInActiveCall,
    showVideoGrid,
  ]);

  return (
    <Box
      className={ContainerColor({ variant: 'Surface' })}
      style={{ minWidth: toRem(280) }}
      grow="Yes"
    >
      {/* Video grid view - shown when in active call */}
      {showVideoGrid && (
        <Box className={css.VideoGrid}>
          {/* Render local participant first */}
          {localCallMember && <VideoTrack key="local" member={localCallMember} isLocal />}
          {/* Render remote participants */}
          {rtcCallMembers.map((member) => (
            <VideoTrack
              key={`${member.userId}-${member.deviceId}`}
              member={member}
              isLocal={false}
            />
          ))}
        </Box>
      )}

      {/* Prescreen view - shown when not in call */}
      {!showVideoGrid && (
        <Scroll variant="Surface" hideTrack>
          <Box className={css.CallViewContent} alignItems="Center" justifyContent="Center">
            <Box style={{ maxWidth: toRem(382), width: '100%' }} direction="Column" gap="100">
              {hasParticipant && (
                <Header size="300">
                  <Box grow="Yes" alignItems="Center">
                    <Text size="L400">Participant</Text>
                  </Box>
                  <Badge variant="Critical" fill="Solid" size="400">
                    <Text as="span" size="L400" truncate>
                      {callMembers.length} Live
                    </Text>
                  </Badge>
                </Header>
              )}
              <CallMemberRenderer members={callMembers} />
              <PrescreenControls canJoin={canJoin} />
              <Header size="300">
                {!inOtherCall &&
                  (canJoin ? (
                    <JoinMessage hasParticipant={hasParticipant} />
                  ) : (
                    <NoPermissionMessage />
                  ))}
                {inOtherCall && <AlreadyInCallMessage />}
              </Header>
            </Box>
          </Box>
        </Scroll>
      )}
    </Box>
  );
}
