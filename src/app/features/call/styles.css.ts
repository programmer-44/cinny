import { style } from '@vanilla-extract/css';
import { color, config, toRem } from 'folds';

export const CallViewContent = style({
  padding: config.space.S400,
  paddingRight: 0,
  minHeight: '100%',
});

export const ControlCard = style({
  padding: config.space.S300,
});

export const ControlDivider = style({
  height: toRem(24),
});

export const CallMemberCard = style({
  padding: config.space.S300,
});

export const VideoGrid = style({
  display: 'grid',
  gap: config.space.S200,
  padding: config.space.S400,
  width: '100%',
  height: '100%',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gridAutoRows: 'minmax(200px, 1fr)',
  alignContent: 'start',
});

export const VideoTrackContainer = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: toRem(200),
  backgroundColor: color.Background.Container,
  borderRadius: config.radii.R400,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const VideoElement = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const AvatarPlaceholder = style({
  width: '100%',
  height: '100%',
  backgroundColor: color.Background.ContainerActive,
});

export const ParticipantInfo = style({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: `${config.space.S200} ${config.space.S300}`,
  background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent)',
  color: 'white',
  pointerEvents: 'none',
});

export const ConnectingOverlay = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: 'white',
});
