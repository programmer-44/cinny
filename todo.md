# Element Call Headless SDK Migration - Task List

## Project Overview

**Goal**: Replace iframe-based Element Call widget with headless SDK integration  
**Approach**: Minimal widget wrapper with native Cinny UI  
**Timeline**: 10-14 days (1.5-2 weeks)  
**Status**: Planning Complete - Ready to Start

---

## Phase 1: Setup and Dependencies (2-3 days)

### 1.1 Install Dependencies

- [ ] **Install livekit-client package**

  - Run: `npm install livekit-client`
  - Verify version compatibility (^2.x.x)
  - Check for peer dependency warnings
  - Document any version conflicts

- [ ] **Verify RxJS installation**

  - Check if rxjs is already installed: `npm list rxjs`
  - If not installed: `npm install rxjs@^7.x.x`
  - Verify version compatibility with other dependencies

- [ ] **Check matrix-js-sdk version**

  - Current version: 38.2.0
  - Verify MatrixRTC API availability
  - Check for any required updates
  - Review changelog for breaking changes

- [ ] **Update package-lock.json**
  - Run: `npm install` to regenerate lock file
  - Commit package.json and package-lock.json changes
  - Verify no existing dependencies break

### 1.2 Build Element Call Headless SDK

- [ ] **Navigate to SDK directory**

  - `cd element-call-headless-sdk`
  - Verify directory structure

- [ ] **Install SDK dependencies**

  - Run: `yarn install` or `npm install`
  - Document any installation issues
  - Note any peer dependency warnings

- [ ] **Build the SDK**

  - Run: `yarn build:sdk` (or equivalent)
  - Verify `dist/matrixrtc-sdk.js` is created
  - Check file size and contents
  - Test that the build is not minified (for debugging)

- [ ] **Copy SDK to Cinny public directory**

  - Create directory: `mkdir -p public/rtc`
  - Copy: `cp element-call-headless-sdk/dist/matrixrtc-sdk.js public/rtc/`
  - Verify file is accessible at `/rtc/matrixrtc-sdk.js`
  - Add to `.gitignore` or commit based on decision

- [ ] **Create SDK loading script** (if needed)
  - Consider adding a loader that handles SDK initialization
  - Document SDK version being used
  - Add comments about SDK source

### 1.3 Create Type Definitions

- [ ] **Create SDK types directory**

  - `mkdir -p src/app/features/rtc`
  - Set up proper TypeScript configuration

- [ ] **Create sdk-types.ts file**

  - Location: `src/app/features/rtc/sdk-types.ts`
  - Import necessary types from matrix-js-sdk
  - Import necessary types from livekit-client
  - Define `Connection` interface
  - Define `MemberInfo` interface
  - Define `LocalMemberInfo` interface
  - Define `DataMessage` interface
  - Define `MatrixRTCSdk` interface
  - Define `CreateMatrixRTCSdkFn` type
  - Add JSDoc comments to all interfaces
  - Export all types

- [ ] **Verify type definitions compile**

  - Run: `npm run typecheck` or `tsc --noEmit`
  - Fix any type errors
  - Ensure no circular dependencies

- [ ] **Document type definitions**
  - Add README.md in `src/app/features/rtc/`
  - Explain each interface
  - Document relationship to SDK
  - Add usage examples

### 1.4 Setup Development Environment

- [ ] **Configure TypeScript for new code**

  - Update tsconfig.json if needed
  - Ensure livekit-client types are recognized
  - Configure module resolution for SDK import

- [ ] **Update ESLint configuration** (if needed)

  - Allow dynamic imports for SDK
  - Configure rules for new RTC code

- [ ] **Setup debugging tools**

  - Configure source maps for SDK
  - Add browser console logging helpers
  - Document how to debug RTC issues

- [ ] **Create test utilities**
  - Mock MatrixRTCSdk for testing
  - Create test fixtures for MemberInfo, etc.
  - Setup test environment for RxJS observables

---

## Phase 2: Core SDK Integration (4-5 days)

### 2.1 Create RTCBridge Class

- [ ] **Create RTCBridge.ts file**

  - Location: `src/app/features/rtc/RTCBridge.ts`
  - Import necessary types

- [ ] **Implement constructor**

  - Accept roomId and MatrixClient parameters
  - Create hidden iframe element
  - Construct widget URL with parameters
  - Set iframe sandbox attributes
  - Append iframe to document body
  - Setup message listener

- [ ] **Implement message handling**

  - Create `handleMessage` method
  - Parse incoming messages from widget
  - Route messages to appropriate subscribers
  - Handle errors gracefully
  - Add message validation

- [ ] **Implement subscription system**

  - Create `subscribe(eventType, callback)` method
  - Maintain subscriber map
  - Allow multiple subscribers per event type
  - Return unsubscribe function
  - Handle subscriber errors

- [ ] **Implement command methods**

  - `leave()` - Send leave command to widget
  - `toggleAudio(enabled)` - Send audio toggle command
  - `toggleVideo(enabled)` - Send video toggle command
  - Add command acknowledgment handling
  - Add timeout handling for commands

- [ ] **Implement cleanup**

  - Create `destroy()` method
  - Remove message listener
  - Remove iframe from DOM
  - Clear all subscribers
  - Handle cleanup errors

- [ ] **Add TypeScript types**

  - Define message types (MessageFromWidget, MessageToWidget)
  - Add proper typing for all methods
  - Export RTCBridge class

- [ ] **Add error handling**

  - Handle iframe load errors
  - Handle message parsing errors
  - Handle widget initialization errors
  - Emit error events to subscribers

- [ ] **Add logging**
  - Log bridge lifecycle events
  - Log message traffic (debug mode)
  - Log errors with context
  - Add performance timing logs

### 2.2 Create Minimal Widget HTML

- [ ] **Create headless-widget.html file**

  - Location: `public/rtc/headless-widget.html`
  - Basic HTML structure
  - Add meta tags (charset, viewport)

- [ ] **Add SDK import**

  - Import from `/rtc/matrixrtc-sdk.js`
  - Handle import errors
  - Add fallback error message

- [ ] **Implement SDK initialization**

  - Parse URL parameters (roomId, etc.)
  - Call `createMatrixRTCSdk()`
  - Handle initialization errors
  - Send ready message to parent

- [ ] **Implement auto-join**

  - Call `sdk.join()` after initialization
  - Handle join errors
  - Send join status to parent

- [ ] **Setup connected$ subscription**

  - Subscribe to `sdk.connected$`
  - Send connection state updates to parent
  - Format message correctly

- [ ] **Setup members$ subscription**

  - Subscribe to `sdk.members$`
  - Serialize member objects (remove non-serializable parts)
  - Extract relevant fields (userId, deviceId, etc.)
  - Send member updates to parent

- [ ] **Setup localMember$ subscription**

  - Subscribe to `sdk.localMember$`
  - Extract participant information
  - Include mic/camera state
  - Send local member updates to parent

- [ ] **Setup data$ subscription** (optional)

  - Subscribe to `sdk.data$`
  - Forward data messages to parent
  - Handle data parsing errors

- [ ] **Implement command listener**

  - Listen for messages from parent window
  - Parse command type
  - Implement 'leave' command
  - Implement 'toggleAudio' command
  - Implement 'toggleVideo' command
  - Send command acknowledgments
  - Handle command errors

- [ ] **Add error handling**

  - Catch SDK initialization errors
  - Catch subscription errors
  - Send error messages to parent
  - Add error recovery logic

