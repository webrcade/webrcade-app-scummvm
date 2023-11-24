import { VK_POSITION } from "../emulator/prefs";
import {
  KeyDef
} from "./common";

import keycodes from "./scumm-keycodes.json";

import {
  ArrowUpwardImage,
  ArrowDownwardImage,
  ArrowBackImage,
  ArrowForwardImage,
  SwapVertImage,
} from '@webrcade/app-common';

const KBD_CTRL  = 1 << 0;
const	KBD_ALT   = 1 << 1;
const KBD_SHIFT = 1 << 2;
const KBD_META  = 1 << 3;
const	KBD_NUM   = 1 << 4;
const KBD_CAPS  = 1 << 5;
const KBD_SCRL  = 1 << 6;

const KEYCODE_UP          = 273;
const KEYCODE_DOWN        = 274;
const KEYCODE_RIGHT       = 275;
const KEYCODE_LEFT        = 276;
const KEYCODE_INSERT      = 277;
const KEYCODE_HOME        = 278;
const KEYCODE_END         = 279;
const KEYCODE_PAGEUP      = 280;
const KEYCODE_PAGEDOWN    = 281;

// const KEYCODE_KP0         = 256;
// const KEYCODE_KP1         = 257;
// const KEYCODE_KP2         = 258;
// const KEYCODE_KP3         = 259;
// const KEYCODE_KP4         = 260;
// const KEYCODE_KP5         = 261;
// const KEYCODE_KP6         = 262;
// const KEYCODE_KP7         = 263;
// const KEYCODE_KP8         = 264;
// const KEYCODE_KP9         = 265;
const KEYCODE_KP_PERIOD   = 266;
const KEYCODE_KP_DIVIDE   = 267;
const KEYCODE_KP_MULTIPLY = 268;
const KEYCODE_KP_MINUS    = 269;
const KEYCODE_KP_PLUS     = 270;
const KEYCODE_KP_ENTER    = 271;
// const KEYCODE_KP_EQUALS   = 272;

const KEYCODE_NUMLOCK     = 300;
const KEYCODE_CAPSLOCK    = 301;
const KEYCODE_SCROLLOCK   = 302;
// const KEYCODE_RSHIFT      = 303;
const KEYCODE_LSHIFT      = 304;
// const KEYCODE_RCTRL       = 305;
const KEYCODE_LCTRL       = 306;
// const KEYCODE_RALT        = 307;
const KEYCODE_LALT        = 308;
// const KEYCODE_RMETA       = 309;
const KEYCODE_LMETA       = 310;
// const KEYCODE_LSUPER      = 311;      // Left "Windows" key
// const KEYCODE_RSUPER      = 312;      // Right "Windows" key
// const KEYCODE_MODE        = 313;      // "Alt Gr" key
// const KEYCODE_COMPOSE     = 314;      // Multi-key compose key

const KEYCODE_PAUSE       = 19;
const KEYCODE_PRINT       = 316;

keycodes["`"] = { code: 96, ascii: 96 }
keycodes["\""] = { code: 34, ascii: 34 }
keycodes["\\"] = { code: 92, ascii: 92 }
keycodes["left"] = { code: KEYCODE_LEFT, ascii: 0 }
keycodes["right"] = { code: KEYCODE_RIGHT, ascii: 0 }
keycodes["up"] = { code: KEYCODE_UP, ascii: 0 }
keycodes["down"] = { code: KEYCODE_DOWN, ascii: 0 }
keycodes["pgup"] = { code: KEYCODE_PAGEUP, ascii: 0 }
keycodes["pgdown"] = { code: KEYCODE_PAGEDOWN, ascii: 0 }
keycodes["home"] = { code: KEYCODE_HOME, ascii: 0 }
keycodes["end"] = { code: KEYCODE_END, ascii: 0 }
keycodes["insert"] = { code: KEYCODE_INSERT, ascii: 0 }
keycodes["kp+"] = { code: KEYCODE_KP_PLUS, ascii: 0 }
keycodes["kpent"] = { code: KEYCODE_KP_ENTER, ascii: 0 }
keycodes["Kp/"] = { code: KEYCODE_KP_DIVIDE, ascii: 0 }
keycodes["Kp-"] = { code: KEYCODE_KP_MINUS, ascii: 0 }
keycodes["Kp."] = { code: KEYCODE_KP_PERIOD, ascii: 0 }
keycodes["Kp*"] = { code: KEYCODE_KP_MULTIPLY, ascii: 0 }
keycodes["pause"] = { code: KEYCODE_PAUSE, ascii: 0 }
keycodes["print"] = { code: KEYCODE_PRINT, ascii: 0 }

