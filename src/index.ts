/* eslint-disable id-length */
import { useEventListener } from '@react-hookz/web';
import { useCallback, useEffect, useState } from 'react';
import isEqual from 'lodash.isequal';

export type GamepadState = {
  a: boolean;
  b: boolean;
  x: boolean;
  y: boolean;
  l1: boolean;
  l2: number;
  l3: boolean;
  r1: boolean;
  r2: number;
  r3: boolean;
  share: boolean;
  options: boolean;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  back: boolean;
  leftStick: GamepadJoystick;
  rightStick: GamepadJoystick;
};

type GamepadJoystick = {
  x: number;
  y: number;
};

type UseGamepadEventsProps = {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReady?: (gamepad: Gamepad) => void;
  onLoop?: () => void;
};

const defaultState: GamepadState = {
  a: false,
  b: false,
  x: false,
  y: false,
  l1: false,
  l2: 0,
  l3: false,
  r1: false,
  r2: 0,
  r3: false,
  share: false,
  options: false,
  up: false,
  down: false,
  left: false,
  right: false,
  back: false,
  leftStick: { x: 0, y: 0 },
  rightStick: { x: 0, y: 0 },
};

const useGamepadEvents = (
  props?: UseGamepadEventsProps
): {
  on: <T extends keyof GamepadState>(
    button: T,
    callback: (value: GamepadState[T]) => void
  ) => void;
} => {
  const [gamepad, setGamepad] = useState<number | null>(null);
  const [gamepadState, setGamepadState] = useState<GamepadState>(defaultState);
  const [lastGamepadState, setlastGamepadState] =
    useState<GamepadState>(defaultState);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const { onReady, onLoop, onConnect, onDisconnect } = props ?? {};

  const gameloop = useCallback(
    (oldState: GamepadState) => {
      onLoop?.();

      if (typeof gamepad !== 'number') {
        window.requestAnimationFrame(() => gameloop(oldState));
        return;
      }

      const activeGamepad = navigator.getGamepads()[gamepad];

      if (!activeGamepad) {
        window.requestAnimationFrame(() => gameloop(oldState));
        return;
      }

      const newState: GamepadState = {
        a: activeGamepad.buttons[0].pressed,
        b: activeGamepad.buttons[1].pressed,
        x: activeGamepad.buttons[2].pressed,
        y: activeGamepad.buttons[3].pressed,
        l1: activeGamepad.buttons[4].pressed,
        l2: Number(activeGamepad.buttons[6].value.toFixed(4)),
        l3: activeGamepad.buttons[10].pressed,
        r1: activeGamepad.buttons[5].pressed,
        r2: Number(activeGamepad.buttons[7].value.toFixed(4)),
        r3: activeGamepad.buttons[11].pressed,
        share: activeGamepad.buttons[8].pressed,
        options: activeGamepad.buttons[9].pressed,
        up: activeGamepad.buttons[12].pressed,
        down: activeGamepad.buttons[13].pressed,
        left: activeGamepad.buttons[14].pressed,
        right: activeGamepad.buttons[15].pressed,
        back: activeGamepad.buttons[16].pressed,
        leftStick: {
          x:
            activeGamepad.axes[0] < -0.08 || activeGamepad.axes[0] > 0.08
              ? Number(activeGamepad.axes[0].toFixed(4))
              : 0,
          y:
            activeGamepad.axes[1] < -0.08 || activeGamepad.axes[1] > 0.08
              ? Number(activeGamepad.axes[1].toFixed(4))
              : 0,
        },
        rightStick: {
          x:
            activeGamepad.axes[2] < -0.08 || activeGamepad.axes[2] > 0.08
              ? Number(activeGamepad.axes[2].toFixed(4))
              : 0,
          y:
            activeGamepad.axes[3] < -0.08 || activeGamepad.axes[3] > 0.08
              ? Number(activeGamepad.axes[3].toFixed(4))
              : 0,
        },
      };

      if (JSON.stringify(newState) !== JSON.stringify(oldState)) {
        setlastGamepadState(oldState);
        setGamepadState(newState);
      }

      const next = () => gameloop(newState);
      window.requestAnimationFrame(next);
    },
    [gamepad, onLoop]
  );

  useEffect(() => {
    if (typeof gamepad !== 'number' || ready) {
      return;
    }

    const newGamepad = navigator.getGamepads()[gamepad];

    if (!newGamepad) {
      return;
    }

    onReady?.(newGamepad);
    setReady(true);
  }, [gamepad, onReady, ready, setReady]);

  useEventListener(
    typeof window === 'undefined' ? null : window,
    'gamepadconnected',
    () => {
      const newGamepads = navigator.getGamepads();
      const activeGamePad = newGamepads.findIndex((gp) => Boolean(gp));

      setGamepad(activeGamePad);
      onConnect?.();
    },
    { passive: true }
  );

  useEventListener(
    typeof window === 'undefined' ? null : window,
    'gamepaddisconnected',
    () => {
      setGamepad(null);
      onDisconnect?.();
    },
    { passive: true }
  );

  useEffect(() => {
    if (typeof gamepad === 'number') {
      return;
    }

    const newGamepads = navigator.getGamepads();
    const activeGamePad = newGamepads.findIndex((gp) => Boolean(gp));

    if (activeGamePad === -1) {
      return;
    }

    setGamepad(activeGamePad);
  }, [gamepad]);

  useEffect(() => {
    if (typeof gamepad !== 'number' || running) {
      return;
    }

    gameloop(gamepadState);
    setRunning(true);
  }, [gameloop, gamepad, gamepadState, running]);

  const on = <T extends keyof GamepadState>(
    button: T,
    callback: (value: GamepadState[T]) => void
  ) => {
    if (isEqual(gamepadState[button], lastGamepadState[button])) return;
    callback(gamepadState[button]);
  };

  return { on };
};

export default useGamepadEvents;
