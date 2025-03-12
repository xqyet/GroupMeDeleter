const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Step 1: Open GroupMe login page
    await page.goto("https://web.groupme.com/");
    console.log("Log in manually and enter the group chat, then press Enter...");
    await new Promise(resolve => process.stdin.once("data", resolve)); // Wait for manual login

    // Step 2: Wait for messages to load
    await page.waitForSelector("div");
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
        while (true) {
            // Step 3: Find all messages
            let messages = await page.$$('.message');
            if (!messages || messages.length === 0) {
                console.log("No messages found, stopping.");
                break;
            }
            console.log(`Found ${messages.length} messages.`);

            // Step 4: Start from the last message (bottom) and move up
            for (let i = messages.length - 1; i >= 0; i--) {
                const message = messages[i];

                // Check if the message is already deleted
                const isDeleted = await page.evaluate(el => el.innerText.includes("This message was deleted"), message);
                if (isDeleted) {
                    console.log("Skipping already deleted message.");
                    continue;
                }

                // Scroll message into view
                await page.evaluate(el => el.scrollIntoView({ behavior: "smooth", block: "center" }), message);
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Step 5: Click the message to bring up the reaction popup
                await message.click();
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Step 6: Move the mouse over the message before clicking the three dots
                const messageBox = await message.boundingBox();
                if (messageBox) {
                    await page.mouse.move(messageBox.x + messageBox.width / 2, messageBox.y + messageBox.height / 2);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                // Step 7: Find the correct three dots button inside the message's action popup
                const threeDotsButton = await message.$('button[aria-label="more actions"], button.dropdown-toggle');

                if (!threeDotsButton) {
                    console.log("Three dots button not found, skipping message.");
                    continue;
                }

                // Move the mouse directly to the three dots before clicking
                const threeDotsBox = await threeDotsButton.boundingBox();
                if (threeDotsBox) {
                    await page.mouse.move(threeDotsBox.x + 5, threeDotsBox.y + 5);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    await threeDotsButton.click();
                } else {
                    console.log("Three dots button not clickable, skipping message.");
                    continue;
                }

                // Step 8: Wait for the dropdown to appear
                try {
                    await page.waitForSelector('.dropdown-menu', { timeout: 2000 }); // Wait for dropdown
                } catch (err) {
                    console.log("Dropdown did not appear, skipping.");
                    continue;
                }

                await new Promise(resolve => setTimeout(resolve, 1000));

                // Step 9: Click the "Delete" button
                try {
                    // Ensure the dropdown is fully loaded
                    await page.waitForSelector('.dropdown-menu.action-menu.show', { visible: true, timeout: 3000 });

                    // Get all dropdown items
                    const dropdownItems = await page.$$('.dropdown-menu.action-menu.show a.dropdown-item');

                    if (!dropdownItems || dropdownItems.length < 3) { // Ensure at least 3 buttons exist
                        console.log("Delete button not found in dropdown, skipping message.");
                        
                    }

                    // Select the 3rd button (Delete button)
                    const deleteButton = dropdownItems[3]; // Index 2 = 3rd item

                    

                    // **Click the correct Delete button**
                    await page.evaluate(btn => btn.click(), deleteButton);
                    console.log("Clicked Delete button.");

                    // **Wait for confirmation popup to appear**
                    await page.waitForSelector('button:has-text("Delete")', { visible: true, timeout: 3000 });

                    console.log("Confirmation popup appeared.");
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } catch (err) {
                    console.log("Error clicking Delete button:", err);
                    
                }



                // Step 10: Confirm delete
                try {
                    await page.waitForSelector('button.btn-danger', { timeout: 000 }); // Ensure confirm button loads
                    const confirmButton = await page.$('button.btn-danger');

                    if (!confirmButton) {
                        console.log("Confirm button not found, skipping message.");
                        continue;
                    }

                    await confirmButton.click();
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    console.log("Deleted a message.");
                } catch (err) {
                    console.log("Error clicking Confirm button:", err);
                    continue;
                }
            }
        }
    } catch (error) {
        console.log("Error:", error);
    } finally {
        console.log("Finished deleting messages.");
        await browser.close();
    }
})();
