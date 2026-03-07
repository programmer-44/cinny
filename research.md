# Element Call Integration in Cinny - Technical Analysis

## Executive Summary

Cinny integrates Element Call as an embedded widget using the Matrix Widget API to provide voice and video calling capabilities. The implementation leverages a persistent iframe approach where Element Call runs as a sandboxed web application, communicating bidirectionally with Cinny through the Widget API protocol. This architecture enables real-time voice/video calls while maintaining separation of concerns between the host application (Cinny) and the call widget (Element Call).

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Cinny Host                           │
│                                                               │
│  ┌─────────────────┐      ┌──────────────────────┐          │
│  │  CallProvider   │◄────►│ PersistentCallContainer│         │
│  │  (State Mgmt)   │      │  (Widget Lifecycle)   │          │
│  └────────┬────────┘      └──────────┬────────────┘          │
│           │                          │                        │
│           ▼                          ▼                        │
│  ┌──────────────────────────────────────────────┐            │
│  │           SmallWidget                         │            │
│  │  ┌────────────────┐  ┌────────────────────┐  │            │
│  │  │ Widget         │◄─┤ SmallWidgetDriver  │  │            │
│  │  │ Messaging      │  │ (Capabilities)     │  │            │
│  │  └───────┬────────┘  └────────────────────┘  │            │
│  └──────────┼───────────────────────────────────┘            │
│             │                                                 │
│             │ Widget API Protocol                            │
│             ▼                                                 │
│  ┌────────────────────────────────────────────────┐          │
│  │          Iframe (Element Call)                  │          │
│  │  ┌──────────────────────────────────────────┐  │          │
│  │  │     Element Call Web Application        │  │          │
│  │  │  - WebRTC Peer Connections              │  │          │
│  │  │  - Audio/Video Stream Management        │  │          │
│  │  │  - UI for Call Controls                 │  │          │
│  │  └──────────────────────────────────────────┘  │          │
│  └────────────────────────────────────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  Matrix Server   │
              │  - Call Signaling│
              │  - TURN Servers  │
              └──────────────────┘