- [ ] **Add cleanup on unload**

  - Listen for beforeunload event
  - Call `sdk.leave()`
  - Call `sdk.stop()`

- [ ] **Test widget standalone**
  - Test in isolation using /addwidget command
  - Verify SDK initializes
  - Verify messages are sent
  - Check browser console for errors

### 2.3 Create MatrixRTCManager

- [ ] **Create MatrixRTCManager.ts file**

  - Location: `src/app/features/rtc/MatrixRTCManager.ts`
  - Import RTCBridge
  - Import types

- [ ] **Define configuration interface**

  - Create `MatrixRTCManagerConfig` interface
  - Document all configuration options
  - Provide sensible defaults

- [ ] **Implement constructor**

  - Accept MatrixClient, roomId, config
  - Initialize member variables
  - Don't create bridge yet (lazy initialization)

- [ ] **Implement initialize() method**

  - Create RTCBridge instance
  - Wait for 'ready' message from widget
  - Setup all subscriptions
  - Handle initialization timeout
  - Handle initialization errors

- [ ] **Implement join() method**

  - Verify bridge is initialized
  - Bridge already auto-joins, just track state
  - Emit join event (if needed)
  - Handle errors

- [ ] **Implement leave() method**

  - Verify bridge exists
  - Call bridge.leave()
  - Wait for leave confirmation
  - Handle errors

- [ ] **Implement stop() method**

  - Call bridge.destroy()
  - Clear all subscriptions
  - Reset state
  - Prevent further use

- [ ] **Implement subscribeToMembers()**

  - Subscribe to 'members' messages from bridge
  - Convert serialized data back to typed objects
  - Call user callback with members array
  - Return unsubscribe function
  - Handle subscription errors

- [ ] **Implement subscribeToConnected()**

  - Subscribe to 'connected' messages from bridge
  - Call user callback with boolean
  - Return unsubscribe function

- [ ] **Implement subscribeToLocalMember()**

  - Subscribe to 'localMember' messages from bridge
  - Convert serialized data back to typed object
  - Call user callback
  - Return unsubscribe function

- [ ] **Implement subscribeToData()** (optional)

  - Subscribe to 'data' messages from bridge
  - Parse data payload
  - Call user callback
  - Return unsubscribe function

- [ ] **Implement command methods**

  - `toggleAudio(enabled)` - Forward to bridge
  - `toggleVideo(enabled)` - Forward to bridge
  - Add error handling for each
  - Add state validation

- [ ] **Add state getters**

  - `get members()` - Return current members array
  - `get connected()` - Return current connection state
  - `get localMember()` - Return current local member
  - Cache values from subscriptions

- [ ] **Add state management**

  - Store current state internally
  - Update on subscription callbacks
  - Provide synchronous access via getters

- [ ] **Add error handling**

  - Wrap all bridge calls in try-catch
  - Emit error events
  - Provide error recovery suggestions
  - Log errors with context

- [ ] **Add logging**

  - Log lifecycle events
  - Log state changes
  - Log errors
  - Add debug mode flag

- [ ] **Write unit tests**
  - Test initialization
  - Test join/leave flow
  - Test subscriptions
  - Test error handling
  - Mock RTCBridge

### 2.4 Update CallProvider

- [ ] **Review current CallProvider implementation**

  - Understand existing state management
  - Identify all widget-related code
  - Plan migration strategy

- [ ] **Add MatrixRTCManager imports**

  - Import MatrixRTCManager class
  - Import MemberInfo type
  - Import other necessary types

- [ ] **Add new state variables**

  - `rtcManager: MatrixRTCManager | null`
  - `callMembers: MemberInfo[]`
  - Remove widget-related state variables

- [ ] **Remove old state variables**

  - Remove `activeClientWidgetApi`
  - Remove `activeClientWidget`
  - Remove `activeClientWidgetApiRoomId`
  - Remove `activeClientWidgetIframeRef`

- [ ] **Create joinCall() method**

  - Accept roomId parameter
  - Stop existing rtcManager if any
  - Create new MatrixRTCManager instance
  - Call initialize() and handle errors
  - Setup all subscriptions
  - Call join()
  - Update state
  - Handle errors and cleanup

- [ ] **Update hangUp() method**

  - Call rtcManager.leave()
  - Call rtcManager.stop()
  - Clear active call state
  - Reset audio/video state
  - Handle errors

- [ ] **Update toggleAudio() method**

  - Get current state
  - Calculate new state
  - Call rtcManager with new state
  - Update local state optimistically
  - Rollback on error

- [ ] **Update toggleVideo() method**

  - Get current state
  - Calculate new state
  - Call rtcManager with new state
  - Update local state optimistically
  - Rollback on error

- [ ] **Remove widget event handlers**

  - Delete handleHangup
  - Delete handleMediaStateUpdate
  - Delete handleOnScreenStateUpdate
  - Delete handleOnTileLayout
  - Delete handleJoin
  - Remove corresponding useEffect hooks

- [ ] **Remove registerActiveClientWidgetApi method**

  - No longer needed
  - Remove from context interface

- [ ] **Remove sendWidgetAction method**

  - No longer needed
  - Remove from context interface

- [ ] **Update CallContextState interface**

  - Add `joinCall: (roomId: string) => Promise<void>`
  - Add `rtcManager: MatrixRTCManager | null`
  - Add `callMembers: MemberInfo[]`
  - Remove `activeClientWidgetApi`
  - Remove `activeClientWidget`
  - Remove `registerActiveClientWidgetApi`
  - Remove `sendWidgetAction`

- [ ] **Update context value**

  - Add new methods and state to useMemo
  - Remove old methods and state
  - Verify dependencies array

- [ ] **Add cleanup on unmount**

  - useEffect with empty deps array
  - Return cleanup function
  - Call rtcManager.stop()

- [ ] **Add error boundaries** (consider)

  - Catch errors from rtcManager
  - Display error state to user
  - Provide retry option

- [ ] **Update TypeScript types**

  - Fix all type errors
  - Add proper typing for new state
  - Remove old type references

- [ ] **Test CallProvider**
  - Test joining a call
  - Test leaving a call
  - Test toggling audio/video
  - Test error scenarios
  - Mock MatrixRTCManager

---

## Phase 3: UI Component Updates (3-4 days)

### 3.1 Delete PersistentCallContainer

- [ ] **Backup PersistentCallContainer.tsx**

  - Copy to a backup location
  - Keep for reference during migration

- [ ] **Remove PersistentCallContainer.tsx**

  - Delete file: `src/app/pages/client/call/PersistentCallContainer.tsx`
  - Verify file is gone

- [ ] **Remove CallRefContext export**

  - Find all exports of CallRefContext
  - Remove from index files

- [ ] **Update Router.tsx imports**

  - Remove PersistentCallContainer import
  - Remove any references to CallRefContext

- [ ] **Update Router.tsx render**

  - Remove PersistentCallContainer wrapper
  - Verify CallProvider wrapper remains
  - Test routing still works

- [ ] **Search for remaining references**

  - `grep -r "PersistentCallContainer" src/`
  - `grep -r "CallRefContext" src/`
  - Remove or update all references

- [ ] **Commit changes**
  - Commit deletion separately
  - Clear commit message explaining removal

### 3.2 Create VideoTrack Component

- [ ] **Create VideoTrack.tsx file**

  - Location: `src/app/features/call/VideoTrack.tsx`
  - Import necessary dependencies

- [ ] **Define VideoTrackProps interface**

  - `member: MemberInfo`
  - `room?: Room` (if needed)
  - Add other props as needed

