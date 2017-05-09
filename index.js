'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
    const config = {
    user: 'thomaszee',
    password: 'Korilu5!',
    server: 'isaschatbot.database.windows.net', // You can use 'localhost\\instance' to connect to named instance 
    database: 'isaschatbot',
        options: {
        encrypt: true
    }
    }

const restService = express();
restService.use(bodyParser.json());


   function getQuery(query, callback) {
    sql.connect(config).then(function () {
        var req = new sql.Request();
        req.query(query).then(function (recordset) {
            sql.close();
             console.log('fucking data thomas');
               console.log(recordset);
        callback(recordset);
        })
        .catch(function (err) {
            console.log(err);
            sql.close();
        });        
    })
    .catch(function (err) {
        console.log(err);
    });
           console.log('now returning');
   }

restService.post('/webhook', function (req, res) {

    console.log('hook request');    
    try {
        var speech = 'empty speech';

        if (req.body) {
            var requestBody = req.body;

            if (requestBody.result) {
                speech = '';

                if (requestBody.result.action != "iSAS.mark") {
                    return {};
                }
                var result = requestBody.result;
                var parameters = result.parameters;
                var cijfer = parameters["Cijfer"];
                var vakken = parameters["Vakken"];
    
               // var cost = { 'Europe': 100, 'North America': 200, 'South America': 300, 'Asia': 400, 'Africa': 500 }
               getQuery("SELECT Value FROM Mark m INNER JOIN Subject s ON m.Subject = s.Id WHERE s.Name = '" + vakken + "' AND m.Student = 1 ", 
                        function(data){
                speech = "JS: Jouw " + cijfer + " voor " + vakken + " is een 8";
                   
                return res.json({
                    speech: speech,
                    displayText: speech,
                    source: 'apiai-webhook-iSAS'
                });
                });
               

                //if (requestBody.result.fulfillment) {
                //    speech += requestBody.result.fulfillment.speech;
                //    speech += ' ';
                //}

                //if (requestBody.result.action) {
                //    speech += 'action: ' + requestBody.result.action;
                //}
            }
        }

        console.log('result: ', speech);

    } catch (err) {
        console.error("Can't process request", err);

        return res.status(400).json({
            status: {
                code: 400,
                errorType: err.message
            }
        });
    }
});

restService.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});
