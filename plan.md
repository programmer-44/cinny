# Implementation Plan: Element Call Headless SDK Integration

## Executive Summary

This document outlines a comprehensive plan to replace Cinny's current widget-based Element Call integration with the Element Call Headless SDK. This transition will eliminate the iframe/widget architecture in favor of a native, programmatic integration that provides better performance, cleaner code, and direct control over the calling experience.

### Key Benefits

**Performance**:

- ✅ No iframe overhead (memory, rendering, sandboxing)
- ✅ Direct WebRTC connection management
- ✅ Eliminated postMessage communication latency
- ✅ Reduced CPU usage (no duplicate event processing)

**Architecture**:

- ✅ Native TypeScript integration
- ✅ Elimination of complex iframe positioning logic
- ✅ Direct access to LiveKit API
- ✅ Simpler state management

**Developer Experience**:

- ✅ Better debugging (no cross-context debugging)
- ✅ Type-safe SDK API
- ✅ Reactive programming with RxJS observables
- ✅ Cleaner component structure

**User Experience**:

- ✅ Faster call join times
- ✅ More responsive controls
- ✅ Custom UI fully integrated with Cinny's design
- ✅ Better error handling and feedback

### Migration Complexity

**Difficulty**: Medium-High  
**Estimated Effort**: 2-3 weeks full-time development  
**Risk Level**: Medium (experimental SDK, but well-isolated changes)

---

## Current vs. Proposed Architecture

### Current Architecture (Widget-Based)

```
┌─────────────────────────────────────────────────────────┐
│                    Cinny Application                     │
│                                                           │
│  CallProvider (State) → PersistentCallContainer          │
│         ↓                        ↓                        │
│  SmallWidget ←→ SmallWidgetDriver (Capabilities)         │
│         ↓                                                 │
│  ═══════════════════════════════════════════════         │
│        postMessage API (Cross-Context)                    │
│  ═══════════════════════════════════════════════         │
│         ↓                                                 │
│  ┌──────────────────────────────────────────┐            │
│  │  <iframe> Element Call Widget            │            │
│  │    - Full Element Call UI                │            │
│  │    - WebRTC handling                     │            │
│  │    - Matrix RTC protocol                 │            │
│  └──────────────────────────────────────────┘            │
└───────────────────────────────────────────────────────────┘
```

**Issues**:

- Complex iframe positioning
- postMessage communication overhead
- Capability negotiation complexity
- Event synchronization challenges
- DOM mutation observers for button detection
- Sandboxing limitations

### Proposed Architecture (Headless SDK)

```
┌─────────────────────────────────────────────────────────┐
│                    Cinny Application                     │
│                                                           │
│  CallProvider (Enhanced)                                  │
│         ↓                                                 │
│  MatrixRTCManager (New)                                   │
│    - createMatrixRTCSdk() wrapper                        │
│    - SDK lifecycle management                             │
│    - Observable subscriptions                             │
│         ↓                                                 │
│  ┌────────────────────────────────────┐                  │
│  │  Element Call Headless SDK         │                  │
│  │    - MatrixRTCSessionManager       │                  │
│  │    - CallViewModel (RxJS)          │                  │
│  │    - LiveKit Client                │                  │
│  │    - Per-participant E2EE          │                  │
│  └────────────────────────────────────┘                  │
│         ↓                                                 │
│  CallView (Cinny UI) + RoomCallNavStatus                  │
│    - Native controls (mic, camera, hangup)               │
│    - Participant rendering                                │
│    - Connection state display                             │
└───────────────────────────────────────────────────────────┘
```

**Advantages**:

- Direct function calls (no postMessage)
- Single-context debugging
- Native TypeScript types
- Reactive state via RxJS observables
- No iframe complexity

---

## Phase-by-Phase Implementation Plan

## Phase 1: Setup and Dependencies (2-3 days) ✅ COMPLETED

### 1.1 Install Dependencies ✅

**New Dependencies Required**:

```json
{
  "dependencies": {
    "livekit-client": "^2.x.x", // WebRTC client
    "rxjs": "^7.x.x" // Already may be installed
  }
}
```

**Tasks**:

- [x] Run `npm install livekit-client rxjs`
- [ ] Verify matrix-js-sdk version compatibility (need v38+)
- [ ] Check for peer dependency conflicts

**Files to Modify**:

- `package.json`
- `package-lock.json`

### 1.2 Build Element Call Headless SDK

The headless SDK is in `/element-call-headless-sdk/` but needs to be built and integrated.

**Option A: Build as Module (Recommended)**

```bash
cd element-call-headless-sdk
yarn
yarn build:sdk  # Creates dist/matrixrtc-sdk.js
```

Then either:

1. Host the built file statically in `public/`
2. Import directly as ES module (if build supports it)

**Option B: Copy Source Files**
Copy the SDK source into Cinny's codebase:

```
src/
  app/
    features/
      rtc/
        headless-sdk/
          main.ts
          helper.ts
          (+ dependencies from Element Call repo)
```

**Recommendation**: Use Option A initially for cleaner separation, then consider Option B if deep customization is needed.

**Tasks**:

