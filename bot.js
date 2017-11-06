// based on the sample bot by Gerrit van Huyssteen
let fs = require("fs");

let commandFileName = "command.txt";
let placeShipFileName = "place.txt";
let stateFileName = "state.json";

// This will be set in initBot function
let key = "";
let workingDirectory = "";

let boardSize = 10;

// Capture the arguments
initBot(process.argv.slice(2));

function initBot(args) {
  key = args[0];
  workingDirectory = args[1];
  console.log(key);

  // Read the current state and choose an action
  let stateFile = require(workingDirectory + "/" + stateFileName);
  let phase = stateFile.Phase;
  boardSize = stateFile.PlayerMap.MapWidth;

  if (phase == 1) {
    placeShips(workingDirectory, stateFile);
  }
  if (phase == 2) {
    commitViolence(workingDirectory, stateFile);
  }
}

function placeShips(workingDirectory) {
  // Hardcoded ship placement
  const payload = `Carrier ${boardSize - 1} ${boardSize - 1} West
Battleship ${boardSize / 2} ${boardSize / 2} East
Destroyer ${boardSize - 1} 0 West
Submarine 1 ${boardSize - 2} South
Cruiser 3 ${boardSize - 2} South`;

  fs.writeFile(workingDirectory + "/" + placeShipFileName, payload, function(err) {
    if (err) {
      return console.log(err);
    }
    console.log("Ships were placed");
  });
}

function placeShip(ship, usedSpots) {
  getRandomSpot;
}

function commitViolence(workingDirectory, state) {
  const shieldPlace = getShieldPlacement(state);
  let payload;
  if (shieldPlace.isGoodIdea) {
    console.log(`shielding at ${shieldPlace}`);
    payload = `8,${shieldPlace}
`;
  } else {
    let fire = 1;
    let target = getNextSingleSpot(state);
    console.log(`firing at ${target}`);
    payload = `${fire},${target}
`;
  }

  fs.writeFile(workingDirectory + "/" + commandFileName, payload, function(err) {
    if (err) {
      return console.log(err);
    }
  });
}

function getNextSingleSpot(state) {
  return getRandomSpot();
}

function getShieldPlacement(state) {
  const myShield = state.PlayerMap.Owner.Shield;

  if (!myShield.Active && myShield.CurrentRadius) {
    console.log("Shield time");
    const myShips = state.PlayerMap.Owner.Ships.filter(s => !s.Destroyed);
    const shipLocations = [].concat(...myShips.map(s => s.Cells.filter(c => !c.Hit)));

    let bestSpot = { x: 5, y: 5, protected: 0 };
    for (let x = myShield.CurrentRadius + 1; x < boardSize - myShield.CurrentRadius - 1; x++) {
      for (let y = myShield.CurrentRadius + 1; y < boardSize - myShield.CurrentRadius - 1; y++) {
        let protected = shipLocations.filter(
          s => Math.abs(s.X - x) <= myShield.CurrentRadius && Math.abs(s.Y - y) <= myShield.CurrentRadius
        ).length;
        if (protected > bestSpot.protected) {
          bestSpot = { x: x, y: y, protected: protected };
        }
      }
    }
    if (bestSpot.protected > 1) {
      bestSpot.isGoodIdea = true;
      bestSpot.toString = function() {
        return `${this.x},${this.y}`;
      };
      return bestSpot;
    }
  }
  return { isGoodIdea: false };
}

function getRandomSpot() {
  return {
    x: Math.floor(Math.random() * boardSize),
    y: Math.floor(Math.random() * boardSize),
    toString: function() {
      return `${this.x},${this.y}`;
    }
  };
}
