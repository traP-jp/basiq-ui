import { onBeforeUnmount, ref } from "vue";

export function useNavigationLayoutMotion() {
  const moving = ref(false);
  const suppressHover = ref(false);

  function releaseHoverSuppression() {
    suppressHover.value = false;
    removeReleaseListeners();
  }

  function removeReleaseListeners() {
    if (typeof window === "undefined") return;
    window.removeEventListener("pointermove", releaseHoverSuppression);
    window.removeEventListener("pointerdown", releaseHoverSuppression);
    window.removeEventListener("blur", releaseHoverSuppression);
  }

  function waitForPointerMovement() {
    if (typeof window === "undefined") {
      suppressHover.value = false;
      return;
    }
    if (!window.matchMedia("(hover: hover)").matches) {
      suppressHover.value = false;
      return;
    }

    window.addEventListener("pointermove", releaseHoverSuppression, {
      once: true,
      passive: true,
    });
    window.addEventListener("pointerdown", releaseHoverSuppression, {
      once: true,
      passive: true,
    });
    window.addEventListener("blur", releaseHoverSuppression, { once: true });
  }

  function suppressUntilPointerMovement() {
    removeReleaseListeners();
    suppressHover.value = true;
    waitForPointerMovement();
  }

  function start() {
    removeReleaseListeners();
    moving.value = true;
    suppressHover.value = true;
  }

  function finish() {
    if (!moving.value) return;
    moving.value = false;

    waitForPointerMovement();
  }

  onBeforeUnmount(removeReleaseListeners);

  return { finish, moving, start, suppressHover, suppressUntilPointerMovement };
}