- [ ] **Implement component structure**

  - Create functional component
  - Use refs for video element
  - Setup proper TypeScript types

- [ ] **Get participant information**

  - Extract userId from member.membership.sender
  - Get participant from member.participant
  - Get connection state

- [ ] **Implement video track attachment**

  - Create videoRef for <video> element
  - useEffect to handle track attachment
  - Get video track from participant
  - Call track.attach(videoElement)
  - Return cleanup function
  - Handle case where track is null

- [ ] **Implement audio track attachment**

  - Create audioRef for <audio> element (or use same video element)
  - Get audio track from participant
  - Attach audio track
  - Handle cleanup

- [ ] **Handle video enabled/disabled**

  - Check participant.isCameraEnabled
  - Show video element if enabled
  - Show avatar placeholder if disabled
  - Smooth transition between states

- [ ] **Create avatar placeholder**

  - Use Cinny's Avatar component
  - Show user avatar when video disabled
  - Add user display name
  - Center content

- [ ] **Add connection state overlay**

  - Show "Connecting..." when connection state is 'connecting'
  - Show error state if disconnected
  - Use Spinner component
  - Overlay on top of video/avatar

- [ ] **Add participant info bar**

  - Show display name at bottom
  - Add mic muted indicator
  - Use Icons.MicMute when muted
  - Position absolutely within container

- [ ] **Add speaking indicator** (optional)

  - Detect audio level from track
  - Add visual indicator when speaking
  - Animate border or overlay

- [ ] **Handle remote vs local participant**

  - Different styling for local participant
  - Mirror local video (CSS transform)
  - Add "You" label for local participant

- [ ] **Add error handling**

  - Handle track attachment errors
  - Handle missing participant
  - Display error state to user

- [ ] **Implement cleanup**

  - Detach tracks on unmount
  - Remove event listeners
  - Clear any timers

- [ ] **Add accessibility**

  - Proper alt text
  - Screen reader labels
  - Keyboard navigation support

- [ ] **Test component in isolation**
  - Create Storybook story (if applicable)
  - Test with mock MemberInfo
  - Verify track attachment works

### 3.3 Create VideoTrack Styles

- [ ] **Update CallView.css.ts**

  - Or create VideoTrack.css.ts if preferred

- [ ] **Create VideoTrackContainer style**

  - Position relative
  - Full width/height
  - Background color
  - Border radius
  - Overflow hidden

- [ ] **Create VideoElement style**

  - Width/height 100%
  - Object-fit: cover
  - Display block

- [ ] **Create AvatarPlaceholder style**

  - Flex column layout
  - Center items
  - Width/height 100%
  - Gap between avatar and text
  - Background color

- [ ] **Create ConnectingOverlay style**

  - Position absolute
  - Full coverage (top 0, left 0, right 0, bottom 0)
  - Semi-transparent background
  - Flex center content
  - Z-index above video

- [ ] **Create VideoGrid style**

  - Grid layout
  - Auto-fit columns
  - Min column width (e.g., 300px)
  - Gap between items
  - Responsive breakpoints
  - Padding

- [ ] **Create ParticipantInfo style**

  - Position absolute at bottom
  - Left padding
  - Flex row with gap
  - Background with opacity
  - Border radius
  - Padding
  - Z-index above video

- [ ] **Add hover effects** (optional)

  - Show controls on hover
  - Highlight active speaker
  - Expand on hover

- [ ] **Test responsive design**
  - Test on mobile (1 column)
  - Test on tablet (2 columns)
  - Test on desktop (3-4 columns)
  - Test with 1, 2, 4, 6+ participants

### 3.4 Refactor CallView

- [ ] **Review current CallView implementation**

  - Understand component structure
  - Identify iframe-related code
  - Plan refactoring approach

- [ ] **Remove iframe-related imports**

  - Remove CallRefContext import
  - Remove useContext for CallRefContext
  - Remove any iframe refs

- [ ] **Remove iframe positioning code**

  - Delete callIframeRef
  - Delete iframeHostRef
  - Delete originalIframeStylesRef
  - Delete applyFixedPositioningToIframe function
  - Delete debouncedApplyFixedPositioning
  - Remove positioning useEffect

- [ ] **Import VideoTrack component**

  - Add import statement
  - Verify path is correct

- [ ] **Update useCallState hook usage**

  - Get callMembers from context
  - Get joinCall function
  - Remove widget-related state

- [ ] **Update component render logic**

  - Remove iframe host div
  - Add conditional rendering:
    - If active and ready: show video grid
    - If not active: show participant preview

- [ ] **Implement video grid view**

  - Create Box with VideoGrid class
  - Map over callMembers
  - Render VideoTrack for each member
  - Pass room prop if needed
  - Handle empty members array

- [ ] **Update participant preview view**

  - Keep existing CallViewUserGrid
  - Keep participant avatars
  - Update join button handler

- [ ] **Update handleJoinVCClick**

  - Remove iframe positioning logic
  - Call joinCall(room.roomId)
  - Handle async call
  - Add error handling
  - Show loading state

- [ ] **Add loading state**

  - Show spinner while joining
  - Disable button during join
  - Show error if join fails

- [ ] **Update mobile handling**

  - Remove isChatOpen checks for iframe
  - Keep chat toggle logic
  - Update layout for mobile

- [ ] **Remove unused variables**

  - Clean up any leftover refs
  - Remove unused imports
  - Remove unused state

- [ ] **Update TypeScript types**

  - Fix type errors
  - Add proper types for new code

- [ ] **Simplify component structure**

  - Remove unnecessary wrappers
  - Improve readability
  - Add comments where needed

- [ ] **Test CallView**
  - Test in call room
  - Test join button
  - Test video rendering
  - Test with multiple participants
  - Test on mobile

### 3.5 Update useCallMemberships Hook

- [ ] **Review current implementation**

  - Understand how it uses MatrixRTC API
  - Identify usage locations

- [ ] **Decide on approach**

  - Option A: Keep as-is for passive observation
  - Option B: Use CallProvider members for active call
  - Option C: Hybrid approach

- [ ] **Implement hybrid approach** (recommended)

  - Check if viewing active call room
  - If yes: return callMembers from context
  - If no: use MatrixRTC API for passive display

- [ ] **Update imports**

  - Import useCallState if needed
  - Keep MatrixRTC imports for passive mode

- [ ] **Implement active call path**

  - Get callMembers from useCallState()
  - Extract CallMembership from MemberInfo
  - Return membership array

- [ ] **Keep passive observation path**

  - Use existing MatrixRTC code
  - For showing "X people in call" indicator
  - For rooms we're not actively in

- [ ] **Handle edge cases**

  - Room not found
  - No memberships
  - Call ending during observation

- [ ] **Update return type if needed**

  - Ensure type compatibility
  - Update CallMembership type

- [ ] **Test hook**
  - Test in active call
  - Test in non-active call
  - Test with no call
  - Test room navigation

### 3.6 Verify RoomCallNavStatus

- [ ] **Review RoomCallNavStatus component**

  - Verify it uses CallProvider correctly
  - Check if any changes needed

- [ ] **Test connection status display**

  - Shows "Connected" when connected
  - Shows "Connecting" when connecting
  - Spinner displays correctly

- [ ] **Test audio toggle**

  - Click button
  - Verify toggleAudio called
  - Icon changes correctly
  - Tooltip shows correct text

- [ ] **Test video toggle**

  - Click button
  - Verify toggleVideo called
  - Icon changes correctly
  - Tooltip shows correct text

