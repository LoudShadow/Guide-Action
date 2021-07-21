const core = require('@actions/core');
const github = require('@actions/github');
const { count } = require('console');
const fs = require('fs');
const path = require("path");
const fm = require('front-matter')


// const fileName = core.getInput('name');
// const jsonString = core.getInput('json');
// const dir = core.getInput('dir');
// const fullPath = path.join(process.env.GITHUB_WORKSPACE, dir || "", fileName);


function readDirs(dir,exemptDirs=[],result){ 
  var results=[];
  fs.readdir(dir, function(err,files){
    if (err){
      result(err);
    }
    var count=files.length;
    if (!count){result(null,results);}
    for (var file of files){
      var filePath=path.resolve(dir,file);
      var funcCall=(filePath)=>{
        fs.stat(filePath, (err,stat) => {
          if (err){
            result(err);
          }
          if (stat.isDirectory()){
            
            if (!exemptDirs.includes(filePath)){
              readDirs(filePath,exemptDirs, function(err,tempResults){
              results=results.concat(tempResults);
              });
            }
            if (!--count){result(null,results);}
            
          }else{
            results.push(filePath);
            if (!--count){result(null,results);}
          }
        });
      }
      funcCall(filePath);
    }
    
  });
  
} 

function getHeadingSize(line){
  var count=0;
  for (var letter of line){
    if (letter=='#'){
      count+=1;
    }
    else{
      return count;
    }
  }
  return count;
}

async function checkFile(file){
  fs.readFile(file,'utf8',(err,data)=>{
    if (err){
      console.error(err);
      return;
    }
    var fontMatter=fm(data);
    var hasPart=false;
    if (fontMatter.attributes.part){
      hasPart=true;
    }



    lineCount=0;
    headingValue=10
    var lines = data.split('\n');
    for (const line of lines){
      lineCount+=1;
      var currentHeadingSize = getHeadingSize(line);
      if (hasPart && currentHeadingSize==1){
        core.warning("Warning files with part true should not have Heading 1 on line "+lineCount+" of "+ file + "Start a page on `h2` or `##` ");
      }
      if (currentHeadingSize>headingValue+1){
        core.warning("Warning Incorrect heading indentation on line "+lineCount+" of "+ file + " went from a h"+headingValue+" to h"+currentHeadingSize);
      }
      else if (currentHeadingSize!=0){
        headingValue=currentHeadingSize;
      }
    }
  });
}





async function run(){
try {
    // `who-to-greet` input defined in action metadata file
    //const nameToGreet = core.getInput('who-to-greet');
    //console.log(`Hello ${nameToGreet}!`);
    //const time = (new Date()).toTimeString();
    //core.setOutput("time", time);
    // Get the JSON webhook payload for the event that triggered the workflow
    //const payload = JSON.stringify(github.context.payload, undefined, 2)
    
    //console.log('Environment vars:'+process.env.GITHUB_WORKSPACE);

    readDirs('process.env.GITHUB_WORKSPACE',[path.resolve(process.env.GITHUB_WORKSPACE,'node_modules')],function(err,files){
      for(const file of files){
        if (file.endsWith(".md")){
          console.log(file);
          checkFile(file);
        } 
      }
    });
    //console.log(`The event payload: ${payload}`);
  } 

catch (error) {
    core.setFailed(error.message);
  }
}

run();

