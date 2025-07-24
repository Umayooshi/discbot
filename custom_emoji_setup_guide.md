# Custom Emoji Setup Guide for Discord Bot

## Overview
To use custom emojis in your Discord bot, you need to upload them to a Discord server where your bot has access. Here's the complete setup process:

## Step 1: Create or Use a Discord Server

### Option A: Create a New Server (Recommended)
1. Open Discord and click the "+" button in your server list
2. Choose "Create My Own" → "For me and my friends"
3. Name it something like "OniBot Emojis" or "Testing Server"
4. This server will act as your emoji storage

### Option B: Use an Existing Server
- Use any server where you have "Manage Emojis" permission
- Make sure your bot is also in this server

## Step 2: Add Your Bot to the Server

1. Go to Discord Developer Portal (https://discord.com/developers/applications)
2. Select your bot application
3. Go to "OAuth2" → "URL Generator"
4. Select scopes: `bot` and `applications.commands`
5. Select permissions: `Use External Emojis`, `Read Messages`, `Send Messages`
6. Copy the generated URL and open it in your browser
7. Select your emoji server and authorize the bot

## Step 3: Upload Custom Emojis

### For Gaming/Card Themes:
Upload these types of emojis to enhance your bot:

**Card Rarity Indicators:**
- ⭐ (already built-in) for basic
- 💎 for rare  
- 🌟 for epic
- 🔥 for legendary

**Gaming Elements:**
- ⚔️ for battles
- 🛡️ for defense
- ⚡ for attack/speed
- 🎯 for accuracy
- 💪 for strength

**Currency & Rewards:**
- 🔥 Oni Flames (already using)
- ⭐ Mystic Shards (already using) 
- 💎 Divine Crystals (already using)
- 🎁 for chests/rewards
- 💰 for currency

### Upload Process:
1. Right-click in your emoji server
2. Go to "Server Settings" → "Emoji"
3. Click "Upload Emoji"
4. Choose your image files (PNG, JPG, GIF under 256KB each)
5. Name them clearly (like "oni_flame", "mystic_shard", etc.)

## Step 4: Using Emojis in Your Bot Code

### Format for Custom Emojis:
```javascript
// For custom emojis from your server
const customEmoji = '<:emoji_name:emoji_id>';

// Example:
const oniFlame = '<:oni_flame:1234567890123456789>';
const mysticShard = '<:mystic_shard:9876543210987654321>';
```

### How to Get Emoji IDs:
1. Type `\:emoji_name:` in Discord chat
2. Send the message - it will show the full emoji code
3. Copy the ID numbers

### Alternative - Use Unicode Emojis:
Your bot currently uses Unicode emojis (🔥⭐💎) which work universally without server setup.

## Step 5: Implementation in Code

### Current Setup (Unicode - No Setup Needed):
```javascript
const currencies = {
  oniFlames: '🔥',
  mysticShards: '⭐', 
  divineCrystals: '💎'
};
```

### Upgraded Setup (Custom Emojis):
```javascript
const currencies = {
  oniFlames: '<:oni_flame:YOUR_EMOJI_ID>',
  mysticShards: '<:mystic_shard:YOUR_EMOJI_ID>',
  divineCrystals: '<:divine_crystal:YOUR_EMOJI_ID>'
};
```

## Benefits of Custom Emojis

**Advantages:**
- Unique branding for your bot
- Consistent look across all Discord clients
- More detailed and specific designs
- Professional appearance

**Considerations:**
- Server emoji limits (50 static, 50 animated for non-boosted servers)
- Need to manage emoji server access
- More setup complexity

## Current Recommendation

Your bot currently uses Unicode emojis which work perfectly and require no setup. Consider upgrading to custom emojis only if you want:
- Unique branding
- More detailed visual elements
- Animated emojis for special effects

## Testing Your Setup

After uploading custom emojis:
1. Use `/testemojis` command (if implemented)
2. Check that emojis display correctly in embeds
3. Test on different Discord clients (mobile, desktop, web)

Your current Unicode emoji system (🔥⭐💎) is already excellent and requires no additional setup!