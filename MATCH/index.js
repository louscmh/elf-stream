// SOCKET /////////////////////////////////////////////////////////////////
let socket = new ReconnectingWebSocket("ws://" + location.host + "/ws");
socket.onopen = () => {
    console.log("Successfully Connected");
};
socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};
socket.onerror = error => {
    console.log("Socket Error: ", error);
};

window.addEventListener("contextmenu", (e) => e.preventDefault());

// SHOWCASE DATES DATA /////////////////////////////////////////////////////////////////
let dates = [];
(async () => {
    try {
        const jsonData = await $.getJSON("../_data/dates.json");
        jsonData.map((round) => {
            dates.push(round);
        });
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
})();
console.log(dates);

// API /////////////////////////////////////////////////////////////////
const file = [];
let api;
(async () => {
    try {
        const jsonData = await $.getJSON("../_data/api.json");
        jsonData.map((num) => {
            file.push(num);
        });
        api = file[0].api;
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
})();

// HTML VARS /////////////////////////////////////////////////////////////////
let playerOne = document.getElementById("leftName");
let playerTwo = document.getElementById("rightName");
let scoreBlue = document.getElementById("scoreBlue");
let scoreRed = document.getElementById("scoreRed");
let chatContainer = document.getElementById("chatContainer");
let playerOnePick = document.getElementById("leftTeamPick");
let playerTwoPick = document.getElementById("rightTeamPick");
let sceneButton = document.getElementById("sceneButton");
let turnButton = document.getElementById("turnButton");
let autoButton = document.getElementById("autoButton");
let sceneContainer = document.getElementById("main");
let pickingText = document.getElementById("pickingText");
let leftPlayerOne = document.getElementById("leftPlayerOne");
let leftPlayerTwo = document.getElementById("leftPlayerTwo");
let rightPlayerOne = document.getElementById("rightPlayerOne");
let rightPlayerTwo = document.getElementById("rightPlayerTwo");
let currentPickTeam = document.getElementById("currentPickTeam");
let currentlyPicking = document.getElementById("currentlyPicking");

let beatmapNameElement = document.getElementById("beatmapName");
let beatmapMapperElement = document.getElementById("beatmapMapper");
let beatmapNameDelayElement = document.getElementById("beatmapNameDelay");
let beatmapMapperDelayElement = document.getElementById("beatmapMapperDelay");
let srElement = document.getElementById("sr");
let odElement = document.getElementById("od");
let csElement = document.getElementById("cs");
let arElement = document.getElementById("ar");
let bpmElement = document.getElementById("bpm");
let lengthElement = document.getElementById("length");
let pickElement = document.getElementById("pick");
let sourceElement = document.getElementById("source");

let stageText = document.getElementById("stageText");
let sceneBackground = document.getElementById("sceneBackground");
let mappoolContainer = document.getElementById("mappoolContainer");
let chatbox = document.getElementById("chatbox");
let score = document.getElementById("scoreBoard");


// PLACEHOLDER VARS /////////////////////////////////////////////////////////////////
let currentFile = "";
let gameState;
let currentStage;
let bestOfTemp;
let scoreBlueTemp;
let scoreRedTemp;
let scoreEvent;
let previousState;
let hasSetup;
let chatLen = 0;
let currentScene = 0;
let banCount = 0;
let currentBeatmap;
let currentTurn;
let autoPick = false;
let leftTeam;
let rightTeam;
let leftTeamStars;
let rightTeamStars;
const beatmaps = new Set(); // Store beatmapID;
const bms = []; // Store beatmaps

let cachedPlayerOneScore;
let cachedPlayerTwoScore;
let barThreshold = 500000;
let clients = []; 
let hasPick;

// BEATMAP DATA /////////////////////////////////////////////////////////////////
let beatmapSet = [];
let beatmapIDS = [];
(async () => {
    try {
        const jsonData = await $.getJSON("../_data/beatmaps.json");
        jsonData.map((beatmap) => {
            beatmapSet.push(beatmap);
        });
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
    for (index = 0; index < beatmapSet.length; index++) {
        beatmapIDS.push(beatmapSet[index]["beatmapId"]);
    }
})();

const mods = {
    FM: 0,
    HD: 1,
    HR: 2,
    DT: 3,
    TB: 4,
};

// CONTROL PANELS //////////
sceneButton.addEventListener("click", function(event) {
    if (currentScene == 0) {
        currentScene = 1;
        sceneButton.innerHTML = "CURRENT SCENE: GAMEPLAY";
        sceneButton.style.backgroundColor = "rgb(128, 183, 255)";
        mappoolContainer.style.animation = "sceneChangeInRight 1.5s ease-in-out";
        chatbox.style.animation = "sceneChangeInLeft 1.5s ease-in-out";
        hasPick ? null : currentlyPicking.style.animation = "sceneChangeInLeft 1.5s ease-in-out";
        chatbox.style.opacity = 0;
        hasPick ? null : currentlyPicking.style.opacity = 0;
        mappoolContainer.style.opacity = 0;
        setTimeout(function() {
            sceneBackground.style.clipPath = "polygon(0 0%, 0 0, 100% 0, 100% 100%, 0 100%, 0 100%, 100% 100%, 100% 0%)";
        }, 750);
    } else {
        currentScene = 0;
        sceneButton.innerHTML = "CURRENT SCENE: MAPPOOL";
        sceneButton.style.backgroundColor = "rgb(255, 128, 128)";
        mappoolContainer.style.animation = "sceneChangeOutRight 1.5s ease-in-out";
        chatbox.style.animation = "sceneChangeOutLeft 1.5s ease-in-out";
        sceneBackground.style.clipPath = "polygon(0 50%, 0 0, 100% 0, 100% 100%, 0 100%, 0 50%, 100% 50%, 100% 50%)";
        chatbox.style.opacity = 1;
        if ((bestOfTemp-leftTeamStars) != 1 || (bestOfTemp-rightTeamStars) != 1) {
            hasPick ? null : currentlyPicking.style.animation = "sceneChangeOutLeft 1.5s ease-in-out";
            hasPick ? null : currentlyPicking.style.opacity = 1;
            hasPick ? null : currentlyPicking.style.transform = "translateX(0)";
        }
        mappoolContainer.style.opacity = 1;
    }
})

turnButton.addEventListener("click", async function(event) {
    console.log("happened");
    if (currentTurn == 0 && banCount == 2) {
        await stopPulse();
        currentTurn = 1;
        currentScene == 1 ? null : currentPickTeam.innerHTML = `${currentTurn == 0 ? playerOne.innerHTML : playerTwo.innerHTML}`;
        turnButton.innerHTML = "CURRENTLY PICKING: RIGHT TEAM";
        if ((bestOfTemp-leftTeamStars) != 1 || (bestOfTemp-rightTeamStars) != 1) {
            currentScene == 1 ? null : currentlyPicking.style.display = "initial";
            currentScene == 1 ? null : currentlyPicking.style.opacity = 1;
            currentScene == 1 ? null : currentlyPicking.style.transform = "translateX(0)";
            currentScene == 1 ? null : currentlyPicking.style.animation = "slideIn 1s cubic-bezier(0,.55,.34,.99)";
        }
        turnButton.style.backgroundColor = "#08ac7dff";
        playerOnePick.style.opacity = "0";
        playerTwoPick.style.opacity = "0";
        turnButton.style.color = "white";
    } else if (currentTurn == 1 && banCount == 2) {
        await stopPulse();
        currentTurn = 0;
        currentScene == 1 ? null : currentPickTeam.innerHTML = `${currentTurn == 0 ? playerOne.innerHTML : playerTwo.innerHTML}`;
        turnButton.innerHTML = "CURRENTLY PICKING: LEFT TEAM";
        if ((bestOfTemp-leftTeamStars) != 1 || (bestOfTemp-rightTeamStars) != 1) {
            currentScene == 1 ? null : currentlyPicking.style.display = "initial";
            currentScene == 1 ? null : currentlyPicking.style.opacity = 1;
            currentScene == 1 ? null : currentlyPicking.style.transform = "translateX(0)";
            currentScene == 1 ? null : currentlyPicking.style.animation = "slideIn 1s cubic-bezier(0,.55,.34,.99)";
        }
        turnButton.style.backgroundColor = "#6c9e07ff";
        playerOnePick.style.opacity = "0";
        playerTwoPick.style.opacity = "0";
        turnButton.style.color = "white";
    } else {
        turnButton.innerHTML = "TURN NOT AVAILABLE: BAN 2 MAPS FIRST";
        turnButton.style.backgroundColor = "rgb(36, 49, 33)";
        turnButton.style.color = "rgba(255, 255, 255, 0.473)";
        currentlyPicking.style.transform = "translateX(-500px)";
        currentlyPicking.style.opacity = 0;
        currentlyPicking.style.animation = "slideOut 1s cubic-bezier(.45,0,1,.48)";
    }
})

autoButton.addEventListener("click", function(event) {
    if (autoPick == 0) {
        autoPick = 1;
        autoButton.innerHTML = "AUTO PICK: ON";
        // #007A14
        autoButton.style.backgroundColor = "#00CA22";
    } else {
        autoPick = 0;
        autoButton.innerHTML = "AUTO PICK: OFF";
        autoButton.style.backgroundColor = "#007A14";
    }
})

class Beatmap {
    constructor(mods, beatmapID, layerName) {
        this.mods = mods;
        this.beatmapID = beatmapID;
        this.layerName = layerName;
        this.isBan = false;
    }
    generate() {
        let mappoolContainer = document.getElementById(`${this.mods}`);

        this.clicker = document.createElement("div");
        this.clicker.id = `${this.layerName}Clicker`;
        this.clicker.setAttribute("class", "clicker");

        mappoolContainer.appendChild(this.clicker);
        let clickerObj = document.getElementById(this.clicker.id);

        this.bg = document.createElement("div");
        this.map = document.createElement("div");
        this.ban = document.createElement("div");
        this.highlight = document.createElement("div");
        this.overlay = document.createElement("div");
        this.metadata = document.createElement("div");
        this.title = document.createElement("div");
        this.titleDelay = document.createElement("div");
        this.submetadata = document.createElement("div");
        this.difficulty = document.createElement("div");
        this.difficultyDelay = document.createElement("div");
        this.stats = document.createElement("div");
        this.modIcon = document.createElement("div");
        this.pickIcon = document.createElement("div");
        this.leftArrow = document.createElement("div");
        this.rightArrow = document.createElement("div");

        this.bg.id = `${this.layerName}BG`;
        this.map.id = `${this.layerName}`;
        this.ban.id = `${this.layerName}BAN`;
        this.highlight.id = `${this.layerName}HIGHLIGHT`;
        this.overlay.id = `${this.layerName}Overlay`;
        this.metadata.id = `${this.layerName}META`;
        this.title.id = `${this.layerName}TITLE`;
        this.titleDelay.id = `${this.layerName}TITLEDELAY`;
        this.submetadata.id = `${this.layerName}SUBMETA`;
        this.difficulty.id = `${this.layerName}DIFF`;
        this.difficultyDelay.id = `${this.layerName}DIFFDELAY`;
        this.stats.id = `${this.layerName}Stats`;
        this.modIcon.id = `${this.layerName}MOD`;
        this.pickIcon.id = `${this.layerName}PICK`;
        this.leftArrow.id = `${this.layerName}LEFT`;
        this.rightArrow.id = `${this.layerName}RIGHT`;

        this.bg.setAttribute("class", "bg");
        this.ban.setAttribute("class", "ban");
        this.highlight.setAttribute("class", "highlight");
        this.metadata.setAttribute("class", "mapInfo");
        this.title.setAttribute("class", "title");
        this.titleDelay.setAttribute("class", "titleDelay");
        this.submetadata.setAttribute("class", "mapInfoStat");
        this.difficulty.setAttribute("class", "subTitle");
        this.difficultyDelay.setAttribute("class", "subTitleDelay");
        this.map.setAttribute("class", "map");
        this.overlay.setAttribute("class", "overlay");
        this.modIcon.setAttribute("class", "modIcon");
        this.pickIcon.setAttribute("class", "pickIcon");
        this.leftArrow.setAttribute("class", "leftArrow");
        this.rightArrow.setAttribute("class", "rightArrow");

        this.modIcon.innerHTML = this.mods;
        this.leftArrow.innerHTML = "►";
        this.rightArrow.innerHTML = "◄";
        
        clickerObj.appendChild(this.map);
        document.getElementById(this.map.id).appendChild(this.ban);
        document.getElementById(this.map.id).appendChild(this.highlight);
        document.getElementById(this.map.id).appendChild(this.overlay);
        document.getElementById(this.map.id).appendChild(this.metadata);
        document.getElementById(this.map.id).appendChild(this.submetadata);
        document.getElementById(this.map.id).appendChild(this.bg);
        document.getElementById(this.metadata.id).appendChild(this.title);
        document.getElementById(this.metadata.id).appendChild(this.titleDelay);
        document.getElementById(this.submetadata.id).appendChild(this.difficulty);
        document.getElementById(this.submetadata.id).appendChild(this.difficultyDelay);
        clickerObj.appendChild(this.modIcon);
        clickerObj.appendChild(this.pickIcon);
        document.getElementById(this.pickIcon.id).appendChild(this.leftArrow);
        document.getElementById(this.pickIcon.id).appendChild(this.rightArrow);

        this.clicker.style.transform = "translateY(0)";
    }
    grayedOut() {
        this.overlay.style.opacity = '1';
    }
}

let team1 = "Red",
    team2 = "Blue";

socket.onmessage = event => {
    let data = JSON.parse(event.data);

    if (data.tourney.manager.bools.scoreVisible) {
        updateClients(data.tourney.ipcClients);
        updateScore(data.tourney.manager.gameplay.score.left, data.tourney.manager.gameplay.score.right);
    }

    let file = data.menu.bm.path.file;
    if (currentFile != file) {
        currentFile = file;
        updateBeatmapDetails(data);
    }

    let beatmapID = data.menu.bm.id;
    console.log(banCount);
    if (currentBeatmap != beatmapID) {
        console.log("happened");
        currentBeatmap = beatmapID;
        banCount == 2 && autoPick ? updateDetails(beatmapID) : null;
    }

    tempLeft = data.tourney.manager.teamName.left;
    tempRight = data.tourney.manager.teamName.right;

    // tempLeft = "Team 1";
    // tempRight = "Team 2";

    // Player Names
    if (tempLeft != playerOne.innerHTML) {
        setTimeout(function(event) {
            playerOne.innerHTML = tempLeft;
            leftTeam = tempLeft;
        }, 150);
    }
    if (tempRight != playerTwo.innerHTML) {
        setTimeout(function(event) {
            playerTwo.innerHTML = tempRight;
            rightTeam = tempRight;
        }, 150);
    }

    if (currentStage != getCurrentStage()) {
        currentStage = getCurrentStage()
        stageText.innerHTML = currentStage;
    }

    if (!hasSetup) {
        setupBeatmaps();
        setupClients();
    }

    if (chatLen != data.tourney.manager.chat.length) {
        updateChat(data);
    }

    if (bestOfTemp !== Math.ceil(data.tourney.manager.bestOF / 2) || scoreBlueTemp !== data.tourney.manager.stars.left || scoreRedTemp !== data.tourney.manager.stars.right) {

		// Courtesy of Victim-Crasher
		bestOfTemp = Math.ceil(data.tourney.manager.bestOF / 2);
        leftTeamStars = data.tourney.manager.stars.left;
        rightTeamStars = data.tourney.manager.stars.right

        if ((bestOfTemp-data.tourney.manager.stars.left) == 1 && (bestOfTemp-data.tourney.manager.stars.right) == 1) {
            currentlyPicking.style.opacity = 0;
        }

		// To know where to blow or pop score
		if (scoreBlueTemp < data.tourney.manager.stars.left) {
			scoreEvent = "blue-add";
		} else if (scoreBlueTemp > data.tourney.manager.stars.left) {
			scoreEvent = "blue-remove";
		} else if (scoreRedTemp < data.tourney.manager.stars.right) {
			scoreEvent = "red-add";
		} else if (scoreRedTemp > data.tourney.manager.stars.right) {
			scoreEvent = "red-remove";
		}

		scoreBlueTemp = data.tourney.manager.stars.left;
		scoreBlue.innerHTML = "";
		for (var i = 0; i < scoreBlueTemp; i++) {
			if (scoreEvent === "blue-add" && i === scoreBlueTemp - 1) {
				let scoreFill = document.createElement("div");
				scoreFill.setAttribute("class", "score scoreFillAnimate");
				scoreBlue.appendChild(scoreFill);
			} else {
				let scoreFill = document.createElement("div");
				scoreFill.setAttribute("class", "score scoreFill");
				scoreBlue.appendChild(scoreFill);
			}
		}
		for (var i = 0; i < bestOfTemp - scoreBlueTemp; i++) {
			if (scoreEvent === "blue-remove" && i === 0) {
				let scoreNone = document.createElement("div");
				scoreNone.setAttribute("class", "score scoreNoneAnimate");
				scoreBlue.appendChild(scoreNone);
			} else {
				let scoreNone = document.createElement("div");
				scoreNone.setAttribute("class", "score");
				scoreBlue.appendChild(scoreNone);
			}
		}

		scoreRedTemp = data.tourney.manager.stars.right;
		scoreRed.innerHTML = "";
		for (var i = 0; i < bestOfTemp - scoreRedTemp; i++) {
			if (scoreEvent === "red-remove" && i === bestOfTemp - scoreRedTemp - 1) {
				let scoreNone = document.createElement("div");
				scoreNone.setAttribute("class", "score scoreNoneAnimate");
				scoreRed.appendChild(scoreNone);
			} else {
				let scoreNone = document.createElement("div");
				scoreNone.setAttribute("class", "score");
				scoreRed.appendChild(scoreNone);
			}
		}
		for (var i = 0; i < scoreRedTemp; i++) {
			if (scoreEvent === "red-add" && i === 0) {
				let scoreFill = document.createElement("div");
				scoreFill.setAttribute("class", "score scoreFillAnimate");
				scoreRed.appendChild(scoreFill);
			} else {
				let scoreFill = document.createElement("div");
				scoreFill.setAttribute("class", "score scoreFill");
				scoreRed.appendChild(scoreFill);
			}
		}
	}

    if (previousState != data.tourney.manager.ipcState) {
        checkState(data.tourney.manager.ipcState);
        previousState = data.tourney.manager.ipcState;
    }
}

async function checkState(ipcState) {
    // map has ended and its the next player's turn
    if (ipcState == 4 && (scoreBlueTemp != bestOfTemp || scoreRedTemp != bestOfTemp)) {
        score.style.opacity = 1;
        turnButton.click();
        setTimeout(function () {
            currentScene == 1 ? sceneButton.click() : null
        }, 25000)
    } else if (ipcState == 3) {
        score.style.opacity = 1;
        currentScene == 0 ? sceneButton.click() : null;
    } else {
        score.style.opacity = 0;
    }
}

async function setupBeatmaps() {
    hasSetup = true;

    const modsCount = {
        RC: 0,
        LN: 0,
        HB: 0,
        SV: 0,
        MD: 0,
        TB: 0,
    };

    try {
        const jsonData = await $.getJSON("../_data/beatmaps.json");
        jsonData.map((beatmap) => {
            bms.push(beatmap);
        });
    } catch (error) {
        console.error("Could not read JSON file", error);
    }

    (function countMods() {
        bms.map((beatmap) => {
            modsCount[beatmap.pick.substring(0,2)]++;
        });
    })();

    let row = -1;
    let preMod = 0;
    let colIndex = 0;
    bms.map(async(beatmap, index) => {
        if (beatmap.mods !== preMod || colIndex % 3 === 0) {
            preMod = beatmap.pick.substring(0,2);
            colIndex = 0;
            row++;
        }
        const bm = new Beatmap(beatmap.pick.substring(0,2), beatmap.beatmapId, `map${index}`);
        bm.generate();
        bm.clicker.addEventListener("click", async function(event) {
            if (event.shiftKey) {
                if (banCount < 2) {
                    await stopPulse();
                    bm.overlay.style.zIndex = 3;
                    bm.overlay.style.backgroundColor = "rgba(52, 71, 55, 0.8)";
                    bm.isBan == true ? null : banCount++;
                    bm.isBan == true ? null : bm.isBan = true;
                    banCount == 2 ? currentTurn = 0 : null;
                    turnButton.click();
                    bm.ban.style.opacity = "1";
                    bm.ban.style.color = `#E0E0C1`;
                    bm.ban.innerHTML = `${leftTeam} Ban`;
                    bm.highlight.style.opacity = "0";
                    bm.highlight.style.animation = "";
                    bm.pickIcon.style.animation = "";
                    bm.pickIcon.setAttribute('class','pickIcon');
                    bm.highlight.setAttribute('class','highlight');
                }
            } else if (event.ctrlKey) {
                await stopPulse();
                bm.overlay.style.zIndex = 1;
                bm.overlay.style.backgroundColor = "rgba(87, 124, 93,0.5)";
                bm.highlight.style.opacity = "0";
                bm.highlight.style.animation = "";
                bm.pickIcon.style.animation = "";
                bm.pickIcon.setAttribute('class','pickIcon');
                bm.highlight.setAttribute('class','highlight');
                bm.ban.style.opacity = "0";
                bm.ban.style.color = `white`;
                bm.isBan ? banCount-- : null;
                banCount < 2 ? turnButton.click() : null;
                bm.isBan = false;
                playerOnePick.style.opacity = "0";
                playerTwoPick.style.opacity = "0";
                setTimeout(function() {
                    bm.ban.innerHTML = ``;
                }, 500);
            } else {
                if (!bm.isBan) {
                    if (bm.mods == "TB") {
                        await stopPulse();
                        bm.overlay.style.zIndex = 1;
                        bm.overlay.style.backgroundColor = "rgba(87, 124, 93,0.5)";
                        bm.pickIcon.style.opacity = "1";
                        bm.highlight.style.opacity = "1";
                        bm.clicker.style.animation = "pick 2s infinite cubic-bezier(.61,.01,.45,1)";
                        hasPick = true;
                    } else {
                        await stopPulse();
                        bm.overlay.style.zIndex = 1;
                        bm.overlay.style.backgroundColor = "rgba(87, 124, 93,0.5)";
                        bm.pickIcon.style.opacity = "1";
                        bm.highlight.style.opacity = "1";
                        bm.pickIcon.setAttribute('class','pickIcon teamLeftColor');
                        bm.highlight.setAttribute('class','highlight teamLeftColor');
                        bm.highlight.style.animation = "pulseLeftBorder 0.5s ease-in-out";
                        bm.pickIcon.style.animation = "pulseLeftArrow 0.5s ease-in-out";
                        playerOnePick.style.opacity = "1";
                        playerTwoPick.style.opacity = "0";
                        setTimeout(function() {
                            bm.clicker.style.animation = "pick 2s infinite cubic-bezier(.61,.01,.45,1)";
                        }, 1000);
                        currentlyPicking.style.transform = "translateX(-500px)";
                        currentlyPicking.style.opacity = 0;
                        currentlyPicking.style.animation = "slideOut 1s cubic-bezier(.45,0,1,.48)";
                        hasPick = true;
                    }
                }
            }
        });
        bm.clicker.addEventListener("contextmenu", async function(event) {
            if (event.shiftKey) {
                if (banCount < 2) {
                    await stopPulse();
                    bm.overlay.style.zIndex = 3;
                    bm.overlay.style.backgroundColor = "rgba(52, 71, 55, 0.8)";
                    bm.isBan == true ? null : banCount++;
                    bm.isBan == true ? null : bm.isBan = true;
                    banCount == 2 ? currentTurn = 1 : null;
                    turnButton.click();
                    bm.ban.style.opacity = "1";
                    bm.ban.style.color = `#C1E0CC`;
                    bm.ban.innerHTML = `${rightTeam} Ban`;
                    bm.highlight.style.opacity = "0";
                    bm.highlight.style.animation = "";
                    bm.pickIcon.style.animation = "";
                    bm.pickIcon.setAttribute('class','pickIcon');
                    bm.highlight.setAttribute('class','highlight');
                }
            } else if (event.ctrlKey) {
                await stopPulse();
                bm.overlay.style.zIndex = 1;
                bm.overlay.style.backgroundColor = "rgba(87, 124, 93,0.5)";
                bm.highlight.style.opacity = "0";
                bm.highlight.style.animation = "";
                bm.pickIcon.style.animation = "";
                bm.pickIcon.setAttribute('class','pickIcon');
                bm.highlight.setAttribute('class','highlight');
                bm.ban.style.opacity = "0";
                bm.ban.style.color = `white`;
                bm.isBan ? banCount-- : null;
                banCount < 2 ? turnButton.click() : null;
                bm.isBan = false;
                playerOnePick.style.opacity = "0";
                playerTwoPick.style.opacity = "0";
                setTimeout(function() {
                    bm.ban.innerHTML = ``;
                }, 500);
            } else {
                if (!bm.isBan) {
                    if (bm.mods == "TB") {
                        await stopPulse();
                        bm.overlay.style.zIndex = 1;
                        bm.overlay.style.backgroundColor = "rgba(87, 124, 93,0.5)";
                        bm.pickIcon.style.opacity = "1";
                        bm.highlight.style.opacity = "1";
                        bm.clicker.style.animation = "pick 2s infinite cubic-bezier(.61,.01,.45,1)";
                        hasPick = true;
                    } else {
                        await stopPulse();
                        bm.overlay.style.zIndex = 1;
                        bm.overlay.style.backgroundColor = "rgba(87, 124, 93,0.5)";
                        bm.pickIcon.style.opacity = "1";
                        bm.highlight.style.opacity = "1";
                        bm.pickIcon.setAttribute('class','pickIcon teamRightColor');
                        bm.highlight.setAttribute('class','highlight teamRightColor');
                        bm.highlight.style.animation = "pulseRightBorder 0.5s ease-in-out";
                        bm.pickIcon.style.animation = "pulseRightArrow 0.5s ease-in-out";
                        playerOnePick.style.opacity = "0";
                        playerTwoPick.style.opacity = "1";
                        setTimeout(function() {
                            bm.clicker.style.animation = "pick 2s infinite cubic-bezier(.61,.01,.45,1)";
                        }, 1000);
                        currentlyPicking.style.transform = "translateX(-500px)";
                        currentlyPicking.style.opacity = 0;
                        currentlyPicking.style.animation = "slideOut 1s cubic-bezier(.45,0,1,.48)";
                        hasPick = true;
                    }
                }
            }
        });
        const mapData = await getDataSet(beatmap.beatmapId);
        bm.bg.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://assets.ppy.sh/beatmaps/${mapData.beatmapset_id}/covers/cover.jpg')`;
        bm.title.innerHTML = mapData.artist + ' - ' + mapData.title;
        makeScrollingText(bm.title, bm.titleDelay, 20, 270, 20);
        bm.difficulty.innerHTML = `[${mapData.version}]` + '&emsp;&emsp;Mapper: ' + mapData.creator;
        makeScrollingText(bm.difficulty, bm.difficultyDelay, 30, 270, 20);
        beatmaps.add(bm);
    });
}

async function stopPulse() {
    for (let bm of beatmaps) {
        bm.pickIcon.style.opacity = "0";
        bm.clicker.style.animation = "";
    }
    hasPick = false;
}

async function getDataSet(beatmapID) {
    try {
        const data = (
            await axios.get("/get_beatmaps", {
                baseURL: "https://osu.ppy.sh/api",
                params: {
                    k: api,
                    b: beatmapID,
                },
            })
        )["data"];
        return data.length !== 0 ? data[0] : null;
    } catch (error) {
        console.error(error);
    }
};

const parseTime = ms => {
	const second = Math.floor(ms / 1000) % 60 + '';
	const minute = Math.floor(ms / 1000 / 60) + '';
	return `${'0'.repeat(2 - minute.length) + minute}:${'0'.repeat(2 - second.length) + second}`;
}

function getCurrentStage() {
    var date = new Date();
    var day = date.getUTCDate();
    var month = date.getUTCMonth()+1;

    // console.log(`${day}, ${month}`);

    let currentStage;

    for (let stage of dates) {
        stageDate = parseDateTime(stage["date"]);
        // console.log(`${stageDate.getUTCDate()}, ${stageDate.getUTCMonth()}`);
        if (stageDate.getUTCDate() >= day && stageDate.getUTCMonth()+1 >= month) {
            return stage["stage"];
        }
        currentStage = stage;
    }
    return "No Stage Detected";
}

function parseDateTime(dateTimeString) {
    // console.log(dateTimeString);
    if (dateTimeString == "") return null;
    
    var [day, month] = dateTimeString.split('/').map(Number);

    var date = new Date();
    var currentYear = date.getFullYear();

    date.setUTCFullYear(currentYear);
    date.setUTCMonth(month - 1);
    date.setUTCDate(day);

    return date;
}

async function makeScrollingText(title, titleDelay, rate, boundaryWidth, padding) {
    if (title.scrollWidth > boundaryWidth) {
        titleDelay.innerHTML = title.innerHTML;
		let ratio = (title.scrollWidth/boundaryWidth)*rate
		title.style.animation = `scrollText ${ratio}s linear infinite`;
		titleDelay.style.animation = `scrollText ${ratio}s linear infinite`;
		titleDelay.style.animationDelay = `${-ratio/2}s`;
		titleDelay.style.paddingRight = `${padding}px`;
		title.style.paddingRight = `${padding}px`;
        titleDelay.style.display = "initial";
    } else {
        titleDelay.style.display = "none";
		title.style.animation = "none";
		titleDelay.style.animation = "none";
		titleDelay.style.paddingRight = "0px";
        titleDelay.style.marginTop = `0px`;
		title.style.paddingRight = "0px";
	}
}

function updateChat(data) {
    if (chatLen == 0 || (chatLen > 0 && chatLen > data.tourney.manager.chat.length)) {
        // Starts from bottom
        chats.innerHTML = "";
        chatLen = 0;
    }

    // Add the chats
    for (var i = chatLen; i < data.tourney.manager.chat.length; i++) {
        tempClass = data.tourney.manager.chat[i].team;

        // Chat variables
        let chatParent = document.createElement('div');
        chatParent.setAttribute('class', 'chat');

        let chatTime = document.createElement('div');
        chatTime.setAttribute('class', 'chatTime');

        let chatName = document.createElement('div');
        chatName.setAttribute('class', 'chatName');

        let chatText = document.createElement('div');
        chatText.setAttribute('class', 'chatText');

        chatTime.innerText = data.tourney.manager.chat[i].time;
        chatName.innerText = data.tourney.manager.chat[i].name + ":\xa0";
        chatText.innerText = data.tourney.manager.chat[i].messageBody;

        chatName.classList.add(tempClass);

        chatParent.append(chatTime);
        chatParent.append(chatName);
        chatParent.append(chatText);
        chats.append(chatParent);
    }

    // Update the Length of chat
    chatLen = data.tourney.manager.chat.length;

    // Update the scroll so it's sticks at the bottom by default
    chats.scrollTop = chats.scrollHeight;
}

async function updateDetails(beatmapID) {
    if (beatmapIDS.includes(beatmapID)) {
        for (let bm of beatmaps) {
            if (bm.beatmapID == beatmapID) {
                setTimeout(() => {
                    currentTurn == 0 ? bm.clicker.dispatchEvent(leftClick) : bm.clicker.dispatchEvent(rightClick);
                }, 100);
            }
        }
    }
}

async function updateBeatmapDetails(data) {
	let { id } = data.menu.bm;
	let { memoryOD, memoryCS, memoryAR, fullSR, BPM: { min, max } } = data.menu.bm.stats;
	let { full } = data.menu.bm.time;
    let { difficulty, mapper, artist, title } = data.menu.bm.metadata;
    let pick;
    let customMappers;

    // if (data.menu.mods.str.includes("DT") || data.menu.mods.str.includes("NC")) {
    //     return;
    // }

    // CHECKER FOR MAPPICK & MODS (TO RECALCULATE STATS)
    if (beatmapIDS.includes(id)) {
        pick = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["pick"];
        customMappers = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)?.["mappers"].join(", ");
        let mod = pick.substring(0,2).toUpperCase();
        if (mod == "HR") {
            memoryOD = Math.min(memoryOD*1.4, 10).toFixed(1);
            memoryCS = Math.min(memoryCS*1.3, 10).toFixed(1);
            memoryAR = Math.min(memoryAR*1.4, 10).toFixed(1);
            fullSR = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["modSR"];
        } else if (mod == "DT") {
            // thanks schdewz
            memoryOD = Math.min((79.5 - (Math.min(79.5, Math.max(19.5, 79.5 - Math.ceil(6 * memoryOD))) / 1.5)) / 6, 1.5 > 1.5 ? 12 : 11).toFixed(1);
            let ar_ms = Math.max(Math.min(memoryAR <= 5 ? 1800 - 120 * memoryAR : 1200 - 150 * (memoryAR - 5), 1800), 450) / 1.5;
            memoryAR = ar_ms > 1200 ? ((1800 - ar_ms) / 120).toFixed(2) : (5 + (1200 - ar_ms) / 150).toFixed(1);
        
            fullSR = beatmapSet.find(beatmap => beatmap["beatmapId"] === id)["modSR"];
        }
    } else {
        customMappers = "";
    }
    pickElement.innerHTML = pick == null ? "XX1" : pick;

    beatmapNameElement.innerHTML = `${artist} - ${title} [${difficulty}]`;
    beatmapMapperElement.innerHTML = customMappers != "" ? `Beatmap by ${customMappers}`:`Beatmap by ${mapper}`;
    odElement.innerHTML = memoryOD.toFixed(1);
    arElement.innerHTML = memoryAR.toFixed(1);
    csElement.innerHTML = memoryCS.toFixed(1);
    srElement.innerHTML = `${fullSR}*`;
    bpmElement.innerHTML = min === max ? min : `${min}-${max}`;
    lengthElement.innerHTML = parseTime(full);

    data.menu.bm.path.full = data.menu.bm.path.full.replace(/#/g,'%23').replace(/%/g,'%25');
    sourceElement.setAttribute('src',`http://` + location.host + `/Songs/${data.menu.bm.path.full}?a=${Math.random(10000)}`);
    sourceElement.onerror = function() {
        sourceElement.setAttribute('src',`../_shared_assets/design/temporary_bg.png`);
    };

    makeScrollingText(beatmapNameElement,beatmapNameDelayElement, 20, 416, 20);
    makeScrollingText(beatmapMapperElement,beatmapMapperDelayElement, 20, 416, 20);
}

var rightClick = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    view: window,
    button: 2, // Indicates a right-click
    buttons: 2 // Indicates the right mouse button is pressed
});

var leftClick = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
});

