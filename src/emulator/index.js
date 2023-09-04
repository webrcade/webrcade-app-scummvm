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

  SAVE_NAME = "sav";
  SAVES_DIR = "/saves";

  constructor(app, debug = false) {
    super(app, debug);
    window.emulator = this;
    this.bytes = null;
    this.threed = false;
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

  onArchiveFile(isDir, name, stats) { }

  onArchiveFilesFinished() { }

  onPause(p) {
    const Module = window.Module;
    if (p) {
      Module._emPause();
    } else {
      Module._emUnpause();
    }
  }

  onGameNotFound() {
    this.gameNotFound = true;
  }

  onShowMenu() {
    if (this.pause(true)) {
      this.showPauseMenu();
    }
  }

  async onSaveGame(fileName) {
    const { FS, Module } = window;

    // Seems like a bug with Grim Fandango, keeps writing this file over and over
    if (fileName === 'grimdialog.htm') return;

    const path = this.SAVES_DIR + "/" + fileName;
    for (let i = 0; i < 10; i++) {
      const res = FS.analyzePath(path, true);
      console.log(res);
      if (res.exists) {
        Module._emPause();
        setTimeout(() => {
          try {
            this.saveState();
          } finally {
            Module._emUnpause();
          }
        }, 1000);
        // Exit loop
        return;
      }
      await this.wait(200);
    }
  }

  onSaveScreenshot(path) {}

  onExit() {
    const { app } = this;
    setTimeout(() => {
      app.exit(this.gameNotFound ? "Unable to find a supported game." : null);
    }, 0);
  }

  async onShowPauseMenu() {
    console.log(window.FS.readdir("/saves"));
    await this.saveState();
  }

  set3d(val) {
    console.log("### set3d: " + val);
    this.threed = val;
    setTimeout(() => {
      this.updateScreenSize();
    }, 1000);
  }

  is3d() {
    return this.threed;
  }

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
        try {
          app.setState({ loadingMessage: null, loadingPercent: null });

          setTimeout(() => {
            app.setState({ loadingMessage: 'Preparing files' });
          }, 0);

          await setupHTTPFilesystem("plugins");
          await setupHTTPFilesystem("data");

          if (this.bytes.byteLength === 0) {
            throw new Error('The size is invalid (0 bytes).');
          }

          // "gfx_mode=2x\n" +               // OpenGL opengl

          // Write init file for ScummVM
          let contents = (
            "[scummvm]\n" +
            "aspect_ratio=true\n" +
            "renderer=software\n" +
            "pluginspath=/plugins\n" +      // Plugins path
            "vkeybdpath=/data\n" +
            "originalsaveload=true\n" +
            "vkeybd_pack_name=vkeybd_default\n" +
            "savepath=/saves\n" +
            "themepath=/data/\n" +
            // "gfx_mode=2x\n" +               // OpenGL opengl
            // "monosize=22\n" +  // Text adventure text size (mono fonts)
            // "propsize=18\n" +  // Standard fonts
            "autosave_period=0\n"         // Disable auto save
          )

          if (this.is3d()) {
            contents += "gfx_mode=opengl\n"; // OpenGL opengl
          }

          FS.writeFile("/scummvm.ini", contents);

          // Extract the archive
          await this.extractArchive(
            FS, "/game", this.bytes, 10 * 1024 * 1024 * 1024, this
          );

          // TODO: Try not storing bytes?
          this.bytes = null;

          // Load the save state
          FS.mkdir(this.SAVES_DIR);
          this.saveStatePrefix = app.getStoragePath(`${this.uid}/`);
          this.saveStatePath = `${this.saveStatePrefix}${this.SAVE_NAME}`;
          await this.loadState();

        } catch (e) {
          app.setState({ loadingMessage: null, loadingPercent: null });
          LOG.error(e);
          app.exit(e);
          return false;
        }

        window.removeRunDependency("scummvm-fs-setup");
        return true;
      }

      window.Module = {
        onAbort: (e) => {
          app.exit(e);
        },
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

  exit() {
    try {
      const Module = window.Module;
      Module._emQuit();
    } catch { }
  }

  async saveState() {
    const { FS } = window;

    try {
      const saveName = `${this.SAVE_NAME}.zip`;
      const files = [];
      const currFiles = FS.readdir(this.SAVES_DIR);
      for (let i = 0; i < currFiles.length; i++) {
        const fileName = currFiles[i];
        if (fileName === "." || fileName === ".." || fileName === "info.txt") {
          continue;
        }
        try {
          const path = this.SAVES_DIR + "/" + fileName;
          const res = FS.analyzePath(path, true);
          if (res.exists) {
            const s = FS.readFile(path);
            if (s) {
              files.push({
                name: fileName,
                content: s,
              });
            }
          }
        } catch (e) {
          LOG.error(e);
        }
      }

      const hasChanges = await this.getSaveManager().checkFilesChanged(files);
      if (hasChanges) {
        await this.getSaveManager().save(
          `${this.saveStatePrefix}${saveName}`,
          files,
          this.saveMessageCallback,
        );
      }
    } catch (e) {
      LOG.error('Error persisting save state: ' + e);
    }
  }

  async loadState() {
    const { FS } = window;

    try {
      const saveName = `${this.SAVE_NAME}.zip`;

      // Load from new save format
      const files = await this.getSaveManager().load(
        `${this.saveStatePrefix}${saveName}`,
        this.loadMessageCallback,
      );

      // Cache file hashes
      await this.getSaveManager().checkFilesChanged(files);

      let s = null;
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        if (f.name === 'info.txt') continue;
        s = f.content;
        if (s) {
          FS.writeFile(this.SAVES_DIR + "/" + f.name, s);
        }
      }
    } catch (e) {
      LOG.error('Error loading save state: ' + e);
    }
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

  updateBilinearFilter() {
    const { Module } = window;
    const enabled = this.isBilinearFilterEnabled();
    try {
      Module._emSetFilterEnabled(enabled);
    } catch {}
  }

  isForceAspectRatio() {
    return this.getScreenSize() === this.SS_NATIVE;
  }

  isScreenFill() {
    return this.isForceAspectRatio();
  }

  getDefaultAspectRatio() {
    return 1;
  }

  updateScreenSize() {
    const { Module } = window;

    try {
      const enabled = this.isForceAspectRatio();
      try {
        Module._emSetStretchMode(enabled ?
          this.is3d() ? 3 : 4 :
          this.is3d() ? 4 : 3);
        } catch {}
    } catch (e) {
      LOG.info("Unable to invoke _emSetStretchMode.");
    }

    super.updateScreenSize();

    this.startTime = Date.now();
    this.forceResize();
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

    // Prevent right click displaying menu
    window.addEventListener("contextmenu", e => e.preventDefault());

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

