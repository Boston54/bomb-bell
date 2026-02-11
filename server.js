const express = require("express");
const path = require("path");
const { updateState, getState } = require("./state");
const fs = require('fs');

const app = express();

const port = 3000;

// Parse JSON bodies
app.use(express.json({ limit: "1kb" }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "web")));

app.post("/ingest", (req, res) => {
    const packet = req.body;

    // Minimal validation
    if (
        typeof packet !== "object" ||
        typeof packet.username !== "string" ||
        typeof packet.world !== "string" ||
        typeof packet.type !== "string"
    ) {
        return res.status(400).json({ error: "Invalid packet" });
    }

    updateState(packet.username, packet.world, packet.type);

    // Respond fast – mods shouldn't wait
    res.status(204).send();
});

app.get("/latest", (req, res) => {
    const state = getState();
    res.json(state);
});

function getDownloadsJson() {
    function readDirRecursive(dir) {
        const result = {};

        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                result[entry.name] = readDirRecursive(fullPath);
            } else {
                result[entry.name] = true;
            }
        }

        return result;
    }
    return readDirRecursive("./downloads")
}
const downloads = JSON.stringify(getDownloadsJson());

app.get("/downloads", (req, res) => {
    res.json(downloads);
})

app.get("/download", (req, res) => {
    res.download("./downloads/" + req.query.file);
})

app.listen(port, () => {
    console.log("Server running at http://localhost:" + port);
});

