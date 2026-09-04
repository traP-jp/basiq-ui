const overlayHostStateKey = Symbol.for("basiq-ui.overlay-host-state");

interface OverlayHostState {
  activeModals: number;
  layers: Map<OverlayLayer, OverlayLayerState>;
  modalListeners: Set<(active: boolean) => void>;
  nextOrder: number;
  owned: boolean;
  users: number;
}

interface OverlayLayerState {
  element: HTMLElement;
  users: number;
}

type OverlayHostElement = HTMLElement & {
  [overlayHostStateKey]?: OverlayHostState;
};

export const BASIQ_OVERLAY_HOST_ID = "basiq-overlay-host";
export type OverlayLayer = "dialog" | "toast";

function getOrCreateState(element: OverlayHostElement, owned = false): OverlayHostState {
  const state = element[overlayHostStateKey];
  if (state) {
    state.activeModals ??= 0;
    state.layers ??= new Map();
    state.modalListeners ??= new Set();
    return state;
  }

  const nextState: OverlayHostState = {
    activeModals: 0,
    layers: new Map(),
    modalListeners: new Set(),
    nextOrder: 0,
    owned,
    users: 0,
  };
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

export function acquireOverlayLayer(target: HTMLElement, layer: OverlayLayer) {
  const state = getOrCreateState(target as OverlayHostElement);
  let layerState = state.layers.get(layer);

  if (!layerState) {
    const element = target.ownerDocument.createElement("div");
    element.dataset.basiqOverlayLayer = layer;
    target.append(element);
    layerState = { element, users: 0 };
    state.layers.set(layer, layerState);
  }

  layerState.users += 1;
  return layerState.element;
}

export function releaseOverlayLayer(target: HTMLElement, layer: OverlayLayer) {
  const state = getOrCreateState(target as OverlayHostElement);
  const layerState = state.layers.get(layer);
  if (!layerState) return;

  layerState.users = Math.max(0, layerState.users - 1);
  if (layerState.users === 0) {
    layerState.element.remove();
    state.layers.delete(layer);
  }
}

export function setOverlayModalOpen(target: HTMLElement, open: boolean) {
  const state = getOrCreateState(target as OverlayHostElement);
  state.activeModals = Math.max(0, state.activeModals + (open ? 1 : -1));
  const active = state.activeModals > 0;
  for (const listener of state.modalListeners) listener(active);
}

export function subscribeOverlayModalState(
  target: HTMLElement,
  listener: (active: boolean) => void,
) {
  const state = getOrCreateState(target as OverlayHostElement);
  state.modalListeners.add(listener);
  listener(state.activeModals > 0);
  return () => state.modalListeners.delete(listener);
}
