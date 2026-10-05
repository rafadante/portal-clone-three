# Portal Clone Three! 

A browser-based clone of **Portal**, built with **Three.js** and **React**. Explore test chambers, place connected portals, and solve physics-based puzzles inspired by the Portal games.

**[Play the live demo](https://portal-clone-three.vercel.app/)**

## Features

- **Portal mechanics:** place blue and orange portals and travel between them.
- **First-person gameplay:** mouse look, movement, jumping, crouching, and object interaction.
- **Physics-based puzzles:** cubes, buttons, doors, moving platforms, lasers, and energy pellets.
- **Portal-inspired mechanics:** gels, faith plates, tractor beams, light bridges, fizzlers, and turrets.
- **Ten tutorial chambers** included in the project.
- **Built-in level editor** for creating custom test chambers.
- **Community chambers** backed by Supabase, with authentication and saved play records.
- **Mobile touch controls**, including a virtual joystick and action buttons.
- **Custom shaders, sound effects, and post-processing** for the game environment.

The level editor is experimental; changes may affect compatibility with existing custom maps.

## Tech Stack

- **Three.js** — 3D rendering, cameras, materials, and shaders.
- **Cannon.js** — physics simulation and collisions.
- **React** — application interface and authentication flow.
- **Supabase** — authentication, chamber metadata, and level storage.
- **Webpack and Babel** — build tooling based on Create React App, with configuration maintained in the repository.
- **Sass** — interface styling.
- **Electron** — desktop wrapper and packaging scripts.

## Getting Started

### Prerequisites

- Node.js and npm.
- A browser with WebGL support.
- A Supabase project URL and public anonymous key.

### Installation

Download or clone this repository, open a terminal in the project directory, and install its dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root with your Supabase configuration:

```dotenv
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-public-anon-key
```

The application initializes Supabase at startup, so these values are required even when using guest mode. If you already have `.env` or `.env.development.local` files, check for conflicting values; `.env.development.local` takes precedence during development.

Authentication and community features also require the corresponding Supabase backend configuration. The code references Google OAuth, the `chambers` and `chambers_played` tables, and a Storage bucket named `json`. Environment variables alone do not create these resources.

### Development

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000). Restart the development server after changing environment variables.

### Production Build

```bash
npm run build
```

The production files are generated in `build/` and can be served by a static hosting provider. Configure the same environment variables before building for deployment.

## Controls

Desktop gameplay uses the following controls:

- **W / A / S / D** — move.
- **Mouse** — look around.
- **Left mouse button** — fire the blue portal.
- **Right mouse button** — fire the orange portal.
- **Space** — jump.
- **Left Ctrl** — crouch.
- **E** — interact with objects.
- **Esc** — release the mouse pointer and open the pause menu.

Portal availability depends on the current chamber. On mobile, use the on-screen joystick and action buttons.

## Project Structure

```text
public/
  assets/         3D models, textures, and images
  audio/          Music and sound effects
  levels/         Tutorial chambers and preview images
  electron.js     Electron entry point
src/
  components/     Gameplay systems, editor tools, shaders, and UI
  App.js          React interface and Supabase integration
  Main.js         Main game setup and coordination
  Physics.js      Physics world and simulation
  Globals.js      Shared game state
  supabaseClient.js
config/           Webpack and test configuration
scripts/          Development, build, and test scripts
```

## Desktop Development

Start the web development server with `npm start`, then run the Electron wrapper in another terminal:

```bash
npm run electron-dev
```

To package the desktop application:

```bash
npm run build
npm run electron-pack
```

Desktop packaging output is configured to use the `release/` directory. Available targets depend on the host platform and the Electron Builder configuration in `package.json`.

## Credits

Inspired by **Portal** and **Portal 2** by Valve. This is an unofficial fan project and is not affiliated with or endorsed by Valve.

## Multiplayer chambers (experimental)

Multiplayer uses the existing editor, chamber assets, physics and portal renderer.

1. Select **CREATE MULTIPLAYER CHAMBER**, or open your chamber and choose **Settings → Chamber type → Multiplayer (2 players)**.
2. Choose **1 portal each — shared pair** (cyan for player 1, yellow for player 2), or **2 portals each — independent pairs** (cyan/yellow and purple/green).
3. Build the chamber as usual. Entrance and exit bounds must be green, just as for the existing Test action.
4. Select **Host this chamber online** and share the room code or invitation link.
5. The second player selects **JOIN MULTIPLAYER ROOM** and enters the code. The host's chamber transfers automatically, without publishing it first.
6. Select **PLAY** in the normal game menu. The **Room** button opens the invitation and Leave controls. Returning to the editor ends the session.

In shared-pair mode, either mouse button places your assigned portal. In independent-pairs mode, left/right click place your two portals. Both players can traverse any complete pair. The normal movement and chamber controls remain available.

### Chamber format

The existing `[settings, planes]` file structure is preserved. `settings[4]` stores chamber metadata:

```json
{ "version": 1, "mode": "multiplayer", "portalMode": "shared" }
```

Use `"independent"` for four portals, or `"single"` for the chamber mode to play solo. Files without metadata default to single-player. Saving and publishing preserve these settings, which are locked during a room session.

### Networking and current scope

Rooms use the existing Supabase variables and Realtime Broadcast. No new database tables or dedicated server are needed; the project must allow public Realtime channels. Each room admits two players and transfers the authored chamber in acknowledged chunks, up to 4 MB of serialized data. Player transforms and owned portal revisions are sent at 10 Hz. Stale packets and updates claiming the other player's portal slots are ignored.

Keep both tabs active. Leaving or losing the connection ends the session; create another room to reconnect. Room codes are invitations for trusted partners, not authenticated private lobbies. There is no host migration or persistent session recovery.

This integration synchronizes the chamber, player avatars and portals. **Movable cubes, switches, scripted devices and chamber completion still run locally and are not synchronized between players.** Puzzles that depend on shared object state require an additional replication layer.

### Tests

```bash
npm run test:coop
```

Tests cover legacy file compatibility, serialization without mutating live objects, both portal ownership modes, chamber transfer, admission limits, disconnects, packet ordering and malformed state rejection.

## Google sign-in during local development

The login flow returns to the origin and pathname where it was started. In Supabase, open **Authentication > URL Configuration > Redirect URLs** and add the exact development URLs you use, for example `http://localhost:3000/` and `http://192.168.100.77:3000/`. Keep the production **Site URL** unchanged. If the requested return URL is not allowed, Supabase can fall back to the production Site URL. Update this list when the local IP or port changes.
