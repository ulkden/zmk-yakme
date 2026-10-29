// Bindings written as #define names, the way Miryoku configs do (pattern from
// megamind4089/zmk-config a_dux.keymap): `U_NA` is a whole binding, not a parameter.
export const DEFINE_BINDINGS_KEYMAP = `#include <behaviors.dtsi>
#include <dt-bindings/zmk/keys.h>
#include <dt-bindings/zmk/bt.h>

#define U_NA &none
#define U_RDO &kp LC(Y)

/ {
    behaviors {
        hm: homerow_mods {
            compatible = "zmk,behavior-hold-tap";
            #binding-cells = <2>;
            tapping-term-ms = <200>;
            bindings = <&kp>, <&kp>;
        };
    };

    combos {
        compatible = "zmk,combos";
        combo_redo {
            key-positions = <0 1>;
            bindings = <U_RDO>;
        };
    };

    keymap {
        compatible = "zmk,keymap";
        base_layer {
            bindings = <
                &bootloader U_NA  U_NA       U_RDO
                &hm LGUI A  U_NA  &bt BT_SEL 0  &bt BT_CLR
            >;
        };
    };
};
`;
