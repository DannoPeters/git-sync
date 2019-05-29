/User Configuration ***Both Repos MUST have local configuration***
var secretA = "Very$ecret$ecret"; //Secret for verifying WebHook from RepoA
var secretB = "AnotherVery$ecret$ecret"; //Secret for verifying WebHook from RepoB
var gitA = "DannoPeters/Repo-A"; //Full repo name, used to identify Webhook Sender
var gitB = "DannoPeters/Repo-B"; //Full repo name, used to identify Webhook Sender
var repoA = "/run/media/peters/Danno_SuperDARN/Git_Projects/Repo-A"; //location of repo-A on server
var repoB = "/run/media/peters/Danno_SuperDARN/Git_Projects/Repo-B"; //location of repo-b on server
var gitSync = "/run/media/peters/Danno_SuperDARN/Git_Projects/Git-Sync-NodeJS"; //Location of Git-Sync.js on server
const port = 8080; //specify the port for the server to listen on
var dirA = "hdw.dat/" //directory to copy files from in repo-A
var dirB = "hardware_dir"; //directory to copy files to in repo-B
var user = "DannoPeters"; //set the github username of the server (configured using ssh)

var actionArray = new Array(); //Array to store information about actions taken

//Import Required
let http = require(`http`); //import http library
let crypto = require(`crypto`); //import crypto library
//let ngrok = require(`ngrok`); //include ngrok to allow through firewall
//let fetch = require(`node-fetch`) //include fetch so ngrok settings JSOn can be fetched
var execSync = require(`child_process`).execSync; //include child_process library so we can exicute shell commands
var fs = require("fs"); //required to write to files
const dns = require('dns'); //required to resolve domain name for log file

log(`ALL`, `INIT: Testing Program Started`, 0, '\n');

//set maximum random delay times for pushes
var days = 0;
var hours = 0;
var minutes = 0;
var seconds = 10;
var ms = 60;


/* runCmd
    Purpose: runs commands in synchronus (serial) terminal 

    Inputs:     cmd - command to be run, string

    Wait it does:
        - log command to be exicuted
        - tries to execute command
            - catch will log error and exit gracefully

    Returned: None

    Passes: none
*/
function runCmd(cmd) {
    log(`OP`, `SYNC: Exicuted ${cmd}`, 2);

    try{ 
        execSync(`${cmd}`); 
    }
    catch(error){
        log(`ALL`, `ERROR: Terminal Command Failed: ${error}`, 2);
        return;
    }
}


/* log
    Purpose: create and write data to log files on server

    Inputs:     stream - the log file which should be written to
                message - string to be written tot eh log file
                level - indent level of the text to be added
                prefix - prefix to be placed infront of the log message

    Wait it does:
        - writes to log files with data and time (UTC) and specifed message

    Returned:   none

    Passes:     none
*/
function log (stream, message, level, prefix){
    prefix = prefix || '';
    var today = new Date();
    var operation = fs.createWriteStream(`./hdw.Git-Sync_${today.getUTCFullYear()}_Operation.log`, {flags:'a'});
    var error = fs.createWriteStream(`./Git-Sync_${today.getUTCFullYear()}_Error.log`, {flags:'a'});

    var date = `${today.getUTCDate()}/${(today.getUTCMonth()+1)}/${today.getUTCFullYear()}`;
    var time = `${(today.getUTCHours())}:${(today.getUTCMinutes())}:${today.getUTCSeconds()}:${today.getUTCMilliseconds()}`;

    switch (stream){
        case 'OP':
            operation.write(`${prefix}${date} ${time} UTC${new Array(level*5+1).join(' ')}    ${message}\n`);
            operation.end();
            break;

        case 'ER':
            error.write(`${prefix}${date} ${time} UTC${new Array(level*5+1).join(' ')}    ${message}\n`);
            error.end();
            break;

        case 'ALL':
            error.write(`${prefix}${date} ${time} UTC${new Array(level*5+1).join(' ')}    ${message}\n`);
            operation.write(`${prefix}${date} ${time} UTC${new Array(level*5+1).join(' ')}    ${message}\n`);
            error.end();
            operation.end();
            break;

        default:
            break;

    }
    
    }


/* doSomething
    Purpose: comples pushes to repoA at random intervals to test GitSync.js

    Inputs: none

    Wait it does:
        - does nothing for random amount of time (with set max)
        - edits log file with hdw in name
        - commits and pushes edits to repoA

    Returned: None

    Passes: none
*/
    function doSomething() {
    var d = new Date(),
        h = new Date(d.getFullYear(), d.getMonth(), d.getDate()+ Math.random( )*days, d.getHours() + Math.random( )*hours, d.getMinutes() + Math.random( )*minutes, d.getSeconds() + Math.random( )*seconds, Math.random( )*ms),
        e = h - d;
    if (e > 100) { // some arbitrary time period
        setTimeout(doSomething, e);
    }

    //Pull from github repoB to local repo
    var cmd = `cd ${repoA} && git pull`;
    runCmd(cmd);

    //edit log file posing as hardware file
    log(`ALL`, `Sending New Test File`, 2, '\n'); 
    console.log(`Sending New Test File`);

    //add all files to git
    var cmd = `cd ${repoA} && git add --all`;
    runCmd(cmd);

    //Commit changes to local repoB with message from GitHub repo
    var today = new Date();
    var cmd = `cd ${repoA} && git commit -m "Test of Git-Sync at ${today.getUTCDate()}/${(today.getUTCMonth()+1)}/${today.getUTCFullYear()} ${(today.getUTCHours())}:${(today.getUTCMinutes())}:${today.getUTCSeconds()} UTC"`;
    runCmd(cmd);

    //Push local repoB to GitHub
    var cmd = `cd ${repoA} && git push`;
    runCmd(cmd);
}


/* While(1) infinite loop
    Purpose: calls donothing repeatedly to continue causing pushes to repoA at random intervals.

    Inputs: none

    Wait it does:
        - calls doNothing() a lot

    Returned: None

    Passes: none
*/
while (1){
	doSomething();
}
