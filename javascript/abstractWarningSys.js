/* global BABYLON */
/* global QI_Lite */
/* global SALS */

class AbstractWarningSys extends QI_Lite.Mesh {
    constructor(name, scene, parent, source) {
        super(name, scene, parent, source, true);
    }

    postConstruction() {
        this.blink(this);

        const instances = this.makeInstances();
        for (const inst of instances) {
            this.blink(inst);
        }
    }

    /**
     * Cause mesh to blink.  No gain from creating more permanent Stalls / functions,
     * since the first onces are infinitely being repeated.
     */
    blink(mesh) {
        // a one time stall to get all the docks out of sync
        mesh.queueSingleEvent(new QI_Lite.Stall(1000 * Math.random()));

        const events = [
            new QI_Lite.Stall(250),  // the amount of time spent ON
            () => { mesh.setEnabled(false); },
            new QI_Lite.Stall(4750), // the amount of time spent OFF
            () => { mesh.setEnabled(true); }
        ];
        const series = new QI_Lite.EventSeries(events, -1);
        mesh.queueEventSeries(series);
    }
}