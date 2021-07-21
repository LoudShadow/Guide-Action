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
    
    console.log('Environment vars:'+process.env.GITHUB_WORKSPACE);


    const files = fs.readdir(process.env.GITHUB_WORKSPACE , function (err,files){
        console.log(files);
        for (const file in files){
            console.log("file:"+file);
        }
    });
    console.log("Done V1.2");
    //console.log(`The event payload: ${payload}`);
  } 

catch (error) {
    core.setFailed(error.message);
  }
}

run();