- [ ] Build the SDK: `yarn build:sdk` in element-call-headless-sdk
- [ ] Copy `dist/matrixrtc-sdk.js` to `public/rtc/matrixrtc-sdk.js`
- [ ] Add TypeScript type definitions
- [ ] Create import wrapper module

**Files to Create**:

- `public/rtc/matrixrtc-sdk.js` (compiled SDK)
- `src/app/features/rtc/sdk-types.ts` (type definitions)

### 1.3 Create Type Definitions

Since the SDK is built as JavaScript, create TypeScript definitions:

**File**: `src/app/features/rtc/sdk-types.ts`

```typescript
import type { CallMembership } from 'matrix-js-sdk/lib/matrixrtc';
import type { LocalParticipant, RemoteParticipant } from 'livekit-client';
import type { Observable } from 'rxjs';

export interface Connection {
  // Define based on Element Call's Connection type
  state: 'connected' | 'connecting' | 'disconnected';
  // ... other fields
}

export interface MemberInfo {
  connection: Connection | null;
  membership: CallMembership;
  participant: LocalParticipant | RemoteParticipant | null;
}

export interface LocalMemberInfo {
  connection: Connection | null;
  membership: CallMembership;
  participant: LocalParticipant | null;
}

export interface DataMessage {
  rtcBackendIdentity: string;
  data: string;
}

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

export interface CreateMatrixRTCSdkFn {
  (application?: string, id?: string, sticky?: boolean): Promise<MatrixRTCSdk>;
}
```

**Tasks**:

- [ ] Create type definitions matching SDK interface
- [ ] Import necessary types from matrix-js-sdk and livekit-client
- [ ] Document each interface property

---

## Phase 2: Core SDK Integration (4-5 days)

### 2.1 Create MatrixRTCManager

This new module will wrap the headless SDK and provide a clean interface for Cinny.

**File**: `src/app/features/rtc/MatrixRTCManager.ts`

```typescript
import { MatrixClient } from 'matrix-js-sdk';
import { Subscription } from 'rxjs';
import type { MatrixRTCSdk, CreateMatrixRTCSdkFn, MemberInfo } from './sdk-types';

export interface MatrixRTCManagerConfig {
  application?: string;
  id?: string;
  sticky?: boolean;
}

export class MatrixRTCManager {
  private sdk: MatrixRTCSdk | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private mx: MatrixClient,
    private roomId: string,
    private config: MatrixRTCManagerConfig = {}
  ) {}

  async initialize(): Promise<void> {
    // Dynamically import the SDK
    const { createMatrixRTCSdk } = (await import(
      /* webpackIgnore: true */ '/rtc/matrixrtc-sdk.js'
    )) as { createMatrixRTCSdk: CreateMatrixRTCSdkFn };

    this.sdk = await createMatrixRTCSdk(
      this.config.application || 'm.call',
      this.config.id || '',
      this.config.sticky || false
    );
  }

  join(): void {
    if (!this.sdk) throw new Error('SDK not initialized');
    this.sdk.join();
  }

  leave(): void {
    if (!this.sdk) throw new Error('SDK not initialized');
    this.sdk.leave();
  }

  stop(): void {
    if (!this.sdk) return;

    // Unsubscribe all observables
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    // Stop SDK
    this.sdk.stop();
    this.sdk = null;
  }

  // Expose observables with subscription management
  subscribeToMembers(callback: (members: MemberInfo[]) => void): () => void {
    if (!this.sdk) throw new Error('SDK not initialized');

    const subscription = this.sdk.members$.subscribe(callback);
    this.subscriptions.push(subscription);

    return () => {
      subscription.unsubscribe();
      this.subscriptions = this.subscriptions.filter((s) => s !== subscription);
    };
  }

  subscribeToConnected(callback: (connected: boolean) => void): () => void {
    if (!this.sdk) throw new Error('SDK not initialized');

    const subscription = this.sdk.connected$.subscribe(callback);
    this.subscriptions.push(subscription);

    return () => {
      subscription.unsubscribe();
      this.subscriptions = this.subscriptions.filter((s) => s !== subscription);
    };
  }

  subscribeToLocalMember(callback: (member: any) => void): () => void {
    if (!this.sdk) throw new Error('SDK not initialized');

    const subscription = this.sdk.localMember$.subscribe(callback);
    this.subscriptions.push(subscription);

    return () => {
      subscription.unsubscribe();
      this.subscriptions = this.subscriptions.filter((s) => s !== subscription);
    };
  }

  subscribeToData(callback: (data: any) => void): () => void {
    if (!this.sdk) throw new Error('SDK not initialized');

    const subscription = this.sdk.data$.subscribe(callback);
    this.subscriptions.push(subscription);

    return () => {
      subscription.unsubscribe();
      this.subscriptions = this.subscriptions.filter((s) => s !== subscription);
    };
  }

  async sendData(data: unknown): Promise<void> {
    if (!this.sdk?.sendData) throw new Error('SDK not initialized');
    await this.sdk.sendData(data);
  }

  async sendRoomMessage(message: string): Promise<void> {
    if (!this.sdk?.sendRoomMessage) throw new Error('SDK not initialized');
    await this.sdk.sendRoomMessage(message);
  }

  // Getters for current values
  get members(): MemberInfo[] {
    return this.sdk?.members$.value || [];
  }

  get connected(): boolean {
    return this.sdk?.connected$.value || false;
  }

  get localMember(): any {
    return this.sdk?.localMember$.value || null;
  }
}
```

