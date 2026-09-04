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


    /*
     * Number of images allowed to load at the same time.
     *
     * This prevents the browser from requesting all
     * 240 images simultaneously.
     */
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

    /*
     * Fixed-size array.
     *
     * This is important because frame 1 goes into
     * frames[0], frame 2 into frames[1], etc.
     */

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
       SCROLL LOCK
    ===================================================== */

    /*
     * Prevent the user from scrolling while the
     * heart animation is loading.
     */

    function lockPageScroll() {

        document.documentElement.classList.add(
            "loading-lock"
        );

        document.body.classList.add(
            "loading-lock"
        );

        /*
         * Prevent keyboard scrolling.
         */

        window.addEventListener(
            "keydown",
            preventScrollKeys,
            {
                passive: false
            }
        );
    }


    /*
     * Allow scrolling again after loading.
     */

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


    /*
     * Prevent keyboard keys such as:
     *
     * ArrowUp
     * ArrowDown
     * PageUp
     * PageDown
     * Home
     * End
     * Space
     */

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


    /*
     * Lock immediately.
     *
     * This happens before image loading starts.
     */

    lockPageScroll();


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

        /*
         * Limit DPR.
         *
         * Very high DPR can make canvas drawing expensive.
         */

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


    /*
     * Debounce resize.
     *
     * This prevents many canvas recalculations when
     * the browser is continuously being resized.
     */

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

        /*
         * Make sure index is valid.
         */

        if (
            index < 0 ||
            index >= TOTAL_FRAMES
        ) {
            return;
        }


        let image =
            frames[index];


        /*
         * If requested frame hasn't loaded yet,
         * find the closest previously loaded frame.
         *
         * This prevents the animation from becoming blank.
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


        /*
         * If no frame is available yet,
         * don't draw anything.
         */

        if (
            !image ||
            !image.complete ||
            !image.naturalWidth
        ) {
            return;
        }


        /*
         * Don't redraw exactly the same frame.
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


        /* =================================================
           COVER
        ================================================= */

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
       UPDATE LOADING PROGRESS
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


                /*
                 * Tell the browser this is an eager
                 * image because we need it for animation.
                 */

                image.loading =
                    "eager";


                image.onload =
                    async function () {

                        /*
                         * Decode the image when possible.
                         *
                         * This helps reduce the chance of
                         * decode work happening during scrolling.
                         */

                        if (
                            typeof image.decode ===
                            "function"
                        ) {

                            try {

                                await image.decode();

                            } catch (error) {

                                /*
                                 * Decode failure does not
                                 * mean the image cannot be drawn.
                                 */

                            }
                        }


                        frames[index] =
                            image;


                        loadedFrames++;


                        updateLoadingProgress();


                        resolve(
                            true
                        );
                    };


                image.onerror =
                    function () {

                        console.warn(
                            "Could not load:",
                            framePath(index + 1)
                        );


                        /*
                         * Keep the loader moving even if
                         * one image fails.
                         */

                        loadedFrames++;


                        updateLoadingProgress();


                        resolve(
                            false
                        );
                    };


                image.src =
                    framePath(index + 1);
            }
        );
    }


    /* =====================================================
       PRELOAD ALL FRAMES
       LIMITED CONCURRENCY
    ===================================================== */

    async function preloadFrames() {

        /*
         * Each worker loads one frame at a time.
         */

        async function worker() {

            while (true) {

                /*
                 * Get the next frame number.
                 */

                const index =
                    nextFrameToLoad++;


                /*
                 * Stop when all frames have been assigned.
                 */

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


        /*
         * Create limited number of workers.
         */

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


        /*
         * Wait until every worker has finished.
         */

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
         * Convert scroll position into
         * one of the 240 frames.
         */

        targetFrame =
            progress *
            (TOTAL_FRAMES - 1);


        /*
         * Hide scroll hint after scrolling starts.
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
         * Update story.
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

        /*
         * Avoid unnecessary DOM updates.
         */

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
             * Safety check:
             *
             * If the loader is still active,
             * don't process scrolling.
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
       RESIZE EVENT
    ===================================================== */

    window.addEventListener(
        "resize",
        handleResize
    );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    async function initialize() {

        /*
         * IMPORTANT:
         *
         * Lock scrolling before doing anything else.
         */

        lockPageScroll();


        /*
         * Prepare canvas.
         */

        resizeCanvas();


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
         *
         * Loading happens with limited concurrency,
         * rather than requesting all 240 at once.
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
           SHOW FIRST STORY
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
           REMOVE LOADING SCREEN
        ================================================= */

        if (loader) {

            loader.classList.add(
                "loaded"
            );
        }


        /*
         * Wait for the loader's fade-out animation.
         *
         * Your existing loader uses an approximately
         * 0.8 second transition.
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
    ================================================= */

    initialize();


})();