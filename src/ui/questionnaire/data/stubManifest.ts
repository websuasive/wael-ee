// THROWAWAY stub manifest for proving the questionnaire machinery.
// NOT the real manifest; just enough to exercise the structural cases.

import type { Manifest } from '../types';

export const stubManifest: Manifest = {
  pages: [
    {
      id: 'page-1',
      questions: [
        {
          id: 'q1',
          renderer: 'text',
          prompt: 'What is your name?',
          required: true,
        },
      ],
    },
    {
      id: 'page-2',
      questions: [
        {
          id: 'q2',
          renderer: 'text',
          prompt: 'What is your age?',
          required: true,
        },
        {
          id: 'q3',
          renderer: 'text',
          prompt: 'What is your favourite colour?',
          required: false,
        },
      ],
    },
    {
      id: 'page-3',
      questions: [
        {
          id: 'q4',
          renderer: 'text',
          prompt: 'Do you have a pet?',
          required: true,
        },
        {
          id: 'q5',
          renderer: 'text',
          prompt: 'What kind of pet?',
          required: true,
          conditionalOn: 'q4',
        },
      ],
    },
    {
      id: 'page-4',
      questions: [
        {
          id: 'q6',
          renderer: 'text',
          prompt: 'What is your occupation?',
          required: true,
        },
      ],
    },
    {
      id: 'page-5',
      questions: [
        {
          id: 'q7',
          renderer: 'text',
          prompt: 'Any final comments?',
          required: false,
        },
      ],
    },
  ],
};
