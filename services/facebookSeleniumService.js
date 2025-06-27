const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const clipboard = require('clipboardy').default;
const robot = require('robotjs');

async function postToFacebookGroup({ email, password, cookies, groupId, content }) {
  let options = new chrome.Options();
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-notifications');
  options.addArguments('--disable-infobars');
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=360,640');
  // Bật/tắt headless tại đây nếu muốn
  options.addArguments('--headless=new');
  // Mobile emulation
  options.setMobileEmulation({
    deviceMetrics: { width: 360, height: 640, pixelRatio: 3.0 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });

  let driver;
  try {
    console.log('[Selenium] Building driver...');
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    console.log('[Selenium] Driver built. Navigating to Facebook...');
    await driver.get('https://m.facebook.com/');

    // Nếu có cookies thì set cookies, không thì login bằng email/password
    if (cookies && Array.isArray(cookies) && cookies.length > 0) {
      console.log('[Selenium] Setting cookies...');
      for (const cookie of cookies) {
        await driver.manage().addCookie(cookie);
      }
      const allCookies = await driver.manage().getCookies();
      console.log('[Selenium] All cookies after add:', allCookies);
      await driver.navigate().refresh();
      await driver.sleep(3000);
      // Kiểm tra đăng nhập thành công chưa
      // (Có thể kiểm tra bằng một element đặc trưng giao diện mobile)
      // Không cần kiểm tra quá sâu, chỉ log lại
      console.log('[Selenium] Đã thử đăng nhập bằng cookie, tiếp tục thao tác...');
    } else if (email && password) {
      throw new Error('Chỉ hỗ trợ đăng nhập bằng cookie ở chế độ mobile!');
    } else {
      throw new Error('Thiếu thông tin đăng nhập Facebook (cookie)');
    }

    // Truy cập group
    console.log('[Selenium] Navigating to group:', groupId);
    await driver.get(`https://m.facebook.com/groups/${groupId}`);
    await driver.sleep(3000);

    // Chờ post box và click
    console.log('[Selenium] Waiting for post box...');
    const postBox = await driver.wait(
      until.elementLocated(By.xpath('//*[@id="screen-root"]/div/div[3]/div[6]/div[2]/div')),
      10000
    );
    await postBox.click();
    await driver.sleep(1000);

    // Chờ composer và nhập nội dung
    console.log('[Selenium] Waiting for composer...');
    const composer = await driver.wait(
      until.elementLocated(By.xpath('//*[@id="screen-root"]/div/div[2]/div[5]/div/div')),
      10000
    );
    console.log('[Selenium] Click composer...')
    await composer.click();
    await driver.sleep(1000);

    console.log('[Selenium] Waiting fill content...');
    clipboard.writeSync(content);
    console.log('[Selenium] Copied content to clipboard...')

    await driver.sleep(1000);
    robot.keyTap('v', 'command');
    await driver.sleep(1000);

    // Chờ nút Post và click
    console.log('[Selenium] Waiting for post button...');
    const postBtn = await driver.wait(
      until.elementLocated(By.xpath('//*[@id="screen-root"]/div/div[2]/div[2]/div[3]')),
      10000
    );
    await postBtn.click();
    await driver.sleep(3000);

    console.log('[Selenium] Post successful.');
    return { success: true, message: 'Đăng bài thành công' };
  } catch (error) {
    console.error('[Selenium] Error:', error);
    return { success: false, message: error.message };
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
}

module.exports = { postToFacebookGroup }; 