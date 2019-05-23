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
var dirA = "hdw.dat/" //directory to copy files from in repo-A
var dirB = "hardware_dir"; //directory to copy files to in repo-B

var actionArray = new Array(); //Array to store information about actions taken


//Import Required
let http = require(`http`); //import http library
let crypto = require(`crypto`); //import crypto library
//let ngrok = require(`ngrok`); //include ngrok to allow through firewall
//let fetch = require(`node-fetch`) //include fetch so ngrok settings JSOn can be fetched
var execSync = require(`child_process`).execSync; //include child_process library so we can exicute shell commands
var fs = require("fs"); //required to write to files
const dns = require('dns'); //required to resolve domain name for log file
var colors = require('colors/safe'); //required to colorize log file (only using production safe colors)




//Webserver OP
http.createServer(function (req, res) { //create webserver
    req.on(`data`, function(chunk) {
        var jsonIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
        var jsonPort = req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
        var jsonDomain = null;
        if (jsonIP != null) {
            try {
               dns.reverse(`${jsonIP}:${jsonPort}`, function (error, domain) {
                    if (error) {
                        log(`ALL`, `ERROR: reverse DNS failed for ${jsonIP}: ${error}`, 2);
                    } else {
                        jsonDomain = domain;
                    }
                });
        } catch(error){
            log(`ALL`, `ERROR: DNS lookup failed for ${jsonIP}: ${error}`, 2);
        }
        }
        
        log(`OP`, `NEW OPERATION: File Recieved from ${jsonIP} a.k.a ${jsonDomain}`, 1);

        let sig = "sha1=" + crypto.createHmac(`sha1`, secret).update(chunk.toString()).digest(`hex`); //verify message is authentic (correct secret)
        if (req.headers[`x-hub-signature`] == sig) {
            log(`OP`, `JSON: Signature Verified: ${sig}`, 2);
            githubHook(chunk,req);
        } else {
            var signature = req.headers[`x-hub-signature`];
            log(`ALL`, `ERROR: Incorrect Signature: ${signature}`, 2);
            log(`ALL`, `ERROR: Incorrect Signature: ${signature}`, 2);
        }
         });

    res.end('');
}).listen(port, (err) => {
    if (err) return log(`ALL`, `ERROR: Issue with init of server: ${err}`, 0);
    log(`OP`, `INIT: Node.js server listening on ${port}`, 0);


});

