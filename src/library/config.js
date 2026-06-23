    window.SM_API_BASE = "https://skymotion.onrender.com";
    // LOCAL TEST DATA (33 moves + 10 plans). For production set this to the CDN
    // index URL, or remove this line to fall back to videos_index_v16.json.
    window.SM_LIBRARY_DATA_URL = "./library-data-pro.json";
    window.SM_CHECKLIST_PAPER_ASSET_URL = "https://skymotion-cdn.b-cdn.net/checklist.png";

    // Pro upgrade. Logged-in Free users buy Pro via Memberstack in-app checkout.
    // Set this to the Pro plan's PRICE id (starts with "prc_") from Memberstack.
    // While empty, logged-in Free users fall back to the sign-up URL.
    window.SM_PRO_PRICE_ID = "";
    window.SM_PRO_SIGNUP_URL = "https://skymotion.cloud/sign-up";

    // Optional pack copy/assets. Edit these values when the final pack is ready.
    window.SM_PRO_PACK_TITLE = "Test Pack";
    window.SM_PRO_PACK_CREATOR = "Creator Name";
    window.SM_PRO_PACK_DESCRIPTION = "A test shooting pack for SkyMotion Premium. Final name, creator, content and pack direction will be updated after we choose the first official pack.";
    // window.SM_REAL_ESTATE_PACK_COVER_URL = "https://your-cover-image-url.jpg";
