#!/usr/bin/env python3
"""
Advanced Multi-Source Character Image Scraper
Scrapes character images from multiple sources for card collection system
Supports Static, 3D, and Animated tiers with versioning system
"""

import requests
import json
import os
import time
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import trafilatura
import re
from typing import List, Dict, Optional, Tuple
import hashlib
from pathlib import Path

class AdvancedCharacterScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        
        # Image storage directories
        self.base_dir = Path("character_images")
        self.static_dir = self.base_dir / "static"
        self.animated_dir = self.base_dir / "animated" 
        self.threed_dir = self.base_dir / "3d"
        
        # Create directories
        for dir_path in [self.static_dir, self.animated_dir, self.threed_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
            
        # Character database
        self.character_db = {}
        self.load_character_db()
        
        # Image quality filters
        self.min_image_size = (150, 150)  # Minimum resolution
        self.max_file_size = 10 * 1024 * 1024  # 10MB max
        self.valid_static_formats = ['.jpg', '.jpeg', '.png', '.webp']
        self.valid_animated_formats = ['.gif', '.webp']
        
    def load_character_db(self):
        """Load existing character database"""
        db_path = self.base_dir / "character_database.json"
        if db_path.exists():
            with open(db_path, 'r', encoding='utf-8') as f:
                self.character_db = json.load(f)
        else:
            self.character_db = {}
    
    def save_character_db(self):
        """Save character database to file"""
        db_path = self.base_dir / "character_database.json"
        with open(db_path, 'w', encoding='utf-8') as f:
            json.dump(self.character_db, f, indent=2, ensure_ascii=False)
    
    def scrape_mudae_character_images(self, character_name: str, series: str) -> List[Dict]:
        """
        Scrape character images from Mudae website
        Returns list of image data with URLs, types, and metadata
        """
        images = []
        
        # Try multiple Mudae search strategies
        search_terms = [
            f"{character_name} {series}",
            character_name,
            f"{character_name.replace(' ', '_')}",
        ]
        
        for search_term in search_terms:
            try:
                # Search Mudae character database
                search_url = f"https://mudae.net/characters/search"
                search_params = {
                    'query': search_term,
                    'type': 'character'
                }
                
                response = self.session.get(search_url, params=search_params, timeout=10)
                if response.status_code == 200:
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # Find character page links
                    character_links = soup.find_all('a', href=re.compile(r'/characters/\d+'))
                    
                    for link in character_links[:3]:  # Check first 3 results
                        char_url = urljoin("https://mudae.net", link['href'])
                        char_images = self.scrape_mudae_character_page(char_url)
                        images.extend(char_images)
                        
                        if len(images) >= 10:  # Limit per source
                            break
                
                if images:
                    break  # Found images, stop trying other search terms
                    
            except Exception as e:
                print(f"Error searching Mudae for {character_name}: {e}")
                continue
        
        return images
    
    def scrape_mudae_character_page(self, char_url: str) -> List[Dict]:
        """Scrape images from individual Mudae character page"""
        images = []
        
        try:
            response = self.session.get(char_url, timeout=10)
            if response.status_code != 200:
                return images
                
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find image elements
            img_elements = soup.find_all('img', src=True)
            
            for img in img_elements:
                img_url = img['src']
                
                # Convert relative URLs to absolute
                if img_url.startswith('/'):
                    img_url = urljoin("https://mudae.net", img_url)
                
                # Determine image type based on URL patterns
                rarity_tier = "static"  # Default
                
                if any(keyword in img_url.lower() for keyword in ['3d', 'render', 'figure']):
                    rarity_tier = "3d"
                elif img_url.lower().endswith('.gif'):
                    rarity_tier = "animated"
                
                # Get image metadata
                img_data = {
                    'url': img_url,
                    'tier': rarity_tier,
                    'source': 'mudae',
                    'quality_score': self.calculate_quality_score(img_url),
                    'alt_text': img.get('alt', ''),
                    'page_url': char_url
                }
                
                images.append(img_data)
        
        except Exception as e:
            print(f"Error scraping Mudae page {char_url}: {e}")
        
        return images
    
    def scrape_anime_planet_images(self, character_name: str, series: str) -> List[Dict]:
        """Scrape character images from Anime-Planet"""
        images = []
        
        try:
            # Search Anime-Planet
            search_url = "https://www.anime-planet.com/characters/all"
            search_params = {
                'name': character_name,
                'include_tags': series
            }
            
            response = self.session.get(search_url, params=search_params, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Find character cards
                char_cards = soup.find_all('div', class_='character')
                
                for card in char_cards[:5]:  # First 5 results
                    img_elem = card.find('img')
                    if img_elem and img_elem.get('src'):
                        img_url = img_elem['src']
                        
                        if img_url.startswith('//'):
                            img_url = 'https:' + img_url
                        elif img_url.startswith('/'):
                            img_url = 'https://www.anime-planet.com' + img_url
                        
                        img_data = {
                            'url': img_url,
                            'tier': 'static',
                            'source': 'anime-planet',
                            'quality_score': self.calculate_quality_score(img_url),
                            'alt_text': img_elem.get('alt', ''),
                            'page_url': response.url
                        }
                        
                        images.append(img_data)
        
        except Exception as e:
            print(f"Error scraping Anime-Planet for {character_name}: {e}")
        
        return images
    
    def scrape_myanimelist_images(self, character_name: str, series: str) -> List[Dict]:
        """Scrape character images from MyAnimeList"""
        images = []
        
        try:
            # Search MAL characters
            search_url = "https://myanimelist.net/character.php"
            search_params = {
                'q': character_name,
                'cat': 'character'
            }
            
            response = self.session.get(search_url, params=search_params, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Find character results
                char_results = soup.find_all('td', class_='borderClass')
                
                for result in char_results[:3]:
                    img_elem = result.find('img')
                    if img_elem and img_elem.get('data-src'):
                        img_url = img_elem['data-src']
                        
                        # MAL images are high quality
                        img_data = {
                            'url': img_url,
                            'tier': 'static',
                            'source': 'myanimelist',
                            'quality_score': self.calculate_quality_score(img_url) + 2,  # Bonus for MAL quality
                            'alt_text': img_elem.get('alt', ''),
                            'page_url': response.url
                        }
                        
                        images.append(img_data)
        
        except Exception as e:
            print(f"Error scraping MyAnimeList for {character_name}: {e}")
        
        return images
    
    def scrape_zerochan_images(self, character_name: str, series: str) -> List[Dict]:
        """Scrape high-quality images from Zerochan"""
        images = []
        
        try:
            # Zerochan search
            search_url = "https://www.zerochan.net/search"
            search_params = {
                'q': f"{character_name} {series}",
                'o': 'popular'  # Sort by popularity
            }
            
            response = self.session.get(search_url, params=search_params, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Find image thumbnails
                thumb_links = soup.find_all('a', href=re.compile(r'/\d+'))
                
                for link in thumb_links[:8]:  # First 8 results
                    img_page_url = urljoin("https://www.zerochan.net", link['href'])
                    
                    # Get full image from individual page
                    img_response = self.session.get(img_page_url, timeout=10)
                    if img_response.status_code == 200:
                        img_soup = BeautifulSoup(img_response.content, 'html.parser')
                        full_img = img_soup.find('img', id='large')
                        
                        if full_img and full_img.get('src'):
                            img_url = full_img['src']
                            
                            img_data = {
                                'url': img_url,
                                'tier': 'static',
                                'source': 'zerochan',
                                'quality_score': self.calculate_quality_score(img_url) + 1,  # Bonus for Zerochan quality
                                'alt_text': full_img.get('alt', ''),
                                'page_url': img_page_url
                            }
                            
                            images.append(img_data)
        
        except Exception as e:
            print(f"Error scraping Zerochan for {character_name}: {e}")
        
        return images
    
    def scrape_tenor_gifs(self, character_name: str, series: str) -> List[Dict]:
        """Scrape animated GIFs from Tenor"""
        images = []
        
        try:
            # Tenor API search
            search_url = "https://tenor.googleapis.com/v2/search"
            search_params = {
                'q': f"{character_name} {series} anime",
                'key': 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCr0',  # Public API key
                'limit': 10,
                'media_filter': 'gif'
            }
            
            response = self.session.get(search_url, params=search_params, timeout=10)
            if response.status_code == 200:
                data = response.json()
                
                for result in data.get('results', []):
                    gif_url = result.get('media_formats', {}).get('gif', {}).get('url')
                    
                    if gif_url:
                        img_data = {
                            'url': gif_url,
                            'tier': 'animated',
                            'source': 'tenor',
                            'quality_score': self.calculate_quality_score(gif_url),
                            'alt_text': result.get('content_description', ''),
                            'page_url': result.get('itemurl', '')
                        }
                        
                        images.append(img_data)
        
        except Exception as e:
            print(f"Error scraping Tenor for {character_name}: {e}")
        
        return images
    
    def calculate_quality_score(self, img_url: str) -> int:
        """Calculate quality score based on URL patterns"""
        score = 5  # Base score
        
        url_lower = img_url.lower()
        
        # Resolution indicators
        if any(res in url_lower for res in ['1080', '720', '4k', 'uhd']):
            score += 3
        elif any(res in url_lower for res in ['480', '360']):
            score -= 1
        
        # Quality indicators
        if 'thumbnail' in url_lower or 'thumb' in url_lower:
            score -= 2
        elif 'original' in url_lower or 'full' in url_lower:
            score += 2
        
        # File format quality
        if url_lower.endswith('.png'):
            score += 1
        elif url_lower.endswith('.jpg') or url_lower.endswith('.jpeg'):
            score += 0  # Neutral
        elif url_lower.endswith('.gif'):
            score += 1  # Animated bonus
        
        return max(1, score)  # Minimum score of 1
    
    def validate_image(self, img_url: str) -> Tuple[bool, Dict]:
        """Validate image quality and accessibility"""
        try:
            response = self.session.head(img_url, timeout=5)
            
            if response.status_code != 200:
                return False, {'error': f'HTTP {response.status_code}'}
            
            # Check content type
            content_type = response.headers.get('content-type', '').lower()
            if not any(img_type in content_type for img_type in ['image/', 'gif']):
                return False, {'error': 'Invalid content type'}
            
            # Check file size
            content_length = response.headers.get('content-length')
            if content_length and int(content_length) > self.max_file_size:
                return False, {'error': 'File too large'}
            
            return True, {'content_type': content_type, 'size': content_length}
            
        except Exception as e:
            return False, {'error': str(e)}
    
    def scrape_character_complete(self, character_name: str, series: str) -> Dict:
        """
        Complete character scraping from all sources
        Returns organized data ready for card generation
        """
        print(f"Scraping character: {character_name} from {series}")
        
        all_images = []
        
        # Scrape from all sources
        sources = [
            self.scrape_mudae_character_images,
            self.scrape_anime_planet_images,
            self.scrape_myanimelist_images,
            self.scrape_zerochan_images,
            self.scrape_tenor_gifs,
        ]
        
        for scraper_func in sources:
            try:
                source_images = scraper_func(character_name, series)
                all_images.extend(source_images)
                time.sleep(0.5)  # Rate limiting
            except Exception as e:
                print(f"Error with {scraper_func.__name__}: {e}")
                continue
        
        # Remove duplicates based on URL
        unique_images = {}
        for img in all_images:
            url_hash = hashlib.md5(img['url'].encode()).hexdigest()
            if url_hash not in unique_images:
                unique_images[url_hash] = img
        
        # Validate and sort images
        validated_images = []
        for img_data in unique_images.values():
            is_valid, validation_info = self.validate_image(img_data['url'])
            if is_valid:
                img_data['validation'] = validation_info
                validated_images.append(img_data)
        
        # Sort by quality score (highest first)
        validated_images.sort(key=lambda x: x['quality_score'], reverse=True)
        
        # Organize by tier
        organized_images = {
            'static': [],
            '3d': [],
            'animated': []
        }
        
        for img in validated_images:
            tier = img['tier']
            if tier in organized_images:
                organized_images[tier].append(img)
        
        # Character data structure
        character_data = {
            'name': character_name,
            'series': series,
            'images': organized_images,
            'total_images': len(validated_images),
            'scrape_date': time.strftime('%Y-%m-%d %H:%M:%S'),
            'versions': {
                'static': min(len(organized_images['static']), 250),
                '3d': min(len(organized_images['3d']), 250),
                'animated': min(len(organized_images['animated']), 250)
            }
        }
        
        # Update character database
        char_key = f"{character_name}_{series}".replace(' ', '_').lower()
        self.character_db[char_key] = character_data
        self.save_character_db()
        
        print(f"✓ Found {len(validated_images)} images for {character_name}")
        print(f"  - Static: {len(organized_images['static'])}")
        print(f"  - 3D: {len(organized_images['3d'])}")
        print(f"  - Animated: {len(organized_images['animated'])}")
        
        return character_data
    
    def batch_scrape_characters(self, character_list: List[Tuple[str, str]]) -> Dict:
        """
        Batch scrape multiple characters
        character_list: List of (character_name, series) tuples
        """
        results = {}
        
        for i, (char_name, series) in enumerate(character_list):
            print(f"\n[{i+1}/{len(character_list)}] Processing {char_name}")
            
            try:
                char_data = self.scrape_character_complete(char_name, series)
                results[char_name] = char_data
                
                # Rate limiting between characters
                time.sleep(2)
                
            except Exception as e:
                print(f"Error processing {char_name}: {e}")
                results[char_name] = {'error': str(e)}
        
        return results

# Example usage
if __name__ == "__main__":
    scraper = AdvancedCharacterScraper()
    
    # Test with popular characters
    test_characters = [
        ("Nezuko Kamado", "Demon Slayer"),
        ("Tanjiro Kamado", "Demon Slayer"),
        ("Goku", "Dragon Ball Z"),
        ("Naruto Uzumaki", "Naruto"),
        ("Luffy", "One Piece"),
    ]
    
    print("Starting character scraping...")
    results = scraper.batch_scrape_characters(test_characters)
    
    print("\n=== SCRAPING COMPLETE ===")
    for char_name, result in results.items():
        if 'error' in result:
            print(f"❌ {char_name}: {result['error']}")
        else:
            print(f"✅ {char_name}: {result['total_images']} images")