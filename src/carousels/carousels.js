/**
 * Ceros Carousels Plugin
 * @version 0.3.0
 * @support support@ceros.com
 * This plugin allows you to create image carousels in the Ceros Studio by
 * simply tagging the components that make up each carousel. To use this plugin,
 * for each desired carousel (where X is a number) do the following:
 *
 * 1.  Create a separate layer for each slide to be shown
 *    - Give each layer the tags "carouselX" (i.e. carousel1) and "carousel-layer"
 *    - This layer will contain the image to be shown, as well as the button highlight (if there is one)
 *    - The layers need to be ordered in the layers panel in the same order that you want them displayed
 *      (Example: slide 1 will be above slide 2 in the layers panel)
 * .     NOTE: multiple carousels must be labeled in ascending order - 1,2,3,4, etc...
 * 2.  (Optional) Create forward and back arrow components
 *    - For the forward arrow, give it the tags "carouselX" and "forward-arrow"
 *    - For the back arrow, give it the tags "carouselX" and "back-arrow"
 *    - (Optional) If you would like the carousel not to loop, add 'noLoop'
 *      to the payload of the forward arrow
 * 3. (Optional) Create buttons to navigate the slides
 *    - Create as many button components as there are slides
 *    - DO NOT put them on the same layer as any of the slides
 *    - Put the corresponding slide number in the button's payload. (1, 2, 3, etc.)
 * 4. (Optional) Create timed auto-advancing slides
 *    - Create an invisible layer (can be empty), with the tags: 'carouselX' and 'timer-layer'
 *    - Create any interaction that will show the hidden layer (i.e. a hotspot that shows the layer on view)
 *    - As soon as the timer layer is shown, the slides will automatically start auto-advancing
 *    - Add the duration of each slides appearance to their respective layer's payload (in seconds)
 *    - The durations can be different for each slide, and can be decimal values
 *
 * This plugin is licensed under the MIT license. A copy of this license and
 * the accompanying source code is available at https://github.com/ceros/ceros-plugins
 */

