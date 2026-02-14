const tableErr = document.getElementById("table-err");
const bombTable = document.getElementById("bomb-table");
const downloadsTable = document.getElementById("downloads-table");

const bombData = Object.freeze({
    CombatXP: {
        string: "Combat XP",
        duration: 20,
        color: "#FF0000"
    },
    ProfessionXP: {
        string: "Profession XP",
        duration: 20,
        color: "#42BFF5"
    },
    ProfessionSpeed: {
        string: "Profession Speed",
        duration: 10,
        color: "#00D43F"
    },
    Loot: {
        string: "Loot",
        duration: 20,
        color: "#FFFF00"
    },
    LootChest: {
        string: "Loot Chest",
        duration: 20,
        color: "#FF00D4"
    },
    Dungeon: {
        string: "Dungeon",
        duration: 10,
        color: "#FFC400"
    }
});

const sortOrders = Object.freeze({
    BOMB_TYPE: "0",
    SERVER: "1",
    AGE: "2",
    USER: "3"
});
const sortDirs = Object.freeze({ ASC: "0", DESC: "1" });

let currSortOrder = sortOrders.AGE;
let currSortDirection = sortDirs.ASC;

function getBombType(bombString) {
    for (const [_, data] of Object.entries(bombData)) {
        if (data.string === bombString) {
            return data;
        }
    }
    return null;
}

function createBombTableRow(type, server, timestamp, username) {
    const now = Date.now();

    const tr = document.createElement("tr");
    const tdType = document.createElement("td");
    const tdServer = document.createElement("td");
    const tdAge = document.createElement("td");
    const tdUsername = document.createElement("td");

    if (typeof type == "object") {
        tdType.textContent = type.string;
        tdType.style = "color: " + type.color;
    } else {
        tdType.textContent = type;
    }
    tdServer.textContent = server.toString();
    if (typeof timestamp == "number") {
        const age = Math.floor((now - timestamp) / 1000);
        const timeLeft = (type.duration * 60) - age;
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

const scroll = document.querySelector(".table-scroll");

function updateFadeState() {
    if (!scroll) return;

    const canScroll = scroll.scrollHeight > scroll.clientHeight;
    const atBottom = scroll.scrollTop + scroll.clientHeight >= scroll.scrollHeight - 1;

    // Fade only if it can scroll AND you're not at the bottom
    scroll.classList.toggle("fade-bottom", canScroll && !atBottom);
}

let latest = null;
let headTr = null;

async function refreshBombs(data) {
    try {
        let activeBombs;
        if (data === null) {
            const res = await fetch("/latest", { cache: "no-store" });
            if (!res.ok) return;

            activeBombs = JSON.parse(await res.json());
            latest = activeBombs;
        } else {
            activeBombs = latest;
        }

        // Sort the list by the current sort key
        switch (currSortOrder) {
            case sortOrders.BOMB_TYPE:
                activeBombs.sort((a, b) => a.type.localeCompare(b.type));
                break;
            case sortOrders.SERVER:
                activeBombs.sort((a, b) => a.world.localeCompare(b.world));
                break;
            case sortOrders.AGE:
                // age is the order that the backend stores it in, so it is already sorted.
                break;
            case sortOrders.USER:
                activeBombs.sort((a, b) => a.username.localeCompare(b.username));
                break;
        }
        // Reverse the list if it is descending
        if (currSortDirection === sortDirs.DESC) {
            activeBombs.reverse();
        }

        // Clear the table
        bombTable.replaceChildren();

        // If the header has not already been constructed, create it.
        if (headTr === null) {
            headTr = document.createElement("tr");
            const headType = document.createElement("th");
            const headServer = document.createElement("th");
            const headAge = document.createElement("th");
            const headUsername = document.createElement("th");

            headType.dataset.sortKey = sortOrders.BOMB_TYPE;
            headServer.dataset.sortKey = sortOrders.SERVER;
            headAge.dataset.sortKey = sortOrders.AGE;
            headUsername.dataset.sortKey = sortOrders.USER;

            headType.textContent = "Bomb Type";
            headServer.textContent = "Server";
            headAge.textContent = "Duration";
            headUsername.textContent = "User";

            headTr.appendChild(headType);
            headTr.appendChild(headServer);
            headTr.appendChild(headAge);
            headTr.appendChild(headUsername);
        }
        bombTable.appendChild(headTr);

        if (activeBombs.length > 0) {
            // Add the bombs to the list
            for (const bomb of activeBombs) {
                createBombTableRow(getBombType(bomb.type), bomb.world, bomb.timestamp, bomb.username)
            }
        } else {
            // There are no bombs active, so just add a row of blank values
            createBombTableRow("-", "-", "-", "-")
        }

        // Remove the loading message
        tableErr.textContent = "";

        requestAnimationFrame(updateFadeState);

    } catch (err) {
        tableErr.textContent = "Err: Backend not reachable (" + err.message + ")";
    }
}

refreshBombs(null);
setInterval(() => refreshBombs(null), 1000);

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
                download.style = "color: #FFFFFF";
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

bombTable.addEventListener("click", (e) => {
    const th = e.target.closest("th");
    if (!th || !bombTable.contains(th)) {
        console.log("test");
        return;
    }

    // Get the sort key for this interaction
    const sortKey = th.dataset.sortKey;

    // Update sort order and direction
    currSortDirection = sortKey === currSortOrder ? (currSortDirection === sortDirs.ASC ? sortDirs.DESC : sortDirs.ASC) : sortDirs.ASC;
    currSortOrder = sortKey;

    // Update table
    if (latest !== null) refreshBombs(latest);
});

scroll.addEventListener("scroll", updateFadeState);