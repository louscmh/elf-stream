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
let teams = [];
let hasSetup = false;
async function loadData() {
    try {
        const jsonData = await $.getJSON("../_data/dates.json");
        jsonData.map((round) => {
            dates.push(round);
        });
        const jsonData2 = await $.getJSON("../_data/teams.json");
        jsonData2.map((team) => {
            teams.push(team);
        });
        hasSetup = true;
    } catch (error) {
        console.error("Could not read JSON file", error);
    }
}

// Ensure data is loaded first, then execute other code
(async () => {
    await loadData();
    console.log("Data loaded, executing other code...");
})();

console.log(dates);
console.log(teams);

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
let cloud_1 = document.getElementById("cloud_1");
let cloud_2 = document.getElementById("cloud_2");
let logoRow = document.getElementById("logoRow");
let mainTypo = document.getElementById("mainTypo");
let subTypo = document.getElementById("subTypo");

let leftScore = document.getElementById("leftScore");
let rightScore = document.getElementById("rightScore");
let leftTeamName = document.getElementById("leftTeamName");
let leftTeamMembers = document.getElementById("leftTeamMembers");
let rightTeamName = document.getElementById("rightTeamName");
let rightTeamMembers = document.getElementById("rightTeamMembers");
let vs = document.getElementById("vs");

let sceneButton = document.getElementById("sceneButton");
let hideButton = document.getElementById("hideButton");
let turnButton = document.getElementById("turnButton");

let resultTitle = document.getElementById("title");
let main = document.getElementById("main");
let stinger = document.getElementById("transitionVideo");

// PLACEHOLDER VARS /////////////////////////////////////////////////////////////////
let currentScene = "start"
let currentlyHidden = false;
let bestOfTemp;
let scoreBlueTemp;
let scoreRedTemp;
let tempLeft;
let tempRight;

// CONTROL PANELS //////////
sceneButton.addEventListener("click", async function(event) {
    if (currentScene == "start") {
        await promptResult();
        sceneButton.style.backgroundColor = "rgb(4, 107, 139)";
        sceneButton.innerHTML = "CURRENT SCENE: RESULTS";
    }
    else {
        await promptStart();
        sceneButton.style.backgroundColor = "rgb(27, 139, 4)";
        sceneButton.innerHTML = "CURRENT SCENE: STARTING";
    }
})

hideButton.addEventListener("click", async function(event) {
    if (currentlyHidden) {
        currentlyHidden = false;
        hideButton.style.backgroundColor = "rgb(131, 65, 65)";
        hideButton.innerHTML = "REVEAL MATCH";
        // stinger.play();
        setTimeout(function() {
            main.style.opacity = 1;
        }, 1000);
    }
    else {
        currentlyHidden = true;
        hideButton.style.backgroundColor = "rgb(139, 4, 4)";
        hideButton.innerHTML = "HIDE MATCH";
        // stinger.play();
        setTimeout(function() {
            main.style.opacity = 0;
        }, 1000);
    }
})

socket.onmessage = event => {

    if (!hasSetup) return;

    let data = JSON.parse(event.data);

    tempLeft = data.tourney.manager.teamName.left;
    tempRight = data.tourney.manager.teamName.right;

    if (tempLeft != "" && tempRight != "") {
        turnButton.innerHTML = `CURRENT MATCH: ${tempLeft} VS ${tempRight}`
        turnButton.style.backgroundColor = "rgb(107, 77, 48)";
        turnButton.style.color = "white";
    } else {
        turnButton.innerHTML = `CURRENT MATCH: N.A`
        turnButton.style.backgroundColor = "rgb(49, 41, 33)";
        turnButton.style.color = "rgba(255, 255, 255, 0.473)";
    }

    // Player Names
    if (tempLeft != leftTeamName.innerHTML) {
        setTimeout(function(event) {
            leftTeamName.innerHTML = tempLeft;
            leftTeamMembers.innerHTML = teams.find(team => team["teamName"] === tempLeft)?.["teamMembers"].join("&emsp;");
            leftTeam = tempLeft;
        }, 150);
    }
    if (tempRight != rightTeamName.innerHTML) {
        setTimeout(function(event) {
            rightTeamName.innerHTML = tempRight;
            rightTeamMembers.innerHTML = teams.find(team => team["teamName"] === tempRight)?.["teamMembers"].join("&emsp;");
            rightTeam = tempRight;
        }, 150);
    }

    if (bestOfTemp !== Math.ceil(data.tourney.manager.bestOF / 2) || scoreBlueTemp !== data.tourney.manager.stars.left || scoreRedTemp !== data.tourney.manager.stars.right) {

		// Courtesy of Victim-Crasher
		bestOfTemp = Math.ceil(data.tourney.manager.bestOF / 2);
		scoreBlueTemp = data.tourney.manager.stars.left;
		scoreRedTemp = data.tourney.manager.stars.right;
        leftScore.innerHTML = data.tourney.manager.stars.left;
        rightScore.innerHTML = data.tourney.manager.stars.right;

        if (bestOfTemp == scoreBlueTemp) {
            leftScore.style.backgroundColor = "white";
            leftScore.style.color = "#47c471";
            if (currentScene != "result") sceneButton.click();
        } else {
            leftScore.style.backgroundColor = "rgba(255,255,255,0.5)";
            leftScore.style.color = "white";
        }

        if (bestOfTemp == scoreRedTemp) {
            rightScore.style.backgroundColor = "white";
            rightScore.style.color = "#47c471";
            if (currentScene != "result") sceneButton.click();
        } else {
            rightScore.style.backgroundColor = "rgba(255,255,255,0.5)";
            rightScore.style.color = "white";
        }

    }
}

