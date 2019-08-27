/*
Git-Sync.js
    JavaScript Script to synchronize two remote GitHub repos (Master to Slave)

Copyright SuperDARNCanada
Authors: Marina Schmidt and Danno Peters
*/

//Global Variables
var actionArray = new Array(); //Array to store information about actions taken
var today = new Date();
var startTime = `${today.getUTCDate()}/${(today.getUTCMonth()+1)}/${today.getUTCFullYear()} ${(today.getUTCHours())}:${(today.getUTCMinutes())}:${today.getUTCSeconds()} UTC`;
var lastSync = 'Never';
var lastModified = 'None';
var lastAdded = 'None';
var lastRemoved = 'None';
var lastCommit = 'None';

var radar_abbrev = 'sas';

//Import Required
let http = require(`http`); //import http library
let crypto = require(`crypto`); //import crypto library
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest
var execSync = require(`child_process`).execSync; //include child_process library so we can exicute shell commands
var fs = require("fs"); //required to write to files
const dns = require('dns'); //required to resolve domain name for log file
//const Octokit = require('octokit/rest') //required to generate oAuth token to generate pull requests from github API
var config = require('./git-sync_config.js');
//console.log(`${config.Auth.personal_access_token}`)


/* Webserver
    Purpose: Creates a webserver in order to recieve websocket requests

    Inputs:     req - object containing http request event
                res - object containing server responce event

    Wait it does:
        - Record request in log file
        - Verify the JSON is authentic using the secret
            - call githubwebHook function if it is an authentic request
            - otherwise record error and keep listening

    Returned: None

    Passes:     chunk - JSON file sent to web server
                req - the request event object
*/
http.createServer(function (req, res) { //create webserver
    req.on(`data`, function(chunk) {

        //Grab source IP and soscket for log file, multiple methods used for diffrently formatted requests
        var jsonIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
        var jsonPort = req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
        
        log(`OP`, `NEW OPERATION: File Recieved from ${jsonIP}${jsonPort}`, 1, '\n');

        let sigA = "sha1=" + crypto.createHmac(`sha1`, config.Auth.secretA).update(chunk.toString()).digest(`hex`); //verify message is authentic (correct secret)
        let sigB = "sha1=" + crypto.createHmac(`sha1`, config.Auth.secretB).update(chunk.toString()).digest(`hex`); //verify message is authentic (correct secret)
        
        if (req.headers[`x-hub-signature`] == sigA) {
            log(`OP`, `JSON: WebHook ${config.Setup.gitA} Signature Verified: ${sigA}`, 2);
            githubHook(chunk,req);
        } else if (req.headers[`x-hub-signature`] == sigB) {
            log(`OP`, `JSON: WebHook ${config.Setup.gitB} Signature Verified: ${sigB}`, 2);
            githubHook(chunk,req);
        } else {
            var signature = req.headers[`x-hub-signature`];
            log(`ALL`, `ERROR: Incorrect Signature: ${signature}`, 2);
        }
         });
    console.log("HTML Running");
    res.write(`<html><center><h3>If you are reading this, git-sync.JS is running. :-)</h3> </html></br><img src="https://res.cloudinary.com/dwktbavf8/image/upload/v1524441964/SuperDARN/superDARN-logo.png" alt="SuperDarn Logo"></html></br>Copyright: SuperDARN Canada <br><a href="https://superdarn.ca">SuperDARN.ca</a> <br><br>Authors: Marina Schmidt and Danno Peters <br><br><br> <strong>Git-Sync.JS Settings</strong><br><u>Remote</u><br> Repo A: <i>${config.Setup.gitA}/${config.Setup.dirA}</i><br> Repo B: <i>${config.Setup.gitB}/${config.Setup.dirB}</i><br><br><u>Settings</u><br> Contains: <i>${config.Setup.nameContains}</i>    Deliminator: <i>${config.Setup.typeDeliminator}</i>    Position: <i>${config.Setup.typePosition} <br><br><u>Local</u><br> Repo A: <i>${config.Setup.repoA}</i><br> Repo B: <i>${config.Setup.repoB}</i> <br><br> Server User: <i>${config.Setup.user}</i> <br><br> Running Since: <i>${startTime}</i><br><br> Last Sync: <i>${lastSync}</i> <br> Last Commit: <i>${lastCommit}</i><br> <u>Last Modified</u> <br><i>${lastModified}</i><br> <u>Last Added</u> <br><i>${lastAdded}</i><br> <u>Last Removed</u> <br><i>${lastRemoved}</i>`)
    res.end('');

}).listen(config.Setup.port, (err) => {
    if (err) return log(`ALL`, `\n ERROR: Issue with init of server: ${err}`, 0);
    log(`ALL`, `INIT: Node.js server listening on ${config.Setup.port}`, 0, '\n');


});

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