const getMods = (kb, ctx, key) => {
  const code = keycodes[key.c];
  let mods = 0;
  if ((code && code.mods && code.mods["shift"]) || ctx.shift) {
    mods |= KBD_SHIFT;
  }
  if (ctx.control) {
    mods |= KBD_CTRL;
  }
  if (ctx.alt) {
    mods |= KBD_ALT;
  }
  if (ctx.meta) {
    mods |= KBD_META;
  }
  if (ctx.caps) {
    mods |= KBD_CAPS;
  }
  if (ctx.num) {
    mods |= KBD_NUM;
  }
  if (ctx.scroll) {
    mods |= KBD_SCRL;
  }
  return mods;
}

const onKeyboardClose = (kb, ctx) => {
  if (ctx.control) {
    window.Module._emOnKey(KEYCODE_LCTRL, 0, 0, 0);
    ctx.control = false;
  }
  if (ctx.shift) {
    window.Module._emOnKey(KEYCODE_LSHIFT, 0, 0, 0);
    ctx.shift = false;
  }
  if (ctx.alt) {
    window.Module._emOnKey(KEYCODE_LALT, 0, 0, 0);
    ctx.alt = false;
  }
  if (ctx.meta) {
    window.Module._emOnKey(KEYCODE_LMETA, 0, 0, 0);
    ctx.meta = false;
  }
  if (ctx.caps) {
    window.Module._emOnKey(KEYCODE_CAPSLOCK, 0, 0, 0);
    ctx.caps = false;
  }
  if (ctx.num) {
    window.Module._emOnKey(KEYCODE_NUMLOCK, 0, 0, 0);
    ctx.num = false;
  }
  if (ctx.scroll) {
    window.Module._emOnKey(KEYCODE_SCROLLOCK, 0, 0, 0);
    ctx.scroll = false;
  }
}

let nextFlip = 0;

const allowFlip = () => {
  const NOW = Date.now();
  if (nextFlip < NOW) {
    nextFlip = NOW + 200;
    return true;
  }
  console.log('ignoring flip!')
  return false;
}

const capsToggle = (kb, ctx) => {
  if (!allowFlip()) return;
  const newKeys = ctx.currentKeys === "default" ? "caps" : 'default';
  ctx.currentKeys = newKeys;
  kb.setState({ keysContext: { ...ctx } })
  kb.updateFocusGridComponents();
}

const showLetters = (kb, ctx) => {
  if (!allowFlip()) return;
  ctx.currentKeys = "default";
  kb.setState({ keysContext: { ...ctx } })
  kb.updateFocusGridComponents();
}

const showNumbers = (kb, ctx) => {
  if (!allowFlip()) return;
  ctx.currentKeys = "numbers";
  kb.setState({ keysContext: { ...ctx } })
  kb.updateFocusGridComponents();
}

const showOther = (kb, ctx) => {
  if (!allowFlip()) return;
  ctx.currentKeys = "other";
  kb.setState({ keysContext: { ...ctx } })
  kb.updateFocusGridComponents();
}

const toggleShift = (kb, ctx, key) => {
  ctx.shift = !ctx.shift;
  kb.setState({ keysContext: { ...ctx } })
  const mods = getMods(kb, ctx, key);
  window.Module._emOnKey(KEYCODE_LSHIFT, 0, mods, ctx.control);
}

const shiftEnabled = (kb, ctx) => {
  return ctx.shift;
}

const toggleControl = (kb, ctx, key) => {
  ctx.control = !ctx.control;
  kb.setState({ keysContext: { ...ctx } })
  const mods = getMods(kb, ctx, key);
  window.Module._emOnKey(KEYCODE_LCTRL, 0, mods, ctx.control);
}

const controlEnabled = (kb, ctx) => {
  return ctx.control;
}

const toggleAlt = (kb, ctx, key) => {
  ctx.alt = !ctx.alt;
  kb.setState({ keysContext: { ...ctx } })
  const mods = getMods(kb, ctx, key);
  window.Module._emOnKey(KEYCODE_LALT, 0, mods, ctx.alt);
}

const altEnabled = (kb, ctx) => {
  return ctx.alt;
}

