'use server';
/**
 * @fileOverview A service for interacting with the Google Admin SDK to manage groups.
 *
 * - getUserGroups - A function that returns the groups for a user.
 * - GetUserGroupsInput - The input type for the getUserGroups function (user ID).
 * - GetUserGroupsOutput - The return type for the getUserGroups function (array of groups).
 */

import { z } from 'zod';
import { google } from 'googleapis';
import type { UserGroup } from '@/lib/types';
import { GoogleAuth } from 'google-auth-library';
import { getGoogleIdFromFirebaseUid } from './user-service';

// The input is the user's unique Firebase ID
const GetUserGroupsInputSchema = z.string().describe("The user's unique Firebase ID.");
export type GetUserGroupsInput = z.infer<typeof GetUserGroupsInputSchema>;

const UserGroupSchema = z.object({
  id: z.string().describe("The group's primary email address or unique ID."),
  name: z.string().describe("The display name of the group."),
  description: z.string().optional().describe("A brief description of the group."),
  userIds: z.array(z.string()).optional().describe('An array of user IDs belonging to the group.'),
});


// The return value is an array of groups
const GetUserGroupsOutputSchema = z.array(UserGroupSchema);
export type GetUserGroupsOutput = z.infer<typeof GetUserGroupsOutputSchema>;

/**
 * Retrieves the groups for a given user from Google Workspace.
 * @param userId The unique Firebase ID of the user.
 * @returns A promise that resolves to an array of groups.
 */
export async function getUserGroups(userId: GetUserGroupsInput): Promise<GetUserGroupsOutput> {
  console.log(`[getUserGroups] Starting group retrieval for user ID ${userId}.`);

  try {
    const adminEmail = process.env.GSUITE_ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error("La variable d'entorn GSUITE_ADMIN_EMAIL no està definida.");
    }
    
    // Get the user's Google-specific ID from their Firebase UID
    const googleUserId = await getGoogleIdFromFirebaseUid(userId);
    console.log(`[getUserGroups] Fetched Google ID ${googleUserId} for Firebase UID ${userId}`);

    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/admin.directory.group.readonly'],
      clientOptions: {
        subject: adminEmail,
      }
    });

    const adminClient = google.admin({
      version: 'directory_v1',
      auth: auth,
    });
    
    console.log(`[getUserGroups] Authenticated. Requesting groups for Google user ID ${googleUserId} by impersonating ${adminEmail}`);
    
    const response = await adminClient.groups.list({
      userKey: googleUserId,
      maxResults: 200,
    });
    
    const groups = response.data.groups;

    if (!groups || groups.length === 0) {
      console.log(`[getUserGroups] No groups found for user ID ${userId}.`);
      return [];
    }

    console.log(`[getUserGroups] Found ${groups.length} groups for user ID ${userId}.`);

    const validatedGroups = GetUserGroupsOutputSchema.parse(
      groups.map(g => ({
        id: g.email || g.id!,
        name: g.name || '',
        description: g.description || undefined,
      }))
    );

    console.log(`[getUserGroups] Successfully validated and mapped ${validatedGroups.length} groups.`);
    return validatedGroups;

  } catch (error: any) {
    console.error('[getUserGroups] An error occurred:', error.message, error.stack);

      if (error.code === 403) {
           throw new Error("Accés denegat (403 Forbidden). Causa probable: El Compte de Servei no té els permisos de 'Domain-Wide Delegation' correctes o l'API d'Admin SDK no està habilitada.");
      } else if (error.code === 404) {
          throw new Error(`L'usuari amb ID de Google '${userId}' o el domini no s'ha trobat a Google Workspace.`);
      }
      
      throw new Error(`S'ha produït un error inesperat en connectar amb l'API de Google Workspace: ${error.message}`);
  }
}
