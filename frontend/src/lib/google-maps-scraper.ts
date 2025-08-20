import { chromium } from "playwright";

export async function scrape_companies(search_for: string, total = 20) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const places = [];

  try {
    // Go to Google Maps
    await page.goto("https://www.google.com/maps", { timeout: 60000 });

    // Fill search box and submit
    await page.fill('input[id="searchboxinput"]', search_for);
    await page.keyboard.press("Enter");

    // Wait for search results
    await page.waitForSelector('a[href*="/maps/place"]');

    let previously_counted = 0;
    while (places.length < total) {
      // Scroll down to load more results
      await page.evaluate(() => window.scrollBy(0, 10000));
      await page.waitForTimeout(1000);

      const listings = await page.$$('a[href*="/maps/place"]');
      if (listings.length === previously_counted) break; // no more new results
      previously_counted = listings.length;
    }

    const listings = await page.$$('a[href*="/maps/place"]');
    for (let i = 0; i < Math.min(total, listings.length); i++) {
      const listing = listings[i];

      try {
        await listing.click();
        await page.waitForSelector("h1", { timeout: 10000 });
        await page.waitForTimeout(1000); // wait for details to load

        const place = {
          name: "",
          address: "",
          website: "",
          phone_number: "",
          place_id: "",
          reviews_count: null as number | null,
          reviews_average: null as number | null,
          store_shopping: "No",
          in_store_pickup: "No", 
          store_delivery: "No",
          place_type: "",
          opens_at: "",
          introduction: ""
        };

        // Extract basic info
        place.name = await page.$eval("h1", (el) => (el as HTMLElement).innerText).catch(() => "");
        
        place.address = await page
          .$eval('button[data-item-id="address"] div', (el) => (el as HTMLElement).innerText)
          .catch(() => "");
          
        place.website = await page
          .$eval('a[data-item-id="authority"] div', (el) => (el as HTMLElement).innerText)
          .catch(() => "");
          
        place.phone_number = await page
          .$eval('button[data-item-id*="phone"] div', (el) => (el as HTMLElement).innerText)
          .catch(() => "");
          
        place.place_id = page.url().split("/").pop() || "";

        // Extract reviews info
        try {
          const reviewsText = await page.$eval('[data-value="Reviews"] span', (el) => (el as HTMLElement).innerText);
          const reviewsMatch = reviewsText.match(/([\d,]+)\s*reviews?/i);
          if (reviewsMatch) {
            place.reviews_count = parseInt(reviewsMatch[1].replace(/,/g, ''));
          }
        } catch (e) {
          // Reviews count not found
        }

        try {
          const ratingText = await page.$eval('[data-value="Reviews"] span', (el) => el.parentElement?.textContent);
          const ratingMatch = ratingText?.match(/([\d.]+)\s*stars?/i);
          if (ratingMatch) {
            place.reviews_average = parseFloat(ratingMatch[1]);
          }
        } catch (e) {
          // Rating not found
        }

        // Extract business type/category
        try {
          place.place_type = await page.$eval('[data-value="Category"] .Io6YTe', (el) => el.textContent || "");
        } catch (e) {
          // Category not found
        }

        // Extract opening hours
        try {
          place.opens_at = await page.$eval('[data-value="Open hours"] .ZDu9vd span', (el) => el.textContent || "");
        } catch (e) {
          // Hours not found
        }

        // Extract services (delivery, pickup, etc.)
        try {
          const servicesElements = await page.$$('[data-value*="service"] .Io6YTe');
          for (const serviceEl of servicesElements) {
            const serviceText = await serviceEl.textContent();
            if (serviceText) {
              if (serviceText.toLowerCase().includes('delivery')) {
                place.store_delivery = "Yes";
              }
              if (serviceText.toLowerCase().includes('pickup')) {
                place.in_store_pickup = "Yes";
              }
              if (serviceText.toLowerCase().includes('shopping')) {
                place.store_shopping = "Yes";
              }
            }
          }
        } catch (e) {
          // Services not found
        }

        // Extract description/about section
        try {
          place.introduction = await page.$eval('[data-value="About"] .PYvSYb', (el) => el.textContent || "");
        } catch (e) {
          // Description not found
        }

        places.push(place);

        console.log("Extracted Places:", places);
      } catch (e) {
        console.warn(`Failed to extract listing ${i + 1}:`, e);
      }
    }
  } finally {
    await browser.close();
  }

  return places;
}
