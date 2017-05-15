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
};

const restService = express();
restService.use(bodyParser.json());


function executeQuery(query, callback) {
    sql.connect(config).then(function () {
        var req = new sql.Request();
        req.query(query).then(function (recordset) {
            sql.close();
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
}

function getResultText(res, text){
    return res.json({
        speech: text,
        displayText: text,
        source: 'apiai-webhook-iSAS'
    });
}

function getSuggestion(query, res){
    console.log(query);
    var speech = "";
    executeQuery(query,
        function (data) {
            if(data.recordset[0]){
                if(data.recordset.length > 1){
                    speech = "Bedoelde je misschien ";
                    for(var i = 0; i < data.recordset.length; i++){
                        if(i == data.recordset.length - 1){
                            speech += "of ";
                        }
                        speech += data.recordset[i];
                        if(i !== data.recordset.length - 1){
                            speech += ", ";
                        }

                    }
                    data.recordset.forEach(function(subject){
                        speech += subject;
                    })
                }
                else{
                    speech = "Bedoelde je misschien " + data.recordset[0].Name + "?";
                }
            }
            else{
                speech = "Sorry, deze vraag kan ik niet voor je beantwoorden.."
            }

            return getResultText(res, speech);
        });
}

restService.post('/webhook', function (req, res) {

    console.log('hook request');
    try {
        var speech = 'empty speech';

        if (req.body) {
            var requestBody = req.body;

            if (requestBody.result) {
                speech = '';
                var result = requestBody.result;
                var parameters = result.parameters;

                if (requestBody.result.action == "iSAS.mark") {
                    var cijfer = parameters["Cijfer"];
                    var vakken = parameters["Vakken"];

                    executeQuery("SELECT Value FROM Mark m INNER JOIN Subject s ON m.Subject = s.Id WHERE s.Name = '" + vakken + "' AND m.Student = 1 ",
                        function (data) {
                            if(data.recordset[0]){
                                speech = "Jouw " + cijfer + " voor " + vakken + " is een " + data.recordset[0].Value;
                                return getResultText(res, speech);
                            }
                            else{
                                speech = getSuggestion("SELECT s.Name From Subject s INNER JOIN Test t ON s.Id = t.Subject INNER JOIN Student st ON t.Class = st.Class WHERE st.Id = 1 AND s.Name LIKE '%" + vakken + "%'", res);
                            }
                        });
                }
                else if(requestBody.result.action == "iSAS.teacher"){
                    var leraar = parameters["leraar"];
                    var vakken = parameters["Vakken"];

                    executeQuery("SELECT Teacher.Name FROM Teacher INNER JOIN Test ON Teacher.Id = Test.Teacher INNER JOIN Student ON Test.Class = Student.Class INNER JOIN Subject ON Test.Subject = Subject.Id WHERE Student.Id = 1 AND Subject.Name = '" + vakken + "'",
                        function (data) {
                            console.log(data);
                            console.log('test');
                            speech = "Voor " + vakken + " is je " + leraar + " " +  data.recordset[0].Name;
                            return getResultText(res, speech);
                        });
                }
                else{
                    return {};
                }



                //if (requestBody.result.fulfillment) {
                //    speech += requestBody.result.fulfillment.speech;
                //    speech += ' ';
                //}

                //if (requestBody.result.action) {
                //    speech += 'action: ' + requestBody.result.action;
                //}
            }
        }
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
