import React, { useEffect, useRef } from 'react';
import { Avatar, Box, Icon, Icons, Text } from 'folds';
import { useAtomValue } from 'jotai';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { useRoom } from '../../hooks/useRoom';
import { UserAvatar } from '../../components/user-avatar';
import { getMemberAvatarMxc, getMemberDisplayName } from '../../utils/room';
import { getMxIdLocalPart, mxcUrlToHttp } from '../../utils/matrix';
import type { SerializedMemberInfo, SerializedLocalMemberInfo } from '../rtc/sdk-types';
import { rtcManagerAtom } from '../../state/rtc';
import * as css from './styles.css';

type VideoTrackProps = {
  member: SerializedMemberInfo | SerializedLocalMemberInfo;
  isLocal?: boolean;
};

/**
 * VideoTrack component renders a single participant's video stream.
 * It handles LiveKit track attachment/detachment and shows an avatar placeholder
 * when video is disabled.
 */
export function VideoTrack({ member, isLocal = false }: VideoTrackProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const room = useRoom();
  const rtcManager = useAtomValue(rtcManagerAtom);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const userId = member.userId;
  const name = getMemberDisplayName(room, userId) ?? getMxIdLocalPart(userId) ?? userId;
  const avatarMxc = getMemberAvatarMxc(room, userId);
  const avatarUrl = avatarMxc
    ? mxcUrlToHttp(mx, avatarMxc, useAuthentication, 96, 96) ?? undefined
    : undefined;

  const isVideoEnabled = member.isCameraEnabled ?? false;
  const isAudioEnabled = member.isMicEnabled ?? false;
  const connectionState = member.connectionState ?? 'disconnected';
  const isConnecting = connectionState === 'connecting';
  const isConnected = connectionState === 'connected';

  // Attach LiveKit video and audio tracks to elements
  useEffect(() => {
    if (!rtcManager || !member.participantIdentity) {
      return;
    }

    // Get the LiveKit participant
    const participant = isLocal
      ? rtcManager.getLocalParticipant()
      : rtcManager.getParticipant(member.participantIdentity);

    if (!participant) {
      console.log('[VideoTrack] No participant found for identity:', member.participantIdentity);
      return;
    }

    console.log('[VideoTrack] Got participant:', participant.identity, {
      videoTracks: participant.videoTrackPublications.size,
      audioTracks: participant.audioTrackPublications.size,
    });

    // Attach video track
    if (videoRef.current && isVideoEnabled) {
      const videoPublications = [...participant.videoTrackPublications.values()];
      const videoTrack = videoPublications[0]?.track;

      if (videoTrack) {
        console.log('[VideoTrack] Attaching video track');
        videoTrack.attach(videoRef.current);
      }
    }

    // Attach audio track (only for remote participants)
    if (audioRef.current && !isLocal) {
      const audioPublications = [...participant.audioTrackPublications.values()];
      const audioTrack = audioPublications[0]?.track;

      if (audioTrack) {
        console.log('[VideoTrack] Attaching audio track');
        audioTrack.attach(audioRef.current);
      }
    }

    // Cleanup: detach tracks when component unmounts or dependencies change
    return () => {
      if (videoRef.current) {
        const videoPublications = [...participant.videoTrackPublications.values()];
        const videoTrack = videoPublications[0]?.track;
        if (videoTrack) {
          console.log('[VideoTrack] Detaching video track');
          videoTrack.detach(videoRef.current!);
        }
      }

      if (audioRef.current && !isLocal) {
        const audioPublications = [...participant.audioTrackPublications.values()];
        const audioTrack = audioPublications[0]?.track;
        if (audioTrack) {
          console.log('[VideoTrack] Detaching audio track');
          audioTrack.detach(audioRef.current!);
        }
      }
    };
  }, [rtcManager, isLocal, member.participantIdentity, isVideoEnabled]);

  return (
    <Box className={css.VideoTrackContainer}>
      {/* Video element - shown when video is enabled */}
      {isVideoEnabled && (
        <video ref={videoRef} className={css.VideoElement} autoPlay playsInline muted={isLocal} />
      )}

      {/* Audio element - hidden, for remote participants only */}
      {!isLocal && <audio ref={audioRef} autoPlay />}

      {/* Avatar placeholder - shown when video is disabled */}
      {!isVideoEnabled && (
        <Box className={css.AvatarPlaceholder} alignItems="Center" justifyContent="Center">
          <Avatar size="500" radii="400">
            <UserAvatar
              userId={userId}
              src={avatarUrl}
              alt={name}
              renderFallback={() => <Icon size="100" src={Icons.User} filled />}
            />
          </Avatar>
        </Box>
      )}

      {/* Connecting overlay */}
      {isConnecting && (
        <Box className={css.ConnectingOverlay} alignItems="Center" justifyContent="Center">
          <Text size="L400">Connecting...</Text>
        </Box>
      )}

      {/* Participant info overlay - name and mic status */}
      {isConnected && (
        <Box className={css.ParticipantInfo} gap="200" alignItems="Center">
          <Text size="L400" truncate>
            {name}
            {isLocal && ' (You)'}
          </Text>
          {!isAudioEnabled && <Icon src={Icons.MicMute} size="50" filled />}
        </Box>
      )}
    </Box>
  );
}
