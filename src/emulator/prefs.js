import {
    AppPrefs
  } from '@webrcade/app-common';

  export class Prefs extends AppPrefs {
    constructor(emu) {
      super(emu);

      this.emu = emu;
      const app = emu.getApp();
      this.touchpadMouseModePath = app.getStoragePath(`${this.PREFS_PREFIX}.touchpadMouseMode`);
      this.touchpadMouseMode = false;
    }

    async load() {
      console.log("## loading prefs.")
      await super.load();
      // TODO: enable once the bug is fixed (when starting in touchpad mode)
      // this.touchpadMouseMode = await super.loadBool(this.touchpadMouseModePath, true);
      console.log("### loaded touchpad mode: " + this.touchpadMouseMode);
    }

    async save() {
      await super.save();
      console.log("### saving touchpad mode: " + this.touchpadMouseMode);
      await super.saveBool(this.touchpadMouseModePath, this.touchpadMouseMode);
    }

    getTouchpadMouseMode() {
      return this.touchpadMouseMode;
    }

    setTouchpadMouseMode(touchpadMouseMode) {
      this.touchpadMouseMode = touchpadMouseMode;
      this.save();
    }
  }
