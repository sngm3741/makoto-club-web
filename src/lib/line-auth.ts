'use client';

type LineUser = {
  userId: string;
  displayName: string;
  avatarUrl?: string;
};

export type LineLoginResult = {
  accessToken: string;
  lineUser: LineUser;
};

export const AUTH_STORAGE_KEY = 'makotoClubLineAuth';
export const AUTH_UPDATE_EVENT = 'line-auth:updated';

export type LoginResponseMessage =
  | {
      type: 'line-login-result';
      success: true;
      state: string;
      payload: {
        accessToken: string;
        tokenType: string;
        expiresIn: number;
        lineUser: LineUser;
      };
    }
  | {
      type: 'line-login-result';
      success: false;
      state?: string;
      error?: string;
    };

function normaliseBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

export function readStoredAuth(): LineLoginResult | undefined {
  if (typeof window === 'undefined') return undefined;
  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as LineLoginResult;
  } catch {
    return undefined;
  }
}

export async function startLineLogin(baseUrl: string): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('クライアント環境でのみ実行できます。');
  }

  if (!baseUrl) {
    throw new Error('LINEログインのエンドポイントが設定されていません。');
  }

  const endpoint = normaliseBaseUrl(baseUrl);
  const origin = window.location.origin;

  const response = await fetch(`${endpoint}/line/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ origin }),
  });

  if (!response.ok) {
    const message = await safeParseError(response);
    throw new Error(message ?? 'LINEログインの開始に失敗しました。');
  }

  const { authorizationUrl } = (await response.json()) as {
    authorizationUrl: string;
  };

  if (!authorizationUrl) {
    throw new Error('LINEログインの初期化に失敗しました。');
  }

  window.location.assign(authorizationUrl);
}

export function persistAuthResult(result: LineLoginResult) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result));
  window.dispatchEvent(
    new CustomEvent<LineLoginResult>(AUTH_UPDATE_EVENT, { detail: result }),
  );
}

async function safeParseError(response: Response): Promise<string | undefined> {
  try {
    const data = await response.json();
    if (typeof data?.error === 'string') {
      return data.error;
    }
  } catch {
    // ignore
  }
  return undefined;
}
