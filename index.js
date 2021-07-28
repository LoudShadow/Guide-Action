const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require("path");
const fm = require('front-matter');
const yaml = require('js-yaml');
const validate = require('jsonschema').validate;
var Validator = require('jsonschema').Validator;


var ContributorSchema={"type": "array",
"items":{
  "type":"object",
  "properties":{
      "name":{"type":"string"},
      "image":{"type":"string"},
      "github":{"type":"string"},
      "discord":{"type":"string"},
      "nick":{"type":"string"}
    },
    "required":["name","image"],
    "additionalProperties":{
      "type":["string",
        {
          "type":"object",
          "properties":{
            "value":{"type":"string"},
            "link":{"type":"string"}
          } 
        }
      ]
    }
}  
}

var dataSchema={
  "type":"object",
  "properties":{
      "code":{"type":"string"},
      "description":{"type":"string"},
      "website":{"type":"string"},
      "cats":{"type":"integer"},
      "optional":{"type":"string"},
      "examStructure":{
          "type":"array",
          "items":{
              "type":"object",
              "properties":{
                  "name":{"type":"string"},
                  "percent":{"type":"integer"},
                  "date":{"type":["string","date"]},
                  "structure":{"type":"string"}
              },
              "required":["name","percent","date","structure"]
          }
      },
      "Notes":{
          "type":"array",
          "items":{
              "type":"object",
              "properties":{
                  "name":{"type":"string"},
                  "description":{"type":"string"},
                  "order":{
                      "type":"array",
                      "items":{"type":"string"}
                  },
                  "link":{"type":"string"},
                  "authors":{
                      "type":"array",
                      "items":{"type":"string"}
                  },
                  "contributors":{
                      "type":"array",
                      "items":{"type":"string"}
                  }
              },
              "required":["name","description"]
          }
      },
      "CribSheets":{
          "type":"array",
          "items":{
              "type":"object",
              "properties":{
                  "name":{"type":"string"},
                  "description":{"type":"string"},
                  "link":{"type":"string"},
                  "authors":{
                      "type":"array",
                      "items":{"type":"string"}
                  },
                  "contributors":{
                      "type":"array",
                      "items":{"type":"string"}
                  }
              },
              "required":["name","description"]
          }
      },
      "Questions":{
          "type":"object",
          "properties":{
              "QUIZAvailable":{"type":"boolean"},
              "altQuestions":{
                  "type":"array",
                  "items":{
                      "type":"object",
                      "properties":{
                          "name":{"type":"string"},
                          "description":{"type":"string"},
                          "link":{"type":"string"},
                          "authors":{
                              "type":"array",
                              "items":{"type":"string"}
                          },
                          "contributors":{
                              "type":"array",
                              "items":{"type":"string"}
                          }
                      },
                      "required":["name","description"]
                  }
              }
          }
      }
  },
  "required":["code","description","website","cats","optional"]
}

var questionSchema={
  "id":"/QuestionStructure",
  "type":"object",
  "properties":{
      "question":{"type":["string",
               {"type":"array",
                   "items":{"type":"string"}
               }
           ]},
      "questionImg":{"type":"string"},
      "answerImg":{"type":"string"},
      "answer":{"type":["string",
               {"type":"array",
               "items":{"type":"string"}
               }
           ]},
      "marks":{"type":"integer"},
      "topics":{
          "type":"array",
          "items":{"type":"string"}
      },
      "author":{
       "type":"array",
       "items":{"type":"string"}
       },
       "contributors":{
           "type":"array",
           "items":{"type":"string"}
       }
  }, 
  "required":["question","answer","marks","topics"]
}

var quizSchema={
  "type":"object",
  "properties":{
      "title":{"type":"string"},
      "name":{"type":"string"},
      "structure":{
          "type":"array",
          "items":{"$ref":"/CourseStructure"}
      },
      "extSites":{
          "type":"array",
          "items":{
              "type":"object",
              "properties":{
                  "name":{"type":"string"},
                  "description":{"type":"string"},
                  "link":{"type":"string"},
                  "answerType":{
                      "type":"string",
                      "pattern":"[NCW][NCW]?[NCW]?"
                  },
                  "topics":{
                      "type":"array",
                      "items":{"type":"string"}
                  }
              },
              "required":["name","description","link","answerType","topics"]
          }
      },
      "recall":{
          "type":"array",
          "items":{"$ref":"/QuestionStructure"}
      },
      "understanding":{
          "type":"array",
          "items":{"$ref":"/QuestionStructure"}
      }
  },
  "required":["title","name","structure"]
}

