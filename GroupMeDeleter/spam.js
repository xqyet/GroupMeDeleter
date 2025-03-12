const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Step 1: Open GroupMe login page
    await page.goto("https://web.groupme.com/");
    console.log("Log in manually, open a chat, and then press Enter in the terminal to start...");
    await new Promise(resolve => process.stdin.once("data", resolve)); // Wait for Enter key press

    try {
        // Step 2: Detect the actual input field dynamically
        const inputSelector = 'div[contenteditable="true"]'; // More reliable than placeholder text
        await page.waitForSelector(inputSelector, { visible: true, timeout: 10000 });

        console.log("✅ Chat detected. Sending 'hi'...");

        // Step 3: Focus on the input field and type "hi"
        await page.focus(inputSelector);
        await page.type(inputSelector, "hi", { delay: 100 }); // Simulate human typing
        await page.keyboard.press("Enter");

        console.log("✅ Sent 'hi' successfully!");

    } catch (err) {
        console.log("❌ Error sending message:", err);
    }

    // Keep the browser open
})();
