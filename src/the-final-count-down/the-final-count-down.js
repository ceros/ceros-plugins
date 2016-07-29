(function(){

    // use jQuery to find our script tag in the custom html
    var scriptTag = document.getElementById("ceros-countdown-clock");

    // Calculate an absolute URL for our modules, so they're not loaded from view.ceros.com
    var path = scriptTag.getAttribute("src").split('?')[0];
    var absUrl = path.split('/').slice(0, 3).join('/') +'/';

    // Configure our dependencies. NB: See grunt file for require conf used to build dist.
    require.config({
        paths: {
            CerosSDK:  "//sdk.ceros.com/standalone-player-sdk-v3.min",
            loDash:    "//cdnjs.cloudflare.com/ajax/libs/lodash.js/4.11.1/lodash.min",

            modules:   absUrl + "src/the-final-count-down/modules",
            countdown: absUrl + "node_modules/countdown/countdown",
            moment:    absUrl + "node_modules/moment/moment"
        },

        shim: {
            countdown : {
                exports: "countdown"
            }
        }
    });

    require([
        'CerosSDK',
        "loDash",
        "countdown",
        "moment",
        "modules/CountDownClock",
        "modules/ClockDisplayUnit"
    ], function(CerosSDK, _, countdown, moment, CountDownClock, ClockDisplayUnit) {

        // Find the date we'll be counting down to 
        var targetDateTime = scriptTag.getAttribute("data-countdown-datetime"),
            clockMode = scriptTag.getAttribute("data-countdown-mode");

        if (clockMode === null) {
            clockMode = CountDownClock.MODES.COUNT_DOWN;
        }

        var dateObject = moment(targetDateTime).toDate();

        // Test to make sure we parsed it successfully
        if (_.isNaN(dateObject.getTime())) {
            throw new Error("Unable to parse date string in custom html.");
        }

        if (! _.includes(CountDownClock.MODES, clockMode)) {
            throw new Error("Invalid Clock Mode supplied.");
        }

        CerosSDK.findExperience()
            .fail(function (error) {
                console.error(error);
            })
            .done(function(experience) {

                var countDownClock = new CountDownClock(dateObject, clockMode);

                // Find components that are used as part of the count down clock
                var countDownComponents = experience.findComponentsByTag("count-down");

                // For every component found
                _(countDownComponents.components).forEach(function(component) {

                    // Get component's payload, it denotes the units to be displayed
                    var unitsToDisplay = component.getPayload();

                    // If the unit was valid
                    if (countDownClock.isValidUnit(unitsToDisplay)) {

                        // Create display unit bound to our CountDownClock
                        var clockDisplayUnit = new ClockDisplayUnit(countDownClock, unitsToDisplay);

                        // Add the component to the unit, so that it will be updated
                        clockDisplayUnit.addCerosComponent(component);
                    } else {
                        // Log error
                        console.error("Invalid time units: ", unitsToDisplay);
                    }

                });

                // Star tbe clock ticking
                countDownClock.start();

            });
    });
})();