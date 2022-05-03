/* global BABYLON */
/* global QI_Lite */
/* global SALS */

class AbstractStarFury extends QI_Lite.Mesh {

    constructor(name, scene, parent, source) {
        super(name, scene, parent, source, true);
        this.engineRunning = false;
        this.engineSuttingDown = false;
        this.throttle = 0;

        this.hatchOpen = false;
        this.hatchInOperation = false;

        this.roar = new BABYLON.Sound('roar', './audio/engine.wav', scene, null, {loop: true});
        this.lowestVolume = 0.5;
        this.highestVolume = 4;
    }

    postConstruction() {
        const scene = this.getScene();
        // set up the projectiles, no sense in doing in Blender as each needs transform node assigned
        this.projectiles = new Array(4);
        let projectile = new SALS.Projectile('bottomLeft', scene);
        projectile.assign(this.BottomLeft_Gun_TransformNode);
        this.projectiles[0] = projectile;

        projectile = new SALS.Projectile('topLeft', scene);
        projectile.assign(this.TopLeft_Gun_TransformNode);
        this.projectiles[1] = projectile;

        projectile = new SALS.Projectile('bottomRight', scene);
        projectile.assign(this.BottomRight_Gun_TransformNode);
        this.projectiles[2] = projectile;

        projectile = new SALS.Projectile('topRight', scene);
        projectile.assign(this.TopRight_Gun_TransformNode);
        this.projectiles[3] = projectile;
    }

    placeOnDock(dock) {
        this.rotation.y = Math.PI;
        this.groundY = this.position.y = dock.position.y;
        this.freezeWorldMatrix(); // Fury does not have a matrixFreezeExemption, so need to force a recompute
    }
   // ==========================================================================
    assignEngineButton(button) {
        button.onButtonStateChangedObservable.add((eventData) => {
            // toggle on-off, on first press event
            if (eventData.hasChanges) {
                if (eventData.pressed) {
                    this.turnEngineOnOff();
                }
            }
        });
    }

    turnEngineOnOff() {
        // the 1 sec shutdown requires this to keep things straight when rapid toggling
        if (this.engineSuttingDown) return;

        this.engineRunning = !this.engineRunning;
        this.exhaustOnOff();
        if (this.engineRunning) {
            this.roar.setVolume(this.lowestVolume);
            this.roar.play();
        } else {
            this.roar.pause(); // no need to fade; on XR thumbstick throttle probably already at zero
        }

        if (this.engineRunning) {
            this.clearAllQueues(true);
            this.cycleEngine(true);
        } else {
            this.throttle = 0; // mainly for desktop
            this.engineSuttingDown = true;
            const stoppingTime = 1000;
            const events = [
                new QI_Lite.MotionEvent(stoppingTime, new BABYLON.Vector3(0, this.groundY, 0), new BABYLON.Vector3(0, Math.PI, 0), null, { pace : QI_Lite.MotionEvent.SINE_INOUT_PACE, absoluteMovement : true, absoluteRotation : true} ),
                () => { this.engineSuttingDown = false; }
            ];
            this.queueEventSeries(events);

            this.adjustFins(this.throttle, stoppingTime);
        }
    }

    exhaustOnOff() {
        this.BottomLeft_EngineExhaust .turnExhaustOnOff(this.engineRunning);
        this.BottomRight_EngineExhaust.turnExhaustOnOff(this.engineRunning);
        this.TopRight_EngineExhaust   .turnExhaustOnOff(this.engineRunning);
        this.TopLeft_EngineExhaust    .turnExhaustOnOff(this.engineRunning);
    }

