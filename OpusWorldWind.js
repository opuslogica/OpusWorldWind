define([], function() {
    "use strict";

    /**
     * This is the top-level WorldWind module. It is global.
     * @exports WorldWind
     * @global
     */
    var OpusWorldWind = {
        /**
         * The OpusWorldWind version number.
         * @default "0.1.0"
         * @constant
         */
        VERSION: "0.1.0",
    };

    window.OpusWorldWind = OpusWorldWind;

    return OpusWorldWind;
});

