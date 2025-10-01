
'use server';
/**
 * @fileOverview A service for interacting with the Google Admin SDK to manage groups.
 *
 * - getWorkspaceGroups - A function that returns all groups for a Google Workspace domain.
 * - GetWorkspaceGroupsOutput - The return type for the getWorkspaceGroups function (array of groups).
 */

import { z } from 'zod';
import { google } from 'googleapis';
import type { UserGroup } from '@/lib/types';
import { GoogleAuth } from 'google-auth-library';
import { getAdminEmailEnv } from './config-service';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    const serviceAccountKeyStr = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (serviceAccountKeyStr) {
        const serviceAccountKey = JSON.parse(serviceAccountKeyStr);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountKey),
        });
        console.log('[google-groups-service] Firebase Admin SDK initialized successfully from environment variable.');
    } else {
        // Fallback for production environments where ADC should be available
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
        console.log('[google-groups-service] Firebase Admin SDK initialized successfully with application default credentials.');
    }
  } catch (error: any) {
    console.error('[google-groups-service] Firebase Admin SDK initialization error:', error.message);
  }
}

const UserGroupSchema = z.object({
  id: z.string().describe("The group's primary email address or unique ID."),
  name: z.string().describe("The display name of the group."),
  description: z.string().optional().describe("A brief description of the group."),
  userIds: z.array(z.string()).optional().describe('An array of user IDs belonging to the group.'),
});

const GetWorkspaceGroupsOutputSchema = z.array(UserGroupSchema);
export type GetWorkspaceGroupsOutput = z.infer<typeof GetWorkspaceGroupsOutputSchema>;


const getAdminClient = async () => {
    const adminEmail = await getAdminEmailEnv();
    if (!adminEmail) {
        throw new Error("La variable d'entorn GSUITE_ADMIN_EMAIL no està definida o no és accessible. Aquesta variable ha de contenir l'email d'un administrador de Google Workspace per a poder suplantar la identitat.");
    }

    const auth = new GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/admin.directory.group.readonly',
        'https://www.googleapis.com/auth/admin.directory.group.member.readonly'
      ],
      clientOptions: {
        subject: adminEmail,
      }
    });

    return google.admin({
      version: 'directory_v1',
      auth: auth,
    });
};


/**
 * Retrieves all groups from a Google Workspace domain, handling pagination.
 * @returns A promise that resolves to an array of all groups in the domain.
 */
export async function getWorkspaceGroups(): Promise<GetWorkspaceGroupsOutput> {
  const adminEmail = await getAdminEmailEnv();
   if (!adminEmail) {
    throw new Error("La variable d'entorn GSUITE_ADMIN_EMAIL no està definida. No es pot continuar.");
  }
  const domain = adminEmail.split('@')[1];
  console.log(`[getWorkspaceGroups] Starting group retrieval for domain '${domain}'.`);

  try {
    const adminClient = await getAdminClient();
    
    let allGroups: any[] = [];
    let pageToken: string | undefined = undefined;

    console.log(`[getWorkspaceGroups] Requesting all groups for domain '${domain}' by impersonating '${adminEmail}'`);
    do {
      const response = await adminClient.groups.list({
        domain: domain,
        maxResults: 200,
        pageToken: pageToken,
      });

      const groups = response.data.groups;
      if (groups) {
        allGroups = allGroups.concat(groups);
      }
      
      pageToken = response.data.nextPageToken || undefined;

    } while (pageToken);


    if (allGroups.length === 0) {
      console.log(`[getWorkspaceGroups] No groups found for domain '${domain}'.`);
      return [];
    }

    console.log(`[getWorkspaceGroups] Found a total of ${allGroups.length} groups for domain '${domain}' after handling pagination.`);

    const validatedGroups = GetWorkspaceGroupsOutputSchema.parse(
      allGroups.map(g => ({
        id: g.email || g.id!,
        name: g.name || '',
        description: g.description || undefined,
      }))
    );

    console.log(`[getWorkspaceGroups] Successfully validated and mapped ${validatedGroups.length} groups.`);
    return validatedGroups;

  } catch (error: any) {
      console.error(`[getWorkspaceGroups] Error fetching groups for domain '${domain}':`, error);
      
      if (error.code === 403) {
           throw new Error("Accés denegat (403 Forbidden). Causa probable: El Compte de Servei no té els permisos de 'Domain-Wide Delegation' correctes o l'API d'Admin SDK no està habilitada.");
      } else if (error.code === 404) {
          throw new Error(`El domini '${domain}' no s'ha trobat a Google Workspace.`);
      }
      
      throw new Error(`S'ha produït un error inesperat en connectar amb l'API de Google Workspace: ${error.message}`);
  }
}

/**
 * Recursively retrieves all final user members of a Google Group, resolving nested groups.
 * @param groupKey The email or unique ID of the group.
 * @param adminClient An authenticated Google Admin SDK client.
 * @param processedGroups A Set to keep track of processed groups to avoid infinite loops.
 * @returns A Promise that resolves to an array of unique user email addresses.
 */
export async function getGroupMembersRecursive(
  groupKey: string,
  processedGroups: Set<string> = new Set()
): Promise<string[]> {
  if (processedGroups.has(groupKey)) {
    console.log(`[getGroupMembersRecursive] Skipping already processed group: ${groupKey}`);
    return []; // Avoid infinite loops
  }
  processedGroups.add(groupKey);
  console.log(`[getGroupMembersRecursive] Fetching members for group: ${groupKey}`);

  const adminClient = await getAdminClient();
  let allMemberEmails: Set<string> = new Set();
  let pageToken: string | undefined = undefined;

  try {
    do {
      const response = await adminClient.members.list({
        groupKey: groupKey,
        maxResults: 200,
        pageToken: pageToken,
        includeDerivedMembership: false, // Important to handle recursion manually
      });

      const members = response.data.members;
      if (members) {
        for (const member of members) {
          if (member.type === 'USER' && member.email) {
            allMemberEmails.add(member.email);
          } else if (member.type === 'GROUP' && member.email) {
            const subGroupEmails = await getGroupMembersRecursive(member.email, processedGroups);
            subGroupEmails.forEach(email => allMemberEmails.add(email));
          }
        }
      }
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    console.log(`[getGroupMembersRecursive] Found ${allMemberEmails.size} unique user(s) for group: ${groupKey}`);
    return Array.from(allMemberEmails);
  } catch (error: any) {
    console.error(`[getGroupMembersRecursive] Error fetching members for group ${groupKey}:`, error.message);
    if (error.code === 404) {
        console.warn(`[getGroupMembersRecursive] Group not found: ${groupKey}. Skipping.`);
        return [];
    }
    // Re-throw other errors
    throw error;
  }
}

