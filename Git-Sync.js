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

var secret = "Very$ecret$ecret"; //Secret for verifying WebHook from Repo-A
var repoA = "/run/media/peters/Danno_SuperDARN/Git_Projects/Repo-A"; //location of repo-A on server
var repoB = "/run/media/peters/Danno_SuperDARN/Git_Projects/Repo-B"; //location of repo-b on server
const port = 8080
var dir = "hardware_dir" //directory to copy files to in repo-B

let http = require('http'); //import http library
let crypto = require('crypto'); //import crypto library
//let ngrok = require('ngrok'); //include ngrok to allow through firewall
const exec = require('child_process').exec; //include child_process library so we can exicute shell commands

var repoA_commit = {} //commit pushed to repo A
/* Create Webserver for port 8080
	Inputs: 
	Outputs:
	Result: If secret is validated local repo is updated using a pull request
	*/
http.createServer(function (req, res) {
    req.on('data', function(chunk) {
        let sig = "sha1=" + crypto.createHmac('sha1', secret).update(chunk.toString()).digest('hex');
        var githubWebHook = JSON.parse(chunk)

        var modifiedFiles = githubWebHook.commits[0].modified; //Create list of files modified in Push
        var addedFiles = githubWebHook.commits[0].added; //Create list of files added in Push
        var removedFiles = githubWebHook.commits[0].removed; //Create list of files removed in Push
        var commitMessage = githubWebHook.commits[0].message; //Read commit message for use in push to repo-B

        console.log('Commit Message: ' + commitMessage);
        console.log('Added Files: ' + addedFiles);
        console.log('Modified Files: ' + modifiedFiles);
        if (req.headers['x-hub-signature'] == sig) {
            console.log(`WebHook from push to Repo-A`);
            exec('cd ' + repoA + ' && git pull');

            //Copy all modified files to repoB
            console.log('Copy Modified Files');
            for (var file in modifiedFiles) {
                console.log('cp ' + repoA + '/' + modifiedFiles[file] + ' ' + repoB + '/' + dir + '/' + modifiedFiles[file]);
                exec('cp ' + repoA + '/' + modifiedFiles[file] + ' ' + repoB + '/' + dir + '/' + modifiedFiles[file]);
            }

            //Copy all new files to repoB
            console.log('Copy Added Files');
            for (var file in addedFiles) {
                console.log('cp ' + repoA + '/' + addedFiles[file] + ' ' + repoB + '/' + dir + '/' + addedFiles[file]);
                exec('cp ' + repoA + '/' + addedFiles[file] + ' ' + repoB + '/' + dir + '/' + addedFiles[file]);
            }
            //Commit changes to local repoB with message from GitHub repoA
            console.log('Commit Changes');
            console.log('cd ' + repoB + ' && git commit -m [' + commitMessage + ']');
            exec('cd ' + repoB + ' && git commit -m [' + commitMessage + ']');

            //Push local repoB to GitHub
            console.log('Push Changes');
            console.log('cd ' + repoB + ' && git push origin master');
            exec('cd ' + repoB + ' && git push origin master');
        }
    });

    res.end('');
}).listen(port, (err) => {
    if (err) return console.log(`Something bad happened: ${err}`);
    console.log(`Node.js server listening on ${port}`);

/*
    ngrok.connect(port, function (err, url) {
        c;
    });
*/
});