// Editing operations on a single binding string.
import { parseBinding, formatBinding } from './bindings.js';
import { behaviorDef, OPTIONS } from '../data/behaviors.js';

export function defaultParam(type) {
  const t = type.replace(/\?$/, '');
  if (type.endsWith('?')) return '';
  if (t === 'keycode') return 'A';
  if (t === 'mod') return 'LSHIFT';
  if (t === 'layer') return '0';
  if (t === 'number') return '0';
  return OPTIONS[t]?.[0] ?? '';
}

// Change the behavior, keeping the old keycode / layer where the new behavior has a slot for it.
export function switchBehavior(binding, behavior, customBehaviors = []) {
  const old = parseBinding(binding);
  const oldDef = behaviorDef(old.behavior, customBehaviors);
  const def = behaviorDef(behavior, customBehaviors);
  if (!def) return formatBinding(behavior, old.params);
  const carry = {};
  oldDef?.params.forEach((type, i) => {
    if (old.params[i] !== undefined) carry[type] = old.params[i];
  });
  const params = def.params.map((type) => carry[type] ?? defaultParam(type));
  return formatBinding(behavior, params);
}

// Put a keycode into the last keycode slot of the binding, or replace it with &kp CODE.
export function applyKeycode(binding, code, customBehaviors = []) {
  const { behavior, params } = parseBinding(binding);
  const def = behaviorDef(behavior, customBehaviors);
  const slot = def ? def.params.lastIndexOf('keycode') : -1;
  if (slot < 0) return `&kp ${code}`;
  const next = def.params.map((type, i) => params[i] ?? defaultParam(type));
  next[slot] = code;
  return formatBinding(behavior, next);
}

export function setParam(binding, index, value) {
  const { behavior, params } = parseBinding(binding);
  const next = [...params];
  while (next.length < index) next.push('');
  next[index] = value;
  return formatBinding(behavior, next);
}