**Key Design Decisions**:

- Wraps SDK lifecycle (initialize, join, leave, stop)
- Manages RxJS subscriptions to prevent memory leaks
- Provides both callback-based subscriptions and value getters
- Handles dynamic import of SDK JavaScript file
- Type-safe interface for Cinny's needs

**Tasks**:

- [ ] Create MatrixRTCManager class
- [ ] Implement SDK initialization
- [ ] Add subscription management
- [ ] Add error handling
- [ ] Write unit tests

### 2.2 Update CallProvider

Modify `CallProvider.tsx` to use the new `MatrixRTCManager` instead of widget-based approach.

**File**: `src/app/pages/client/call/CallProvider.tsx`

**Changes Required**:

1. **Remove widget-related state**:

```typescript
// REMOVE:
const [activeClientWidgetApi, setActiveClientWidgetApiState] = useState<ClientWidgetApi | null>(
  null
);
const [activeClientWidget, setActiveClientWidget] = useState<SmallWidget | null>(null);
const [activeClientWidgetIframeRef, setActiveClientWidgetIframeRef] =
  useState<HTMLIFrameElement | null>(null);

// ADD:
const [rtcManager, setRtcManager] = useState<MatrixRTCManager | null>(null);
const [callMembers, setCallMembers] = useState<MemberInfo[]>([]);
```

2. **Initialize SDK when joining a call**:

```typescript
const joinCall = useCallback(
  async (roomId: string) => {
    if (rtcManager) {
      rtcManager.stop();
    }

    const manager = new MatrixRTCManager(mx, roomId, {
      application: 'm.call',
      sticky: false,
    });

    try {
      await manager.initialize();
      setRtcManager(manager);
      setActiveCallRoomId(roomId);

      // Subscribe to state changes
      manager.subscribeToConnected((connected) => {
        setIsActiveCallReady(connected);
      });

      manager.subscribeToMembers((members) => {
        setCallMembers(members);
      });

      manager.subscribeToLocalMember((member) => {
        // Extract audio/video state from LiveKit participant
        if (member?.participant) {
          const audioTrack = member.participant.audioTrackPublications.values().next().value;
          const videoTrack = member.participant.videoTrackPublications.values().next().value;

          setIsAudioEnabledState(audioTrack?.isMuted === false);
          setIsVideoEnabledState(videoTrack?.isMuted === false);
        }
      });

      // Join the call
      manager.join();
    } catch (error) {
      console.error('Failed to join call:', error);
      setRtcManager(null);
    }
  },
  [mx]
);
```

3. **Update hangUp to use SDK**:

```typescript
const hangUp = useCallback(() => {
  if (rtcManager) {
    rtcManager.leave();
    // Note: SDK automatically handles cleanup via leave$ subscription
  }

  setActiveCallRoomId(null);
  setRtcManager(null);
  setIsActiveCallReady(false);
  setCallMembers([]);
}, [rtcManager]);
```

4. **Update toggleAudio/toggleVideo**:

```typescript
const toggleAudio = useCallback(async () => {
  if (!rtcManager) return;

  const localMember = rtcManager.localMember;
  if (!localMember?.participant) return;

  const newState = !isAudioEnabled;

  try {
    // Mute/unmute via LiveKit API
    await localMember.participant.setMicrophoneEnabled(newState);
    setIsAudioEnabledState(newState);
  } catch (error) {
    console.error('Failed to toggle audio:', error);
  }
}, [rtcManager, isAudioEnabled]);

const toggleVideo = useCallback(async () => {
  if (!rtcManager) return;

  const localMember = rtcManager.localMember;
  if (!localMember?.participant) return;

  const newState = !isVideoEnabled;

  try {
    // Enable/disable camera via LiveKit API
    await localMember.participant.setCameraEnabled(newState);
    setIsVideoEnabledState(newState);
  } catch (error) {
    console.error('Failed to toggle video:', error);
  }
}, [rtcManager, isVideoEnabled]);
```

5. **Remove widget event handlers**:

```typescript
// REMOVE all useEffect hooks that handle:
// - handleHangup
// - handleMediaStateUpdate
// - handleOnScreenStateUpdate
// - handleOnTileLayout
// - handleJoin
// These are no longer needed with direct SDK access
```

6. **Update context interface**:

```typescript
interface CallContextState {
  activeCallRoomId: string | null;
  setActiveCallRoomId: (roomId: string | null) => void;
  viewedCallRoomId: string | null;
  setViewedCallRoomId: (roomId: string | null) => void;
  joinCall: (roomId: string) => Promise<void>; // NEW
  hangUp: () => void;
  rtcManager: MatrixRTCManager | null; // NEW
  callMembers: MemberInfo[]; // NEW
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isChatOpen: boolean;
  isActiveCallReady: boolean;
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  toggleChat: () => Promise<void>;
}
```

**Tasks**:

- [ ] Refactor CallProvider to use MatrixRTCManager
- [ ] Remove all widget-related code
- [ ] Implement new joinCall method
- [ ] Update audio/video toggle logic
- [ ] Remove widget event handlers
- [ ] Update TypeScript interfaces
- [ ] Test state transitions

