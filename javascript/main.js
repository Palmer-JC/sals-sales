/* global BABYLON */
/* global QI_Lite */
/* global SALS */

let vr;
let ar;
let isXRCapable;

let scene;

let camera;
let xrHelper;

let fury;

function begin(doesVR, doesAR) {
    vr = doesVR;
    ar = doesAR;
    isXRCapable = vr || ar;

    const canvas = document.getElementById("renderCanvas");
    const engine = new BABYLON.Engine(canvas, true);
    // order & case do not matter
    const available = ['-astc.ktx'];
    const formatUsed = engine.setTextureFormatToUse(available);

    scene = new BABYLON.Scene(engine);
    scene.autoClear = false;
    scene.autoClearDepthAndStencil = false;
    scene.environmentTexture = BABYLON.CubeTexture.CreateFromPrefilteredData('./images/salsSales.env', scene);

    // init QI, then assign all resource dirs of exported modules
    QI_Lite.TimelineControl.initialize(scene);
    TOB.ModuleRegistration.RegDirectory('SALS', 'images');

    const furyDock = new SALS.FurySalesDock('FuryDock', scene);
    furyDock.makeInstances();

    // teleporting has problems with scaled meshes, so this could not be an instance; actually still errors
    const mainSalesDock = new SALS.MainSalesDock('MainSalesDock', scene);
    const dockWarningSys = new SALS.FurySalesDockWarningSys('dockWarningSys', scene);

    fury = new SALS.Fury('fury', scene);
    fury.placeOnDock(furyDock);

    // - - - - - - - - - - - - - - - - Banners - - - - - - - - - - - - - - - -
    const spinSecs = 20;
    const BjsBanner = new SALS.BjsBanner('BjsBanner', scene);
    BjsBanner.rotation.y = .837 * Math.PI * 2; // get a separate starting point
    BjsBanner.beginRotation(spinSecs, true);
    AbstractProjectile.target = BjsBanner; // ding when hit

    const ComeOnDownBanner = new SALS.ComeOnDownBanner('ComeOnDownBanner', scene);
    ComeOnDownBanner.rotation.y = .073 * Math.PI * 2; // get a separate starting point
    ComeOnDownBanner.beginRotation(spinSecs, false);

    const CreditsBanner = new SALS.CreditsBanner('CreditsBanner', scene);
    CreditsBanner.rotation.y = .452 * Math.PI * 2; // get a separate starting point
    CreditsBanner.beginRotation(spinSecs, true);

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // add the sky sphere last, so any closer meshes render first
    const space = new SALS.ProjectionSphere('space', scene);

    // make sure fury is instanced first
    xrPrep(canvas);

    scene.executeWhenReady(() => {
        engine.runRenderLoop( () => { scene.render(); } );
        window.addEventListener("resize",() => { engine.resize(); });
    });
}
//==============================================================================
function xrPrep(canvas) {
    if (isXRCapable) {
        // should place it on the edge of the observation dock an Arcrotate camera is to difficult to actually place.
        const placementCam = new BABYLON.FreeCamera('XR placement Cam', new BABYLON.Vector3(60, .3, 61));
        placementCam.rotation = new BABYLON.Vector3(Math.PI, 0, 0);

        const floors = [];
        floors.push(scene.getMeshById('FuryDock'));
        floors.push(scene.getMeshById('MainSalesDock'));
        floors.push(scene.getMeshById('SpareSalesDock1'));
        floors.push(scene.getMeshById('SpareSalesDock2'));
        floors.push(scene.getMeshById('SpareSalesDock3'));
        floors.push(scene.getMeshById('SpareSalesDock4'));
        floors.push(scene.getMeshById('ObservationDock'));

        const options = new BABYLON.WebXRDefaultExperienceOptions();
        // when both AR & VR capable; VR wins
        const uiOptions = new BABYLON.WebXREnterExitUIOptions();
        uiOptions.sessionMode = vr ? "immersive-vr" : "immersive-ar";
        options.uiOptions = uiOptions;

        BABYLON.WebXRDefaultExperience.CreateAsync(scene, options).then((defaultExperience) => {
            xrHelper = defaultExperience.baseExperience;
            assignControllerActions(defaultExperience);
            const featuresManager = xrHelper.featuresManager;

            const tName = QI_Lite.FlyingTeleporter.Name; // BABYLON.WebXRFeatureName.TELEPORTATION; //
            const teleportation = featuresManager.enableFeature(tName, "latest", {
                xrInput: defaultExperience.input,
                // add options here
                floorMeshes: floors
            });
            teleportation.parabolicRayEnabled = false;
          //  teleportation.parabolicCheckRadius = 1000;
          //  teleportation.straightRayEnabled = true;

            // Flying subclass only
            teleportation.initialize(defaultExperience);

            // modify stuff on pointer selection
            const pointerSelFeature = featuresManager.getEnabledFeature(BABYLON.WebXRFeatureName.POINTER_SELECTION);
            pointerSelFeature['_options'].enablePointerSelectionOnAllControllers = true;

            // make sure this is last, since it fails right now
            const layers = featuresManager.enableFeature(BABYLON.WebXRFeatureName.LAYERS, "stable", {
                preferMultiviewOnInit: true
            }, true, false);
        });

    } else {
        const fallback = new BABYLON.ArcRotateCamera("XR_FallbackCamera", 2.0803, 1.1543, 12, new BABYLON.Vector3(0, -150, 0), scene);
        fallback.wheelPrecision = 35;
        fallback.minZ = 0.01;
        fallback.attachControl(canvas, true);

        assignKeyActions();
    }
}

function assignKeyActions() {
    document.addEventListener('keydown', (event) => {
        if (event.key === 'h' || event.key === 'H') {
            fury.adjustHatch();
        }
        else if (event.key === 'e' || event.key === 'E') {
            fury.turnEngineOnOff();
        }
        else if (event.key === 'f' || event.key === 'F') {
            fury.fireGuns(1.0);
        }
        else if (event.key >= '1' && event.key <= '9') {
            fury.setThrottle(Number(`.${event.key}`));
        }
    });
}

function assignControllerActions(defaultExperience) {
    defaultExperience.input.onControllerAddedObservable.add((controller) => {
        controller.onMotionControllerInitObservable.add((motionController) => {
            const buttons    = motionController.getAllComponentsOfType(BABYLON.WebXRControllerComponent.BUTTON_TYPE);
            const thumbStick = motionController.getComponentOfType    (BABYLON.WebXRControllerComponent.THUMBSTICK_TYPE);
            const squeezer   = motionController.getComponentOfType    (BABYLON.WebXRControllerComponent.TRIGGER_TYPE);

            if (motionController.handedness === 'left') {
                fury.assignHatchButton(buttons[0]); // X
                fury.assignGunsButton(squeezer);
            } else {
                fury.assignEngineButton(buttons[0]); // A
                fury.assignEngineRevThumbStick(thumbStick);
                fury.assignGunsButton(squeezer);
            }
        });
    });
}