```

## Core Components

### 1. SmallWidget (`/src/app/features/call/SmallWidget.ts`)

**Purpose**: Main widget orchestrator that manages the Element Call widget instance lifecycle and event synchronization.

**Key Responsibilities**:

- Widget URL generation with proper parameters
- Widget lifecycle management (initialization, messaging, cleanup)
- Event feed synchronization from Matrix client to widget
- Read-up-to marker tracking to prevent event duplication
- Bidirectional communication setup

**Key Methods**:

- **`getWidgetUrl()`** (lines 39-73): Constructs the Element Call URL with parameters:

  ```javascript
  {
    embed: 'true',
    widgetId: <unique-id>,
    skipLobby: 'true',
    returnToLobby: 'true',
    perParticipantE2EE: 'true',
    callIntent: 'video',
    header: 'none',
    confineToRoom: 'true',
    theme: 'dark',
    userId, deviceId, roomId, baseUrl, parentUrl
  }
  ```

- **`startMessaging(iframe)`** (lines 119-200):

  - Instantiates `SmallWidgetDriver` with capabilities
  - Creates `ClientWidgetApi` instance bound to iframe
  - Sets up event listeners for widget lifecycle
  - Initializes read-up-to marker map for all rooms
  - Handles `org.matrix.msc2876.read_events` action
  - Registers Matrix client event handlers

- **`feedEvent(ev)`** (lines 298-332):

  - Implements smart event filtering using read-up-to markers
  - Prevents duplicate events during decryption
  - Handles events with unknown parent relations
  - Manages invite room special cases

- **`stopMessaging()`** (lines 337-348):
  - Cleans up widget messaging API
  - Removes all Matrix client event listeners
  - Prevents memory leaks

**Event Synchronization**:
The widget listens to Matrix client events and forwards them to Element Call:

- `ClientEvent.Event` → decrypt and feed timeline events
- `MatrixEventEvent.Decrypted` → feed decrypted events
- `RoomStateEvent.Events` → feed state updates
- `ClientEvent.ToDeviceEvent` → feed to-device events (for WebRTC signaling)

### 2. SmallWidgetDriver (`/src/app/features/call/SmallWidgetDriver.ts`)

**Purpose**: Custom `WidgetDriver` implementation that defines widget capabilities and handles widget-to-host communication.

**Key Responsibilities**:

- Define and grant widget capabilities (permissions)
- Implement widget API methods (sending events, reading state, etc.)
- Handle MSC3401 (group calls) and MSC4157 (delayed events) support
- Provide Matrix client functionality to the widget

**Granted Capabilities** (lines 61-162):

**Core Capabilities**:

- `MatrixCapabilities.Screenshots` - Allow screenshots
- `MatrixCapabilities.AlwaysOnScreen` - Persistent widget mode
- `MatrixCapabilities.MSC3846TurnServers` - TURN server access for WebRTC
- `MatrixCapabilities.MSC4157SendDelayedEvent` - Send delayed events
- `MatrixCapabilities.MSC4157UpdateDelayedEvent` - Update delayed events

**Timeline & State Access**:

- `org.matrix.msc2762.timeline:${roomId}` - Read room timeline
- `org.matrix.msc2762.state:${roomId}` - Read room state

**State Event Permissions**:

- Receive: `m.room.member`, `org.matrix.msc3401.call`, `m.room.encryption`, `m.room.create`
- Send: `org.matrix.msc3401.call.member` (with user ID and device ID as state key)

**Room Event Permissions** (send/receive):

- `io.element.call.encryption_keys` - E2EE key exchange
- `org.matrix.rageshake_request` - Debug logs
- `m.reaction` - Reactions in calls
- `m.room.redaction` - Event redactions
- `io.element.call.reaction` - Call-specific reactions

**To-Device Event Permissions** (send/receive):
All WebRTC signaling events:

- `m.call.invite`, `m.call.candidates`, `m.call.answer`, `m.call.hangup`
- `m.call.reject`, `m.call.select_answer`, `m.call.negotiate`
- `m.call.sdp_stream_metadata_changed[*]`
- `m.call.replaces`, `m.call.encryption_keys[*]`

**Key Methods**:

- **`sendEvent()`** (lines 169-216): Sends room or state events to Matrix
- **`sendDelayedEvent()`** (lines 222-295): MSC4157 implementation for delayed events
- **`updateDelayedEvent()`** (lines 300-309): Update or cancel delayed events
- **`sendToDevice()`** (lines 314-363): Send to-device events with optional encryption
- **`readRoomTimeline()`** (lines 381-409): Read historical timeline events
- **`readRoomState()`** (lines 427-441): Read current room state
- **`readEventRelations()`** (lines 449-480): Read event relations (reactions, threads)
- **`searchUserDirectory()`** (lines 482-498): Search for Matrix users
- **`askOpenID()`** (lines 411-416): Provide OpenID credentials for widget
- **`getMediaConfig()`** (lines 500-504): Get homeserver media config
- **`uploadFile()`** (lines 506-512): Upload media to homeserver

### 3. CallProvider (`/src/app/pages/client/call/CallProvider.tsx`)

**Purpose**: React Context provider for global call state management across the application.

**State Managed**:

```typescript
{
  activeCallRoomId: string | null,           // Currently active call room
  viewedCallRoomId: string | null,           // Currently viewed call room
  activeClientWidgetApi: ClientWidgetApi | null, // Widget API instance
  activeClientWidget: SmallWidget | null,     // Widget instance
  isAudioEnabled: boolean,                    // Mic state
  isVideoEnabled: boolean,                    // Camera state
  isChatOpen: boolean,                        // Chat panel state
  isActiveCallReady: boolean,                 // Call connection status
}
```

**Key Actions**:

- **`hangUp()`** (lines 132-137):

  - Sends `im.vector.hangup` action to widget
  - Clears active call state
  - Resets connection status

- **`toggleAudio()`** (lines 158-173):

  - Sends `io.element.device_mute` action with audio state
  - Handles optimistic updates with rollback on error

- **`toggleVideo()`** (lines 175-190):

  - Sends `io.element.device_mute` action with video state
  - Similar optimistic update pattern

- **`toggleChat()`** (lines 290-293):
  - Toggles chat panel visibility (mobile)

**Widget Event Handlers** (lines 192-288):

- **`handleHangup`** (lines 201-206): Responds to widget hangup requests
- **`handleMediaStateUpdate`** (lines 208-222): Syncs audio/video state from widget
- **`handleJoin`** (lines 235-258):
  - Marks call as ready when user joins
  - Sets up observer to detect Element Call's leave button
  - Hooks leave button to trigger Cinny's hangUp()

### 4. PersistentCallContainer (`/src/app/pages/client/call/PersistentCallContainer.tsx`)

**Purpose**: Manages the persistent iframe element that hosts Element Call across navigation.

**Key Features**:

- Single persistent iframe that survives route changes
- Dynamic iframe source URL generation
- Widget instance creation and initialization
- Integration with CallProvider for state management

**Iframe Configuration** (lines 165-180):

```html
<iframe
  sandbox="allow-forms allow-scripts allow-same-origin 
           allow-popups allow-modals allow-downloads"
  allow="microphone; camera; display-capture; 
         autoplay; clipboard-write;"
  style="position: absolute; width: 100%; height: 100%"
