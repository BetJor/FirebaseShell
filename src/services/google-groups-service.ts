'use server';
/**
 * @fileOverview A service for interacting with the Google Admin SDK to manage groups.
 *
 * - getWorkspaceGroups - A function that returns all groups for a domain.
 * - GetWorkspaceGroupsInput - The input type for the getWorkspaceGroups function (user ID).
 * - GetWorkspaceGroupsOutput - The return type for the getWorkspaceGroups function (array of groups).
 */

import { z } from 'zod';
import { google } from 'googleapis';
import type { UserGroup } from '@/lib/types';
import { GoogleAuth } from 'google-auth-library';
import { getGoogleIdFromFirebaseUid } from './user-service';


const UserGroupSchema = z.object({
  id: z.string().describe("The group's primary email address or unique ID."),
  name: z.string().describe("The display name of the group."),
  description: z.string().optional().describe("A brief description of the group."),
  userIds: z.array(z.string()).optional().describe('An array of user IDs belonging to the group.'),
});


// The return value is an array of groups
const GetWorkspaceGroupsOutputSchema = z.array(UserGroupSchema);
export type GetWorkspaceGroupsOutput = z.infer<typeof GetWorkspaceGroupsOutputSchema>;

/**
 * Retrieves all groups from the Google Workspace domain.
 * @returns A promise that resolves to an array of all groups in the domain.
 */
export async function getWorkspaceGroups(): Promise<GetWorkspaceGroupsOutput> {
  console.log(`[getWorkspaceGroups] Starting group retrieval for the entire domain.`);

  try {
    const adminEmail = process.env.GSUITE_ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error("La variable d'entorn GSUITE_ADMIN_EMAIL no està definida.");
    }
    const domain = adminEmail.split('@')[1];
    if (!domain) {
        throw new Error("No s'ha pogut extreure el domini de GSUITE_ADMIN_EMAIL.");
    }
    
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
    
    console.log(`[getWorkspaceGroups] Authenticated. Requesting all groups for domain ${domain} by impersonating ${adminEmail}`);
    
    const response = await adminClient.groups.list({
      domain: domain,
      maxResults: 200, // You might need to handle pagination for more than 200 groups
    });
    
    const groups = response.data.groups;

    if (!groups || groups.length === 0) {
      console.log(`[getWorkspaceGroups] No groups found for domain ${domain}.`);
      return [];
    }

    console.log(`[getWorkspaceGroups] Found ${groups.length} groups for domain ${domain}.`);

    const validatedGroups = GetWorkspaceGroupsOutputSchema.parse(
      groups.map(g => ({
        id: g.email || g.id!,
        name: g.name || '',
        description: g.description || undefined,
      }))
    );

    console.log(`[getWorkspaceGroups] Successfully validated and mapped ${validatedGroups.length} groups.`);
    return validatedGroups;

  } catch (error: any) {
    if (error.code === 404) {
      // This case is less likely when fetching by domain but kept for safety.
      console.warn(`[getWorkspaceGroups] Domain not found in Google Workspace. This should not happen. Returning empty group list.`);
      return [];
    }
    
    console.error('[getWorkspaceGroups] An error occurred:', error.message, error.stack);

      if (error.code === 403) {
           throw new Error("Accés denegat (403 Forbidden). Causa probable: El Compte de Servei no té els permisos de 'Domain-Wide Delegation' correctes o l'API d'Admin SDK no està habilitada.");
      }
      
      throw new Error(`S'ha produït un error inesperat en connectar amb l'API de Google Workspace: ${error.message}`);
  }
}
