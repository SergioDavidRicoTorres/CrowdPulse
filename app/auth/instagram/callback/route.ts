// import { NextRequest, NextResponse } from "next/server";
// import { createServerClient } from "@/lib/supabase/server";
// import {
//   exchangeFacebookCodeForShortToken,
//   exchangeShortTokenForLongToken,
//   fetchFacebookPages,
//   fetchInstagramBusinessAccount,
//   fetchInstagramProfile,
// } from "@/lib/instagram";
// import { validateAndConsumeState } from "@/lib/oauth-state";

// export async function GET(request: NextRequest) {
//   const baseUrl = process.env.IG_REDIRECT_URI || "";
//   const searchParams = request.nextUrl.searchParams;
//   const code = searchParams.get("code");
//   const state = searchParams.get("state");
//   const error = searchParams.get("error");

//   try {
//     const supabase = await createServerClient();
//     const {
//       data: { user },
//     } = await supabase.auth.getUser();

//     if (!user) {
//       return NextResponse.redirect(new URL("/auth", baseUrl));
//     }

//     // Handle OAuth errors
//     if (error) {
//       console.error("Instagram OAuth error:", error);
//       return NextResponse.redirect(
//         new URL("/profile?error=instagram_oauth_denied", baseUrl)
//       );
//     }

//     // Validate state
//     if (!state || !code) {
//       return NextResponse.redirect(
//         new URL("/profile?error=instagram_invalid_state", baseUrl)
//       );
//     }

//     const isValidState = await validateAndConsumeState("instagram", state);
//     if (!isValidState) {
//       return NextResponse.redirect(
//         new URL("/profile?error=instagram_invalid_state", baseUrl)
//       );
//     }

//     // Exchange code for short-lived token
//     const shortTokenResponse = await exchangeFacebookCodeForShortToken(code);

//     // Exchange short-lived token for long-lived token
//     const longTokenResponse = await exchangeShortTokenForLongToken(
//       shortTokenResponse.access_token
//     );

//     const longToken = longTokenResponse.access_token;

//     // Fetch Facebook Pages
//     const pages = await fetchFacebookPages(longToken);

//     // Find page with Instagram Business Account
//     let instagramUserId: string | null = null;
//     let instagramUsername: string | null = null;
//     let instagramDisplayName: string | null = null;
//     let instagramAvatarUrl: string | null = null;

//     for (const page of pages) {
//       if (page.instagram_business_account?.id) {
//         instagramUserId = page.instagram_business_account.id;

//         // Fetch Instagram profile
//         const instagramProfile = await fetchInstagramProfile(
//           instagramUserId,
//           longToken
//         );

//         instagramUsername = instagramProfile.username;
//         instagramDisplayName = instagramProfile.username; // Use username as display name
//         instagramAvatarUrl = instagramProfile.profile_picture_url || null;

//         break;
//       }
//     }

//     if (!instagramUserId) {
//       return NextResponse.redirect(
//         new URL("/profile?error=instagram_no_business_account", baseUrl)
//       );
//     }

//     // Calculate token expiry (long-lived tokens typically last 60 days)
//     const expiresAt = longTokenResponse.expires_in
//       ? new Date(Date.now() + longTokenResponse.expires_in * 1000).toISOString()
//       : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // Default to 60 days

//     // Upsert social account
//     const { error: upsertError } = await supabase
//       .from("social_accounts")
//       .upsert(
//         {
//           user_id: user.id,
//           platform: "instagram",
//           external_user_id: instagramUserId,
//           username: instagramUsername,
//           display_name: instagramDisplayName,
//           avatar_url: instagramAvatarUrl,
//           access_token: longToken,
//           refresh_token: null, // Meta uses long-lived tokens, refresh handled separately
//           token_expires_at: expiresAt,
//           updated_at: new Date().toISOString(),
//         },
//         {
//           onConflict: "user_id,platform",
//         }
//       );

//     if (upsertError) {
//       console.error("Error upserting Instagram account:", upsertError);
//       throw upsertError;
//     }

//     // Redirect to profile with success
//     return NextResponse.redirect(
//       new URL("/profile?connected=instagram", baseUrl)
//     );
//   } catch (err) {
//     console.error("Instagram OAuth callback error:", err);
//     return NextResponse.redirect(
//       new URL("/profile?error=instagram_callback_failed", baseUrl)
//     );
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  exchangeFacebookCodeForShortToken,
  exchangeShortTokenForLongToken,
  fetchFacebookUserProfile,
} from "@/lib/instagram";
import { validateAndConsumeState } from "@/lib/oauth-state";

export async function GET(request: NextRequest) {
  // Get base URL from redirect URI
  const redirectUri = process.env.IG_REDIRECT_URI || "";
  const baseUrl = redirectUri
    ? redirectUri.replace("/auth/instagram/callback", "")
    : request.url.split("/auth")[0]; // Fallback

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
      console.error("Instagram OAuth error:", error);
      return NextResponse.redirect(
        new URL("/profile?error=instagram_oauth_denied", baseUrl)
      );
    }

    // Validate state
    if (!state || !code) {
      return NextResponse.redirect(
        new URL("/profile?error=instagram_invalid_state", baseUrl)
      );
    }

    const isValidState = await validateAndConsumeState("instagram", state);
    if (!isValidState) {
      return NextResponse.redirect(
        new URL("/profile?error=instagram_invalid_state", baseUrl)
      );
    }

    // Exchange code for short-lived token
    const shortTokenResponse = await exchangeFacebookCodeForShortToken(code);

    // Exchange short-lived token for long-lived token
    const longTokenResponse = await exchangeShortTokenForLongToken(
      shortTokenResponse.access_token
    );

    const longToken = longTokenResponse.access_token;

    // Fetch Facebook user profile (basic info)
    const facebookProfile = await fetchFacebookUserProfile(longToken);

    // Use Facebook user ID as external_user_id
    // For now, we're storing Facebook connection as "instagram" platform
    // You can change this to "facebook" later if you want to separate them
    const externalUserId = facebookProfile.id;
    const username = facebookProfile.name || null;
    const displayName = facebookProfile.name || null;
    const avatarUrl = facebookProfile.picture?.data?.url || null;

    // Calculate token expiry (long-lived tokens typically last 60 days)
    const expiresAt = longTokenResponse.expires_in
      ? new Date(Date.now() + longTokenResponse.expires_in * 1000).toISOString()
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(); // Default to 60 days

    // Upsert social account
    const { error: upsertError } = await supabase
      .from("social_accounts")
      .upsert(
        {
          user_id: user.id,
          platform: "instagram", // Storing as Instagram for now
          external_user_id: externalUserId,
          username: username,
          display_name: displayName,
          avatar_url: avatarUrl,
          access_token: longToken,
          refresh_token: null,
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,platform",
        }
      );

    if (upsertError) {
      console.error("Error upserting Instagram account:", upsertError);
      throw upsertError;
    }

    // Redirect to profile with success
    return NextResponse.redirect(
      new URL("/profile?connected=instagram", baseUrl)
    );
  } catch (err) {
    console.error("Instagram OAuth callback error:", err);
    return NextResponse.redirect(
      new URL("/profile?error=instagram_callback_failed", baseUrl)
    );
  }
}