- [ ] **Test hangup button**

  - Click button
  - Verify hangUp called
  - Nav status disappears
  - No errors in console

- [ ] **Test navigation to call room**

  - Click "Go to Room" chip
  - Verify navigation works
  - Call continues during navigation

- [ ] **Test on mobile**

  - Buttons accessible
  - Layout doesn't break
  - Touch targets adequate

- [ ] **Verify no changes needed**
  - Component interface unchanged
  - All functionality works
  - Mark as complete

---

## Phase 4: Remove Old Infrastructure (1-2 days)

### 4.1 Delete Widget-Related Files

- [ ] **Backup all files before deletion**

  - Create backup branch
  - Or copy to backup directory

- [ ] **Delete SmallWidget.ts**

  - File: `src/app/features/call/SmallWidget.ts`
  - Verify file is deleted
  - Check git status

- [ ] **Delete SmallWidgetDriver.ts**

  - File: `src/app/features/call/SmallWidgetDriver.ts`
  - Verify file is deleted

- [ ] **Delete CinnyWidget.ts**

  - File: `src/app/features/call/CinnyWidget.ts`
  - Verify file is deleted

- [ ] **Search for import references**

  - `grep -r "SmallWidget" src/`
  - `grep -r "SmallWidgetDriver" src/`
  - `grep -r "CinnyWidget" src/`
  - Fix or remove all references

- [ ] **Check for type imports**

  - Search for type imports from deleted files
  - Update or remove

- [ ] **Run TypeScript compiler**

  - `npm run typecheck`
  - Fix any errors from missing files
  - Verify no broken imports

- [ ] **Commit deletions**
  - Separate commit for each file
  - Or single commit for all deletions
  - Clear commit message

### 4.2 Update Router

- [ ] **Open Router.tsx**

  - Location: `src/app/pages/Router.tsx`

- [ ] **Remove PersistentCallContainer import**

  - Delete import line
  - Verify no other imports removed accidentally

- [ ] **Update render method**

  - Remove `<PersistentCallContainer>` wrapper
  - Keep `<CallProvider>` wrapper
  - Ensure proper nesting of routes

- [ ] **Verify route structure**

  - All routes still accessible
  - No missing components
  - Proper error boundaries

- [ ] **Test routing**

  - Navigate to different routes
  - Verify no console errors
  - Check that calls still work

- [ ] **Run TypeScript compiler**

  - Fix any type errors
  - Verify Router.tsx compiles

- [ ] **Commit changes**
  - Clear commit message
  - Explain router simplification

### 4.3 Remove Element Call Embedded Package

- [ ] **Open package.json**

  - Locate dependencies section

- [ ] **Remove @element-hq/element-call-embedded**

  - Delete line: `"@element-hq/element-call-embedded": "0.16.3"`
  - Save file

- [ ] **Run npm install**

  - Execute: `npm install`
  - This updates package-lock.json
  - Verify no errors

- [ ] **Verify package removal**

  - Check node_modules/@element-hq directory
  - Should not contain element-call-embedded
  - Run: `npm list @element-hq/element-call-embedded`
  - Should show "not installed"

- [ ] **Commit package.json changes**
  - Commit both package.json and package-lock.json
  - Clear message about removing embedded package

### 4.4 Update Vite Configuration

- [ ] **Open vite.config.js**

  - Location: `vite.config.js` in project root

- [ ] **Find copyFiles configuration**

  - Locate the `copyFiles` constant
  - Find targets array

- [ ] **Remove Element Call copy target**

  - Remove object:
    ```javascript
    {
      src: 'node_modules/@element-hq/element-call-embedded/dist/*',
      dest: 'public/element-call',
    }
    ```

- [ ] **Verify remaining copy targets**

  - Ensure pdf.worker copy remains
  - Ensure other necessary copies remain
  - Don't accidentally remove other configs

- [ ] **Test build**

  - Run: `npm run build`
  - Verify build succeeds
  - Check dist/ folder
  - Verify public/element-call is not created

- [ ] **Test dev server**

  - Run: `npm start` or `npm run dev`
  - Verify server starts
  - No errors in console
  - App loads correctly

- [ ] **Delete public/element-call directory**

  - If it exists: `rm -rf public/element-call`
  - Verify directory is gone
  - Check .gitignore doesn't exclude it

- [ ] **Commit vite.config.js changes**
  - Clear message about removing Element Call copy

### 4.5 Clean Up Configuration

- [ ] **Open config.json**

  - Location: `config.json` in project root

- [ ] **Remove elementCallUrl**

  - Delete line: `"elementCallUrl": null,`
  - Verify JSON still valid (no trailing commas)

- [ ] **Test config loading**

  - Verify app starts
  - No config errors in console

- [ ] **Update useClientConfig hook**

  - File: `src/app/hooks/useClientConfig.ts`
  - Find ClientConfig interface
  - Remove `elementCallUrl` property

- [ ] **Search for elementCallUrl usage**

  - `grep -r "elementCallUrl" src/`
  - Remove or update all references
  - Check for any remaining widget URL generation

- [ ] **Update config types**

  - Fix TypeScript errors
  - Update interface definitions

- [ ] **Test application**

  - Verify app loads
  - No config-related errors
  - Calls still work

- [ ] **Commit config changes**
  - Commit config.json
  - Commit useClientConfig.ts
  - Clear message about config cleanup

### 4.6 Clean Up CSS Files

- [ ] **Check for unused CSS**

  - CallView.css.ts - review for iframe styles
  - RoomCallNavStatus.css.ts - verify still needed

- [ ] **Remove iframe-related styles**

  - Any styles for iframe positioning
  - Any styles for iframe hosts
  - Unused style exports

- [ ] **Verify VideoTrack styles exist**

  - All styles from 3.3 are in place
  - No duplicate styles

- [ ] **Run CSS build**

  - Ensure CSS compiles
  - No unused style warnings

- [ ] **Commit CSS cleanup**
  - Clear message

### 4.7 Final Cleanup

- [ ] **Search for TODO comments**

  - Look for any TODOs related to old implementation
  - Remove or update them

- [ ] **Search for widget references**

  - `grep -ri "widget" src/app/features/call/`
  - `grep -ri "iframe" src/app/features/call/`
  - Remove or document remaining references

- [ ] **Update code comments**

  - Remove outdated comments about widgets
  - Add comments about new headless SDK approach

- [ ] **Run full linter**

  - `npm run lint`
  - Fix any issues
  - Remove any disabled lint rules for deleted files

- [ ] **Run full type check**

  - `npm run typecheck`
  - Fix all TypeScript errors
  - Ensure strict mode passes

- [ ] **Check for unused imports**

  - Use IDE or linter to find unused imports
  - Remove them

- [ ] **Verify build output**

  - `npm run build`
  - Check bundle size (should be smaller)
  - Verify no Element Call files in dist/

- [ ] **Test production build**
  - Build and serve production build
  - Test all call functionality
  - Check for any production-only issues

---

## Phase 5: Testing and Polish (3-4 days)

### 5.1 Unit Tests

#### 5.1.1 MatrixRTCManager Tests

- [ ] **Create test file**

  - File: `src/app/features/rtc/MatrixRTCManager.test.ts`
  - Setup test environment

- [ ] **Create mock RTCBridge**

  - Mock all RTCBridge methods
  - Mock message events
  - Mock iframe creation

- [ ] **Test: Initialize SDK successfully**

  - Create MatrixRTCManager instance
  - Call initialize()
  - Verify RTCBridge created
  - Verify ready event received
  - Assert no errors

