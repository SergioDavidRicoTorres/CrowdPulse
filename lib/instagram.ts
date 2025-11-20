/**
 * Instagram (Meta/Facebook) OAuth and API helpers
 */

export interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: {
    id: string;
  };
}

export interface InstagramUserInfo {
  id: string;
  username: string;
  account_type?: string;
  media_count?: number;
  profile_picture_url?: string;
}

/**
 * Build Instagram (Facebook Login) OAuth authorization URL
 */
export function buildInstagramAuthUrl(state: string): string {
  const appId = process.env.META_APP_ID;
  const redirectUri = encodeURIComponent(process.env.IG_REDIRECT_URI || "");

  if (!appId) {
    throw new Error("META_APP_ID is not configured");
  }

  // // Scopes for Instagram Business API
  // const scope = encodeURIComponent(
  //   "instagram_basic,pages_show_list,instagram_manage_insights"
  // );
  // const responseType = "code";
  // Basic Facebook Login scopes (for now, just email and public_profile)
  const scope = encodeURIComponent("email,public_profile");
  const responseType = "code";

  return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=${responseType}&state=${state}`;
}

/**
 * Exchange authorization code for short-lived access token
 */
export async function exchangeFacebookCodeForShortToken(
  code: string
): Promise<FacebookTokenResponse> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.IG_REDIRECT_URI;

  if (!appId || !appSecret || !redirectUri) {
    throw new Error("Meta OAuth credentials are not configured");
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${redirectUri}&code=${code}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Facebook token exchange failed: ${error}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Facebook API error: ${data.error.message || data.error}`);
  }

  return data as FacebookTokenResponse;
}

/**
 * Exchange short-lived token for long-lived token
 */
export async function exchangeShortTokenForLongToken(
  shortToken: string
): Promise<FacebookTokenResponse> {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Meta OAuth credentials are not configured");
  }

  const response = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Facebook long-lived token exchange failed: ${error}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Facebook API error: ${data.error.message || data.error}`);
  }

  return data as FacebookTokenResponse;
}

/**
 * Fetch Facebook user profile information
 */
export async function fetchFacebookUserProfile(accessToken: string): Promise<{
  id: string;
  name: string;
  email?: string;
  picture?: {
    data: {
      url: string;
    };
  };
}> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me?fields=id,name,email,picture&access_token=${accessToken}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Facebook user profile fetch failed: ${error}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Facebook API error: ${data.error.message || data.error}`);
  }

  return data;
}

/**
 * Fetch Facebook Pages that the user manages
 */
export async function fetchFacebookPages(
  accessToken: string
): Promise<FacebookPage[]> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}&fields=id,name,access_token,instagram_business_account`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Facebook pages fetch failed: ${error}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Facebook API error: ${data.error.message || data.error}`);
  }

  return data.data as FacebookPage[];
}

/**
 * Fetch Instagram Business Account info from a Facebook Page
 */
export async function fetchInstagramBusinessAccount(
  longToken: string,
  pageId: string
): Promise<{ instagram_business_account: { id: string } } | null> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${longToken}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Instagram business account fetch failed: ${error}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Facebook API error: ${data.error.message || data.error}`);
  }

  return data.instagram_business_account ? data : null;
}

/**
 * Fetch Instagram user profile information
 */
export async function fetchInstagramProfile(
  instagramUserId: string,
  accessToken: string
): Promise<InstagramUserInfo> {
  const response = await fetch(
    `https://graph.facebook.com/v18.0/${instagramUserId}?fields=id,username,account_type,media_count,profile_picture_url&access_token=${accessToken}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Instagram profile fetch failed: ${error}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Instagram API error: ${data.error.message || data.error}`);
  }

  return data as InstagramUserInfo;
}
