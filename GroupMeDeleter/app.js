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

    // Define gio bucci's profile image URL
    const gioBucciProfileUrl = "https://i.groupme.com/498x498.gif.ab8e43ed40304fddb181d08534f39d47.avatar";

    try {
        while (true) {
            let messages = await page.$$('.message');
            if (!messages || messages.length === 0) {
                console.log("No messages found, stopping.");
                break;
            }
            console.log(`Found ${messages.length} messages.`);

            let i = messages.length - 1;
            while (i >= 0) {
                const message = messages[i];

                // Step 4.1: Check if the message is from "gio bucci"
                const author = await message.$('.avatar img');
                if (!author) {
                    console.log("Skipping message: No author found.");
                    i--;
                    continue;
                }

                // Get the profile image URL of the author
                const authorImageUrl = await page.evaluate(img => img.src, author);

                // If the message does not belong to "gio bucci", skip it
                if (!authorImageUrl.includes(gioBucciProfileUrl)) {
                    console.log("Skipping message: Not from gio bucci.");
                    i--;
                    continue;
                }

                console.log("Processing message from gio bucci.");

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

                // Step 7: Find the correct three dots button
                const threeDotsButton = await message.$('button[aria-label="more actions"], button.dropdown-toggle');
                if (!threeDotsButton) {
                    console.log("Three dots button not found, skipping message.");
                    i--;
                    continue;
                }

                // Click the three dots button
                const threeDotsBox = await threeDotsButton.boundingBox();
                if (threeDotsBox) {
                    await page.mouse.move(threeDotsBox.x + 5, threeDotsBox.y + 5);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    await threeDotsButton.click();
                } else {
                    console.log("Three dots button not clickable, skipping message.");
                    i--;
                    continue;
                }

                // Step 8: Wait for the dropdown to appear
                try {
                    await page.waitForSelector('.dropdown-menu.action-menu.show', { visible: true, timeout: 2000 });
                } catch (err) {
                    console.log("Dropdown did not appear, skipping.");
                    i--;
                    continue;
                }

                await new Promise(resolve => setTimeout(resolve, 1000));

                // Step 9: Click the "Delete" button
                try {
                    const dropdownItems = await page.$$('.dropdown-menu.action-menu.show a.dropdown-item');

                    if (!dropdownItems || dropdownItems.length === 0) {
                        console.log("Dropdown items not found, skipping message.");
                        i--;
                        continue;
                    }

                    // Find the "Delete" button
                    let deleteButton = null;
                    for (const item of dropdownItems) {
                        const text = await page.evaluate(el => el.innerText.trim(), item);
                        if (text.toLowerCase() === "delete") {
                            deleteButton = item;
                            break;
                        }
                    }

                    // If "Delete" is not found, skip the message
                    if (!deleteButton) {
                        console.log("Delete button not found in dropdown, skipping message.");
                        i--;
                        continue;
                    }

                    // Click the correct Delete button
                    await page.evaluate(btn => btn.click(), deleteButton);
                    console.log("Clicked Delete button.");

                    // Wait for confirmation popup to appear
                    await page.waitForSelector('.modal-content', { visible: true, timeout: 3000 });
                    console.log("Confirmation popup appeared.");
                    await new Promise(resolve => setTimeout(resolve, 2000));

                } catch (err) {
                    console.log("Error clicking Delete button:", err);
                    i--;
                    continue;
                }

                // Step 10: Confirm delete
                try {
                    // Wait for the confirmation popup to be visible
                    await page.waitForSelector('.modal-content', { visible: true, timeout: 1000 });

                    // Select the "Delete" button inside the confirmation popup
                    const confirmButton = await page.$('.modal-content button.btn.btn-primary.btn-block');

                    if (!confirmButton) {
                        console.log("Confirm button not found, skipping message.");
                        continue;
                    }

                    await confirmButton.click();
                    console.log("Clicked Confirm button.");
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    
                    await page.waitForSelector('.modal-content', { hidden: true, timeout: 1000 });

                    console.log("Deleted a message.");

                    
                    try {
                        await page.waitForSelector('.modal-content button:has-text("Okay")', { visible: true, timeout: 1000 });
                        const okayButton = await page.$('.modal-content button:has-text("Okay")');

                        if (okayButton) {
                            await okayButton.click();
                            console.log("Clicked Okay button.");
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                    } catch (okErr) {
                        console.log("No 'Okay' button detected, continuing normally.");
                    }

                } catch (err) {
                    console.log("Error clicking Confirm button:", err);
                    continue;
                }

                
                await new Promise(resolve => setTimeout(resolve, 500));

                i--; 
            }
        }
    } catch (error) {
        console.log("Error:", error);
    } finally {
        console.log("Finished deleting messages.");
        await browser.close();
    }
})();
