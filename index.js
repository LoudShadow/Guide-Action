const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require("path");
// const fs = require('fs');
// const path = require("path");



// const fileName = core.getInput('name');
// const jsonString = core.getInput('json');
// const dir = core.getInput('dir');
// const fullPath = path.join(process.env.GITHUB_WORKSPACE, dir || "", fileName);


async function run(){


try {
    // `who-to-greet` input defined in action metadata file
    const nameToGreet = core.getInput('who-to-greet');
    console.log(`Hello ${nameToGreet}!`);
    const time = (new Date()).toTimeString();
    core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2)
    
    console.log('Environment:'+process.env.GITHUB_WORKSPACE);
    fs.readdir(process.env.GITHUB_WORKSPACE, (err, files) => {
        files.forEach(file => {
          console.log(file);
        });
    });
    //console.log(`The event payload: ${payload}`);
  } 

catch (error) {
    core.setFailed(error.message);
  }
}

run();