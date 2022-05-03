declare module SALS{

    export function defineMaterials(scene : BABYLON.Scene, resourcesRootDir : string) : void;

    class FurySalesDock extends QI_Lite.Mesh {
        constructor(name: string, scene: BABYLON.Scene, source? : FurySalesDock);
        makeInstances(): QI_Lite.InstancedMesh[];
    }

    class FurySalesDockWarningSys extends AbstractWarningSys {
        constructor(name: string, scene: BABYLON.Scene, source? : FurySalesDockWarningSys);
        makeInstances(): QI_Lite.InstancedMesh[];
    }

    class ProjectionSphere extends QI_Lite.Mesh {
        constructor(name: string, scene: BABYLON.Scene, source? : ProjectionSphere);
    }

    class MainSalesDock extends QI_Lite.Mesh {
        constructor(name: string, scene: BABYLON.Scene, source? : MainSalesDock);
    }

    class BjsBanner extends AbstractBanner {
        constructor(name: string, scene: BABYLON.Scene, source? : BjsBanner);
    }

    class ComeOnDownBanner extends AbstractBanner {
        constructor(name: string, scene: BABYLON.Scene, source? : ComeOnDownBanner);
    }

    class CreditsBanner extends AbstractBanner {
        constructor(name: string, scene: BABYLON.Scene, source? : CreditsBanner);
    }
}
