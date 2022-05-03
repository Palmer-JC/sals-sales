/* global BABYLON */
/* global QI_Lite */
/* global SALS */

class AbstractBanner extends QI_Lite.Mesh {
    constructor(name, scene, parent, source) {
        super(name, scene, parent, source, true);
    }

    /**
     * Not called in postConstruction, so different directions can be specified & intial Y rotation set.
     * @param {number} secs - the amount of time for a complete roration
     * @param {boolean} clockwise - direction toggle
     */
    beginRotation(secs, clockwise) {
        const durration = secs * 1000 / 2;
        const rotation = BABYLON.Vector3.Zero();
        rotation.y = clockwise ? Math.PI : -Math.PI;
        const events = [
            // each move is a half rotation
            new QI_Lite.MotionEvent(durration, null, rotation)
        ];
        const series = new QI_Lite.EventSeries(events, -1); // -1: infinite repeat
        this.queueEventSeries(series);
    }
}