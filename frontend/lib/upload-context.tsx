'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { CliFormat, ParsedArchiveFile } from './zip-parser';

export type SkillType = 'skill' | 'agent';
export type OsType = 'WINDOWS' | 'MACOS';
export type { CliFormat };

export interface EnvironmentDeclaration {
  requiresInternet: boolean;
  requiresMcpServer: boolean;
  requiresLocalService: boolean;
  requiresSystemPackages: boolean;
  additionalNotes: string;
}

export interface McpSpec {
  serverName: string;
  command: string;
  args: string[];
  env: Record<string, string>;
}

export interface UploadFormData {
  // 步驟一 — 基本資訊
  name: string;
  description: string;
  version: string;
  tags: string[];
  authorName: string;
  authorEmail: string;
  // 步驟二 — 內容
  content: string;
  installationSteps: string[];
  dependencies: string[];
  // 步驟三 — 環境
  environmentDeclaration: EnvironmentDeclaration;
  osCompatibility: OsType[];
  mcpSpec: McpSpec | null;
  // 選填
  cliOverrides: Record<string, string>;
  changelog: string;
  // Skill 變數（content 中的 {VAR_NAME} 佔位符）
  variables: { name: string; description: string; example: string }[];
  // 附加檔案（補充腳本）
  attachedFiles: { filename: string; content: string }[];
  // Archive mode fields
  archiveMode: boolean;
  sourceCliFormat: CliFormat | null;
  archiveFiles: ParsedArchiveFile[];
}

export interface UploadState {
  type: SkillType | null;
  step: 1 | 2 | 3 | 4;
  formData: Partial<UploadFormData>;
  errors: Record<string, string>;
  isDirty: boolean;
  isSubmitting: boolean;
}

type UploadAction =
  | { type: 'SET_SKILL_TYPE'; payload: SkillType }
  | { type: 'SET_STEP'; payload: 1 | 2 | 3 | 4 }
  | { type: 'UPDATE_FORM'; payload: Partial<UploadFormData> }
  | { type: 'SET_ERRORS'; payload: Record<string, string> }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_ARCHIVE_MODE'; payload: { cli: CliFormat; files: ParsedArchiveFile[] } }
  | { type: 'RESET' };

const INITIAL_ENV: EnvironmentDeclaration = {
  requiresInternet: false,
  requiresMcpServer: false,
  requiresLocalService: false,
  requiresSystemPackages: false,
  additionalNotes: '',
};

const INITIAL_STATE: UploadState = {
  type: null,
  step: 1,
  formData: {
    version: '1.0.0',
    tags: [],
    installationSteps: [''],
    dependencies: [],
    environmentDeclaration: INITIAL_ENV,
    osCompatibility: ['WINDOWS', 'MACOS'],
    mcpSpec: null,
    cliOverrides: {},
    changelog: '初始版本。',
    variables: [],
    attachedFiles: [],
    archiveMode: false,
    sourceCliFormat: null,
    archiveFiles: [],
  },
  errors: {},
  isDirty: false,
  isSubmitting: false,
};

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'SET_SKILL_TYPE':
      return { ...state, type: action.payload, isDirty: true };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'UPDATE_FORM':
      return {
        ...state,
        formData: { ...state.formData, ...action.payload },
        isDirty: true,
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'CLEAR_ERROR': {
      const { [action.payload]: _, ...rest } = state.errors;
      return { ...state, errors: rest };
    }
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'SET_ARCHIVE_MODE':
      return {
        ...state,
        formData: {
          ...state.formData,
          archiveMode: true,
          sourceCliFormat: action.payload.cli,
          archiveFiles: action.payload.files,
        },
        isDirty: true,
      };
    case 'RESET':
      return INITIAL_STATE;
    default:
      return state;
  }
}

const DRAFT_KEY = 'agentsgate-upload-draft';

interface UploadContextValue {
  state: UploadState;
  setSkillType: (type: SkillType) => void;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  updateForm: (data: Partial<UploadFormData>) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearError: (field: string) => void;
  setSubmitting: (value: boolean) => void;
  setArchiveMode: (cli: CliFormat, files: ParsedArchiveFile[]) => void;
  reset: () => void;
}

const UploadContext = createContext<UploadContextValue | null>(null);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(uploadReducer, INITIAL_STATE, (init) => {
    if (typeof window === 'undefined') return init;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<UploadState>;
        return { ...init, ...parsed, isSubmitting: false };
      }
    } catch {
      // ignore parse errors
    }
    return init;
  });

  useEffect(() => {
    if (state.isDirty) {
      try {
        // Exclude archiveFiles from localStorage (too large; re-parsed on each session)
        const { archiveFiles: _, ...persistableFormData } = state.formData as UploadFormData & { archiveFiles: unknown };
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ type: state.type, step: state.step, formData: persistableFormData })
        );
      } catch {
        // ignore storage errors
      }
    }
  }, [state.isDirty, state.type, state.step, state.formData]);

  const value: UploadContextValue = {
    state,
    setSkillType: (type) => dispatch({ type: 'SET_SKILL_TYPE', payload: type }),
    setStep: (step) => dispatch({ type: 'SET_STEP', payload: step }),
    updateForm: (data) => dispatch({ type: 'UPDATE_FORM', payload: data }),
    setErrors: (errors) => dispatch({ type: 'SET_ERRORS', payload: errors }),
    clearError: (field) => dispatch({ type: 'CLEAR_ERROR', payload: field }),
    setSubmitting: (value) => dispatch({ type: 'SET_SUBMITTING', payload: value }),
    setArchiveMode: (cli, files) => dispatch({ type: 'SET_ARCHIVE_MODE', payload: { cli, files } }),
    reset: () => {
      localStorage.removeItem(DRAFT_KEY);
      dispatch({ type: 'RESET' });
    },
  };

  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}

export function useUpload(): UploadContextValue {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUpload must be used within UploadProvider');
  return ctx;
}
