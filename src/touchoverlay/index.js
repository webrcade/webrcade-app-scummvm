import { Component } from "react";

import {
  ImageButton,
  KeyboardWhiteImage,
  PauseWhiteImage
} from '@webrcade/app-common';

import './style.scss'

export class TouchOverlay extends Component {
  render() {
    const { show } = this.props;
    const { emulator } = window;

    if (!emulator || !show) return <></>;

    const app = emulator.app;

    const showPause = () => {
      if (!app.isShowOverlay() && emulator.pause(true)) {
        setTimeout(() => emulator.showPauseMenu(), 50);
      }
    }

    return (
      <div className="touch-overlay">
        <div className="touch-overlay-buttons">
          <div className="touch-overlay-buttons-left"></div>
          <div className="touch-overlay-buttons-center"></div>
          <div className="touch-overlay-buttons-right">
            <ImageButton
              className="touch-overlay-button"
              imgSrc={KeyboardWhiteImage}
              onClick={() => { window.Module._emKeyboard()}}
            />
            <ImageButton
              className="touch-overlay-button touch-overlay-button-last"
              onClick={showPause}
              imgSrc={PauseWhiteImage}
            />
          </div>
        </div>
      </div>
    );
  }
}

