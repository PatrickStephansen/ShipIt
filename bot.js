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
  boardSize =
    stateFile.PlayerMap.Cells[stateFile.PlayerMap.Cells.length - 1].X + 1;

  if (phase == 1) {
    placeShips(workingDirectory);
  }
  if (phase == 2) {
    fireOrDoNothing(workingDirectory, stateFile);
  }
}

function placeShips(workingDirectory) {
  // Hardcoded ship placement
  let payload =
    "Carrier 0 0 North" +
    "\n" +
    "Battleship 1 0 North" +
    "\n" +
    "Cruiser 2 0 North" +
    "\n" +
    "Submarine 3 0 North" +
    "\n" +
    "Destroyer 4 0 North" +
    "\n";

  fs.writeFile(workingDirectory + "/" + placeShipFileName, payload, function(
    err
  ) {
    if (err) {
      return console.log(err);
    }
    console.log("Ships were placed");
  });
}

function fireOrDoNothing(workingDirectory, state) {
  // Random fires
  let fire = 1;
  let target = getNextSingleSpot(state);

  let payload = `${fire},${target}\n`;

  fs.writeFile(workingDirectory + "/" + commandFileName, payload, function(
    err
  ) {
    if (err) {
      return console.log(err);
    }
    console.log("A shot was fired");
  });
}

function getNextSingleSpot(state) {
  return {
    x: Math.floor(Math.random() * boardSize),
    y: Math.floor(Math.random() * boardSize),
    toString: function() {
      return `${this.x},${this.y}`;
    }
  };
}
