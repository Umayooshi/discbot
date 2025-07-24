# OniBot - Advanced Discord Anime Card Collection Bot

## Overview
OniBot is a sophisticated Discord bot that combines anime character collection with strategic RPG gameplay. Built with professional-grade image processing and real-time battle systems, it offers an immersive trading card game experience within Discord servers.

## Core Features

### 🎴 Character Collection System
- **5,100+ Authentic Characters**: Sourced from AniList database covering major anime series
- **Card Versioning**: Each character has multiple print versions with rarity levels
- **Professional Card Generation**: Custom card designs with Sharp image processing
- **Visual Customization**: Dyes, frames, and aura effects for card personalization

### 🏆 PSA-Style Grading System
- **Professional Grade Scale**: 6.0-10.0 with 0.5 increments (matching real PSA standards)
- **Fair Distribution**: 7.0 most common (25%), 10.0 ultra rare (0.2%)
- **Economic Integration**: 1,000 lumens for initial grade, 500 nova gems for regrades
- **Grade Lock Protection**: Regrades can only improve or maintain current grade
- **Collection Value**: Graded cards display [8.5] ratings in collection view

### ⚔️ Strategic Battle System
- **5v5 Team Battles**: Build strategic lineups with class synergies
- **Speed-Based Turns**: Individual character initiative system
- **22 Unique Abilities**: Class-specific abilities across Tank/Damage/Support/Intel
- **Real-Time Visuals**: Auto-updating battle images with health bars and positioning
- **Smart AI**: Advanced decision-making based on battlefield conditions

### 🎯 Four Character Classes
- **Tank**: High HP/defense, protective abilities (Taunt, Shield, Fortress)
- **Damage**: High attack, offensive abilities (Critical Strike, Berserker Rage)
- **Support**: Healing focus, team abilities (Heal, Revive, Sanctuary)
- **Intel**: Speed/utility, control abilities (Weaken, Poison, Analyze)

### 💰 Multi-Currency Economy
- **Lumens**: Primary currency for card drops and grading
- **Nova Gems**: Premium currency for regrades and special items
- **Mythic Shards**: Rare currency for exclusive features
- **Balanced Economy**: Prevents inflation while rewarding active play

### 🎮 Interactive Gameplay
- **Mission System**: Universe-based storylines (Naruto, One Piece, Attack on Titan)
- **Training System**: AFK progression for card leveling
- **Fishing Minigame**: Interactive cursor-based treasure hunting
- **Casino Games**: Slots, wheel of fortune with luck mechanics
- **Pet Shop**: Companion system with battle effects

## Technical Architecture

### Backend Stack
- **Node.js + Discord.js v14**: Real-time Discord integration
- **MongoDB + Mongoose**: Persistent data storage
- **Sharp + Canvas**: Professional image processing (11x faster than basic systems)
- **AniList GraphQL API**: Authentic character data sourcing

### Image Processing Excellence
- **Industry Standard**: Same stack as professional bots (Sofi, Mudae)
- **Custom Fonts**: Bubblegum and To Japan fonts for authentic card aesthetics
- **Dynamic Generation**: Real-time card creation with customization layers
- **Battle Visuals**: 3v3 arena displays with Discord-optimized sizing

### Database Design
- **Scalable Architecture**: Modular collections for players, cards, battles
- **Character Caching**: 5,100 characters cached for instant access
- **Version Tracking**: Print number system prevents duplicates
- **Battle Sessions**: Real-time state management for active battles

## Advanced Features

### Visual Polish
- **Professional Discord Embeds**: Color-coded class systems, health visualizers
- **Custom Emoji Integration**: Enhanced visual appeal with fallback systems
- **Battle Arena Backgrounds**: Universe-themed combat environments
- **Health Bar Innovation**: Rectangle-based HP display for clarity

### Interactive Systems
- **Button-Based Navigation**: Intuitive interfaces replacing text commands
- **Modal Forms**: Clean card management through Discord modals
- **Real-Time Updates**: Battle progression every 3 seconds with visual feedback
- **Pagination Systems**: Smooth collection browsing with working Next/Previous

### Quality Assurance
- **Comprehensive Error Handling**: Graceful failures with user feedback
- **Debug Logging**: Professional monitoring with emoji indicators
- **Performance Optimization**: Efficient character selection and image processing
- **Battle Balance**: Turn limits prevent infinite battles, strategic depth maintained

## User Experience

### Simplified Commands
- `/drop` - Get new character cards
- `/collection` - Browse your cards with pagination
- `/grade` - Professional card grading system
- `/battle` - Start strategic 5v5 battles
- `/lineup` - Build your battle team
- `/customize` - Personalize card appearance

### Social Features
- **Server Integration**: Multi-user battles and trading potential
- **Leaderboards**: Planned ranking systems
- **Guild Features**: Team-based competition framework

## Development Highlights

### Performance Achievements
- **5,100 Characters**: Successfully loaded and cached entire AniList database
- **Sub-Second Loading**: Instant character access on bot restart
- **11x Speed Improvement**: Professional image processing vs basic Canvas
- **Zero Downtime**: Robust error handling prevents crashes

### Code Quality
- **Modular Architecture**: 25+ specialized modules for maintainability
- **Professional Standards**: Industry-grade error handling and logging
- **Scalable Design**: Architecture supports horizontal scaling
- **Clean Interfaces**: Simplified user interactions with powerful backend

## Future Roadmap

### 10-Element Battle System (Next Phase)
- **Element Types**: Fire, Water, Earth, Air, Lightning, Ice, Light, Dark, Nature, Psychic
- **Strength/Weakness Matrix**: Strategic element matchups
- **Elemental Abilities**: 50+ element-specific moves
- **Visual Indicators**: Color-coded elements in battle interface

### Enhanced Features
- **Trading System**: Player-to-player card exchanges
- **Tournament Mode**: Bracket-style competitions
- **Guild Battles**: Team vs team warfare
- **Achievement System**: Milestone rewards and progression

## Technical Requirements

### Setup Dependencies
- Node.js runtime environment
- MongoDB database connection
- Discord bot token and permissions
- Custom font files (included)

### Optional Integrations
- AniList API access for character updates
- Custom emoji server permissions
- MongoDB Atlas for cloud deployment

## Summary
OniBot represents a fusion of modern Discord bot development with sophisticated gaming mechanics. Its professional image processing, strategic battle system, and authentic anime character database create an engaging experience that rivals commercial card games while maintaining the accessibility and social features that make Discord bots special.

The bot successfully balances complexity with usability, offering deep strategic gameplay for experienced users while remaining approachable for newcomers through intuitive interfaces and comprehensive visual feedback.