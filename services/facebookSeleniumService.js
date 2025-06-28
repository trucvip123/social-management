const puppeteer = require('puppeteer');

async function postToFacebookGroup({ cookies, groupId, content }) {
  console.log('[Puppeteer] Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    // executablePath: '/home/tippingseek02/trucnv/chrome-linux64/chrome',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=360,640',
      '--disable-notifications'
    ]
  });

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

  // Kiểm tra đăng nhập thành công
  try {
    await page.waitForSelector('#screen-root > div > div:nth-child(3) > div:nth-child(6) > div:nth-child(2) > div', { timeout: 5000 });
    console.log('[Puppeteer] Đăng nhập thành công!');
  } catch (e) {
    console.log('[Puppeteer] Đăng nhập thất bại hoặc cookie không hợp lệ!');
    await browser.close();
    return { success: false, message: 'Đăng nhập thất bại hoặc cookie không hợp lệ!' };
  }

  // Click vào ô đăng bài
  console.log('[Puppeteer] Waiting for post box...');
  await page.waitForSelector('#screen-root > div > div:nth-child(3) > div:nth-child(6) > div:nth-child(2) > div', { timeout: 10000 });
  console.log('[Puppeteer] Clicking post box...');
  await page.click('#screen-root > div > div:nth-child(3) > div:nth-child(6) > div:nth-child(2) > div');

  // Chờ khung soạn thảo hiện ra và nhập nội dung
  console.log('[Puppeteer] Waiting for composer...');
  await page.waitForSelector('#screen-root > div > div:nth-child(2) > div:nth-child(5) > div > div', { timeout: 10000 });
  console.log('[Puppeteer] Typing content...');
  console.log('content:', content);
  
  // Focus vào composer và clear content cũ
  await page.click('#screen-root > div > div:nth-child(2) > div:nth-child(5) > div > div');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Nhập content bằng keyboard
  for (let i = 0; i < content.length; i++) {
    await page.keyboard.press(content[i]);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Click nút Đăng
  console.log('[Puppeteer] Waiting for post button...');
  await page.waitForSelector('#screen-root > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(3)', { timeout: 10000 });
  console.log('[Puppeteer] Clicking post button...');
  await page.click('#screen-root > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(3)');

  // Đợi đăng xong
  console.log('[Puppeteer] Waiting for post to complete....');
  await new Promise(resolve => setTimeout(resolve, 3000));

  await browser.close();
  console.log('[Puppeteer] Post successful.');
  return { success: true, message: 'Đăng bài thành công' };
}

module.exports = { postToFacebookGroup }; 