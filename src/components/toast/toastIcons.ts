import {
  mdiAlertCircleOutline,
  mdiAlertOutline,
  mdiBellOutline,
  mdiCheckCircleOutline,
  mdiClose,
  mdiInformationOutline,
} from "@mdi/js";
import { defineComponent, h, markRaw, useAttrs, type Component } from "vue";

import type { BasiqToastTone } from "./types";

function createToastIcon(name: string, path: string): Component {
  return markRaw(
    defineComponent({
      name,
      inheritAttrs: false,
      setup() {
        const attrs = useAttrs();

        return () =>
          h(
            "svg",
            {
              ...attrs,
              fill: "currentColor",
              viewBox: "0 0 24 24",
              xmlns: "http://www.w3.org/2000/svg",
            },
            h("path", { d: path }),
          );
      },
    }),
  );
}

export const toastIcons: Readonly<Record<BasiqToastTone, Component>> = {
  neutral: createToastIcon("BasiqToastNeutralIcon", mdiBellOutline),
  info: createToastIcon("BasiqToastInfoIcon", mdiInformationOutline),
  success: createToastIcon("BasiqToastSuccessIcon", mdiCheckCircleOutline),
  warning: createToastIcon("BasiqToastWarningIcon", mdiAlertOutline),
  error: createToastIcon("BasiqToastErrorIcon", mdiAlertCircleOutline),
};

export const toastCloseIcon = createToastIcon("BasiqToastCloseIcon", mdiClose);
