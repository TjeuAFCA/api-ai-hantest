'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');


const restService = express();
restService.use(bodyParser.json());

restService.post('/webhook', function (req, res) {

    console.log('hook request');

   // try {
        var speech = 'empty speech';

        if (req.body) {
            var requestBody = req.body;

            if (requestBody.result) {
                speech = '';

                if (requestBody.result.action != "shipping.cost") {
                    return {};
                }
                var result = requestBody.result;
                var parameters = result.parameters;
                var zone = parameters["shipping-zone"];
                
                 // try {
                      sql.connect('mssql://thomaszee:Korilu5!@isaschatbot.database.windows.net/isaschatbot', err => {
                          
    new sql.Request().query('select FirstName from Student where id = 1', (err, result) => {
        console.dir(result)
    })

})

sql.on('error', err => {
    console.log(err);
})

                                                                
                 /*    const pool = sql.connect('mssql://thomaszee:Korilu5!@isaschatbot.database.windows.net/isaschatbot')
                     const sqlResult = sql.query('select FirstName from Student where id = 1');
                      console.log('sqlresult below');
                      console.log(sqlResult);
                  } catch (err) {
                        console.log('sqlerr: ' + err);
                  } */

                var cost = { 'Europe': 100, 'North America': 200, 'South America': 300, 'Asia': 400, 'Africa': 500 }

                var speech = "JS: The cost of shipping to " + zone + " is " + cost[zone] + " euros.";

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

        return res.json({
            speech: speech,
            displayText: speech,
            source: 'apiai-webhook-sample'
        });
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