const ctrlClick = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    view: window,
    ctrlKey: true, // Simulate Ctrl key
  });


async function setupClients() {
    const clientNumber = 6
    console.log("client setup");
    for (let i=0;i<clientNumber;i++) {
        const client = new Client(i);
        client.generate();
        clients.push(client);
    }
}

function updateClients(data) {
    data.map(async(clientData,index) => {
        const client = clients[index];
        if (client) {
            client.updateAccuracy(clientData.gameplay.accuracy);
            client.updateScore(clientData.gameplay.score);
            client.updateCombo(clientData.gameplay.combo.current);
            client.updatePlayer(clientData.spectating.name);
        }
    })
}

async function updateScore(playScoreOne, playScoreTwo) {
    let difference = Math.abs(playScoreOne-playScoreTwo);
    animationScore.playerOneScore.update(playScoreOne);
    animationScore.playerTwoScore.update(playScoreTwo);
    animationScore.diff.update(difference);
    cachedPlayerOneScore = playScoreOne;
    cachedPlayerTwoScore = playScoreTwo;
    if (playScoreOne > playScoreTwo) {
        leftContent.style.width = `${(difference/barThreshold > 1 ? 1 : difference/barThreshold)*700}px`;
        rightContent.style.width = "0px";
        toggleLead("left");
    } else if (playScoreOne < playScoreTwo) {
        rightContent.style.width = `${(difference/barThreshold > 1 ? 1 : difference/barThreshold)*700}px`;
        leftContent.style.width = "0px";
        toggleLead("right");
    } else {
        leftContent.style.width = "0px";
        rightContent.style.width = "0px";
        toggleLead("center");
    }
}

