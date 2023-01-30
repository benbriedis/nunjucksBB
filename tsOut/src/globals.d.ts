export = globals;
declare function globals(): {
    range(start: any, stop: any, step: any): any[];
    cycler(...args: any[]): {
        current: any;
        reset(): void;
        next(): any;
    };
    joiner(sep: any): () => any;
};
//# sourceMappingURL=globals.d.ts.map