
require.config({
    paths: {
        CerosSDK: 'http://sdk.ceros.com/standalone-player-sdk-v3.min',
        lodash: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash'
    }
});

require(['CerosSDK', 'lodash'], function(CerosSDK, _) {
    CerosSDK.findExperience()
    .fail(function(err){
        console.error("Error: ", err);
    })
    .done(function(experience){

        //TODO  handle multiple carousel

        var allCarousels = [];
        var carouselsLeft = true;
        var numCarousels = 0;

        var forwardArrowClick = function(component) {
            var carouselIndex = getCarouselIndex(component);
            var currentIndex = allCarousels[carouselIndex].currentIndex;

            allCarousels[carouselIndex].showHideLayers[currentIndex].hide();
            if (carouselIndex === -1) {
                console.log('getCarouselIndex returned -1');
            }
            else {
                if (component.getPayload() === "noLoop" || currentIndex != allCarousels[carouselIndex].showHideLayers.length -1){
                    currentIndex++;
                }
                else {
                    currentIndex = 0;
                }
                allCarousels[carouselIndex].showHideLayers[currentIndex].show();
                allCarousels[carouselIndex].currentIndex = currentIndex;

                updateCarouselArrows(currentIndex, carouselIndex);
            }
        };

        var backArrowClick = function(component) {
            var carouselIndex = getCarouselIndex(component);
            var currentIndex = allCarousels[carouselIndex].currentIndex;

            allCarousels[carouselIndex].showHideLayers[currentIndex].hide();
            if (carouselIndex === -1) {
                console.log('getCarouselIndex returned -1');
            }
            else {
                if (component.getPayload() === "noLoop" || currentIndex !== 0){
                    currentIndex--;
                }
                else { //loop
                    currentIndex = allCarousels[carouselIndex].showHideLayers.length - 1;
                }
                allCarousels[carouselIndex].showHideLayers[currentIndex].show();
                allCarousels[carouselIndex].currentIndex = currentIndex;

                updateCarouselArrows(currentIndex, carouselIndex);
            }
        };

        var buttonClick = function(component) {
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
        };

        var updateCarouselArrows = function(currentIndex, carouselIndex) {
            if (allCarousels[carouselIndex].forwardArrow.payload === "noLoop") {
                if (allCarousels[carouselIndex].currentIndex === allCarousels[carouselIndex].showHideLayers.length - 1) {
                    allCarousels[carouselIndex].forwardArrow.hide();
                }
                if (allCarousels[carouselIndex].currentIndex > 0) {
                    allCarousels[carouselIndex].backArrow.show();
                }
            }
            if (allCarousels[carouselIndex].backArrow.payload === "noLoop") {
                if (allCarousels[carouselIndex].currentIndex === 0){
                    allCarousels[carouselIndex].backArrow.hide();
                }
                if (allCarousels[carouselIndex].currentIndex < allCarousels[carouselIndex].showHideLayers.length - 1) {
                    allCarousels[carouselIndex].forwardArrow.show();
                }
            }
        };

        var getCarouselIndex = function(component) {
            var compTags = component.getTags();
            var carouselNum = -1;
            _.each(compTags, function(tag) {
                if (_.startsWith(tag, 'carousel')) {
                    var carouselNumArr = tag.match(/(\d+)$/)
                    if (carouselNumArr){
                        carouselNum = parseInt(tag.match(/(\d+)$/)[0], 10);
                    }
                }
            });
            return (carouselNum - 1); //NOTE RETURNS INDEX INTO ARRAY, NOT DESIGNER NUM
        };

        while (carouselsLeft) {

            var carouselTag = 'carousel' + (numCarousels + 1);
            var carouselObj = {};

            var forwardArrow = experience.findComponentsWithAllTags([carouselTag, 'forward-arrow']);
            if (forwardArrow.components.length == 0){
                carouselsLeft = false;
            }
            else {
                carouselObj.forwardArrow = forwardArrow.components[0];
            }

            var backArrow = experience.findComponentsWithAllTags([carouselTag, 'back-arrow']);
            if (backArrow.components.length == 0){
                carouselsLeft = false;
            }
            else {
                carouselObj.backArrow = backArrow.components[0];
            }

            var showHideLayers = _.filter(experience.findLayersByTag(carouselTag).layers, function(layer) {
                return _.includes(layer.getTags(), 'carousellayer');
            });

            if (showHideLayers.length == 0) {
                carouselsLeft = false;
            }
            else {
                carouselObj.showHideLayers = showHideLayers;
            }
            carouselObj.currentIndex = 0;
            carouselObj.buttons = experience.findComponentsWithAllTags([carouselTag, 'button']);

            if (carouselsLeft) {
                carouselObj.forwardArrow.subscribe(CerosSDK.EVENTS.CLICKED, forwardArrowClick);
                carouselObj.backArrow.subscribe(CerosSDK.EVENTS.CLICKED, backArrowClick);
                carouselObj.buttons.subscribe(CerosSDK.EVENTS.CLICKED, buttonClick);
                allCarousels.push(carouselObj);
                numCarousels++;
            }
        }



    });
});
