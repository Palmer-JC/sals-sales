declare module SALS{

    export function defineMaterials(scene : BABYLON.Scene, resourcesRootDir : string) : void;

    class Fury extends AbstractStarFury {
        public Hatch : QI_Lite.Mesh;
        public BottomLeft_InnerFin : AbstractEngineFin;
        public BottomLeft_OuterFin : AbstractEngineFin;
        public BottomRight_InnerFin : AbstractEngineFin;
        public BottomRight_OuterFin : AbstractEngineFin;
        public TopLeft_InnerFin : AbstractEngineFin;
        public TopLeft_OuterFin : AbstractEngineFin;
        public TopRight_InnerFin : AbstractEngineFin;
        public TopRight_OuterFin : AbstractEngineFin;
        public BottomLeft_Gun_TransformNode : BABYLON.TransformNode;
        public BottomRight_Gun_TransformNode : BABYLON.TransformNode;
        public DirectionalTransformNode : BABYLON.TransformNode;
        public TopLeft_Gun_TransformNode : BABYLON.TransformNode;
        public TopRight_Gun_TransformNode : BABYLON.TransformNode;
        public BottomLeft_EngineExhaust : AbstractExhaust;
        public BottomRight_EngineExhaust : AbstractExhaust;
        public TopRight_EngineExhaust : AbstractExhaust;
        public TopLeft_EngineExhaust : AbstractExhaust;
        constructor(name: string, scene: BABYLON.Scene, source? : Fury);
    }

    class Projectile extends AbstractProjectile {
        constructor(name: string, scene: BABYLON.Scene, source? : Projectile);
    }
}
