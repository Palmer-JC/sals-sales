/* global BABYLON */
/* global QI_Lite */
/* global SALS */

class AbstractProjectile extends QI_Lite.Mesh {
    constructor(name, scene, parent, source) {
        super(name, scene, parent, source, true);

        // reduce garbage collection
        this.scaledDirection = BABYLON.Vector3.Zero();
        this.finalPosition = BABYLON.Vector3.Zero();

        // length by scaling rather than inBlender
        this.scaling.z = 20;

        // need to load audio once, & the projectile that loads, plays it
        if (!AbstractProjectile.audio) {
            AbstractProjectile.audio = new BABYLON.Sound('pew', './audio/guns.wav', scene);
            AbstractProjectile.targetHitAudio = new BABYLON.Sound('ding', './audio/ding.wav', scene);
            this.BulletPlays = true;
        }
        else this.BulletPlays = false;
    }

    assign(transformNode) {
        this.startTN = transformNode;
    }

    fire(direction) {
        // place the mesh at the TransformNode & use direction to set rotation
        this.position.copyFrom(this.startTN.getAbsolutePosition());
        this.rotation.copyFrom(direction);
        this.setEnabled(true); // exported disabled, also a switch for done
        this.freezeWorldMatrix(); // Projectile does not have a matrixFreezeExemption, so need to force a recompute

        // determine given direction & max distance, determine the final position of projectile
        this.scaledDirection.copyFrom(direction);
        this.scaledDirection.scaleInPlace(AbstractProjectile.MaxDistance);
        this.position.addToRef(this.scaledDirection, this.finalPosition);

        const options = {
            pace : AbstractProjectile.Pace,
            absoluteMovement : true
        };

        const events = [
            () => { if (this.BulletPlays) AbstractProjectile.audio.play(); },

            new QI_Lite.MotionEvent(AbstractProjectile.FireDuration, this.finalPosition, null, null, options),

            () => {
                // check to see if target was hit on projectile which plays sounds
                if (this.BulletPlays) {
                    const rotY = AbstractProjectile.target.rotation.y % (2 * Math.PI);
                    if (rotY >= AbstractProjectile.targetRotYMin && rotY <= AbstractProjectile.targetRotYMax) {
                        this.targetHit();
                    } else this.setEnabled(false);
                } else this.setEnabled(false);  // switch the non-players off now
            }
        ];
        this.queueEventSeries(events);
    }

    targetHit() {
        this.clearAllQueues(true); // get rid of any shots which might be queued
        // need to adjust in case of a teleport (shared, crap I know, but ran out of tim
        AbstractProjectile.targetHitAudio.setVolume(1.0);
        const events = [
            () => { AbstractProjectile.targetHitAudio.play(); },

            new QI_Lite.Stall(500),  // the length of the sound, 1511

            ()=> {
                    AbstractProjectile.targetHitAudio.play();
                    this.setEnabled(false); // need to be enabled for events here to work, so this must be in last event
                 }
        ];
        this.queueEventSeries(events);
    }
}
AbstractProjectile.audio = null; // assigned in constructor
AbstractProjectile.FireDuration = 300;
AbstractProjectile.MaxDistance = 100;
AbstractProjectile.Pace = new QI_Lite.ExponentialPace();

AbstractProjectile.target = null; // assigned in main.begin()
AbstractProjectile.targetRotYMin = 1.43;
AbstractProjectile.targetRotYMax = 1.56;
AbstractProjectile.targetHitAudio = null; // assigned in constructor