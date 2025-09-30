
import { collection, doc, getDoc, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GalleryPrompt } from '@/lib/types';
import type { AclEntry } from '@/app/firestore-rules/page';

// --- CRUD for AI Prompts ---
type PromptId = "improveWriting" | "analysisSuggestion" | "correctiveActions";

export async function getPrompt(promptId: PromptId): Promise<string> {
    const docRef = doc(db, 'app_settings', 'prompts');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data[promptId]) {
            return data[promptId];
        }
    }

    // Fallback to default prompts if they don't exist in Firestore
    const defaultPrompts = {
        improveWriting: "Ets un expert en sistemes de gestió de qualitat (normes ISO 9001). La teva tasca és reescriure les observacions d'una no conformitat o una oportunitat de millora per a fer-les més clares, professionals i detallades. Afegeix context, detalls rellevants i un llenguatge precís per a facilitar-ne l'anàlisi posterior. El text ha de ser concís i directe, però sense perdre informació crucial. Retorna només la descripció millorada, sense cap text introductori ni comiat.",
        analysisSuggestion: "Ets un expert en sistemes de gestió de qualitat (ISO 9001). La teva tasca és analitzar les observacions d'una acció de millora i proposar una anàlisi de causes arrel i un pla d'acció correctiu. \n\n1. **Anàlisi de Causes**: Identifica les possibles causes arrel del problema descrit. Utilitza la tècnica dels '5 Perquès' o una anàlisi causa-efecte si és necessari. L'anàlisi ha de ser lògic, estructurat i anar més enllà dels símptomes superficials.\n\n2. **Accions Correctives Proposades**: Basant-te en l'anàlisi de causes, proposa entre 1 i 3 accions correctives específiques, mesurables, assolibles, rellevants i amb un termini definit (SMART). Les accions han d'abordar directament les causes arrel identificades.\n\nEl resultat ha de ser en format JSON, seguint l'esquema definit.",
        correctiveActions: "Ets un expert en la creació de plans d'acció per a sistemes de gestió de qualitat. La teva tasca és, basant-te en una descripció d'un problema i la seva anàlisi de causes, proposar accions correctives efectives. Les accions han de ser clares, concises i orientades a eliminar la causa arrel del problema per a evitar-ne la recurrència. Proposa entre 1 i 3 accions."
    };

    if (defaultPrompts[promptId]) {
        // Optionally, save the default prompt to Firestore for future use
        await updatePrompt(promptId, defaultPrompts[promptId]);
        return defaultPrompts[promptId];
    }
    
    return '';
}


export async function updatePrompt(promptId: PromptId, newPrompt: string): Promise<void> {
    const docRef = doc(db, 'app_settings', 'prompts');
    await setDoc(docRef, { [promptId]: newPrompt }, { merge: true });
}

// --- CRUD for Prompt Gallery ---
export async function getGalleryPrompts(): Promise<GalleryPrompt[]> {
    const promptsCol = collection(db, 'prompt_gallery');
    const snapshot = await getDocs(query(promptsCol, orderBy("title")));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryPrompt));
}

export async function addGalleryPrompt(prompt: Omit<GalleryPrompt, 'id'>): Promise<string> {
    const collectionRef = collection(db, 'prompt_gallery');
    const docRef = await addDoc(collectionRef, prompt);
    return docRef.id;
}

export async function updateGalleryPrompt(promptId: string, prompt: Omit<GalleryPrompt, 'id'>): Promise<void> {
    const docRef = doc(db, 'prompt_gallery', promptId);
    await updateDoc(docRef, prompt);
}

export async function deleteGalleryPrompt(promptId: string): Promise<void> {
    const docRef = doc(db, 'prompt_gallery', promptId);
    await deleteDoc(docRef);
}

// --- Firestore Rules ACL Management ---

const ACL_DOC_PATH = 'app_settings/firestore_acl';

export async function getAclEntries(): Promise<AclEntry[]> {
    const docRef = doc(db, ACL_DOC_PATH);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().entries) {
        return docSnap.data().entries as AclEntry[];
    }
    return [];
}

export async function setAclEntries(entries: AclEntry[]): Promise<void> {
    const docRef = doc(db, ACL_DOC_PATH);
    await setDoc(docRef, { entries });
}

export type { AclEntry };
    
