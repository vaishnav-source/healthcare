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

    const LOAD_CONCURRENCY = 8;

    /*
     * sessionStorage key.
     *
     * Once the Home animation has successfully loaded,
     * this key tells the next Home visit to skip the loader.
     */

    const LOADING_SESSION_KEY =
        "healthpredict_heart_loaded";


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


    /*
     * Stop if required elements are missing.
     */

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

    const frames =
        new Array(TOTAL_FRAMES);


    let loadedFrames = 0;

    let currentFrame = 0;

    let targetFrame = 0;

    let animationRunning = false;

    let lastProgress = -1;

    let lastDrawnFrame = -1;

    let nextFrameToLoad = 0;


    /* =====================================================
       CHECK FIRST / RETURN VISIT
    ===================================================== */

    function hasLoadedBefore() {

        try {

            return (
                sessionStorage.getItem(
                    LOADING_SESSION_KEY
                ) === "true"
            );

        } catch (error) {

            /*
             * If sessionStorage is unavailable,
             * simply show the loader normally.
             */

            return false;
        }
    }


    function markAsLoaded() {

        try {

            sessionStorage.setItem(
                LOADING_SESSION_KEY,
                "true"
            );

        } catch (error) {

            /*
             * Ignore storage errors.
             */

        }
    }


    /* =====================================================
       SCROLL LOCK
    ===================================================== */

    function lockPageScroll() {

        document.documentElement.classList.add(
            "loading-lock"
        );

        document.body.classList.add(
            "loading-lock"
        );


        window.addEventListener(
            "keydown",
            preventScrollKeys,
            {
                passive: false
            }
        );
    }


    function unlockPageScroll() {

        document.documentElement.classList.remove(
            "loading-lock"
        );

        document.body.classList.remove(
            "loading-lock"
        );


        window.removeEventListener(
            "keydown",
            preventScrollKeys
        );
    }


    function preventScrollKeys(event) {

        const scrollKeys = [
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "PageUp",
            "PageDown",
            "Home",
            "End",
            " "
        ];


        if (
            scrollKeys.includes(event.key)
        ) {

            event.preventDefault();
        }
    }


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

    let resizeTimeout = null;


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


    function handleResize() {

        clearTimeout(
            resizeTimeout
        );


        resizeTimeout =
            setTimeout(
                function () {

                    resizeCanvas();

                },
                100
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
         * If the requested frame isn't ready,
         * use the closest previous loaded frame.
         */

        if (
            !image ||
            !image.complete ||
            !image.naturalWidth
        ) {

            for (
                let i = index;
                i >= 0;
                i--
            ) {

                if (
                    frames[i] &&
                    frames[i].complete &&
                    frames[i].naturalWidth
                ) {

                    image =
                        frames[i];

                    break;
                }
            }
        }


        if (
            !image ||
            !image.complete ||
            !image.naturalWidth
        ) {
            return;
        }


        /*
         * Don't redraw the same frame.
         */

        if (
            index === lastDrawnFrame
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


        lastDrawnFrame =
            index;
    }


    /* =====================================================
       UPDATE PROGRESS
    ===================================================== */

    function updateLoadingProgress() {

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
       LOAD ONE FRAME
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


                image.onload =
                    async function () {

                        if (
                            typeof image.decode ===
                            "function"
                        ) {

                            try {

                                await image.decode();

                            } catch (error) {

                                /*
                                 * Continue even if decode
                                 * isn't available.
                                 */

                            }
                        }


                        frames[index] =
                            image;


                        loadedFrames++;


                        updateLoadingProgress();


                        resolve(true);
                    };


                image.onerror =
                    function () {

                        console.warn(
                            "Could not load:",
                            framePath(index + 1)
                        );


                        loadedFrames++;


                        updateLoadingProgress();


                        resolve(false);
                    };


                image.src =
                    framePath(index + 1);
            }
        );
    }


    /* =====================================================
       PRELOAD ALL FRAMES
    ===================================================== */

    async function preloadFrames() {

        async function worker() {

            while (true) {

                const index =
                    nextFrameToLoad++;


                if (
                    index >= TOTAL_FRAMES
                ) {
                    break;
                }


                await loadFrame(
                    index
                );
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


        targetFrame =
            progress *
            (TOTAL_FRAMES - 1);


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


        updateStory(
            progress
        );


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
       SMOOTH FRAME ANIMATION
    ===================================================== */

    function animateFrame() {

        const difference =
            targetFrame -
            currentFrame;


        currentFrame +=
            difference *
            0.16;


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

            /*
             * Ignore scroll events while loading.
             */

            if (
                document.body.classList.contains(
                    "loading-lock"
                )
            ) {

                return;
            }


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
        handleResize
    );


    /* =====================================================
       SHOW PAGE WITHOUT LOADER
    ===================================================== */

    function skipLoader() {

        /*
         * Hide loader immediately.
         */

        if (loader) {

            loader.classList.add(
                "loaded"
            );
        }


        /*
         * Unlock scrolling immediately.
         */

        unlockPageScroll();


        /*
         * Show first story.
         */

        hideStories();


        if (story1) {

            story1.classList.add(
                "visible"
            );
        }


        /*
         * Set initial scroll state.
         */

        updateScroll();
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    async function initialize() {

        /*
         * Prepare canvas first.
         */

        resizeCanvas();


        /* =================================================
           RETURNING VISITOR
        ================================================= */

        if (
            hasLoadedBefore()
        ) {

            /*
             * We already loaded the animation during
             * this browser session.
             *
             * Don't show the loading animation.
             */

            skipLoader();


            /*
             * IMPORTANT:
             *
             * We still need to load the images because
             * a full page navigation destroys the previous
             * JavaScript memory.
             *
             * Load them in the background.
             */

            loadedFrames = 0;

            nextFrameToLoad = 0;

            lastDrawnFrame = -1;


            /*
             * Start background loading.
             *
             * The user doesn't have to wait for the loader.
             */

            preloadFrames()
                .then(
                    function () {

                        /*
                         * Redraw the current frame once
                         * the background loading finishes.
                         */

                        lastDrawnFrame = -1;

                        drawFrame(
                            Math.round(
                                currentFrame
                            )
                        );
                    }
                );


            return;
        }


        /* =================================================
           FIRST VISIT
        ================================================= */

        /*
         * Lock scrolling while the first load happens.
         */

        lockPageScroll();


        /*
         * Reset loading state.
         */

        loadedFrames = 0;

        nextFrameToLoad = 0;

        lastDrawnFrame = -1;


        if (progressBar) {

            progressBar.style.width =
                "0%";
        }


        if (progressText) {

            progressText.textContent =
                "0%";
        }


        /*
         * Load all 240 frames.
         */

        await preloadFrames();


        /* =================================================
           FIRST FRAME
        ================================================= */

        currentFrame = 0;

        targetFrame = 0;

        lastDrawnFrame = -1;


        drawFrame(0);


        /* =================================================
           FIRST STORY
        ================================================= */

        hideStories();


        if (story1) {

            story1.classList.add(
                "visible"
            );
        }


        /* =================================================
           INITIAL SCROLL STATE
        ================================================= */

        updateScroll();


        /* =================================================
           REMOVE LOADER
        ================================================= */

        if (loader) {

            loader.classList.add(
                "loaded"
            );
        }


        /*
         * Remember that this browser session has already
         * completed the initial heart loading.
         */

        markAsLoaded();


        /*
         * Wait for loader fade-out before unlocking.
         */

        setTimeout(
            function () {

                unlockPageScroll();

            },
            800
        );
    }


    /* =====================================================
       START
    ===================================================== */

    initialize();


})();