import "chromedriver"

import assert from "assert"
import process from "process"

import webdriver from "selenium-webdriver"
import chrome from "selenium-webdriver/chrome.js"
import getPort from "get-port"
import forEach from "mocha-each"

import {server} from "./server.mjs"

const port = await getPort({port: 3000})

let wait = 100
let testWait = 2000
const options = new chrome.Options()
const isCI = process.env.CI // eslint-disable-line no-process-env
const forceHeadless = process.env.TEST_HEADLESS // eslint-disable-line no-process-env

console.log(`Environment: CI=${isCI}, TEST_HEADLESS=${forceHeadless}`)

if (isCI || forceHeadless) {
    // We are running on CI or forcing headless mode
    wait = 500
    testWait = 10000
    options.addArguments("--headless=new")
    console.log(`Using CI/headless settings: wait=${wait}ms, testWait=${testWait}ms`)
} else {
    console.log(`Using local settings: wait=${wait}ms, testWait=${testWait}ms`)
}
const driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).setChromeOptions(options).build()
driver.manage().window().setRect({width: 1920,
    height: 1080,
    x: 0,
    y: 0})
const baseUrl = `http://localhost:${port}/`
let demoUrls
server.listen(port)
console.log(`Server started on ${baseUrl}`)

console.log("Initializing browser driver...")
const startTime = Date.now()
await driver.get(baseUrl).then(
    () => {
        console.log(`Browser navigation took ${Date.now() - startTime}ms`)
        return driver.findElements(webdriver.By.css("a"))
    }
).then(
    nodes => Promise.all(nodes.map(node => node.getAttribute("href")))
).then(
    urls => {
        demoUrls = urls
        console.log(`Found ${urls.length} demo URLs`)
    }
)


const clickAllSortableHeaders = function(driver, counter=0) {
    // Click each sort header. But query the list of all headers again after
    // each click as the dom nodes may have been changed out.
    return driver.findElements(webdriver.By.css("th[data-sortable=true]")).then(
        nodes => {
            if ((nodes.length-1) < counter) {
                return Promise.resolve()
            }
            nodes[counter].click().then(
                () => driver.sleep(wait)
            ).then(
                () => {
                    counter += 1
                    return clickAllSortableHeaders(driver, counter)
                }
            )
        }
    )
}


describe("Demos work", function() {
    this.timeout(5000)
    forEach(demoUrls).it("loads %s without JS errors", url => driver.get(url).then(
        () => driver.manage().logs().get("browser")
    ).then(
        log => assert.deepEqual(log, [])
    ))

    forEach(demoUrls).it("can click on all sort headers of %s without JS errors", url => driver.get(url).then(
        () => clickAllSortableHeaders(driver)
    ).then(
        () => driver.manage().logs().get("browser")
    ).then(
        log => assert.deepEqual(log, [])
    ))
})

