import {
  AppWrapper,
  Controller,
  Controllers,
  DisplayLoop,
  CIDS,
  LOG
} from '@webrcade/app-common';

import ScummvmFS from './scummvm_fs';

export class Emulator extends AppWrapper {

  constructor(app, debug = false) {
    super(app, debug);
    window.emulator = this;
    this.bytes = null;
  }

  setArchive(uid, bytes) {
    this.uid = uid;
    this.bytes = bytes;
  }

  createControllers() {
    return new Controllers([
      new Controller(),
    ]);
  }

  createAudioProcessor() { return null; }
  onArchiveFile(isDir, name, stats) {}
  onArchiveFilesFinished() {}

  loadEmscriptenModule(canvas) {
    const { app } = this;

    return new Promise((resolve, reject) => {

      const setupHTTPFilesystem = async (e) => {
        const FS = window.FS;
        FS.mkdir("/" + e)
        FS.mount(new ScummvmFS(FS, "js/" + e), {}, "/" + e + "/")
      }

      const setupFilesystem = async (e) => {
        const FS = window.FS;

        window.addRunDependency("scummvm-fs-setup");

        app.setState({ loadingMessage: null, loadingPercent: null });

        setTimeout(() => {
          app.setState({ loadingMessage: 'Preparing files' });
        }, 0);

        await setupHTTPFilesystem("plugins");
        await setupHTTPFilesystem("data");

        if (this.bytes.byteLength === 0) {
          throw new Error('The size is invalid (0 bytes).');
        }

        // Write init
        const contents = (
          "[scummvm]\n" +
          "gfx_mode=opengl\n" +           // OpenGL
          "pluginspath=/plugins\n" +      // Plugins path
          "autosave_period=0\n" +         // Disable auto save
          "vkeybdpath=/data\n" +
          "vkeybd_pack_name=vkeybd_default\n"
        )
        FS.writeFile("/scummvm.ini", contents);

        // Extract the archive
        await this.extractArchive(
          FS, "/game", this.bytes, 640 * 1024 * 1024, this
        );

        // TODO: Try not storing bytes?
        this.bytes = null;

        window.removeRunDependency("scummvm-fs-setup");
      }

      window.Module = {
        preRun: [setupFilesystem],
        postRun: [],
        print: function (t) {
          if (arguments.length > 1) t = Array.prototype.slice.call(arguments).join(" ")
          console.log(t);
        },
        printErr: function (e) {
          if (arguments.length > 1) e = Array.prototype.slice.call(arguments).join(" ")
          console.error(e);
        },
        onRuntimeInitialized: () => {
          const f = () => {
            // Enable show message
            this.setShowMessageEnabled(true);
          }
          setTimeout(f, 1000);
          resolve();
        },
        canvas: function () {
          return document.getElementById("canvas");
        }(),
      };

      const script = document.createElement('script');
      document.body.appendChild(script);
      script.src = "js/scummvm.js";
    });
  }

  onPause(p) {
    const Module = window.Module;
    if (p) {
      Module._emPause();
    } else {
      Module._emUnpause();
    }
  }

  exit() {
    const Module = window.Module;
    console.log('exit!');
    Module._emQuit();
  }

  async onShowPauseMenu() {
    // await this.saveState();
  }

  pollControls() {
    const { controllers } = this;

    controllers.poll();

    if (controllers.isControlDown(0, CIDS.ESCAPE)) {
      if (this.pause(true)) {
        controllers
          .waitUntilControlReleased(0, CIDS.ESCAPE)
          .then(() => this.showPauseMenu());
        return;
      }
    }
  }

  forceResize() {
    window.dispatchEvent(new Event('resize'));
    if ((Date.now() - this.startTime) < 10 * 1000) {
      setTimeout(() => { this.forceResize() }, 100);
    }
  }

  async onStart(canvas) {
    const { app } = this;

    this.startTime = Date.now();
    this.canvas = canvas;

    try {
      // Hack to fix issue where screen is not sized correctly on initial load
      this.forceResize();

      app.setState({ loadingMessage: null, loadingPercent: null });

      const loop = new DisplayLoop(
        60, // frame rate (ignored due to no wait)
        true, // vsync
        this.debug, // debug
        true, // force native
        false, // no wait
      );
      loop.setAdjustTimestampEnabled(false);
      loop.start(() => {
        this.pollControls();
      });

    } catch (e) {
      app.setState({ loadingMessage: null, loadingPercent: null });
      LOG.error(e);
      app.exit(e);
    }
  }
}


// wait(time) {
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       resolve();
//     }, time);
//   });
// }