---

## Phase 3: UI Component Updates (3-4 days)

### 3.1 Remove PersistentCallContainer

**File**: `src/app/pages/client/call/PersistentCallContainer.tsx`

This entire component can be **deleted** since we no longer need:

- Persistent iframe
- Widget URL generation
- Widget API initialization
- Iframe positioning context

**Tasks**:

- [ ] Delete `PersistentCallContainer.tsx`
- [ ] Delete `CallRefContext` export
- [ ] Remove from Router.tsx imports

### 3.2 Refactor CallView

**File**: `src/app/features/call/CallView.tsx`

**Major Changes**:

1. **Remove iframe positioning logic**:

```typescript
// DELETE:
const callIframeRef = useContext(CallRefContext);
const iframeHostRef = useRef<HTMLDivElement>(null);
const originalIframeStylesRef = useRef<OriginalStyles | null>(null);
const applyFixedPositioningToIframe = ...
// All positioning-related code

// The entire useEffect for positioning can be removed
```

2. **Add video rendering area**:

```typescript
import { VideoTrack } from './VideoTrack'; // New component

export function CallView({ room }: { room: Room }) {
  const { callMembers, isActiveCallReady, activeCallRoomId, joinCall, hangUp } = useCallState();

  const isActiveCallRoom = activeCallRoomId === room.roomId;

  // ... existing code ...

  return (
    <Box grow="Yes" direction="Column">
      {isActiveCallRoom && isActiveCallReady ? (
        // Active call view with video tracks
        <Box grow="Yes" className={css.VideoGrid}>
          {callMembers.map((member) => (
            <VideoTrack key={member.membership.membershipID} member={member} />
          ))}
        </Box>
      ) : (
        // Pre-join view (existing participant grid)
        <Box grow="Yes" justifyContent="Center" alignItems="Center" direction="Column">
          <CallViewUserGrid>
            {callMembers.slice(0, 6).map((member) => (
              <CallViewUser
                key={member.membership.membershipID}
                room={room}
                callMembership={member.membership}
              />
            ))}
          </CallViewUserGrid>
          <Button onClick={() => joinCall(room.roomId)}>Join Voice</Button>
        </Box>
      )}
    </Box>
  );
}
```

3. **Update click handler**:

```typescript
const handleJoinVCClick: MouseEventHandler<HTMLElement> = async (evt) => {
  if (!canJoin) return;

  evt.stopPropagation();

  if (!isActiveCallRoom) {
    // Hang up any existing call
    if (activeCallRoomId) {
      hangUp();
    }

    // Join new call
    await joinCall(room.roomId);
  }
};
```

**Tasks**:

- [ ] Remove iframe-related code
- [ ] Add video rendering area
- [ ] Update join button handler
- [ ] Simplify component structure
- [ ] Update styles

### 3.3 Create VideoTrack Component

**File**: `src/app/features/call/VideoTrack.tsx`

This new component renders individual video tracks from LiveKit participants.

```typescript
import React, { useEffect, useRef } from 'react';
import { Box, Avatar, Text } from 'folds';
import type { MemberInfo } from '../../rtc/sdk-types';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { getMemberDisplayName } from '../../utils/room';

interface VideoTrackProps {
  member: MemberInfo;
}

export function VideoTrack({ member }: VideoTrackProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mx = useMatrixClient();

  const userId = member.membership.sender;
  const participant = member.participant;
  const isConnected = member.connection?.state === 'connected';

  useEffect(() => {
    if (!participant || !videoRef.current) return;

    // Subscribe to video tracks
    const videoTrack = Array.from(participant.videoTrackPublications.values())[0];

    if (videoTrack?.track) {
      // Attach video track to video element
      videoTrack.track.attach(videoRef.current);

      return () => {
        videoTrack.track?.detach(videoRef.current!);
      };
    }
  }, [participant]);

  const displayName = getMemberDisplayName(room, userId);
  const hasVideo = participant?.isCameraEnabled === true;

  return (
    <Box className={css.VideoTrackContainer}>
      {hasVideo ? (
        <video ref={videoRef} autoPlay playsInline className={css.VideoElement} />
      ) : (
        <Box className={css.AvatarPlaceholder}>
          <Avatar userId={userId} size="lg" />
          <Text>{displayName}</Text>
        </Box>
      )}

      {!isConnected && (
        <Box className={css.ConnectingOverlay}>
          <Spinner />
          <Text>Connecting...</Text>
        </Box>
      )}

      <Box className={css.ParticipantInfo}>
        <Text>{displayName}</Text>
        {!participant?.isMicrophoneEnabled && <Icon src={Icons.MicMute} size="200" />}
      </Box>
    </Box>
  );
}
```

**Styling** (in `CallView.css.ts`):

```typescript
export const VideoTrackContainer = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  backgroundColor: color.Surface.Container,
  borderRadius: config.radii.R400,
  overflow: 'hidden',
});

export const VideoElement = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

export const AvatarPlaceholder = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  gap: config.space.S200,
});

export const VideoGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: config.space.S300,
  padding: config.space.S400,
  width: '100%',
  height: '100%',
});

export const ParticipantInfo = style({
  position: 'absolute',
  bottom: config.space.S200,
  left: config.space.S200,
  display: 'flex',
  alignItems: 'center',
  gap: config.space.S100,
  padding: `${config.space.S100} ${config.space.S200}`,
  backgroundColor: color.Surface.ContainerActive,
  borderRadius: config.radii.R300,
});
```

