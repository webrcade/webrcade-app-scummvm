import React from 'react';

import { ControlsTab } from '@webrcade/app-common';

export class GamepadControlsTab extends ControlsTab {
  render() {
    return (
      <>
        {this.renderControl('start', 'Reset')}
        {this.renderControl('select', 'Select')}
        {this.renderControl('dpad', 'Move')}
        {this.renderControl('lanalog', 'Move')}
        {this.renderControl('a', 'Fire')}
      </>
    );
  }
}

export class KeyboardControlsTab extends ControlsTab {
  render() {
    return (
      <>
        {this.renderKey('Enter', 'Reset')}
        {this.renderKey('ShiftRight', 'Select')}
        {this.renderKey('ArrowUp', 'Up')}
        {this.renderKey('ArrowDown', 'Down')}
        {this.renderKey('ArrowLeft', 'Left')}
        {this.renderKey('ArrowRight', 'Right')}
        {this.renderKey('KeyZ', 'Fire')}
      </>
    );
  }
}
