define([
    "loDash",
    "modules/CountDownClock"
], function(_, CountDownClock){

    /**
     * A class that listens to events from a CountDownClock and updates cerosComponents when required
     *
     * @param {CountDownClock} countDownClock
     * @param {string} unitsToDisplay
     * @param {number} paddingZeros
     * @constructor
     */
    var ClockDisplayUnit = function(countDownClock, unitsToDisplay, paddingZeros) {

        // Instance of the clock we're listening to
        this.countDownClock = countDownClock;

        // The value currently being displayed
        this.currentValue = null;

        // The cerosComponents to update on change
        this.cerosComponents = [];

        // The Clock units we're displaying
        this.unitsToDisplay = unitsToDisplay;

        // The number of 0s to add our value with, ie "1" becomes "01" if the value is 2
        this.paddingZeros = paddingZeros || 2;

        // Register the units we will be displaying with the CountDownClock
        this.countDownClock.addUnit(unitsToDisplay);

        // Listen for updates from the CountDownClock
        this.countDownClock.bind(
            CountDownClock.EVENTS.TICK,
            this.onTick.bind(this)
        );
    };

    ClockDisplayUnit.prototype = {
        /**
         * Listener for tick events from our CountDownClock
         *
         * @param {object} newTimeSpan
         */
        onTick: function(newTimeSpan) {

            // Build the name of our unit's property on the time span object
            var propertyName  = this.unitsToDisplay.toLowerCase();

            // Get its value
            var newValue = newTimeSpan[propertyName];

            // If the time to our target datetime is too low or high for our mode, display 0
            if (
                (newTimeSpan.value < 0  && this.countDownClock.mode == CountDownClock.MODES.COUNT_DOWN) ||
                (newTimeSpan.value > -1 && this.countDownClock.mode == CountDownClock.MODES.COUNT_UP)
            ){
                newValue = 0;
            }

            // If its value was defined
            if (! _.isUndefined(newValue)) {

                // If the value has changed
                if (this.currentValue != newValue) {

                    // Update the value
                    this.currentValue = newValue;

                    // Update the components
                    this.updateComponents();
                }

            }
        },

        /**
         * Update our CerosComponents to display the current value
         */
        updateComponents: function() {

            // Add leading zeros to value, if needed
            var paddedValue = _.padStart(this.currentValue, this.paddingZeros, "0");

            // Forever component we have
            _(this.cerosComponents).forEach(function(cerosComponent) {

                // Set text value
                cerosComponent.setText(paddedValue);

            })
        },

        /**
         * Add a CerosComponent to have its text content updated on change
         *
         * @param {CerosComponent} cerosComponent
         */
        addCerosComponent: function(cerosComponent) {
            this.cerosComponents.push(cerosComponent);
        }
    };

    return ClockDisplayUnit;
});