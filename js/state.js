// Game State Module
// Tập trung toàn bộ trạng thái vào 1 object để dễ dàng lưu/khôi phục

var GameState = {
    // Config
    GRID: 100,
    CHUNK: 500,
    
    // Stats
    units: [],
    bullets: [],
    expl: [],
    spawnFx: [],
    deathFx: [],
    
    // Camera
    cam: { x: 0, y: 0, z: 10, r: 0 },
    
    // Input/Mode
    sel: [],
    pendingSpawn: null,
    gameMode: "creative",
    playerTeam: 0,
    
    // Seed for randomness (để có thể khôi phục simulation)
    seed: 12345,
    
    // Helper to generate deterministic random
    random: function() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    },

    // Save/Load
    save: function() {
        return JSON.stringify({
            units: this.units,
            bullets: this.bullets,
            seed: this.seed,
            gameMode: this.gameMode,
            playerTeam: this.playerTeam,
            cam: this.cam
        });
    },

    load: function(data) {
        var state = JSON.parse(data);
        this.units = state.units;
        this.bullets = state.bullets;
        this.seed = state.seed;
        this.gameMode = state.gameMode;
        this.playerTeam = state.playerTeam;
        this.cam = state.cam;
        // Xóa sạch các mảng fx khi load
        this.expl = [];
        this.spawnFx = [];
        this.deathFx = [];
        this.sel = [];
    }
};

// Định nghĩa dữ liệu tĩnh
var UnitTypes = {
    soldier: { r: 1, hp: 1.5, spd: 3, range: 50, color: "#4a7c59", turn: 8, cost: 10 },
    tank: { r: 2, hp: 30, spd: 5, range: 100, color: "#5d6d7e", turn: 2, cost: 30 },
    cannon: { r: 3, hp: 5, spd: .5, range: 100, color: "#2c3e50", turn: .7, cost: 50 },
    mine: { r: 1, hp: 1, spd: 0, range: 0, color: "#b22222", turn: 0, cost: 5 }
};

function createUnit(type, team, x, y) {
    var t = UnitTypes[type];
    return { 
        type: type, 
        team: team, 
        x: x, 
        y: y, 
        tx: x, 
        ty: y, 
        hp: t.hp, 
        max: t.hp, 
        ang: GameState.random() * 6.28, 
        targetAng: 0, 
        cool: 0 
    };
}