/>
```

**Widget Setup Process** (lines 44-126):

1. Generate unique widget ID: `element-call-${roomId}-${timestamp}`
2. Construct widget URL with parameters (theme, skipLobby, etc.)
3. Set iframe `src` to Element Call URL
4. Create virtual widget definition (`IApp`)
5. Instantiate `SmallWidget` with widget definition
6. Call `startMessaging(iframe)` to initialize communication
7. Register widget API with `CallProvider`

### 5. CallView (`/src/app/features/call/CallView.tsx`)

**Purpose**: Main UI component for the call room interface.

**Features**:

- Displays call participants with avatars
- Shows call status (connected/connecting)
- Join button with permission checks
- Dynamic iframe positioning overlay

**Iframe Positioning Magic** (lines 97-171):
The CallView uses a clever technique to overlay the persistent iframe:

1. **Host Element**: A positioned `<div>` acts as a sizing reference
2. **Fixed Positioning**: JavaScript reads the host's `getBoundingClientRect()`
3. **Style Override**: Applies fixed positioning with exact coordinates to iframe
4. **Resize Observer**: Continuously tracks size changes and scroll events
5. **Style Restoration**: Restores original styles when unmounting

This allows the iframe to appear "embedded" in the CallView while actually being a persistent element in `PersistentCallContainer`.

**Key Methods**:

- **`applyFixedPositioningToIframe()`** (lines 97-131): Overlays iframe on host element
- **`handleJoinVCClick()`** (lines 173-185): Initiates call join sequence

### 6. useCallMemberships Hook (`/src/app/hooks/useCallMemberships.ts`)

**Purpose**: React hook to track active participants in a call.

**Implementation**:

- Uses Matrix RTC API: `mx.matrixRTC.getRoomSession(room)`
- Listens to `MatrixRTCSessionEvent.MembershipsChanged`
- Returns array of `CallMembership` objects
- Each membership represents one device in the call

**Usage**: Powers participant display in CallView and room navigation indicators.

### 7. RoomCallNavStatus (`/src/app/features/room-nav/RoomCallNavStatus.tsx`)

**Purpose**: Persistent UI component in navigation panel showing active call controls.

**Features**:

- Connection status indicator (Connected/Connecting)
- Quick access to call room
- Audio/video toggle buttons
- Hang up button
- Always visible when in an active call

## Matrix Protocol Integration

### Room Types

Cinny uses **MSC3417** call room type:

```typescript
RoomType.Call = 'org.matrix.msc3417.call';
```

**Call Room Creation** (`/src/app/components/create-room/utils.ts:85-95`):

```typescript
initialState: [
  {
    type: 'org.matrix.msc3401.call',
    state_key: '',
    content: {}
  }
]

