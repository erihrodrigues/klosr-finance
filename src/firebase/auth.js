import { initializeApp, getApps, deleteApp } from 'firebase/app'
import { 
  getAuth,
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword,
  updatePassword,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth"
import { auth } from "./config"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export async function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function logout() {
  return signOut(auth)
}

export async function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function alterarNome(nome) {
  return updateProfile(auth.currentUser, { displayName: nome })
}

export async function alterarSenha(senhaAtual, novaSenha) {
  const credential = EmailAuthProvider.credential(auth.currentUser.email, senhaAtual)
  await reauthenticateWithCredential(auth.currentUser, credential)
  return updatePassword(auth.currentUser, novaSenha)
}

export async function criarUsuarioAdmin(email, password) {
  const appExistente = getApps().find(a => a.name === 'secondary')
  if (appExistente) await deleteApp(appExistente)

  const appSecundario = initializeApp(firebaseConfig, 'secondary')
  const authSecundario = getAuth(appSecundario)

  try {
    const cred = await createUserWithEmailAndPassword(authSecundario, email, password)
    return cred.user
  } finally {
    await deleteApp(appSecundario)
  }
}