var structureSchema={
  "id":"/CourseStructure",
  "type":"Object",
  "properties":{
      "name":{"type":"string"},
      "subTopics":{
          "type":"array",
          "items":{"$ref":"/CourseStructure"}
      }
  },
  "required":["name"]
}


function readDirs(dir,exempt,result){ 
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
          if (err){result(err);}
          if (!exempt.includes(filePath)){
            if (stat.isDirectory()){
              readDirs(filePath,exempt, function(err,tempResults){
                results=results.concat(tempResults);
                if (!--count){result(null,results);}
              });
            
            
            }else{
              results.push(filePath);
              if (!--count){result(null,results);}
            }
          }else{
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
function multiLineCode(line){
  var count=0;
  for (var letter of line){
    if (letter=='`'){
      count+=1;
      if (count==3){
        return true;
      }
    }
    else{
        return false;
    }
  }
  return false;
}

function checkMDFile(file){
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
    var warned = false;
    var inComment=false;
    for (const line of lines){
      lineCount+=1;
      if (!inComment){
        var currentHeadingSize = getHeadingSize(line);
        if (hasPart && currentHeadingSize==1){
          core.info("\u001b[38;5;11m Warning files with part:true should not have Heading 1 on line "+lineCount+" of "+ file + " Start a page on `h2` or `##` ");
          warned=true;
        }
        if (currentHeadingSize>headingValue+1){
          core.info("\u001b[38;5;11m Warning incorrect heading indentation on line "+lineCount+" of "+ file + " went from a h"+headingValue+" to h"+currentHeadingSize);
          warned=true;
        }
        else if (currentHeadingSize!=0){
          headingValue=currentHeadingSize;
        }
      }
      if (multiLineCode(line)){
        inComment= !inComment;
      }
    }
    if (!warned){(file)
    //schema=JSON.parse(fs.readFileSync('contributorSchema.json' ,{encoding:'utf8', flag:'r'}));
    schema=ContributorSchema;
    instance=JSON.parse(fs.readFileSync(file ,{encoding:'utf8', flag:'r'}));
    var validation=validate(instance,schema);
    if (validation.valid){
      core.info("\u001b[38;5;10m Checks passed contributors JSON")
      return instance;
    }else{
      for( const JsonError of validation.errors){
      console.log(JsonError.property);
      console.log(JsonError.message);
      }
    }
  }
  });
}
function getQuizTopics(topics){
  var topicName=[]
  for (const topic of topics) {
    topicName.push(topic.name);
    if (topic.subTopics){
      topicName=topicName.concat(getQuizTopics(topic.subTopics));
    }
  }
  return topicName;
}
function checkValidContributors(checking,contributors,file,description){
  var error=false;
  if (checking){
    for (let index = 0; index < checking.length; index++) {
      if (checking[index].contributors){
        for (const contributor of checking[index].contributors) {
          if (!contributors.includes(contributor)){
            core.error("Error in file:"+file+" in "+description+"["+index+"] '"+contributor+"' is not defined in contributors/contributors.json");
            error=true;
          }
        }
      }
      if (checking[index].authors){
        for (const contributor of checking[index].authors) {
          if (!contributors.includes(contributor)){
            core.error("Error in file:"+file+" in "+description+"["+index+"] '"+contributor+"' is not defined in contributors/contributors.json");
            error=true;
          }
        }
      }
    }
  }
  return error;
}

