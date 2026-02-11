const tableErr = document.getElementById("table-err");
const bombTable = document.getElementById("bomb-table");
const downloadsTable = document.getElementById("downloads-table");

const bombDurations = Object.freeze({
    "CombatXP": 20,
    "ProfessionXP": 20,
    "ProfessionSpeed": 10,
    "Loot": 20,
    "LootChest": 20,
    "WorldEvent": 3,
    "Dungeon": 10
});

function createBombTableRow(type, server, timestamp, username) {
    const now = Date.now();

    const tr = document.createElement("tr");
    const tdType = document.createElement("td");
    const tdServer = document.createElement("td");
    const tdAge = document.createElement("td");
    const tdUsername = document.createElement("td");

    tdType.textContent = type.toString();
    tdServer.textContent = server.toString();
    if (typeof timestamp == "number") {
        const age = Math.floor((now - timestamp) / 1000);
        const timeLeft = (bombDurations[type] * 60) - age;
        tdAge.textContent = timeLeft < 60 ? `${timeLeft}s` : `${Math.floor(timeLeft/60)}m${timeLeft%60}s`;
    } else {
        tdAge.textContent = timestamp;
    }
    tdUsername.textContent = username.toString();

    tr.appendChild(tdType);
    tr.appendChild(tdServer);
    tr.appendChild(tdAge);
    tr.appendChild(tdUsername);

    bombTable.appendChild(tr);
}

async function refreshBombs() {
    try {
        const res = await fetch("/latest", { cache: "no-store" });
        if (!res.ok) return;

        const activeBombs = JSON.parse(await res.json());

        // Clear the table
        bombTable.replaceChildren();

        // Reconstruct the header
        const headTr = document.createElement("tr");
        const headType = document.createElement("th");
        const headServer = document.createElement("th");
        const headAge = document.createElement("th");
        const headUsername = document.createElement("th");

        headType.textContent = "Bomb Type";
        headServer.textContent = "Server";
        headAge.textContent = "Duration";
        headUsername.textContent = "User";

        headTr.appendChild(headType);
        headTr.appendChild(headServer);
        headTr.appendChild(headAge);
        headTr.appendChild(headUsername);

        bombTable.appendChild(headTr);

        if (activeBombs.length > 0) {
            // Add the bombs to the list
            for (const bomb of activeBombs) {
                createBombTableRow(bomb.type, bomb.world, bomb.timestamp, bomb.username)
            }
        } else {
            // There are no bombs active, so just add a row of blank values
            createBombTableRow("-", "-", "-", "-")
        }

        // Remove the loading message
        tableErr.textContent = "";

    } catch (err) {
        tableErr.textContent = "Err: Backend not reachable (" + err.message + ")";
    }
}

refreshBombs();
setInterval(refreshBombs, 1000);

async function initDownloads() {
    const res = await fetch("/downloads", {cache: "no-store"});
    const dir = JSON.parse(await res.json());

    const headTr = document.createElement("tr");
    const headFramework = document.createElement("th");
    const headVersion = document.createElement("th");
    const headFilename = document.createElement("th");

    headFramework.textContent = "Platform";
    headVersion.textContent = "Version";
    headFilename.textContent = "File";

    headTr.appendChild(headFramework);
    headTr.appendChild(headVersion);
    headTr.appendChild(headFilename);

    downloadsTable.appendChild(headTr);

    for (const [framework, versions] of Object.entries(dir)) {
        for (const [version, mods] of Object.entries(versions)) {
            for (const [filename, _] of Object.entries(mods)) {
                const tr = document.createElement("tr");
                const tdFramework = document.createElement("td");
                const tdVersion = document.createElement("td");
                const tdFilename = document.createElement("td");

                const download = document.createElement("a");
                download.href = `/download?file=${framework}/${version}/${filename}`;
                download.textContent = filename.toString();
                tdFilename.appendChild(download);

                tdFramework.textContent = framework.toString();
                tdVersion.textContent = version.toString();

                tr.appendChild(tdFramework);
                tr.appendChild(tdVersion);
                tr.appendChild(tdFilename);

                downloadsTable.appendChild(tr);
            }
        }
    }
}

initDownloads();

const rows = Array.from(bombTable.querySelectorAll("tbody tr"));
let hoveredServer = null;

function applyServerHighlight(server) {
    // Clear old highlights
    bombTable.querySelectorAll("tr.same-server").forEach(tr => tr.classList.remove("same-server"));

    if (!server) return;

    // Highlight rows whose server (2nd column) matches
    bombTable.querySelectorAll("tr").forEach((tr) => {
        const tds = tr.querySelectorAll("td");
        if (tds.length < 2) return;
        if (tds[1].textContent.trim() === server) {
            tr.classList.add("same-server");
        }
    });
}

bombTable.addEventListener("mouseover", (e) => {
    const tr = e.target.closest("tr");
    if (!tr || !bombTable.contains(tr)) return;

    const tds = tr.querySelectorAll("td");
    if (tds.length < 2) return; // ignore header

    hoveredServer = tds[1].textContent.trim();
    applyServerHighlight(hoveredServer);
});

bombTable.addEventListener("mouseleave", () => {
    hoveredServer = null;
    applyServerHighlight(null);
});