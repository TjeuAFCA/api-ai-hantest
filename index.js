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

function getResultText(res, text, context) {
    var response = {};
    if(context){
        response = {
            speech: text,
            displayText: text,
            contextOut: context,
            source: 'apiai-webhook-iSAS'
        }
    }
    else{
        response = {
            speech: text,
            displayText: text,
            source: 'apiai-webhook-iSAS'
        }
    }
    return res.json(response);
}

function getContext(res, propertyName, replacement){
    var contextLength = res.req.body.result.contexts.length - 1;
    var context =  res.req.body.result.contexts[contextLength];
    context.parameters[propertyName] = replacement;
    return [context];
}

function getSuggestion(query, propertyName, res, action) {
    var speech = "";
    var context = null;
    executeQuery(query,
        function (data) {
            if (data.recordset[0]) {
                if (data.recordset.length > 1) {
                    speech = "Bedoelde je misschien ";

                    for (var i = 0; i < data.recordset.length; i++) {
                        speech += data.recordset[i][propertyName];

                        if (i !== data.recordset.length - 1 && i !== data.recordset.length - 2) {
                            speech += ", ";
                        }
                        else if (i == data.recordset.length - 2) {
                            speech += " of ";
                        }
                    }
                    speech += "?";
                }
                else {
                    speech = "Bedoelde je misschien " + data.recordset[0][propertyName] + "?";
                    context = getContext(res, action, data.recordset[0][propertyName]);
                }
            }
            else {
                speech = "Sorry, deze vraag kan ik niet voor je beantwoorden.."
            }

            return getResultText(res, speech, context);
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
                            if (data.recordset[0]) {
                                speech = "Jouw " + cijfer + " voor " + vakken + " is een " + data.recordset[0].Value;
                                return getResultText(res, speech);
                            }
                            else {
                                speech = getSuggestion("SELECT s.Name From Subject s INNER JOIN SubjectFulfillment t ON s.Id = t.Subject INNER JOIN Student st ON t.Class = st.Class WHERE st.Id = 1 AND s.Name LIKE '%" + vakken + "%'", 'Name', res, 'Vakken');
                            }
                        });
                }
                else if (requestBody.result.action == "iSAS.teacher") {
                    var leraar = parameters["Leraar"];
                    var vakken = parameters["Vakken"];

                    executeQuery("SELECT Teacher.Name FROM Teacher INNER JOIN SubjectFulfillment ON Teacher.Id = SubjectFulfillment.Teacher INNER JOIN Student ON SubjectFulfillment.Class = Student.Class INNER JOIN Subject ON SubjectFulfillment.Subject = Subject.Id WHERE Student.Id = 1 AND Subject.Name = '" + vakken + "'",
                        function (data) {
                            if (data.recordset[0]) {
                                speech = "Voor " + vakken + " is je " + leraar + " " + data.recordset[0].Name;
                                return getResultText(res, speech);
                            }
                            else {
                                speech = getSuggestion("SELECT s.Name From Subject s INNER JOIN SubjectFulfillment t ON s.Id = t.Subject INNER JOIN Student st ON t.Class = st.Class WHERE st.Id = 1 AND s.Name LIKE '%" + vakken + "%'", 'Name', res, 'Vakken');
                            }
                        });
                }
                else if (requestBody.result.action == "iSAS.teacherEmail") {
                    var leraar = parameters["Leraar"];

                    executeQuery("SELECT t.email FROM Teacher t WHERE t.Name = '" + leraar + "'",
                        function (data) {
                            if (data.recordset[0]) {
                                speech = "Het e-mailadres van " + leraar + " is " + data.recordset[0].email;
                                return getResultText(res, speech);
                            }
                            else {
                                speech = getSuggestion("SELECT t.Name FROM Teacher t WHERE t.Name LIKE '%" + leraar + "%'", 'Name', res, 'Leraar');
                            }
                        });
                }
                else if (requestBody.result.action == "iSAS.exam") {
                    var vakken = parameters["Vakken"];

                    executeQuery("SELECT e.DateTime, e.Name FROM Exam e INNER JOIN Class c ON e.Class = c.Id INNER JOIN Student s ON c.Id = s.Class INNER JOIN Subject su ON su.Id = e.Subject WHERE s.Id = 1 AND su.Name = '" + vakken + "'",
                        function (data) {
                            if (data.recordset[0]) {
                                var time = Date.parse(data.recordset[0].DateTime);
                                var examDate = new Date(time);
                                examDate = examDate.getDate() + "-" + examDate.getMonth() + "-" + examDate.getFullYear() + " om " + examDate.getHours() + ":" + examDate.getMinutes() + " uur";
                                speech = "Je toets (" +  data.recordset[0].Name + ") voor " + vakken + " is op " + examDate;
                                return getResultText(res, speech);
                            }
                            else {
                                speech = getSuggestion("SELECT s.Name From Subject s INNER JOIN SubjectFulfillment t ON s.Id = t.Subject INNER JOIN Student st ON t.Class = st.Class WHERE st.Id = 1 AND s.Name LIKE '%" + vakken + "%'", 'Name', res, 'Vakken');
                            }
                        });
                }
                else {
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