**Tasks**:

- [ ] Create VideoTrack component
- [ ] Implement video track attachment
- [ ] Add audio indicator (muted/unmuted)
- [ ] Add connection state overlay
- [ ] Style component
- [ ] Handle track detachment on unmount

### 3.4 Update useCallMemberships Hook

**File**: `src/app/hooks/useCallMemberships.ts`

This hook currently uses MatrixRTC API directly. We should update it to use the CallProvider's members instead:

```typescript
// SIMPLIFIED VERSION - get members from context
export const useCallMembers = (roomId: string): CallMembership[] => {
  const { callMembers, activeCallRoomId } = useCallState();

  if (activeCallRoomId !== roomId) {
    // Not in this call, use MatrixRTC API for passive observation
    // Keep existing implementation for showing "X people in call" indicator
    return useMatrixRTCMembers(roomId);
  }

  // In active call, use SDK members
  return callMembers.map((m) => m.membership);
};

// Original implementation for passive observation
function useMatrixRTCMembers(roomId: string): CallMembership[] {
  // ... existing implementation ...
}
```

**Tasks**:

- [ ] Refactor to use CallProvider members for active calls
- [ ] Keep MatrixRTC API for passive observation
- [ ] Update return types

### 3.5 Update RoomCallNavStatus

**File**: `src/app/features/room-nav/RoomCallNavStatus.tsx`

Minor updates needed:

```typescript
export function CallNavStatus() {
  const {
    activeCallRoomId,
    isActiveCallReady,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    hangUp,
  } = useCallState();

  // All existing code remains the same!
  // The component interface doesn't change

  return (
    // ... existing JSX ...
  );
}
```

**No changes required** - the component already uses the correct interface from CallProvider.

**Tasks**:

- [ ] Verify component still works
- [ ] Test audio/video toggles
- [ ] Test hangup button

---

## Phase 4: Remove Old Infrastructure (1-2 days)

### 4.1 Delete Widget-Related Files

**Files to Delete**:

- `src/app/features/call/SmallWidget.ts`
- `src/app/features/call/SmallWidgetDriver.ts`
- `src/app/features/call/CinnyWidget.ts`
- `src/app/pages/client/call/PersistentCallContainer.tsx`

**Tasks**:

- [ ] Remove SmallWidget.ts
- [ ] Remove SmallWidgetDriver.ts
- [ ] Remove CinnyWidget.ts
- [ ] Remove PersistentCallContainer.tsx
- [ ] Remove CallRefContext

### 4.2 Update Router

**File**: `src/app/pages/Router.tsx`

```typescript
// REMOVE:
import { PersistentCallContainer } from './client/call/PersistentCallContainer';

// UPDATE render:
<CallProvider>
  {/* Remove PersistentCallContainer wrapper */}
  <Routes>{/* ... existing routes ... */}</Routes>
</CallProvider>;
```

**Tasks**:

- [ ] Remove PersistentCallContainer import
- [ ] Remove PersistentCallContainer wrapper
- [ ] Verify routing still works

### 4.3 Remove Element Call Embedded Package

**File**: `package.json`

```json
// REMOVE:
"@element-hq/element-call-embedded": "0.16.3"
```

**File**: `vite.config.js`

```javascript
// REMOVE from copyFiles.targets:
{
  src: 'node_modules/@element-hq/element-call-embedded/dist/*',
  dest: 'public/element-call',
}
```

**Tasks**:

- [ ] Remove package from package.json
- [ ] Remove vite copy configuration
- [ ] Run `npm install` to update lock file
- [ ] Delete `public/element-call/` directory if it exists

### 4.4 Clean Up Configuration

**File**: `config.json`

```json
// REMOVE (no longer needed):
"elementCallUrl": null
```

**File**: `src/app/hooks/useClientConfig.ts`

```typescript
// REMOVE elementCallUrl from interface
```

**Tasks**:

- [ ] Remove elementCallUrl from config.json
- [ ] Remove from useClientConfig hook
- [ ] Update documentation

---

## Phase 5: Testing and Polish (3-4 days)

### 5.1 Unit Tests

**Tests to Write**:

1. **MatrixRTCManager** (`src/app/features/rtc/MatrixRTCManager.test.ts`):

   - [ ] Initialize SDK successfully
   - [ ] Join call
   - [ ] Leave call
   - [ ] Stop SDK and cleanup
   - [ ] Subscribe to observables
   - [ ] Unsubscribe properly
   - [ ] Handle errors gracefully

2. **CallProvider** (`src/app/pages/client/call/CallProvider.test.tsx`):

   - [ ] Join call flow
   - [ ] Hang up flow
   - [ ] Toggle audio
   - [ ] Toggle video
   - [ ] State transitions
   - [ ] Multiple calls (hang up previous)

3. **VideoTrack** (`src/app/features/call/VideoTrack.test.tsx`):
   - [ ] Render with video track
   - [ ] Render without video (avatar fallback)
   - [ ] Attach/detach track properly
   - [ ] Handle connection states

