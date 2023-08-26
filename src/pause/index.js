import React from 'react';
import { Component } from 'react';

import { GamepadControlsTab, KeyboardControlsTab } from './controls';

import {
  AppSettingsEditor,
  CustomPauseScreen,
  EditorScreen,
  GamepadWhiteImage,
  KeyboardWhiteImage,
  PauseScreenButton,
  Resources,
  SettingsAppWhiteImage,
  TEXT_IDS,
} from '@webrcade/app-common';

export class EmulatorPauseScreen extends Component {
  constructor() {
    super();
    this.state = {
      mode: this.ModeEnum.PAUSE,
    };
  }

  ModeEnum = {
    PAUSE: 'pause',
    SETTINGS: '2600-settings',
    CONTROLS: 'controls',
  };

  ADDITIONAL_BUTTON_REFS = [React.createRef(), React.createRef()];

  render() {
    const { ADDITIONAL_BUTTON_REFS, ModeEnum } = this;
    const { appProps, closeCallback, emulator, exitCallback, isEditor, isStandalone } = this.props;
    const { mode } = this.state;

    return (
      <>
        {mode === ModeEnum.PAUSE ? (
          <CustomPauseScreen
            appProps={appProps}
            closeCallback={closeCallback}
            exitCallback={exitCallback}
            isEditor={isEditor}
            isStandalone={isStandalone}
            additionalButtonRefs={ADDITIONAL_BUTTON_REFS}
            additionalButtons={[
              <PauseScreenButton
                imgSrc={GamepadWhiteImage}
                buttonRef={ADDITIONAL_BUTTON_REFS[0]}
                label={Resources.getText(TEXT_IDS.VIEW_CONTROLS)}
                onHandlePad={(focusGrid, e) =>
                  focusGrid.moveFocus(e.type, ADDITIONAL_BUTTON_REFS[0])
                }
                onClick={() => {
                  this.setState({ mode: ModeEnum.CONTROLS });
                }}
              />,
              <PauseScreenButton
                imgSrc={SettingsAppWhiteImage}
                buttonRef={ADDITIONAL_BUTTON_REFS[1]}
                label="ScummVM Settings"
                onHandlePad={(focusGrid, e) =>
                  focusGrid.moveFocus(e.type, ADDITIONAL_BUTTON_REFS[1])
                }
                onClick={() => {
                  this.setState({ mode: ModeEnum.SETTINGS });
                }}
              />,
            ]}
          />
        ) : null}
        {mode === ModeEnum.CONTROLS ? (
          <EditorScreen
            onClose={closeCallback}
            tabs={[
              {
                image: GamepadWhiteImage,
                label: Resources.getText(TEXT_IDS.GAMEPAD_CONTROLS),
                content: <GamepadControlsTab />,
              },
              {
                image: KeyboardWhiteImage,
                label: Resources.getText(TEXT_IDS.KEYBOARD_CONTROLS),
                content: <KeyboardControlsTab />,
              },
            ]}
          />
        ) : null}
        {mode === ModeEnum.SETTINGS ? (
          <AppSettingsEditor
            emulator={emulator}
            onClose={closeCallback}
          />
        ) : null}
      </>
    );
  }
}
