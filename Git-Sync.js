/*step 1. detect Repo A push via webhook              :-)
step 2. get push commit message via webhook           :-)
step 3. git pull Repo A clone on server               :-)
step 4. cp repo A clone to repo B clone /hardware_dir :-)
step 5. git add /hardaware_dir                        :-)
step 6. git commit -m repo A push commit message      :-)
step 7. git push to repo B                            :-)
Step 8. ??????
step 9. PROFIT $$$

*/


//User Configuration ***Both Repos MUST have local configuration***
var secret = "Very$ecret$ecret"; //Secret for verifying WebHook from Repo-A
var gitA = "DannoPeters/Repo-A" //Full repo name, used to identify Webhook Sender
var gitB = "DannoPeters/Repo-B" //Full repo name, used to identify Webhook Sender

const port = 8080 //specify the port for the server to listen on
var dir = "hardware_dir" //directory to copy files to in repo-B


//Import Required
let http = require(`http`); //import http library
let crypto = require(`crypto`); //import crypto library
//let ngrok = require(`ngrok`); //include ngrok to allow through firewall
//let fetch = require(`node-fetch`) //include fetch so ngrok settings JSOn can be fetched
var execSync = require(`child_process`).execSync; //include child_process library so we can exicute shell commands

while(1) {

//Webserver Operation
http.createServer(function (req, res) { //create webserver
    req.on(`data`, function(chunk) {
        let sig = "sha1=" + crypto.createHmac(`sha1`, secret).update(chunk.toString()).digest(`hex`); //verify message is authentic (correct secret)
        
        if (req.headers['x-hub-signature'] == sig) {
        var githubWebHook = JSON.parse(chunk) //Parse the JSON datafile from the push

        var gitFullName = githubWebHook.repository.full_name; //full name of the repository
        var gitID = githubWebHook.repository.id; //ID of the repository
        var gitURL = githubWebHook.repository.html_url; //URL of the repository

        if (req.headers['X-GitHub-Event'] == "push") { //if event type is push run following code
            switch (gitFullName){

                case gitA: //pull from repo A to local A, and copy from local A to local B
                    //Print statements to ensure data is read correctly
                    //console.log(`Commit Message: ` + commitMessage);
                    //console.log(`Added Files: ` + addedFiles);
                    //console.log(`Modified Files: ` + modifiedFiles);
                    //console.log(`Removed Files: ` + removedFiles);





                        //Copy all new files to repoB
                        //console.log(`Copy Added Files`);
                        
                        var cmd = `cd ${repoB}`
                        exec(cmd, (error, stdout, stderr)=> {
                                    if (error) {
                                        console.error(`${cmd}: ${error}\n`);
                                    }
                                });


                        //Pull from github repoA to local repo
                        console.log(`git pull\n`);
                        var cmd = `git pull`
                        exec(cmd, (error, stdout, stderr)=> {
                            if (error) {
                                console.error(`${cmd}: ${error}\n`);
                            }
                        }); 

                        //Copy all added files to new repo
                        for (var file in addedFiles) {
                           console.log(`cp ${repoA}/${addedFiles[file]} ${repoB}/${dir}/${addedFiles[file]}\n`);
                           var cmd = `cp ${repoA}/${addedFiles[file]} ${repoB}/${dir}/${addedFiles[file]}`;
                           exec(cmd, (error, stdout, stderr)=> {
                               if (error) {
                                   console.error(`${cmd}: ${error}\n`);
                               }
                           });
                           var cmd = `git add ${repoB}/${dir}/${addedFiles[file]}`;
                           console.log(cmd)
                           exec(cmd, (error, stdout, stderr)=> {
                                   if (error) {
                                       console.error(`${cmd}: ${error}`);
                                   }
                               });
                        }


                        ////Commit changes to local repoB with message from GitHub repoA
                        //console.log(`Commit Changes`);
                        console.log(`pwd`);
                        var cmd = `pwd`;
                        exec(cmd, (error, stdout, stderr)=> {
                               if (error) {
                                   console.error(`${cmd}: ${error}\n`);
                               }
                               console.log(`${cmd}: ${stdout}`)
                           }); 

                        console.log(`git branch`);
                        var cmd = `git branch`;
                        exec(cmd, (error, stdout, stderr)=> {
                               if (error) {
                                   console.error(`${cmd}: ${error}\n`);
                               }
                               console.log(`${cmd}: ${stdout}`)
                           }); 

                        
                        console.log(`git commit -m ${commitMessage}\n`);
                        var cmd = `git commit -m ${commitMessage}`;
                        exec(cmd, (error, stdout, stderr)=> {
                               if (error) {
                                   console.error(`${cmd}: ${error}\n`);
                               }
                           });
                        
                        //Push local repoB to GitHub
                        console.log(`Push Changes`);
                        console.log(`git push origin master\n`);
                        var cmd = `git push origin master`;
                        exec(cmd, (error, stdout, stderr)=> {
                               if (error) {
                                   console.error(`${cmd}: ${error}\n`);
                               }
                           });
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
                break;
            }
        }

    }

    res.end('');
}).listen(port, (err) => {
    if (err) return console.log(`Something bad happened: ${err}`);
    console.log(`Node.js server listening on ${port}`);
});
});
}
