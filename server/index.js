//======================================================
// File: server.js
// 
// Author: Magnus Persson
// Date: 2014-01-31
//======================================================
//======================================================
// Configuration
//======================================================
var version = "0.1";
var port = 8000;

//======================================================
// Initialization
//======================================================
var server = require("http");

server = server.createServer(Handler);
var fs = require("fs");
var path = require("path");
var logger = require('util');
var sys = require('util');
server.listen(port);

console.log("===================================");
console.log("Author: nergal");
console.log("Version: "+version);
console.log("===================================");
logger.log("Started server on port "+port);

//======================================================
//
// Server only stuff
//
//======================================================
// Socket handler
function SocketHandler(socket, data) {
    var ip = socket.handshake.address;
    logger.log("Incoming connection from "+ip.address+":"+ip.port);
}

const shouldServeFile = () => {

};

//======================================================
//
// Handler for web requests (webserver)
//
//======================================================
function Handler(req, res)
{                     
    //console.log("REQUEST: "+req.url);
    var file = ".." + req.url;
    if(file === "../") {
        file = "../index.html";
    }
    var name = path.extname(file);
    var contentType = "text/html";
    switch(name) {
    case '.html':
    case '.htm':
        contentType = 'text/html';
        break;
    case '.js':
        contentType = 'text/javascript';
        break;
    case '.css':
        contentType = 'text/css';
        break;
    case '.png':
        contentType = 'image/png';
        break;
    case '.jpg':
        contentType = 'image/jpg';
        break;
    }

  const file2 = '../dist/'+req.url;

  const legacyExists = fs.existsSync(file);
  const bundledExists = fs.existsSync(file2);

  if (!legacyExists && !bundledExists) {
    console.log("File not found:" + file);
    if(contentType != undefined) {
        res.writeHead(404, {'Content-Type': contentType});
        res.end("Wizard killed the requested file with a Fireball! R.I.P "+file);
    }
  } else if (legacyExists) {
    console.log("Legacy file: "+file);
    fs.readFile(file,function(err,data) {
        console.log("CONTENT: ",contentType);
        if(contentType != undefined) {
            res.writeHead(200, {'Content-Type': contentType});
        } else {
            res.writeHead(200);
        }
        res.end(data);
    });
  } else if (bundledExists) {
    console.log("Bundled file: "+file);
    fs.readFile(file2,function(err,data) {
        console.log("CONTENT: ",contentType);
        if(contentType != undefined) {
            res.writeHead(200, {'Content-Type': contentType});
        } else {
            res.writeHead(200);
        }
        res.end(data);
    });
  }
}
