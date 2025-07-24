import requests
import json
import time
import random
from bs4 import BeautifulSoup
import re

class MudaeCharacterScraper:
    def __init__(self):
        self.base_url = "https://mudae.net"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.characters_cache = []
    
    def scrape_mudae_search(self, limit=10000):
        """Scrape characters from Mudae's official search page"""
        characters = []
        
        # Categories to scrape from
        categories = ['anime', 'manga', 'games', 'all']
        
        for category in categories:
            print(f"Scraping {category} characters...")
            try:
                # Get the search page for this category
                url = f"{self.base_url}/search?type=character&lastUpdate=true#{category}"
                response = self.session.get(url)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Find character table rows
                    rows = soup.find_all('tr')
                    
                    for row in rows:
                        try:
                            # Extract character data from table row
                            img_element = row.find('img')
                            name_link = row.find('a', href=lambda x: x and '/character/' in x)
                            series_link = row.find('a', href=lambda x: x and '/series/' in x)
                            
                            if img_element and name_link and series_link:
                                character_data = {
                                    'name': name_link.get_text().strip().replace(' 🆕', ''),
                                    'series': series_link.get_text().strip(),
                                    'imageUrl': img_element.get('src'),
                                    'type': category,
                                    'character_id': name_link.get('href').split('/')[-2] if name_link.get('href') else None
                                }
                                
                                # Clean up the image URL
                                if character_data['imageUrl'] and not character_data['imageUrl'].startswith('http'):
                                    character_data['imageUrl'] = f"{self.base_url}{character_data['imageUrl']}"
                                
                                characters.append(character_data)
                                
                                if len(characters) >= limit:
                                    break
                        except Exception as e:
                            continue
                    
                    if len(characters) >= limit:
                        break
                        
            except Exception as e:
                print(f"Error scraping {category}: {e}")
                continue
        
        return characters[:limit]
    
    def get_cached_characters(self):
        """Get pre-cached popular characters for instant loading"""
        return [
            {"name": "Nezuko Kamado", "series": "Demon Slayer", "imageUrl": "https://mudae.net/uploads/thumbnails/nezuko.png", "type": "anime"},
            {"name": "Goku", "series": "Dragon Ball", "imageUrl": "https://mudae.net/uploads/thumbnails/goku.png", "type": "anime"},
            {"name": "Naruto Uzumaki", "series": "Naruto", "imageUrl": "https://mudae.net/uploads/thumbnails/naruto.png", "type": "anime"},
            {"name": "Luffy", "series": "One Piece", "imageUrl": "https://mudae.net/uploads/thumbnails/luffy.png", "type": "anime"},
            {"name": "Rem", "series": "Re:Zero", "imageUrl": "https://mudae.net/uploads/thumbnails/rem.png", "type": "anime"},
            {"name": "Zenitsu Agatsuma", "series": "Demon Slayer", "imageUrl": "https://mudae.net/uploads/thumbnails/zenitsu.png", "type": "anime"},
            {"name": "Tanjiro Kamado", "series": "Demon Slayer", "imageUrl": "https://mudae.net/uploads/thumbnails/tanjiro.png", "type": "anime"},
            {"name": "Inosuke Hashibira", "series": "Demon Slayer", "imageUrl": "https://mudae.net/uploads/thumbnails/inosuke.png", "type": "anime"},
            {"name": "Sasuke Uchiha", "series": "Naruto", "imageUrl": "https://mudae.net/uploads/thumbnails/sasuke.png", "type": "anime"},
            {"name": "Sakura Haruno", "series": "Naruto", "imageUrl": "https://mudae.net/uploads/thumbnails/sakura.png", "type": "anime"},
            {"name": "Vegeta", "series": "Dragon Ball", "imageUrl": "https://mudae.net/uploads/thumbnails/vegeta.png", "type": "anime"},
            {"name": "Piccolo", "series": "Dragon Ball", "imageUrl": "https://mudae.net/uploads/thumbnails/piccolo.png", "type": "anime"},
            {"name": "Zoro", "series": "One Piece", "imageUrl": "https://mudae.net/uploads/thumbnails/zoro.png", "type": "anime"},
            {"name": "Nami", "series": "One Piece", "imageUrl": "https://mudae.net/uploads/thumbnails/nami.png", "type": "anime"},
            {"name": "Sanji", "series": "One Piece", "imageUrl": "https://mudae.net/uploads/thumbnails/sanji.png", "type": "anime"},
            {"name": "Emilia", "series": "Re:Zero", "imageUrl": "https://mudae.net/uploads/thumbnails/emilia.png", "type": "anime"},
            {"name": "Ram", "series": "Re:Zero", "imageUrl": "https://mudae.net/uploads/thumbnails/ram.png", "type": "anime"},
            {"name": "Subaru Natsuki", "series": "Re:Zero", "imageUrl": "https://mudae.net/uploads/thumbnails/subaru.png", "type": "anime"},
            {"name": "Megumin", "series": "KonoSuba", "imageUrl": "https://mudae.net/uploads/thumbnails/megumin.png", "type": "anime"},
            {"name": "Aqua", "series": "KonoSuba", "imageUrl": "https://mudae.net/uploads/thumbnails/aqua.png", "type": "anime"}
        ]
    
    def get_fast_characters(self, limit=1000):
        """Get characters quickly - use cached first, then scrape if needed"""
        characters = self.get_cached_characters()
        
        # If we need more characters, scrape from Mudae
        if len(characters) < limit:
            try:
                scraped_chars = self.scrape_mudae_search(limit - len(characters))
                characters.extend(scraped_chars)
            except Exception as e:
                print(f"Error scraping additional characters: {e}")
        
        return characters[:limit]

if __name__ == "__main__":
    scraper = MudaeCharacterScraper()
    characters = scraper.get_mudae_characters(100)
    print(f"Found {len(characters)} characters")
    for char in characters[:5]:  # Print first 5
        print(f"- {char.get('name', 'Unknown')} from {char.get('series', 'Unknown Series')}")