(function() {

    require.config({
        paths: {
            CerosSDK: 'http://sdk.ceros.com/standalone-player-sdk-v3.min',
            lodash: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash.min'
        }
    });

    require(['CerosSDK', 'lodash'], function(CerosSDK, _) {
        CerosSDK.findExperience()
        .fail(function(err){
            console.error("Error: ", err);
        })
        .done(function(experience){
            var allCarousels = [];
            var carouselsLeft = true;
            var numCarousels = 0;

            while (carouselsLeft) {
                var carouselTag = 'carousel' + (numCarousels + 1);
                carouselsLeft = createCarousel(carouselTag);
                numCarousels++;
            }


            /**
             * Creates a carousel object based on a carousel tag ('carousel1')
             * @param carouselTag {string} numbered carousel tag('carousel1')
             * @return {boolean} carousel object succesfully created
             */
            function createCarousel(carouselTag) {
                var carouselObj = {};

                carouselObj.loops = true;

                var forwardArrow = experience.findComponentsWithAllTags([carouselTag, 'forward-arrow']);
                if (forwardArrow.components.length !== 0){
                    carouselObj.forwardArrow = forwardArrow.components[0];
                    carouselObj.forwardArrow.subscribe(CerosSDK.EVENTS.CLICKED, moveToNextSlide);
                    if (carouselObj.forwardArrow.getPayload() === "noLoop"){
                        carouselObj.loops = false;
                    }
                }

                var backArrow = experience.findComponentsWithAllTags([carouselTag, 'back-arrow']);
                if (backArrow.components.length !== 0){
                    carouselObj.backArrow = backArrow.components[0];
                    carouselObj.backArrow.subscribe(CerosSDK.EVENTS.CLICKED, moveToPrevSlide);
                }

                var showHideLayers = _.filter(experience.findLayersByTag(carouselTag).layers, function(layer) {
                    return _.includes(layer.getTags(), 'carousel-layer');
                });

                if (showHideLayers.length === 0) {
                    return false;
                }

                else {
                    //TODO find a cleaner way to do this - a bit uneccesary for finding one layer, rather than an array
                    var timerLayer = _.filter(experience.findLayersByTag(carouselTag).layers, function(layer) {
                        return _.includes(layer.getTags(), 'timer-layer');
                    });
                    if (timerLayer.length === 0) {
                        carouselObj.hasTimer = false;
                    }
                    else {
                        carouselObj.times = [];
                        for (var i = 0; i < showHideLayers.length; i++) {
                            //safety check for parseInt
                            var payload = parseFloat(showHideLayers[i].getPayload());
                            if (!isNaN(payload)) {
                                carouselObj.times.push(payload);
                            }
                            else {
                                carouselObj.hasTimer = false; //if not every layer has time, won't use timer
                            }

                        }
                        carouselObj.timerLayer = timerLayer[0];
                        carouselObj.hasTimer = true;
                        carouselObj.timerLayer.subscribe(CerosSDK.EVENTS.SHOWN, timerStart);
                        carouselObj.timerId = 0; //set when settimeout is called, needed for cleartimeout

                    }
                }

                carouselObj.showHideLayers = showHideLayers;
                carouselObj.currentIndex = 0;
                carouselObj.buttons = experience.findComponentsWithAllTags([carouselTag, 'button']);

                carouselObj.buttons.subscribe(CerosSDK.EVENTS.CLICKED, buttonClick);
                allCarousels.push(carouselObj);

                return true;
            }

            /**
             * Click handler for forward arrow buttonClick
             * advances carousel to the next slide, and updates arrows visibility
             * @param component {component} the arrow component that was clicked
             */
            function moveToNextSlide(component) {
                var carouselIndex = getCarouselIndex(component);
                var currentIndex = allCarousels[carouselIndex].currentIndex;


                allCarousels[carouselIndex].showHideLayers[currentIndex].hide();
                if (carouselIndex === -1) {
                    console.log('getCarouselIndex returned -1');
                }
                else {
                    if (allCarousels[carouselIndex].loops === false || currentIndex != allCarousels[carouselIndex].showHideLayers.length -1){
                        currentIndex++;
                    }
                    else {
                        currentIndex = 0;
                    }
                    allCarousels[carouselIndex].showHideLayers[currentIndex].show();
                    allCarousels[carouselIndex].currentIndex = currentIndex;
                    updateCarouselArrows(currentIndex, carouselIndex);

                    if (allCarousels[carouselIndex].hasTimer){
                        clearTimeout(allCarousels[carouselIndex].timerId);
                        timerStart(component);
                    }
                }
            }

            /**
             * Click handler for back arrow buttonClick
             * advances carousel to the previous slide, and updates arrows visibility
             * @param component {component} the arrow component that was clicked
             */
            function moveToPrevSlide(component) {
                var carouselIndex = getCarouselIndex(component);
                var currentIndex = allCarousels[carouselIndex].currentIndex;

                allCarousels[carouselIndex].showHideLayers[currentIndex].hide();
                if (carouselIndex === -1) {
                    console.log('getCarouselIndex returned -1');
                }
                else {
                    if (allCarousels[carouselIndex].loops === false || currentIndex !== 0){
                        currentIndex--;
                    }
                    else { //loop
                        currentIndex = allCarousels[carouselIndex].showHideLayers.length - 1;
                    }
                    allCarousels[carouselIndex].showHideLayers[currentIndex].show();
                    allCarousels[carouselIndex].currentIndex = currentIndex;

                    updateCarouselArrows(currentIndex, carouselIndex);

                    if (allCarousels[carouselIndex].hasTimer){
                        clearTimeout(allCarousels[carouselIndex].timerId);
                        timerStart(component);
                    }
                }
            }

            /**
             * Click handler for slide button click
             * advances carousel to the appropriate slide based on the buttons payload
             * @param component {component} the button component that was clicked
             */
            function buttonClick(component) {
                //NOTE: Designer arrays start at 1
                var layerIndex = parseInt(component.getPayload(), 10) - 1;
                var carouselIndex = getCarouselIndex(component);

                allCarousels[carouselIndex].showHideLayers[layerIndex].show();
                for (i = 0; i < allCarousels[carouselIndex].showHideLayers.length; i++) {
                    if (layerIndex !== i) {
                        allCarousels[carouselIndex].showHideLayers[i].hide();
                    }
                }
                allCarousels[carouselIndex].currentIndex = layerIndex;
                updateCarouselArrows(layerIndex, carouselIndex);

                if (allCarousels[carouselIndex].hasTimer){
                    clearTimeout(allCarousels[carouselIndex].timerId);
                    timerStart(component);
                }
            }

            /**
             * Starts the timer on the current slide from 0
             * advances carousel to the appropriate slide based on the buttons payload
             * @param component {component} compnent that is used to find carouselIndex
             */
            function timerStart(component) {
                var carouselIndex = getCarouselIndex(component);
                var timeoutTime = allCarousels[carouselIndex].times[allCarousels[carouselIndex].currentIndex];
                allCarousels[carouselIndex].timerId = setTimeout(function() {
                    if (allCarousels[carouselIndex].loops === false) {
                        if (allCarousels[carouselIndex].currentIndex !== allCarousels[carouselIndex].showHideLayers.length - 1) {
                            moveToNextSlide(component);
                        }
                    }
                    else {
                        moveToNextSlide(component);
                    }
                }, timeoutTime * 1000);
            }


            /**
             * Updates the visibility of the forwardArrow and backArrow if looping is disabled
             * @param currentIndex {int} the index of the current slide
             * @param carouselIndex {int} the index of the current carousel
             */
            function updateCarouselArrows(currentIndex, carouselIndex) {
                if (typeof allCarousels[carouselIndex].forwardArrow != "undefined"){
                    if (allCarousels[carouselIndex].loops === false) {
                        if (allCarousels[carouselIndex].currentIndex === allCarousels[carouselIndex].showHideLayers.length - 1) {
                            allCarousels[carouselIndex].forwardArrow.hide();
                        }
                        if (allCarousels[carouselIndex].currentIndex > 0) {
                            allCarousels[carouselIndex].backArrow.show();
                        }
                    }
                }
                if (typeof allCarousels[carouselIndex].forwardArrow != "undefined"){
                    if (allCarousels[carouselIndex].loops === false) {
                        if (allCarousels[carouselIndex].currentIndex === 0){
                            allCarousels[carouselIndex].backArrow.hide();
                        }
                        if (allCarousels[carouselIndex].currentIndex < allCarousels[carouselIndex].showHideLayers.length - 1) {
                            allCarousels[carouselIndex].forwardArrow.show();
                        }
                    }
                }
            }

            /**
             * Gets the index of the carousel, based on the given components tags
             * @param component {component} the component that has the carousel tag
             */
            function getCarouselIndex(component) {
                var compTags = component.getTags();
                var carouselNum = -1;
                _.each(compTags, function(tag) {
                    if (_.startsWith(tag, 'carousel')) {
                        var carouselNumArr = tag.match(/(\d+)$/);
                        if (carouselNumArr){
                            carouselNum = parseInt(carouselNumArr[0], 10);
                        }
                    }
                });
                return (carouselNum - 1); //NOTE RETURNS INDEX INTO ARRAY, NOT DESIGNER NUM
            }
        });
    });
})();
