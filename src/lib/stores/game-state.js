import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const useGameState = create(
  immer((set) => ({
    text: null,
    input: null,

    // eslint-disable-next-line no-param-reassign
    setText: (text) => set((state) => { state.text = text; }),

    // eslint-disable-next-line no-param-reassign
    setInput: (input) => set((state) => { state.input = input; }),
  }))
);

export default useGameState;
