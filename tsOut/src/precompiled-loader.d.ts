import Loader from './loader';
export declare class PrecompiledLoader extends Loader {
    precompiled: any;
    constructor(compiledTemplates: any);
    getSource(name: any): {
        src: {
            type: string;
            obj: any;
        };
        path: any;
    };
}
//# sourceMappingURL=precompiled-loader.d.ts.map