import React, { Fragment } from "react";

import {
  setMessageAnchorId,
  settings,
  FetchAppData,
  Resources,
  WebrcadeApp,
  LOG,
  TEXT_IDS,
} from '@webrcade/app-common';

import { Emulator } from "./emulator";
import { EmulatorPauseScreen } from "./pause";
import { TouchOverlay } from "./touchoverlay";
import { Keyboard } from "./keyboard";

import './App.scss';
import { VK_TRANSPARENCY } from "./emulator/prefs";

class App extends WebrcadeApp {
  emulator = null;

  constructor() {
    super();

    this.state = {
      ...this.state,
      showCanvas: false,
      showKeyboard: false,
      kbTransparency: VK_TRANSPARENCY.HIGH,
      kbCloseOnEnter: true
    };
  }

  createEmulator(app, isDebug) {
    return new Emulator(app, isDebug);
  }

  start() {
    setMessageAnchorId('canvas');

    const { emulator, ModeEnum } = this;

    this.setState({ mode: ModeEnum.LOADING });

    window.scummArgs = ["--auto-detect"];
    // window.scummArgs = ["--add", "--engine=lab", "--game=lab:lab"];

    try {
      const fad = new FetchAppData(this.archive);

      // Load Emscripten and ROM binaries
      settings
        .load()
        .then(() => fad.fetch())
        .then((response) => {
          return this.fetchResponseBuffer(response);
        })
        .then((bytes) => {
          emulator.setArchive(this.uid, bytes, this.archive);
          return bytes;
        })
        .then(() => emulator.loadEmscriptenModule(this.canvas))
        .then(() => {
            if (this.state.mode !== ModeEnum.ERROR) {
              this.setState({
                mode: ModeEnum.LOADED,
                loadingMessage: null,
              })
            }
          }
        )
        .catch((msg) => {
          LOG.error(msg);
          this.exit(
            msg ? msg : Resources.getText(TEXT_IDS.ERROR_RETRIEVING_GAME),
          );
        });
    } catch (e) {
      this.exit(e);
    }
  }

  componentDidMount() {
    super.componentDidMount();

    const { appProps } = this;

    try {
      // Create the emulator
      if (this.emulator === null) {
        this.emulator = this.createEmulator(this, this.isDebug());

        // Get the uid
        this.uid = appProps.uid;
        if (!this.uid)
          throw new Error('A unique identifier was not found for the game.');

        this.archive = appProps.archive;
        if (!this.archive) {
          throw new Error('An archive file was not specified.');
        }

        this.start();
      }
    } catch (msg) {
      LOG.error(msg);
      this.exit(
        msg ? msg : Resources.getText(TEXT_IDS.ERROR_RETRIEVING_GAME),
      );
    }
  }

  async exit(error, navigateBack = true) {
    if (this.emulator && this.emulator.canvas && this.emulator.canvas.style) {
      this.emulator.canvas.style.opacity = '0.0';
    }

    await super.exit(error, navigateBack);
  }

  async onPreExit() {
    try {
      await super.onPreExit();
      if (!this.isExitFromPause()) {
        // await this.emulator.saveState();
      }
      this.emulator.exit();
    } catch (e) {
      LOG.error(e);
    }
  }

  componentDidUpdate() {
    const { mode } = this.state;
    const { ModeEnum, emulator, canvas } = this;

    if (mode === ModeEnum.LOADED) {
      window.focus();
      // Start the emulator
      emulator.start(canvas);
    }
  }

  showCanvas() {
    this.setState({showCanvas: true});
  }

  renderCanvas() {
    const { showCanvas } = this.state;
    return (
      <canvas
        style={{display: showCanvas ? 'block' : 'none'}}
        ref={(canvas) => {
          this.canvas = canvas;
        }}
        id="canvas"
      ></canvas>
    );
  }

  isKeyboardShown() {
    return this.state.showKeyboard;
  }

  setKeyboardShown(value) {
    try {
      window.Module._emDisableGamepad(value);
    } catch (e) {}
    this.setState({showKeyboard: value})
  }

  setKeyboardTransparency(value) {
    this.setState({kbTransparency: value});
  }

  setKeyboardCloseOnEnter(value) {
    this.setState({kbCloseOnEnter: value});
  }

  render() {
    const { errorMessage, loadingMessage, showCanvas, showKeyboard, statusMessage,
      mode, kbTransparency, kbCloseOnEnter} = this.state;
    const { ModeEnum } = this;

    return (
      <Fragment>
        {super.render()}
        {!statusMessage && (mode === ModeEnum.LOADING || (loadingMessage && !errorMessage))
          ? this.renderLoading()
          : null}
        {mode === ModeEnum.PAUSE ? this.renderPauseScreen() : null}
        {this.renderCanvas()}
        <TouchOverlay show={showCanvas} />
        <Keyboard
          show={showKeyboard}
          transparency={kbTransparency}
          closeOnEnter={kbCloseOnEnter}
        />
        {/* <div id="debugOutput" style={{overflow: 'auto', fontSize: "1.8rem", backgroundColor: 'black', opacity: "0.5", position: 'absolute', top: '0', left: '0', width: '100vw', height: '100px', border: '1px solid red'}} /> */}
      </Fragment>
    );
  }

  renderPauseScreen() {
    const { appProps, emulator } = this;

    return (
      <EmulatorPauseScreen
        emulator={emulator}
        appProps={appProps}
        closeCallback={() => this.resume()}
        exitCallback={() => this.exit()}
        isEditor={this.isEditor}
        isStandalone={this.isStandalone}
      />
    );
  }
}

export default App;
