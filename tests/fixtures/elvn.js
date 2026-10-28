// Copied from the user's zmk-config-elvn shield (small, real-world fixtures).
export const ELVN_LAYOUT = `// See https://zmk.dev/docs/development/hardware-integration/physical-layouts
#include <physical_layouts.dtsi>

/ {
    default_layout: default_layout {
        compatible = "zmk,physical-layout";
        display-name = "Default Layout";
        transform = <&default_transform>;
        kscan = <&kscan>;

        keys  //                     w   h    x    y     rot    rx    ry
            = <&key_physical_attrs 100 100    0    0       0     0     0>
            , <&key_physical_attrs 100 100  100    0       0     0     0>
            , <&key_physical_attrs 100 100    0  100       0     0     0>
            , <&key_physical_attrs 100 100  100  100       0     0     0>
            ;
    };
};
`;

export const ELVN_KEYMAP = `// This file was generated from a template.
#include <behaviors.dtsi>
#include <dt-bindings/zmk/keys.h>

/ {
    // Define a default keymap here.
    keymap {
        compatible = "zmk,keymap";

        default_layer {
            bindings = <
                &kp A &kp B
                &kp C &kp D &kp E
                &kp F &kp G &kp H
                &kp I &kp J &kp K
            >;
        };
    };
};
`;
