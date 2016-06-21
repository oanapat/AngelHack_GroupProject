/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var textHelper = require('./textHelper'),
    storage = require('./storage'),
    AlexaSkill = require('./AlexaSkill');

var registerIntentHandlers = function (intentHandlers, skillContext) {
    intentHandlers.NewGameIntent = function (intent, session, response) {
        //reset scores for all existing players
        storage.loadGame(session, function (currentGame) {
            if (currentGame.data.players.length === 0) {
                response.ask('New day today.. Lets get going.');
                return;
            }
            currentGame.data.players.forEach(function (player) {
                currentGame.data.scores[player] = 0;
            });
            currentGame.save(function () {
                var speechOutput = 'New game started with '
                    + currentGame.data.players.length + ' existing player';
                if (currentGame.data.players.length > 1) {
                    speechOutput += 's';
                }
                speechOutput += 'Haha';
                if (skillContext.needMoreHelp) {
                    speechOutput += '. You can give a player points, add another player, reset all players or exit. What would you like?';
                    var repromptText = 'You can give a player points, add another player, reset all players or exit. What would you like?';
                    response.ask(speechOutput, repromptText);
                } else {
                    response.tell(speechOutput);
                }
            });
        });
    };

    intentHandlers.AddPlayerIntent = function (intent, session, response) {
        //add a player to the current game,
        //terminate or continue the conversation based on whether the intent
        //is from a one shot command or not.
        var newPlayerName = textHelper.getPlayerName(intent.slots.PlayerName.value);
        if (!newPlayerName) {
            response.ask('OK. Who do you want to add?', 'Who do you want to add?');
            return;
        }
        storage.loadGame(session, function (currentGame) {
            var speechOutput,
                reprompt;
            if (currentGame.data.scores[newPlayerName] !== undefined) {
                speechOutput = newPlayerName + ' has already joined the game.';
                if (skillContext.needMoreHelp) {
                    response.ask(speechOutput + ' What else?', 'What else?');
                } else {
                    response.tell(speechOutput);
                }
                return;
            }
            speechOutput = newPlayerName + ' has joined your game. ';
            currentGame.data.players.push(newPlayerName);
            currentGame.data.scores[newPlayerName] = 0;
            if (skillContext.needMoreHelp) {
                if (currentGame.data.players.length == 1) {
                    speechOutput += 'You can say, I am Done Adding Players. Now who\'s your next player?';
                    reprompt = textHelper.nextHelp;
                } else {
                    speechOutput += 'Who is your next player?';
                    reprompt = textHelper.nextHelp;
                }
            }
            currentGame.save(function () {
                if (reprompt) {
                    response.ask(speechOutput, reprompt);
                } else {
                    response.tell(speechOutput);
                }
            });
        });
    };

    intentHandlers.AddScoreIntent = function (intent, session, response) {
        //give a player points, ask additional question if slot values are missing.
        var playerName = textHelper.getPlayerName(intent.slots.PlayerName.value),
            score = intent.slots.ScoreNumber,
            scoreValue;
        if (!playerName) {
            response.ask('sorry, I did not hear the player name, please say that again', 'Please say the name again');
            return;
        }
        scoreValue = parseInt(score.value);
        if (isNaN(scoreValue)) {
            console.log('Invalid score value = ' + score.value);
            response.ask('sorry, I did not hear the points, please say that again', 'please say the points again');
            return;
        }
        storage.loadGame(session, function (currentGame) {
            var targetPlayer, speechOutput = '', newScore;
            if (currentGame.data.players.length < 1) {
                response.ask('blah blah');
                return;
            }
            for (var i = 0; i < currentGame.data.players.length; i++) {
                if (currentGame.data.players[i] === playerName) {
                    targetPlayer = currentGame.data.players[i];
                    break;
                }
            }
            if (!targetPlayer) {
                response.ask('Sorry, ' + playerName + ' has not joined the game. What else?', playerName + ' has not joined the game. What else?');
                return;
            }
            newScore = currentGame.data.scores[targetPlayer] + scoreValue;
            currentGame.data.scores[targetPlayer] = newScore;

            speechOutput += scoreValue + ' for ' + targetPlayer + '. ';
            if (currentGame.data.players.length == 1 || currentGame.data.players.length > 3) {
                speechOutput += targetPlayer + ' has ' + newScore + ' in total.';
            } else {
                speechOutput += 'That\'s ';
                currentGame.data.players.forEach(function (player, index) {
                    if (index === currentGame.data.players.length - 1) {
                        speechOutput += 'And ';
                    }
                    speechOutput += player + ', ' + currentGame.data.scores[player];
                    speechOutput += ', ';
                });
            }
            currentGame.save(function () {
                response.tell(speechOutput);
            });
        });
    };

    intentHandlers.TellScoresIntent = function (intent, session, response) {
        storage.loadGame(session, function (currentGame) {
            var sortedPlayerScores = [],
                continueSession,
                speechOutput = '';
                // speechOutput.type = 'SSML',
                // leaderboard = '';
            if (currentGame.data.players.length === 0) {
              currentGame.data.players.push("user");
              currentGame.data.scores["user"] = 1;

                response.tell('No Excuses!! Start your 7 min workout');
                // return;
            }
            currentGame.data.players.forEach(function (player) {
                sortedPlayerScores.push({
                    score: currentGame.data.scores[player],
                    player: player
                });
            });
            sortedPlayerScores.forEach(function (playerScore, index) {
                if (playerScore.score === 1) {
                     speechOutput += 'Refresh, Its time for shower and dont stay there forever';
                } else if (playerScore.score === 2) {
                    // speechOutput += 'Fast & Furious, Get ready in 10 minutes, playing your morning podcast..';
                    speechOutput += "<speak><audio src='https://s3-us-west-2.amazonaws.com/audio-sample-123/blah-con.mp3'/></speak>";
                    var sp = {
                      speech : speechOutput,
                      type: AlexaSkill.speechOutputType.SSML
                    };
                    response.ask(sp, sp);
                    return;

                } else if (playerScore.score === 3) {
                    speechOutput += 'Make sure to have breakfast, thats the most important meal of the day';
                }
                else if (playerScore.score === 4) {
                    speechOutput += 'Its 8 O clock, you must leave now to reach work on time';
                }
            });

            currentGame.data.scores["user"] += 1;

            currentGame.save(function () {
              response.tellWithCard(speechOutput, "", '');
            });
        });
    };

    intentHandlers.ResetPlayersIntent = function (intent, session, response) {
        //remove all players
        storage.newGame(session).save(function () {
            response.ask('Have a great day today');
        });
    };

    intentHandlers['AMAZON.HelpIntent'] = function (intent, session, response) {
        var speechOutput = textHelper.completeHelp;
        if (skillContext.needMoreHelp) {
            response.ask(textHelper.completeHelp + ' So, how can I help?', 'How can I help?');
        } else {
            response.tell(textHelper.completeHelp);
        }
    };

    intentHandlers['AMAZON.CancelIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Say whats that for you next task');
        } else {
            response.tell('');
        }
    };

    intentHandlers['AMAZON.StopIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Say whats that for you next task');
        } else {
            response.tell('');
        }
    };
};
exports.register = registerIntentHandlers;
