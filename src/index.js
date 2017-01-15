/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

/**
 * This sample shows how to create a Lambda function for handling Alexa Skill requests that:
 *
 * - Custom slot type: demonstrates using custom slot types to handle a finite set of known values
 *
 * Examples:
 * One-shot model:
 *  User: "Alexa, ask Minecraft Helper how to make paper."
 *  Alexa: "(reads back recipe for paper)"
 */

'use strict';

var AlexaSkill = require('./AlexaSkill');
// var recipes = require('./recipes');

var APP_ID = undefined; //OPTIONAL: replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

/**
 * MinecraftHelper is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var StockLoop = function () {
    AlexaSkill.call(this, APP_ID);
};

function toCamelCase(sentenceCase) {
    var out = "";
    sentenceCase.split(" ").forEach(function (el, idx) {
        var add = el.toLowerCase();
        out += (idx === 0 ? add : add[0].toUpperCase() + add.slice(1));
    });
    return out;
};

var yahooFinance = require('yahoo-finance');
var companyToSymbolMap = {'apple': 'appl'};

var getCompanyMetricString = function(company, metric, value) {
    return "The ${metric} for ${company} is ${value}."
}

// TODO: Map from metric name utterance to yahoo finance field names.
var metricMap = {'name': 'n', 'last trade date': 'd1', 'dividend yield': 'y', 'pe ratio': 'p', 'lastTradePriceOnly': 'l1'};
var metricMapKeys = Object.keys(metricMap);

// Extend AlexaSkill
StockLoop.prototype = Object.create(AlexaSkill.prototype);
StockLoop.prototype.constructor = StockLoop;

StockLoop.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    var speechText = "Welcome to the Stock Looop Helper. You can ask a question like, get P E Ratio for Zynga? ... Now, what can I help you with.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "For instructions on what you can say, please say help me.";
    response.ask(speechText, repromptText);
};

StockLoop.prototype.intentHandlers = {
    "CompanyMetricIntent": function (intent, session, response) {
        // Get the latest metric information for the given company or symbol.
        let symbolSlot = intent.slots.Symbol;
        let metricSlot = intent.slots.Metric;
        let companySlot = intent.slots.Company;

        var symbol, metric, company;
        if (symbolSlot && symbolSlot.value) {
            symbol = symbolSlot.value.toLowerCase();
        }
        if (metricSlot && metricSlot.value) {
            metric = metricSlot.value.toLowerCase();
        }
        if (companySlot && companySlot.value) {
            company = companySlot.value.toLowerCase();
        }

        if (symbol == undefined) {
            if (company != undefined) {
                if (companyToSymbolMap.hasOwnProperty(company)) {
                    symbol = companyToSymbolMap[company];
                } else {
                    // TODO: Attempt to fetch the symbol for the company or get closest existing match.
                }
            }
        }
        symbol = symbol.toUpperCase();

        if (company == undefined) {
            // TODO: Error
        }
        if (metric == undefined) {
            // TODO: Error
        }

        var convertToYahooMetric = function(m) {
            if (m.includes('price')) {
                m = 'last trade price only';
            } else if (m.includes('ratio')) {
                m = 'pe ratio';
            } else if (m.includes('dividend')) {
                m = 'dividend yield';
            } else if (m.includes('company')) {
                m = 'name';
            }
            return m;
        }

        metric = convertToYahooMetric(metric);
        var camelMetric = toCamelCase(metric);
        var yahooFields;

        if (metricMap.hasOwnProperty(camelMetric)) {
            var yahooFields = ['s', 'n'];
            var yahooKey = metricMap[camelMetric];
            if (yahooKey != 'n') {
                yahooFields.push(yahooKey);
            }
        }

        yahooFinance.snapshot({
            symbol: symbol,
            fields: yahooFields  // ex: ['s', 'n', 'd1', 'l1', 'y', 'r']
            }, function (err, snapshot) {
                var speech;
                if (err != undefined) {
                    speech = "There was an error: " + err.toString();
                } else {
                    let value = snapshot[camelMetric];
                    speech = getCompanyMetricString(snapshot.name, metric, value) + " What else can I help with?"
                }
                speechOutput = {
                    speech: speech,
                    type: AlexaSkill.speechOutputType.PLAIN_TEXT
                };
                repromptOutput = {
                    speech: "What else can I help with?",
                    type: AlexaSkill.speechOutputType.PLAIN_TEXT
                };
                response.ask(speechOutput, repromptOutput); 
            /*
            {
                symbol: 'AAPL',
                name: 'Apple Inc.',
                lastTradeDate: '11/15/2013',
                lastTradePriceOnly: '524.88',
                dividendYield: '2.23',
                peRatio: '13.29'
            }
            */
        });

    },

    "HelloIntent": function (intent, session, response) {
        response.tell("Hello");
    },

    "HelloWorldIntent": function (intent, session, response) {
        response.tell("Hello World!")
        // response.tellWithCard("Hello World!", "Hello World", "Hello World!");
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = "Goodbye";
        response.tell(speechOutput);
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var question = "Your StockLoop Question";
        var speechText = "You can ask questions such as, ${question}, or, you can say exit... Now, what can I help you with?";
        var repromptText = "You can say things like, ${question}, or you can say exit... Now, what can I help you with?";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.ask(speechOutput, repromptOutput);
    }
};

exports.handler = function (event, context) {
    var howTo = new StockLoop();
    howTo.execute(event, context);
};
