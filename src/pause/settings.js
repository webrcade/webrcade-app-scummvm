import React, { Fragment } from 'react';
import { Component } from 'react';
import {
    EditorScreen,
    FieldsTab,
    FieldRow,
    FieldLabel,
    FieldControl,
    TelevisionWhiteImage,
    KeyboardWhiteImage,
    ScreenSizeSelect,
    ScreenControlsSelect,
    Switch,
    WebrcadeContext,
} from '@webrcade/app-common';
import { VkTransparencySelect } from './vktransparencyselect';

export class ScummSettingsEditor extends Component {
    constructor() {
        super();
        this.state = {
            tabIndex: null,
            focusGridComps: null,
            values: {},
        };
    }

    componentDidMount() {
        const { emulator } = this.props;

        this.setState({
            values: {
                origBilinearMode: emulator.getPrefs().isBilinearEnabled(),
                bilinearMode: emulator.getPrefs().isBilinearEnabled(),
                origScreenSize: emulator.getPrefs().getScreenSize(),
                screenSize: emulator.getPrefs().getScreenSize(),
                origScreenControls: emulator.getPrefs().getScreenControls(),
                screenControls: emulator.getPrefs().getScreenControls(),
                origVkTransparency: emulator.getPrefs().getVkTransparency(),
                vkTransparency: emulator.getPrefs().getVkTransparency(),
                origCursor: emulator.getPrefs().getSystemCursor(),
                cursor: emulator.getPrefs().getSystemCursor(),
                origVkCloseOnEnter: emulator.getPrefs().getVkCloseOnEnter(),
                vkCloseOnEnter: emulator.getPrefs().getVkCloseOnEnter(),
            },
        });
    }

    render() {
        const { emulator, onClose, hideBilinear, showOnScreenControls } = this.props;
        const { tabIndex, values, focusGridComps } = this.state;

        const setFocusGridComps = (comps) => {
            this.setState({ focusGridComps: comps });
        };

        const setValues = (values) => {
            this.setState({ values: values });
        };

        return (
            <EditorScreen
                showCancel={true}
                onOk={() => {
                    let change = false;
                    if (!hideBilinear && values.origBilinearMode !== values.bilinearMode) {
                        emulator.getPrefs().setBilinearEnabled(values.bilinearMode);
                        emulator.updateBilinearFilter();
                        change = true;
                    }
                    if (values.origScreenSize !== values.screenSize) {
                        emulator.getPrefs().setScreenSize(values.screenSize);
                        emulator.updateScreenSize();
                        change = true;
                    }
                    if (values.origScreenControls !== values.screenControls) {
                        emulator.getPrefs().setScreenControls(values.screenControls);
                        emulator.updateOnScreenControls();
                        change = true;
                    }
                    if (values.origVkTransparency !== values.vkTransparency) {
                        emulator.getPrefs().setVkTransparency(values.vkTransparency);
                        emulator.updateVkTransparency();
                        change = true;
                    }
                    if (values.origCursor !== values.cursor) {
                        emulator.getPrefs().setSystemCursor(values.cursor);
                        emulator.updateCanvasCursor();
                        change = true;
                    }
                    if (values.origVkCloseOnEnter !== values.vkCloseOnEnter) {
                        emulator.getPrefs().setVkCloseOnEnter(values.vkCloseOnEnter);
                        emulator.updateVkCloseOnEnter();
                        change = true;
                    }
                    if (change) {
                        emulator.getPrefs().save();
                    }
                    onClose();
                }}
                onClose={onClose}
                focusGridComps={focusGridComps}
                onTabChange={(oldTab, newTab) => this.setState({ tabIndex: newTab })}
                tabs={[
                    {
                        image: TelevisionWhiteImage,
                        label: 'Display Settings',
                        content: (
                            <ScummDisplaySettingsTab
                                emulator={emulator}
                                hideBilinear={hideBilinear}
                                showOnScreenControls={showOnScreenControls}
                                isActive={tabIndex === 0}
                                setFocusGridComps={setFocusGridComps}
                                values={values}
                                setValues={setValues}
                            />
                        ),
                    },
                    {
                        image: KeyboardWhiteImage,
                        label: 'Virtual Keyboard Settings',
                        content: (
                            <ScummVirtualKeyboardTab
                                emulator={emulator}
                                isActive={tabIndex === 1}
                                setFocusGridComps={setFocusGridComps}
                                values={values}
                                setValues={setValues}
                            />
                        ),
                    },
                ]}
            />
        );
    }
}

export class ScummDisplaySettingsTab extends FieldsTab {
    constructor() {
        super();
        this.bilinearRef = React.createRef();
        this.screenSizeRef = React.createRef();
        this.screenControlsRef = React.createRef();
        this.systemCursorRef = React.createRef();
        this.vkTransparencyRef = React.createRef();
        this.vkCloseOnEnterRef = React.createRef();
        this.gridComps = [
            [this.screenSizeRef],
            [this.bilinearRef],
            [this.screenControlsRef],
            [this.vkTransparencyRef],
            [this.vkCloseOnEnterRef],
            [this.systemCursorRef]
        ];
    }

