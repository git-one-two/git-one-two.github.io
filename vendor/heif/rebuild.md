# Unmodified HEIF decoding component

- npm `libheif-js@1.23.5`, wrapper commit `d8ec4bc3bc5bf8055975577bccbbc7e1d7313c2d`.
- Published Emscripten release `v1.23.5`, commit `5c8968a44e9c68ae677e24790d77d001ed7fe7cc`.
- Its pinned libheif submodule: `413e2a87e6a70b3eccc3a3adc5801179dd2d9e00`.
- Compiler: Emscripten `3.1.61`, Node `24`, TypeScript `5`, Ubuntu `22.04`, as recorded in the supplied `.github/workflows/emscripten.yml`.
- Default decoder dependency: libde265 `1.0.15`, included in `source/`.
- Default build: `ENABLE_LIBDE265=1`, `ENABLE_AOM=0`, `ENABLE_WEBCODECS=0`, `ENABLE_OPENJPEG=0`, `ENABLE_UNCOMPRESSED=0`; no x265 encoder in the Emscripten recipe. Libraries use their original licenses; GPL command-line applications are not compiled into this decoder.

The complete, unmodified sources and build scripts are available beside this file, with hashes in `sources.json`. Extract the emscripten source archive, place the supplied libheif tree at its `libheif/` submodule location, and follow `.github/workflows/emscripten.yml` for its WASM target. That workflow installs the specified SDK and transforms the included `scripts/run-ci.sh` to use `USE_WASM=1 USE_UNSAFE_EVAL=0 USE_TYPESCRIPT=1`. Pre-seed `libheif/libde265-1.0.15.tar.gz` with the supplied source archive if building without fetching it again. `build-emscripten.sh` contains the exact compiler and linker arguments.

Then run the wrapper repository's `scripts/install.js` against that generated `libheif.tar.gz` archive. Its original script records the ES2019 transform and esbuild options that generate `libheif-wasm/libheif-bundle.mjs`. The application redistributes that published module byte-for-byte and does not alter the library.

This application imports the library from `/vendor/heif/libheif-bundle.mjs` at runtime in an isolated Worker. Replace that file with a modified compatible module to debug or use a modified library; there is no runtime integrity check blocking replacement. Rebuilding the proprietary application bundle is not required to substitute this module. Preserve the LGPL/GPL notices and source availability when redistributing modified library binaries. The application permits modifications and reverse engineering needed to debug changes to the library; no application restriction overrides those permissions.

Code-license compliance is not a representation that every codec patent is licensed. This is a local HEVC/HEIF decoder and not a patent-clearance service.