/* githubJSON
    Purpose: creates a linked list of all important information from JSON

    Inputs:     file - the JSOn file sent from the webhook
                event - type of github event (important since JSON formatting is diffrent for each)

    Wait it does:
        - parces json file into githubWebHook variable
        - tries to store data in repo based on webhook event
            - catch logs error message and exists gracefully with no return
            - otherwise returns repo

    Returned:   repo - linked list of important informationf fromt the recieved JSON

    Passes: none
*/
function githubJSON(file, event) {
    var githubWebHook = JSON.parse(file); //Parse the JSON datafile from the push
    switch(event){

        case "push":
            
            try{ //Test if push formatting is correct.
            var repo = {
                gitFullName: githubWebHook.repository.full_name, //full name of the repository
                gitID: githubWebHook.repository.id, //ID of the repository
                gitURL: githubWebHook.repository.html_url, //URL of the repository
                modifiedFiles: githubWebHook.commits[0].modified, //Create list of files modified in Push
                addedFiles: githubWebHook.commits[0].added, //Create list of files added in Push
                removedFiles: githubWebHook.commits[0].removed, //Create list of files removed in Push
                commitMessage: githubWebHook.commits[0].message, //Read commit message for use in push to repo-B
                username: githubWebHook.commits[0].author.username, //User which pushed the files
                finalCommitMessage: ""
            }
        }
            catch(error) {
                log(`OP`, `JSON: Push Data Formatting Incorrect ${error}`, 2);
            return;
            };
        
            

        default:
        break;
        }

    return repo;
}


