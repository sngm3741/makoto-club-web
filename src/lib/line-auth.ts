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

type LoginResponseMessage =
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

export async function startLineLogin(baseUrl: string): Promise<LineLoginResult> {
  if (typeof window === 'undefined') {
    throw new Error('クライアント環境でのみ実行できます。');
  }

  if (!baseUrl) {
    throw new Error('LINEログインのエンドポイントが設定されていません。');
  }

  const endpoint = normaliseBaseUrl(baseUrl);
  const origin = window.location.origin;
  const authBaseOrigin = new URL(endpoint).origin;

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

  const { authorizationUrl, state } = (await response.json()) as {
    authorizationUrl: string;
    state: string;
  };

  if (!authorizationUrl || !state) {
    throw new Error('LINEログインの初期化に失敗しました。');
  }

  const popup = window.open(
    authorizationUrl,
    'lineLogin',
    'width=480,height=720,menubar=no,toolbar=no',
  );

  if (!popup) {
    throw new Error('ポップアップを開けませんでした。ブラウザの設定を確認してください。');
  }

  popup.focus();

  return new Promise<LineLoginResult>((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener('message', handleMessage);
      window.clearInterval(popupTimer);
      if (!popup.closed) {
        popup.close();
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== authBaseOrigin) {
        return;
      }

      const data = event.data as LoginResponseMessage;
      if (!data || data.type !== 'line-login-result') {
        return;
      }

      if (!data.state || data.state !== state) {
        cleanup();
        reject(new Error('ログインの整合性チェックに失敗しました。'));
        return;
      }

      cleanup();

      if (!data.success) {
        reject(new Error(data.error ?? 'LINEログインがキャンセルされました。'));
        return;
      }

      const payload = data.payload;
      if (!payload?.accessToken || !payload?.lineUser) {
        reject(new Error('LINEログインの応答が不正です。'));
        return;
      }

      const result: LineLoginResult = {
        accessToken: payload.accessToken,
        lineUser: payload.lineUser,
      };

      persistAuthResult(result);
      resolve(result);
    };

    const popupTimer = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error('LINEログインがキャンセルされました。'));
      }
    }, 500);

    window.addEventListener('message', handleMessage);
  });
}

function persistAuthResult(result: LineLoginResult) {
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
