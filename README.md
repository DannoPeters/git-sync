# Git-Sync.js
NodeJS Server for running automatic synchronization of files between repos

What it Does:
- Checks if event is a push to GitHub
- Decodes encrypted webhook, RepoA and RepoB may have separate pass-phrases
- Updates local Repo-A using a pull request
- read commit message from webhook
- Checks pushed file type and location in repo A
- creates a new branch of Repo-B
- cp local Repo-A files to new branch of local Repo-B
- Commit local Repo-B with message and username
- Push new branch of local Repo-B to GitHub
- Generate pull request from new branch of Repo-B to specified branch of Repo-B (usually master)
- Check if Push was successful (checks uploaded file names and commit)
- Checks user who initiated webhook (prevents push loop or false push confirm)
- server side logging system
- gracefully exit if errors result from terminal commands or JSON


ToDo:
- Setup Documentation
- Confirm files are the same in repos A and B (line by line)
- Notify Kevin S of new uploads, or improper use (file deletion, etc).


# How to Install
## Requirements
  - Public Facing IP (or equilvallent - See step 1)
  - local git install
  - command line access
  ##### The following Libraries
  * http - required to run JS server to listen for webhooks
  * crypto - required to unencrypt webhook json 
  * execSync - required to exicute shell commands from JS
  * fs - required to write files
  * XMLHttpRequest - required to send JSONs to the GitHub API
  * dns - required to resolve domain names
  * Node.JS - required to run the Java Script script
  
## Steps
### 1. Public IP or URL
  If you are running this script on a server with a public IP or URL skip to step 2.

  In order for the webhooks to be recieved you will need a web acessible server with a public IP.
    If you are running this code for testing on your machine, I recomend installing Ngrok to create a public URL which tunnels through trough your NAT or firewall.
    
   https://ngrok.com
      
   You will need to launch ngrok from the same directory as the Git-Sync.JS script using ./ngrok http [port number]
    Using the default port number is command is ./ngrok http 8080
```
ngrok by @inconshreveable                        (Ctrl+C to quit)
    
Session Status                online      
Account                       DannoPeters (Plan: Free)
Update                        update available (version 2.3.30, Ctrl-U to update)    
Version                       2.3.28      
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    http://f2c0131b.ngrok.io -> http://localhost:8080
Forwarding                    https://f2c0131b.ngrok.io -> http://localhost:8080                                                                      
Connections                   ttl     opn     rt1     rt5     p50     p90                                                       
                              0       0       0.00    0.00    0.00    0.00    
```
 The above text will be displayed your terminal, note your forwarding URL as it will be required for the webhook setup.
**NOTE:** *Your forwarding URL will be updated each time Ngrok is started.*
 
 ### 2. Where to put the script
 The Git-Sync.JS script can be placed in any folder of your web server, as it will listen on localhost:8080 for requests forwarded from a public facing IP or URL
 
 ### 3. Setup a new github account
 Use a fresh github account, ensure this account has read priveldges from your master repo and read/write privledges to the slave repo. In these instructions and the Sync-Git.JS script Repo A is the master and Repo B is the slave.
 
 ### 4. SSH Github acsess
 Setup SSH authentication from your machine to your fresh github account utilising sha keys.
 If you have not used SSh authentication before, consult the github guide:
 https://help.github.com/en/enterprise/2.15/user/articles/adding-a-new-ssh-key-to-your-github-account
 
 ### 5. Personal Access Token
 A personal access token is requiered to use the GitHub Rest API to create pull requests.
Tokens can be generated from the GitHub web interface by following this guide: https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line
This token should only be used for this app. This allows for usage monitoring and revoking of the keys for individual applications
Ensure that your git-sync_config.js file in NOT synced with any public repositoires or exposed on the server. 
 
 ### 6. Local Repos
  Using your fresh github account clone both of the repos you would like to sync to your local git. 
  
 ### 7. GitHub WebHook Config
 Using the GitHub web interface inside of your repos navigate to Settings -> Webhooks
 Then select "Add Webhook" at the top right
 
 Enter the following values in the data fields for the webhooks of both Repo's A (master) and B (slave)
 
  **Payload Url** - Enter your public facing IP or URL and your chosen port into the text box

   **Content Type** - Select "aplication/json" from the drop down
   
   **Secret** - A password/message to ensure your webhook is authentic. This does NOT need to be the same for both hooks.

   **Which events would you like to trigger this webhook?** - Select the "Just the push event." radio button
   
   **Active** Leave this checkbox unselected to avoid partial syncs until the full system is setup
   
   NOTE: if the github webhook is set as active by mistake you will recive an error stating "last delivery was not sucessful" This error is normal and expected, plese deactivate the webhook by selecting the edit button, then deselcting the "active" check box. 
   
