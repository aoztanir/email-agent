import logging
from typing import List, Optional, Dict, Any
from playwright.async_api import async_playwright, Page
from dataclasses import dataclass, asdict
import platform
import asyncio

@dataclass
class Place:
    name: str = ""
    address: str = ""
    website: str = ""
    phone_number: str = ""
    reviews_count: Optional[int] = None
    reviews_average: Optional[float] = None
    store_shopping: str = "No"
    in_store_pickup: str = "No"
    store_delivery: str = "No"
    place_type: str = ""
    opens_at: str = ""
    introduction: str = ""
    place_id: str = ""

class GoogleMapsScraper:
    def __init__(self):
        self.setup_logging()

    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
        )

    def extract_place_id_from_url(self, url: str) -> str:
        """Extract place_id from Google Maps URL"""
        try:
            # Google Maps URLs contain place IDs in various formats
            # Example: /place/Name/@lat,lng,zoom/data=!3m1!4b1!4m6!3m5!1s[PLACE_ID]
            import re
            
            # Look for place ID pattern in URL
            place_id_match = re.search(r'1s([A-Za-z0-9_-]+)', url)
            if place_id_match:
                return place_id_match.group(1)
            
            # Fallback: extract from /place/ path
            place_match = re.search(r'/place/([^/@]+)', url)
            if place_match:
                return place_match.group(1).replace('+', '_')
                
            # Last resort: use a portion of the URL as identifier
            return url.split('/')[-1] if '/' in url else url
            
        except Exception as e:
            logging.warning(f"Failed to extract place_id from URL {url}: {e}")
            return f"unknown_{hash(url) % 1000000}"

    async def extract_text(self, page: Page, xpath: str) -> str:
        try:
            if await page.locator(xpath).count() > 0:
                return await page.locator(xpath).inner_text()
        except Exception as e:
            logging.warning(f"Failed to extract text for xpath {xpath}: {e}")
        return ""

    async def extract_place(self, page: Page) -> Place:
        # XPaths
        name_xpath = '//div[@class="TIHn2 "]//h1[@class="DUwDvf lfPIob"]'
        address_xpath = '//button[@data-item-id="address"]//div[contains(@class, "fontBodyMedium")]'
        website_xpath = '//a[@data-item-id="authority"]//div[contains(@class, "fontBodyMedium")]'
        phone_number_xpath = '//button[contains(@data-item-id, "phone:tel:")]//div[contains(@class, "fontBodyMedium")]'
        reviews_count_xpath = '//div[@class="TIHn2 "]//div[@class="fontBodyMedium dmRWX"]//div//span//span//span[@aria-label]'
        reviews_average_xpath = '//div[@class="TIHn2 "]//div[@class="fontBodyMedium dmRWX"]//div//span[@aria-hidden]'
        info1 = '//div[@class="LTs0Rc"][1]'
        info2 = '//div[@class="LTs0Rc"][2]'
        info3 = '//div[@class="LTs0Rc"][3]'
        opens_at_xpath = '//button[contains(@data-item-id, "oh")]//div[contains(@class, "fontBodyMedium")]'
        opens_at_xpath2 = '//div[@class="MkV9"]//span[@class="ZDu9vd"]//span[2]'
        place_type_xpath = '//div[@class="LBgpqf"]//button[@class="DkEaL "]'
        intro_xpath = '//div[@class="WeS02d fontBodyMedium"]//div[@class="PYvSYb "]'

        place = Place()
        place.name = await self.extract_text(page, name_xpath)
        place.address = await self.extract_text(page, address_xpath)
        place.website = await self.extract_text(page, website_xpath)
        place.phone_number = await self.extract_text(page, phone_number_xpath)
        place.place_type = await self.extract_text(page, place_type_xpath)
        place.introduction = await self.extract_text(page, intro_xpath) or "None Found"

        # Reviews Count
        reviews_count_raw = await self.extract_text(page, reviews_count_xpath)
        if reviews_count_raw:
            try:
                temp = reviews_count_raw.replace('\xa0', '').replace('(','').replace(')','').replace(',','')
                place.reviews_count = int(temp)
            except Exception as e:
                logging.warning(f"Failed to parse reviews count: {e}")
        
        # Reviews Average
        reviews_avg_raw = await self.extract_text(page, reviews_average_xpath)
        if reviews_avg_raw:
            try:
                temp = reviews_avg_raw.replace(' ','').replace(',','.')
                place.reviews_average = float(temp)
            except Exception as e:
                logging.warning(f"Failed to parse reviews average: {e}")
        
        # Store Info
        for idx, info_xpath in enumerate([info1, info2, info3]):
            info_raw = await self.extract_text(page, info_xpath)
            if info_raw:
                temp = info_raw.split('·')
                if len(temp) > 1:
                    check = temp[1].replace("\n", "").lower()
                    if 'shop' in check:
                        place.store_shopping = "Yes"
                    if 'pickup' in check:
                        place.in_store_pickup = "Yes"
                    if 'delivery' in check:
                        place.store_delivery = "Yes"
        
        # Opens At
        opens_at_raw = await self.extract_text(page, opens_at_xpath)
        if opens_at_raw:
            opens = opens_at_raw.split('⋅')
            if len(opens) > 1:
                place.opens_at = opens[1].replace("\u202f","")
            else:
                place.opens_at = opens_at_raw.replace("\u202f","")
        else:
            opens_at2_raw = await self.extract_text(page, opens_at_xpath2)
            if opens_at2_raw:
                opens = opens_at2_raw.split('⋅')
                if len(opens) > 1:
                    place.opens_at = opens[1].replace("\u202f","")
                else:
                    place.opens_at = opens_at2_raw.replace("\u202f","")
        
        return place

    async def scrape_places(self, search_for: str, total: int = 20) -> List[Dict[str, Any]]:
        """Scrape Google Maps places and return as list of dictionaries"""
        places: List[Place] = []
        
        async with async_playwright() as p:
            if platform.system() == "Windows":
                browser_path = r"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
                browser = await p.chromium.launch(executable_path=browser_path, headless=True)
            else:
                browser = await p.chromium.launch(headless=True)
            
            page = await browser.new_page()
            
            try:
                await page.goto("https://www.google.com/maps/@32.9817464,70.1930781,3.67z?", timeout=60000)
                await page.wait_for_timeout(1000)
                await page.locator('//input[@id="searchboxinput"]').fill(search_for)
                await page.keyboard.press("Enter")
                await page.wait_for_selector('//a[contains(@href, "https://www.google.com/maps/place")]')
                await page.hover('//a[contains(@href, "https://www.google.com/maps/place")]')
                
                previously_counted = 0
                while True:
                    await page.mouse.wheel(0, 10000)
                    await page.wait_for_selector('//a[contains(@href, "https://www.google.com/maps/place")]')
                    found = await page.locator('//a[contains(@href, "https://www.google.com/maps/place")]').count()
                    logging.info(f"Currently Found: {found}")
                    
                    if found >= total:
                        break
                    if found == previously_counted:
                        logging.info("Arrived at all available")
                        break
                    previously_counted = found
                
                listings = await page.locator('//a[contains(@href, "https://www.google.com/maps/place")]').all()
                listings = listings[:total]
                listings = [listing.locator("xpath=..") for listing in listings]
                logging.info(f"Total Found: {len(listings)}")
                
                for idx, listing in enumerate(listings):
                    try:
                        await listing.click()
                        await page.wait_for_selector('//div[@class="TIHn2 "]//h1[@class="DUwDvf lfPIob"]', timeout=10000)
                        await asyncio.sleep(1.5)  # Give time for details to load
                        
                        # Extract place_id from URL
                        current_url = page.url
                        place_id = self.extract_place_id_from_url(current_url)
                        
                        place = await self.extract_place(page)
                        place.place_id = place_id
                        
                        if place.name:
                            places.append(place)
                        else:
                            logging.warning(f"No name found for listing {idx+1}, skipping.")
                    except Exception as e:
                        logging.warning(f"Failed to extract listing {idx+1}: {e}")
                        
            finally:
                await browser.close()
        
        # Convert to dictionaries for JSON serialization
        return [asdict(place) for place in places]