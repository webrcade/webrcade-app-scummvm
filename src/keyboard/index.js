import React from 'react';
import { Component } from "react";

import {
  FocusGrid,
  GamepadEnum,
  GamepadNotifier,
  ImageButton,
  WebrcadeContext
} from '@webrcade/app-common';

import { KeyboardDefinition } from './common';
import { KEYS, onKeyboardClose } from './keys';

import './style.scss'
import { VK_POSITION, VK_TRANSPARENCY } from '../emulator/prefs';

export class Keyboard extends Component {
  constructor() {
    super();

    this.keyboardDef = new KeyboardDefinition(KEYS, onKeyboardClose);

    this.state = {
      refresh: 0,
      initialShow: true,
      xpos: -1,
      // location: "keyboard-center",
      lastFocusRef: null,
      keysContext: {
        currentKeys: "default"
      }
    }

    this.defaultGamepadCallback = e => {
      this.focus();
      return true;
    }

    this.focusGrid.setUnhandledGamepadInputCallback((input) => {
      this.onUnhandledGamepadInput(input);
    });

    this.updateFocusGridComponents();
  }

  forceRefresh() {
    this.setState({refresh: this.state.refresh + 1});
  }

  updateFocusGridComponents() {
    const focusComps = [];
    const { keyboardDef } = this;
    const keys = keyboardDef.getKeys(this.state.keysContext)

    for (let r = 0; r < keys.length; r++) {
      const focusRow = [];
      focusComps.push(focusRow);
      const row = keys[r];
      for (let k = 0; k < row.length; k++) {
        const key = row[k];
        focusRow.push(key.getRef())
      }
    }
    this.focusGrid.setComponents(focusComps);
  }

  focusGrid = new FocusGrid();
  gamepadNotifier = new GamepadNotifier();
  screenContext = {
    gamepadNotifier: this.gamepadNotifier,
    focusGrid: this.focusGrid
  };

  focus() {
    const { keyboardDef } = this;
    const keys = keyboardDef.getKeys(this.state.keysContext)
    if (this.gamepadNotifier.padCount > 0) {
      let ref = this.state.lastFocusRef;
      if (!ref || !ref.current) {
        ref = keys[0][0].getRef()
      }
      if (ref && ref.current) {
        ref.current.focus();
      }
    }
  }

  onUnhandledGamepadInput(input) { }

  globalGamepadCallback = e => { }

  componentDidMount() {
    const { gamepadNotifier } = this;

    gamepadNotifier.start();
    gamepadNotifier.setDefaultCallback(this.defaultGamepadCallback);
    gamepadNotifier.addGlobalCallback(this.globalGamepadCallback);
    setTimeout(() => { this.focus() }, 50);
  }

  componentWillUnmount() {
    const { gamepadNotifier } = this;

    gamepadNotifier.stop();
    gamepadNotifier.setDefaultCallback(null);
    gamepadNotifier.removeGlobalCallback(this.globalGamepadCallback);
  }

  isCloseOnEnter() {
    return this.props.closeOnEnter;
  }

  render() {
    const { show, transparency } = this.props;
    const { initialShow, xpos } = this.state;
    const { emulator } = window;
    const { keyboardDef } = this;
    const keys = keyboardDef.getKeys(this.state.keysContext)

    if (!emulator || !show) {
      const onClose = keyboardDef.getOnClose();
      if (onClose) onClose(this, this.state.keysContext);

      if (!initialShow) {
        this.setState({ initialShow: true });
      }
      return <></>;
    }

    if (initialShow) {
      setTimeout(() => {
        this.focus();
      }, 50);
      this.setState({ initialShow: false });
    }

    const currKeys = keys;

    const getXValue = (x, r, nextr) => {
      let currentX = 0;
      if (xpos !== -1) {
        currentX = xpos;
      } else {
        for (let i = 0; i <= x; i++) {
          if (i > 0) {
            if (currKeys[r][i - 1].getWidth() === 2) {
              currentX += 1;
            }
          }
          currentX += 1;
        }
        this.setState({ xpos: currentX });
      }

      let targetX = 0;
      for (let i = 0; i < currKeys[nextr].length; i++) {
        // console.log(targetX + ", " + currentX)
        targetX += currKeys[nextr][i].getWidth();
        if (targetX >= currentX) {
          return i;
        }
      }
      return 0;
    }

    const moveFocus = (dir, r, x) => {
      const lastr = r;
      let row = currKeys[r];
      switch (dir) {
        case GamepadEnum.LEFT:
          x--;
          if (x < 0) {
            x = row.length - 1;
          }
          this.setState({ xpos: -1 });
          break;
        case GamepadEnum.RIGHT:
          x++;
          if (x >= row.length) {
            x = 0;
          }
          this.setState({ xpos: -1 });
          break;
        case GamepadEnum.UP:
          r--;
          if (r < 0) {
            r = currKeys.length - 1;
          }
          x = getXValue(x, lastr, r);
          break;
        case GamepadEnum.DOWN:
          r++;
          if (r >= currKeys.length) {
            r = 0;
          }
          x = getXValue(x, lastr, r);;
          break;
        default:
          break;
      }

      const ref = currKeys[r][x].getRef();
      if (ref && ref.current) {
        this.setState({lastFocusRef: ref});
        ref.current.focus();
      }
    }

    const onClick = (e, key) => {
      key.onClick(this, this.state.keysContext)
      try {
        const button = key.getRef().current.button;
        if (button) {
          button.style.animation = "wiggle .25s";
          setTimeout(() => {
            try {
              button.style.animation = undefined;
            } catch (e) {}
          }, 300);
        }
      } catch (e) {}
    }

    let kbAreaClass = "keyboard-keyarea";
    if (transparency === VK_TRANSPARENCY.LOW) {
      kbAreaClass += " keyarea-dark";
    }

    const prefs = emulator.getPrefs();
    const vkLocation = prefs.getVkPosition();
    const positionClass =
      vkLocation === VK_POSITION.MIDDLE ?
        "keyboard-center" : "keyboard-bottom";

    return (
      <WebrcadeContext.Provider value={this.screenContext}>
        <div className={"keyboard " + positionClass} id="keyboard">
          <div className={kbAreaClass}>
            {currKeys.map((row, r) => (
              <div className="keyboard-keyarea-row">
                {row.map((key, x) => (
                  <div>
                    {key.isEnabled(this, this.state.keysContext) &&
                      <div className='kb-dot' />
                    }
                    <ImageButton
                      ref={key.getRef()}
                      onPad={e => moveFocus(e.type, r, x)}
                      onPadClick={e => onClick(e, key)}
                      className={"kb-key" +
                        (key.getWidth() === 2 ? " kb-key2w" : "") +
                        (key.getImage() ? " kb-key-image" : "")
                      }
                      labelClassName="kb-key-label"
                      onTouchStart={e => {
                        onClick(e, key);
                        key.stopMouse = true;
                        // console.log('touch')
                      }}
                      onMouseDown={e => {
                        if (!key.stopMouse) {
                          onClick(e, key);
                          // console.log('mouse')
                        }
                        key.stopMouse = false;
                      }}
                      label={key.getImage() ? null : key.getLabel()}
                      imgSrc={key.getImage()}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </WebrcadeContext.Provider>
    );
  }
}
