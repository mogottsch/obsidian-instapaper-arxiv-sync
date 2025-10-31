import { requestUrl, RequestUrlParam } from "obsidian";
import { Result, ok, err } from "../../utils/result";
import { InstapaperError } from "../../types/errors";
import { INSTAPAPER_API } from "../../core/constants";
import { signOAuthRequest, parseOAuthTokenResponse, type OAuthParams } from "../../utils/oauth";

interface OAuthTokens {
  readonly accessToken: string;
  readonly accessTokenSecret: string;
}

export class InstapaperClient {
  private oauthTokens: OAuthTokens | null = null;

  constructor(
    private readonly username: string,
    private readonly password: string,
    private readonly consumerKey: string,
    private readonly consumerSecret: string
  ) {}

  async getAccessToken(): Promise<Result<OAuthTokens, InstapaperError>> {
    if (this.oauthTokens) {
      return ok(this.oauthTokens);
    }

    try {
      const response = await this.requestAccessToken();
      return this.handleAccessTokenResponse(response);
    } catch (error) {
      return this.handleAccessTokenError(error);
    }
  }

  private async requestAccessToken(): Promise<{
    status: number;
    text: string;
  }> {
    const url = this.buildUrl(INSTAPAPER_API.ENDPOINTS.ACCESS_TOKEN);

    const oauthParams: OAuthParams = {
      consumerKey: this.consumerKey,
      consumerSecret: this.consumerSecret,
    };

    const bodyParams: Record<string, string> = {
      x_auth_username: this.username,
      x_auth_password: this.password,
      x_auth_mode: "client_auth",
    };

    const authHeader = await signOAuthRequest("POST", url, bodyParams, oauthParams);

    const requestParams: RequestUrlParam = {
      url,
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(bodyParams).toString(),
    };

    return await requestUrl(requestParams);
  }

  private handleAccessTokenResponse(response: {
    status: number;
    text: string;
  }): Result<OAuthTokens, InstapaperError> {
    if (response.status === 200) {
      const tokens = parseOAuthTokenResponse(response.text);
      if (!tokens) {
        return err({
          type: "INVALID_RESPONSE",
          message: "Failed to parse OAuth token response",
        });
      }

      this.oauthTokens = {
        accessToken: tokens.oauth_token,
        accessTokenSecret: tokens.oauth_token_secret,
      };

      return ok(this.oauthTokens);
    }

    if (response.status === 401 || response.status === 403) {
      return err({
        type: "AUTH_FAILED",
        message: "Invalid Instapaper credentials",
      });
    }

    return err({
      type: "INVALID_RESPONSE",
      message: `Unexpected status code: ${response.status.toString()}`,
    });
  }

  private handleAccessTokenError(error: unknown): Result<OAuthTokens, InstapaperError> {
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch") || error.message.includes("network")) {
        return err({
          type: "NETWORK_ERROR",
          message: error.message,
        });
      }
      return err({
        type: "UNKNOWN_ERROR",
        message: error.message,
      });
    }
    return err({
      type: "UNKNOWN_ERROR",
      message: "Unknown error occurred",
    });
  }

  private async ensureAuthenticated(): Promise<Result<void, InstapaperError>> {
    if (!this.oauthTokens) {
      const tokenResult = await this.getAccessToken();
      if (!tokenResult.success) {
        return err(tokenResult.error);
      }
    }
    return ok(undefined);
  }

  private buildUrl(endpoint: string): string {
    return INSTAPAPER_API.BASE_URL + endpoint;
  }

  private async buildOAuthRequest(
    method: string,
    url: string,
    bodyParams: Record<string, string>
  ): Promise<Result<RequestUrlParam, InstapaperError>> {
    await this.ensureAuthenticated();

    if (!this.oauthTokens) {
      return err({
        type: "AUTH_FAILED",
        message: "OAuth tokens not available",
      });
    }

    const oauthParams: OAuthParams = {
      consumerKey: this.consumerKey,
      consumerSecret: this.consumerSecret,
      token: this.oauthTokens.accessToken,
      tokenSecret: this.oauthTokens.accessTokenSecret,
    };

    const authHeader = await signOAuthRequest(method, url, bodyParams, oauthParams);

    return ok({
      url,
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(bodyParams).toString(),
    });
  }

  private handleResponseStatus(
    status: number,
    headers: Record<string, string>
  ): Result<string, InstapaperError> | null {
    if (status === 200) {
      return null;
    }
    if (status === 401 || status === 403) {
      this.oauthTokens = null;
      return err({
        type: "AUTH_FAILED",
        message: "Invalid Instapaper credentials",
      });
    }
    if (status === 429) {
      const retryAfterHeader = headers["retry-after"] ?? "";
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60;
      return err({
        type: "RATE_LIMITED",
        retryAfter,
      });
    }
    return err({
      type: "INVALID_RESPONSE",
      message: `Unexpected status code: ${status.toString()}`,
    });
  }

  private handleError(error: unknown): Result<string, InstapaperError> {
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch") || error.message.includes("network")) {
        return err({
          type: "NETWORK_ERROR",
          message: error.message,
        });
      }
      return err({
        type: "UNKNOWN_ERROR",
        message: error.message,
      });
    }
    return err({
      type: "UNKNOWN_ERROR",
      message: "Unknown error occurred",
    });
  }

  private async request(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<Result<string, InstapaperError>> {
    try {
      const url = this.buildUrl(endpoint);
      const requestParamsResult = await this.buildOAuthRequest("POST", url, params);

      if (!requestParamsResult.success) {
        return err(requestParamsResult.error);
      }

      const response = await requestUrl(requestParamsResult.value);

      if (response.status === 200) {
        return ok(response.text);
      }

      return (
        this.handleResponseStatus(response.status, response.headers) ??
        err({
          type: "UNKNOWN_ERROR",
          message: "Unknown error occurred",
        })
      );
    } catch (error) {
      return this.handleError(error);
    }
  }

  async verifyCredentials(): Promise<Result<boolean, InstapaperError>> {
    const tokenResult = await this.getAccessToken();
    if (!tokenResult.success) {
      return err(tokenResult.error);
    }

    const result = await this.request(INSTAPAPER_API.ENDPOINTS.VERIFY);
    if (result.success) {
      return ok(true);
    }
    return err(result.error);
  }

  async fetchBookmarks(): Promise<Result<string, InstapaperError>> {
    return this.request(INSTAPAPER_API.ENDPOINTS.LIST, {
      limit: "500",
    });
  }

  async archiveBookmark(bookmarkId: string): Promise<Result<void, InstapaperError>> {
    const result = await this.request(INSTAPAPER_API.ENDPOINTS.ARCHIVE, {
      bookmark_id: bookmarkId,
    });
    if (result.success) {
      return ok(undefined);
    }
    return err(result.error);
  }
}
