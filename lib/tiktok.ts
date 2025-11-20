/**
 * TikTok OAuth and API helpers
 */

export interface TikTokTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  open_id: string;
}

export interface TikTokUserInfo {
  open_id: string;
  union_id?: string;
  avatar_url?: string;
  display_name?: string;
  username?: string;
  bio_description?: string;
  profile_deep_link?: string;
  is_verified?: boolean;
  follower_count?: number;
  following_count?: number;
  likes_count?: number;
  video_count?: number;
}

/**
 * Build TikTok OAuth authorization URL
 */
export function buildTikTokAuthUrl(state: string): string {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = encodeURIComponent(process.env.TIKTOK_REDIRECT_URI || "");

  if (!clientKey) {
    throw new Error("TIKTOK_CLIENT_KEY is not configured");
  }

  // TikTok Login Kit scopes for Display API
  const scope = encodeURIComponent("user.info.basic,video.list");
  const responseType = "code";

  return `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scope}&response_type=${responseType}&redirect_uri=${redirectUri}&state=${state}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeTikTokCodeForToken(
  code: string
): Promise<TikTokTokenResponse> {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  const redirectUri = process.env.TIKTOK_REDIRECT_URI;

  if (!clientKey || !clientSecret || !redirectUri) {
    throw new Error("TikTok OAuth credentials are not configured");
  }

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TikTok token exchange failed: ${error}`);
  }

  const data = await response.json();

  // Log the response to debug structure
  console.log("TikTok token response:", JSON.stringify(data, null, 2));

  if (data.error) {
    throw new Error(
      `TikTok API error: ${data.error_description || data.error}`
    );
  }

  // Handle different response structures
  // TikTok might return data directly or nested in data.data
  const tokenData = data.data || data;

  if (!tokenData || !tokenData.access_token) {
    throw new Error(
      `Invalid TikTok response structure: ${JSON.stringify(data)}`
    );
  }

  return tokenData as TikTokTokenResponse;
}

/**
 * Fetch TikTok user profile information
 */
export async function fetchTikTokProfile(
  accessToken: string,
  openId: string
): Promise<TikTokUserInfo> {
  const fields = [
    "open_id",
    "union_id",
    "avatar_url",
    "display_name",
    // "username",
    // "profile_deep_link",
    // "follower_count",
    // "likes_count",
    // "video_count",
  ].join(",");
  const clientKey = process.env.TIKTOK_CLIENT_KEY;

  if (!clientKey) {
    throw new Error("TIKTOK_CLIENT_KEY is not configured");
  }

  // Request only fields available with user.info.basic scope
  // Avoid fields that might require video.list scope (like follower_count, likes_count, video_count)
  const response = await fetch(
    `https://open.tiktokapis.com/v2/user/info/?fields=${fields}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TikTok profile fetch failed: ${error}`);
  }

  const data = await response.json();

  console.log("TikTok user info response:", JSON.stringify(data, null, 2));

  // TikTok returns error: { code: "ok" } for successful responses
  if (data.error && data.error.code !== "ok") {
    throw new Error(
      `TikTok API error: ${
        data.error.message ||
        data.error_description ||
        JSON.stringify(data.error)
      }`
    );
  }

  // Handle different response structures
  const userData = data.data?.user || data.data || data;

  if (!userData || !userData.open_id) {
    throw new Error(
      `Invalid TikTok user info response: ${JSON.stringify(data)}`
    );
  }

  return userData as TikTokUserInfo;
}
