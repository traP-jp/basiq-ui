import { getCurrentInstance } from "vue";

export function hasInitialProp(name: string) {
  const vnodeProps = getCurrentInstance()?.vnode.props ?? {};
  const kebabName = name.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);

  return (
    Object.prototype.hasOwnProperty.call(vnodeProps, name) ||
    Object.prototype.hasOwnProperty.call(vnodeProps, kebabName)
  );
}
