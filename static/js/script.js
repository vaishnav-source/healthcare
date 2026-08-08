document.addEventListener("DOMContentLoaded", function () {

    console.log("HealthPredict frontend loaded.");


    // ============================================================
    // GET FORM ELEMENTS
    // ============================================================

    const form = document.getElementById("predictionForm");

    const predictButton =
        document.getElementById("predictButton");

    const normalContent =
        document.getElementById("buttonNormalContent");

    const loadingContent =
        document.getElementById("buttonLoadingContent");

    const ageInput =
        document.getElementById("Age");

    const leadTimeInput =
        document.getElementById("LeadTime");

    const neighbourhoodSelect =
        document.getElementById("Neighbourhood");

    const genderSelect =
        document.getElementById("Gender");

    const weekdaySelect =
        document.getElementById("AppointmentWeekday");


    // ============================================================
    // FORM DOES NOT EXIST
    // ============================================================

    if (!form) {

        console.log(
            "Prediction form not found on this page."
        );

        return;

    }


    // ============================================================
    // AGE VALIDATION
    // ============================================================

    if (ageInput) {

        ageInput.addEventListener(
            "input",
            function () {

                let age =
                    Number(this.value);


                if (age < 0) {

                    this.value = 0;

                }


                if (age > 120) {

                    this.value = 120;

                }

            }
        );

    }


    // ============================================================
    // LEAD TIME VALIDATION
    // ============================================================

    if (leadTimeInput) {

        leadTimeInput.addEventListener(
            "input",
            function () {

                let value =
                    Number(this.value);


                if (value < 0) {

                    this.value = 0;

                }


                if (value > 3650) {

                    this.value = 3650;

                }

            }
        );

    }


    // ============================================================
    // REMOVE ERROR STATE
    // ============================================================

    function clearFieldError(field) {

        if (!field) {
            return;
        }


        field.classList.remove(
            "is-invalid"
        );

    }


    // ============================================================
    // ADD ERROR STATE
    // ============================================================

    function setFieldError(field) {

        if (!field) {
            return false;
        }


        field.classList.add(
            "is-invalid"
        );


        return false;

    }


    // ============================================================
    // VALIDATE FORM
    // ============================================================

    function validateForm() {

        let valid = true;


        // --------------------------------------------------------
        // Gender
        // --------------------------------------------------------

        if (
            !genderSelect ||
            !genderSelect.value
        ) {

            setFieldError(
                genderSelect
            );

            valid = false;

        } else {

            clearFieldError(
                genderSelect
            );

        }


        // --------------------------------------------------------
        // Age
        // --------------------------------------------------------

        if (ageInput) {

            const age =
                Number(ageInput.value);


            if (
                ageInput.value === "" ||
                !Number.isInteger(age) ||
                age < 0 ||
                age > 120
            ) {

                setFieldError(
                    ageInput
                );

                valid = false;

            } else {

                clearFieldError(
                    ageInput
                );

            }

        }


        // --------------------------------------------------------
        // Neighbourhood
        // --------------------------------------------------------

        if (
            !neighbourhoodSelect ||
            !neighbourhoodSelect.value
        ) {

            setFieldError(
                neighbourhoodSelect
            );

            valid = false;

        } else {

            clearFieldError(
                neighbourhoodSelect
            );

        }


        // --------------------------------------------------------
        // Lead Time
        // --------------------------------------------------------

        if (leadTimeInput) {

            const leadTime =
                Number(
                    leadTimeInput.value
                );


            if (
                leadTimeInput.value === "" ||
                !Number.isInteger(leadTime) ||
                leadTime < 0 ||
                leadTime > 3650
            ) {

                setFieldError(
                    leadTimeInput
                );

                valid = false;

            } else {

                clearFieldError(
                    leadTimeInput
                );

            }

        }


        // --------------------------------------------------------
        // Appointment Weekday
        // --------------------------------------------------------

        if (
            !weekdaySelect ||
            !weekdaySelect.value
        ) {

            setFieldError(
                weekdaySelect
            );

            valid = false;

        } else {

            clearFieldError(
                weekdaySelect
            );

        }


        return valid;

    }


    // ============================================================
    // CLEAR ERROR WHEN USER CHANGES FIELD
    // ============================================================

    const fields = [

        genderSelect,

        ageInput,

        neighbourhoodSelect,

        leadTimeInput,

        weekdaySelect

    ];


    fields.forEach(
        function (field) {

            if (!field) {
                return;
            }


            field.addEventListener(
                "change",
                function () {

                    clearFieldError(
                        field
                    );

                }
            );


            field.addEventListener(
                "input",
                function () {

                    clearFieldError(
                        field
                    );

                }
            );

        }
    );


    // ============================================================
    // FORM SUBMISSION
    // ============================================================

    form.addEventListener(
        "submit",
        function (event) {

            // Validate before sending

            const valid =
                validateForm();


            if (!valid) {

                event.preventDefault();


                // Find first invalid field

                const firstInvalid =
                    form.querySelector(
                        ".is-invalid"
                    );


                if (firstInvalid) {

                    firstInvalid.focus();

                    firstInvalid.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }


                return;

            }


            // ----------------------------------------------------
            // Disable button
            // ----------------------------------------------------

            if (predictButton) {

                predictButton.disabled =
                    true;

            }


            // ----------------------------------------------------
            // Show loading state
            // ----------------------------------------------------

            if (normalContent) {

                normalContent.classList.add(
                    "d-none"
                );

            }


            if (loadingContent) {

                loadingContent.classList.remove(
                    "d-none"
                );

            }

        }
    );


    // ============================================================
    // SMOOTH SCROLL
    // ============================================================

    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function (event) {

                        const targetId =
                            this.getAttribute(
                                "href"
                            );


                        if (
                            !targetId ||
                            targetId === "#"
                        ) {

                            return;

                        }


                        const target =
                            document.querySelector(
                                targetId
                            );


                        if (target) {

                            event.preventDefault();


                            target.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });

                        }

                    }
                );

            }
        );


    // ============================================================
    // SELECT ANIMATION / FEEDBACK
    // ============================================================

    const selectFields = [

        genderSelect,

        neighbourhoodSelect,

        weekdaySelect,

        document.getElementById(
            "Scholarship"
        ),

        document.getElementById(
            "Hipertension"
        ),

        document.getElementById(
            "Diabetes"
        ),

        document.getElementById(
            "Alcoholism"
        ),

        document.getElementById(
            "Handcap"
        ),

        document.getElementById(
            "SMS_received"
        )

    ];


    selectFields.forEach(
        function (select) {

            if (!select) {
                return;
            }


            select.addEventListener(
                "change",
                function () {

                    if (this.value) {

                        this.classList.add(
                            "field-selected"
                        );

                    } else {

                        this.classList.remove(
                            "field-selected"
                        );

                    }

                }
            );

        }
    );


    // ============================================================
    // PREVENT ENTER KEY FROM ACCIDENTALLY SUBMITTING
    // WHILE USING NUMBER INPUTS
    // ============================================================

    form.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                event.target.tagName === "INPUT"
            ) {

                // Allow normal submission only if
                // all required fields are complete.

                if (!validateForm()) {

                    event.preventDefault();

                }

            }

        }
    );


    // ============================================================
    // CONSOLE INFORMATION
    // ============================================================

    console.log(
        "Prediction form ready."
    );

    console.log(
        "Threshold: 0.20"
    );

    console.log(
        "Features: 13"
    );

});