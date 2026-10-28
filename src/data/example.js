// A 42-key split example (3x6 + 3 thumbs per side) so the editor can be tried without files.
import { initialState } from '../core/state.js';

function exampleLayout() {
  const keys = [];
  const key = (x, y, r = 0, rx = 0, ry = 0) => keys.push({ x, y, w: 1, h: 1, r, rx, ry });
  const stagger = [0.3, 0.3, 0.1, 0, 0.1, 0.2];
  for (let row = 0; row < 3; row++) {
    for (let c = 0; c < 6; c++) key(c, row + stagger[c]);
    for (let c = 0; c < 6; c++) key(8 + c, row + stagger[5 - c]);
  }
  key(3.5, 3.4);
  key(4.5, 3.4);
  key(5.6, 3.5, 15, 5.6, 3.5);
  key(7.4, 3.5, -15, 8.4, 3.5);
  key(8.5, 3.4);
  key(9.5, 3.4);
  return { name: 'Example 42-key split', keys };
}

const kp = (s) => s.split(' ').map((k) => (k.startsWith('&') ? k.replace(/\+/g, ' ') : `&kp ${k}`));

function exampleKeymap() {
  const base = [
    ...kp('TAB Q W E R T Y U I O P BSPC'),
    ...kp('&mt+LCTRL+ESC A S D F G H J K L SEMI SQT'),
    ...kp('LSHIFT Z X C V B N M COMMA DOT FSLH RET'),
    ...kp('LGUI &mo+1 SPACE &lt+2+RET &mo+2 RALT'),
  ];
  const lower = [
    ...kp('&trans N1 N2 N3 N4 N5 N6 N7 N8 N9 N0 &trans'),
    ...kp('&trans &none &none &none &none &none LEFT DOWN UP RIGHT &none &none'),
    ...kp('&trans &none &none &none &none &none HOME PG_DN PG_UP END &none &trans'),
    ...kp('&trans &trans &trans &trans &trans &trans'),
  ];
  const raise = [
    ...kp('&trans EXCL AT HASH DLLR PRCNT CARET AMPS STAR LPAR RPAR &trans'),
    ...kp('&trans &bt+BT_SEL+0 &bt+BT_SEL+1 &bt+BT_CLR &none &none MINUS EQUAL LBRC RBRC BSLH GRAVE'),
    ...kp('&trans &out+OUT_USB &out+OUT_BLE &none &none &none UNDER PLUS LBKT RBKT PIPE TILDE'),
    ...kp('&trans &trans &trans &trans &trans &trans'),
  ];
  return {
    layers: [
      { id: 'default_layer', name: 'Base', bindings: base, extra: [] },
      { id: 'lower_layer', name: 'Lower', bindings: lower, extra: [] },
      { id: 'raise_layer', name: 'Raise', bindings: raise, extra: [] },
    ],
    combos: [{ name: 'combo_esc', keyPositions: [1, 2], binding: '&kp ESC', timeout: 50, layers: [], extra: [] }],
    customBehaviors: [],
    rowHints: [12, 12, 12, 6],
    source: null,
  };
}

export function exampleState() {
  return { ...initialState(), layouts: [exampleLayout()], keymap: exampleKeymap() };
}
