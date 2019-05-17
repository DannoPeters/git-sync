/*step 1. detect Repo A push via webhook              :-)
step 2. get push commit message via webhook           :-)
step 3. git pull Repo A clone on server               :-)
step 4. cp repo A clone to repo B clone /hardware_dirB :-)
step 5. git add /hardaware_dirB                        :-)
step 6. git commit -m repo A push commit message      :-)
step 7. git push to repo B                            :-)
Step 8. ??????
step 9. PROFIT $$$

*/

//User Configuration ***Both Repos MUST have local configuration***
var secret = "Very$ecret$ecret"; //Secret for verifying WebHook from Repo-A
var gitA = "DannoPeters/Repo-A"; //Full repo name, used to identify Webhook Sender
var gitB = "DannoPeters/Repo-B"; //Full repo name, used to identify Webhook Sender
var repoA = "/run/media/peters/Danno_SuperDARN/Git_Projects/Repo-A"; //location of repo-A on server
var repoB = "/run/media/peters/Danno_SuperDARN/Git_Projects/Repo-B"; //location of repo-b on server
var gitSync = "/run/media/peters/Danno_SuperDARN/Git_Projects/Git-Sync-NodeJS"; //Location of Git-Sync.js on server
var gitWeb = "git@github.com:";
const port = 8080; //specify the port for the server to listen on
var dirA = "" //directory to copy files from in repo-A
var dirB = "hardware_dir"; //directory to copy files to in repo-B

var actionArray = new Array(); //Array to store information about actions taken


//Import Required
let http = require(`http`); //import http library
let crypto = require(`crypto`); //import crypto library
//let ngrok = require(`ngrok`); //include ngrok to allow through firewall
//let fetch = require(`node-fetch`) //include fetch so ngrok settings JSOn can be fetched
var execSync = require(`child_process`).execSync; //include child_process library so we can exicute shell commands
var fs = require("fs"); //required to write to files




//Webserver OP
http.createServer(function (req, res) { //create webserver
    req.on(`data`, function(chunk) {
        log(`OP`, `JSON: File Recieved`, 0);
        let sig = "sha1=" + crypto.createHmac(`sha1`, secret).update(chunk.toString()).digest(`hex`); //verify message is authentic (correct secret)
        if (req.headers[`x-hub-signature`] == sig) {
            log(`OP`, `JSON: Signature Verified`, 1);
            githubHook(chunk,req);
        } else {
            var signature = req.headers[`x-hub-signature`];
            log(`OP`, `ERROR: Incorrect Signature: ${signature}`, 1);
            log(`OP`, `ERROR: Incorrect Signature: ${signature}`, 1);
        }
         });

    res.end('');
}).listen(port, (err) => {
    if (err) return log(`OP`, `ERROR: Issue with server: ${err}`, 1);
    log(`OP`, `INIT: Node.js server listening on ${port}`, 1);


});

//runs coomands in synchronus (serial) terminal 
function runCmd(cmd) {
    log(`OP`, `SYNC: Exicuted ${cmd}`, 1);

    try{ 
        execSync(`${cmd}`); 
    }
    catch(error){
        log(`OP`, `ERROR: Terminal Command Failed: ${error}`, 2);
        return;
    }
}

//creates a linked list of all important information from JSON
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
                log(`OP`, `JSON: Push Data Formatting Incorrect ${error}`, 1);
            return;
            };
        
            

        default:
        break;
        }

    return repo;
}

/*
function mirrorRepo(repoA, repoB, repo) {
    var addedFolders = repo.addedFiles.split("/");
    for (var folder in addedFolders){
        checkFolderA = `${repoB}/${folder}`;
        checkFolderB = `${repoB}/${folder}`;
        if (checkFolder.exists == False){

        }
    }

}
*/