- [ ] **Test: Initialize with timeout**

  - Mock delayed ready event
  - Verify timeout handling
  - Assert error thrown

- [ ] **Test: Join call**

  - Initialize manager
  - Call join()
  - Verify no errors
  - Verify state updated

- [ ] **Test: Leave call**

  - Initialize and join
  - Call leave()
  - Verify bridge.leave() called
  - Verify state updated

- [ ] **Test: Stop SDK**

  - Initialize manager
  - Call stop()
  - Verify bridge.destroy() called
  - Verify subscriptions cleared
  - Verify cannot use after stop

- [ ] **Test: Subscribe to members**

  - Initialize manager
  - Subscribe to members
  - Emit mock members event
  - Verify callback called with correct data
  - Test unsubscribe

- [ ] **Test: Subscribe to connected**

  - Initialize manager
  - Subscribe to connected
  - Emit mock connected events
  - Verify callbacks called
  - Test unsubscribe

- [ ] **Test: Subscribe to local member**

  - Subscribe and emit events
  - Verify data transformation
  - Test unsubscribe

- [ ] **Test: Multiple subscriptions**

  - Subscribe multiple callbacks to same event
  - Verify all callbacks called
  - Test unsubscribe individual callbacks

- [ ] **Test: Toggle audio**

  - Mock local member
  - Call toggleAudio(true)
  - Verify bridge command sent
  - Test error handling

- [ ] **Test: Toggle video**

  - Mock local member
  - Call toggleVideo(false)
  - Verify bridge command sent
  - Test error handling

- [ ] **Test: Error handling**

  - Test bridge initialization error
  - Test command errors
  - Test subscription errors
  - Verify errors propagated correctly

- [ ] **Test: State getters**

  - Verify members getter returns correct data
  - Verify connected getter
  - Verify localMember getter
  - Test getters before initialization

- [ ] **Run all MatrixRTCManager tests**
  - `npm test MatrixRTCManager`
  - All tests pass
  - Coverage > 80%

#### 5.1.2 CallProvider Tests

- [ ] **Create test file**

  - File: `src/app/pages/client/call/CallProvider.test.tsx`
  - Setup React testing environment

- [ ] **Create mock MatrixRTCManager**

  - Mock all methods
  - Mock subscriptions
  - Create test utilities

- [ ] **Test: Provider renders**

  - Render CallProvider with children
  - Verify children rendered
  - No errors thrown

- [ ] **Test: Initial state**

  - Access context value
  - Verify activeCallRoomId is null
  - Verify isActiveCallReady is false
  - Verify default audio/video state

- [ ] **Test: Join call flow**

  - Call joinCall(roomId)
  - Verify MatrixRTCManager created
  - Verify initialize called
  - Verify join called
  - Verify activeCallRoomId updated

- [ ] **Test: Join call error handling**

  - Mock initialize to throw error
  - Call joinCall
  - Verify error handled gracefully
  - Verify state not corrupted

- [ ] **Test: Hang up flow**

  - Join a call
  - Call hangUp()
  - Verify manager.leave() called
  - Verify manager.stop() called
  - Verify state cleared

- [ ] **Test: Toggle audio**

  - Join call
  - Call toggleAudio()
  - Verify manager called
  - Verify state updated
  - Test error handling and rollback

- [ ] **Test: Toggle video**

  - Join call
  - Call toggleVideo()
  - Verify manager called
  - Verify state updated
  - Test error rollback

- [ ] **Test: Toggle chat**

  - Call toggleChat()
  - Verify isChatOpen toggled
  - No side effects

- [ ] **Test: Multiple calls**

  - Join call A
  - Join call B
  - Verify call A was hung up
  - Verify call B is active
  - Only one call at a time

- [ ] **Test: Members subscription**

  - Join call
  - Emit mock members update
  - Verify callMembers state updated
  - Verify consumers notified

- [ ] **Test: Connected subscription**

  - Join call
  - Emit connected=true
  - Verify isActiveCallReady updated
  - Test disconnect

- [ ] **Test: Cleanup on unmount**

  - Render provider
  - Join call
  - Unmount provider
  - Verify manager.stop() called

- [ ] **Run all CallProvider tests**
  - `npm test CallProvider`
  - All tests pass
  - Coverage > 80%

#### 5.1.3 VideoTrack Tests

- [ ] **Create test file**

  - File: `src/app/features/call/VideoTrack.test.tsx`
  - Setup testing environment

- [ ] **Create mock MemberInfo**

  - Mock participant with video track
  - Mock participant without video
  - Mock connection states

- [ ] **Test: Render with video track**

  - Render VideoTrack with video enabled
  - Verify <video> element rendered
  - Verify track.attach called
  - No errors

- [ ] **Test: Render without video**

  - Render with video disabled
  - Verify avatar placeholder shown
  - Verify video element not rendered
  - Display name shown

- [ ] **Test: Track attachment**

  - Mock video track
  - Render component
  - Verify attach called with video element
  - Verify detach called on unmount

- [ ] **Test: Track detachment**

  - Render component
  - Unmount
  - Verify track.detach called
  - No memory leaks

- [ ] **Test: Connection states**

  - Render with connecting state
  - Verify connecting overlay shown
  - Update to connected
  - Verify overlay hidden

- [ ] **Test: Mic muted indicator**

  - Render with mic muted
  - Verify mute icon shown
  - Toggle mic on
  - Verify icon hidden

- [ ] **Test: Display name**

  - Verify participant name displayed
  - Test with missing name
  - Test with long name

- [ ] **Test: Error handling**

  - Mock track attachment error
  - Verify error handled
  - Component doesn't crash

- [ ] **Test: No participant**

  - Render with null participant
  - Verify graceful handling
  - No crashes

- [ ] **Run all VideoTrack tests**
  - `npm test VideoTrack`
  - All tests pass
  - Coverage > 80%

### 5.2 Integration Tests

#### 5.2.1 Basic Call Flow

- [ ] **Setup integration test environment**

  - Configure test Matrix server or mocks
  - Setup test users
  - Create test room

- [ ] **Test: Open call room**

  - Navigate to call room
  - Verify CallView renders
  - Verify participant preview shown
  - No errors in console

- [ ] **Test: Click join button**

  - Click "Join Voice" button
  - Verify button disabled during join
  - Verify loading state shown
  - Wait for connection

- [ ] **Test: Connection established**

  - Verify connection status shows "Connected"
  - Verify video grid appears
  - Verify local video track shown
  - Audio/video controls enabled

- [ ] **Test: Video rendering**

  - Verify video element present
  - Verify video playing (if track available)
  - Verify participant info shown

- [ ] **Test: Hang up**

  - Click hang up button
  - Verify call ends
  - Verify return to preview
  - Verify nav status disappears
  - No errors

- [ ] **Test: Complete flow timing**
  - Measure time from join click to connected
  - Target: < 3 seconds
  - Document actual timing

#### 5.2.2 Multiple Participants

- [ ] **Setup two test users**

  - User A and User B
  - Both in same test room

- [ ] **Test: User A joins**

  - User A clicks join
  - Verify A sees own video
  - Verify A is in members list

- [ ] **Test: User B joins**

  - User B clicks join
  - Verify B sees own video
  - Verify B sees A's video
  - Both users see each other

- [ ] **Test: Member list updates**

  - Verify both users in members list
  - Verify correct count shown

