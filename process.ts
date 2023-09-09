import fs from "fs";
import csv from "csv";
import { stringify } from "csv-stringify/sync";
import readline from "readline";
import crypto from "crypto";

//create a type for the csv data
export type CsvData = {
  [key: string]: string;
};

const HashColumnName = "Hash";

const parse = csv.parse({ columns: true });

async function readCSVFile(filePath: string): Promise<CsvData[]> {
  const results: CsvData[] = [];

  return new Promise((resolve, reject) => {
    //read file and convert to obeject
    fs.createReadStream(filePath)
      .pipe(parse)
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", (error) => reject(error));
  });
}

function processFile(filePath: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    readCSVFile(filePath)
      .then((data) => {
        //does it have a hash column? if so, reject with an error
        if (data[0].hasOwnProperty(HashColumnName)) {
          reject(new Error("CSV file has a hash column"));
        }

        console.log("first row: ", data[0]);

        // add a hash column, the first one should be the column name
        data.forEach((row) => {
            row[HashColumnName] = crypto
              .createHash("sha256")
              .update(JSON.stringify(row))
              .digest("hex");
        });

        //convert to csv and save
        fs.writeFile(filePath, stringify(data, { header: true }), (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      })
      .catch((error) => reject(error));
  });
}

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  "Please provide path to starling statement csv ",
  function (answer) {
    // console.log("Thank you for your valuable feedback:", answer);

    const pathWithoutQuotes = answer.replace(/['"]+/g, "");

    processFile(pathWithoutQuotes)
      .then(() => {
        console.log("All done!");
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => rl.close());
    rl.close();
  }
);
