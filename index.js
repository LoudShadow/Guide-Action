const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require("path");


// const fileName = core.getInput('name');
// const jsonString = core.getInput('json');
// const dir = core.getInput('dir');
// const fullPath = path.join(process.env.GITHUB_WORKSPACE, dir || "", fileName);


var readDirs = function(dir, done){
  var results=[];
  fs.readdir(dir, function(err,files){
    if (err){
      return err;
    }
    for (var file in files){
      var filePath=path.resolve(dir,file);
      console.log(filePath+"  :  "+file);
      results.push(filePath);
      fs.stat(filePath, function (err,stat){
        if (err){
          return err;
        }
        if (stat.isDirectory()){
          subResults=readDirs(filePath);
          if (Array.isArray(subResults)){
            results.concat(subResults);
          }else{
            return results;
          }
        }
      });
    }
  });
  return results;
} 





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

    console.log(readDirs(process.env.GITHUB_WORKSPACE))
    
    //console.log(`The event payload: ${payload}`);
  } 

catch (error) {
    core.setFailed(error.message);
  }
}

run();