/* githubHook
    Purpose: based on github event and source repo runs diffrent code for syncing and sync confirmation

    Inputs:     chunk - JSON file sent to web server
                req - object containing http request event

    Wait it does:
        - if push webhook from repoA
            - check if user other than this server
            - git pull RepoA and repoB on server
            - cp repo A clone to repo B clone
            - git add repoB
            - git commit -m repo A push commit message
            - git push to repo B

        - if push webhook from repoB
            - check that user pushing is this server
            - check that same file names added, modified, or removed were edited on push
            - check that commit message is correct

    Returned: none

    Passes: cmd - commands to be exicited by runCmd
            chunk - JSON file to be pased into linked list (repo) by githubJSON function
            req.headers['x-github-event'] - event type specified in server request passed to githubJSON to place proper variabel sinto linked list
            commitedFiles - list of all added, modified, or removed git files sent to fileType to confirm specified type of file to trigger sync, and fileLoc to ensure specified location to trigger sync
            repo - sorted linked list of JSON data sent to queue to confirm with webhook from repoB
*/
function githubHook(chunk, req) {
    //Test if file has GitHub Event info
        try {
        repo = githubJSON(chunk,req.headers['x-github-event']);
        }
        catch (error) {
           log(`OP`, `JSON: GitHub Data Formatting Incorrect ${error}`, 2);
        return;
        }

        if (req.headers['x-github-event'] == "push") { //if event type is push run following code
        switch (repo.gitFullName){

            case config.Setup.gitA: //sync to repo B

                    if (repo.username == config.Setup.user) { //confirm push is not from this server (to prevent push loop)
                        log(`OP`, `JSON: GitHub user "${repo.username}" (This Server) pushed to ${repo.gitFullName}`, 2);
                        log(`OP`, `JSON: No further action will be taken (Prevents accidental push loop)`, 2);
                    } else {
                        log(`OP`, `JSON: GitHub user "${repo.username}" pushed to ${repo.gitFullName}`, 2);

                    //Pull from github repoA to local repo
                    var cmd = `cd ${config.Setup.repoA} && git pull origin ${config.Setup.repoA_branch}`;
                    runCmd(cmd);

                   //Pull request for repoB
                    var cmd = `cd ${config.Setup.repoB} && git pull origin ${config.Setup.repoB_branchA}`;
                    runCmd(cmd);

                    radar_abbrev = repo.modifiedFiles[0].split('.')[2]
                    console.log(radar_abbrev)
                    //Create new branch and switch to it for repo B
                    var cmd = `cd ${config.Setup.repoB} && git checkout -b ${radar_abbrev}_dev`
                    runCmd(cmd);


                    var type = `hdw`;
                    var commitedFiles = repo.modifiedFiles.concat(repo.addedFiles);
                    if (fileType(commitedFiles, config.Setup.nameContains, config.Setup.typePosition, config.Setup.typeDeliminator) && fileLoc(commitedFiles, `${config.Setup.dirA}`)) {
                    
                    //Copy only commited Files by using file paths of each file 
                    for (filePath in commitedFiles){
                        splitFilePath = commitedFiles[filePath].split('/');
                        var copyPath = '';
                        for (var i=0; i < splitFilePath.length-1; i++){
                            copyPath = copyPath.concat(`${splitFilePath[i]}/`);
                        }

                        try {
                        var cmd = `cp ${config.Setup.repoA}/${commitedFiles[filePath]} ${config.Setup.repoB}/${config.Setup.dirB}/${copyPath} -a`;
                         log(`OP`, `SYNC: Exicuted ${cmd}`, 2);
                         execSync(`${cmd}`); 
                    }
                    catch (unlogged_error) { //error is not logged as expected in normal operation whne new folder is pushed to git
                        try { //if copying each file directly fails (ie new folder created) then recursively sync whole directory
                            log(`ALL`, `ERROR: Copy Command failed, Attempting to recursive copy directory`, 2);
                            var cmd = `cp ${config.Setup.repoA}/${config.Setup.dirA} ${config.Setup.repoB}/${config.Setup.dirB} -a`;
                            log(`OP`, `SYNC: Exicuted ${cmd}`, 2);
                            execSync(`${cmd}`); 
                        }
                        catch (error) {
                            log(`ALL`, `ERROR: Recursive copy failed: ${error}`, 2);
                        }

                    }
                    }

                    //add all files to git
                    var cmd = `cd ${config.Setup.repoB} && git add --all`;
                    runCmd(cmd);

                    //Commit changes to local repoB with message from GitHub repo
                    var cmd = `cd ${config.Setup.repoB} && git commit -m "User: ${repo.username}   Message: ${repo.commitMessage}"`;
                    repo.finalCommitMessage = `User: ${repo.username}   Message:${repo.commitMessage}`;
                    runCmd(cmd);

                    //Push local repoB to GitHub
                    var cmd = `cd ${config.Setup.repoB} && git push origin ${radar_abbrev}_dev`;
                    runCmd(cmd);

                    //delete local repo B branch after push **Blocked by git
                    //var cmd = `cd ${config.Setup.repoB} && git branch -d ${radar_abbrev}_dev`;
                    //runCmd(cmd);

                    //Store information to confirm proper push to repo B
                    //sort all lists of files to ensure they are comapred correctly
                    repo.modifiedFiles = repo.modifiedFiles.sort();
                    repo.addedFiles = repo.addedFiles.sort();
                    repo.removedFiles = repo.removedFiles.sort();
                    queueAdd(actionArray, repo)

                //leave discriptive log detailing which test for files to sync failed
                } else  if (fileType(commitedFiles, config.Setup.nameContains, config.Setup.typePosition, config.Setup.typeDeliminator)){
                    log(`OP`, `SYNC: Only changes to files of type "${type}" found outside of ${config.Setup.gitA}/${config.Setup.dirA}`, 2);
                    log(`OP`, `SYNC: No Push to ${config.Setup.gitB} Required`, 2);
                } else  if (fileLoc(commitedFiles, `${config.Setup.dirA}`)){
                    log(`OP`, `SYNC: No changes to files of type "${type}" found in push`, 2);
                    log(`OP`, `SYNC: No Push to ${config.Setup.gitB} Required`, 2);
                } else {
                    log(`OP`, `SYNC: No changes to files of type "${type}" AND no chnges found in ${config.Setup.gitA}/${config.Setup.dirA}`, 2);
                    log(`OP`, `SYNC: No Push to ${config.Setup.gitB} Required`, 2);
                }
            }
                
                break;

            case config.Setup.gitB: //Verify that push to repo B was correct
                    try{

                    if (repo.username != config.Setup.user) { //ensure push came from this server (to prevent falase positives)
                        log(`OP`, `JSON: GitHub user "${repo.username}" pushed to ${repo.gitFullName}`, 2);
                        log(`OP`, `JSON: No further action required (prevents false push confirm)`, 2);
                    } else {
                        log(`OP`, `JSON: GitHub user "${repo.username}" (This Server) pushed to ${repo.gitFullName}`, 2);

                     //sort all lists of files to ensure they are comapred correctly
                     repo.modifiedFiles = repo.modifiedFiles.sort();
                     repo.addedFiles = repo.addedFiles.sort();
                     repo.removedFiles = repo.removedFiles.sort();
                     
                     if (repo.modifiedFiles != ""){
                        lastModified = repo.modifiedFiles
                    } else {
                        lastModified = "None"
                    }

                    if (repo.addedFiles != ""){
                        lastAdded = repo.addedFiles
                    } else {
                        lastAdded = "None"
                    }

                    if (repo.removedFiles != ""){
                        lastRemoved = repo.removedFiles
                    } else {
                        lastRemoved = "None"
                    }
       
                     lastCommit = repo.commitMessage

                     console.log("Made it");

                    //retrieve past repo data from queue
                    var pastRepo = queueGet(actionArray);
                    pullReq(pastRepo, `${radar_abbrev}_dev`)
                    //Check all added, modified, and deleted files match those in last push to repo B and commit is correct
                    var testModified = checkFiles(repo.modifiedFiles, pastRepo.modifiedFiles, '/');
                    var testAdded = checkFiles(repo.addedFiles, pastRepo.addedFiles, '/');
                    var testRemoved = checkFiles(repo.removedFiles, pastRepo.removedFiles, '/');
                    var testCommit = (repo.commitMessage == pastRepo.finalCommitMessage);
                    
                    //Write to log file confirming sucesses and errors
                    // only prints one message if sucessful, otherwise details which tests passed and which failed
                    if (testModified && testAdded && testRemoved && testCommit) {
                        log(`OP`, `CONFIRM: Git Sync between ${config.Setup.gitA} and ${config.Setup.gitB} was sucessful :-)`, 2);
                        //Since push was sucessful start a pull request

                        
                    }  else {
                    if (testModified == true){
                        log(`OP`, `CONFIRM: Git Sync between ${config.Setup.gitA} and ${config.Setup.gitB} modified files was sucessful`, 2);
                    } else {
                        log(`ALL`, `ERROR: Git Sync between ${config.Setup.gitA} and ${config.Setup.gitB} modified files synced incorrectly`, 2);
                    }
                    if (testAdded == true){
                        log(`OP`, `CONFIRM: Git Sync between ${config.Setup.gitA} and ${config.Setup.gitB} added files was sucessful`, 2);
                    } else {
                        log(`ALL`, `ERROR: Git Sync between ${config.Setup.gitA} and ${config.Setup.gitB} added files synced incorrectly`, 2);
                    }
                    if (testRemoved == true){
                        log(`OP`, `CONFIRM: Git Sync between ${config.Setup.gitA} and ${config.Setup.gitB} removed files was sucessful`, 2);
                    } else {
                        log(`ALL`, `ERROR: Git Sync between ${config.Setup.gitA} and ${config.Setup.gitB} removed files synced incorrectly`, 2);
                    }
                    if (testCommit == true){
                        log(`OP`, `CONFIRM: Git Sync between ${config.Setup.gitA} and ${config.Setup.gitB} commit was sucessful`, 2);
                    } else {
                        log(`ALL`, `ERROR: Git Sync between ${config.Setup.gitA} and ${config.Setup.gitB} commit is incorrect`, 2);
                    } 
                }
                
                }
                //Update date and time of last sync
                var today = new Date();
                lastSync = `${today.getUTCDate()}/${(today.getUTCMonth()+1)}/${today.getUTCFullYear()} ${(today.getUTCHours())}:${(today.getUTCMinutes())}:${today.getUTCSeconds()} UTC`;
                }
                catch(error){
                    log(`ALL`, `ERROR: ${config.Setup.gitB} push confirmation failed: ${error}`, 2);
                    return;
                }
                
                break;

            default:
                log(`ALL`, `ERROR: Source "${repo.gitFullName}" Not Recognized`, 2);
            break;
        }

        }
    }


