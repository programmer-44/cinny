import React, { useState } from 'react';
import { Box, Button, Icon, Icons, Spinner, Text } from 'folds';
import { useAtomValue } from 'jotai';
import { SequenceCard } from '../../components/sequence-card';
import * as css from './styles.css';
import { ChatButton, ControlDivider, MicrophoneButton, SoundButton, VideoButton } from './Controls';
import { useIsDirectRoom, useRoom } from '../../hooks/useRoom';
import { useCallPreferences } from '../../state/hooks/callPreferences';
import { useJoinCall } from '../../components/RTCProvider';
import { activeCallRoomIdAtom } from '../../state/rtc';

type PrescreenControlsProps = {
  canJoin?: boolean;
};
export function PrescreenControls({ canJoin }: PrescreenControlsProps) {
  const room = useRoom();
  const activeCallRoomId = useAtomValue(activeCallRoomIdAtom);
  const direct = useIsDirectRoom();

  const inOtherCall = activeCallRoomId && activeCallRoomId !== room.roomId;

  const joinCall = useJoinCall();
  const [joining, setJoining] = useState(false);

  const disabled = inOtherCall || !canJoin;

  const { microphone, video, sound, toggleMicrophone, toggleVideo, toggleSound } =
    useCallPreferences();

  const handleJoinCall = async () => {
    setJoining(true);
    try {
      await joinCall(room.roomId);

      // Note: The initial audio/video state will be synced through the RTCProvider
      // based on the localMember state from the SDK. The preferences are stored
      // in the call preferences state and will be applied when the user toggles them.
    } catch (error) {
      console.error('Failed to join call:', error);
    } finally {
      setJoining(false);
    }
  };

  return (
    <SequenceCard
      className={css.ControlCard}
      variant="SurfaceVariant"
      gap="400"
      radii="500"
      alignItems="Center"
      justifyContent="SpaceBetween"
      wrap="Wrap"
    >
      <Box shrink="No" alignItems="Inherit" justifyContent="SpaceBetween" gap="200">
        <MicrophoneButton enabled={microphone} onToggle={toggleMicrophone} />
        <SoundButton enabled={sound} onToggle={toggleSound} />
      </Box>
      <ControlDivider />
      <Box shrink="No" alignItems="Inherit" justifyContent="SpaceBetween" gap="200">
        <VideoButton enabled={video} onToggle={toggleVideo} />
        <ChatButton />
      </Box>
      <Box grow="Yes" direction="Column">
        <Button
          variant={disabled ? 'Secondary' : 'Success'}
          fill={disabled ? 'Soft' : 'Solid'}
          onClick={handleJoinCall}
          disabled={disabled || joining}
          before={
            joining ? (
              <Spinner variant="Success" fill="Solid" size="200" />
            ) : (
              <Icon src={Icons.Phone} size="200" filled />
            )
          }
        >
          <Text size="B400">Join</Text>
        </Button>
      </Box>
    </SequenceCard>
  );
}
