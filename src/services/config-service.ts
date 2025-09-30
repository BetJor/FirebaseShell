'use server';

export async function checkAdminEmailEnv(): Promise<boolean> {
    return !!process.env.GSUITE_ADMIN_EMAIL;
}
