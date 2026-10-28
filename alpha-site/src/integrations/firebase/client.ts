import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDj6CNYCaNSWv_tQYVjCdqFElcuG9lA1LE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'alphaadmsc-fdc4e.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'alphaadmsc-fdc4e',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'alphaadmsc-fdc4e.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '30408137815',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:30408137815:web:fb091176b6d5f756088277',
};

// Singleton para o App do Firebase
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_description: string;
  topic: string;
  status: 'published' | 'draft';
  published_at: string;
  image_url?: string;
  created_at?: string;
};

/**
 * Busca todos os artigos publicados no Firestore ordenados por data
 * Sem necessidade de índice composto no Firebase (ordenação em memória)
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const snapshot = await getDocs(collection(db, 'blog_posts'));
    const posts: BlogPost[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'published') {
        posts.push({
          id: docSnap.id,
          title: data.title || '',
          slug: data.slug || docSnap.id,
          excerpt: data.excerpt || '',
          content: data.content || '',
          meta_description: data.meta_description || '',
          topic: data.topic || 'Gestão Condominial',
          status: data.status || 'published',
          published_at: data.published_at || new Date().toISOString(),
          image_url: data.image_url || '',
        });
      }
    });

    posts.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    return posts;
  } catch (err) {
    console.warn('[Firebase] Erro ao carregar posts do Firestore:', err);
    return [];
  }
}

/**
 * Busca um artigo pelo slug
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const q = query(
      collection(db, 'blog_posts'),
      where('slug', '==', slug),
      limit(1),
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    const data = docSnap.data();
    if (data.status !== 'published') return null;

    return {
      id: docSnap.id,
      title: data.title || '',
      slug: data.slug || docSnap.id,
      excerpt: data.excerpt || '',
      content: data.content || '',
      meta_description: data.meta_description || '',
      topic: data.topic || 'Gestão Condominial',
      status: data.status || 'published',
      published_at: data.published_at || new Date().toISOString(),
      image_url: data.image_url || '',
    };
  } catch (err) {
    console.warn('[Firebase] Erro ao buscar artigo por slug:', err);
    return null;
  }
}

/**
 * Insere um novo artigo autenticando o usuário administrativo da Alpha
 */
export async function insertBlogPost(post: Omit<BlogPost, 'id'>): Promise<BlogPost> {
  // Autenticação para satisfazer as regras do Firestore (allow write: if isAuthenticated())
  try {
    await signInWithEmailAndPassword(auth, 'admin@alpha.com.br', 'admin123');
  } catch (authErr: any) {
    console.warn('[Firebase Auth] Erro ao autenticar:', authErr.message);
  }

  const docRef = doc(collection(db, 'blog_posts'));
  const newPostData = {
    ...post,
    created_at: new Date().toISOString(),
    timestamp: serverTimestamp(),
  };

  await setDoc(docRef, newPostData);

  return {
    id: docRef.id,
    ...post,
  };
}
