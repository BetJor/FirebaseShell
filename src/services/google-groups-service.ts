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
  const adminEmail = process.env.GSUITE_ADMIN_EMAIL;
  
  console.log(`[getUserGroups] Starting to fetch groups for: ${userEmail}`);
  
  if (!adminEmail) {
      console.error("[getUserGroups] GSUITE_ADMIN_EMAIL environment variable is not set.");
      throw new Error("La variable d'entorn GSUITE_ADMIN_EMAIL no està configurada. Aquest valor és necessari per a la suplantació de l'usuari administrador.");
  }

  console.log(`[getUserGroups] Impersonating ${adminEmail} to fetch groups for ${userEmail}.`);

  try {
      const auth = new google.auth.GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/admin.directory.group.readonly'],
          // Explicitly use the service account credentials from the environment
          credentials: {
              project_id: process.env.FIREBASE_PROJECT_ID,
              client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
              private_key: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
          },
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

      return validatedGroups;
      
  } catch (error: any) {
      console.error(`[getUserGroups] Detailed error object:`, JSON.stringify(error, null, 2));

      if (error.code === 403) {
           throw new Error("Accés denegat (403 Forbidden). Causa probable: El Compte de Servei no té els permisos de 'Domain-Wide Delegation' correctes o l'API d'Admin SDK no està habilitada.");
      } else if (error.code === 404) {
          throw new Error(`L'usuari '${userEmail}' o el domini no s'ha trobat a Google Workspace.`);
      }
      
      throw new Error(`S'ha produït un error inesperat en connectar amb l'API de Google Workspace: ${error.message}`);
  }
}