const toggleMeta = (kb, ctx, key) => {
  ctx.meta = !ctx.meta;
  kb.setState({ keysContext: { ...ctx } })
  const mods = getMods(kb, ctx, key);
  window.Module._emOnKey(KEYCODE_LMETA, 0, mods, ctx.meta);
}

const metaEnabled = (kb, ctx) => {
  return ctx.meta;
}

const toggleCaps = (kb, ctx, key) => {
  ctx.caps = !ctx.caps;
  kb.setState({ keysContext: { ...ctx } })
  const mods = getMods(kb, ctx, key);
  window.Module._emOnKey(KEYCODE_CAPSLOCK, 0, mods, ctx.caps);
}

const capsEnabled = (kb, ctx) => {
  return ctx.caps;
}

const toggleNum = (kb, ctx, key) => {
  ctx.num = !ctx.num;
  kb.setState({ keysContext: { ...ctx } })
  const mods = getMods(kb, ctx, key);
  window.Module._emOnKey(KEYCODE_NUMLOCK, 0, mods, ctx.num);
}

const numEnabled = (kb, ctx) => {
  return ctx.num;
}

const toggleScroll = (kb, ctx, key) => {
  ctx.scroll = !ctx.scroll;
  kb.setState({ keysContext: { ...ctx } })
  const mods = getMods(kb, ctx, key);
  window.Module._emOnKey(KEYCODE_SCROLLOCK, 0, mods, ctx.scroll);
}

const scrollEnabled = (kb, ctx) => {
  return ctx.scroll;
}

const locationToggle = (kb, ctx) => {
  const prefs = window.emulator.getPrefs()
  prefs.setVkPosition(
    prefs.getVkPosition() === VK_POSITION.MIDDLE ?
      VK_POSITION.BOTTOM : VK_POSITION.MIDDLE
  )
  kb.forceRefresh();
}

const onKey = (kb, ctx, key) => {
  const code = keycodes[key.c];
  const mods = getMods(kb, ctx, key);
  window.Module._emOnKey(code.code, code.ascii, mods, 1);
  window.Module._emOnKey(code.code, code.ascii, mods, 0);
}

const onEnter = (kb, ctx, key) => {
  onKey(kb, ctx, key);
  if (kb.isCloseOnEnter()) {
    window.emulator.app.setKeyboardShown(false);
  }
}