### 5.2 Integration Tests

**Test Scenarios**:

1. **Basic Call Flow**:

   - [ ] Open call room
   - [ ] Click "Join Voice"
   - [ ] Verify connection status
   - [ ] See video tracks
   - [ ] Hang up
   - [ ] Verify cleanup

2. **Multiple Participants**:

   - [ ] Join with user A
   - [ ] Join with user B
   - [ ] Verify both see each other
   - [ ] User A hangs up
   - [ ] Verify user B still in call

3. **Audio/Video Controls**:

   - [ ] Toggle mic (verify muted state)
   - [ ] Toggle camera (verify video on/off)
   - [ ] Other participant sees changes

4. **Navigation**:

   - [ ] Join call in room A
   - [ ] Navigate to room B
   - [ ] Verify call continues (nav status bar)
   - [ ] Navigate back to room A
   - [ ] Verify video still playing

5. **Error Handling**:
   - [ ] Join with denied camera permission
   - [ ] Join with denied mic permission
   - [ ] Network disconnect
   - [ ] SFU connection failure

### 5.3 Manual Testing Checklist

**Desktop**:

- [ ] Join call as first participant
- [ ] Join call as second participant
- [ ] Multiple participants (3+)
- [ ] Audio toggle works
- [ ] Video toggle works
- [ ] Hang up works
- [ ] Navigate during call (call persists)
- [ ] Return to call room (video displays)
- [ ] Chat alongside video
- [ ] Screen sharing (if supported by SDK)

**Mobile**:

- [ ] Join call
- [ ] Toggle between chat and video
- [ ] Audio/video controls accessible
- [ ] Connection stable
- [ ] Hang up works

**Edge Cases**:

- [ ] Join call, close Cinny, rejoin (call ended)
- [ ] Low bandwidth conditions
- [ ] Rapid join/leave cycles
- [ ] Multiple tabs with same user

### 5.4 Performance Testing

**Metrics to Monitor**:

- [ ] Memory usage compared to old implementation
- [ ] CPU usage during call
- [ ] Time to join call (should be faster)
- [ ] Frame rate of video tracks
- [ ] Audio quality

**Tools**:

- Chrome DevTools Performance tab
- Memory profiler
- Network throttling

### 5.5 Documentation Updates

**Files to Update**:

1. **research.md**:

   - [ ] Add section on new headless SDK implementation
   - [ ] Document architectural changes
   - [ ] Update flow diagrams

2. **README.md** (if it mentions calls):

   - [ ] Update call feature description
   - [ ] Remove widget references

3. **CONTRIBUTING.md**:

   - [ ] Update development setup (no more Element Call iframe)
   - [ ] Document RTC testing procedures

4. **Create new doc: CALLS.md**:
   - [ ] Architecture overview
   - [ ] How to debug calls
   - [ ] Common issues and solutions
   - [ ] LiveKit concepts for developers

---

## Phase 6: Migration Strategy (1 day)

### 6.1 Feature Flag (Optional but Recommended)

Create a feature flag to allow testing both implementations side-by-side:

**File**: `src/app/hooks/useFeatureFlags.ts` (or similar)

```typescript
export const useCallImplementation = (): 'widget' | 'headless' => {
  const config = useClientConfig();
  return config.experimentalHeadlessCall ? 'headless' : 'widget';
};
```

**In CallProvider**:

```typescript
const implementation = useCallImplementation();

if (implementation === 'headless') {
  // Use MatrixRTCManager
} else {
  // Use old widget approach
}
```

**Benefits**:

- Safe rollout
- Easy rollback if issues found
- A/B testing
- Gradual user migration

**Tasks**:

- [ ] Add feature flag configuration
- [ ] Update CallProvider to check flag
- [ ] Keep both implementations during transition
- [ ] Remove old code after successful migration

### 6.2 Rollout Plan

**Week 1**: Internal testing

- [ ] Enable for developers only
- [ ] Fix critical bugs
- [ ] Performance optimization

**Week 2**: Beta users

- [ ] Enable for opt-in beta testers
- [ ] Gather feedback
- [ ] Fix reported issues

**Week 3**: Gradual rollout

- [ ] 10% of users
- [ ] Monitor error rates
- [ ] 50% of users
- [ ] Monitor performance metrics

**Week 4**: Full rollout

- [ ] 100% of users
- [ ] Remove feature flag
- [ ] Delete old widget code

### 6.3 Rollback Plan

If critical issues are found:

1. **Immediate**: Set feature flag to 'widget' (revert to old implementation)
2. **Short-term**: Fix issues in headless implementation
3. **Re-enable**: Gradually re-roll out with fixes
4. **If unfixable**: Keep widget implementation, report SDK issues to Element

---

## Technical Challenges and Solutions

### Challenge 1: SDK is Experimental

**Risk**: API may change, lack of documentation

**Mitigation**:

- Wrap SDK in MatrixRTCManager abstraction layer
- Changes to SDK only require updating one file
- Maintain detailed internal documentation
- Pin SDK version, test upgrades carefully
- Contribute improvements back to Element

### Challenge 2: LiveKit Learning Curve

**Risk**: Team unfamiliar with LiveKit API

**Mitigation**:

