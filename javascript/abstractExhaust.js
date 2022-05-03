/* global BABYLON */
/* global QI_Lite */
/* global SALS */

class AbstractExhaust extends QI_Lite.Mesh {
    constructor(name, scene, parent, source) {
        super(name, scene, parent, source, true);
        this.target = new BABYLON.Vector3(1, 1, AbstractExhaust.MinScale); // ref variable
    }

    turnExhaustOnOff(isOn) {
        if (isOn) {
            this.setEnabled(true); // exported disabled
            this.scaling.z = AbstractExhaust.ShutOffScale;
            this.freezeWorldMatrix(); // Exhaust does not have a matrixFreezeExemption, so need to force a recompute
            this.setFlame(AbstractExhaust.MinScale, 300);

        } else {
            this.setFlame(AbstractExhaust.ShutOffScale, 1000, true);
        }
    }

    setFlame(scale, millisToChange, shutDown) {
        this.target.z = scale;
        const events = [
            new QI_Lite.MotionEvent(millisToChange, null, null, this.target, null)
        ];
        if (shutDown) events.push( () => { this.setEnabled(false); } );
        this.queueEventSeries(events);
    }

    throttle(pct, millisToChange) {
        const scale = AbstractExhaust.MinScale + (pct * (AbstractExhaust.MaxScale - AbstractExhaust.MinScale));
        this.setFlame(scale, millisToChange);
    }
}
AbstractExhaust.ShutOffScale = .1;
AbstractExhaust.MinScale = 3;
AbstractExhaust.MaxScale = 9;