//runs commands in synchronus (serial) terminal 
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
                log(`OP`, `JSON: Push Data Formatting Incorrect ${error}`, 2);
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
           log(`OP`, `JSON: GitHub Data Formatting Incorrect ${error}`, 2);
        return;
        }

        if (req.headers['x-github-event'] == "push") { //if event type is push run following code
        switch (repo.gitFullName){

            case gitA: 
                    log(`OP`, `JSON: Source ${gitA}`, 2);

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

                    
                    /*//Copy all files 
                    var cmd = `cp ${repoA}/${dirA}/* ${repoB}/${dirB} --recursive`;
                    runCmd(cmd);
                    */

                    if (fileType(repo, 'hdw', 0, '.')) {

                    //Copy only Hardware Files
                    var cmd = `cp ${repoA}/${dirA}hdw.dat.* ${repoB}/${dirB}`;
                    runCmd(cmd);

                    //add all files to git
                    var cmd = `cd ${repoB} && git add --all`;
                    runCmd(cmd);


                    //Commit changes to local repoB with message from GitHub repo
                    var cmd = `cd ${repoB} && git commit -m "User: ${repo.username}   Message:${repo.commitMessage}"`;
                    repo.finalCommitMessage = `User: ${repo.username}   Message:${repo.commitMessage}`;
                    runCmd(cmd);

                    //Push local repoB to GitHub
                    var cmd = `cd ${repoB} && git push`;
                    runCmd(cmd);

                    //Store information to confirm proper push to repo B
                    stackAdd(actionArray, repo)

                } 
                
                break;

            case gitB: //Verify that push to repo B was correct
                    log(`OP`, `JSON: Source ${gitB}`, 2);
                    try{

                    var splitRepo = {modifiedFiles: arraySplit(repo.modifiedFiles),
                        addedFiles: arraySplit(repo.addedFiles), 
                        removedFiles: arraySplit(repo.removedFiles)}

                    var pastRepo = stackGet(actionArray);

                    console.log(`pastRepo: ${pastRepo}\n`);
                    console.log(`repo: ${repo.modifiedFiles}     pastRepo: ${pastRepo.modifiedFiles}\n`);
                    console.log(`repo: ${repo.addedFiles}     pastRepo: ${pastRepo.addedFiles}\n`);
                    console.log(`repo: ${repo.deletedFiles}     pastRepo: ${pastRepo.deletedFiles}\n`);
                    console.log(`repo: ${repo.commitMessage}     pastRepo: ${pastRepo.finalCommitMessage}\n`);


                    
                    testModified = (repo.modifiedFiles == pastRepo.modifiedFiles);
                    testAdded = (repo.addedFiles == pastRepo.addedFiles);
                    testRemoved = (repo.removedFiles == pastRepo.removedFiles);
                    testCommit = (repo.commitMessage == pastRepo.finalCommitMessage);

                    if (testModified && testAdded && testRemoved && testCommit) {
                        log(`OP`, `CONFIRM: Git Sync between ${gitA} and ${gitB} was sucessful`, 2);
                    } 
                    if (testModified == false){
                        log(`ALL`, `ERROR: Git Sync between ${gitA} and ${gitB} modified files synced incorrectly`, 2);
                    }
                    if (testAdded == false){
                        log(`ALL`, `ERROR: Git Sync between ${gitA} and ${gitB} added files synced incorrectly`, 2);
                    }
                    if (testRemoved == false){
                        log(`ALL`, `ERROR: Git Sync between ${gitA} and ${gitB} removed files synced incorrectly`, 2);
                    }
                    if (testCommit == false){
                        log(`ALL`, `ERROR: Git Sync between ${gitA} and ${gitB} commit is incorrect`, 2);
                    }
                }
                catch(error){
                    log(`ALL`, `ERROR: ${gitB} push confirmation failed: ${error}`, 2);
                    return;
                }
                break;

            default:
                log(`ALL`, `ERROR: Source "${repo.gitFullName}" Not Recognized`, 2);
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

    var date = `${today.getUTCDate()}/${(today.getUTCMonth()+1)}/${today.getUTCFullYear()}`;
    var time = `${(today.getUTCHours())}:${(today.getUTCMinutes())}:${today.getUTCSeconds()}`;
    //fs.appendFile( `${gitSync}/Git-Sync_${today.getUTCFullYear()}_${stream}.log`, `${level*"    "}${date} ${time} UTC     ${message}`, (error) => {});
    switch (stream){
        case 'OP':
            operation.write(`${date} ${time} UTC${new Array(level*5+1).join(' ')}    ${message}\n`);
            operation.end();
            break;

        case 'ER':
            error.write(`${date} ${time} UTC${new Array(level*5+1).join(' ')}    ${message}\n`);
            error.end();
            break;

        case 'ALL':
            error.write(`${date} ${time} UTC${new Array(level*5+1).join(' ')}    ${message}\n`);
            operation.write(`${date} ${time} UTC${new Array(level*5+1).join(' ')}    ${message}\n`);
            error.end();
            operation.end();
            break;

        default:
            break;

    }
    
    }


function arraySplit (array, char) {
    var array1 =[];
    for (var i = 0; i < array.length; i++) {
                        var split = array[i].split(char);  // just split once
                        array1.push(split); //push to nested array
                    }
    return array1
}


function fileType (repo, file, rank, char){
    
    modified = arraySplit(repo.modifiedFiles, '/');
    added = arraySplit(repo.addedFiles, '/');
    removed = arraySplit(repo.addedFiles, '/');

    //check modified files
    for (F in modified){
        fileName = modified[F][modified[F].length-1];
        var split = fileName.split(char);
        if  (split[rank] == file){
            return true
        }
    }

    //check new files
    for (F in added){
        fileName = added[F][added[F].length-1];
        var split = fileName.split(char);
        if  (split[rank] == file){
            return true
        }
    }

    //check deleted files
    for (F in removed){
        fileName = removed[F][removed[F].length-1];
        var split = fileName.split(char);
        if  (split[rank] == file){
            return true
        }
    }
        log(`OP`, `SYNC: No changes to files of type "${file}" found in ${repoA}/${dirA}`, 2);
        log(`OP`, `SYNC: No Push to ${repoB} Required`, 2);
    return false
}