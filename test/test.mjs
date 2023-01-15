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
const options = new chrome.Options()
if (process.env.CI) { // eslint-disable-line no-process-env
    // We are running on CI
    wait = 300
    options.headless().setChromeBinaryPath("/usr/bin/google-chrome-stable")
}
const driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).setChromeOptions(options).build()
const manage = driver.manage()
manage.window().maximize()
let demoUrls
server.listen(port)
await driver.get(`http://localhost:${port}`).then(
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


describe("Demos work", function() {
    this.timeout(5000)
    forEach(demoUrls).it("loads %s without JS errors", url => driver.get(url).then(
        () => manage.logs().get("browser")
    ).then(
        log => assert.deepEqual(log, [])
    ))

    forEach(demoUrls).it("can click on all sort headers of %s without JS errors", url => driver.get(url).then(
        () => clickAllSortableHeaders(driver)
    ).then(
        () => manage.logs().get("browser")
    ).then(
        log => assert.deepEqual(log, [])
    ))
})

after(() => {
    driver.quit()
    server.close()
})