function githubHook(chunk, req) {
    //Test if file has GitHub Event info
        try {
        repo = githubJSON(chunk,req.headers['x-github-event']);
        }
        catch (error) {
           log(`OP`, `JSON: GitHub Data Formatting Incorrect ${error}`, 1);
        return;
        }

        if (req.headers['x-github-event'] == "push") { //if event type is push run following code
        switch (repo.gitFullName){

            case gitA: 

                    //Pull from github repoB to local repo
                    var cmd = `cd ${repoA} && git pull`;
                    runCmd(cmd);

                   //Pull request for repoB
                    //var cmd = `git pull ${gitWeb}${gitB}.git --allow-unrelated-histories`;
                    var cmd = `cd ${repoB} && git pull`;
                    runCmd(cmd);

                   /* //Copy all modified files to repoB
                    for (var file in repo.modifiedFiles) {
                        var cmd = `cp ${repoA}/${repo.modifiedFiles[file]} ${repoB}/${dirB}/${repo.modifiedFiles[file]} --recursive`;
                        runCmd(cmd);
                    }

                    //Copy all new files to repoB
                    for (var file in repo.addedFiles) {
                       var cmd = `cp ${repoA}/${repo.addedFiles[file]} ${repoB}/${dirB}/${repo.addedFiles[file]} --recursive`;
                       runCmd(cmd);
                    } */

                    
                    //Copy all files
                    var cmd = `cp ${repoA}/* ${repoB}/${dirB} --recursive`;
                    runCmd(cmd);

                    //add all files to git
                    var cmd = `cd ${repoB} && git add --all`;
                    runCmd(cmd);


                    //Commit changes to local repoB with message from GitHub repo
                    var cmd = `cd ${repoB} && git commit -m "User: ${repo.username} Message:${repo.commitMessage}"`;
                    repo.finalCommitMessage = `User: ${repo.username} Message:${repo.commitMessage}`;
                    runCmd(cmd);

                    //Push local repoB to GitHub
                    var cmd = `cd ${repoB} && git push`;
                    runCmd(cmd);

                    //Store information to confirm proper push to repo B
                    stackAdd(actionArray, repo)
                
                break;

            case gitB: //Verify that push to repo B was correct
                    try{
                    pastRepo = stackGet(actionArray),
                    testModified = (repo.modifiedFiles == pastRepo.modifiedFiles);
                    testAdded = (repo.addedFiles == pastRepo.addedFiles);
                    testRemoved = (repo.removedFiles == pastRepo.addedFiles);
                    testCommit = (repo.commitMessage == pastRepo.addedFiles);

                    if (testModified && testAdded && testRemoved && testCommit) {
                        log(`OP`, `Git Sync between ${gitA} and ${gitB} was sucessful`, 1);
                    } 
                    if (testModified == False){
                        log(`OP`, `Error: Git Sync between ${gitA} and ${gitB} modified files synced incorrectly`, 1);
                    }
                    if (testAdded == False){
                        log(`OP`, `Error: Git Sync between ${gitA} and ${gitB} added files synced incorrectly`, 1);
                    }
                    if (testRemoved == False){
                        log(`OP`, `Error: Git Sync between ${gitA} and ${gitB} removed files synced incorrectly`, 1);
                    }
                    if (testCommit == False){
                        log(`OP`, `Error: Git Sync between ${gitA} and ${gitB} commit is incorrect`, 1);
                    }
                }
                catch(error){
                    log(`OP`, `CONFIRM: ${gitB} push confirmation failed: ${error}`, 1);
                    return;
                }
                break;

            default:
            break;
        }

        }
    }


function stackAdd(queue, value) {
 queue.push(value);
}
 
function stackGet(queue) {
    var retrievedQueueValue = queue.shift();
    if(retrievedQueueValue) {
       return retrievedQueueValue;
    }
    else {
       return "";
    }
}

function log (stream, message, level){
    var today = new Date();
    var operation = fs.createWriteStream(`./Git-Sync_${today.getUTCFullYear()}_Operation.log`, {flags:'a'});
    var error = fs.createWriteStream(`./Git-Sync_${today.getUTCFullYear()}_Error.log`, {flags:'a'});

    var date = `${today.getUTCFullYear()}/${(today.getUTCMonth()+1)}/${today.getUTCDate()}`;
    var time = `${(today.getUTCHours())}:${(today.getUTCMinutes())}:${today.getUTCSeconds()}`;
    //fs.appendFile( `${gitSync}/Git-Sync_${today.getUTCFullYear()}_${stream}.log`, `${level*"    "}${date} ${time} UTC     ${message}`, (error) => {});
    switch (stream){
        case 'OP':
            operation.write(`${level*"    "}${date} ${time} UTC     ${message}\n`);
            operation.end();
            break;

        case 'ER':
            error.write(`${level*"    "}${date} ${time} UTC     ${message}\n`);
            error.end();
            break;

        case 'ALL':
            error.write(`${level*"    "}${date} ${time} UTC     ${message}\n`);
            operation.write(`${level*"    "}${date} ${time} UTC     ${message}\n`);
            error.end();
            operation.end();
            break;

        default:
            break;

    }
    
    }
