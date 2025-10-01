'use server';
/**
 * @fileOverview A service for interacting with the Google Admin SDK to manage groups.
 *
 * - getUserGroups - A function that returns the groups for a user.
 * - GetUserGroupsInput - The input type for the getUserGroups function (user email).
 * - GetUserGroupsOutput - The return type for the getUserGroups function (array of groups).
 */

import { z } from 'zod';
import { google } from 'googleapis';
import type { UserGroup } from '@/lib/types';
import { GoogleAuth } from 'google-auth-library';

// The input is the user's email address
const GetUserGroupsInputSchema = z.string().email().describe("The email address of the user.");
export type GetUserGroupsInput = z.infer<typeof GetUserGroupsInputSchema>;

const UserGroupSchema = z.object({
  id: z.string().describe("The group\'s primary email address or unique ID."),
  name: z.string().describe("The display name of the group."),
  description: z.string().optional().describe("A brief description of the group."),
});

// The return value is an array of groups
const GetUserGroupsOutputSchema = z.array(UserGroupSchema);
export type GetUserGroupsOutput = z.infer<typeof GetUserGroupsOutputSchema>;

/**
 * Retrieves the groups for a given user from Google Workspace.
 * @param userEmail The email address of the user.
 * @returns A promise that resolves to an array of groups.
 */
export async function getUserGroups(userEmail: GetUserGroupsInput): Promise<GetUserGroupsOutput> {
  console.log(`[getUserGroups] Starting group retrieval for user ${userEmail}.`);

  try {
    const adminEmail = process.env.GSUITE_ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error("La variable d\'entorn GSUITE_ADMIN_EMAIL no està definida.");
    }
    
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/admin.directory.group.readonly'],
      clientOptions: {
        subject: adminEmail,
      }
    });

    const admin = google.admin({
      version: 'directory_v1',
      auth: auth,
    });

    console.log(`[getUserGroups] Authenticated. Requesting groups for ${userEmail} by impersonating ${adminEmail}`);

    const response = await admin.groups.list({
      userKey: userEmail,
      maxResults: 200,
    });
    
    const groups = response.data.groups;

    if (!groups || groups.length === 0) {
      console.log(`[getUserGroups] No groups found for user ${userEmail}.`);
      return [];
    }

    console.log(`[getUserGroups] Found ${groups.length} groups for ${userEmail}.`);

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
    console.error('[getUserGroups] An error occurred:', error.message, error);

      if (error.code === 403) {
           throw new Error("Accés denegat (403 Forbidden). Causa probable: El Compte de Servei no té els permisos de 'Domain-Wide Delegation' correctes o l'API d'Admin SDK no està habilitada.");
      } else if (error.code === 404) {
          throw new Error(`L'usuari '${userEmail}' o el domini no s'ha trobat a Google Workspace.`);
      }
      
      throw new Error(`S'ha produït un error inesperat en connectar amb l'API de Google Workspace: ${error.message}`);
  }
}