- [ ] **Test: User A hangs up**

  - User A leaves
  - Verify B still in call
  - Verify B no longer sees A
  - B's call continues

- [ ] **Test: User B hangs up**
  - User B leaves
  - Verify call ended
  - Room shows no active calls

#### 5.2.3 Audio/Video Controls

- [ ] **Setup test user in call**

  - Join call
  - Verify connected

- [ ] **Test: Mute microphone**

  - Click mic button
  - Verify icon changes to muted
  - Verify other participants see mute indicator
  - Verify audio stops transmitting

- [ ] **Test: Unmute microphone**

  - Click mic button again
  - Verify icon changes to unmuted
  - Verify audio resumes

- [ ] **Test: Disable video**

  - Click camera button
  - Verify icon changes
  - Verify video stops
  - Verify avatar placeholder shown
  - Verify other participants see avatar

- [ ] **Test: Enable video**

  - Click camera button again
  - Verify video resumes
  - Verify video element shown

- [ ] **Test: Toggle video rapidly**

  - Click camera button multiple times quickly
  - Verify no errors
  - Verify final state correct

- [ ] **Test: State persistence**
  - Mute mic
  - Disable video
  - Navigate away and back
  - Verify states preserved (or reset, depending on design)

#### 5.2.4 Navigation During Call

- [ ] **Setup user in call**

  - Join call in Room A
  - Verify connected

- [ ] **Test: Navigate to different room**

  - Click on Room B in room list
  - Verify navigation occurs
  - Verify call continues (nav status visible)
  - Verify no errors

- [ ] **Test: Navigate back to call room**

  - Click on Room A again
  - Verify CallView renders
  - Verify video still playing
  - Verify call state correct

- [ ] **Test: Navigate during connecting**

  - Click join
  - Immediately navigate away
  - Verify no errors
  - Verify call connects in background (or cancels, depending on design)

- [ ] **Test: Navigation UI**
  - Verify nav status bar always visible during call
  - Verify can access call room from anywhere
  - "Go to Room" button works

#### 5.2.5 Error Handling

- [ ] **Test: Camera permission denied**

  - Mock browser denying camera permission
  - Try to join call
  - Verify error message shown
  - Verify user can still join audio-only
  - Graceful degradation

- [ ] **Test: Microphone permission denied**

  - Mock browser denying mic permission
  - Try to join call
  - Verify error message shown
  - Verify user can still view call (listen-only)

- [ ] **Test: Network disconnect during call**

  - Join call successfully
  - Simulate network disconnect
  - Verify connection state updates
  - Verify reconnection attempt
  - Verify state when back online

- [ ] **Test: SFU connection failure**

  - Mock LiveKit SFU unavailable
  - Try to join call
  - Verify error message shown
  - Verify retry option available
  - Graceful failure

- [ ] **Test: SDK initialization failure**

  - Mock SDK failing to initialize
  - Try to join call
  - Verify error handled
  - Verify user notified
  - App doesn't crash

- [ ] **Test: Widget loading failure**
  - Mock widget HTML failing to load
  - Try to join call
  - Verify timeout or error
  - Verify user notified

### 5.3 Manual Testing

#### 5.3.1 Desktop Testing

- [ ] **Test: Join as first participant**

  - Open Cinny on desktop browser
  - Navigate to call room
  - Click join
  - Verify connection
  - Check video quality
  - Check audio quality

- [ ] **Test: Join as second participant**

  - Open second browser/profile
  - Join same call
  - Verify both participants see each other
  - Verify audio/video quality
  - Test bidirectional communication

- [ ] **Test: Multiple participants (3+)**

  - Add third and fourth participants
  - Verify video grid layout
  - All participants visible
  - Performance acceptable
  - Audio mixing works

- [ ] **Test: Audio toggle**

  - Mute and unmute microphone
  - Verify audio stops/starts
  - Verify indicator updates
  - Ask other participant to confirm

- [ ] **Test: Video toggle**

  - Disable and enable camera
  - Verify video stops/starts
  - Verify avatar/video transition smooth
  - Ask other participant to confirm

- [ ] **Test: Hang up**

  - Click hang up
  - Verify call ends cleanly
  - No lingering connections
  - Can rejoin successfully

- [ ] **Test: Navigate during call**

  - Join call
  - Navigate to other rooms
  - Navigate to spaces
  - Return to call room
  - Verify call persists throughout

- [ ] **Test: Chat alongside video**

  - While in call, use chat
  - Send messages
  - Receive messages
  - Verify layout doesn't break
  - Both work simultaneously

- [ ] **Test: Screen sharing** (if supported)

  - Initiate screen share
  - Verify screen visible to others
  - Stop screen share
  - Check functionality

- [ ] **Test: Window resize**

  - Resize browser window
  - Verify layout adapts
  - Video tracks resize correctly
  - No layout breaks

- [ ] **Test: Full screen**
  - Press F11 (full screen)
  - Verify layout still works
  - Exit full screen
  - Verify no issues

#### 5.3.2 Mobile Testing

- [ ] **Test: Join call on mobile**

  - Open Cinny on mobile browser
  - Navigate to call room
  - Tap join button
  - Verify connection
  - Check video renders

- [ ] **Test: Toggle between chat and video**

  - Use chat toggle button
  - Switch to chat view
  - Switch back to video
  - Verify smooth transitions
  - No content loss

- [ ] **Test: Audio controls accessible**

  - Tap mic button
  - Verify mute/unmute works
  - Touch target adequate size
  - Visual feedback clear

- [ ] **Test: Video controls accessible**

  - Tap camera button
  - Verify enable/disable works
  - Button size adequate
  - Clear visual state

- [ ] **Test: Portrait/landscape rotation**

  - Rotate device
  - Verify layout adapts
  - No layout breaks
  - Video tracks resize

- [ ] **Test: Background/foreground**

  - Join call
  - Switch to another app
  - Return to Cinny
  - Verify call still active
  - No disconnection

- [ ] **Test: Lock screen during call**

  - Join call
  - Lock device screen
  - Unlock after a moment
  - Verify call continues
  - Check reconnection

- [ ] **Test: Low signal conditions**
  - Enable network throttling
  - Join call
  - Verify degradation graceful
  - Check reconnection when signal improves

#### 5.3.3 Edge Cases

- [ ] **Test: Rapid join/leave cycles**

  - Join call
  - Immediately leave
  - Immediately join again
  - Repeat several times
  - Verify no errors
  - No memory leaks

- [ ] **Test: Close Cinny during call**

  - Join call
  - Close browser tab
  - Reopen Cinny
  - Verify call was ended
  - Can join again

- [ ] **Test: Refresh page during call**

  - Join call
  - Refresh browser (F5)
  - Verify call ends
  - Can rejoin after reload

- [ ] **Test: Multiple tabs with same user**

  - Open Cinny in two tabs (same user)
  - Join call in tab 1
  - Try to join in tab 2
  - Verify behavior (only one, or second kicks first)
  - No data corruption

- [ ] **Test: Join call in private/incognito mode**

  - Open private browsing window
  - Login to Cinny
  - Join call
  - Verify works same as normal mode

- [ ] **Test: Browser compatibility**

  - Test on Chrome
  - Test on Firefox
  - Test on Safari
  - Test on Edge
  - Document any browser-specific issues

- [ ] **Test: Very long call duration**
  - Join call
  - Stay connected for 30+ minutes
  - Check for memory leaks
  - Check for performance degradation
  - Verify stable connection

### 5.4 Performance Testing

#### 5.4.1 Memory Usage

