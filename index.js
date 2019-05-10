var secret = "Very$ecret$ecret"; //Secret for verifying WebHook from Repo-A
var repo = "/run/media/peters/Danno_SuperDARN/Git_Projects/Repo-A"; //Adress of repo on server
const port = 8080

let http = require('http'); //import http library
let crypto = require('crypto'); //import crypto library
let ngrok = require('ngrok'); //include ngrok to allow through firewall
const exec = require('child_process').exec; //include child_process library so we can exicute shell commands

/* Create Webserver for port 8080
	Inputs: 
	Outputs:
	Result: If secret is validated local repo is updated using a pull request
	*/
http.createServer(function (req, res) {
    req.on('data', function(chunk) {
        let sig = "sha1=" + crypto.createHmac('sha1', secret).update(chunk.toString()).digest('hex');

        if (req.headers['x-hub-signature'] == sig) {
            console.log(`WebHook from push to Repo-A`);
            exec('cd ' + repo + ' && git pull');
        }
    });

    res.end('Repo-A Pull Attempted');
}).listen(port, (err) => {
    if (err) return console.log(`Something bad happened: ${err}`);
    console.log(`Node.js server listening on ${port}`);

    ngrok.connect(port, function (err, url) {
        console.log(`Node.js local server is publicly-accessible at ${url}`);
    });

});