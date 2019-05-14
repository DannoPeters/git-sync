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
var repoA = "/run/media/peters/Danno_SuperDARN/Git_Projects/Repo-A"; //location of repo-A on server
var repoB = "/run/media/peters/Danno_SuperDARN/Git_Projects/Repo-B"; //location of repo-b on server
var gitWeb = "git@github.com:"
const port = 8080 //specify the port for the server to listen on
var dir = "hardware_dir" //directory to copy files to in repo-B


//Import Required
let http = require(`http`); //import http library
let crypto = require(`crypto`); //import crypto library
//let ngrok = require(`ngrok`); //include ngrok to allow through firewall
//let fetch = require(`node-fetch`) //include fetch so ngrok settings JSOn can be fetched
var execSync = require(`child_process`).execSync; //include child_process library so we can exicute shell commands

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
        
        var githubWebHook = JSON.parse(chunk) //Parse the JSON datafile from the push

        var gitFullName = githubWebHook.repository.full_name; //full name of the repository
        var gitID = githubWebHook.repository.id; //ID of the repository
        var gitURL = githubWebHook.repository.html_url; //URL of the repository

        switch (gitFullName){

            case gitA: //pull from repo A to local A, and copy from local A to local B
                //Print statements to ensure data is read correctly
                //console.log(`Commit Message: ` + commitMessage);
                //console.log(`Added Files: ` + addedFiles);
                //console.log(`Modified Files: ` + modifiedFiles);
                //console.log(`Removed Files: ` + removedFiles);

                //Seperate data from intrest our of JSON dicts and lists
                var modifiedFiles = githubWebHook.commits[0].modified; //Create list of files modified in Push
                var addedFiles = githubWebHook.commits[0].added; //Create list of files added in Push
                var removedFiles = githubWebHook.commits[0].removed; //Create list of files removed in Push
                var commitMessage = githubWebHook.commits[0].message; //Read commit message for use in push to repo-B

                if (req.headers[`x-hub-signature`] == sig) {

                    //Pull from github repoA to local repo
                    var cmd = `cd ${repoA} && git pull`;
                    execSync(cmd); 
                    console.log(cmd);

                   //Pull request for repoB
                    //var cmd = `git pull ${gitWeb}${gitB}.git --allow-unrelated-histories`;
                    var cmd = `cd ${repoB} && git pull`;
                    execSync(cmd); 
                    console.log(cmd);

                    //Copy all modified files to repoB
                    for (var file in modifiedFiles) {
                        var cmd = `cp ${repoA}/${modifiedFiles[file]} ${repoB}/${dir}/${modifiedFiles[file]}`;
                        execSync(cmd); 
                        console.log(cmd);
                    }

                    //Copy all new files to repoB
                    for (var file in addedFiles) {
                       var cmd = `cp ${repoA}/${addedFiles[file]} ${repoB}/${dir}/${addedFiles[file]}`;
                       execSync(cmd); 
                        console.log(cmd);
                    }

                    
                    //Copy all files
                    var cmd = `cp ${repoA} ${repoB}/${dir}`;
                    execSync(cmd); 
                    console.log(cmd);

                    //add all files to git
                    var cmd = `cd ${repoB} && git add --all`;
                    execSync(cmd); 
                    console.log(cmd);


                    //Commit changes to local repoB with message from GitHub repo
                    var cmd = `cd ${repoB} && git commit -m "${commitMessage}" --verbose`;
                    execSync(cmd); 
                    console.log(cmd);

                    //Push local repoB to GitHub
                    var cmd = `cd ${repoB} && git push --force --verbose`;
                    execSync(cmd); 
                    console.log(cmd);
                }
                break;

            case gitB: //Verify that push to repo B was correct
                    testModified = (modifiedFiles == githubWebHook.commits[0].modified);
                    testAdded = (addedFiles == githubWebHook.commits[0].added);
                    testRemoved = (removedFiles == githubWebHook.commits[0].removed);
                    testCommit = (commitMessage == githubWebHook.commits[0].message);

                    if (testModified && testAdded && testRemoved && testCommit) {
                        console.log(`Git Sync between ${gitA} and ${gitB} was sucessful`);

                    }
                break;

            default:

        }


        

        
    });

    res.end('');
}).listen(port, (err) => {
    if (err) return console.log(`Something bad happened: ${err}`);
    console.log(`Node.js server listening on ${port}`);



});
