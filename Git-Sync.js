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



                    console.log(`cd ${repoA} && git pull\n`);
                    var cmd = `cd ${repoA} && git pull`
                    exec(cmd, (error, stdout, stderr)=> {
                        if (error) {
                            console.error(`${cmd}: ${error}\n`);
                        }
                    }); //Pull from github repoA to local repo

                    //Copy all modified files to repoB
                    console.log(`Copy Modified Files`);
                    for (var file in modifiedFiles) {
                        console.log(`cp ${repoA}/${modifiedFiles[file]} ${repoB}/${dir}/${modifiedFiles[file]}\n`);
                        var cmd = `cp ${repoA}/${modifiedFiles[file]} ${repoB}/${dir}/${modifiedFiles[file]}`;
                        exec(cmd, (error, stdout, stderr)=> {
                            if (error) {
                                console.error(`${cmd}: ${error}\n`);
                            }
                        });
                    }

                    //Copy all new files to repoB
                    //console.log(`Copy Added Files`);
                    
                    var cmd = `cd ${repoB}`
                    exec(cmd, (error, stdout, stderr)=> {
                                if (error) {
                                    console.error(`${cmd}: ${error}\n`);
                                }
                            });
                    console.log(`git pull\n`);
                    var cmd = `git pull`
                    exec(cmd, (error, stdout, stderr)=> {
                        if (error) {
                            console.error(`${cmd}: ${error}\n`);
                        }
                    }); //Pull from github repoA to local repo
                    //for (var file in addedFiles) {
                    //    console.log(`cp ${repoA}/${addedFiles[file]} ${repoB}/${dir}/${addedFiles[file]}\n`);
                    //    var cmd = `cp ${repoA}/${addedFiles[file]} ${repoB}/${dir}/${addedFiles[file]}`;
                    //    exec(cmd, (error, stdout, stderr)=> {
                    //        if (error) {
                    //            console.error(`${cmd}: ${error}\n`);
                    //        }
                    //    });
                    //    var cmd = `git add ${repoB}/${dir}/${addedFiles[file]}`;
                    //    console.log(cmd)
                    //    exec(cmd, (error, stdout, stderr)=> {
                    //            if (error) {
                    //                console.error(`${cmd}: ${error}`);
                    //            }
                    //        });
                    //}
                    ////Commit changes to local repoB with message from GitHub repoA
                    ////console.log(`Commit Changes`);
                    //console.log(`pwd`);
                    //var cmd = `pwd`;
                    //exec(cmd, (error, stdout, stderr)=> {
                    //        if (error) {
                    //            console.error(`${cmd}: ${error}\n`);
                    //        }
                    //        console.log(`${cmd}: ${stdout}`)
                    //    }); 

                    //console.log(`git branch`);
                    //var cmd = `git branch`;
                    //exec(cmd, (error, stdout, stderr)=> {
                    //        if (error) {
                    //            console.error(`${cmd}: ${error}\n`);
                    //        }
                    //        console.log(`${cmd}: ${stdout}`)
                    //    }); 

                    //
                    //console.log(`git commit -m ${commitMessage}\n`);
                    //var cmd = `git commit -m ${commitMessage}`;
                    //exec(cmd, (error, stdout, stderr)=> {
                    //        if (error) {
                    //            console.error(`${cmd}: ${error}\n`);
                    //        }
                    //    });
                    //Push local repoB to GitHub
                    //console.log(`Push Changes`);
                    //console.log(`git push origin master\n`);
                    //var cmd = `git push origin master`;
                    //exec(cmd, (error, stdout, stderr)=> {
                    //        if (error) {
                    //            console.error(`${cmd}: ${error}\n`);
                    //        }
                    //    });
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
