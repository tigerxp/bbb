var app = require('http');
var fs = require('fs');
var b = require('bonescript');
var serialport = require("serialport");
var dot = require("dot");

const PORT = 8088;

const LOW_LIMIT = 62;
const HIGH_LIMIT = 85;

var prev_temp = 0;
var temp = 0;
var lastSync = '';

var tpl = fs.readFileSync('index.html', 'utf8');
var template = dot.template(tpl);

app = app.createServer(function(req, res) {
    if (req.url == "/favicon.ico") { // handle requests for favico.ico
        res.writeHead(200, {'Content-Type': 'image/x-icon'} );
        res.end();
        console.log('favicon requested');
        return;
    }
    if (req.url == '/api') {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({temp: temp, lastSync: lastSync}));
        return;
    }
    var cls;
    if (temp > prev_temp) {
        cls = "hotter";
    } else if (temp < prev_temp) {
        cls = "colder";
    } else {
        cls = (temp < LOW_LIMIT || temp > HIGH_LIMIT) ? "alert" : "";
    }
    res.writeHead(200);
    res.end(template({
        temp: temp,
        lastSync: lastSync,
        cls: cls,
        low: LOW_LIMIT,
        high: HIGH_LIMIT
    }));
});

Date.prototype.today = function () {
    return this.getFullYear() + '-' + ((this.getDate() < 10)?"0":"") + this.getDate() +"-"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1);
}
Date.prototype.timeNow = function () {
    return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}

app.listen(8088);
console.log('Listening on port: ', PORT);

var sp = new serialport.SerialPort("/dev/ttyUSB0", {
    baudRate: 57600,
    parser: serialport.parsers.readline("\n")
});

var re = /temperature:\s+(.*)\s+\(/i;
sp.on("data", function (data) {
    found = data.match(re);
    if (found) {
        prev_temp = temp;
        temp = parseFloat(found[1]);
        lastSync = new Date().today() + " @ " + new Date().timeNow();
        console.log("Got temperature: ", temp);
    }
});
