
"use client";

import UserSettingsProfile from "@/app/user/settings/profile";

export default function AdminSettingsProfile() {
    return <UserSettingsProfile redirectOnSaveTo="/admin/profile" />;
}
