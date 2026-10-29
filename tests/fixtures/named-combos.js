// Combos written the Miryoku way: key positions and layers are #define names, and several
// combos share keys but differ by layer (pattern from megamind4089/zmk-config a_dux.keymap).
export const NAMED_COMBOS_KEYMAP = `#include <behaviors.dtsi>
#include <dt-bindings/zmk/keys.h>

#define BASE 0
#define NUM 1
#define COMBO_TPSL 2 3

/ {
    combos {
        compatible = "zmk,combos";
        combo_tpsl_BASE {
            timeout-ms = <200>;
            key-positions = <COMBO_TPSL>;
            bindings = <&kp ESC>;
            layers = <BASE>;
        };
        combo_tpsl_NUM {
            timeout-ms = <200>;
            key-positions = <COMBO_TPSL>;
            bindings = <&kp DOT>;
            layers = <NUM 1>;
        };
    };

    keymap {
        compatible = "zmk,keymap";
        base_layer {
            bindings = <&kp A &kp B &kp C &kp D>;
        };
        num_layer {
            bindings = <&kp N1 &kp N2 &kp N3 &kp N4>;
        };
    };
};
`;