/* queueAdd
    Purpose: adds value to a specifed queue

    Inputs:     queue - the queue to send the value to
                value - the value to be sent to the queue

    Wait it does:
        - pushes value to specified queue
            - logs push to queue

    Returned:   none

    Passes: value - pushes to stack
*/
function queueAdd(queue, value) {
 queue.push(value);
 log(`OP`, `STACK: previos repo data pushed to queue`, 2);

}
 

/* queueGet
    Purpose: retrieves a value from specified queue

    Inputs:     queue - the queue to send the value to
                value - the value to be sent to the queue

    Wait it does:
        - retrieves data from specified queue
            - returns value and logs retreval

    Returned:   retrievedQueueValue - value retrieved from queue

    Passes:     none
*/
function queueGet(queue) {
    var retrievedQueueValue = queue.shift();
    if(retrievedQueueValue) {
        log(`OP`, `STACK: previos repo data retrieved from queue`, 2);
       return retrievedQueueValue;
    }
    else {
        log(`ALL`, `ERROR: STACK: no data to be retrieved from queue`, 2);
       return null;
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
    var operation = fs.createWriteStream(`./git-syncJS_Log-Files/git-syncJS_${today.getUTCFullYear()}_Operation.log`, {flags:'a'});
    var error = fs.createWriteStream(`./git-syncJS_Log-Files/git-syncJS_${today.getUTCFullYear()}_Error.log`, {flags:'a'});

    var date = `${today.getUTCDate()}/${(today.getUTCMonth()+1)}/${today.getUTCFullYear()}`;
    var time = `${(today.getUTCHours())}:${(today.getUTCMinutes())}:${today.getUTCSeconds()}`;

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


/* arraySplit 
    Purpose: create and write data to log files on server

    Inputs:     array - array of strings to be split
                char - the char to split the strings by

    Wait it does:
        - splits each string in an array into susequent strings
            - returns each split string as a sub array of the main array

    Returned:   array1 - array of sub arrays containing each split string

    Passes:     none
*/
function arraySplit (array, char) {
    var array1 = new Array(array.length);
    if ((undefined === array)){ //check if array in undefined
        return array1
    } else {
        var i = 0;
        for (element in array) {
                        var split = array[element].split(char);  // just split once
                        array1[i] = split; //push to nested array
                        i++;
                    }
        return array1
    }
}


/* fileType 
    Purpose: check the type of file

    Inputs:     repo - linked list of information from github JSON
                file - string to recognize file by
                rank - rank in the file name to find file string
                char - delimiting char between ranks

    Wait it does:
        - writes to log files with data and time (UTC) and specifed message

    Returned:   True - if file of specified type is found
                False - if no files of specified type are found

    Passes:     none
*/
function fileType (repo, file, rank, char){
    var modified = arraySplit(repo, '/');
    //check modified files
    for (F in modified){
        fileName = modified[F][modified[F].length-1];
        if (char == "none"){
            if (fileName.includes(file)){
                return true;
            }
        } else {
        var split = fileName.split(char);
        if (rank == "any"){
            for (let i = 0; i < split.length; i++){
                if  (split[i] == file){
                return true;
            }
        }
        } else {
            if  (split[rank] == file){
                return true;
        }
        }
    }
        
    }
    return false;
}



/* checkFiles 
    Purpose: checks if two file names/paths are the same

    Inputs:     A - First file name/path to check
                B - Second file name/path to compare to first
                char - char to split file names by (usually '/')

    Wait it does:
        - writes to log files with data and time (UTC) and specifed message

    Returned:   none

    Passes:     none
*/
function checkFiles (A,B,char){
    splitA = arraySplit(A, char);
    splitB = arraySplit(B, char);
    var test = true;
    for (F in splitA){
        fileNameA = splitA[F][splitA[F].length-1];
        fileNameB = splitB[F][splitB[F].length-1];
        if  (fileNameA != fileNameB){
            log(`ALL`, `ERROR: File ${fileNameA} in ${config.Setup.gitA} does not match ${fileNameB} in ${config.Setup.gitB}`, 2);
            test = false;
            }
        }
    return test
}


/* fileLoc
    Purpose: checks if any of listed files are in specifed folder

    Inputs:     files - list of files synced to repoB
                location - location where thay should have been place in repoB

    Wait it does:
        - splits up both locations of each file and specified location using array split
            - returns true if any of the files are found to be in the specifdied location

    Returned:   True - if all files are in correct location

    Passes:     files - to array split to divide up file path
*/
function fileLoc (files, location){
    if (location == ""){
        return true;
    } else {
    var splitLocation = location.split('/');
    var fileLocations = arraySplit(files, '/');
    for (F in fileLocations){
        for (var i = 0; i < splitLocation.length; i++) {
            if (splitLocation[i] == fileLocations[F][i]){
                return true;
            }
        }
    } }
    return false;
}

/* pullReq
    Purpose: creates a pull request from synced branch to specified branch (usually dev or main)

    Inputs:     files - list of files synced to repoB
                location - location where thay should have been place in repoB

    Wait it does:
        - splits up both locations of each file and specified location using array split
            - returns true if any of the files are found to be in the specifdied location

    Returned:   True - if all files are in correct location

    Passes:     files - to array split to divide up file path
*/
function pullReq (pastRepo, branch){
    console.log(`Starting Pull Request`);
    var pullJSON = new Object();
    console.log(pastRepo.finalCommitMessage)
    pullJSON.title = `${pastRepo.finalCommitMessage}`;
    pullJSON.head = `${branch}`;
    pullJSON.base = `${config.Setup.repoB_branchB}`;
    pullJSON.body = `Modified:${pastRepo.modifiedFiles}`;
    pullJSON.maintainer_can_modify = true;
    var jsonString = JSON.stringify(pullJSON);
    console.log(`${jsonString}`)
    log(`OP`, `JSON: pull request JSON generated`, 2);
    let request = new XMLHttpRequest();
    request.open('POST', `https://api.github.com/repos/${config.Setup.gitB}/pulls?access_token=${config.Auth.personal_access_token}`);
    request.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    request.send(jsonString);
    console.log(`https://api.github.com/repos/${config.Setup.gitB}/pulls?access_token=${config.Auth.personal_access_token}`)
    log(`OP`, `JSON: pull request JSON sent to https://api.github.com/repos/${config.Setup.gitB}/pulls`, 2);
    console.log('Pull Request Sent');

}