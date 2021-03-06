// based on the sample bot by Gerrit van Huyssteen
let fs = require('fs');

let commandFileName = 'command.txt';
let placeShipFileName = 'place.txt';
let stateFileName = 'state.json';

// This will be set in initBot function
let key = '';
let workingDirectory = '';

let boardSize = 10;

// Capture the arguments
initBot(process.argv.slice(2));

function initBot(args) {
  key = args[0];
  workingDirectory = args[1];
  console.log(key);

  // Read the current state and choose an action
  let stateFile = require(workingDirectory + '/' + stateFileName);
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

  fs.writeFile(workingDirectory + '/' + placeShipFileName, payload, function(err) {
    if (err) {
      return console.log(err);
    }
    console.log('Ships were placed');
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
    let fire = getAmmoType(state);
    let target = getNextSingleSpot(state);
    console.log(`firing at ${target}`);
    payload = `${fire},${target}
`;
  }

  fs.writeFile(workingDirectory + '/' + commandFileName, payload, function(err) {
    if (err) {
      return console.log(err);
    }
  });
}

function getAmmoType(state) {
  const myShips = state.PlayerMap.Owner.Ships.filter(s => !s.Destroyed);
  const weaponPreference = {
    SeekerMissile: { value: 100, command: '7' },
    DiagonalCrossShot: { value: 50, command: '6' },
    CrossShot: { value: 50, command: '5' },
    CornerShot: { value: 25, command: '4' },
    DoubleShot: { value: 10, command: '1' }, // Double-shots are pretty useless
    SingleShot: { value: 1, command: '1' }
  };

  let bestAmmo =
    weaponPreference[
      []
        .concat(...myShips.map(s => s.Weapons))
        .filter(w => w.EnergyRequired <= state.PlayerMap.Owner.Energy)
        .sort((a, b) => weaponPreference[a.WeaponType].value - weaponPreference[b.WeaponType].value)
        .pop().WeaponType
    ];

  // take a chance at saving for bigger things
  let rollForCritical = Math.random() < 0.6;
  let ammoType = rollForCritical ? bestAmmo.command : '1';
  console.log('using ammo: ', ammoType);
  return ammoType;
}

function getNextSingleSpot(state) {
  // fresh cells next to hits
  let likelyHits = state.OpponentMap.Cells.filter(
    c =>
      !(c.Damaged || c.Missed) &&
      state.OpponentMap.Cells.find(n => n.Damaged && Math.abs(n.X - c.X) + Math.abs(n.Y - c.Y) < 2)
  );
  if (likelyHits && likelyHits.length) {
    let likelyHit = likelyHits[Math.floor(Math.random() * likelyHits.length)];
    return {
      x: likelyHit.X,
      y: likelyHit.Y,
      toString: function() {
        return `${this.x},${this.y}`;
      }
    };
  }
  // fall back on random

  return getRandomSpot(state.OpponentMap.Cells);
}

function getShieldPlacement(state) {
  const myShield = state.PlayerMap.Owner.Shield;

  if (!myShield.Active && myShield.CurrentRadius) {
    console.log('Shield time');
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
    // give war a chance
    if (bestSpot.protected > 1 && Math.random() < 0.3) {
      bestSpot.isGoodIdea = true;
      bestSpot.toString = function() {
        return `${this.x},${this.y}`;
      };
      return bestSpot;
    }
  }
  return { isGoodIdea: false };
}

function getRandomSpot(map) {
  // weight shielded cells higher, assuming the enemy isn't wasting them
  let options = map
    .filter(c => !(c.Damaged || c.Missed))
    .sort(
      (a, b) =>
        (b.ShieldHit - a.ShieldHit) * 2 * boardSize +
        getEmptyNeighbouringCells(b, map).length -
        getEmptyNeighbouringCells(a, map).length
    );
  let choice = 0;
  while (Math.random() > 0.9 && choice < options.length) {
    choice++;
  }

  return {
    x: options[choice].X,
    y: options[choice].Y,
    toString: function() {
      return `${this.x},${this.y}`;
    }
  };
}

function getEmptyNeighbouringCells(cell, map, distance = 1) {
  return map.filter(
    c => !(c.Missed || c.Damaged) && Math.abs(c.X - cell.X) + Math.abs(c.Y - cell.Y) <= distance
  );
}
