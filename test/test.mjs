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
if (process.env.CI) { // eslint-disable-line no-process-env
    // We are running on CI
    wait = 500
    testWait = 10000
    options.addArguments("--headless=new")
}
const driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).setChromeOptions(options).build()
driver.manage().window().setRect({width: 1920,
    height: 1080,
    x: 0,
    y: 0})
const baseUrl = `http://localhost:${port}/`
let demoUrls
server.listen(port)
await driver.get(baseUrl).then(
    () => driver.findElements(webdriver.By.css("a"))
).then(
    nodes => Promise.all(nodes.map(node => node.getAttribute("href")))
).then(
    urls => {
        demoUrls = urls
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

const waitForDataTableReady = async function(driver, maxWaitMs) {
    for (let attempt = 0; attempt < maxWaitMs / 100; attempt++) {
        try {
            // eslint-disable-next-line no-await-in-loop
            await driver.executeScript("return window.dt && window.dt.initialized")
            return
        } catch {
            // eslint-disable-next-line no-await-in-loop
            await driver.sleep(100)
        }
    }
}

const waitForTestCompletion = async function(driver, maxWaitMs) {
    for (let attempt = 0; attempt < maxWaitMs / 100; attempt++) {
        try {
            // eslint-disable-next-line no-await-in-loop
            const resultsElement = await driver.findElement(webdriver.By.id("results"))
            // eslint-disable-next-line no-await-in-loop
            const resultsText = await resultsElement.getText()

            if (resultsText.includes("All tests passed!") || resultsText.includes("Some tests failed!")) {
                return
            }
        } catch {
            // Element not found yet, continue waiting
        }
        // eslint-disable-next-line no-await-in-loop
        await driver.sleep(100)
    }
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
        await driver.get(`${baseUrl}tests/cell-attributes-js.html`)
        await waitForDataTableReady(driver, testWait)
        await assertCellAttrs("cell-attributes-js-table")
    })

    it("supports multiple classes", async () => {
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
        await waitForDataTableReady(driver, testWait)
        await Promise.all(classes.map(className => driver.findElement(webdriver.By.css(className))))
    })

    it("handles colspan functionality comprehensively", async () => {
        await driver.get(`${baseUrl}tests/colspan.html`)
        await waitForTestCompletion(driver, testWait)

        // Check that all tests passed by looking for the success summary
        const results = await driver.findElement(webdriver.By.id("results"))
        const resultsText = await results.getText()

        // Verify that the summary indicates all tests passed
        assert(resultsText.includes("All tests passed! ✓"), "Colspan comprehensive tests should all pass")

        // Verify no JavaScript errors occurred during testing (ignoring unrelated UMD errors)
        const logs = await driver.manage().logs().get("browser")
        const errors = logs.filter(log => log.level.name === "SEVERE")
        assert.deepEqual(errors, [], "No JavaScript errors should occur during colspan testing")
    })

    it("handles colspan with JSON/JavaScript data", async () => {
        await driver.get(`${baseUrl}tests/colspan-json.html`)
        await waitForTestCompletion(driver, testWait)

        // Check that all tests passed by looking for the success summary
        const results = await driver.findElement(webdriver.By.id("results"))
        const resultsText = await results.getText()

        // Verify that the summary indicates all tests passed
        assert(resultsText.includes("All tests passed! ✓"), "Colspan JSON data tests should all pass")

        // Verify no JavaScript errors occurred during testing
        const logs = await driver.manage().logs().get("browser")
        const errors = logs.filter(log => log.level.name === "SEVERE")
        assert.deepEqual(errors, [], "No JavaScript errors should occur during colspan JSON testing")
    })

    it("handles rowspan functionality comprehensively", async () => {
        await driver.get(`${baseUrl}tests/rowspan.html`)
        await waitForTestCompletion(driver, testWait)

        // Check that all tests passed by looking for the success summary
        const results = await driver.findElement(webdriver.By.id("results"))
        const resultsText = await results.getText()

        // Verify that the summary indicates all tests passed
        assert(resultsText.includes("All tests passed! ✓"), "Rowspan comprehensive tests should all pass")

        // Verify no JavaScript errors occurred during testing
        const logs = await driver.manage().logs().get("browser")
        const errors = logs.filter(log => log.level.name === "SEVERE")
        assert.deepEqual(errors, [], "No JavaScript errors should occur during rowspan testing")
    })

    it("handles rowspan with JSON/JavaScript data", async () => {
        await driver.get(`${baseUrl}tests/rowspan-json.html`)

        // Wait for the DataTable to initialize and tests to run
        // Extra wait needed for Test 8 which uses setTimeout(100ms)
        const totalWait = testWait + 500
        await waitForTestCompletion(driver, totalWait)

        // Check that all tests passed by looking for the success summary
        const results = await driver.findElement(webdriver.By.id("results"))
        const resultsText = await results.getText()

        // Note: This test may still fail due to DataTable library issues with rowspan sorting/searching
        // but the main CI vs local timing issues have been resolved

        // Verify that the summary indicates all tests passed
        assert(resultsText.includes("All tests passed! ✓"), "Rowspan JSON data tests should all pass")

        // Verify no JavaScript errors occurred during testing
        const logs = await driver.manage().logs().get("browser")
        const errors = logs.filter(log => log.level.name === "SEVERE")
        assert.deepEqual(errors, [], "No JavaScript errors should occur during rowspan JSON testing")
    })

    it("handles combined colspan and rowspan", async () => {
        await driver.get(`${baseUrl}tests/colspan-rowspan.html`)
        await waitForTestCompletion(driver, testWait)

        // Check that all tests passed by looking for the success summary
        const results = await driver.findElement(webdriver.By.id("results"))
        const resultsText = await results.getText()

        // Verify that the summary indicates all tests passed
        assert(resultsText.includes("All tests passed! ✓"), "Combined colspan and rowspan tests should all pass")

        // Verify no JavaScript errors occurred during testing
        const logs = await driver.manage().logs().get("browser")
        const errors = logs.filter(log => log.level.name === "SEVERE")
        assert.deepEqual(errors, [], "No JavaScript errors should occur during combined colspan/rowspan testing")
    })
})

after(() => {
    driver.quit()
    server.close()
})
