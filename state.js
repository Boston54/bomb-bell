const bombDurations = Object.freeze({
    "Combat XP": 20,
    "Profession XP": 20,
    "Profession Speed": 10,
    "Loot": 20,
    "Loot Chest": 20,
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
            && Math.abs(this.timestamp - other.timestamp) < 120000; // 120 seconds leeway
    }
}

let activeBombs = [];
// leaving this here for future testing:
// activeBombs = [new ThrownBomb("test", "testWorld", "Combat XP"), new ThrownBomb("test", "testWorld", "Profession XP"), new ThrownBomb("test", "testWorld", "Profession Speed"), new ThrownBomb("test", "testWorld", "Loot"), new ThrownBomb("test", "testWorld", "Loot Chest"), new ThrownBomb("test", "testWorld", "Dungeon")];

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