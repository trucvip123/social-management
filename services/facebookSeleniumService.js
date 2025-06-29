const puppeteer = require('puppeteer');

async function postToFacebookGroup({ cookies, groupId, content }) {
  console.log('[Puppeteer] Launching browser...');
  
  let browser;
  let retries = 3;
  
  while (retries > 0) {
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--window-size=360,640',
          '--disable-notifications'
        ]
      });

      // Test if browser is working
      const pages = await browser.pages();
      if (pages.length === 0) {
        throw new Error('Browser pages not available');
      }

      console.log('[Puppeteer] Browser launched successfully');
      break; // Exit retry loop if successful
      
    } catch (error) {
      console.error(`[Puppeteer] Launch attempt ${4-retries} failed:`, error.message);
      retries--;
      
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.error('[Puppeteer] Error closing browser:', e.message);
        }
      }
      
      if (retries === 0) {
        return { success: false, message: `Không thể khởi động browser sau 3 lần thử: ${error.message}` };
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1');
    await page.setViewport({ width: 375, height: 812, isMobile: true });

    // Set cookies nếu có
    if (cookies && Array.isArray(cookies)) {
      console.log('[Puppeteer] Setting cookies...');
      await page.setCookie(...cookies);
    }

    // Truy cập group
    console.log(`[Puppeteer] Navigating to group: ${groupId}`);
    await page.goto(`https://m.facebook.com/groups/${groupId}`, { waitUntil: 'networkidle2' });

    // Đợi một chút để trang load hoàn toàn
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Kiểm tra đăng nhập thành công - thử nhiều selector khác nhau
    let isLoggedIn = false;
    const loginSelectors = [
      '#screen-root > div > div:nth-child(3) > div:nth-child(6) > div:nth-child(2) > div',
      '[data-testid="post-composer"]',
      '[aria-label="Write something..."]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="Write"]',
      'textarea[placeholder*="Viết"]'
    ];

    for (const selector of loginSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        console.log(`[Puppeteer] Found login indicator with selector: ${selector}`);
        isLoggedIn = true;
        break;
      } catch (e) {
        console.log(`[Puppeteer] Selector not found: ${selector}`);
      }
    }

    if (!isLoggedIn) {
      // Thử kiểm tra URL để xem có bị redirect về login không
      const currentUrl = page.url();
      if (currentUrl.includes('login') || currentUrl.includes('checkpoint')) {
        console.log('[Puppeteer] Redirected to login page, cookies may be invalid');
        await browser.close();
        return { success: false, message: 'Đăng nhập thất bại hoặc cookie không hợp lệ!' };
      }
      
      // Nếu không tìm thấy selector nhưng cũng không bị redirect, có thể trang đã load khác
      console.log('[Puppeteer] Could not find post box, but page loaded. Trying to continue...');
    } else {
      console.log('[Puppeteer] Đăng nhập thành công!');
    }

    // Thử tìm và click vào ô đăng bài với nhiều selector
    let postBoxClicked = false;
    const postBoxSelectors = [
      '#screen-root > div > div:nth-child(3) > div:nth-child(6) > div:nth-child(2) > div',
      '[data-testid="post-composer"]',
      '[aria-label="Write something..."]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="Write"]',
      'textarea[placeholder*="Viết"]'
    ];

    for (const selector of postBoxSelectors) {
      try {
        console.log(`[Puppeteer] Trying to click post box with selector: ${selector}`);
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        console.log(`[Puppeteer] Successfully clicked post box with selector: ${selector}`);
        postBoxClicked = true;
        break;
      } catch (e) {
        console.log(`[Puppeteer] Failed to click with selector: ${selector}`);
      }
    }

    if (!postBoxClicked) {
      console.log('[Puppeteer] Could not find or click post box');
      await browser.close();
      return { success: false, message: 'Không thể tìm thấy ô đăng bài' };
    }

    // Chờ khung soạn thảo hiện ra và nhập nội dung
    console.log('[Puppeteer] Waiting for composer...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Thử nhập content bằng nhiều cách
    console.log('[Puppeteer] Typing content...');
    console.log('content:', content);
    
    // Thử nhập bằng keyboard
    try {
      await page.keyboard.type(content);
      console.log('[Puppeteer] Content typed successfully');
    } catch (e) {
      console.log('[Puppeteer] Failed to type with keyboard, trying alternative method');
      // Thử nhập bằng evaluate
      await page.evaluate((text) => {
        const activeElement = document.activeElement;
        if (activeElement) {
          activeElement.textContent = text;
          activeElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, content);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Tìm và click nút Đăng
    console.log('[Puppeteer] Looking for post button...');
    const postButtonSelectors = [
      '#screen-root > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(3)',
      '[data-testid="post-button"]',
      'button[type="submit"]',
      'button:contains("Post")',
      'button:contains("Đăng")',
      'input[type="submit"]'
    ];

    let postButtonClicked = false;
    for (const selector of postButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        await page.click(selector);
        console.log(`[Puppeteer] Successfully clicked post button with selector: ${selector}`);
        postButtonClicked = true;
        break;
      } catch (e) {
        console.log(`[Puppeteer] Failed to click post button with selector: ${selector}`);
      }
    }

    if (!postButtonClicked) {
      console.log('[Puppeteer] Could not find post button');
      await browser.close();
      return { success: false, message: 'Không thể tìm thấy nút đăng bài' };
    }

    // Đợi đăng xong
    console.log('[Puppeteer] Waiting for post to complete....');
    await new Promise(resolve => setTimeout(resolve, 5000));

    await browser.close();
    console.log('[Puppeteer] Post successful.');
    return { success: true, message: 'Đăng bài thành công' };
    
  } catch (error) {
    console.error('[Puppeteer] Error:', error.message);
    if (browser) {
      await browser.close();
    }
    return { success: false, message: `Lỗi: ${error.message}` };
  }
}

module.exports = { postToFacebookGroup }; 