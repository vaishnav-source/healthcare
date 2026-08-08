(function () {

    "use strict";


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const TOTAL_FRAMES = 240;

    const FRAME_FOLDER =
        "/static/frames/";

    const FRAME_PREFIX =
        "ezgif-frame-";


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const experience =
        document.getElementById("experience");

    const canvas =
        document.getElementById("heartCanvas");

    const loader =
        document.getElementById("heartLoader");

    const progressBar =
        document.getElementById("heartProgressBar");

    const progressText =
        document.getElementById("progressText");

    const scrollHint =
        document.getElementById("scrollHint");


    const story1 =
        document.getElementById("story1");

    const story2 =
        document.getElementById("story2");

    const story3 =
        document.getElementById("story3");

    const story4 =
        document.getElementById("story4");


    if (
        !experience ||
        !canvas
    ) {
        return;
    }


    const ctx =
        canvas.getContext("2d");


    /* =====================================================
       STATE
    ===================================================== */

    const frames = [];

    let loadedFrames = 0;

    let currentFrame = 0;

    let targetFrame = 0;

    let animationRunning = false;

    let lastProgress = -1;


    /* =====================================================
       FRAME PATH
    ===================================================== */

    function framePath(number) {

        const padded =
            String(number)
                .padStart(3, "0");

        return (
            FRAME_FOLDER +
            FRAME_PREFIX +
            padded +
            ".png"
        );

    }


    /* =====================================================
       RESIZE CANVAS
    ===================================================== */

    function resizeCanvas() {

        const dpr =
            Math.min(
                window.devicePixelRatio || 1,
                2
            );


        const width =
            window.innerWidth;

        const height =
            window.innerHeight;


        canvas.width =
            Math.round(
                width * dpr
            );

        canvas.height =
            Math.round(
                height * dpr
            );


        canvas.style.width =
            width + "px";

        canvas.style.height =
            height + "px";


        ctx.setTransform(
            dpr,
            0,
            0,
            dpr,
            0,
            0
        );


        drawFrame(
            Math.round(currentFrame)
        );

    }


    /* =====================================================
       DRAW FRAME
    ===================================================== */

    function drawFrame(index) {

        const image =
            frames[index];


        if (
            !image ||
            !image.complete ||
            !image.naturalWidth
        ) {
            return;
        }


        const width =
            window.innerWidth;

        const height =
            window.innerHeight;


        ctx.clearRect(
            0,
            0,
            width,
            height
        );


        const imageRatio =
            image.naturalWidth /
            image.naturalHeight;


        const screenRatio =
            width /
            height;


        let drawWidth;

        let drawHeight;


        /*
         * COVER
         */

        if (
            imageRatio > screenRatio
        ) {

            drawHeight =
                height;

            drawWidth =
                height *
                imageRatio;

        } else {

            drawWidth =
                width;

            drawHeight =
                width /
                imageRatio;

        }


        const x =
            (
                width -
                drawWidth
            ) / 2;


        const y =
            (
                height -
                drawHeight
            ) / 2;


        ctx.drawImage(
            image,
            x,
            y,
            drawWidth,
            drawHeight
        );

    }


    /* =====================================================
       PRELOAD ALL 240 FRAMES
    ===================================================== */

    function preloadFrames() {

        return new Promise(
            function (resolve) {

                for (
                    let i = 1;
                    i <= TOTAL_FRAMES;
                    i++
                ) {

                    const image =
                        new Image();


                    image.decoding =
                        "async";


                    image.src =
                        framePath(i);


                    image.onload =
                        function () {

                            loadedFrames++;


                            const percentage =
                                Math.round(
                                    (
                                        loadedFrames /
                                        TOTAL_FRAMES
                                    ) * 100
                                );


                            if (progressBar) {

                                progressBar.style.width =
                                    percentage + "%";

                            }


                            if (progressText) {

                                progressText.textContent =
                                    percentage + "%";

                            }


                            if (
                                loadedFrames ===
                                TOTAL_FRAMES
                            ) {

                                resolve();

                            }

                        };


                    image.onerror =
                        function () {

                            console.warn(
                                "Could not load:",
                                framePath(i)
                            );


                            /*
                             * Continue loading even if
                             * one frame fails.
                             */

                            loadedFrames++;


                            const percentage =
                                Math.round(
                                    (
                                        loadedFrames /
                                        TOTAL_FRAMES
                                    ) * 100
                                );


                            if (progressBar) {

                                progressBar.style.width =
                                    percentage + "%";

                            }


                            if (progressText) {

                                progressText.textContent =
                                    percentage + "%";

                            }


                            if (
                                loadedFrames ===
                                TOTAL_FRAMES
                            ) {

                                resolve();

                            }

                        };


                    frames.push(image);

                }

            }
        );

    }


    /* =====================================================
       SCROLL PROGRESS
    ===================================================== */

    function getScrollProgress() {

        const rect =
            experience.getBoundingClientRect();


        const totalDistance =
            experience.offsetHeight -
            window.innerHeight;


        if (
            totalDistance <= 0
        ) {

            return 0;

        }


        let progress =
            -rect.top /
            totalDistance;


        progress =
            Math.max(
                0,
                Math.min(
                    1,
                    progress
                )
            );


        return progress;

    }


    /* =====================================================
       UPDATE SCROLL
    ===================================================== */

    function updateScroll() {

        const progress =
            getScrollProgress();


        /*
         * Convert scroll position
         * to one of the 240 frames.
         */

        targetFrame =
            progress *
            (TOTAL_FRAMES - 1);


        /*
         * Scroll hint disappears
         * after the user starts scrolling.
         */

        if (scrollHint) {

            if (
                progress > 0.03
            ) {

                scrollHint.classList.add(
                    "hidden"
                );

            } else {

                scrollHint.classList.remove(
                    "hidden"
                );

            }

        }


        /*
         * Update storytelling text.
         */

        updateStory(progress);


        /*
         * Start smooth frame animation.
         */

        if (
            !animationRunning
        ) {

            animationRunning = true;

            requestAnimationFrame(
                animateFrame
            );

        }

    }


    /* =====================================================
       SMOOTH FRAME MOVEMENT
    ===================================================== */

    function animateFrame() {

        const difference =
            targetFrame -
            currentFrame;


        currentFrame +=
            difference * 0.14;


        if (
            Math.abs(difference) < 0.05
        ) {

            currentFrame =
                targetFrame;

        }


        drawFrame(
            Math.round(currentFrame)
        );


        if (
            Math.abs(
                targetFrame -
                currentFrame
            ) > 0.05
        ) {

            requestAnimationFrame(
                animateFrame
            );

        } else {

            animationRunning =
                false;

        }

    }


    /* =====================================================
       STORY
    ===================================================== */

    function hideStories() {

        story1.classList.remove(
            "visible"
        );

        story2.classList.remove(
            "visible"
        );

        story3.classList.remove(
            "visible"
        );

        story4.classList.remove(
            "visible"
        );

    }


    function updateStory(progress) {

        if (
            Math.abs(
                progress -
                lastProgress
            ) < 0.002
        ) {

            return;

        }


        lastProgress =
            progress;


        hideStories();


        /*
         * 0% - 22%
         */

        if (
            progress < 0.22
        ) {

            story1.classList.add(
                "visible"
            );

        }


        /*
         * 22% - 48%
         */

        else if (
            progress < 0.48
        ) {

            story2.classList.add(
                "visible"
            );

        }


        /*
         * 48% - 72%
         */

        else if (
            progress < 0.72
        ) {

            story3.classList.add(
                "visible"
            );

        }


        /*
         * 72% - 100%
         */

        else {

            story4.classList.add(
                "visible"
            );

        }

    }


    /* =====================================================
       SCROLL EVENT
    ===================================================== */

    let scrollTicking = false;


    window.addEventListener(
        "scroll",
        function () {

            if (
                !scrollTicking
            ) {

                window.requestAnimationFrame(
                    function () {

                        updateScroll();

                        scrollTicking =
                            false;

                    }
                );


                scrollTicking =
                    true;

            }

        },
        {
            passive: true
        }
    );


    /* =====================================================
       RESIZE
    ===================================================== */

    window.addEventListener(
        "resize",
        function () {

            resizeCanvas();

        }
    );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    async function initialize() {

        /*
         * Prepare canvas.
         */

        resizeCanvas();


        /*
         * Load all 240 images.
         */

        await preloadFrames();


        /*
         * First frame.
         */

        currentFrame = 0;

        targetFrame = 0;


        drawFrame(0);


        /*
         * Remove loading screen.
         */

        if (loader) {

            loader.classList.add(
                "loaded"
            );

        }


        /*
         * Show first story.
         */

        story1.classList.add(
            "visible"
        );


        /*
         * Set initial state.
         */

        updateScroll();

    }


    initialize();

})();