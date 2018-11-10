declare module 'chuhai' {
  function suite(implementation: (s: Helper) => void): Promise<void>;
  function suite(
    name: string,
    implementation: (s: Helper) => void
  ): Promise<void>;
  export default suite;
}

interface Helper {
  cycle: (implementation: () => void) => void;
  bench: (
    name: string,
    implementation: (
      cb: { resolve: () => void; reject: (error?: any) => void }
    ) => void
  ) => void;
  set: (key: string, value: any) => void;
}
