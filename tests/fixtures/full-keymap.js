export const FULL_KEYMAP = `/*
 * Copyright (c) 2020 The ZMK Contributors
 */
#include <behaviors.dtsi>
#include <dt-bindings/zmk/keys.h>
#include <dt-bindings/zmk/bt.h>

#define BASE 0
#define LOWER 1

/ {
    behaviors {
        hm: homerow_mods {
            compatible = "zmk,behavior-hold-tap";
            #binding-cells = <2>;
            tapping-term-ms = <200>;
            bindings = <&kp>, <&kp>;
        };
    };

    macros {
        hello: hello {
            compatible = "zmk,behavior-macro";
            #binding-cells = <0>;
            bindings = <&kp H &kp I>;
        };
    };

    combos {
        compatible = "zmk,combos";
        combo_esc {
            timeout-ms = <50>;
            key-positions = <0 1>;
            bindings = <&kp ESC>;
        };
        combo_tab {
            key-positions = <2 3>;
            bindings = <&kp TAB>;
            layers = <0 1>;
            require-prior-idle-ms = <150>;
        };
    };

    keymap {
        compatible = "zmk,keymap";

        default_layer {
            display-name = "Base";
            bindings = <
                &kp Q &hm LSHIFT A
                &mo 1 &kp LC(LS(Z))
            >;
        };

        lower_layer {
            label = "Lower";
            bindings = <
                &bt BT_SEL 0 &trans
                &trans &hello
            >;
            sensor-bindings = <&inc_dec_kp C_VOL_UP C_VOL_DN>;
        };
    };
};
`;
