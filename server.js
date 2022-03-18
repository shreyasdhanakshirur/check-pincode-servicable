const express = require("express");
const app = express();
let mysql = require('mysql');
const axios = require('axios');
const dbConfig = require("./db.config");
const sql = require("./db.js");
const PORT = dbConfig.PORT || 4000;

const connection = mysql.createConnection({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB
});

connection.connect((err) => {

  if(!err)
      console.log('Database is connected!');
  else
      console.log('Database not connected! : '+ JSON.stringify(err, undefined,2));
  });
app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
  })

app.get("/checkServicable", async (request, response) => {
    try {
      console.log(`REQUEST QUERY IS => ${JSON.stringify(request.query)}`);
// Making an axios call for getting pincodes based on lat & long
axios.get(`http://api.positionstack.com/v1/reverse?access_key=${dbConfig.API_KEY}&query=${request.query.query}`)
  .then(res => {
    let pincodesArray = [];
    res.data.data.forEach(element => {
      if(element.postal_code){
        if(!pincodesArray.includes(element.postal_code))
        pincodesArray.push(element.postal_code)
      }
    });
    if(pincodesArray.length === 0){
      console.log(`NO POSTAL CODES FOUND!`);
    response.send({
      "error":true,
      "status":403,
      "message":"No postal codes found!"
    })
    } else {
      sql.query(`SELECT * FROM database1.pincodes WHERE pincode IN (${pincodesArray})`, (err, res) => {
        if (err) {
          console.log("error: ", err);
          return;
        }
        if (res.length === 0) {
          console.log(`USER IS OUT OF SERVICE AREA`);
          response.send({
            "error":false,
            "status":200,
            "message":"User is out of servicable area"
          })
        } else {
          console.log(`USER IS INSIDE SERVICABLE AREA!`);
          response.send({
            "error":false,
            "status":200,
            "message":"User is inside of servicable area"
          })
        }
      });
      }
  }).catch(error => {
    console.log(error);
  });
    } catch (error) {
      response.status(500).send(error);
    }
});

