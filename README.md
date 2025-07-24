# OniBot - Advanced Discord Anime Card Collection Bot

Professional Discord bot featuring 5,100+ anime characters, PSA-style card grading, and strategic 5v5 battles.

## Quick Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create `.env` file with:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   MONGODB_URI=your_mongodb_connection_string
   MAL_CLIENT_ID=optional_mal_api_key
   ```

3. **Run Bot:**
   ```bash
   node index.js
   ```

## Features

- 🎴 **5,100+ Anime Characters** from AniList database
- 🏆 **PSA-Style Grading System** (6.0-10.0 scale)
- ⚔️ **Strategic 5v5 Battles** with real-time visuals
- 🎨 **Card Customization** (dyes, frames, auras)
- 💰 **Multi-Currency Economy** (Lumens, Nova Gems, Mythic Shards)
- 🎮 **Interactive Gameplay** (missions, training, fishing, casino)

## Commands

- `/drop` - Get new character cards
- `/collection` - Browse your cards
- `/grade` - Grade your cards (PSA-style)
- `/battle` - Start 5v5 battles
- `/lineup` - Build battle teams
- `/customize` - Personalize cards

## Architecture

- **Node.js + Discord.js v14** - Real-time Discord integration
- **MongoDB + Mongoose** - Data persistence
- **Sharp + Canvas** - Professional image processing
- **AniList API** - Authentic character data

For detailed documentation, see `BOT_SUMMARY.md`.