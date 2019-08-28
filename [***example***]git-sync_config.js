const Auth = {
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
    repoB_branch :  "master", //final sync location (this is where you want the pull request to go to)

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
    prefix : '', //string to be placed before dynamic portion
    constant : false, //set to "true" to have branch name only determined by prefix and suffix. This will cause the same branch to be used for all syncs. "false" allows dynamic branch naming based on first modifed file
    typeDeliminator : '.', //specify deliminator for file sections, "none" to search substrings
    typePosition : 2, //specify the position to expect the string (indexing starts at 0)
    suffix : '_dev'
	}
};

module.exports = { Auth, Setup }