describe("Integration tests pass", function() {
    this.timeout(30000)

    it("initializes the datatable", async () => {
        await driver.get(`${baseUrl}1-simple/`)
        const wrapper = await driver.findElement(webdriver.By.className("datatable-wrapper"))
        const container = await wrapper.findElement(webdriver.By.className("datatable-container"))
        const table = await container.findElement(webdriver.By.tagName("table"))
        const tableClass = await table.getAttribute("class")
        assert(tableClass.includes("datatable-table"), "table is missing class 'datatable-table'")

        await wrapper.findElement(webdriver.By.className("datatable-top"))
        await wrapper.findElement(webdriver.By.className("datatable-bottom"))
    })

    it("shows table footer", async () => {
        await driver.get(`${baseUrl}24-footer`)
        const table = await driver.findElement(webdriver.By.tagName("table"))
        const tfoot = table.findElement(webdriver.By.tagName("tfoot"))
        const tfootText = await tfoot.getText()
        assert.equal(tfootText, "This is a table footer.")
    })

    it("shows table caption", async () => {
        await driver.get(`${baseUrl}24-footer`)
        const table = await driver.findElement(webdriver.By.tagName("table"))
        const caption = table.findElement(webdriver.By.tagName("caption"))
        const captionText = await caption.getText()
        assert.equal(captionText, "This is a table caption.")
    })

    it("shows table footer when empty", async () => {
        await driver.get(`${baseUrl}tests/empty-table-with-footer.html`)
        const table = await driver.findElement(webdriver.By.tagName("table"))
        const tfoot = table.findElement(webdriver.By.tagName("tfoot"))
        const tfootText = await tfoot.getText()
        assert.equal(tfootText, "This is a table footer.")
    })

    it("shows table caption when empty", async () => {
        await driver.get(`${baseUrl}tests/empty-table-with-footer.html`)
        const table = await driver.findElement(webdriver.By.tagName("table"))
        const caption = table.findElement(webdriver.By.tagName("caption"))
        const captionText = await caption.getText()
        assert.equal(captionText, "This is a table caption.")
    })

    /**
     * Assert that the rendered table has all the attributes defined.
     */
    const assertCellAttrs = async function(tableId) {
        await driver.findElement(webdriver.By.xpath(`//table[@id='${tableId}' and contains(@class, 'my-table') and @style='white-space: nowrap;']`))
        await driver.findElement(webdriver.By.xpath(`//table[@id='${tableId}']/thead/tr/th[@class='red']`))
        await driver.findElement(webdriver.By.xpath(`//table[@id='${tableId}']/tbody/tr[@class='yellow']`))
        await driver.findElement(webdriver.By.xpath(`//table[@id='${tableId}']/tbody/tr[@class='yellow']/td[@class='red']`))
    }

    it("preserves cell attributes (DOM)", async () => {
        await driver.get(`${baseUrl}tests/cell-attributes-dom.html`)
        await driver.sleep(wait)
        await assertCellAttrs("cell-attributes-dom-table")
    })

    it("preserves cell attributes (JS)", async () => {
        console.log(`Starting JS cell attributes test with testWait=${testWait}ms`)
        const testStart = Date.now()

        await driver.get(`${baseUrl}tests/cell-attributes-js.html`)
        console.log(`Page loaded in ${Date.now() - testStart}ms`)

        console.log("Waiting for DataTable to initialize...")
        const waitStart = Date.now()

        // Wait for the DataTable to be available with intelligent retry
        let dtAvailable = false
        for (let attempt = 0; attempt < testWait / 100; attempt++) {
            try {
                await driver.executeScript("return window.dt && window.dt.initialized")
                dtAvailable = true
                console.log(`DataTable ready after ${Date.now() - waitStart}ms (attempt ${attempt + 1})`)
                break
            } catch (error) {
                await driver.sleep(100)
            }
        }

        if (!dtAvailable) {
            console.log(`DataTable not ready after ${testWait}ms, proceeding anyway`)
        }

        console.log("Running assertions...")
        const assertStart = Date.now()
        await assertCellAttrs("cell-attributes-js-table")
        console.log(`Assertions completed in ${Date.now() - assertStart}ms`)
        console.log(`Total test time: ${Date.now() - testStart}ms`)
    })

    it("supports multiple classes", async () => {
        console.log(`Starting multiple classes test with testWait=${testWait}ms`)
        const testStart = Date.now()

        const classes = [
            ".active1.active2",
            ".ascending1.ascending2",
            ".bottom1.bottom2",
            ".container1.container2",
            ".cursor1.cursor2",
            // ".descending1.descending2",
            ".disabled1.disabled2",
            ".dropdown1.dropdown2",
            ".ellipsis1.ellipsis2",
            ".filter1.filter2",
            ".filter-active1.filter-active2",
            // ".empty1.empty2",
            ".headercontainer1.headercontainer2",
            ".hidden1.hidden2",
            ".info1.info2",
            ".input1.input2",
            ".loading1.loading2",
            ".pagination1.pagination2",
            ".pagination-list1.pagination-list2",
            ".pagination-list-item1.pagination-list-item2",
            ".pagination-list-item-link1.pagination-list-item-link2",
            ".search1.search2",
            ".selector1.selector2",
            ".sorter1.sorter2",
            ".table1.table2",
            ".top1.top2",
            ".wrapper1.wrapper2"
        ]

        await driver.get(`${baseUrl}tests/multiple-classes.html`)
        console.log(`Page loaded in ${Date.now() - testStart}ms`)

        console.log("Waiting for DataTable initialization...")
        const waitStart = Date.now()

        // Wait for the DataTable to be available with intelligent retry
        let dtAvailable = false
        for (let attempt = 0; attempt < testWait / 100; attempt++) {
            try {
                await driver.executeScript("return window.dt && window.dt.initialized")
                dtAvailable = true
                console.log(`DataTable ready after ${Date.now() - waitStart}ms (attempt ${attempt + 1})`)
                break
            } catch (error) {
                await driver.sleep(100)
            }
        }

        if (!dtAvailable) {
            console.log(`DataTable not ready after ${testWait}ms, proceeding anyway`)
        }

        console.log(`Looking for ${classes.length} CSS classes...`)
        const assertStart = Date.now()
        await Promise.all(classes.map(className => driver.findElement(webdriver.By.css(className))))
        console.log(`Class assertions completed in ${Date.now() - assertStart}ms`)
        console.log(`Total test time: ${Date.now() - testStart}ms`)
    })

    it("handles colspan functionality comprehensively", async () => {
        console.log(`Starting colspan comprehensive test with testWait=${testWait}ms`)
        const testStart = Date.now()

        await driver.get(`${baseUrl}tests/colspan.html`)
        console.log(`Page loaded in ${Date.now() - testStart}ms`)

        // Wait for the DataTable to initialize and tests to run
        console.log("Waiting for DataTable and tests to complete...")
        const waitStart = Date.now()

        // Intelligent wait for test completion
        let testCompleted = false
        for (let attempt = 0; attempt < testWait / 100; attempt++) {
            try {
                const resultsElement = await driver.findElement(webdriver.By.id("results"))
                const resultsText = await resultsElement.getText()

                if (resultsText.includes("All tests passed!") || resultsText.includes("Some tests failed!")) {
                    testCompleted = true
                    console.log(`Tests completed after ${Date.now() - waitStart}ms (attempt ${attempt + 1})`)
                    break
                }

                // Log progress every 1 second
                if (attempt > 0 && attempt % 10 === 0) {
                    console.log(`Still waiting... attempt ${attempt + 1}, results length: ${resultsText.length}`)
                    if (resultsText.length > 50) {
                        console.log(`Current results preview: ${resultsText.substring(0, 100)}...`)
                    }
                }
            } catch (error) {
                // Element not found yet, continue waiting
                if (attempt > 0 && attempt % 10 === 0) {
                    console.log(`Still waiting for results element... attempt ${attempt + 1}, error: ${error.message}`)
                }
            }
            await driver.sleep(100)
        }

        if (!testCompleted) {
            console.log(`WARNING: Tests not completed after ${testWait}ms, proceeding anyway`)
            // Try to get any available results for debugging
            try {
                const resultsElement = await driver.findElement(webdriver.By.id("results"))
                const resultsText = await resultsElement.getText()
                console.log(`Final results state: ${resultsText}`)
            } catch (error) {
                console.log(`Could not get final results: ${error.message}`)
            }
        }

        // Check that all tests passed by looking for the success summary
        console.log("Checking test results...")
        const resultsStart = Date.now()

        let results, resultsText
        try {
            results = await driver.findElement(webdriver.By.id("results"))
            resultsText = await results.getText()
            console.log(`Results element found and text retrieved in ${Date.now() - resultsStart}ms`)
            console.log(`Results text length: ${resultsText.length} characters`)
            console.log(`Results preview: ${resultsText.substring(0, 200)}...`)
        } catch (error) {
            console.error(`Failed to get results: ${error.message}`)

            // Additional debugging: check if page loaded correctly
            try {
                const title = await driver.getTitle()
                console.log(`Page title: ${title}`)
                const currentUrl = await driver.getCurrentUrl()
                console.log(`Current URL: ${currentUrl}`)
                const pageSource = await driver.getPageSource()
                console.log(`Page source length: ${pageSource.length}`)
                if (pageSource.includes("results")) {
                    console.log("Page contains 'results' text")
                } else {
                    console.log("Page does NOT contain 'results' text")
                }
            } catch (debugError) {
                console.error(`Debug info failed: ${debugError.message}`)
            }

            throw error
        }

        // Verify that the summary indicates all tests passed
        const hasPassedMessage = resultsText.includes("All tests passed! ✓")
        console.log(`Test summary check: ${hasPassedMessage ? "PASSED" : "FAILED"}`)
        assert(hasPassedMessage, "Colspan comprehensive tests should all pass")

        // Verify no JavaScript errors occurred during testing (ignoring unrelated UMD errors)
        const logs = await driver.manage().logs().get("browser")
        const errors = logs.filter(log => log.level.name === "SEVERE")
        console.log(`Browser logs check: ${errors.length} severe errors found`)
        if (errors.length > 0) {
            console.log("Severe errors:", errors.map(e => e.message))
        }
        assert.deepEqual(errors, [], "No JavaScript errors should occur during colspan testing")
        console.log(`Total test time: ${Date.now() - testStart}ms`)
    })

    it("handles colspan with JSON/JavaScript data", async () => {
        console.log(`Starting colspan JSON test with testWait=${testWait}ms`)
        const testStart = Date.now()

        await driver.get(`${baseUrl}tests/colspan-json.html`)
        console.log(`Page loaded in ${Date.now() - testStart}ms`)

        // Wait for the DataTable to initialize and tests to run
        console.log("Waiting for DataTable and tests to complete...")
        const waitStart = Date.now()

        // Intelligent wait for test completion
        let testCompleted = false
        for (let attempt = 0; attempt < testWait / 100; attempt++) {
            try {
                const resultsElement = await driver.findElement(webdriver.By.id("results"))
                const resultsText = await resultsElement.getText()

                if (resultsText.includes("All tests passed!") || resultsText.includes("Some tests failed!")) {
                    testCompleted = true
                    console.log(`Tests completed after ${Date.now() - waitStart}ms (attempt ${attempt + 1})`)
                    break
                }

                // Log progress every 1 second
                if (attempt > 0 && attempt % 10 === 0) {
                    console.log(`Still waiting... attempt ${attempt + 1}, results length: ${resultsText.length}`)
                }
            } catch (error) {
                // Element not found yet, continue waiting
                if (attempt > 0 && attempt % 10 === 0) {
                    console.log(`Still waiting for results element... attempt ${attempt + 1}`)
                }
            }
            await driver.sleep(100)
        }

        // Check that all tests passed by looking for the success summary
        const results = await driver.findElement(webdriver.By.id("results"))
        const resultsText = await results.getText()
        console.log(`Results text length: ${resultsText.length} characters`)

        // Verify that the summary indicates all tests passed
        const hasPassedMessage = resultsText.includes("All tests passed! ✓")
        console.log(`Test summary check: ${hasPassedMessage ? "PASSED" : "FAILED"}`)
        assert(hasPassedMessage, "Colspan JSON data tests should all pass")

        // Verify no JavaScript errors occurred during testing
        const logs = await driver.manage().logs().get("browser")
        const errors = logs.filter(log => log.level.name === "SEVERE")
        console.log(`Browser logs check: ${errors.length} severe errors found`)
        assert.deepEqual(errors, [], "No JavaScript errors should occur during colspan JSON testing")
        console.log(`Total test time: ${Date.now() - testStart}ms`)
    })

    it("handles rowspan functionality comprehensively", async () => {
        console.log(`Starting rowspan comprehensive test with testWait=${testWait}ms`)
        const testStart = Date.now()

        await driver.get(`${baseUrl}tests/rowspan.html`)
        console.log(`Page loaded in ${Date.now() - testStart}ms`)

        // Wait for the DataTable to initialize and tests to run
        console.log("Waiting for DataTable and tests to complete...")
        const waitStart = Date.now()

        // Intelligent wait for test completion
        let testCompleted = false
        for (let attempt = 0; attempt < testWait / 100; attempt++) {
            try {
                const resultsElement = await driver.findElement(webdriver.By.id("results"))
                const resultsText = await resultsElement.getText()

                if (resultsText.includes("All tests passed!") || resultsText.includes("Some tests failed!")) {
                    testCompleted = true
                    console.log(`Tests completed after ${Date.now() - waitStart}ms (attempt ${attempt + 1})`)
                    break
                }

                // Log progress every 1 second
                if (attempt > 0 && attempt % 10 === 0) {
                    console.log(`Still waiting... attempt ${attempt + 1}, results length: ${resultsText.length}`)
                }
            } catch (error) {
                // Element not found yet, continue waiting
                if (attempt > 0 && attempt % 10 === 0) {
                    console.log(`Still waiting for results element... attempt ${attempt + 1}`)
                }
            }
            await driver.sleep(100)
        }

        // Check that all tests passed by looking for the success summary
        const results = await driver.findElement(webdriver.By.id("results"))
        const resultsText = await results.getText()
        console.log(`Results text length: ${resultsText.length} characters`)

        // Verify that the summary indicates all tests passed
        const hasPassedMessage = resultsText.includes("All tests passed! ✓")
        console.log(`Test summary check: ${hasPassedMessage ? "PASSED" : "FAILED"}`)
        assert(hasPassedMessage, "Rowspan comprehensive tests should all pass")

        // Verify no JavaScript errors occurred during testing
        const logs = await driver.manage().logs().get("browser")
        const errors = logs.filter(log => log.level.name === "SEVERE")
        console.log(`Browser logs check: ${errors.length} severe errors found`)
        assert.deepEqual(errors, [], "No JavaScript errors should occur during rowspan testing")
        console.log(`Total test time: ${Date.now() - testStart}ms`)
    })

    it("handles rowspan with JSON/JavaScript data", async () => {
        console.log(`Starting rowspan JSON test with testWait=${testWait}ms + 500ms extra`)
        const testStart = Date.now()

        await driver.get(`${baseUrl}tests/rowspan-json.html`)
        console.log(`Page loaded in ${Date.now() - testStart}ms`)

        // Wait for the DataTable to initialize and tests to run
        // Extra wait needed for Test 8 which uses setTimeout(100ms)
        const totalWait = testWait + 500
        console.log("Waiting for DataTable and tests to complete (including setTimeout)...")
        const waitStart = Date.now()

        // Intelligent wait for test completion with extra time for setTimeout
        let testCompleted = false
        for (let attempt = 0; attempt < totalWait / 100; attempt++) {
            try {
                const resultsElement = await driver.findElement(webdriver.By.id("results"))
                const resultsText = await resultsElement.getText()

                if (resultsText.includes("All tests passed!") || resultsText.includes("Some tests failed!")) {
                    testCompleted = true
                    console.log(`Tests completed after ${Date.now() - waitStart}ms (attempt ${attempt + 1})`)
                    break
                }

                // Log progress every 1 second
                if (attempt > 0 && attempt % 10 === 0) {
                    console.log(`Still waiting... attempt ${attempt + 1}, results length: ${resultsText.length}`)
                }
            } catch (error) {
                // Element not found yet, continue waiting
                if (attempt > 0 && attempt % 10 === 0) {
                    console.log(`Still waiting for results element... attempt ${attempt + 1}`)
                }
            }
            await driver.sleep(100)
        }

        // Check that all tests passed by looking for the success summary
        const results = await driver.findElement(webdriver.By.id("results"))
        const resultsText = await results.getText()
        console.log(`Results text length: ${resultsText.length} characters`)

        // Note: This test may still fail due to DataTable library issues with rowspan sorting/searching
        // but the main CI vs local timing issues have been resolved

        // Verify that the summary indicates all tests passed
        const hasPassedMessage = resultsText.includes("All tests passed! ✓")
        console.log(`Test summary check: ${hasPassedMessage ? "PASSED" : "FAILED"}`)
        assert(hasPassedMessage, "Rowspan JSON data tests should all pass")

        // Verify no JavaScript errors occurred during testing
        const logs = await driver.manage().logs().get("browser")
        const errors = logs.filter(log => log.level.name === "SEVERE")
        console.log(`Browser logs check: ${errors.length} severe errors found`)
        assert.deepEqual(errors, [], "No JavaScript errors should occur during rowspan JSON testing")
        console.log(`Total test time: ${Date.now() - testStart}ms`)
    })

    it("handles combined colspan and rowspan", async () => {
        console.log(`Starting combined colspan/rowspan test with testWait=${testWait}ms`)
        const testStart = Date.now()

        await driver.get(`${baseUrl}tests/colspan-rowspan.html`)
        console.log(`Page loaded in ${Date.now() - testStart}ms`)

        // Wait for the DataTable to initialize and tests to run
        console.log("Waiting for DataTable and tests to complete...")
        const waitStart = Date.now()

        // Intelligent wait for test completion
        let testCompleted = false
        for (let attempt = 0; attempt < testWait / 100; attempt++) {
            try {
                const resultsElement = await driver.findElement(webdriver.By.id("results"))
                const resultsText = await resultsElement.getText()

                if (resultsText.includes("All tests passed!") || resultsText.includes("Some tests failed!")) {
                    testCompleted = true
                    console.log(`Tests completed after ${Date.now() - waitStart}ms (attempt ${attempt + 1})`)
                    break
                }

                // Log progress every 1 second
                if (attempt > 0 && attempt % 10 === 0) {
                    console.log(`Still waiting... attempt ${attempt + 1}, results length: ${resultsText.length}`)
                }
            } catch (error) {
                // Element not found yet, continue waiting
                if (attempt > 0 && attempt % 10 === 0) {
                    console.log(`Still waiting for results element... attempt ${attempt + 1}`)
                }
            }
            await driver.sleep(100)
        }

        // Check that all tests passed by looking for the success summary
        const results = await driver.findElement(webdriver.By.id("results"))
        const resultsText = await results.getText()
        console.log(`Results text length: ${resultsText.length} characters`)

        // Verify that the summary indicates all tests passed
        const hasPassedMessage = resultsText.includes("All tests passed! ✓")
        console.log(`Test summary check: ${hasPassedMessage ? "PASSED" : "FAILED"}`)
        assert(hasPassedMessage, "Combined colspan and rowspan tests should all pass")

        // Verify no JavaScript errors occurred during testing
        const logs = await driver.manage().logs().get("browser")
        const errors = logs.filter(log => log.level.name === "SEVERE")
        console.log(`Browser logs check: ${errors.length} severe errors found`)
        assert.deepEqual(errors, [], "No JavaScript errors should occur during combined colspan/rowspan testing")
        console.log(`Total test time: ${Date.now() - testStart}ms`)
    })
})

after(() => {
    console.log("Cleaning up: closing browser and server...")
    driver.quit()
    server.close()
    console.log("Cleanup completed")
})