function toggleLead(lead) {
    if (lead == "left") {
        leftArrowOne.style.opacity = 1;
        rightArrowOne.style.opacity = 1;
        leftArrowTwo.style.opacity = 0;
        rightArrowTwo.style.opacity = 0;
        leftArrowOne.style.animation = "fadeInLeft 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)"
        rightArrowOne.style.animation = "fadeInRight 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)"
        leftArrowTwo.style.animation = "fadeOutLeft 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)"
        rightArrowTwo.style.animation = "fadeOutRight 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)"

        playerOneScore.style.opacity = 1;
        playerOneScore.style.transform = "scale(1)";
        playerTwoScore.style.opacity = 0.8;
        playerTwoScore.style.transform = "scale(0.8)";

    } else if (lead == "right") {
        leftArrowOne.style.opacity = 0;
        rightArrowOne.style.opacity = 0;
        leftArrowTwo.style.opacity = 1;
        rightArrowTwo.style.opacity = 1;
        leftArrowOne.style.animation = "fadeOutLeft 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)"
        rightArrowOne.style.animation = "fadeOutRight 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)"
        leftArrowTwo.style.animation = "fadeInLeft 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)"
        rightArrowTwo.style.animation = "fadeInRight 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)"
        
        playerTwoScore.style.opacity = 1;
        playerTwoScore.style.transform = "scale(1)";
        playerOneScore.style.opacity = 0.8;
        playerOneScore.style.transform = "scale(0.8)";

    } else if (lead == "center") {
        leftArrowOne.style.opacity = 0;
        rightArrowOne.style.opacity = 0;
        leftArrowTwo.style.opacity = 0;
        rightArrowTwo.style.opacity = 0;
        leftArrowOne.style.animation = "fadeOutLeft 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)"
        rightArrowOne.style.animation = "fadeOutRight 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)"
        leftArrowTwo.style.animation = "fadeOutLeft 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)"
        rightArrowTwo.style.animation = "fadeOutRight 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)"
        
        playerOneScore.style.opacity = 1;
        playerOneScore.style.transform = "scale(1)";
        playerTwoScore.style.opacity = 1;
        playerTwoScore.style.transform = "scale(1)";

    }
}

