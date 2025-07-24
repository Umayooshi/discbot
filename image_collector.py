#!/usr/bin/env python3
"""
Advanced Image Collector for Character Card System
Collects multiple images per character from various sources
Supports 3 rarity tiers: Static, 3D, Animated
"""

import requests
import json
import os
import time
import hashlib
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from urllib.parse import urljoin, urlparse
import re

class ImageCollector:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Setup directories
        self.base_dir = Path("collected_images")
        self.character_db_path = self.base_dir / "character_database.json"
        self.base_dir.mkdir(exist_ok=True)
        
        # Load existing database
        self.character_db = self.load_database()
        
        # Image validation settings
        self.min_size = 100  # Minimum image dimension
        self.max_file_size = 15 * 1024 * 1024  # 15MB max
        
    def load_database(self) -> Dict:
        """Load existing character database"""
        if self.character_db_path.exists():
            with open(self.character_db_path, 'r') as f:
                return json.load(f)
        return {}
    
    def save_database(self):
        """Save character database"""
        with open(self.character_db_path, 'w') as f:
            json.dump(self.character_db, f, indent=2)
    
    def get_waifu_pics_images(self, character_name: str, series: str) -> List[Dict]:
        """Get images from waifu.pics API"""
        images = []
        
        try:
            # waifu.pics has SFW anime images
            endpoints = [
                'https://api.waifu.pics/sfw/waifu',
                'https://api.waifu.pics/sfw/neko',
                'https://api.waifu.pics/sfw/shinobu',
                'https://api.waifu.pics/sfw/megumin'
            ]
            
            for endpoint in endpoints:
                for _ in range(5):  # Get 5 images from each endpoint
                    try:
                        response = self.session.get(endpoint, timeout=10)
                        if response.status_code == 200:
                            data = response.json()
                            if 'url' in data:
                                images.append({
                                    'url': data['url'],
                                    'tier': 'static',
                                    'source': 'waifu.pics',
                                    'quality_score': 6,
                                    'validated': False
                                })
                        time.sleep(0.2)  # Rate limiting
                    except:
                        continue
                        
        except Exception as e:
            print(f"Error with waifu.pics: {e}")
        
        return images
    
    def get_nekos_api_images(self, character_name: str, series: str) -> List[Dict]:
        """Get images from nekos.life API"""
        images = []
        
        try:
            # nekos.life endpoints
            endpoints = [
                'https://nekos.life/api/v2/img/neko',
                'https://nekos.life/api/v2/img/waifu',
                'https://nekos.life/api/v2/img/kemonomimi'
            ]
            
            for endpoint in endpoints:
                for _ in range(3):  # Get 3 from each
                    try:
                        response = self.session.get(endpoint, timeout=10)
                        if response.status_code == 200:
                            data = response.json()
                            if 'url' in data:
                                images.append({
                                    'url': data['url'],
                                    'tier': 'static',
                                    'source': 'nekos.life',
                                    'quality_score': 5,
                                    'validated': False
                                })
                        time.sleep(0.3)
                    except:
                        continue
                        
        except Exception as e:
            print(f"Error with nekos.life: {e}")
        
        return images
    
    def get_waifu_im_images(self, character_name: str, series: str) -> List[Dict]:
        """Get images from waifu.im API"""
        images = []
        
        try:
            # waifu.im has high quality images
            url = "https://api.waifu.im/search"
            
            # Different tags to try
            tag_combinations = [
                ['waifu'],
                ['maid'],
                ['uniform'],
                ['selfies'],
                ['ero']
            ]
            
            for tags in tag_combinations:
                try:
                    params = {
                        'included_tags': tags,
                        'is_nsfw': 'false',
                        'many': 'true',
                        'limit': 10
                    }
                    
                    response = self.session.get(url, params=params, timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        if 'images' in data:
                            for img in data['images']:
                                images.append({
                                    'url': img['url'],
                                    'tier': 'static',
                                    'source': 'waifu.im',
                                    'quality_score': 7,
                                    'validated': False,
                                    'tags': img.get('tags', [])
                                })
                    time.sleep(0.5)
                except:
                    continue
                    
        except Exception as e:
            print(f"Error with waifu.im: {e}")
        
        return images
    
    def get_reddit_images(self, character_name: str, series: str) -> List[Dict]:
        """Get images from Reddit using pushshift"""
        images = []
        
        try:
            # Search relevant subreddits
            subreddits = [
                'AnimePics',
                'awwnime',
                'Animewallpaper',
                'AnimeART',
                'Moescape'
            ]
            
            search_terms = [
                character_name,
                series,
                f"{character_name} {series}"
            ]
            
            for subreddit in subreddits:
                for search_term in search_terms:
                    try:
                        # Using pushshift API
                        url = f"https://api.pushshift.io/reddit/search/submission/"
                        params = {
                            'subreddit': subreddit,
                            'q': search_term,
                            'sort': 'score',
                            'sort_type': 'desc',
                            'size': 10,
                            'fields': 'url,title,score'
                        }
                        
                        response = self.session.get(url, params=params, timeout=10)
                        if response.status_code == 200:
                            data = response.json()
                            if 'data' in data:
                                for post in data['data']:
                                    post_url = post.get('url', '')
                                    if any(ext in post_url.lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                                        
                                        tier = 'animated' if post_url.lower().endswith('.gif') else 'static'
                                        
                                        images.append({
                                            'url': post_url,
                                            'tier': tier,
                                            'source': f'reddit/{subreddit}',
                                            'quality_score': min(10, int(post.get('score', 0) / 100) + 4),
                                            'validated': False,
                                            'title': post.get('title', '')
                                        })
                        time.sleep(0.5)
                    except:
                        continue
                        
        except Exception as e:
            print(f"Error with Reddit: {e}")
        
        return images
    
    def get_danbooru_images(self, character_name: str, series: str) -> List[Dict]:
        """Get images from Danbooru (SFW only)"""
        images = []
        
        try:
            # Danbooru API
            base_url = "https://danbooru.donmai.us/posts.json"
            
            # Create search tags
            char_tag = character_name.lower().replace(' ', '_')
            series_tag = series.lower().replace(' ', '_')
            
            search_combinations = [
                f"{char_tag} {series_tag}",
                char_tag,
                series_tag
            ]
            
            for search_tags in search_combinations:
                try:
                    params = {
                        'tags': f"{search_tags} rating:safe",
                        'limit': 20,
                        'random': 'true'
                    }
                    
                    response = self.session.get(base_url, params=params, timeout=10)
                    if response.status_code == 200:
                        posts = response.json()
                        
                        for post in posts:
                            if 'file_url' in post and post['file_url']:
                                file_url = post['file_url']
                                
                                # Determine tier based on file type
                                tier = 'static'
                                if file_url.lower().endswith('.gif'):
                                    tier = 'animated'
                                elif any(keyword in post.get('tag_string', '').lower() 
                                        for keyword in ['3d', 'render', 'cg']):
                                    tier = '3d'
                                
                                images.append({
                                    'url': file_url,
                                    'tier': tier,
                                    'source': 'danbooru',
                                    'quality_score': min(10, int(post.get('score', 0) / 10) + 5),
                                    'validated': False,
                                    'tags': post.get('tag_string', '').split()
                                })
                    
                    time.sleep(1)  # Danbooru rate limiting
                except:
                    continue
                    
        except Exception as e:
            print(f"Error with Danbooru: {e}")
        
        return images
    
    def validate_image_url(self, url: str) -> Tuple[bool, Dict]:
        """Validate if image URL is accessible and meets quality standards"""
        try:
            # HEAD request to check without downloading
            response = self.session.head(url, timeout=10)
            
            if response.status_code != 200:
                return False, {'error': f'HTTP {response.status_code}'}
            
            # Check content type
            content_type = response.headers.get('content-type', '').lower()
            if not any(img_type in content_type for img_type in ['image/', 'gif']):
                return False, {'error': 'Invalid content type'}
            
            # Check file size
            content_length = response.headers.get('content-length')
            if content_length:
                size = int(content_length)
                if size > self.max_file_size:
                    return False, {'error': 'File too large'}
                if size < 1000:  # Less than 1KB probably broken
                    return False, {'error': 'File too small'}
            
            return True, {
                'content_type': content_type,
                'size': content_length,
                'status': 'valid'
            }
            
        except Exception as e:
            return False, {'error': str(e)}
    
    def collect_character_images(self, character_name: str, series: str) -> Dict:
        """Collect images for a character from all sources"""
        
        print(f"Collecting images for: {character_name} from {series}")
        
        all_images = []
        
        # Collect from all sources
        collectors = [
            self.get_waifu_pics_images,
            self.get_nekos_api_images,
            self.get_waifu_im_images,
            self.get_reddit_images,
            self.get_danbooru_images
        ]
        
        for collector in collectors:
            try:
                print(f"  Trying {collector.__name__}...")
                source_images = collector(character_name, series)
                all_images.extend(source_images)
                print(f"    Found {len(source_images)} images")
                time.sleep(1)  # Rate limiting between sources
            except Exception as e:
                print(f"    Error: {e}")
                continue
        
        # Remove duplicates
        unique_images = {}
        for img in all_images:
            url_hash = hashlib.md5(img['url'].encode()).hexdigest()
            if url_hash not in unique_images:
                unique_images[url_hash] = img
        
        # Validate images
        validated_images = []
        print(f"  Validating {len(unique_images)} unique images...")
        
        for img_data in unique_images.values():
            is_valid, validation_info = self.validate_image_url(img_data['url'])
            if is_valid:
                img_data['validation'] = validation_info
                img_data['validated'] = True
                validated_images.append(img_data)
            else:
                print(f"    Invalid: {validation_info.get('error', 'Unknown error')}")
        
        # Sort by quality score
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
        
        # Limit to 250 per tier (for versioning system)
        for tier in organized_images:
            organized_images[tier] = organized_images[tier][:250]
        
        # Create character entry
        character_data = {
            'name': character_name,
            'series': series,
            'images': organized_images,
            'total_images': len(validated_images),
            'versions': {
                'static': len(organized_images['static']),
                '3d': len(organized_images['3d']),
                'animated': len(organized_images['animated'])
            },
            'last_updated': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        # Save to database
        char_key = f"{character_name}_{series}".replace(' ', '_').lower()
        self.character_db[char_key] = character_data
        self.save_database()
        
        print(f"✓ Collected {len(validated_images)} valid images")
        print(f"  - Static: {len(organized_images['static'])}")
        print(f"  - 3D: {len(organized_images['3d'])}")
        print(f"  - Animated: {len(organized_images['animated'])}")
        
        return character_data
    
    def batch_collect(self, character_list: List[Tuple[str, str]]) -> Dict:
        """Batch collect images for multiple characters"""
        results = {}
        
        for i, (char_name, series) in enumerate(character_list):
            print(f"\n[{i+1}/{len(character_list)}] Processing: {char_name}")
            
            try:
                char_data = self.collect_character_images(char_name, series)
                results[char_name] = char_data
                
                # Delay between characters
                time.sleep(2)
                
            except Exception as e:
                print(f"Error processing {char_name}: {e}")
                results[char_name] = {'error': str(e)}
        
        return results
    
    def get_character_images_for_cards(self, character_name: str, series: str, tier: str = 'static') -> List[str]:
        """Get image URLs for card generation"""
        char_key = f"{character_name}_{series}".replace(' ', '_').lower()
        
        if char_key in self.character_db:
            char_data = self.character_db[char_key]
            tier_images = char_data.get('images', {}).get(tier, [])
            return [img['url'] for img in tier_images]
        
        return []

# Test the collector
if __name__ == "__main__":
    collector = ImageCollector()
    
    # Test with a few characters
    test_chars = [
        ("Nezuko Kamado", "Demon Slayer"),
        ("Zero Two", "Darling in the FranXX"),
        ("Rem", "Re:Zero"),
    ]
    
    print("Starting image collection...")
    results = collector.batch_collect(test_chars)
    
    print("\n=== COLLECTION COMPLETE ===")
    for char_name, result in results.items():
        if 'error' in result:
            print(f"❌ {char_name}: {result['error']}")
        else:
            print(f"✅ {char_name}: {result['total_images']} images")
            print(f"   Static: {result['versions']['static']}")
            print(f"   3D: {result['versions']['3d']}")
            print(f"   Animated: {result['versions']['animated']}")