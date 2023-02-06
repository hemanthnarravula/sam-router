import inquirer from "inquirer";
import { promises as fsp } from "fs";
import { homedir } from "os";
import {exec} from "child_process"
// console.log(`${homedir()}/.aws/credentials`);
const file = await fsp.readFile(`${homedir()}/.aws/credentials`, {
  encoding: "utf-8",
});
let choices = [
  new inquirer.Separator(),
  {
    name: "Create New Profile",
    value: "create_aws_new_profile",
  },
];
const readLines = file.split("\n");
readLines.forEach((line) => {
  if (line.includes("[")) {
    // console.log(line.replace("[", "").replace("]", ""));
    let choice = line.replace("[", "").replace("]", "").trim();
    choices.unshift(choice);
  }
});

function init() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "aws_profile",
        message: "Select Your AWS Profile",
        choices,
      },
    ])
    .then(async (answers) => {
      console.log(JSON.stringify(answers, null, "  "));
      if (answers.aws_profile === "create_aws_new_profile") {
        // console.log('ask aws keys')
        const questions = [
          {
            type: "input",
            name: "aws_access_key_id",
            message: "What's your aws access key",
          },
          {
            type: "password",
            name: "aws_secret_access_key",
            message: "What's your aws secret key",
          },
        ];
        inquirer.prompt(questions).then(async (awskeys) => {
          console.log(JSON.stringify(awskeys, null, "  "));
            await fsp.writeFile(
              `${homedir()}/.aws/credentials`,
              `\n\n[sam-router] \naws_access_key_id = ${awskeys.aws_access_key_id} \naws_secret_access_key = ${awskeys.aws_secret_access_key}`,
              { flag: "a" }
            );
        });
      } else {
        let accessKey;
        let accessKeySecret;
        readLines.forEach((line, i, list) => {
          if (line.includes([`${answers.aws_profile}`])) {
            accessKey = list[i + 1].split("=")[1].trim();
            accessKeySecret = list[i + 2].split("=")[1].trim();
            console.log(accessKey, accessKeySecret);
          } 
        });

        // exec(`aws sts assume-role --role-arn arn:aws:iam::236731556556:role/TDCDevAdmin --role-session-name CLI-SESSION --profile ${answers.aws_profile}`, (error, stdout, stderr) => {
        //     if (error) {
        //         console.log(`error: ${error.message}`);
        //         return;
        //     }
        //     if (stderr) {
        //         console.log(`stderr: ${stderr}`);
        //         return;
        //     }
        //     console.log(`stdout: ${stdout}`);
        // });

        exec(`sh ./aws-session.sh`, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
        });
      }
    });
}

export default init;