- [ ] **Setup performance monitoring**

  - Open Chrome DevTools
  - Go to Memory tab
  - Take heap snapshot before call

- [ ] **Test: Memory before and after join**

  - Take snapshot before joining
  - Join call
  - Wait for connection
  - Take snapshot after join
  - Compare memory usage
  - Document difference

- [ ] **Test: Memory after leaving call**

  - Join and leave call
  - Take heap snapshot
  - Force garbage collection
  - Take another snapshot
  - Verify memory released
  - No significant leaks

- [ ] **Test: Memory with multiple participants**

  - Join call with 4+ participants
  - Monitor memory over time
  - Verify no steady increase (leak)
  - Document peak memory

- [ ] **Compare with old implementation**

  - If old implementation available
  - Join call with both versions
  - Compare memory usage
  - New implementation should be lower
  - Document improvement percentage

- [ ] **Test: Long-running call memory**
  - Join call
  - Monitor memory for 30 minutes
  - Chart memory over time
  - Verify no continuous growth
  - Identify any leak patterns

#### 5.4.2 CPU Usage

- [ ] **Setup CPU monitoring**

  - Open Chrome DevTools
  - Go to Performance tab
  - Or use OS task manager

- [ ] **Test: CPU during call**

  - Start CPU recording
  - Join call
  - Record for 1-2 minutes
  - Stop recording
  - Analyze CPU profile
  - Identify hot paths

- [ ] **Test: CPU with video disabled**

  - Join with video off
  - Monitor CPU
  - Compare to video enabled
  - Document difference

- [ ] **Test: CPU with multiple participants**

  - Join call with increasing participants (1, 2, 4, 6)
  - Monitor CPU for each
  - Document CPU usage scaling
  - Identify bottlenecks

- [ ] **Compare with old implementation**

  - Measure CPU in old version
  - Measure CPU in new version
  - Compare results
  - Document improvement

- [ ] **Test: CPU during navigation**
  - Join call
  - Navigate between rooms
  - Monitor CPU spikes
  - Verify acceptable performance

#### 5.4.3 Call Join Performance

- [ ] **Test: Time to join call**

  - Clear browser cache
  - Click join button
  - Start timer
  - Stop when connected (connection status = connected)
  - Record time
  - Target: < 3 seconds

- [ ] **Test: Repeat join timing**

  - Join call 10 times
  - Record each join time
  - Calculate average
  - Calculate std deviation
  - Verify consistent performance

- [ ] **Test: Join time with slow network**

  - Enable network throttling (3G)
  - Measure join time
  - Document impact
  - Verify timeout handling

- [ ] **Compare with old implementation**
  - Measure join time in old version
  - Measure in new version
  - Compare results
  - New version should be faster
  - Document improvement

#### 5.4.4 Video Performance

- [ ] **Test: Video frame rate**

  - Join call with video enabled
  - Use browser tools to measure FPS
  - Target: ≥ 24 FPS
  - Record actual FPS
  - Test with multiple participants

- [ ] **Test: Video resolution**

  - Check video element dimensions
  - Check track settings (resolution)
  - Verify appropriate quality
  - Not too high (bandwidth) or too low (quality)

- [ ] **Test: Video smoothness**

  - Visual inspection
  - No stuttering or freezing
  - Smooth motion
  - Acceptable latency

- [ ] **Test: Multiple video tracks**
  - Join with 4+ participants
  - All video enabled
  - Verify all render smoothly
  - Check frame rate doesn't drop

#### 5.4.5 Audio Performance

- [ ] **Test: Audio quality**

  - Join call
  - Test microphone
  - Ask other participant to rate quality
  - Clear audio, no distortion
  - Acceptable latency

- [ ] **Test: Audio with multiple participants**

  - Join call with 3+ people
  - All speak simultaneously
  - Verify audio mixing works
  - No audio drops
  - All participants audible

- [ ] **Test: Audio latency**
  - Clap hands or snap
  - Ask other participant when they hear it
  - Measure latency
  - Target: < 500ms
  - Document actual latency

### 5.5 Documentation

#### 5.5.1 Update research.md

- [ ] **Open research.md**

  - Review current content

- [ ] **Add new section: Headless SDK Implementation**

  - Overview of new architecture
  - Comparison with old widget approach
  - Benefits of new approach

- [ ] **Update architecture diagrams**

  - Create new diagram for headless SDK flow
  - Show RTCBridge, MatrixRTCManager, etc.
  - Update data flow diagrams

- [ ] **Document key components**

  - MatrixRTCManager
  - RTCBridge
  - VideoTrack
  - Updated CallProvider

- [ ] **Document API changes**

  - New CallProvider interface
  - Removed methods
  - New methods

- [ ] **Add migration notes**

  - What was removed
  - What was added
  - Breaking changes
  - Migration guide for developers

- [ ] **Update troubleshooting section**

  - Common issues with new implementation
  - Debugging tips
  - Known limitations

- [ ] **Proofread and finalize**

#### 5.5.2 Update README.md

- [ ] **Check if README mentions calls**

  - Search for "call", "voice", "video"

- [ ] **Update feature list** (if applicable)

  - Mention voice/video calling
  - Remove widget references
  - Mention powered by Element Call SDK

- [ ] **Update screenshots** (if applicable)

  - Show new call UI
  - Replace old iframe screenshots

- [ ] **Update dependencies section** (if exists)
  - Mention livekit-client
  - Remove @element-hq/element-call-embedded

#### 5.5.3 Update CONTRIBUTING.md

- [ ] **Review development setup section**

  - Update if needed for new architecture

- [ ] **Add RTC testing section**

  - How to test calls locally
  - How to debug RTC issues
  - Common problems and solutions

- [ ] **Document SDK development**

  - How to rebuild SDK if modified
  - Where SDK source is located
  - How to update SDK version

- [ ] **Add debugging guide**
  - Browser DevTools tips for RTC
  - LiveKit debugging
  - Matrix RTC debugging
  - Common error messages

#### 5.5.4 Create CALLS.md

- [ ] **Create new documentation file**

  - Location: `CALLS.md` in project root

- [ ] **Write architecture overview**

  - High-level architecture
  - Component breakdown
  - Data flow

- [ ] **Document key concepts**

  - Matrix RTC protocol
  - LiveKit SFU architecture
  - Per-participant E2EE
  - Widget wrapper approach

- [ ] **Explain components in detail**

  - MatrixRTCManager responsibilities
  - RTCBridge communication protocol
  - VideoTrack implementation
  - CallProvider state management

- [ ] **Add debugging guide**

  - How to enable debug logging
  - What to look for in console
  - Network tab analysis
  - Common error patterns

- [ ] **Document common issues**

  - Camera/mic permissions
  - Connection failures
  - Video not displaying
  - Audio issues
  - Solutions for each

- [ ] **Add development guide**

  - How to modify call functionality
  - How to add features
  - Testing strategies
  - Best practices

- [ ] **Include LiveKit resources**

  - Link to LiveKit docs
  - Link to Matrix RTC spec
  - Link to Element Call repo
  - Link to SDK docs

- [ ] **Add FAQ section**

  - Why headless SDK instead of iframe?
  - Why still use widget wrapper?
  - How does E2EE work?
  - Performance considerations
  - Browser compatibility

- [ ] **Proofread and finalize**

---

## Phase 6: Migration Strategy (1 day)

### 6.1 Feature Flag Implementation (Optional)

- [ ] **Decide if feature flag is needed**

  - Consider rollout strategy
  - Risk assessment
  - User base size

