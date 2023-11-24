import React from 'react';

import './style.scss'

export class KeyboardDefinition {
  constructor(keys, onClose) {
    this.keys = keys;
    this.onClose = onClose;
  }

  getKeys(context) {
    return this.keys[context.currentKeys]
  }

  getOnClose() {
    return this.onClose;
  }
}

export class KeyDef {
  constructor(label) {
    this.label = label;
    this.width = 1;
    this.ref = React.createRef();
    this.onclick = null;
    this.isenabledcb = null;
    this.image = null;
    this.c = null;
  }

  code(c) {
    this.c = c;
    return this;
  }

  setImage(image) {
    this.image = image;
    return this;
  }

  getImage() {
    return this.image;
  }

  getLabel() {
    return this.label;
  }

  setWidth(w) {
    this.width = w;
    return this;
  }

  getWidth() {
    return this.width;
  }

  onClick(keyboard, context) {
    if (this.onclick) this.onclick(keyboard, context, this);
  }

  setOnClick(f) {
    this.onclick = f;
    return this;
  }

  getRef() {
    return this.ref;
  }

  isEnabled(cb, ctx) {
    if (this.isenabledcb) {
      return this.isenabledcb(cb, ctx);
    }
    return false;
  }

  setIsEnabledCb(f) {
    this.isenabledcb = f;
    return this;
  }
}