power_level_content_override: {
  events: {
    'org.matrix.msc3401.call.member': 0  // Allow all users to join
  }
}
```

### Call Membership (MSC3401)

**State Event**: `org.matrix.msc3401.call.member`

**State Key Formats**:

1. Legacy: `@userId:server.com`
2. MSC4143 (with underscore): `_@userId:server.com_DEVICEID`
3. MSC4143 (without underscore): `@userId:server.com_DEVICEID`

**Content**: Contains MatrixRTC session membership data including:

- Device information
- Signaling details
- Encryption keys
- Session metadata

### WebRTC Signaling

All WebRTC signaling happens via **to-device events**:

- `m.call.invite` - Initiate peer connection
- `m.call.answer` - Accept peer connection
- `m.call.candidates` - ICE candidate exchange
- `m.call.negotiate` - SDP renegotiation
- `m.call.hangup` - Terminate connection

The `SmallWidgetDriver` forwards these events between the Matrix client and Element Call widget.

### TURN Server Access (MSC3846)

Element Call requests TURN servers through the Widget API:

- Capability: `MatrixCapabilities.MSC3846TurnServers`
- Provides STUN/TURN credentials for NAT traversal
- Essential for calls across restrictive networks

## Configuration

### Element Call URL (`config.json`)

```json
{
  "elementCallUrl": null
}
```

**Options**:

- `null`: Use embedded Element Call from `node_modules` (default)
- URL string: Use external Element Call instance (e.g., `https://call.element.io`)

### Embedded Element Call Setup

**Vite Configuration** (`vite.config.js:17-19`):

```javascript
{
  src: 'node_modules/@element-hq/element-call-embedded/dist/*',
  dest: 'public/element-call',
}
```

**Package Dependency**:

```json
"@element-hq/element-call-embedded": "0.16.3"
```

**URL Generation**:

- External: `${elementCallUrl}/room?params`
- Embedded: `/public/element-call/index.html#?params`

## Data Flow

### Call Initialization Flow

```
1. User clicks "Join Voice" in CallView
   ↓
2. CallView.handleJoinVCClick()
   → setActiveCallRoomId(roomId)
   ↓
3. PersistentCallContainer.setupWidget()
   → Generate widget URL
   → Set iframe.src
   → Create SmallWidget instance
   ↓
4. SmallWidget.startMessaging(iframe)
   → Create SmallWidgetDriver
   → Create ClientWidgetApi
   → Start Matrix event forwarding
   ↓
5. Element Call loads in iframe
   → Widget API handshake
   → Request capabilities
   ↓
6. SmallWidgetDriver grants capabilities
   → Element Call initializes
   ↓
7. Element Call sends 'io.element.join' action
   → CallProvider.handleJoin()
   → setIsActiveCallReady(true)
   ↓
8. CallView updates UI
   → Show iframe overlay
   → Hide participant list
   → User is in call
```

### Audio/Video Toggle Flow

```
1. User clicks mic/camera button in RoomCallNavStatus
   ↓
2. CallProvider.toggleAudio/toggleVideo()
   → Update local state optimistically
   ↓
3. CallProvider.sendWidgetAction()
   → Send 'io.element.device_mute' to widget
   → Data: { audio_enabled, video_enabled }
   ↓
4. Element Call receives action
   → Mutes/unmutes local media streams
   → Sends state update back
   ↓
5. CallProvider.handleMediaStateUpdate()
   → Sync state with widget
   → Update UI
```

### Event Feed Flow (Matrix → Widget)

```
1. Matrix client receives event
   → ClientEvent.Event
   ↓
2. SmallWidget.onEvent()
   → Decrypt if needed
   ↓
3. SmallWidget.feedEvent()
   → Check read-up-to marker
   → Filter duplicates
   ↓
4. SmallWidget.advanceReadUpToMarker()
   → Update marker if event is new
   ↓
5. ClientWidgetApi.feedEvent()
   → Send to iframe via postMessage
   ↓
6. Element Call receives event
   → Process call-related events
   → Update UI if needed
```

### Hangup Flow

```
1. User clicks "Hang Up" button OR Element Call's leave button
   ↓
2. CallProvider.hangUp()
   → Send 'im.vector.hangup' to widget
   → Clear activeCallRoomId
   → Clear activeClientWidgetApi
   → setIsActiveCallReady(false)
   ↓
3. Element Call processes hangup
   → Close WebRTC connections
   → Send 'org.matrix.msc3401.call.member' state event
   → Leave call session
   ↓
4. SmallWidget.feedEvent() receives state event
   → Update call membership
   ↓
5. useCallMemberships hook updates
   → Remove user from participants
   ↓
6. CallView updates UI
   → Show participant list
   → Hide iframe
```