- Study LiveKit documentation: https://docs.livekit.io/
- Review Element Call source code for patterns
- Start with basic features (audio/video only)
- Add advanced features incrementally
- Pair program on complex LiveKit integrations

### Challenge 3: Widget API to Direct SDK

**Risk**: Different paradigms (postMessage vs direct calls)

**Mitigation**:

- MatrixRTCManager provides similar interface to old CallProvider
- RxJS observables similar to widget events
- Incremental migration (keep old code during transition)
- Comprehensive testing of state transitions

### Challenge 4: Video Rendering

**Risk**: Complex video track attachment/detachment

**Mitigation**:

- Use LiveKit's built-in track attachment API
- Proper useEffect cleanup to prevent memory leaks
- Test with multiple participants
- Handle edge cases (track not ready, detached participant)

### Challenge 5: No Widget Context

**Risk**: SDK expects to run as widget, Cinny is host app

**Solution**:
Looking at the SDK code, it **requires** widget context because it calls:

```typescript
initializeWidget(application, true);
const widget = _widget;
const client = await widget.client;
```

**This means we have two options**:

**Option A: Keep Widget Architecture (Less Work)**
Instead of fully removing widgets, we create a minimal widget:

- Simple HTML page that imports SDK
- Communicates back to Cinny via postMessage
- Much simpler than current Element Call widget
- Can still remove complex iframe positioning

**Option B: Fork/Modify SDK (More Work)**

- Copy SDK source into Cinny
- Replace widget initialization with direct MatrixClient
- Maintain our own version of SDK
- More control but more maintenance

**Recommendation**: Start with Option A (minimal widget wrapper), then consider Option B if we need deep customization.

### Challenge 6: Encryption Key Management

**Risk**: Per-participant E2EE is complex

**Mitigation**:

- SDK handles this automatically
- Trust the CallViewModel implementation
- Monitor for encryption errors in logs
- Document key exchange flow for debugging

---

## Alternative Approach: Minimal Widget Wrapper

Given that the SDK requires widget context, here's a revised **simpler approach**:

### Revised Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Cinny Application                     │
│                                                           │
│  CallProvider                                             │
│         ↓                                                 │
│  ┌────────────────────────────────────────┐              │
│  │  Minimal Widget Iframe                 │              │
│  │  (Headless - no UI)                    │              │
│  │                                         │              │
│  │  createMatrixRTCSdk()                  │              │
│  │         ↓                               │              │
│  │  SDK observables exposed via            │              │
│  │  postMessage to parent                 │              │
│  └────────────────────────────────────────┘              │
│         ↑                                                 │
│         │ postMessage API (minimal)                      │
│         ↓                                                 │
│  RTCBridge (new)                                          │
│    - Wraps postMessage communication                      │
│    - Exposes observables to Cinny                        │
│         ↓                                                 │
│  CallView (Cinny UI) + VideoTrack components              │
└───────────────────────────────────────────────────────────┘
```

### Benefits

- ✅ Keep widget architecture (SDK requirement)
- ✅ Still remove Element Call UI
- ✅ Simpler migration path
- ✅ Native video rendering in Cinny
- ✅ Direct control over UI
- ✅ Lighter iframe (no UI framework)

### Implementation Changes

**Create minimal widget HTML**:

**File**: `public/rtc/headless-widget.html`

```html
<!DOCTYPE html>
<html>
  <head>
    <title>RTC Widget</title>
    <script type="module">
      import { createMatrixRTCSdk } from '/rtc/matrixrtc-sdk.js';

      async function init() {
        try {
          const sdk = await createMatrixRTCSdk('m.call', '', false);

          // Join immediately
          sdk.join();

          // Forward all observables to parent via postMessage
          sdk.connected$.subscribe((connected) => {
            parent.postMessage({ type: 'connected', value: connected }, '*');
          });

          sdk.members$.subscribe((members) => {
            // Serialize members (can't send complex objects)
            const serialized = members.map((m) => ({
              userId: m.membership.sender,
              deviceId: m.membership.deviceId,
              connectionState: m.connection?.state,
              participantIdentity: m.participant?.identity,
              isMicEnabled: m.participant?.isMicrophoneEnabled,
              isCameraEnabled: m.participant?.isCameraEnabled,
            }));
            parent.postMessage({ type: 'members', value: serialized }, '*');
          });

          sdk.localMember$.subscribe((member) => {
            if (member?.participant) {
              const serialized = {
                userId: member.membership.sender,
                participantIdentity: member.participant.identity,
                isMicEnabled: member.participant.isMicrophoneEnabled,
                isCameraEnabled: member.participant.isCameraEnabled,
              };
              parent.postMessage({ type: 'localMember', value: serialized }, '*');
            }
          });

          // Listen for commands from parent
          window.addEventListener('message', async (event) => {
            const { type, data } = event.data;

            switch (type) {
              case 'leave':
                sdk.leave();
                break;
              case 'toggleAudio':
                const local = sdk.localMember$.value;
                if (local?.participant) {
                  await local.participant.setMicrophoneEnabled(data.enabled);
                }
                break;
              case 'toggleVideo':
                const localV = sdk.localMember$.value;
                if (localV?.participant) {
                  await localV.participant.setCameraEnabled(data.enabled);
                }
                break;
            }
          });

          parent.postMessage({ type: 'ready' }, '*');
        } catch (error) {
          parent.postMessage({ type: 'error', error: error.message }, '*');
        }
      }

      init();
    </script>
  </head>
  <body>
    <!-- No UI - completely headless -->
  </body>