- [ ] **Create feature flag infrastructure** (if implementing)

  - Add to config.json or env vars
  - Create hook: `useFeatureFlags.ts`
  - Define flag: `experimentalHeadlessCall`

- [ ] **Implement flag in CallProvider**

  - Check flag value
  - Conditionally use old or new implementation
  - Keep both code paths during transition

- [ ] **Add UI toggle** (optional)

  - Settings page toggle
  - Allow users to opt-in/out
  - Persist preference

- [ ] **Document feature flag**

  - How to enable/disable
  - What it controls
  - When it will be removed

- [ ] **Test both implementations**
  - Test with flag enabled
  - Test with flag disabled
  - Verify clean switching

### 6.2 Rollout Plan

#### 6.2.1 Week 1: Internal Testing

- [ ] **Enable for developers only**

  - Set flag to enabled for dev team
  - Or deploy to dev environment only

- [ ] **Internal testing**

  - All team members test calls
  - Test all scenarios
  - Document any issues found

- [ ] **Fix critical bugs**

  - Prioritize show-stopper bugs
  - Fix and re-test
  - Verify stability

- [ ] **Performance baseline**

  - Collect performance metrics
  - Compare to old implementation
  - Verify improvements

- [ ] **Code review**

  - Team reviews all new code
  - Address feedback
  - Ensure quality standards met

- [ ] **Documentation review**
  - Team reviews documentation
  - Verify accuracy
  - Fill in any gaps

#### 6.2.2 Week 2: Beta Testing

- [ ] **Enable for beta users**

  - Announce beta program
  - Enable flag for opt-in users
  - Or deploy to beta environment

- [ ] **Gather feedback**

  - Create feedback form
  - Monitor bug reports
  - Track user experience

- [ ] **Monitor error rates**

  - Setup error tracking (Sentry, etc.)
  - Monitor console errors
  - Track failed call attempts

- [ ] **Fix reported issues**

  - Prioritize based on severity
  - Quick fixes for minor issues
  - Plan for larger issues

- [ ] **Performance monitoring**

  - Collect real-world performance data
  - Monitor memory/CPU usage
  - Track call join times

- [ ] **Iterate based on feedback**
  - Make improvements
  - Fix UX issues
  - Polish rough edges

#### 6.2.3 Week 3: Gradual Rollout

- [ ] **Enable for 10% of users**

  - Use feature flag with percentage
  - Or deploy to 10% of servers
  - Monitor closely

- [ ] **Monitor metrics for 2-3 days**

  - Error rates
  - Performance metrics
  - User feedback
  - Compare to baseline

- [ ] **Fix any issues**

  - Quick response to problems
  - Rollback if critical issues

- [ ] **Increase to 50% of users**

  - If 10% successful, increase
  - Continue monitoring

- [ ] **Monitor for another 2-3 days**

  - Watch for any new issues
  - Verify scalability

- [ ] **Prepare for full rollout**
  - Final bug fixes
  - Update documentation
  - Prepare announcement

#### 6.2.4 Week 4: Full Rollout

- [ ] **Enable for 100% of users**

  - Set feature flag to always enabled
  - Or deploy to all servers
  - Monitor closely during rollout

- [ ] **Announce to community**

  - Blog post about improvements
  - Changelog entry
  - Social media announcement

- [ ] **Monitor first 24 hours**

  - Watch error rates
  - Respond to issues quickly
  - Provide support

- [ ] **Monitor first week**

  - Continue monitoring metrics
  - Address any issues
  - Collect feedback

- [ ] **Remove feature flag**

  - After stable for 1 week
  - Remove old implementation code
  - Remove flag infrastructure

- [ ] **Delete old code**
  - Final cleanup of old widget code
  - Already done in Phase 4, but verify
  - Remove any remaining references

### 6.3 Rollback Plan

- [ ] **Document rollback procedure**

  - Write clear steps
  - Include commands/config changes
  - Assign responsibility

- [ ] **Test rollback procedure**

  - Practice rollback in dev environment
  - Verify can switch back quickly
  - Time the rollback process

- [ ] **Define rollback criteria**

  - What triggers a rollback?
  - Error rate threshold
  - User impact threshold
  - Who can authorize rollback?

- [ ] **Immediate rollback steps**

  - Set feature flag to false/widget
  - Or deploy previous version
  - Communicate to users
  - Target: < 5 minutes to rollback

- [ ] **Short-term plan after rollback**

  - Analyze what went wrong
  - Fix critical issues
  - Plan re-rollout

- [ ] **Long-term plan if unfixable**
  - Keep widget implementation
  - Report issues to Element team
  - Consider contributing fixes to SDK
  - Re-evaluate in future

---

## Post-Migration Tasks

### Code Maintenance

- [ ] **Update code comments**

  - Explain headless SDK usage
  - Document any workarounds
  - Add references to relevant docs

- [ ] **Refactor opportunities**

  - Identify code that can be simplified further
  - Extract reusable utilities
  - Improve type safety

- [ ] **Add more tests**

  - Increase test coverage
  - Add integration tests for edge cases
  - Performance regression tests

- [ ] **Setup monitoring**
  - Error tracking
  - Performance monitoring
  - Usage analytics

### Community & Support

- [ ] **Update community documentation**

  - Update wiki if exists
  - Update FAQ
  - Create user guides

- [ ] **Prepare support resources**

  - Common questions and answers
  - Troubleshooting flowchart
  - Contact information for issues

- [ ] **Gather user feedback**

  - Create survey
  - Monitor social media
  - Engage with community

- [ ] **Iterate on feedback**
  - Plan future improvements
  - Address UX issues
  - Add requested features

### Future Enhancements

- [ ] **Consider removing widget wrapper**

  - Investigate if SDK can run without widget context
  - Fork SDK if needed
  - Plan migration to pure client-side

- [ ] **Add advanced features**

  - Screen sharing UI
  - Picture-in-picture mode
  - Virtual backgrounds
  - Noise cancellation UI

- [ ] **Performance optimizations**

  - Optimize video rendering
  - Reduce memory usage further
  - Improve join time

- [ ] **Mobile native app**
  - Consider native implementation
  - Use LiveKit native SDKs
  - Better mobile experience

---

## Summary Checklist

### Phase 1 Complete

- [ ] All dependencies installed
- [ ] SDK built and accessible
- [ ] Type definitions created
- [ ] Development environment configured

### Phase 2 Complete

- [ ] RTCBridge implemented and tested
- [ ] Minimal widget HTML created
- [ ] MatrixRTCManager implemented and tested
- [ ] CallProvider refactored and tested

### Phase 3 Complete

- [ ] PersistentCallContainer deleted
- [ ] VideoTrack component created
- [ ] CallView refactored
- [ ] useCallMemberships updated
- [ ] All UI components working

### Phase 4 Complete

- [ ] All old widget files deleted
- [ ] Router updated
- [ ] Element Call package removed
- [ ] Vite config updated
- [ ] Configuration cleaned up

### Phase 5 Complete

- [ ] All unit tests written and passing
- [ ] All integration tests passing
- [ ] Manual testing completed
- [ ] Performance testing completed
- [ ] Documentation updated

### Phase 6 Complete

- [ ] Feature flag implemented (if using)
- [ ] Rollout plan executed
- [ ] Full deployment successful
- [ ] Old code removed
- [ ] Migration complete

---

**Total Tasks**: 400+  
**Estimated Duration**: 10-14 days  
**Status**: Ready to Begin  
**Last Updated**: March 7, 2026
