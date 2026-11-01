// A hold-tap used by keys, by a tap-dance (kept verbatim), by an override, a #define and a comment
// (pattern from jporter-dev/zmk-config corne.keymap, where a tap-dance uses a home-row mod).
export const VERBATIM_REFS_KEYMAP = `#include <behaviors.dtsi>
#include <dt-bindings/zmk/keys.h>
#define HM_J &hmr RSHIFT J
&hmr { quick-tap-ms = <100>; };
/ {
    behaviors {
        hmr: homerow_mods_right {
            compatible = "zmk,behavior-hold-tap";
            #binding-cells = <2>;
            bindings = <&kp>, <&kp>;
        };
        td0: tap_dance_0 {
            compatible = "zmk,behavior-tap-dance";
            #binding-cells = <0>;
            bindings = <&hmr RGUI LS(SEMI)>, <&kp SQT>; // &hmr in a comment
        };
    };
    keymap {
        compatible = "zmk,keymap";
        base {
            bindings = <&hmr RCTRL K &td0>;
            sensor-bindings = <&hmr A B>;
        };
    };
};
`;
