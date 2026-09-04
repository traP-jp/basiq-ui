const overlayHostStateKey = Symbol.for("basiq-ui.overlay-host-state");

interface OverlayHostState {
  nextOrder: number;
  owned: boolean;
  users: number;
}

type OverlayHostElement = HTMLElement & {
  [overlayHostStateKey]?: OverlayHostState;
};

export const BASIQ_OVERLAY_HOST_ID = "basiq-overlay-host";

function getOrCreateState(element: OverlayHostElement, owned = false): OverlayHostState {
  const state = element[overlayHostStateKey];
  if (state) return state;

  const nextState: OverlayHostState = { nextOrder: 0, owned, users: 0 };
  element[overlayHostStateKey] = nextState;
  return nextState;
}

export function acquireDefaultOverlayHost(document: Document) {
  let host = document.getElementById(BASIQ_OVERLAY_HOST_ID) as OverlayHostElement | null;
  let owned = false;

  if (!host) {
    host = document.createElement("div") as OverlayHostElement;
    host.id = BASIQ_OVERLAY_HOST_ID;
    document.body.append(host);
    owned = true;
  }

  host.dataset.basiqOverlayHost = "";
  const state = getOrCreateState(host, owned);
  state.users += 1;
  return host;
}

export function releaseDefaultOverlayHost(host: HTMLElement) {
  const overlayHost = host as OverlayHostElement;
  const state = getOrCreateState(overlayHost);
  state.users = Math.max(0, state.users - 1);

  if (state.owned && state.users === 0 && host.childNodes.length === 0) host.remove();
}

export function acquireOverlayOrder(target: HTMLElement) {
  const state = getOrCreateState(target as OverlayHostElement);
  state.nextOrder += 1;
  return state.nextOrder;
}
