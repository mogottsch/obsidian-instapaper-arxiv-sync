function generateNonce(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => {
    return `%${c.charCodeAt(0).toString(16).toUpperCase()}`;
  });
}

function createParameterString(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .filter((key) => params[key] !== undefined)
    .sort()
    .map((key) => {
      const value = params[key];
      return value !== undefined ? `${percentEncode(key)}=${percentEncode(value)}` : "";
    })
    .filter((pair) => pair.length > 0)
    .join("&");
  return sorted;
}

function createSignatureBaseString(
  method: string,
  url: string,
  params: Record<string, string>
): string {
  const normalizedUrl = url.split("?")[0] ?? url;
  const paramString = createParameterString(params);
  const baseUrl = `${method.toUpperCase()}&${percentEncode(normalizedUrl)}&${percentEncode(paramString)}`;
  return baseUrl;
}

function createSigningKey(consumerSecret: string, tokenSecret?: string): string {
  const secretPart =
    tokenSecret !== undefined && tokenSecret !== "" ? percentEncode(tokenSecret) : "";
  return `${percentEncode(consumerSecret)}&${secretPart}`;
}

async function generateSignature(baseString: string, signingKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(signingKey);
  const messageData = encoder.encode(baseString);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export interface OAuthParams {
  readonly consumerKey: string;
  readonly consumerSecret: string;
  readonly token?: string;
  readonly tokenSecret?: string;
}

export async function signOAuthRequest(
  method: string,
  url: string,
  params: Record<string, string>,
  oauthParams: OAuthParams
): Promise<string> {
  const oauthSignatureParams: Record<string, string> = {
    oauth_consumer_key: oauthParams.consumerKey,
    oauth_nonce: generateNonce(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: generateTimestamp(),
    oauth_version: "1.0",
  };

  if (oauthParams.token !== undefined && oauthParams.token !== "") {
    oauthSignatureParams.oauth_token = oauthParams.token;
  }

  const allParams = { ...params, ...oauthSignatureParams };

  const signatureBaseString = createSignatureBaseString(method, url, allParams);

  const signingKey = createSigningKey(oauthParams.consumerSecret, oauthParams.tokenSecret);

  const signature = await generateSignature(signatureBaseString, signingKey);

  oauthSignatureParams.oauth_signature = signature;

  const authParams = Object.keys(oauthSignatureParams)
    .filter((key) => {
      const value = oauthSignatureParams[key];
      return value !== undefined && value !== "";
    })
    .sort()
    .map((key) => {
      const value = oauthSignatureParams[key];
      return value !== undefined ? `${percentEncode(key)}="${percentEncode(value)}"` : "";
    })
    .filter((param) => param.length > 0)
    .join(", ");

  return `OAuth ${authParams}`;
}

export function parseOAuthTokenResponse(response: string): {
  oauth_token: string;
  oauth_token_secret: string;
} | null {
  const params: Record<string, string> = {};
  const pairs = response.split("&");

  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key !== undefined && key !== "" && value !== undefined && value !== "") {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }

  const token = params.oauth_token;
  const tokenSecret = params.oauth_token_secret;
  if (token !== undefined && token !== "" && tokenSecret !== undefined && tokenSecret !== "") {
    return {
      oauth_token: token,
      oauth_token_secret: tokenSecret,
    };
  }

  return null;
}
