/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var textHelper = (function () {
    var nameBlacklist = {
        player: 1,
        players: 1
    };

    return {
        completeHelp: 'you can say whats up to learn your next task',
        nextHelp: '',

        getPlayerName: function (recognizedPlayerName) {
            if (!recognizedPlayerName) {
                return undefined;
            }
            var split = recognizedPlayerName.indexOf(' '), newName;

            if (split < 0) {
                newName = recognizedPlayerName;
            } else {
                //the name should only contain a first name, so ignore the second part if any
                newName = recognizedPlayerName.substring(0, split);
            }
            if (nameBlacklist[newName]) {
                //if the name is on our blacklist, it must be mis-recognition
                return undefined;
            }
            return newName;
        }
    };
})();
module.exports = textHelper;