const KEYS = {
  "default": [
    [
      new KeyDef("q").code("q").setOnClick(onKey),
      new KeyDef("w").code("w").setOnClick(onKey),
      new KeyDef("e").code("e").setOnClick(onKey),
      new KeyDef("r").code("r").setOnClick(onKey),
      new KeyDef("t").code("t").setOnClick(onKey),
      new KeyDef("y").code("y").setOnClick(onKey),
      new KeyDef("u").code("u").setOnClick(onKey),
      new KeyDef("i").code("i").setOnClick(onKey),
      new KeyDef("o").code("o").setOnClick(onKey),
      new KeyDef("p").code("p").setOnClick(onKey),
    ],
    [
      new KeyDef("a").code("a").setOnClick(onKey),
      new KeyDef("s").code("s").setOnClick(onKey),
      new KeyDef("d").code("d").setOnClick(onKey),
      new KeyDef("f").code("f").setOnClick(onKey),
      new KeyDef("g").code("g").setOnClick(onKey),
      new KeyDef("h").code("h").setOnClick(onKey),
      new KeyDef("j").code("j").setOnClick(onKey),
      new KeyDef("k").code("k").setOnClick(onKey),
      new KeyDef("l").code("l").setOnClick(onKey),
      new KeyDef(";").code(";").setOnClick(onKey),
    ],
    [
      new KeyDef("CAPS").setOnClick(capsToggle),
      new KeyDef("z").code("z").setOnClick(onKey),
      new KeyDef("x").code("x").setOnClick(onKey),
      new KeyDef("c").code("c").setOnClick(onKey),
      new KeyDef("v").code("v").setOnClick(onKey),
      new KeyDef("b").code("b").setOnClick(onKey),
      new KeyDef("n").code("n").setOnClick(onKey),
      new KeyDef("m").code("m").setOnClick(onKey),
      new KeyDef("Delete").setWidth(2).code("backspace").setOnClick(onKey),
    ],
    [
      new KeyDef("123...").setOnClick(showNumbers),
      new KeyDef("!@#...").setOnClick(showOther),
      new KeyDef("[").code("[").setOnClick(onKey),
      new KeyDef("]").code("]").setOnClick(onKey),
      new KeyDef("Space").setWidth(2).code("space").setOnClick(onKey),
      new KeyDef(",").code(",").setOnClick(onKey),
      new KeyDef(".").code(".").setOnClick(onKey),
      new KeyDef("Enter").setWidth(2).code("enter").setOnClick(onEnter),
    ],
  ],
  "caps": [
    [
      new KeyDef("Q").code("Q").setOnClick(onKey),
      new KeyDef("W").code("W").setOnClick(onKey),
      new KeyDef("E").code("E").setOnClick(onKey),
      new KeyDef("R").code("R").setOnClick(onKey),
      new KeyDef("T").code("T").setOnClick(onKey),
      new KeyDef("Y").code("Y").setOnClick(onKey),
      new KeyDef("U").code("U").setOnClick(onKey),
      new KeyDef("I").code("I").setOnClick(onKey),
      new KeyDef("O").code("O").setOnClick(onKey),
      new KeyDef("P").code("P").setOnClick(onKey),
    ],
    [
      new KeyDef("A").code("A").setOnClick(onKey),
      new KeyDef("S").code("S").setOnClick(onKey),
      new KeyDef("D").code("D").setOnClick(onKey),
      new KeyDef("F").code("F").setOnClick(onKey),
      new KeyDef("G").code("G").setOnClick(onKey),
      new KeyDef("H").code("H").setOnClick(onKey),
      new KeyDef("J").code("J").setOnClick(onKey),
      new KeyDef("K").code("K").setOnClick(onKey),
      new KeyDef("L").code("L").setOnClick(onKey),
      new KeyDef(":").code(":").setOnClick(onKey),
    ],
    [
      new KeyDef("caps").setOnClick(capsToggle),
      new KeyDef("Z").code("Z").setOnClick(onKey),
      new KeyDef("X").code("X").setOnClick(onKey),
      new KeyDef("C").code("C").setOnClick(onKey),
      new KeyDef("V").code("V").setOnClick(onKey),
      new KeyDef("B").code("B").setOnClick(onKey),
      new KeyDef("N").code("N").setOnClick(onKey),
      new KeyDef("M").code("M").setOnClick(onKey),
      new KeyDef("Delete").setWidth(2).code("backspace").setOnClick(onKey),
    ],
    [
      new KeyDef("123...").setOnClick(showNumbers),
      new KeyDef("!@#...").setOnClick(showOther),
      new KeyDef("{").code("{").setOnClick(onKey),
      new KeyDef("}").code("}").setOnClick(onKey),
      new KeyDef("Space").setWidth(2).code("space").setOnClick(onKey),
      new KeyDef("<").code("<").setOnClick(onKey),
      new KeyDef(">").code(">").setOnClick(onKey),
      new KeyDef("Enter").setWidth(2).code("enter").setOnClick(onEnter),
    ],
  ],
  "numbers": [
    [
      new KeyDef("1").code("1").setOnClick(onKey),
      new KeyDef("2").code("2").setOnClick(onKey),
      new KeyDef("3").code("3").setOnClick(onKey),
      new KeyDef("4").code("4").setOnClick(onKey),
      new KeyDef("5").code("5").setOnClick(onKey),
      new KeyDef("6").code("6").setOnClick(onKey),
      new KeyDef("7").code("7").setOnClick(onKey),
      new KeyDef("8").code("8").setOnClick(onKey),
      new KeyDef("9").code("9").setOnClick(onKey),
      new KeyDef("0").code("0").setOnClick(onKey),
    ],
    [
      new KeyDef("Esc").code("esc").setOnClick(onKey),
      new KeyDef("`").code("`").setOnClick(onKey),
      new KeyDef("-").code("-").setOnClick(onKey),
      new KeyDef("=").code("=").setOnClick(onKey),
      new KeyDef("ScrLk").setOnClick(toggleScroll).setIsEnabledCb(scrollEnabled),
      new KeyDef("Ins").code("insert").setOnClick(onKey),
      new KeyDef("PgUp").code("pgup").setOnClick(onKey),
      new KeyDef("Home").code("home").setOnClick(onKey),
      new KeyDef("Up").setImage(ArrowUpwardImage).code("up").setOnClick(onKey),
      new KeyDef("End").code("end").setOnClick(onKey),
    ],
    [
      new KeyDef("Tab").code("tab").setOnClick(onKey),
      new KeyDef("\\").code("\\").setOnClick(onKey),
      new KeyDef("/").code("/").setOnClick(onKey),
      new KeyDef("'").code("'").setOnClick(onKey),
      new KeyDef("NmLk").setOnClick(toggleNum).setIsEnabledCb(numEnabled),
      new KeyDef("Del").code("del").setOnClick(onKey),
      new KeyDef("PdDn").code("pgdown").setOnClick(onKey),
      new KeyDef("Left").setImage(ArrowBackImage).code("left").setOnClick(onKey),
      new KeyDef("Down").setImage(ArrowDownwardImage).code("down").setOnClick(onKey),
      new KeyDef("Right").setImage(ArrowForwardImage).code("right").setOnClick(onKey),
    ],
    [
      new KeyDef("abc...").setOnClick(showLetters),
      new KeyDef("!@#...").setOnClick(showOther),
      new KeyDef("Position").setImage(SwapVertImage).setOnClick(locationToggle),
      new KeyDef("Shift").setWidth(2).setOnClick(toggleShift).setIsEnabledCb(shiftEnabled),
      new KeyDef("Ctrl").setWidth(2).setOnClick(toggleControl).setIsEnabledCb(controlEnabled),
      new KeyDef("Alt").setOnClick(toggleAlt).setIsEnabledCb(altEnabled),
      new KeyDef("Meta").setOnClick(toggleMeta).setIsEnabledCb(metaEnabled),
      new KeyDef("CapLk").setOnClick(toggleCaps).setIsEnabledCb(capsEnabled),
    ],
  ],
  "other": [
    [
      new KeyDef("!").code("!").setOnClick(onKey),
      new KeyDef("@").code("@").setOnClick(onKey),
      new KeyDef("#").code("#").setOnClick(onKey),
      new KeyDef("$").code("$").setOnClick(onKey),
      new KeyDef("%").code("%").setOnClick(onKey),
      new KeyDef("^").code("^").setOnClick(onKey),
      new KeyDef("&").code("&").setOnClick(onKey),
      new KeyDef("*").code("*").setOnClick(onKey),
      new KeyDef("(").code("(").setOnClick(onKey),
      new KeyDef(")").code(")").setOnClick(onKey),
    ],
    [
      new KeyDef("Esc").code("esc").setOnClick(onKey),
      new KeyDef("~").code("~").setOnClick(onKey),
      new KeyDef("_").code("_").setOnClick(onKey),
      new KeyDef("+").code("+").setOnClick(onKey),
      new KeyDef("Kp/").code("Kp/").setOnClick(onKey),
      new KeyDef("Kp-").code("Kp-").setOnClick(onKey),
      new KeyDef("F1").code("f1").setOnClick(onKey),
      new KeyDef("F2").code("f2").setOnClick(onKey),
      new KeyDef("F3").code("f3").setOnClick(onKey),
      new KeyDef("F4").code("f4").setOnClick(onKey),
    ],
    [
      new KeyDef("Tab").code("tab").setOnClick(onKey),
      new KeyDef("|").code("|").setOnClick(onKey),
      new KeyDef("?").code("?").setOnClick(onKey),
      new KeyDef("\"").code("\"").setOnClick(onKey),
      new KeyDef("Kp.").code("Kp.").setOnClick(onKey),
      new KeyDef("Kp*").code("Kp*").setOnClick(onKey),
      new KeyDef("F5").code("f5").setOnClick(onKey),
      new KeyDef("F6").code("f6").setOnClick(onKey),
      new KeyDef("F7").code("f7").setOnClick(onKey),
      new KeyDef("F8").code("f8").setOnClick(onKey),
    ],
    [
      new KeyDef("abc...").setOnClick(showLetters),
      new KeyDef("123...").setOnClick(showNumbers),
      new KeyDef("Pause").code("pause").setOnClick(onKey),
      new KeyDef("Print").code("print").setOnClick(onKey),
      new KeyDef("Kp+").code("kp+").setOnClick(onKey),
      new KeyDef("KpEnt").code("kpent").setOnClick(onKey),
      new KeyDef("F9").code("f9").setOnClick(onKey),
      new KeyDef("F10").code("f10").setOnClick(onKey),
      new KeyDef("F11").code("f11").setOnClick(onKey),
      new KeyDef("F12").code("f12").setOnClick(onKey),
    ],
  ]
}

export { KEYS, onKeyboardClose }