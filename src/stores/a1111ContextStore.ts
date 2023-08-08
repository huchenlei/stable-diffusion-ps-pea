import { defineStore } from 'pinia';
import { A1111Context } from '../Automatic1111';
import { ControlNetContext } from '@/ControlNet';
import { TaggerContext } from '@/Tagger';

export const useA1111ContextStore = defineStore('a1111Context', {
  state: () => ({
    a1111Context: new A1111Context(),
    controlnetContext: new ControlNetContext(),
    taggerContext: new TaggerContext(),
  }),
});