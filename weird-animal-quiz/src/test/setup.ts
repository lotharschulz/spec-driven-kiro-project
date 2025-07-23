import '@testing-library/jest-dom';

// Mock Framer Motion for test environment to avoid DOM errors
import { vi } from 'vitest';
import * as React from 'react';
function passthrough<T extends React.ElementType>(tag: T) {
  type Props = React.ComponentPropsWithoutRef<T> & React.PropsWithChildren<object>;
  return React.forwardRef<unknown, Props>(function Comp(props, ref) {
    return React.createElement(tag, { ...props, ref }, props.children);
  });
}
const AnimatePresence = function (props: { children?: React.ReactNode }) { return React.createElement(React.Fragment, null, props.children); };
const motion = {
  button: passthrough('button'),
  svg: passthrough('svg'),
  span: passthrough('span'),
};
const defaultExport = Object.assign({}, motion, { AnimatePresence });
vi.mock('framer-motion', () => {
  return {
    __esModule: true,
    motion,
    AnimatePresence,
    default: defaultExport,
    // Do not spread ...defaultExport here to avoid duplicate AnimatePresence
    ...motion
  };
});



// Mock window.matchMedia for test environment
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = function (query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function () {}, // deprecated
      removeListener: function () {}, // deprecated
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () { return false; }
    };
  };
}

// Add global jest mock for compatibility with tests using jest.spyOn
declare global {
  var jest: typeof vi | undefined;
}
if (typeof globalThis.jest === 'undefined') {
  globalThis.jest = vi;
}