### 8. Git-Sync.JS Config
Open the [**example***]git-sync_config.js file in a text editor, remove the "[***example***] and set the following varibales:
```const Auth = {
    personal_access_token : '[*** INSERT YOUR PERSONAL ACCESS TOKEN HERE***]',
    secretA : "VerySecretSecret", //Secret for verifying WebHook from RepoA
    secretB : "AnotherVerySecretSecret", //Secret for verifying WebHook from RepoB
};

const Setup = {
    gitSync : "/run/media/peters/Danno_SuperDARN/Git_Projects/Git-Sync-NodeJS", //Location of Git-Sync.js on server

    gitA : "DannoPeters/Repo-A", //Full repo name, used to identify Webhook Sender
    gitB : "DannoPeters/Repo-B", //Full repo name, used to identify Webhook Sender

    repoA : "/run/media/peters/Danno_SuperDARN/Git_Projects/Repo-A", //location of repo-A on server
    repoB : "/run/media/peters/Danno_SuperDARN/Git_Projects/Repo-B", //location of repo-b on server

    repoA_branch : "master", //branch to sync from
    repoB_branchB :  "master", //final sync location (this is where you want the pull request to go to)

    port : 8080, //specify the port for the server to listen on

    dirA : "", //directory to copy files from in repo-A. Set "" if none specified
    dirB : "hardware_dir", //directory to copy files to in repo-B.  Set "" if none specified

    user : "DannoPeters", //set the github username of the server (configured using ssh)

    //Files to Sync
    sync : {
    nameContains : 'hdw', //specify string contained in the file name to sync
    typeDeliminator : '.', //specify deliminator for file sections, "none" to search substrings
    typePosition : 'any', //specify the position to expect the string, "any" for any position (indexing starts at 0)
	}

    //Branch to pull From
    branch : {
    prefix : '',
    constant : false, //set to "true" to have branch name only determined by prefix and suffix. This will cause the same branch to be used for all syncs. "false" allows dynamic branch naming based on first modifed file
    typeDeliminator : '.', //specify deliminator for file sections, "none" to search substrings
    typePosition : 2, //specify the position to expect the string (indexing starts at 0)
    suffix : '_dev'
	}
};

module.exports = { Auth, Setup }
```
**personal_access_token** - personal acess token generated int eh previous step. This allows for the use of the github API for generating pull requests 

- Replace [*** INSERT YOUR PERSONAL ACCESS TOKEN HERE***] with your token which will look something like this: ff34885a8624460a855540c6592698d2f1812843
	
	NOTE: This is an example token, not an actual token for any account, please use your own
	
**secretA** - Secret set for Repo A

**secretB** - Secret set for Repo B


**gitA** - Full name of remote Repo A ie) the full name of this repo is "DannoPeters/Git-Sync"

**gitB** - Full name of remote Repo B


**repoA** - location of local Repo A clone on server

**repoB** - location of local Repo B clone on server


**gitSync** - location of the Git-Sync.JS (File youa re currently editing) on the server


**port** - the listening port for incoming webhooks


**dirA** - subdirectory in remote Repo A to sync files from, should be set to "" if whole repo is to be synced

**dirB** - subdirectory in remote Repo B to sync files to, should be set to "" if Repo A is to be synced to root directory


**user** - username of the fresh github account setup with SSH access

#### Sync
**nameContains** - sub string contained in files which are to be synced. 


**typeDeliminator** - specify the deliminator (what sperates portions of the filename ie) hardware.dat is superated by **.**) or enter "none" to search substrings 


**typePosition** - numberical position of the deliminated string, specify "any" for any position, or "last" for the file extension. Note: this section is N/A if "none" is selected for typeDeliminator.

#### Branch
  Allows for branches to be named dyanamically.
  
**prefix** - string to be placed before dynamic portion

**constant** - bool, set to true for fixed branch naming (combination of prefix and suffix) or set to false to create banches based on file names


**typeDeliminator** - specify the deliminator (what sperates portions of the filename ie) hardware.dat is superated by **.**) or enter "none" to search substrings 


**typePosition** - numberical position of the deliminated string, specify "any" for any position, or "last" for the file extension. Note: this section is N/A if "none" is selected for typeDeliminator.


### 9. Starting up Syncing
- Start the git-sync.js script
- If you are using Ngrok, start the Ngrok session and copy your forwarding URL
- Going to your public facing IP or URL assigned to local port 8080 you should see the following screen confirming git-sync.JS is running and acessible through your firewall/NAT.
![Web UI confimring git-sync.JS is running](README-Images/git-sync_Init_WebUI.png?raw=true "git-sync.JS is running")
- in each of the repos navigate to Settings -> Webhooks, slect edit and press the **Active** checkbox, then **Update Webhook**
- To test your webhook post a commit to your Repo A, a commit of the following format should be made in repo B 
    *User: {user} Message:{message}* ie) *User: DannoPeters Message:Update hdw.dat.ade*
    - Refreshing the Web UI will show the time and content of the last repo sync, an example is shown below.
 ![Web UI confimring git-sync.JS last repository sync](README-Images/git-sync_Added_WebUI.png?raw=true "git-sync.JS  last repository sync]")   
# Trouble Shooting and Common Questions


    
