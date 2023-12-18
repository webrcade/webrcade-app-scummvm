import {
  AppWrapper,
  Controller,
  Controllers,
  DisplayLoop,
  FileManifest,
  registerAudioResume,
  CIDS,
  SCREEN_CONTROLS,
  LOG
} from '@webrcade/app-common';

import ScummvmFS from './scummvm_fs';
import { Prefs } from './prefs'

export class Emulator extends AppWrapper {

  SAVE_NAME = "sav";
  SAVES_DIR = "/saves";
  SCUMMVM_INI = "/scummvm.ini";
  SCUMMVM_INI_NO_SLASH = "scummvm.ini";

  constructor(app, debug = false) {
    super(app, debug);
    window.emulator = this;
    this.bytes = null;
    this.threed = false;
    this.touchEvent = false;
    this.mouseEvent = false;
    this.touchEnabled = false;
    this.touchEventCount = 0;
    this.mouseEventCount = 0;
    this.screenWidth = 0;
    this.screenHeight = 0;
    this.selectDown = false;
    this.afterCompatCheck = false;
    this.preRunSet = false;
    this.prompt = false;
    this.gameIniSettings = null;

    this.prefs = new Prefs(this);

    // const debugOut = (content) => {
    //   const el = window.document.getElementById("debugOutput");
    //   if (el) {
    //     el.innerHTML = content + "<br>" + el.innerHTML;
    //   }
    // }
    // window.debugOut = debugOut;
  }

  isTouchEvent() {
    return this.touchEvent;
  }

  isTouchpadMode() {
    const value = this.prefs.getTouchpadMouseMode();
    LOG.info("isTouchpadMode: " + value);
    return value;
  }

  toggleTouchpadMode() {
    const value = !this.prefs.getTouchpadMouseMode();
    this.prefs.setTouchpadMouseMode(value);
    window.Module._emSetTouchpadMouseMode(value);
  }

  setFilterMouseEvents(filter) {
    const Module = window.Module;
    try {
      Module._emSetFilterMouseEvents(filter);
      LOG.info("## Filter mouse events: " + filter);
      this.touchEnabled = filter;
    } catch(e) { console.error(e) }
  }

  showTouchOverlay(show) {
    const to = document.getElementById("touch-overlay");
    if (to) {
      to.style.display = show ? 'block' : 'none';
    }
  }

  onTouchEvent() {
    const controls = this.prefs.getScreenControls();

    if (!this.touchEvent) {
      if (controls === SCREEN_CONTROLS.SC_AUTO) {
        setTimeout(() => {
          this.showTouchOverlay(true);
          this.app.forceRefresh();
        }, 0);
      }
      this.touchEvent = true;
    }

    const Module = window.Module;
    if (!this.firstTouch) {
      this.firstTouch = true;
      setTimeout(() => {
        Module._emSetTouchpadMouseMode(this.prefs.getTouchpadMouseMode());
      }, 1000);
    }

    this.touchEventCount++;
    if (!this.touchEnabled) {
      this.setFilterMouseEvents(true);
    }
  }

  onMouseEvent() {
    const controls = this.prefs.getScreenControls();

    if (!this.mouseEvent) {
      if (controls === SCREEN_CONTROLS.SC_AUTO) {
        setTimeout(() => {
          this.showTouchOverlay(true);
          this.app.forceRefresh();
        }, 0);
      }
      this.mouseEvent = true;
    }

    this.mouseEventCount++;
  }

  setArchive(uid, bytes, url) {
    this.uid = uid;
    this.bytes = bytes;
    this.url = url;
  }

  createControllers() {
    return new Controllers([
      new Controller(),
    ]);
  }

  createTouchListener() {}

  showCanvas() {
    this.app.showCanvas()
    setTimeout(() => {
      this.canvas.style.opacity = "1.0";
    }, 2000);
  }

  createAudioProcessor() { return null; }

  onArchiveFile(isDir, name, stats) { }

  onArchiveFilesFinished() { }

