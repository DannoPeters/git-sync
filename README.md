# Git-Sync.js
NodeJS Server for running automatic synchronization of files between repos

What it Does:
- Checks if event is a push to GitHub
- Decodes encrypted webhook, RepoA and RepoB may have separate pass-phrases
- Updates local Repo-A using a pull request
- read commit message from webhook
- Checks pushed file type and location in repo A
- cp local Repo-A files to local Repo-B
- Commit local Repo-B with message and username
- Push local Repo-B to GitHub
- cp local Repo-A folders to local Repo-B
- gracefully exit if errors result from terminal commands or JSON
- Check if Push was successful (checks uploaded file names and commit)
- Checks user who initiated webhook (prevents push loop or false push confirm)
- server side logging system



ToDo:
- Setup Documentation
- Confirm files are the same in repos A and B (line by line)
- Notify Kevin S of new uploads, or improper use (file deletion, etc).


# How to Install
## Requirements
  - Public Facing IP (or equilvallent - See step 1)
  - local git install
  - command line access
  
## Steps
### 1. Public IP or URL
  If you are running this script on a server with a public IP or URL skip to step 2.

  In order for the webhooks to be recieved you will need a web acessible server with a public IP.
    If you are running this code for testing on your machine, I recomend using ngrok to create a public URL for testing
      https://ngrok.com
    You will need to launch ngrok from the same directory as the Git-Sync.JS script using ./ngrok http [port number]
    Using the default port number is command is ./ngrok http 8080
    ` ` `
    ngrok by @inconshreveable                                                                                                      (Ctrl+C to quit)
                                                                                                                                               
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
                              ` ` `
  
 ### 2. Where to put the script
 The Git-Sync.JS script must be placed in a public folder of your web server, or in the folder where you will run ngrok from
 
 ### 3. Setup a new github account
 Use a fresh github account, ensure this account has read priveldges from your master repo and read/write privledges to the slave repo. In these instructions and the Sync-Git.JS script Repo A is the master and Repo B is the slave.
 
 ### 4. SSH Github acsess
 Setup SSH authentication from your machine to your fresh github account utilising sha keys. If you have not used SSh authentication before, consult the github guide: https://help.github.com/en/enterprise/2.15/user/articles/adding-a-new-ssh-key-to-your-github-account
 
 ### 5. Local Repos
  Using your fresh github account clone both of the repos you would like to sync to your local git. 
  
 ### 6. GitHub WebHook Config
 Using the GitHub web interface inside of your repos navigate to Settings -> Webhooks
 Then select "Add Webhook" at the top right
 
 Enter the following values in the data fields
  **Payload Url** - Enter your public facing IP or URL and your chosen port into the text box

   **Content Type** - Select "aplication/json" from the drop down
   
   **Secret** - A password/message to ensure your webhook is authentic. This does NOT need to be the same for both hooks.

   **Which events would you like to trigger this webhook?** - Select the "Just the push event." radio button
   **Active** Leave this checkbox unselected to avoid partial syncs until the full system is setup
   
   NOTE: if the github webhook is set as active by mistake you will recive an error stating "last delivery was not sucessful" This error is normal and expected, plese deactivate the webhook by selecting the edit button, then deselcting the "active" check box. 
   
   
    
