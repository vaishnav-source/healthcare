(function () {

    "use strict";


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const TOTAL_FRAMES = 240;

    const FRAME_FOLDER = "/static/frames/";

    const FRAME_PREFIX = "ezgif-frame-";

    // Number of images loaded simultaneously.
    // 6-8 is usually a good balance.
    const LOAD_CONCURRENCY = 8;


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


    /* =====================================================
       SAFETY CHECK
    ===================================================== */

    if (
        !experience ||
        !canvas
    ) {
        return;
    }


    const ctx =
        canvas.getContext(
            "2d",
            {
                alpha: true,
                desynchronized: true
            }
        );


    /* =====================================================
       STATE
    ===================================================== */

    const frames =
        new Array(TOTAL_FRAMES);

    let loadedFrames = 0;

    let currentFrame = 0;

    let targetFrame = 0;

    let animationRunning = false;

    let lastProgress = -1;

    let resizeTimer = null;

    let loadingFinished = false;


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
       UPDATE LOADER
    ===================================================== */

    function updateLoaderProgress() {

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

        if (
            index < 0 ||
            index >= TOTAL_FRAMES
        ) {
            return;
        }


        let image =
            frames[index];


        /*
         * If requested frame has not loaded yet,
         * use the nearest available frame.
         */

        if (
            !image ||
            !image.complete ||
            !image.naturalWidth
        ) {

            let fallbackIndex = index;


            /*
             * Search backwards first.
             */

            while (
                fallbackIndex > 0 &&
                (
                    !frames[fallbackIndex] ||
                    !frames[fallbackIndex].complete ||
                    !frames[fallbackIndex].naturalWidth
                )
            ) {

                fallbackIndex--;

            }


            image =
                frames[fallbackIndex];


            /*
             * If nothing is available yet,
             * don't draw anything.
             */

            if (
                !image ||
                !image.complete ||
                !image.naturalWidth
            ) {
                return;
            }

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
       LOAD SINGLE FRAME
    ===================================================== */

    function loadFrame(index) {

        return new Promise(
            function (resolve) {

                const image =
                    new Image();


                image.decoding =
                    "async";

                image.loading =
                    "eager";


                let completed =
                    false;


                function finish(success) {

                    if (completed) {
                        return;
                    }

                    completed = true;


                    if (success) {

                        frames[index] =
                            image;

                    }


                    loadedFrames++;

                    updateLoaderProgress();


                    resolve(success);

                }


                image.onload =
                    async function () {

                        /*
                         * Ask browser to decode the image
                         * before it is needed on canvas.
                         */

                        try {

                            if (
                                typeof image.decode ===
                                "function"
                            ) {

                                await image.decode();

                            }

                        } catch (error) {

                            /*
                             * Decode errors should not
                             * stop the entire animation.
                             */

                        }


                        finish(true);

                    };


                image.onerror =
                    function () {

                        console.warn(
                            "Could not load:",
                            framePath(index + 1)
                        );


                        finish(false);

                    };


                image.src =
                    framePath(index + 1);

            }
        );

    }


    /* =====================================================
       PRELOAD FRAMES
       LIMITED CONCURRENCY
    ===================================================== */

    async function preloadFrames() {

        let nextIndex = 0;


        async function worker() {

            while (true) {

                const index =
                    nextIndex++;


                if (
                    index >= TOTAL_FRAMES
                ) {
                    return;
                }


                await loadFrame(index);

            }

        }


        const workers = [];


        const workerCount =
            Math.min(
                LOAD_CONCURRENCY,
                TOTAL_FRAMES
            );


        for (
            let i = 0;
            i < workerCount;
            i++
        ) {

            workers.push(
                worker()
            );

        }


        await Promise.all(
            workers
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
         * Scroll hint.
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
         * Storytelling.
         */

        updateStory(
            progress
        );


        /*
         * Start animation.
         */

        if (
            !animationRunning
        ) {

            animationRunning =
                true;

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


        /*
         * Smooth interpolation.
         */

        currentFrame +=
            difference * 0.16;


        if (
            Math.abs(difference) < 0.05
        ) {

            currentFrame =
                targetFrame;

        }


        drawFrame(
            Math.round(
                currentFrame
            )
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

        if (story1) {

            story1.classList.remove(
                "visible"
            );

        }


        if (story2) {

            story2.classList.remove(
                "visible"
            );

        }


        if (story3) {

            story3.classList.remove(
                "visible"
            );

        }


        if (story4) {

            story4.classList.remove(
                "visible"
            );

        }

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

            if (story1) {

                story1.classList.add(
                    "visible"
                );

            }

        }


        /*
         * 22% - 48%
         */

        else if (
            progress < 0.48
        ) {

            if (story2) {

                story2.classList.add(
                    "visible"
                );

            }

        }


        /*
         * 48% - 72%
         */

        else if (
            progress < 0.72
        ) {

            if (story3) {

                story3.classList.add(
                    "visible"
                );

            }

        }


        /*
         * 72% - 100%
         */

        else {

            if (story4) {

                story4.classList.add(
                    "visible"
                );

            }

        }

    }


    /* =====================================================
       SCROLL EVENT
    ===================================================== */

    let scrollTicking =
        false;


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

            clearTimeout(
                resizeTimer
            );


            resizeTimer =
                setTimeout(
                    function () {

                        resizeCanvas();

                    },
                    100
                );

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
         * Start progress at 0%.
         */

        loadedFrames = 0;

        updateLoaderProgress();


        /*
         * Load all frames using
         * limited concurrency.
         */

        await preloadFrames();


        /*
         * Loading finished.
         */

        loadingFinished =
            true;


        /*
         * First frame.
         */

        currentFrame = 0;

        targetFrame = 0;


        drawFrame(0);


        /*
         * Complete progress.
         */

        if (progressBar) {

            progressBar.style.width =
                "100%";

        }


        if (progressText) {

            progressText.textContent =
                "100%";

        }


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

        if (story1) {

            story1.classList.add(
                "visible"
            );

        }


        /*
         * Set initial state.
         */

        updateScroll();

    }


    /* =====================================================
       START
    ===================================================== */

    initialize();

})();