  onPause(p) {
    const { app } = this;
    const Module = window.Module;
    if (p) {
      try {
        app.setKeyboardShown(false);
        Module._emPause();
      } catch (e) {}
    } else {
      try {
        Module._emUnpause();
      } catch (e) {}
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

  async onConfigUpdated() {
    if (!this.started) return;
    await this.saveState();
  }

  async onSaveGame(fileName) {
    const { FS, Module } = window;

    // Seems like a bug with Grim Fandango, keeps writing this file over and over
    if (fileName === 'grimdialog.htm') return;

    const path = this.SAVES_DIR + "/" + fileName;
    for (let i = 0; i < 10; i++) {
      const res = FS.analyzePath(path, true);
      LOG.info(res);
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

  onExitWithMessage(message) {
    const { app } = this;
    const msg = window.UTF8ToString(message);
    app.exit(msg);
  }

  onExit() {
    const { app } = this;
    setTimeout(() => {
      app.exit(this.gameNotFound ? "Unable to find a supported game." : null);
    }, 0);
  }

  async onShowPauseMenu() {
    LOG.info(window.FS.readdir("/saves"));
    await this.saveState();
  }

  set3d(val) {
    LOG.info("### set3d: " + val);
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
        const scummFs = new ScummvmFS(FS, "js/" + e);
        FS.mount(scummFs, {}, "/" + e + "/")
      }

      const setupFilesystem = async (e) => {
        const FS = window.FS;

        window.addRunDependency("scummvm-fs-setup");
        try {
          await setupHTTPFilesystem("plugins");
          await setupHTTPFilesystem("data");

          if (this.bytes.byteLength === 0) {
            throw new Error('The size is invalid (0 bytes).');
          }

          // Write the predictive dictionary
          // try {
          //   const response = await fetch("pred.dic");
          //   const dictionary = await response.text();
          //   FS.writeFile("/pred.dic", dictionary);
          // } catch (e) {
          //   LOG.error(e);
          // }

          // Make sure we can write to the file system
          try {
            FS.writeFile("/test", "test");
          } catch (e) {
            LOG.error(e);
          }

          const cacheList = [
              "/data/gui-icons.dat",
              "/data/fonts.dat",
              "/data/residualvm.zip",
              "/data/scummclassic.zip",
              "/data/scummmodern.zip",
              "/data/scummremastered.zip",
              "/data/vkeybd_small.zip",
          ]

          var buf = new Uint8Array(2);
          for (let i = 0; i < cacheList.length; i++) {
            const cf = cacheList[i];
            const stream = FS.open(cf);
            FS.read(stream, buf, 0, 2, 0);
            FS.close(stream);
          }

          // Extract the archive
          let size = 0;
          try {
            if (this.bytes.length > 10 * 1024 * 1024) {
              app.setState({ loadingMessage: "Preparing files", loadingPercent: null });
              await this.wait(10);
            }
            await this.extractArchive(
              FS, "/game", this.bytes, 10 * 1024 * 1024 * 1024, this
            );
            size = this.bytes.length;
          } catch (e) {
            LOG.info("Not a zip file, checking for a manifest.");
            FS.mkdir("/game");
            const manifest = new FileManifest(this, FS, "/game", this.bytes, this.url);
            const totalSize = await manifest.process();
            if (!totalSize) throw e;
            size = totalSize;
          }

          // TODO: Try not storing bytes?
          this.bytes = null;

          app.setState({ loadingMessage: "Starting", loadingPercent: null });
          await this.wait(10);

          let pause = false;
          if (size > 100 * 1024 * 1024) {
            pause = true;
          }

          if (pause) {
            await this.wait(5000);
          }

          // Load the save state
          FS.mkdir(this.SAVES_DIR);
          this.saveStatePrefix = app.getStoragePath(`${this.uid}/`);
          this.saveStatePath = `${this.saveStatePrefix}${this.SAVE_NAME}`;
          await this.loadState();

          // Write ini file for ScummVM
          let contents = (
            "[scummvm]\n" +
            "joystick_deadzone=10\n" +
            "aspect_ratio=true\n" +
            "renderer=software\n" +
            "pluginspath=/plugins\n" +      // Plugins path
            "vkeybdpath=/data\n" +
            "originalsaveload=true\n" +
            "vkeybd_pack_name=vkeybd_default\n" +
            "savepath=/saves\n" +
            "themepath=/data/\n" +
            // "gfx_mode=1x\n" +
            // "gfx_mode=2x\n" +
            "monosize=22\n" +  // Text adventure text size (mono fonts)
            "propsize=18\n" +  // Standard fonts
            "autosave_period=0\n" +     // Disable auto save
            "enable_unsupported_game_warning=true\n" // TODO: Show WRC message
          )

          if (this.is3d()) {
            contents += "gfx_mode=opengl\n"; // OpenGL
          }

          contents += (
            "[keymapper]\n" +
            "keymap_global_VIRT=C+F7\n"
          );

          if (this.gameIniSettings) {
            contents += this.gameIniSettings;
          }

          console.log(contents);
          FS.writeFile(this.SCUMMVM_INI, contents);

          if (pause) {
            await this.wait(10000);
          }
        } catch (e) {
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
          LOG.info(t);
        },
        printErr: function (e) {
          if (arguments.length > 1) e = Array.prototype.slice.call(arguments).join(" ")
          console.error(e);
        },
        canvas: function () {
          return document.getElementById("canvas");
        }(),
        onRuntimeInitialized: () => {
          resolve();
        },
      };

      const script = document.createElement('script');
      document.body.appendChild(script);
      script.src = "js/scummvm.js";
    });
  }

  preRun() {
    LOG.info("## pre run.");
    this.preRunSet = true;
  }

  afterCompatibilityCheck() {
    LOG.info("## after compatibility check.");
    this.afterCompatCheck = true;
  }

  showCompatibilityPrompt() {
    LOG.info("## show compatibility prompt.");
    this.prompt = true;
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

      try {
        // ini file
        const res = FS.analyzePath(this.SCUMMVM_INI, true);
        if (res.exists) {
          const s = FS.readFile(this.SCUMMVM_INI);
          if (s) {
            const content = new TextDecoder().decode(s);
            const lines = this.filterGameSettings(content.split("\n"));
            let out = "";
            for (let cl = 0; cl < lines.length; cl++) {
              out += lines[cl] + "\n";
            }
            console.log(out);
            files.push({
              name: this.SCUMMVM_INI_NO_SLASH,
              content: new TextEncoder().encode(out),
            });
          }
        }
      } catch (e) {
        LOG.error(e);
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

  filterGameSettings(lines) {
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (
        line.indexOf("id_came_from_command_line") !== -1 ||
        line.indexOf("touchpad_mouse_mode") !== -1
      ) {
        continue;
      }
      out.push(line);
    }
    return out;
  }

  extractGameSettings(content) {
    const lines = this.filterGameSettings(content.split("\n"));
    let gameSettings = null;
    let inGameBlock = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line[0] === '[') {
        if (line.indexOf("scummvm") !== -1 ||
            line.indexOf("keymapper") !== -1) {
            inGameBlock = false;
            continue;
        }
        gameSettings = "\n\n";
        inGameBlock = true;
      }

      if (inGameBlock) {
        // if (line.indexOf("id_came_from_command_line") == -1 &&
        //   line.indexOf("touchpad_mouse_mode") == -1) {
        //   gameSettings += line + "\n";
        // }
        gameSettings += line + "\n";
      }
    }
    this.gameIniSettings = gameSettings;
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
          if (f.name === 'scummvm.ini') {
console.log(new TextDecoder().decode(f.content));
            this.extractGameSettings(new TextDecoder().decode(f.content));
          } else {
            FS.writeFile(this.SAVES_DIR + "/" + f.name, s);
          }
        }
      }
    } catch (e) {
      LOG.error('Error loading save state: ' + e);
    }
  }

  pollControls() {
    const { controllers } = this;

    controllers.poll();

    //       start -> pause (escape)
    //       select -> keyboard

    if (controllers.isControlDown(0, CIDS.START) || controllers.isControlDown(0, CIDS.ESCAPE)) {
      if (this.pause(true)) {
        controllers
          .waitUntilControlReleased(0, CIDS.ESCAPE)
          .then(() => this.showPauseMenu());
        return;
      }
    }

    if (!this.paused) {
      if (controllers.isControlDown(0, CIDS.SELECT)) {
        if (this.selectDown) return;
        this.selectDown = true;
        controllers
          .waitUntilControlReleased(0, CIDS.SELECT)
            .then(() => {
              this.toggleKeyboard();
              this.selectDown = false;
            });
      }
    }
  }

  updateOnScreenControls(initial = false) {
    const controls = this.prefs.getScreenControls();
    if (controls === SCREEN_CONTROLS.SC_OFF) {
      this.showTouchOverlay(false);
    } else if (controls === SCREEN_CONTROLS.SC_ON) {
      this.showTouchOverlay(true);
    } else if (controls === SCREEN_CONTROLS.SC_AUTO) {
      if (!initial) {
        setTimeout(() => {
          this.showTouchOverlay(this.touchEvent || this.mouseEvent);
          this.app.forceRefresh();
        }, 0);
      }
    }
  }

  updateBilinearFilter() {
    // const { Module } = window;
    // const enabled = this.isBilinearFilterEnabled();
    // try {
    //   Module._emSetFilterEnabled(enabled);
    // } catch {}
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

  updateScreenDimensions() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (width !== this.screenWidth || height !== this.screenHeight) {
      this.screenWidth = width;
      this.screenHeight = height;
      LOG.info(this.screenWidth + ", " + this.screenHeight);
      window.Module._emSetScreenSize(this.screenWidth, this.screenHeight);
    }
  }

  updateVkTransparency() {
    const value = this.prefs.getVkTransparency();
    this.app.setKeyboardTransparency(value);
  }

  updateVkCloseOnEnter() {
    const value = this.prefs.getVkCloseOnEnter();
    this.app.setKeyboardCloseOnEnter(value);
  }

  updateCanvasCursor() {
    const value = this.prefs.getSystemCursor();
    if (value) {
      this.canvas.classList.remove("canvas-no-cursor");
    } else {
      this.canvas.classList.add("canvas-no-cursor");
    }
  }

  toggleKeyboard() {
    const { app } = this;
    // console.log('toggle keyboard');

    const show = !app.isKeyboardShown();
    app.setKeyboardShown(show);
    //window.Module._emKeyboard()
  }

  async onStart(canvas) {
    this.canvas = canvas;
    LOG.info("## onstart.");

    let c = 0;
    while (!this.preRunSet) {
      if (c++ === 50) {
        LOG.info("## waiting...");
      }
      await this.wait(100);
    }

    const { app } = this;
    const { Module } = window;

    const f = () => {
      // Enable show message
      this.setShowMessageEnabled(true);
      if (window.Module.SDL2 && window.Module.SDL2.audioContext) {
        if (window.Module.SDL2.audioContext.state !== 'running') {
          app.setShowOverlay(true);
          registerAudioResume(
            window.Module.SDL2.audioContext,
            (running) => {
              setTimeout(() => app.setShowOverlay(!running), 50);
            },
            500,
          );
        }
      } else {
        setTimeout(f, 1000);
      }
    };
    setTimeout(f, 1000);

    canvas.style.display = 'none';

    const start = async () => {
      this.startTime = Date.now();
      canvas.style.display = 'block';

      // window.addEventListener("touchstart", (e) => {
      //   const clientX = e.touches[0].clientX;
      //   const clientY = e.touches[0].clientY;
      //   debugOut("touchstart " + clientX + ", " + clientY);
      // })

      // window.addEventListener("touchmove", (e) => {
      //   const clientX = e.touches[0].clientX;
      //   const clientY = e.touches[0].clientY;
      //   debugOut("touchmove " + clientX + ", " + clientY);
      // })

      // canvas.addEventListener("touchend", (e) => {
      //   // const clientX = e.touches[0].clientX;
      //   // const clientY = e.touches[0].clientY;
      //   debugOut("touchend");
      // })

      // canvas.addEventListener("mousemove", (e) => {
      //   debugOut("mousemove");
      // })

      const onTouch = () => { this.onTouchEvent() };
      window.addEventListener("touchstart", onTouch);
      window.addEventListener("touchend", onTouch);
      window.addEventListener("touchcancel", onTouch);
      window.addEventListener("touchmove", onTouch);

      const onMouse = () => { this.onMouseEvent() };
      window.addEventListener("mousedown", onMouse);
      window.addEventListener("mouseup", onMouse);
      window.addEventListener("mousemove", onMouse);

      // Prevent right click displaying menu
      window.addEventListener("contextmenu", e => e.preventDefault());

      // Set the initial touchpad mode
      window.Module._emSetTouchpadMouseMode(false);

      // Enable bilinear filter
      window.Module._emSetFilterEnabled(true);

      // Prefs
      this.updateVkTransparency();
      this.updateCanvasCursor();
      this.updateVkCloseOnEnter();

      try {
        // Hack to fix issue where screen is not sized correctly on initial load
        this.forceResize();

        const loop = new DisplayLoop(
          60, // frame rate (ignored due to no wait)
          true, // vsync
          this.debug, // debug
          true, // force native
          false, // no wait
        );
        loop.setAdjustTimestampEnabled(false);

        // Update the screen size
        this.updateScreenDimensions();

        let count = 0;
        loop.start(() => {
          this.pollControls();
          count++;
          if (count === 60) {
            // Update the screen size
            this.updateScreenDimensions();
            // LOG.info("touch: " + this.touchEventCount);
            // LOG.info("mouse: " + this.mouseEventCount);
            if (this.touchEnabled && this.touchEventCount === 0 && this.mouseEventCount >= 2) {
              this.setFilterMouseEvents(false);
            }
            this.touchEventCount = 0;
            this.mouseEventCount = 0;
            count = 0;

            let ping = false;
            try {
              ping = window.Module._emPing();
            } catch (e) {
              LOG.error(e);
            }
            if (!ping) {
              app.exit("An unexpected error has occurred.");
            }
          }
        });
      } catch (e) {
        LOG.error(e);
        app.exit(e);
      }
    }

    if (this.prompt) {
      Module._emPause();
      app.yesNoPrompt({
        header: 'Compatibility Issues',
        message: 'This game is known to have compatibility issues.',
        prompt: 'Do you still wish to continue?',
        onYes: async (prompt) => {
          prompt.close();
          Module._emUnpause();
          await start();
        },
        onNo: (prompt) => {
          prompt.close();
          app.exit();
        },
      });
    } else {
      await start();
    }
  }
}

