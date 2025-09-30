'use server';

export async function checkAdminEmailEnv(): Promise<boolean> {
    return !!process.env.GSUITE_ADMIN_EMAIL;
}

export async function getAdminEmailEnv(): Promise<string | null> {
    return process.env.GSUITE_ADMIN_EMAIL || null;
}
