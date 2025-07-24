# Setup Instructions for OniBot

## Prerequisites

1. **Node.js** (version 16+ recommended)
2. **MongoDB** database (local or MongoDB Atlas)
3. **Discord Bot Token** from Discord Developer Portal

## Step-by-Step Setup

### 1. Create Discord Bot
1. Go to https://discord.com/developers/applications
2. Click "New Application" and name it
3. Go to "Bot" section
4. Click "Add Bot"
5. Copy the bot token (keep it secret!)
6. Enable these intents:
   - Presence Intent
   - Server Members Intent
   - Message Content Intent

### 2. MongoDB Setup
**Option A: MongoDB Atlas (Cloud - Recommended)**
1. Go to https://mongodb.com/atlas
2. Create free account
3. Create cluster
4. Get connection string

**Option B: Local MongoDB**
1. Install MongoDB locally
2. Use connection string: `mongodb://localhost:27017/onibot`

### 3. Install and Run

1. **Clone/Download this repository**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create `.env` file in root directory:**
   ```
   DISCORD_TOKEN=your_bot_token_here
   MONGODB_URI=your_mongodb_connection_string
   MAL_CLIENT_ID=optional_mal_api_key
   ```

4. **Start the bot:**
   ```bash
   node index.js
   ```

5. **Success indicators:**
   - "Connected to MongoDB"
   - "Logged in as YourBot#1234!"
   - "Successfully registered application commands"
   - "Loaded 5100 characters from cache"

### 4. Invite Bot to Server

1. Go back to Discord Developer Portal
2. Go to "OAuth2" > "URL Generator"
3. Select "bot" and "applications.commands"
4. Select these permissions:
   - Send Messages
   - Use Slash Commands
   - Embed Links
   - Attach Files
   - Read Message History
5. Copy generated URL and open in browser
6. Select your server and authorize

## Testing Commands

Once bot is running, test these commands in Discord:

- `/drop` - Get your first cards
- `/collection` - View your cards
- `/testcurrency` - Get test currency (owner only)
- `/grade cardid:YOUR_CARD_ID` - Grade a card

## Troubleshooting

**Bot not responding:**
- Check console for errors
- Verify bot token is correct
- Ensure bot has permissions in server

**Database errors:**
- Check MongoDB connection string
- Verify database is running
- Check firewall settings for MongoDB Atlas

**Command not found:**
- Wait 1-2 minutes after startup
- Check "Successfully registered application commands" message
- Try restarting bot

## File Structure

- `index.js` - Main bot file
- `grading_system.js` - Card grading system
- `professional_image_system.js` - Image processing
- `anilist_character_system.js` - Character database
- `battleSystem.js` - Battle mechanics
- Font files (`*.ttf`) - Required for card generation