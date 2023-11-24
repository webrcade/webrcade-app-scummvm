import {
  AppPrefs
} from '@webrcade/app-common';

export const VK_TRANSPARENCY = {
  LOW: "low",
  HIGH: "high"
}

export const VK_POSITION = {
  MIDDLE: "middle",
  BOTTOM: "bottom"
}


export class Prefs extends AppPrefs {
  constructor(emu) {
    super(emu);

    this.emu = emu;
    const app = emu.getApp();
    this.touchpadMouseModePath = app.getStoragePath(`${this.PREFS_PREFIX}.touchpadMouseMode`);
    this.touchpadMouseMode = false;

    this.vkTransparencyPath = app.getStoragePath(`${this.PREFS_PREFIX}.vkTransparency`);
    this.vkTransparency = VK_TRANSPARENCY.HIGH;

    this.vkCloseOnEnterPath = app.getStoragePath(`${this.PREFS_PREFIX}.vkCloseOnEnter`);
    this.vkCloseOnEnter = true;

    this.vkPositionPath = app.getStoragePath(`${this.PREFS_PREFIX}.vkPosition`);
    this.vkPosition =VK_POSITION.MIDDLE;

    this.systemCursorPath = app.getStoragePath(`${this.PREFS_PREFIX}.systemCursor`);
    this.systemCursor = false;
  }

  async load() {
    console.log("## loading prefs.")
    await super.load();
    // TODO: enable once the bug is fixed (when starting in touchpad mode)
    this.touchpadMouseMode = await super.loadBool(this.touchpadMouseModePath, true);
    this.vkTransparency = await super.loadValue(this.vkTransparencyPath, VK_TRANSPARENCY.LOW);
    this.vkPosition = await super.loadValue(this.vkPositionPath, VK_POSITION.MIDDLE);
    this.vkCloseOnEnter = await super.loadBool(this.vkCloseOnEnterPath, true);
    this.systemCursor = await super.loadBool(this.systemCursorPath, false);

  }

  async save() {
    await super.save();
    await super.saveBool(this.touchpadMouseModePath, this.touchpadMouseMode);
    await super.saveValue(this.vkTransparencyPath, this.vkTransparency);
    await super.saveValue(this.vkPositionPath, this.vkPosition);
    await super.saveBool(this.vkCloseOnEnterPath, this.vkCloseOnEnter);
    await super.saveBool(this.systemCursorPath, this.systemCursor);
  }

  getTouchpadMouseMode() {
    return this.touchpadMouseMode;
  }

  setTouchpadMouseMode(touchpadMouseMode) {
    this.touchpadMouseMode = touchpadMouseMode;
    this.save();
  }

  getVkTransparency() {
    return this.vkTransparency;
  }

  setVkTransparency(vkTransparency) {
    this.vkTransparency = vkTransparency;
    this.save();
  }

  getSystemCursor() {
    return this.systemCursor;
  }

  setSystemCursor(value) {
    this.systemCursor = value;
    this.save();
  }

  getVkCloseOnEnter() {
    return this.vkCloseOnEnter;
  }

  setVkCloseOnEnter(value) {
    this.vkCloseOnEnter = value;
    this.save();
  }

  getVkPosition() {
    return this.vkPosition
  }

  setVkPosition(vkPosition) {
    this.vkPosition = vkPosition;
    this.save();
  }
}
