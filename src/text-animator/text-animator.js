/**
 * Ceros Text Animator Plugin
 * @version 0.1.0
 * @support support@ceros.com
 *
 * This plugin allows you to animate ON EXPERIENCE LOAD text components tagged with `text-animate`;
 *
 * You can define mulitple text components and options for the animation.
 *
 * options include:
 * 'randomize' : before characters resolve, make this true for random characters with random colors, false for blank
 *              e.g. animating the word "ANIMATE":  ANIM$gR  vs ANIM
 * 'milliseconds-per-letter' : the number of milliseconds before the next letter resolves
 * 'scrambles-per-letter`: the number of random character updates before resolving the next letter
 *              e.g if 2, ANIM$gR might become ANIM^f# before resolving to ANIMA*r and cycling again.
 *                  NOTE: updates-per-cycle * character-update-interval will give you the number of ms for each character resolution
 *
 * This plugin is licensed under the MIT license. A copy of this license and
 * the accompanying source code is available at https://github.com/ceros/ceros-plugins
 */

(function() {

    require.config({
        paths: {
            CerosSDK: "//sdk.ceros.com/standalone-player-sdk-v3"
        }
    });

    require(['CerosSDK'], function (CerosSDK) {

        function TextAnimator(textComponent, opt){
            var self = this;

            //options
            self.textColor = '#000';
            self.useRandomCharacters = opt['randomize'] || false;
            self.useTypewriterEffect = opt['typewriter'] || false;
            self.milliSecondsPerLetter = parseInt(opt['milliseconds-per-letter']) || 100;
            self.scramblesPerLetter = parseInt(opt['scrambles-per-letter'], 10) || 1;
            self.mixedCharacterUpdateInterval = self.useTypewriterEffect ? getRandomInterval() : (self.milliSecondsPerLetter / self.scramblesPerLetter).toFixed(2);

            self.now;
            self.then = Date.now();

            self.characterSpans = textComponent.find('span');
            var firstLetter = self.characterSpans[0];

            if (firstLetter) {
                self.textColor = firstLetter.style.color;
            }

            self.originalLetters = [];
            self.characterSpans.each(
                function(index, item) {
                    self.originalLetters.push(item.innerHTML);
                    item.innerHTML = " ";
                });


            self.delta;
            self.elapsedNumberOfUpdatesForCurrentCharacter = 0;
            self.currentCharacter = 0;
            self.needUpdate = true;

            self.colors = [
                '#f44336','#e91e63','#9c27b0',
                '#673ab7','#3f51b5','#2196f3',
                '#03a9f4','#00bcd4','#009688',
                '#4caf50','#8bc34a','#cddc39',
                '#ffeb3b','#ffc107','#ff9800',
                '#ff5722','#795548','#9e9e9e',
                '#607d8b'
            ];

            self.chars = [
                'A','B','C','D',
                'E','F','G','H',
                'I','J','K','L',
                'M','N','O','P',
                'Q','R','S','T',
                'U','V','W','X',
                'Y','Z','!','§','$','%',
                '&','/','(',')',
                '=','?','_','<',
                '>','^','°','*',
                '#','-',':',';','~'
            ];

            function getRandomInterval() {
                return Math.floor(Math.random() * 186) + 15
            }


            self.getRandomColor = function () {
                var randNum = Math.floor( Math.random() * self.colors.length );
                return self.colors[randNum];
            };


            self.getRandCharacter = function(characterToReplace){
                if(characterToReplace == " " || !self.useRandomCharacters){
                    return ' ';
                }

                var randNum = Math.floor(Math.random() * self.chars.length);
                var pickedCharacter = self.chars[randNum];
                return (-.5 + Math.random()) < 0 ? pickedCharacter.toLowerCase() : pickedCharacter;

            };

            self.updateCharacterSpan = function (character, color,span) {
                span.style.color = color;
                span.innerHTML = character;
                return span;
            };

            self.updateCharacter = function () {

                self.now = Date.now();
                self.delta = self.now - self.then;

                if (self.delta > self.mixedCharacterUpdateInterval) {

                    self.characterSpans.each(function (index) {
                        var characterSpan = this;
                        var color;
                        var character;
                        if(index > self.currentCharacter){
                            color = self.getRandomColor();
                            character = self.getRandCharacter(self.originalLetters[index]);
                        } else{
                            color = self.textColor;
                            character = self.originalLetters[index];
                        }
                        self.updateCharacterSpan(character, color, characterSpan);
                    });
                    self.elapsedNumberOfUpdatesForCurrentCharacter++;

                    self.mixedCharacterUpdateInterval = getRandomInterval();

                    if(self.elapsedNumberOfUpdatesForCurrentCharacter === self.scramblesPerLetter && self.currentCharacter !== self.characterSpans.length){
                        self.currentCharacter++;
                        self.elapsedNumberOfUpdatesForCurrentCharacter = 0;
                    }

                    if(self.currentCharacter === self.characterSpans.length){
                        self.needUpdate = false;
                    }

                    self.then = self.now - (self.delta % self.mixedCharacterUpdateInterval);

                }
            };

            function update() {
                if(self.needUpdate){
                    self.updateCharacter();
                }

                requestAnimationFrame(update);
            }

            update();
        }

        function runLayerTextAnimators(layer) {
            var taggedComponents = layer.findAllComponents().findComponentsByTag('text-animate').components;
            _.each(taggedComponents, function(component) {
                var options = {};
                _.each(component.tags, function(tag) {
                    if (tag.indexOf("=") > -1) {
                        var option = tag.split('=');
                        options[option[0]] =  option[1];
                    } else {
                        options[tag] = true;
                    }
                });

                new TextAnimator($('#' + component.id), options);
            });
        }


        CerosSDK.findExperience().done(function(experience){
            var allLayers = experience.findAllLayers().layers;

            _.each(allLayers, function(layer) {
                if ($('#' +layer.id).css('display') === "none") {
                    layer.subscribe(CerosSDK.EVENTS.SHOWN, function(layer) {
                        runLayerTextAnimators(layer);
                    });
                } else {
                    runLayerTextAnimators(layer);
                }
            })


        });
    });
})();