## Security Considerations

### Iframe Sandboxing

```html
sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals allow-downloads"
```

**Implications**:

- JavaScript execution allowed (required for Element Call)
- Same-origin access (required for postMessage)
- Form submission allowed (for authentication)
- Popups/modals allowed (for permissions)
- **No** top navigation (security)
- **No** presentation mode

### Widget API Permissions

The Widget API provides a **capability-based security model**:

- Widget must request specific capabilities
- Host (Cinny) grants/denies each capability
- Capabilities are enforced by `SmallWidgetDriver`
- No access to Matrix client beyond granted permissions

**Granted Permissions Summary**:

- ✅ Read timeline/state of call room only
- ✅ Send call membership state events
- ✅ Send/receive WebRTC signaling events
- ✅ Access TURN servers
- ✅ Send call-specific room events
- ❌ No access to other rooms
- ❌ No account management
- ❌ No power level changes

### Cross-Origin Communication

All communication uses **postMessage API**:

- Enforced origin validation
- Structured message protocol (Widget API)
- No direct DOM access between contexts
- Prevents XSS attacks

## Performance Considerations

### Persistent Iframe Approach

**Benefits**:

- Call continues during navigation
- No reconnection overhead
- Preserves WebRTC peer connections
- Maintains call state

**Tradeoffs**:

- Increased memory usage (iframe always loaded)
- Complex positioning logic
- Z-index management required

### Event Feed Optimization

**Read-Up-To Marker** (SmallWidget.ts:99, 251-296):

- Prevents sending historical events to widget
- Reduces unnecessary decryption
- Limits CPU usage during initial sync
- Only feeds new events after marker

**Debounced Positioning** (CallView.tsx:133-136):

- 50ms debounce on iframe repositioning
- Prevents excessive style recalculations
- Smooth scrolling performance

### Event Filtering

- Skip decryption failures
- Skip ancient events from backfill
- Skip duplicate encrypted events
- Only forward call-relevant events

## UI/UX Flow

### Call Room Detection

A room is identified as a call room by:

```typescript
room.isCallRoom(); // Checks for RoomType.Call
```

This affects:

- Room navigation item display (shows participant count)
- Room view layout (shows CallView)
- Header buttons (shows chat toggle)
- Permissions (auto-grants call member state)

### Mobile vs Desktop

**Desktop**:

- Call and chat side-by-side
- Iframe always visible when in call
- Fixed positioning for call overlay

**Mobile**:

- Toggle between call view and chat
- `isChatOpen` state controls visibility
- Full-screen call or full-screen chat

### Connection States

1. **No Active Call**: Show participants, "Join Voice" button
2. **Connecting**: Show spinner, "Connecting..." in nav
3. **Connected**: Show iframe overlay, "Connected" in nav with controls
4. **Disconnecting**: Cleanup, return to state 1

## Integration Points

### Room Navigation (`RoomNavItem.tsx`)

Shows call status in room list:

- Participant count badge
- "Join" button for quick access
- Visual indicator for active calls

### Room Header (`RoomViewHeader.tsx`)

Adds call-specific buttons:

- Chat toggle (mobile, when in call room)
- Integrates with normal room actions

### Space Navigation

Call state persists across space navigation:

- Nav status bar visible in all views
- Quick access to call room from anywhere

## Known Limitations & Future Enhancements

### Current Limitations

1. **Single Active Call**: Only one call at a time

   - `activeCallRoomId` is singular
   - Joining new call hangs up current call

2. **No Picture-in-Picture**: Iframe cannot be minimized

   - Full overlay only
   - No floating widget mode

3. **Limited Mobile Support**: Basic mobile layout

   - Chat/call toggle only
   - No native mobile optimizations

4. **Iframe Positioning Complexity**:
   - Requires continuous recalculation
   - May have edge cases with complex layouts
   - Performance overhead

### Potential Improvements

1. **Multiple Simultaneous Calls**:

   - Array of active calls instead of single roomId
   - Multiple iframe instances
   - Call switching UI

2. **Picture-in-Picture Mode**:

   - Floating overlay
   - Minimized state
   - Drag-and-drop positioning

