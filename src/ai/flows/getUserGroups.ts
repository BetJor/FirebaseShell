'use server';
/**
 * @fileOverview A flow to retrieve the Google Groups for a given user email.
 * 
 * This flow currently returns mock data because the real API call was causing server timeouts.
 * To re-enable the real API call, you would need to:
 * 1. Install the 'googleapis' package: `npm install googleapis`
 * 2. Uncomment the commented-out code block.
 * 3. Ensure the Service Account has Domain-Wide Delegation enabled in the Google Workspace Admin Console.
 * 4. Set the GSUITE_ADMIN_EMAIL environment variable.
 * 
 * - getUserGroups - A function that returns the groups for a user.
 * - GetUserGroupsInput - The input type for the getUserGroups function (user email).
 * - GetUserGroupsOutput - The return type for the getUserGroups function (array of groups).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { google } from 'googleapis';
import type { UserGroup } from '@/lib/types';

// The input is the user's email address
const GetUserGroupsInputSchema = z.string().email().describe("The email address of the user.");
export type GetUserGroupsInput = z.infer<typeof GetUserGroupsInputSchema>;

const UserGroupSchema = z.object({
  id: z.string().describe("The group's primary email address or unique ID."),
  name: z.string().describe("The display name of the group."),
  description: z.string().optional().describe("A brief description of the group."),
});

const GetUserGroupsOutputSchema = z.array(UserGroupSchema);
export type GetUserGroupsOutput = z.infer<typeof GetUserGroupsOutputSchema>;

// This is the main function that the frontend will call.
export async function getUserGroups(userEmail: GetUserGroupsInput): Promise<GetUserGroupsOutput> {
  return getUserGroupsFlow(userEmail);
}

const getUserGroupsFlow = ai.defineFlow(
  {
    name: 'getUserGroupsFlow',
    inputSchema: GetUserGroupsInputSchema,
    outputSchema: GetUserGroupsOutputSchema,
  },
  async (userEmail) => {
    
    // --- REAL GOOGLE API IMPLEMENTATION ---
    const adminEmail = process.env.GSUITE_ADMIN_EMAIL;
    if (!adminEmail) {
        throw new Error("La variable d'entorn GSUITE_ADMIN_EMAIL no està configurada. Aquest valor és necessari per a la suplantació de l'usuari administrador.");
    }
    
    console.log(`[getUserGroupsFlow] Starting to fetch groups for: ${userEmail} by impersonating ${adminEmail}`);

    try {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/admin.directory.group.readonly'],
            clientOptions: {
              subject: adminEmail // User to impersonate
            }
        });
        
        const admin = google.admin({
            version: 'directory_v1',
            auth: auth,
        });

        const response = await admin.groups.list({
            userKey: userEmail,
            maxResults: 200,
        });
        
        const groups = response.data.groups;

        if (!groups || groups.length === 0) {
            console.log(`[getUserGroupsFlow] No groups found for user ${userEmail}.`);
            return [];
        }

        console.log(`[getUserGroupsFlow] Found ${groups.length} groups for ${userEmail}.`);

        return groups.map(g => ({
            id: g.email || g.id!,
            name: g.name || '',
            description: g.description || undefined,
        }));
        
    } catch (error: any) {
        console.error(`[getUserGroupsFlow] Detailed error object:`, JSON.stringify(error, null, 2));

        if (error.code === 403) {
             throw new Error("Accés denegat (403 Forbidden). Causa probable: El Compte de Servei no té els permisos de 'Domain-Wide Delegation' correctes o l'API d'Admin SDK no està habilitada.");
        } else if (error.code === 404) {
            throw new Error(`L'usuari '${userEmail}' o el domini no s'ha trobat a Google Workspace.`);
        }
        
        throw new Error(`S'ha produït un error inesperat en connectar amb l'API de Google Workspace: ${error.message}`);
    }
  }
);