</html>
```

**Create bridge in Cinny**:

**File**: `src/app/features/rtc/RTCBridge.ts`

```typescript
export class RTCBridge {
  private iframe: HTMLIFrameElement;
  private subscribers: Map<string, Set<Function>> = new Map();

  constructor(roomId: string) {
    this.iframe = document.createElement('iframe');
    this.iframe.src = `/rtc/headless-widget.html?roomId=${roomId}&...`;
    this.iframe.style.display = 'none'; // Hidden
    document.body.appendChild(this.iframe);

    window.addEventListener('message', this.handleMessage);
  }

  private handleMessage = (event: MessageEvent) => {
    const { type, value } = event.data;
    const subscribers = this.subscribers.get(type);
    if (subscribers) {
      subscribers.forEach((callback) => callback(value));
    }
  };

  subscribe(eventType: string, callback: Function) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(callback);
  }

  leave() {
    this.iframe.contentWindow?.postMessage({ type: 'leave' }, '*');
  }

  toggleAudio(enabled: boolean) {
    this.iframe.contentWindow?.postMessage(
      {
        type: 'toggleAudio',
        data: { enabled },
      },
      '*'
    );
  }

  destroy() {
    window.removeEventListener('message', this.handleMessage);
    this.iframe.remove();
  }
}
```

This approach is **much simpler** and still achieves the main goals:

- ✅ Remove Element Call UI
- ✅ Native Cinny UI with video tracks
- ✅ Direct LiveKit access (via SDK)
- ⚠️ Keep minimal iframe (but hidden, no positioning complexity)

---

## Recommendation

### Recommended Approach: **Minimal Widget Wrapper**

Implement the alternative approach with a minimal headless widget:

1. **Phase 1-2**: Same (setup dependencies, create bridge)
2. **Phase 3**: Create minimal widget HTML + RTCBridge
3. **Phase 4**: Update CallProvider to use RTCBridge
4. **Phase 5**: Implement VideoTrack components (same as original plan)
5. **Phase 6**: Testing and rollout (same as original plan)

**Estimated effort**: 1.5-2 weeks (reduced from 2-3 weeks)

**Risk level**: Low-Medium (less risky than full non-widget approach)

---

## Success Criteria

### Functional Requirements

- [ ] Users can join/leave calls
- [ ] Audio/video toggles work correctly
- [ ] Multiple participants visible
- [ ] Video tracks render correctly
- [ ] Call persists during navigation
- [ ] Connection state accurately shown
- [ ] Works on desktop and mobile

### Performance Requirements

- [ ] Call join time < 3 seconds
- [ ] Memory usage < old implementation
- [ ] Video frame rate ≥ 24 FPS
- [ ] No audio dropouts
- [ ] CPU usage acceptable

### Quality Requirements

- [ ] Zero P0 bugs in production
- [ ] < 5 P1 bugs in first week
- [ ] Unit test coverage > 80%
- [ ] No memory leaks
- [ ] Graceful error handling

---

## Timeline Summary

| Phase                   | Duration       | Dependencies    |
| ----------------------- | -------------- | --------------- |
| 1. Setup & Dependencies | 2-3 days       | None            |
| 2. Core SDK Integration | 4-5 days       | Phase 1         |
| 3. UI Components        | 3-4 days       | Phase 2         |
| 4. Remove Old Code      | 1-2 days       | Phase 3         |
| 5. Testing & Polish     | 3-4 days       | Phase 4         |
| 6. Migration Strategy   | 1 day          | Phase 5         |
| **Total**               | **14-19 days** | **(2-3 weeks)** |

With minimal widget approach: **10-14 days (1.5-2 weeks)**

---

## Resources and References

### Documentation

- Element Call Headless SDK: `/element-call-headless-sdk/README.md`
- LiveKit Docs: https://docs.livekit.io/
- Matrix RTC: https://github.com/matrix-org/matrix-js-sdk/tree/develop/src/matrixrtc
- RxJS: https://rxjs.dev/

### Code References

- Current implementation: `research.md`
- SDK source: `/element-call-headless-sdk/main.ts`
- CallViewModel: Element Call repository (for advanced features)

### Support

- Matrix RTC room: `#matrix-rtc:matrix.org`
- Element Call room: `#element-call:matrix.org`
- LiveKit Slack: https://livekit.io/slack

---

## Conclusion

This implementation plan provides a clear path to migrate from the iframe/widget-based Element Call integration to a cleaner, more performant headless SDK approach. The recommended minimal widget wrapper approach balances the benefits of native integration with the practical requirement that the SDK needs widget context.

The migration will result in:

- Better performance (less overhead)
- Simpler codebase (less complex positioning logic)
- Better UX (faster, more responsive)
- Easier maintenance (direct API access)

With proper planning, testing, and a phased rollout, this migration can be completed successfully with minimal risk to users.

---

**Document Version**: 1.0  
**Created**: March 7, 2026  
**Last Updated**: March 7, 2026  
**Status**: Ready for Review
