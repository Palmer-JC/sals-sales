/* global BABYLON */
/* global QI_Lite */
/* global SALS */

class AbstractEngineFin extends QI_Lite.Mesh {
    constructor(name, scene, parent, source) {
        super(name, scene, parent, source, true);

        // ref variables to reduce GC
        this.open = BABYLON.Vector3.Zero(); // never changed
        this.target = BABYLON.Vector3.Zero();
    }

    postConstruction() {
        // each fin is exported with the rotation of when at full throttle
        this.fullyClosed = this.rotation.clone();
        this.rotation.copyFrom(this.open);
        this.freezeWorldMatrix(); // Fin does not have a matrixFreezeExemption, so need to force a recompute
    }

    /**
     * This is being set based on throttle, not steering, but it is not like this is real.
     */
    setPctClosed(pct, millisToChange) {
        BABYLON.Vector3.LerpToRef(this.open, this.fullyClosed, pct, this.target);
        const events = [
            new QI_Lite.MotionEvent(millisToChange, null, this.target, null, { absoluteRotation : true} )
        ];
        this.queueEventSeries(events);

    }
}