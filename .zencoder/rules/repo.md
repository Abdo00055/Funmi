---
description: Repository Information Overview
alwaysApply: true
---

# Funmi Discord Bot Information

## Summary
Funmi is a Discord music bot built with Discord.js that allows users to play music from YouTube and Spotify in voice channels. The bot provides slash commands for music playback control and integrates with various music platforms.

## Structure
- **commands/**: Contains all slash command implementations for the bot
- **events/**: Event handlers for Discord.js events and DisTube events
- **utils/**: Utility files including emoji definitions and state management
- **bin/**: Contains binary files like ffmpeg.exe for audio processing
- **index.js**: Main entry point for the application

## Language & Runtime
**Language**: JavaScript (Node.js)
**Version**: CommonJS modules
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- **discord.js**: v14.21.0 - Core Discord API framework
- **distube**: v5.0.7 - Music streaming library for Discord bots
- **@discordjs/voice**: v0.18.0 - Voice support for Discord.js
- **@distube/spotify**: v2.0.2 - Spotify integration for DisTube
- **@distube/youtube**: v1.0.4 - YouTube integration for DisTube
- **dotenv**: v17.2.0 - Environment variable management
- **express**: v5.1.0 - Web server framework
- **mongoose**: v8.16.4 - MongoDB ODM
- **ffmpeg**: v0.0.4 - Audio processing library

## Build & Installation
```bash
# Install dependencies
npm run setup

# Start the bot
npm start
```

## Environment Configuration
The bot requires the following environment variables in a `.env` file:
- `DISCORD_TOKEN`: Discord bot token
- `CLIENT_ID`: Discord application client ID
- `SPOTIFY_CLIENT_ID`: Spotify API client ID
- `SPOTIFY_CLIENT_SECRET`: Spotify API client secret
- `MONGO_URI`: MongoDB connection string
- `PORT`: Port for the Express server

## Main Features
- Music playback from YouTube and Spotify
- Queue management with play, skip, stop commands
- Volume control and seeking within tracks
- Auto-disconnect when voice channel is empty
- Interactive embeds for music control

## Commands
- **/play**: Play a song from YouTube or Spotify
- **/nowplaying**: Show current playing track
- **/skip**: Skip to the next song
- **/stop**: Stop playback and clear queue
- **/volume**: Adjust playback volume
- **/seek**: Seek to a specific position in the track
- **/previous**: Play the previous song
- **/help**: Display available commands
- **/invite**: Get bot invite link