async function promptResult() {

    await cloud_1.setAttribute("class","");
    await cloud_2.setAttribute("class","");

    logoRow.style.animation = "fadeOutRight 1s cubic-bezier(.45,0,1,.48)";
    mainTypo.style.animation = "fadeOutRight 0.75s cubic-bezier(.45,0,1,.48)";
    subTypo.style.animation = "fadeOutRight 0.5s cubic-bezier(.45,0,1,.48)";
    logoRow.style.opacity = 0;
    mainTypo.style.opacity = 0;
    subTypo.style.opacity = 0;

    setTimeout(function() {
        resultTitle.style.opacity = 1;
        leftTeamName.style.opacity = 1;
        leftTeamMembers.style.opacity = 1;
        leftScore.style.opacity = 1;
        rightTeamName.style.opacity = 1;
        rightTeamMembers.style.opacity = 1;
        rightScore.style.opacity = 1;
        vs.style.opacity = 1;
        title.style.opacity = 1;
    
        resultTitle.style.animation = "fadeInLeft 0.5s cubic-bezier(0.000, 0.125, 0.000, 1.005)";
        leftTeamName.style.animation = "fadeInLeft 0.75s cubic-bezier(0.000, 0.125, 0.000, 1.005)";
        leftTeamMembers.style.animation = "fadeInLeft 0.75s cubic-bezier(0.000, 0.125, 0.000, 1.005)";
        leftScore.style.animation = "fadeInLeft 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)";
        rightTeamName.style.animation = "fadeInLeft 0.75s cubic-bezier(0.000, 0.125, 0.000, 1.005)";
        rightTeamMembers.style.animation = "fadeInLeft 0.75s cubic-bezier(0.000, 0.125, 0.000, 1.005)";
        rightScore.style.animation = "fadeInLeft 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)";
        vs.style.animation = "fadeInLeft 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)";

        currentScene = "result";
    },1000);
}

async function promptStart() {

    resultTitle.style.opacity = 0;
    leftTeamName.style.opacity = 0;
    leftTeamMembers.style.opacity = 0;
    leftScore.style.opacity = 0;
    rightTeamName.style.opacity = 0;
    rightTeamMembers.style.opacity = 0;
    rightScore.style.opacity = 0;
    vs.style.opacity = 0;
    title.style.opacity = 0;

    resultTitle.style.animation = "fadeOutRight 0.5s cubic-bezier(.45,0,1,.48)";
    leftTeamName.style.animation = "fadeOutRight 0.75s cubic-bezier(.45,0,1,.48)";
    leftTeamMembers.style.animation = "fadeOutRight 0.75s cubic-bezier(.45,0,1,.48)";
    leftScore.style.animation = "fadeOutRight 1s cubic-bezier(.45,0,1,.48)";
    rightTeamName.style.animation = "fadeOutRight 0.75s cubic-bezier(.45,0,1,.48)";
    rightTeamMembers.style.animation = "fadeOutRight 0.75s cubic-bezier(.45,0,1,.48)";
    rightScore.style.animation = "fadeOutRight 1s cubic-bezier(.45,0,1,.48)";
    vs.style.animation = "fadeOutRight 1s cubic-bezier(.45,0,1,.48)";


    setTimeout(async function() {
        await cloud_1.setAttribute("class","bobble");
        await cloud_2.setAttribute("class","bobbleDelay");

        logoRow.style.opacity = 1;
        mainTypo.style.opacity = 1;
        subTypo.style.opacity = 1;
        
        logoRow.style.animation = "fadeInLeft 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)";
        mainTypo.style.animation = "fadeInLeft 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)";
        subTypo.style.animation = "fadeInLeft 1s cubic-bezier(0.000, 0.125, 0.000, 1.005)";

        currentScene = "start";
    },1000);
}