function checkQuizFile(file,contributors){
  //quizSchema=JSON.parse(fs.readFileSync('quizSchema.json' ,{encoding:'utf8', flag:'r'}));
  //questionSchema=JSON.parse(fs.readFileSync('questionSchema.json' ,{encoding:'utf8', flag:'r'}));
  //structureSchema=JSON.parse(fs.readFileSync('structureSchema.json' ,{encoding:'utf8', flag:'r'}));
  instance=JSON.parse(fs.readFileSync(file ,{encoding:'utf8', flag:'r'}));
  var v = new Validator();
  v.addSchema(questionSchema, '/QuestionStructure');
  v.addSchema(structureSchema, '/CourseStructure');
  validation=v.validate(instance, quizSchema);
  if (validation.valid){

    //check for topics
    var error=false;
    var topics=getQuizTopics(instance.structure);
    for (let index = 0; index < instance.extSites.length; index++) {
      for (const siteTopic of instance.extSites[index].topics) {
        if (!topics.includes(siteTopic)){
          core.error("Error in quiz JSON"+file+" in extSites["+index+"] '"+siteTopic+"' is not defined in structure");
          error=true;
        }
      }
    }
    for (let index = 0; index < instance.recall.length; index++) {
      for (const questionTopic of instance.recall[index].topics) {
        if (!topics.includes(questionTopic)){
          core.error("Error in quiz JSON"+file+" in recall["+index+"] '"+questionTopic+"' is not defined in structure");
          error=true;
        }
      }
    }
    for (let index = 0; index < instance.understanding.length; index++) {
      for (const questionTopic of instance.extSites[index].topics) {
        if (!topics.includes(questionTopic)){
          core.error("Error in quiz JSON"+file+" in understanding["+index+"] '"+questionTopic+"' is not defined in structure");
          error=true;
        }
      }
    }

    error = error || checkValidContributors(instance.recall,contributors,file,"recall");
    error = error || checkValidContributors(instance.understanding,contributors,file,"understanding");

    if (!error){
      core.info("\u001b[38;5;10m Checks passed quiz JSON "+file);
    }
    return instance;
  }else{
    core.error("Error(s) in quiz JSON "+file);
    for( const JsonError of validation.errors){
    console.log(JsonError.property);
    console.log(JsonError.message);
    }
  }
}
function checkDataFile(file,contributors){
  //var dataSchema=JSON.parse(fs.readFileSync('dataSchema.json' ,{encoding:'utf8', flag:'r'}));
  var instance=yaml.load(fs.readFileSync(file ,{encoding:'utf8', flag:'r'}));
  var v = new Validator();
  var validation=v.validate(instance, dataSchema);
  var error =false
  if (validation.valid){
    error = error || checkValidContributors(instance.Notes,contributors,file,"Notes");
    error = error || checkValidContributors(instance.CribSheets,contributors,file,"CribSheets");
    if (instance.Questions){
      error = error || checkValidContributors(instance.Questions.altQuestions,contributors,file,"Questions");
    }process.env.GITHUB_WORKSPACE
    for (let index = 0; index < instance.Notes.length; index++) {
      if (instance.Notes[index].order){
        for (const part of instance.Notes[index].order) {
          if (!part.endsWith(".html")){
            core.error("Error in file:"+file+" in Notes["+index+"] '"+part+"' should end with .html ");
            error=true;
          }
        }
      }
    }


    if (!error){
      core.info("\u001b[38;5;10m Checks passed data yml "+file);
    }
    
  }else{
    core.error("Error(s) in quiz JSON "+file);
    for( const JsonError of validation.errors){
    console.log(JsonError.property);
    console.log(JsonError.message);
    }
  }
}

//const exemptPathFromHome=["node_modules"];
//const pathStart='/home/joseph/Documents/Code/Guide-Action'
//const pathStart="/home/joseph/Documents/Code/dcs-notes.github.io";
//const pathStart=process.env.GITHUB_WORKSPACE;
const exemptPathFromHome=[".jekyll-cache","_site",".github"];
const contributorPath='contributors/contributors.json'
const QuizPath='quiz/questions'
const DataPath='_data'


var exemptPaths=[];
for (const exPath of exemptPathFromHome) {
  exemptPaths.push(path.resolve(pathStart,exPath));
}




async function run(){
try {
  //validate and check contributors
  var contributorNames=[]
  var contributors= checkContributors(path.resolve(pathStart,contributorPath));
  for (const con of contributors){
    if (contributorNames.includes(con.name)){
      core.setFailed("ERROR duplicate contributor name '"+con.name+"' Use a unique name, nick can be used to change display name");
    }else{
      contributorNames.push(con.name);
    }
  }


  //validate and check quiz

  readDirs(path.resolve(pathStart,QuizPath),[],function(err,files){
    if (err){
      core.setFailed(err);
    }
    for(const file of files){
      if (file.endsWith(".json")){
        checkQuizFile(file,contributorNames);
      } 
    }
  });

  //validate and check data files

  readDirs(path.resolve(pathStart,DataPath),[],function(err,files){
    if (err){
      core.setFailed(err);
    }
    for(const file of files){
      if (file.endsWith(".yml")){
        checkDataFile(file,contributorNames);
      } 
    }
  });

  //validate and check headings for the markdown files
  readDirs(pathStart,exemptPaths,function(err,files){
    if (err){
      core.setFailed(err);
    }
    for(const file of files){
      if (file.endsWith(".md")){
        checkMDFile(file);
      } 
    }
  });
} 

catch (error) {
    console.error(error);
    core.setFailed(error.message);
  }
}

run();

