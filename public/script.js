/* Booking page: live fare estimate, form checks and "Get My Location". */
(function () {
    "use strict";

    var form = document.getElementById("bookingForm");
    if (!form) return;

    var pickupInput = document.getElementById("pickup");
    var destinationInput = document.getElementById("destination");
    var distanceInput = document.getElementById("distance");
    var fareDisplay = document.getElementById("fare");
    var errorBox = document.getElementById("bookingError");

    var locationBtn = document.getElementById("locationBtn");
    var latitudeInput = document.getElementById("latitude");
    var longitudeInput = document.getElementById("longitude");
    var locationMessage = document.getElementById("locationMessage");

    // The rate comes from the server (data-rate) so the page and the server never disagree.
    var fareRate = Number(fareDisplay && fareDisplay.getAttribute("data-rate")) || 50;

    /* ---------- Live fare calculator ---------- */

    function formatFare(distance) {
        if (!isFinite(distance) || distance <= 0) return "0";
        // Round to cents so 0.3 km shows 15, not 15.000000000000002.
        var fare = Math.round(distance * fareRate * 100) / 100;
        return fare.toLocaleString("en-KE", { maximumFractionDigits: 2 });
    }

    function updateFare() {
        fareDisplay.textContent = formatFare(Number(distanceInput.value));
    }

    distanceInput.addEventListener("input", updateFare);

    // The home page estimator links here as /trips?distance=5.5
    var prefill = new URLSearchParams(window.location.search).get("distance");
    if (prefill !== null && Number(prefill) > 0 && Number(prefill) <= 999.99) {
        distanceInput.value = String(Number(prefill));
        updateFare();
    }

    /* ---------- Form checks ---------- */

    function showError(message, field) {
        errorBox.textContent = message;
        errorBox.hidden = false;
        if (field) field.focus();
    }

    function clearError() {
        errorBox.textContent = "";
        errorBox.hidden = true;
    }

    [pickupInput, destinationInput, distanceInput].forEach(function (input) {
        input.addEventListener("input", clearError);
    });

    form.addEventListener("submit", function (event) {
        clearError();

        if (pickupInput.value.trim() === "") {
            event.preventDefault();
            showError("Enter your pickup location.", pickupInput);
            return;
        }

        if (destinationInput.value.trim() === "") {
            event.preventDefault();
            showError("Enter your destination.", destinationInput);
            return;
        }

        var distance = Number(distanceInput.value);
        if (!(distance > 0)) {
            event.preventDefault();
            showError("Distance must be greater than zero.", distanceInput);
        }
    });

    /* ---------- Geolocation ---------- */

    if (locationBtn) {
        locationBtn.addEventListener("click", function () {
            if (!navigator.geolocation) {
                locationMessage.textContent = "Your browser doesn\u2019t support location. Type your pickup instead.";
                return;
            }

            locationMessage.textContent = "Getting your location\u2026";
            locationBtn.classList.add("is-loading");
            locationBtn.setAttribute("aria-disabled", "true");

            function done() {
                locationBtn.classList.remove("is-loading");
                locationBtn.removeAttribute("aria-disabled");
            }

            navigator.geolocation.getCurrentPosition(
                function (position) {
                    latitudeInput.value = position.coords.latitude;
                    longitudeInput.value = position.coords.longitude;
                    locationMessage.textContent = "Location captured.";
                    done();
                },
                function (error) {
                    locationMessage.textContent =
                        error && error.code === 1
                            ? "Location permission was blocked. You can still type your pickup."
                            : "Couldn\u2019t get your location. Type your pickup instead.";
                    done();
                },
                { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
            );
        });
    }
})();