3. **Native WebRTC Implementation**:

   - Eliminate iframe overhead
   - Direct MatrixRTC integration
   - Better performance

4. **Call History & Notifications**:

   - Missed call tracking
   - Call duration logging
   - Push notifications for incoming calls

5. **Advanced Controls**:
   - Screen sharing toggle
   - Noise cancellation settings
   - Audio device selection

## Technical Debt & Code Quality

### Positive Aspects

✅ Clean separation of concerns (Widget, Driver, Provider)
✅ Comprehensive capability model
✅ Proper event cleanup (prevents memory leaks)
✅ TypeScript types throughout
✅ React hooks for state management

### Areas for Improvement

⚠️ **Complex Iframe Positioning**: The fixed positioning logic is fragile
⚠️ **Mutation Observer Hack**: Observing iframe DOM for leave button (CallProvider.tsx:245-254)
⚠️ **Disabled ESLint Rules**: SmallWidgetDriver has many disabled rules
⚠️ **Hardcoded Widget Actions**: Magic strings like `'io.element.device_mute'`
⚠️ **Limited Error Handling**: Few try-catch blocks for widget communication

### Suggested Refactors

1. **Extract iframe positioning to custom hook**:

   ```typescript
   useIframeOverlay(iframeRef, hostRef, enabled);
   ```

2. **Create widget action constants**:

   ```typescript
   const WIDGET_ACTIONS = {
     DEVICE_MUTE: 'io.element.device_mute',
     HANGUP: 'im.vector.hangup',
     // ...
   };
   ```

3. **Add error boundaries around call components**

4. **Create abstraction for widget messaging**:
   ```typescript
   class WidgetMessageBus {
     send(action, data): Promise<void>;
     on(action, handler): void;
   }
   ```

## Testing Considerations

### Unit Testing Targets

- `SmallWidget.feedEvent()` - Event filtering logic
- `SmallWidget.advanceReadUpToMarker()` - Marker advancement
- `CallProvider` state transitions
- `useCallMemberships` hook updates

### Integration Testing Scenarios

1. **Join Call Flow**: Button click → iframe load → widget handshake → ready state
2. **Audio Toggle Flow**: Button click → widget action → state sync
3. **Hangup Flow**: Button click → cleanup → state reset
4. **Navigation Persistence**: Route change → call continues → iframe remains

### E2E Testing Scenarios

1. **Two-User Call**: Join call, verify participants, audio/video, hangup
2. **Call Interruption**: Network disconnect, reconnection handling
3. **Permission Handling**: Denied camera/mic permissions
4. **Mobile Toggle**: Switch between chat and call views

## Conclusion

Cinny's Element Call integration is a sophisticated implementation that balances functionality with architectural cleanliness. The use of the Matrix Widget API provides a secure, capability-based model for embedding Element Call while maintaining separation between the host application and the call widget.

### Key Strengths

1. **Persistent iframe approach** enables seamless navigation without call interruption
2. **Comprehensive capability model** ensures security through principle of least privilege
3. **Smart event filtering** with read-up-to markers optimizes performance
4. **Clean state management** through React Context makes call state accessible throughout the app
5. **Standards-based** implementation using Matrix MSCs (3401, 3417, 4157, 3846)

### Key Challenges

1. **Iframe positioning complexity** requires continuous recalculation and may be fragile
2. **Single call limitation** prevents use cases like consultation calls or call transfers
3. **Mobile UX** is basic with simple toggle between call and chat
4. **DOM observation hack** to detect Element Call's leave button is brittle

### Recommendations

For developers working with this codebase:

1. **Understand the Widget API protocol** - This is fundamental to debugging issues
2. **Be careful with iframe positioning** - Test thoroughly across screen sizes and layouts
3. **Monitor performance** - Event feed and positioning logic can impact performance
4. **Follow capability model** - Always grant minimum necessary permissions
5. **Test call flows end-to-end** - Many components interact; integration bugs are common

This implementation serves as an excellent reference for embedding Element Call or similar Matrix widgets in other Matrix clients.

---

**Document Version**: 1.0  
**Analysis Date**: March 7, 2026  
**Cinny Version**: Based on current codebase  
**Element Call Version**: 0.16.3 (embedded)
