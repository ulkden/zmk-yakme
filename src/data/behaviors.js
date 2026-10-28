// Built-in ZMK behaviors the editor knows how to edit. Param types:
//   keycode, mod, layer, number, or the name of an OPTIONS list. A trailing '?' marks optional.

export const BEHAVIORS = [
  { name: 'kp', label: 'Key press', params: ['keycode'] },
  { name: 'mt', label: 'Mod-tap', params: ['mod', 'keycode'] },
  { name: 'lt', label: 'Layer-tap', params: ['layer', 'keycode'] },
  { name: 'mo', label: 'Momentary layer', params: ['layer'] },
  { name: 'to', label: 'To layer', params: ['layer'] },
  { name: 'tog', label: 'Toggle layer', params: ['layer'] },
  { name: 'sl', label: 'Sticky layer', params: ['layer'] },
  { name: 'sk', label: 'Sticky key', params: ['keycode'] },
  { name: 'kt', label: 'Key toggle', params: ['keycode'] },
  { name: 'trans', label: 'Transparent', params: [] },
  { name: 'none', label: 'None', params: [] },
  { name: 'caps_word', label: 'Caps word', params: [] },
  { name: 'key_repeat', label: 'Key repeat', params: [] },
  { name: 'gresc', label: 'Grave escape', params: [] },
  { name: 'bt', label: 'Bluetooth', params: ['bt', 'number?'] },
  { name: 'out', label: 'Output select', params: ['out'] },
  { name: 'rgb_ug', label: 'RGB underglow', params: ['rgb'] },
  { name: 'ext_power', label: 'External power', params: ['ext_power'] },
  { name: 'mkp', label: 'Mouse button', params: ['mouse'] },
  { name: 'mmv', label: 'Mouse move', params: ['mmv'] },
  { name: 'msc', label: 'Mouse scroll', params: ['msc'] },
  { name: 'bootloader', label: 'Bootloader', params: [] },
  { name: 'sys_reset', label: 'System reset', params: [] },
  { name: 'soft_off', label: 'Soft off', params: [] },
  { name: 'studio_unlock', label: 'Studio unlock', params: [] },
];

export const OPTIONS = {
  bt: ['BT_CLR', 'BT_SEL', 'BT_CLR_ALL', 'BT_NXT', 'BT_PRV', 'BT_DISC'],
  out: ['OUT_USB', 'OUT_BLE', 'OUT_TOG'],
  rgb: [
    'RGB_TOG',
    'RGB_ON',
    'RGB_OFF',
    'RGB_HUI',
    'RGB_HUD',
    'RGB_SAI',
    'RGB_SAD',
    'RGB_BRI',
    'RGB_BRD',
    'RGB_SPI',
    'RGB_SPD',
    'RGB_EFF',
    'RGB_EFR',
  ],
  ext_power: ['EP_ON', 'EP_OFF', 'EP_TOG'],
  mouse: ['LCLK', 'RCLK', 'MCLK', 'MB4', 'MB5'],
  mmv: ['MOVE_UP', 'MOVE_DOWN', 'MOVE_LEFT', 'MOVE_RIGHT'],
  msc: ['SCRL_UP', 'SCRL_DOWN', 'SCRL_LEFT', 'SCRL_RIGHT'],
};

const BY_NAME = Object.fromEntries(BEHAVIORS.map((b) => [b.name, b]));

// Look up a behavior definition, including the keymap's custom behaviors (raw params).
export function behaviorDef(name, customBehaviors = []) {
  if (BY_NAME[name]) return BY_NAME[name];
  const custom = customBehaviors.find((b) => b.label === name);
  if (custom)
    return { name, label: `${name} (custom)`, params: custom.params ?? Array(custom.cells).fill('raw'), custom: true };
  return null;
}