    componentDidUpdate(prevProps, prevState) {
        const { gridComps } = this;
        const { setFocusGridComps } = this.props;
        const { isActive } = this.props;

        if (isActive && isActive !== prevProps.isActive) {
            setFocusGridComps(gridComps);
        }
    }

    render() {
        const { bilinearRef, screenSizeRef, screenControlsRef, systemCursorRef } = this;
        const { focusGrid } = this.context;
        const { setValues, values, hideBilinear, showOnScreenControls } = this.props;

        return (
            <Fragment>
                <FieldRow>
                    <FieldLabel>Screen size</FieldLabel>
                    <FieldControl>
                        <ScreenSizeSelect
                            selectRef={screenSizeRef}
                            addDefault={true}
                            onChange={(value) => {
                                setValues({ ...values, ...{ screenSize: value } });
                            }}
                            value={values.screenSize}
                            onPad={e => focusGrid.moveFocus(e.type, screenSizeRef)}
                        />
                    </FieldControl>
                </FieldRow>
                {!hideBilinear && (
                    <FieldRow>
                        <FieldLabel>Force bilinear filter</FieldLabel>
                        <FieldControl>
                            <Switch
                                ref={bilinearRef}
                                onPad={(e) => focusGrid.moveFocus(e.type, bilinearRef)}
                                onChange={(e) => {
                                    setValues({ ...values, ...{ bilinearMode: e.target.checked } });
                                }}
                                checked={values.bilinearMode}
                            />
                        </FieldControl>
                    </FieldRow>
                )}
                {showOnScreenControls && (
                    <FieldRow>
                        <FieldLabel>On-screen controls</FieldLabel>
                        <FieldControl>
                            <ScreenControlsSelect
                                selectRef={screenControlsRef}
                                addDefault={true}
                                onChange={(value) => {
                                    setValues({ ...values, ...{ screenControls: value } });
                                }}
                                value={values.screenControls}
                                onPad={e => focusGrid.moveFocus(e.type, screenControlsRef)}
                            />
                        </FieldControl>
                    </FieldRow>
                )}
                <FieldRow>
                    <FieldLabel>Show system pointer</FieldLabel>
                    <FieldControl>
                        <Switch
                            ref={systemCursorRef}
                            onPad={(e) => focusGrid.moveFocus(e.type, systemCursorRef)}
                            onChange={(e) => {
                                setValues({ ...values, ...{ cursor: e.target.checked } });
                            }}
                            checked={values.cursor}
                        />
                    </FieldControl>
                </FieldRow>
            </Fragment>
        );
    }
}
ScummDisplaySettingsTab.contextType = WebrcadeContext;

export class ScummVirtualKeyboardTab extends FieldsTab {
    constructor() {
        super();
        this.vkTransparencyRef = React.createRef();
        this.vkCloseOnEnterRef = React.createRef();
        this.gridComps = [
            [this.vkTransparencyRef],
            [this.vkCloseOnEnterRef],
        ];
    }

    componentDidUpdate(prevProps, prevState) {
        const { gridComps } = this;
        const { setFocusGridComps } = this.props;
        const { isActive } = this.props;

        if (isActive && isActive !== prevProps.isActive) {
            setFocusGridComps(gridComps);
        }
    }

    render() {
        const { vkTransparencyRef, vkCloseOnEnterRef } = this;
        const { focusGrid } = this.context;
        const { setValues, values } = this.props;

        return (
            <Fragment>
                <FieldRow>
                    <FieldLabel>Transparency</FieldLabel>
                    <FieldControl>
                        <VkTransparencySelect
                            selectRef={vkTransparencyRef}
                            // addDefault={true}
                            onChange={(value) => {
                                setValues({ ...values, ...{ vkTransparency: value } });
                            }}
                            value={values.vkTransparency}
                            onPad={e => focusGrid.moveFocus(e.type, vkTransparencyRef)}
                        />
                    </FieldControl>
                </FieldRow>
                <FieldRow>
                    <FieldLabel>Close on enter</FieldLabel>
                    <FieldControl>
                        <Switch
                            ref={vkCloseOnEnterRef}
                            onPad={(e) => focusGrid.moveFocus(e.type, vkCloseOnEnterRef)}
                            onChange={(e) => {
                                setValues({ ...values, ...{ vkCloseOnEnter: e.target.checked } });
                            }}
                            checked={values.vkCloseOnEnter}
                        />
                    </FieldControl>
                </FieldRow>
            </Fragment>
        );
    }
}
ScummVirtualKeyboardTab.contextType = WebrcadeContext;
