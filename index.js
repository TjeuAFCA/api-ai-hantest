'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');

const restService = express();
restService.use(bodyParser.json());

restService.post('/webhook', function (req, res) {

    console.log('hook request');
    const config = {
    user: 'thomaszee',
    password: 'Korilu5!',
    server: 'isaschatbot.database.windows.net', // You can use 'localhost\\instance' to connect to named instance 
    database: 'isaschatbot',
        options: {
        encrypt: true
    }
}
    // Test this 
sql.connect(config).then(pool => {
    // Query 
    
    return pool.request()
    .query('select * from Student')
//     pool.close()
}).then(data => {
    console.dir(data);
    console.log('result!');
    
}).catch(err => {
    console.log(err);
    console.log('catch!');
    // ... error checks 
})
 
sql.on('error', err => {
    console.log(err);
    // ... error handler 
})
var newData = sql.query('select * from Student');
console.log('NEwdata = ');
console.log(newData);
sql.close();
   

    // test
    
    try {
        //test
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

                var speech = "JS: Jouw " + cijfer + " voor " + vakken + " is een 8";

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