    /**
     * This function calls itself as the last event.  Looping not an option, since
     * Random numbers for each cycle, & throttle needs to be taken into account.
     */
    cycleEngine(firstRun) {
        // determine how long this cycle will be based on the throttle
        const maxDuration = 400 - (250 * this.throttle); // 400 millis, but down to 150 at full throttle
        const minDuration = 300 - (200 * this.throttle); // 300 millis, but down to 100 at full throttle
        const actualMillis = Math.random() * (maxDuration - minDuration) + minDuration;

        //  - - - - - - - - - - - get position target - - - - - - - - - - - - -
        const maxTotalXZDist = 5;            // the fury cannot be more than 5 meters away from 0 in any direction
        const maxTotalUp = this.groundY + 2; // the fury cannot be more than 2 meters up; down obvoiously not allowed

        const maxXZDistThisCycle = 2 + (1  * this.throttle); // 2 meters, but up to three at full throttle
        const maxYDistThisCycle  = 1 + (.5 * this.throttle); // 1 meter , but up to 1.5 at full throttle

        let distX = this._getPropertyTarget(this.position.x, maxXZDistThisCycle, maxTotalXZDist, -maxTotalXZDist);  // full +- range for X
        let distY = this._getPropertyTarget(this.position.y, maxYDistThisCycle , maxTotalUp    , this.groundY + 1); // only above ground
        let distZ = this._getPropertyTarget(this.position.z, maxXZDistThisCycle, maxTotalXZDist, 1);                // min of at least a meter

        const positionTarget = new BABYLON.Vector3(distX, distY, distZ);

        //  - - - - - - - - - - - get rotation target - - - - - - - - - - - - -
        // just to avoid one leg being below ground, no XZ rotation; also not throttle dependant
        const maxtotalRot = .1; // radians
        let rotY = this._getPropertyTarget(this.rotation.y, maxtotalRot , Math.PI + maxtotalRot, Math.PI - maxtotalRot);

        const rotationTarget = new BABYLON.Vector3(0, rotY, 0);

        //  - - - - - - - adjust Each of the Fins & exhausts - - - - - - - - - -
        this.adjustFins(this.throttle, actualMillis);
        if (!firstRun) {
            this.adjustExhausts(this.throttle, actualMillis);
            this.adjustRoar(this.throttle);
        }

        // - - - - - - - - - - - - - - - Queue it - - - - - - - - - - - - - - -
        const events = [
            new QI_Lite.MotionEvent(actualMillis, positionTarget, null), //rotationTarget),
            () => { if (this.engineRunning) this.cycleEngine(false); }
        ];
        this.queueEventSeries(events);
    }

    adjustFins(pct, millisToChange) {
        this.TopLeft_OuterFin    .setPctClosed(pct, millisToChange);
        this.TopLeft_InnerFin    .setPctClosed(pct, millisToChange);
        this.BottomLeft_OuterFin .setPctClosed(pct, millisToChange);
        this.BottomLeft_InnerFin .setPctClosed(pct, millisToChange);

        this.TopRight_OuterFin   .setPctClosed(pct, millisToChange);
        this.TopRight_InnerFin   .setPctClosed(pct, millisToChange);
        this.BottomRight_OuterFin.setPctClosed(pct, millisToChange);
        this.BottomRight_InnerFin.setPctClosed(pct, millisToChange);
    }

    adjustExhausts(pct, millisToChange) {
        this.BottomLeft_EngineExhaust .throttle(pct, millisToChange);
        this.BottomRight_EngineExhaust.throttle(pct, millisToChange);
        this.TopRight_EngineExhaust   .throttle(pct, millisToChange);
        this.TopLeft_EngineExhaust    .throttle(pct, millisToChange);
    }

    adjustRoar(pct) {
        const additional = (this.highestVolume - this.lowestVolume) * pct;
        this.roar.setVolume(this.lowestVolume + additional);
    }

    _getPropertyTarget(currValue, maxThisCycle, maxTotalValue, minTotalValue) {
        let ret = Math.random() * (2 * maxThisCycle) - maxThisCycle;  // + or - maxThisCycle

        if (ret + currValue > maxTotalValue) { return maxTotalValue - currValue; }// apply positive limit
        if (ret + currValue < minTotalValue) { return 0; }
        return ret;
    }
   // ==========================================================================
    assignEngineRevThumbStick(button) {
        button.onAxisValueChangedObservable.add((coords, eventState) => {
            eventState.skipNextObservers = true;
            this.setThrottle(coords.y);
        });
    }

    setThrottle(value) {
        if (this.engineRunning) {
            this.throttle = value;
        }
    }
   // ==========================================================================
    assignHatchButton(button) {
        button.onButtonStateChangedObservable.add((eventData) => {
            // toggle on-off, on first press event
            if (eventData.hasChanges) {
                if (eventData.pressed) {
                    this.adjustHatch();
                }
            }
        });
    }

    hOpen = new BABYLON.Vector3(Math.PI / 2, 0, 0);
    hClosed = BABYLON.Vector3.Zero();

    adjustHatch() {
        if (!this.hatchInOperation) {
            this.hatchInOperation = true;
            this.hatchOpen = !this.hatchOpen;

            const events = [
                new QI_Lite.MotionEvent(2000, null, this.hatchOpen ? this.hOpen : this.hClosed, null, { pace : QI_Lite.MotionEvent.SINE_INOUT_PACE, absoluteRotation : true} ),
                () => { this.hatchInOperation = false; }
            ];
            this.Hatch.queueEventSeries(events);
        }
    }

   // ==========================================================================
    assignGunsButton(trigger) {
        trigger.onButtonStateChangedObservable.add((eventData) => {
            if (eventData.hasChanges && eventData.value === 1) {
                this.fireGuns();
            }
        });
    }

    getDirectionForFiring() {
        const ret = this.position.subtract(this.DirectionalTransformNode.getAbsolutePosition());
        return ret.normalize();
    }

    fireGuns() {
        const direction = this.getDirectionForFiring();
        for (const projectile of this.projectiles) {
            projectile.fire(direction);
        }
    }
}