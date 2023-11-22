import process from "process"
import express from "express"

const app = express()

app.use(express.static("docs/demos"))
app.use("/tests", express.static("test/cases"))
app.get("/documentation", (_req, res) => res.send("It's me, the documentation page!"))
app.use("/favicon.ico", express.static("docs/favicon.ico"))
app.use("/favicon.svg", express.static("docs/favicon.svg"))

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
