import React from 'react';

import { ControlsTab } from '@webrcade/app-common';

export class GamepadControlsTab extends ControlsTab {
  render() {
    return (
      <>
        {this.renderControl('lanalog', 'Mouse')}
        {this.renderControl('rbump', 'Slow Mouse')}
        {this.renderControl('dpad', 'Cursor Keys')}
        {this.renderControl('a', 'Left Mouse Button')}
        {this.renderControl('b', 'Right Mouse Button')}
        {this.renderControl('x', 'Period Key')}
        {this.renderControl('y', 'Escape Key')}
        {this.renderControl('lbump', 'Game-specific Menu (if applicable)')}
        {this.renderControl('start', 'Pause Screen')}
        {this.renderControl('select', 'Keyboard')}
      </>
    );
  }
}

export class KeyboardControlsTab extends ControlsTab {
  render() {
    return (
      <>
        {this.renderKeys(['ControlLeft', 'KeyF5'], 'Pause Screen')}
        {this.renderKeys(['ControlLeft', 'KeyF7'], 'Keyboard')}
        {this.renderKey('Space', 'Pause (if applicable)')}
        {this.renderKey('Escape', 'Skip')}
        {this.renderKey('KeyPeriod', 'Skip Line')}
        {this.renderKey('Enter', 'Confirm')}
      </>
    );
  }
}
