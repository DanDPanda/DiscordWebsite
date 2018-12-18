// include the express module
var express = require("express");

// create an express application
var app = express();

// helps in extracting the body portion of an incoming request stream
var bodyparser = require("body-parser");

// fs module - provides an API for interacting with the file system
var fs = require("fs");

// include the mysql module
var mysql = require("mysql");

// apply the body-parser middleware to all incoming requests
app.use(bodyparser());

const { exec } = require("child_process");
require('dotenv').config();

// Connect to the database
var database = mysql.createConnection({
  host: process.env.SQLHOST,
  user: process.env.SQLUSER,
  password: process.env.SQLPASS,
  database: process.env.SQLDB,
  pingInterval: 60000
});

// Connect to the DB
try {
  // Connect the database
  database.connect(err => {
    if (err) {
      throw err;
    }
    console.log("Connected to database");
  });
} catch (e) {
  setTimeout(function() {
    console.log("MariaDB is down.");
  }, 1000);
}

setInterval(function() {
  database.query("SELECT 1");
}, 3600000);

// server listens on port 9007 for incoming connections
app.listen(9007, () => console.log("Listening on port 9007!"));

// Listens to the git pushes
// Will pull without needing username and pass!
app.post("/payload", (req, res) => {
  let repNames = {
    "DiscordWebsite": "git -C ~/DiscordWebsite pull",
    "DiscordBot": "git -C ~/DiscordBot pull",
    "DiscordHost": "git -C ~/DiscordHost pull"
  }
  let rep = req.body.repository.name;
  console.log(
    req.body.pusher.name + " just pushed to " + req.body.repository.name
  );
  if (req)
  exec(repNames.rep, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Git pulled.");
    }
  });
});

// This is the default page
app.get("/", function(req, res) {
  res.status(200);
  res.sendFile(__dirname + "/client/html/tables.html");
});

// Creates the text for each row
function addRow(total, row) {
  return new Promise((resolve, reject) => {
    database.query(
      "SELECT * FROM trainer_pokemon WHERE trainer_id = ?;",
      [row.id],
      (err, now) => {
        resolve(
          "<tr>" +
            "<td align='center'><a href='player?id=" +
            row.id +
            "'>" +
            row.id +
            "</td>" +
            "<td align='center'>" +
            row.nickname +
            "</td>" +
            "<td align='center'>" +
            now.length +
            "/" +
            total +
            "</td>" +
            "<td align='center'>" +
            row.exp +
            "</td>" +
            "</tr>"
        );
      }
    );
  });
}

// Sends the information of each row to the text constructor
function addToTable(total, rows) {
  let table = "";
  return new Promise(async (resolve, reject) => {
    for (var i = 0; i < rows.length; i++) {
      await addRow(total, rows[i]).then(text => {
        table += text;
      });
    }
    resolve(table);
  });
}

// The main function to GET the list of players
app.get("/getListOfPlayers", function(req, res) {
  let total;
  database.query("SELECT * FROM pokemon", (err, amt) => {
    total = amt.length;
  });

  database.query("SELECT * FROM trainer", async function(err, rows, fields) {
    if (err) {
      throw err;
    } else {
      res.status(200);
      await addToTable(total, rows).then(text => {
        res.send(text);
      });
    }
  });
});

// Gets the individual player's page
app.get("/player", (req, res) => {
  res.sendFile(__dirname + "/client/html/solo.html");
});

// Gets the player's nickname
function getNickname(id) {
  return new Promise(async (resolve, reject) => {
    database.query("SELECT * FROM trainer WHERE id = ?", [id], (err, rows) => {
      resolve(rows[0].nickname);
    });
  });
}

// Gets the information for the pokemon that are owned
async function getOwned(req) {
  let nickname = "";
  await getNickname(req).then(text => {
    nickname = text;
  });
  return new Promise((resolve, reject) => {
    let text = "";
    let q = `SELECT tp.pokemon_number, p.name, p.img
        FROM trainer_pokemon tp, pokemon p, trainer t
        WHERE tp.TRAINER_ID = ?
        AND tp.TRAINER_ID = t.id
        AND tp.pokemon_number = p.number
        ORDER BY tp.pokemon_number;`;
    database.query(q, [req], (err, rows) => {
      for (var i = 0; i < rows.length; i++) {
        text +=
          "<tr><td align='center'><img src='" +
          rows[i].img +
          "'><br><b>" +
          rows[i].pokemon_number +
          ". " +
          rows[i].name +
          "</b></td></tr>";
      }
      resolve(nickname + "~!@" + text);
    });
  });
}

// Gets the informatino for the pokemon not owned.
function getNotOwned(req) {
  return new Promise((resolve, reject) => {
    let text = "";
    let q = `SELECT p.number, p.name, p.img
        FROM pokemon p
        WHERE NOT EXISTS
          (SELECT tp.pokemon_number
          FROM trainer_pokemon tp
          WHERE p.number = tp.pokemon_number
          AND tp.TRAINER_ID = ?)
        ORDER BY p.number;`;
    database.query(q, [req], (err, rows) => {
      for (var i = 0; i < rows.length; i++) {
        text +=
          "<tr><td align='center'><img src='" +
          rows[i].img +
          "'><br><b>" +
          rows[i].number +
          ". " +
          rows[i].name +
          "</b></td></tr>";
      }
      if (rows[0] == null) {
        resolve("~!@");
      } else {
        resolve("~!@" + text);
      }
    });
  });
}

// Main function to GET the player's pokemons
app.get("/getPlayerStats", async (req, res) => {
  let table = "";
  await getOwned(req.query.id).then(text => {
    table += text;
  });
  await getNotOwned(req.query.id).then(text => {
    table += text;
  });
  res.send(table);
});

// Gets the pokemon page
app.get("/pokemon", (req, res) => {
  res.sendFile(__dirname + "/client/html/pokemon.html");
});

// Gets the pokemon information
app.get("/getPokemon", (req, res) => {
  let table = "";
  database.query("SELECT * FROM pokemon", [req.query.id], (err, rows) => {
    for (var i = 0; i < rows.length; i++) {
      table +=
        "<tr><td><img src='" +
        rows[i].img +
        "'><br><b>" +
        rows[i].number +
        ". " +
        rows[i].name +
        "</b></td><td style='vertical-align:middle'><font size='5'><b>" +
        rows[i].time / 1000 +
        "<br>Seconds</font></b></td></tr>";
    }
    res.send(table);
  });
});

// Gets the output log page
app.get("/logs", (req, res) => {
  res.sendFile(__dirname + "/client/html/logs.html");
});

// Gets the past 100 output logs
app.get("/getLogs", (req, res) => {
  var content = fs.readFileSync(__dirname + "/../bot/log.txt", "utf8").split("\n");
  let table = "";
  if (content.length < 100) {
    for (var i = 0; i < content.length - 1; i++) {
      table += "<tr><td>" + content[i] + "</td></tr>";
    }
  } else {
    for (var i = 0; i < 100; i++) {
      table += "<tr><td>" + content[content.length - 101 + i] + "</td></tr>";
    }
  }
  res.send(table);
});

// middle ware to server static files
app.use("/client", express.static(__dirname + "/client"));

// function to return the 404 message and error to client
app.get("*", function(req, res) {
  res.send("Page is not found.", 404);
});
