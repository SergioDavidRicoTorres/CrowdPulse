import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  exchangeTikTokCodeForToken,
  fetchTikTokProfile,
  TikTokUserInfo,
} from "@/lib/tiktok";
import { validateAndConsumeState } from "@/lib/oauth-state";

export async function GET(request: NextRequest) {
  // Get base URL from redirect URI
  const baseUrl = process.env.TIKTOK_REDIRECT_URI || "";
  // const redirectUri = process.env.TIKTOK_REDIRECT_URI || "";
  // const baseUrl = redirectUri
  //   ? redirectUri.replace("/auth/tiktok/callback", "")
  //   : request.url.split("/auth")[0]; // Fallback
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/auth", baseUrl));
    }

    // Handle OAuth errors
    if (error) {
      console.error("TikTok OAuth error:", error);
      return NextResponse.redirect(
        new URL("/profile?error=tiktok_oauth_denied", baseUrl)
      );
    }

    // Validate state
    if (!state || !code) {
      return NextResponse.redirect(
        new URL("/profile?error=tiktok_invalid_state", baseUrl)
      );
    }

    const isValidState = await validateAndConsumeState("tiktok", state);
    if (!isValidState) {
      return NextResponse.redirect(
        new URL("/profile?error=tiktok_invalid_state", baseUrl)
      );
    }

    // Exchange code for token
    const tokenResponse = await exchangeTikTokCodeForToken(code);

    // Extract open_id from token response (it's already there!)
    const openId = tokenResponse.open_id;

    if (!openId) {
      throw new Error("open_id not found in token response");
    }

    // For now, skip the user info call since it's failing
    // We can add it back later once we figure out the correct API format
    // Just use what we have from the token
    let userInfo: TikTokUserInfo = {
      open_id: openId,
      username: undefined,
      display_name: undefined,
      avatar_url: undefined,
    };

    // // Optionally try to fetch user info, but don't fail if it doesn't work
    // try {
    //   userInfo = await fetchTikTokProfile(tokenResponse.access_token, openId);
    //   console.log("Successfully fetched TikTok user info");
    // } catch (profileError) {
    //   console.warn(
    //     "Could not fetch TikTok profile, using minimal data:",
    //     profileError
    //   );
    //   // Continue with minimal userInfo - we at least have open_id
    // }

    // Now fetch full user profile
    userInfo = await fetchTikTokProfile(tokenResponse.access_token, openId);

    // Calculate token expiry
    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      : null;

    // Upsert social account
    const { error: upsertError } = await supabase
      .from("social_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "tiktok",
          external_user_id: openId,
          username: userInfo.username || null,
          display_name: userInfo.display_name || null,
          avatar_url: userInfo.avatar_url || null,
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token || null,
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,platform",
        }
      );

    if (upsertError) {
      console.error("Error upserting TikTok account:", upsertError);
      throw upsertError;
    }

    // Redirect to profile with success
    return NextResponse.redirect(new URL("/profile?connected=tiktok", baseUrl));
  } catch (err) {
    console.error("TikTok OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/profile?error=tiktok_callback_failed", baseUrl)
    );
  }
}
