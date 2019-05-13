/*step 1. detect Repo A push via webhook
step 2. get push commit message via webhook
step 3. git pull Repo A clone on server 
step 4. cp repo A clone to repo B clone /hardware_dir
step 5. git add /hardaware_dir
step 6. git commit -m repo A push commit message 
step 7. git push to repo B
Step 8. ??????
step 9. PROFIT $$$

*/


//User Configuration ***Both Repos MUST have local configuration***
var secret = "Very$ecret$ecret"; //Secret for verifying WebHook from Repo-A
var gitA = "DannoPeters/Repo-A" //Full repo name, used to identify Webhook Sender
var gitB = "DannoPeters/Repo-B" //Full repo name, used to identify Webhook Sender
var repoA = "/home/marina/Git_Projects/Repo-A"; //location of repo-A on server
var repoB = "/home/marina/Git_Projects/Repo-B"; //location of repo-b on server
const port = 8080 //specify the port for the server to listen on
var dir = "hardware_dir" //directory to copy files to in repo-B


//Import Required
let http = require(`http`); //import http library
let crypto = require(`crypto`); //import crypto library
//let ngrok = require(`ngrok`); //include ngrok to allow through firewall
//let fetch = require(`node-fetch`) //include fetch so ngrok settings JSOn can be fetched
const exec = require(`child_process`).exec; //include child_process library so we can exicute shell commands

/*
//Start ngrok connection, and print out URL. Will start a new server with each exicution
ngrok.connect(port, function (err, url) {
    c; 
});
*/

//Webserver Operation
http.createServer(function (req, res) { //create webserver
    req.on(`data`, function(chunk) {
        let sig = "sha1=" + crypto.createHmac(`sha1`, secret).update(chunk.toString()).digest(`hex`); //verify message is authentic (correct secret)
        
        if (req.headers['x-hub-signature'] == sig) {
        var githubWebHook = JSON.parse(chunk) //Parse the JSON datafile from the push

        var gitFullName = githubWebHook.repository.full_name; //full name of the repository
        var gitID = githubWebHook.repository.id; //ID of the repository
        var gitURL = githubWebHook.repository.html_url; //URL of the repository




        

        
    });

    res.end('');
}).listen(port, (err) => {
    if (err) return console.log(`Something bad happened: ${err}`);
    console.log(`Node.js server listening on ${port}`);



});