function toggleFadeOut() {
    clients.map(async(client) => {
        client.toggleFadeOut();
    })
}

function toggleFadeIn() {
    clients.map(async(client) => {
        client.toggleFadeIn();
    })
}

let animationScore = {
	playerOneScore: new CountUp('playerOneScore', 0, 0, 0, .2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
	playerTwoScore: new CountUp('playerTwoScore', 0, 0, 0, .2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    diff: new CountUp('scoreDifference', 0, 0, 0, .2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
}


class Client {
    constructor(clientNumber) {
        this.clientNumber = clientNumber;
        this.score;
        this.accuracy;
        this.combo;
        this.player;
    }
    generate() {

        this.clientTop = document.createElement("div");
        this.scoreClient = document.createElement("div");
        this.accuracyRow = document.createElement("div");
        this.accuracyClient = document.createElement("div");
        this.accuracyText = document.createElement("div");
        this.clientBottom = document.createElement("div");
        this.comboRow = document.createElement("div");
        this.comboClient = document.createElement("div");
        this.comboText = document.createElement("div");
        this.playerNameClient = document.createElement("div");

        this.clientTop.id = `${this.clientNumber}CLIENTTOP`;
        this.scoreClient.id = `${this.clientNumber}SCORE`;
        this.accuracyRow.id = `${this.clientNumber}ACCROW`;
        this.accuracyClient.id = `${this.clientNumber}ACCURACY`;
        this.accuracyText.id = `${this.clientNumber}ACCTEXT`;
        this.clientBottom.id = `${this.clientNumber}CLIENTBOTTOM`;
        this.comboRow.id = `${this.clientNumber}COMBOROW`;
        this.comboClient.id = `${this.clientNumber}COMBO`;
        this.comboText.id = `${this.clientNumber}COMBOTEXT`;
        this.playerNameClient.id = `${this.clientNumber}PLAYERNAME`;

        this.clientTop.setAttribute("class", "clientTop");
        this.scoreClient.setAttribute("class", "scoreClient");
        this.accuracyRow.setAttribute("class", "accuracyRow");
        this.accuracyClient.setAttribute("class", "accuracyClient");
        this.accuracyText.setAttribute("class", "accuracyClient");
        this.clientBottom.setAttribute("class", "clientBottom");
        this.comboRow.setAttribute("class", "comboRow");
        this.comboClient.setAttribute("class", "comboClient");
        this.comboText.setAttribute("class", "comboClient");
        this.playerNameClient.setAttribute("class", "playerNameClient");

        document.getElementById(`client${this.clientNumber}`).appendChild(this.clientTop);
        document.getElementById(`client${this.clientNumber}`).appendChild(this.clientBottom);

        document.getElementById(this.clientTop.id).appendChild(this.scoreClient);
        document.getElementById(this.clientTop.id).appendChild(this.accuracyRow);
        document.getElementById(this.clientBottom.id).appendChild(this.comboRow);
        document.getElementById(this.clientBottom.id).appendChild(this.playerNameClient);
        
        document.getElementById(`${this.accuracyRow.id}`).appendChild(this.accuracyClient);
        document.getElementById(`${this.accuracyRow.id}`).appendChild(this.accuracyText);

        document.getElementById(`${this.comboRow.id}`).appendChild(this.comboClient);
        document.getElementById(`${this.comboRow.id}`).appendChild(this.comboText);


    }
    grayedOut() {
        this.overlay.style.opacity = '1';
    }
    updateScore(score) {
        if (score == this.score) return;
        this.score = score;
    }
    updateAccuracy(accuracy) {
        if (accuracy == this.accuracy) return;
        this.accuracy = accuracy;
    }
    updateCombo(combo) {
        if (combo == this.combo) return;
        if (this.combo > 29 && combo < this.combo) this.flashMiss();
        this.combo = combo;
    }
    flashMiss() {
        const element = document.getElementById(this.playerNameClient.id)
        element.style.animation = "flashMiss 1s ease-in-out";
        setTimeout(function() {
            element.style.animation = "";
        },1000);
    }
    updatePlayer(name) {
        if (name == this.player) return;
        const element = document.getElementById(this.playerNameClient.id)
        element.innerHTML = name;
        this.player = name;
    }
}