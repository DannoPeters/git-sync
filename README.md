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
### Requirements
  - Public Facing IP (or equilvallent - See step 1)
  - local git install
  - command line access
  
### Steps
##### 1. Public IP or URL
  If you are running this script on a server with a public IP or URL skip to setp 2.

  In order for the webhooks to be recieved you will need a web acessible server with a public IP.
    If you are running this code for testing on your machine, I recomend using ngrok to create a public URL for testing
      https://ngrok.com
    You will need to launch ngrok from the same directory as the 
  
  ##### 2. Where to put the script
    Git-Sync.JS must be placed in a public folder of your web server 
  
  ##### 3. GitHub WebHook Config
    
