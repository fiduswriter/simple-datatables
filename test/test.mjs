import "chromedriver"
import assert from "assert"
import webdriver from "selenium-webdriver"
import getPort from "get-port"

import {server} from "./server.mjs"

const port = await getPort({port: 3000})

describe("Demos work", () => {
    it("loads all URLs without JS errors", function () {
        return Promise.all(this.urls.map(url => this.driver.get(url).then(
            () => this.manage.logs().get("browser")
        ))).then(
            logs => assert.deepEqual(logs, Array.from({length: this.urls.length}, () => []))
        )
    }).timeout(10000)

    before(function(done) {
        this.driver = new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build()
        this.manage = this.driver.manage()
        server.listen(port)
        this.driver.get(`http://localhost:${port}`).then(
            () => this.driver.findElements(webdriver.By.css("a"))
        ).then(
            nodes => Promise.all(nodes.map(node => node.getAttribute("href")))
        ).then(
            urls => {
                this.urls = urls
                done()
            }
        )
    })

    after(function () {
        this.driver.quit()
        server.close()
    })
})
