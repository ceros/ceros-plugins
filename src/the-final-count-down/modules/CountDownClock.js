define([
    "countdown",
    "modules/MicroEvent",
    "loDash"
], function(countdown, MicroEvent, _){

    /**
     * A wrapper that providers an API for countdown.js
     *
     * @param {Date} date
     * @param {string} mode
     * @constructor
     */
    var CountDownClock = function(date, mode) {

        // The mode for this instance of the clock
        this.mode = mode || CountDownClock.MODES.COUNT_DOWN;

        // The date we're counting down to
        this.date = date;

        // bitwise operator containing the units to be displayed, ie: HOURS, SECONDS, etc
        this.units = 0;

        // A list of units already added
        this.includedUnits = [];

        // The interval used by countdown.js
        this.interval = null;
    };

    // The counting modes that the clock can run in
    CountDownClock.MODES = {
        COUNT_UP:   "COUNT-UP",
        COUNT_DOWN: "COUNT-DOWN"
    };

    // Events supported by the clock
    CountDownClock.EVENTS = {
        TICK: "COUNTDOWNCLOCK-TICK"
    };

    CountDownClock.prototype = {
        /**
         * Add a unit to be displayed, ie: HOURS, SECONDS, etc
         *
         * @param {string} unitConstant
         */
        addUnit: function(unitConstant) {

            this.assertClockNotRunning();
            this.assertValidUnit(unitConstant);

            // If this unit hasn't already been added
            if (this.includedUnits.indexOf(unitConstant) < 0) {

                // Add unit to our list of existing units
                this.includedUnits.push(unitConstant);

                // XOR in the bitwise operator to our number
                this.units = this.units | countdown[unitConstant];
            }

        },

        /**
         * Start the clock running
         */
        start: function() {

            this.assertClockNotRunning();

            var self = this;

            // setup countdown.js with a callback that triggers the tick event for our subscribers
            this.interval = countdown(

                function(newTimeSpan){
                    self.trigger(
                        CountDownClock.EVENTS.TICK,
                        newTimeSpan
                    );
                },

                this.date,
                this.units
            );
        },

        /**
         * Stop the clock from running
         */
        stop: function () {

            // If the interval is not null, clear it at set it to null
            if (! _.isNull(this.interval)) {
                clearInterval(this.interval);
                this.interval = null;
            }

        },

        /**
         * Check that supplied unit is supported by countdown.js
         *
         * @param {string} unit
         */
        isValidUnit: function(unit) {

            // Check to see if the unit exists on the countdown object
            if (_.isUndefined(countdown[unit])) {
                return false;
            }

            return true;
        },

        /**
         * Assert that supplied unit is supported by countdown.js
         *
         * @param {string} unit
         */
        assertValidUnit: function(unit) {
            if (this.isValidUnit(unit) == false) {
                throw new Error("Invalid unit type");
            }
        },

        /**
         * Assert that the clock is not already running
         */
        assertClockNotRunning: function() {
            // Check interval is null
            if (! _.isNull(this.interval)) {
                throw new Error("Clock already running");
            }

        }
    };

    // Apply MicroEvents' mixin to the CountDownClock's prototype so that it can broadcast events
    MicroEvent.mixin(CountDownClock);

    return CountDownClock;
});