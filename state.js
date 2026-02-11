let activeBombs = []

const bombDurations = Object.freeze({
        "CombatXP": 20,
        "ProfessionXP": 20,
        "ProfessionSpeed": 10,
        "Loot": 20,
        "LootChest": 20,
        "WorldEvent": 3,
        "Dungeon": 10
});

class ThrownBomb {
    constructor(username, world, type) {
        this.username = username;
        this.world = world;
        this.type = type;
        this.timestamp = Date.now();
    }

    equals(other) {
        return this.username === other.username
            && this.world === other.world
            && this.type === other.type
            && Math.abs(this.timestamp - other.timestamp) < 60000; // 60 seconds leeway
    }
}

function updateState(username, world, type) {
    // Pack this into a bomb
    let newBomb = new ThrownBomb(username, world, type);

    // Check if this bomb is new
    if (activeBombs.every(b => !b.equals(newBomb))) {
        clearExpiredBombs();
        // Prepend it to the array so it will be faster to find during the spam
        activeBombs.unshift(newBomb);
    }
}

function clearExpiredBombs() {
    let now = Date.now();
    let newBombs = []
    for (let i = 0; i < activeBombs.length; i++) {
        let bomb = activeBombs[i];
        if (now - bomb.timestamp < bombDurations[bomb.type] * 60000) {
            newBombs.push(bomb);
        }
    }
    activeBombs = newBombs;
}

function getState() {
    clearExpiredBombs();
    return JSON.stringify(activeBombs);
}

module.exports = {
    updateState,
    getState,
};