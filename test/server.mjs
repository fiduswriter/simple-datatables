import process from "process"

import express from "express"

const app = express()

app.use(express.static("docs/demos"))

let serverProcess

const listen = (port = 3000) => {
    serverProcess = app.listen(port, () => console.log(`Server listening on port ${port}.`))
}

const close = () => serverProcess.close() && console.log("Closing down server.")

export const server = {listen,
    close}

if (process.argv[1].includes("server.mjs")) {
    server.listen()
}
