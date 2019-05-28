testJSON = JSON.parse('{ "commits": [ {"notmessage": 1, "message": "test" }]}');
console.log('Commit Message: ' + JSON.stringify(testJSON.commits));
console.log('Commit Message: ' + testJSON.commits[0].message);